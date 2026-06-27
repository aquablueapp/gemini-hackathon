import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../src/ast/parsers');
fs.mkdirSync(outDir, { recursive: true });

const wasmUrls = {
  python: 'https://unpkg.com/@repomix/tree-sitter-wasms/out/tree-sitter-python.wasm',
  typescript: 'https://unpkg.com/@repomix/tree-sitter-wasms/out/tree-sitter-typescript.wasm',
  rust: 'https://unpkg.com/@repomix/tree-sitter-wasms/out/tree-sitter-rust.wasm',
};

for (const [lang, url] of Object.entries(wasmUrls)) {
  const dest = path.join(outDir, `tree-sitter-${lang}.wasm`);
  console.log(`Downloading ${lang} WASM from ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${lang} WASM: ${response.statusText}`);
  }
  fs.writeFileSync(dest, Buffer.from(await response.arrayBuffer()));
  console.log(`Saved to ${dest}`);
}
