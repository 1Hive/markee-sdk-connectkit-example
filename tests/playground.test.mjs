import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';

async function loadSource(file) {
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { readPlaygroundLink } = await loadSource('src/playground.ts');
const { configurationFile } = await loadSource('src/config-export.ts');
const address = '0x80783947c9561EFa9BA484D44BBd5AAa03028242';

test('React and vanilla links preserve the exact board address', () => {
  for (const integration of ['react', 'vanilla']) {
    assert.deepEqual(readPlaygroundLink(`?${new URLSearchParams({ integration, board: address })}`), { integration, board: address });
  }
});
test('malformed boards and unknown integration formats fall back safely', () => {
  assert.deepEqual(readPlaygroundLink('?integration=evil&board=0x123'), { integration: 'react', board: '' });
  assert.deepEqual(readPlaygroundLink(''), { integration: 'react', board: '' });
});
test('both generated integrations compile against the installed published SDK', () => {
  const dir = mkdtempSync(resolve('.generated-check-'));
  try {
    const files = ['react', 'vanilla'].map(integration => {
      const source = configurationFile({ integration, placement: { kind: 'board', chainId: 8453, address }, signTheme: { mode: 'dark', colors: { warning: '#ff9900' } }, modalTheme: { mode: 'light', radius: 12 } });
      assert.ok(source.includes(address));
      assert.ok(source.includes('#ff9900'));
      assert.ok(!source.includes('strategy:'));
      const file = resolve(dir, integration === 'react' ? 'SiteMarkee.tsx' : 'markee.js');
      writeFileSync(file, source);
      return file;
    });
    const program = ts.createProgram(files, { noEmit: true, allowJs: true, checkJs: true, strict: true, skipLibCheck: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, allowSyntheticDefaultImports: true });
    const errors = ts.getPreEmitDiagnostics(program);
    assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, { getCanonicalFileName: p => p, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n' }));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
