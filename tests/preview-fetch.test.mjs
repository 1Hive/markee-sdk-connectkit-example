import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
const { outputText } = ts.transpileModule(readFileSync('src/preview-fetch.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { previewFetch } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('visual preview forwards live reads but blocks all mutations including Request objects', async () => {
  let calls = 0;
  const read = async () => { calls++; return Response.json({ live: true }); };
  assert.equal((await previewFetch('https://www.markee.xyz/api/sdk/v1/snapshot', undefined, read)).status, 200);
  for (const operation of ['views', 'prepare', 'checkout/create']) {
    assert.equal((await previewFetch(`https://www.markee.xyz/api/sdk/v1/${operation}`, { method: 'POST' }, read)).status, 403);
  }
  for (const method of ['post', 'PUT', 'DELETE', 'PATCH']) {
    assert.equal((await previewFetch(new Request('https://www.markee.xyz/api/sdk/v1/prepare', { method }), undefined, read)).status, 403);
  }
  assert.equal(calls, 1);
});
