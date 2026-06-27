import { Hono } from 'hono';
import { Parser, Language } from 'web-tree-sitter';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import firestore from '../../db/firestore';
import { GitCacheManager } from '../../ast/git-cache';
import { parseCodeEntities, deduplicateNestedEntities } from '../../ast/analyzer';
import type { AppBindings } from '../../lib/types';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const astRoute = new Hono<AppBindings>();
let isParserInitialized = false;

// Define strict TypeScript types instead of using any
interface OutlineTarget {
  name: string;
  type: string;
  line_range: [number, number];
}

interface OutlineFileResult {
  file_path: string;
  language: 'python' | 'typescript' | 'rust';
  changed_entities: OutlineTarget[];
}

interface DetailsTargetInput {
  file_path: string;
  name: string;
}

interface DetailsResult {
  file_path: string;
  name: string;
  content: string;
}

async function getLanguageParser(lang: 'python' | 'typescript' | 'rust') {
  if (!isParserInitialized) {
    await Parser.init({
      locateFile: () => path.join(path.dirname(require.resolve('web-tree-sitter')), 'web-tree-sitter.wasm')
    });
    isParserInitialized = true;
  }
  const parser = new Parser();
  const wasmPath = path.resolve(__dirname, `../../ast/parsers/tree-sitter-${lang}.wasm`);
  const language = await Language.load(wasmPath);
  parser.setLanguage(language);
  return parser;
}

function getLang(filePath: string): 'python' | 'typescript' | 'rust' | null {
  if (filePath.endsWith('.py')) return 'python';
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
  if (filePath.endsWith('.rs')) return 'rust';
  return null;
}

// Loopback network or secure calls authentication middleware
astRoute.use('*', async (c, next) => {
  const host = c.req.header('host') || '';
  const authHeader = c.req.header('authorization');
  
  const isLocal = 
    host.includes('localhost') || 
    host.includes('127.0.0.1') || 
    host === '';

  if (isLocal || authHeader) {
    return await next();
  }
  
  const logger = c.var.logger;
  logger?.warn({ host, url: c.req.url }, 'Access blocked: only localhost or secure call with Authorization allowed');
  return c.json({ error: 'Unauthorized: Access restricted to loopback network or secured calls' }, 401);
});

astRoute.post('/outline', async (c) => {
  const logger = c.var.logger;
  const body = await c.req.json().catch(() => ({}));
  const { github_token, owner, repo, commit_sha } = body as {
    github_token?: string;
    owner?: string;
    repo?: string;
    commit_sha?: string;
  };

  if (!github_token || !owner || !repo || !commit_sha) {
    return c.json({ error: 'Missing parameters' }, 400);
  }

  logger?.info({ owner, repo, commit_sha }, 'Fetching outline from AST cache or repository');

  const cacheRef = firestore.collection('ast_diff_cache').doc(commit_sha);
  const cacheSnap = await cacheRef.get();

  if (cacheSnap.exists) {
    const data = cacheSnap.data();
    if (data && data.outline) {
      logger?.info({ commit_sha }, 'Outline hit cache in Firestore');
      return c.json({ outline: data.outline });
    }
  }

  const repoPath = GitCacheManager.ensureRepository(owner, repo, github_token);
  const fileDiffs = GitCacheManager.getDiffLines(repoPath, commit_sha);
  const outlineResult: OutlineFileResult[] = [];

  for (const [filePath, diffLines] of fileDiffs.entries()) {
    if (diffLines.length === 0) continue;
    const lang = getLang(filePath);
    if (!lang) continue;

    const sourceCode = GitCacheManager.getFileContent(repoPath, commit_sha, filePath);
    const parser = await getLanguageParser(lang);
    
    let tree: ReturnType<Parser['parse']> | undefined;
    try {
      tree = parser.parse(sourceCode);
      if (tree) {
        const allEntities = parseCodeEntities(tree.rootNode);
        const matched = deduplicateNestedEntities(allEntities, diffLines);
        
        outlineResult.push({
          file_path: filePath,
          language: lang,
          changed_entities: matched.map(m => ({
            name: m.name,
            type: m.type,
            line_range: [m.startLine, m.endLine]
          }))
        });
      }
    } finally {
      if (tree) tree.delete();
    }
  }

  await cacheRef.set({ outline: outlineResult, created_at: new Date() }, { merge: true });
  return c.json({ outline: outlineResult });
});

astRoute.post('/details', async (c) => {
  const logger = c.var.logger;
  const body = await c.req.json().catch(() => ({}));
  const { github_token, owner, repo, commit_sha, targets } = body as {
    github_token?: string;
    owner?: string;
    repo?: string;
    commit_sha?: string;
    targets?: DetailsTargetInput[];
  };

  if (!github_token || !owner || !repo || !commit_sha || !Array.isArray(targets)) {
    return c.json({ error: 'Missing or invalid parameters' }, 400);
  }

  logger?.info({ owner, repo, commit_sha, targetCount: targets.length }, 'Fetching code details for targets');

  const repoPath = GitCacheManager.ensureRepository(owner, repo, github_token);
  const detailsResult: DetailsResult[] = [];

  for (const target of targets) {
    if (!target.file_path || !target.name) continue;
    const sourceCode = GitCacheManager.getFileContent(repoPath, commit_sha, target.file_path);
    const lang = getLang(target.file_path);
    if (!lang) continue;

    const parser = await getLanguageParser(lang);
    let tree: ReturnType<Parser['parse']> | undefined;
    try {
      tree = parser.parse(sourceCode);
      if (tree) {
        const allEntities = parseCodeEntities(tree.rootNode);
        const match = allEntities.find(e => e.name === target.name);
        if (match) {
          detailsResult.push({
            file_path: target.file_path,
            name: target.name,
            content: match.content
          });
        }
      }
    } finally {
      if (tree) tree.delete();
    }
  }

  return c.json({ entities_details: detailsResult });
});

export default astRoute;
