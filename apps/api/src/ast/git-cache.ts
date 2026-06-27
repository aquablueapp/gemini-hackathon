import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CACHE_DIR = '/tmp/repos';

export class GitCacheManager {
  static ensureRepository(owner: string, repo: string, token: string): string {
    const repoPath = path.join(CACHE_DIR, owner, `${repo}.git`);
    
    if (!fs.existsSync(repoPath)) {
      let cloneUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
      if (token === 'local') {
        let current = __dirname;
        while (current !== '/' && !fs.existsSync(path.join(current, '.git'))) {
          current = path.dirname(current);
        }
        cloneUrl = current;
      }
      fs.mkdirSync(path.dirname(repoPath), { recursive: true });
      try {
        execSync(`git clone --bare ${cloneUrl} ${repoPath}`, { stdio: 'ignore' });
      } catch (err) {
        // Fallback: If clone fails with token (e.g. invalid/expired token), retry without token for public repos
        if (token !== 'local' && token) {
          const publicUrl = `https://github.com/${owner}/${repo}.git`;
          try {
            execSync(`git clone --bare ${publicUrl} ${repoPath}`, { stdio: 'ignore' });
          } catch (retryErr) {
            // Rethrow the original error but wrap it to avoid Hono's status code range bug
            const wrappedErr = new Error(`Git clone failed for both authenticated and public URLs: ${err instanceof Error ? err.message : String(err)}`);
            (wrappedErr as any).status = 500;
            throw wrappedErr;
          }
        } else {
          // Wrap error to ensure status is a valid HTTP code (e.g. 500) and not 128
          const wrappedErr = new Error(`Git clone failed: ${err instanceof Error ? err.message : String(err)}`);
          (wrappedErr as any).status = 500;
          throw wrappedErr;
        }
      }
    } else {
      if (token !== 'local') {
        try {
          execSync(`git --git-dir=${repoPath} fetch origin`, { stdio: 'ignore' });
        } catch (fetchErr) {
          // If fetch fails, maybe credentials expired, retry fetch without credentials if public
          if (token) {
            try {
              execSync(`git --git-dir=${repoPath} remote set-url origin https://github.com/${owner}/${repo}.git`, { stdio: 'ignore' });
              execSync(`git --git-dir=${repoPath} fetch origin`, { stdio: 'ignore' });
            } catch (retryFetchErr) {
              // Suppress or handle appropriately
            }
          }
        }
      }
    }
    return repoPath;
  }

  static getDiffLines(repoPath: string, commitSha: string): Map<string, number[]> {
    try {
      const stdout = execSync(
        `git --git-dir=${repoPath} show ${commitSha} --unified=0`, 
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      
      const fileModifications = new Map<string, number[]>();
      let currentFile = '';

      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.startsWith('+++ b/')) {
          currentFile = line.substring(6);
          fileModifications.set(currentFile, []);
        } else if (line.startsWith('@@ ') && currentFile) {
          const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
          if (match) {
            const start = parseInt(match[1], 10);
            const count = match[2] ? parseInt(match[2], 10) : 1;
            for (let i = 0; i < count; i++) {
              fileModifications.get(currentFile)!.push(start + i);
            }
          }
        }
      }
      return fileModifications;
    } catch (err) {
      const wrappedErr = new Error(`Git show failed for commit ${commitSha}: ${err instanceof Error ? err.message : String(err)}`);
      (wrappedErr as any).status = 404;
      throw wrappedErr;
    }
  }

  static getFileContent(repoPath: string, commitSha: string, filePath: string): string {
    try {
      return execSync(
        `git --git-dir=${repoPath} show ${commitSha}:${filePath}`, 
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
    } catch (err) {
      const wrappedErr = new Error(`Git show failed for file ${filePath} at commit ${commitSha}: ${err instanceof Error ? err.message : String(err)}`);
      (wrappedErr as any).status = 404;
      throw wrappedErr;
    }
  }
}
