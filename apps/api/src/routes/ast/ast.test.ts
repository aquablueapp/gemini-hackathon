import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import router from './ast.routes';
import { GitCacheManager } from '../../ast/git-cache';

// Mock GitCacheManager to avoid touching local filesystem or remote network in unit tests
vi.mock('../../ast/git-cache', () => {
  return {
    GitCacheManager: {
      ensureRepository: vi.fn().mockReturnValue('/mock/repo/path'),
      getDiffLines: vi.fn().mockImplementation(() => {
        const diffMap = new Map<string, number[]>();
        diffMap.set('test.py', [2]);
        return diffMap;
      }),
      getFileContent: vi.fn().mockReturnValue(`
def hello():
  print("Hello, World!")
`.trim()),
    },
  };
});

describe('AST API Router', () => {
  it('POST /ast/outline - should block non-loopback access without Authorization', async () => {
    const app = new Hono().route('/ast', router);
    const res = await app.request('/ast/outline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'untrusted-host.com',
      },
      body: JSON.stringify({
        github_token: 'token',
        owner: 'owner',
        repo: 'repo',
        commit_sha: 'sha',
      }),
    });

    expect(res.status).toBe(401);
    const data = await res.json() as { error: string };
    expect(data.error).toContain('Unauthorized');
  });

  it('POST /ast/outline - should parse git repo entities and return code outline via loopback', async () => {
    const app = new Hono().route('/ast', router);
    const res = await app.request('/ast/outline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'localhost',
      },
      body: JSON.stringify({
        github_token: 'mock_token',
        owner: 'aquablueapp',
        repo: 'gemini-hackathon',
        commit_sha: 'mock_commit_sha_outline_test',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json() as { outline: any[] };
    expect(data).toHaveProperty('outline');
    expect(Array.isArray(data.outline)).toBe(true);
    expect(data.outline.length).toBe(1);
    expect(data.outline[0].file_path).toBe('test.py');
    expect(data.outline[0].language).toBe('python');
    expect(data.outline[0].changed_entities.length).toBe(1);
    expect(data.outline[0].changed_entities[0].name).toBe('hello');
  });

  it('POST /ast/details - should fetch details of selected entity', async () => {
    const app = new Hono().route('/ast', router);
    const res = await app.request('/ast/details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'localhost',
      },
      body: JSON.stringify({
        github_token: 'mock_token',
        owner: 'aquablueapp',
        repo: 'gemini-hackathon',
        commit_sha: 'mock_commit_sha_details_test',
        targets: [
          {
            file_path: 'test.py',
            name: 'hello',
          },
        ],
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json() as { entities_details: any[] };
    expect(data).toHaveProperty('entities_details');
    expect(data.entities_details.length).toBe(1);
    expect(data.entities_details[0].file_path).toBe('test.py');
    expect(data.entities_details[0].name).toBe('hello');
    expect(data.entities_details[0].content).toContain('print("Hello, World!")');
  });
});
