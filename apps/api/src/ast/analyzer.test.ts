import { describe, expect, it } from 'vitest';
import { Parser, Language } from 'web-tree-sitter';
import path from 'node:path';
import { parseCodeEntities, deduplicateNestedEntities } from './analyzer';

describe('AST Analyzer', () => {
  it('should extract correct entities and handle nesting', async () => {
    await Parser.init({
      locateFile: () => path.join(path.dirname(require.resolve('web-tree-sitter')), 'web-tree-sitter.wasm')
    });
    const parser = new Parser();
    const wasmPath = path.resolve(__dirname, './parsers/tree-sitter-typescript.wasm');
    const lang = await Language.load(wasmPath);
    parser.setLanguage(lang);

    const source = `
class UserService {
  getUser(id: string) {
    return "user";
  }
}
    `.trim();

    const tree = parser.parse(source)!;
    const entities = parseCodeEntities(tree.rootNode);

    expect(entities.length).toBe(2);
    expect(entities[0].name).toBe('UserService');
    expect(entities[1].name).toBe('getUser');

    // 假设修改第 3 行
    const matched = deduplicateNestedEntities(entities, [3]);
    expect(matched.length).toBe(2);
    expect(matched[0].content).toContain('Nested methods audited separately');
    expect(matched[1].content).toContain('return "user"');

    tree.delete();
  });
});
