import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';

async function loadSource(file) {
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { readPlaygroundLink, readSharedPlaygroundLink, createShareUrl, validPlatformIdentity } = await loadSource('src/playground.ts');
const { configurationFile } = await loadSource('src/config-export.ts');
const address = '0x80783947c9561EFa9BA484D44BBd5AAa03028242';

test('React and vanilla links preserve the exact board address', () => {
  for (const integration of ['react', 'vanilla']) {
    assert.deepEqual(readPlaygroundLink(`?${new URLSearchParams({ integration, board: address })}`), { integration, board: address, strategy: undefined, severity: 'standard', rules: undefined });
  }
});
test('malformed boards and unknown integration formats fall back safely', () => {
  assert.deepEqual(readPlaygroundLink('?integration=evil&board=0x123'), { integration: 'react', board: '', strategy: undefined, severity: 'standard', rules: undefined });
  assert.deepEqual(readPlaygroundLink(''), { integration: 'react', board: '', strategy: undefined, severity: 'standard', rules: undefined });
});
test('share URL restores Community identity, moderation, and appearance without a board address', () => {
  const settings = {
    mode: 'community', board: address, saleBoard: address, rentBoard: address,
    platformId: 'gardens', chainId: 8453, communityId: '0x9a378ebed22610e9fbb941fe27323fe00cdeebc6',
    integration: 'vanilla', severity: 'strict', rules: { profanity: true, links: false, addresses: false, ens: true },
    theme: 'plum', colors: { primary: '#123456' }, customizeModal: true,
    modalTheme: 'dark', modalColors: { overlay: '#17203888' }, hoverEnabled: false,
  };
  const url = new URL(createShareUrl('https://example.com/?board=stale#sdk-configuration', settings));
  assert.equal(url.searchParams.has('board'), false);
  assert.equal(url.hash, '');
  assert.deepEqual(readSharedPlaygroundLink(url.search), {
    mode: 'community', board: '', strategy: undefined,
    saleBoard: '', rentBoard: '',
    platformId: 'gardens', chainId: 8453, communityId: settings.communityId,
    integration: 'vanilla', severity: 'strict', rules: settings.rules,
    theme: 'plum', colors: settings.colors, customizeModal: true,
    modalTheme: 'dark', modalColors: settings.modalColors, hoverEnabled: false,
  });
});
test('share URL keeps a board deep link and rejects malformed Community settings', () => {
  const base = {
    mode: 'board', board: address, saleBoard: '', rentBoard: '',
    platformId: 'gardens', chainId: 100, communityId: '', integration: 'react', severity: 'standard',
    theme: 'charcoal', colors: {}, customizeModal: false, modalTheme: 'charcoal', modalColors: {}, hoverEnabled: true,
  };
  assert.equal(readSharedPlaygroundLink(new URL(createShareUrl('https://example.com/', base)).search).board, address);
  const malformed = readSharedPlaygroundLink('?mode=community&platformId=gardens&chainId=-1&communityId=42&theme=other&colors=%7B%22text%22%3A%22url(javascript%3A1)%22%7D');
  assert.equal(malformed.communityId, '');
  assert.equal(malformed.chainId, 100);
  assert.equal(malformed.theme, 'charcoal');
  assert.deepEqual(malformed.colors, {});
});
test('multi-board identity validation matches Gardens addresses and Revnet project IDs', () => {
  assert.equal(validPlatformIdentity('gardens', 100, address), true);
  assert.equal(validPlatformIdentity('gardens', 100, `0x${'0'.repeat(40)}`), false);
  assert.equal(validPlatformIdentity('gardens', 100, '42'), false);
  assert.equal(validPlatformIdentity('revnet', 8453, '42'), true);
  assert.equal(validPlatformIdentity('revnet', 8453, '0'), false);
  assert.equal(validPlatformIdentity('revnet', 8453, '0x42'), false);
  assert.equal(validPlatformIdentity('revnet', 8453, (2n ** 256n).toString()), false);
  assert.equal(validPlatformIdentity('giveth', 8453, '42'), true);
  assert.equal(validPlatformIdentity('giveth', 100, '42'), false);
  assert.equal(validPlatformIdentity('giveth', 8453, '0'), false);
});
test('Giveth concept share links restore the Project ID on Base without a board', () => {
  const url = createShareUrl('https://example.com/', {
    mode: 'community', board: '', saleBoard: '', rentBoard: '', platformId: 'giveth', chainId: 8453,
    communityId: '42', integration: 'react', severity: 'standard', theme: 'charcoal', colors: {},
    customizeModal: false, modalTheme: 'charcoal', modalColors: {}, hoverEnabled: true,
  });
  const restored = readSharedPlaygroundLink(new URL(url).search);
  assert.equal(restored.platformId, 'giveth');
  assert.equal(restored.chainId, 8453);
  assert.equal(restored.communityId, '42');
  assert.equal(restored.board, '');
});
test('both generated integrations compile against the installed published SDK', () => {
  const dir = mkdtempSync(resolve('.generated-check-'));
  try {
    const files = ['react', 'vanilla'].flatMap(integration => [false, true].map(separateModal => {
      const source = configurationFile({ integration, separateModal, severity: 'strict', placement: { kind: 'board', chainId: 8453, address }, signTheme: { mode: 'dark', colors: { warning: '#ff9900' } }, modalTheme: { mode: 'light', radius: 12 } });
      assert.ok(source.includes(address));
      assert.ok(source.includes('\"severity\": \"strict\"'));
      assert.ok(source.includes('\"version\": 1'));
      assert.ok(source.includes('#ff9900'));
      assert.ok(!source.includes('strategy:'));
      const file = resolve(dir, integration === 'react' ? `SiteMarkee-${separateModal}.tsx` : `markee-${separateModal}.js`);
      writeFileSync(file, source);
      return file;
    }));
    const program = ts.createProgram(files, { noEmit: true, allowJs: true, checkJs: true, strict: true, skipLibCheck: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, allowSyntheticDefaultImports: true });
    const errors = ts.getPreEmitDiagnostics(program);
    assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, { getCanonicalFileName: p => p, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n' }));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('multi-board exports compile and take each community identity from the host page', () => {
  const dir = mkdtempSync(resolve('.generated-check-'));
  try {
    const files = ['react', 'vanilla'].flatMap(integration => ['gardens', 'revnet'].map(platformId => {
      const source = configurationFile({ integration, multiBoard: { platformId, chainId: platformId === 'gardens' ? 100 : 8453, communityId: platformId === 'gardens' ? address : '42' }, signTheme: { mode: 'dark' }, modalTheme: { mode: 'light' } });
      assert.ok(source.includes(`platformId: "${platformId}"`));
      assert.ok(source.includes('communityId: page.communityId') || source.includes('chainId, communityId }'));
      assert.ok(!source.includes('"communityId": "42"'), 'export must not pin a preview project to every page');
      assert.ok(!source.includes(`"communityId": "${address}"`), 'export must not pin a preview community to every page');
      const file = resolve(dir, integration === 'react' ? `SiteMarkee-${platformId}.tsx` : `markee-${platformId}.js`);
      writeFileSync(file, source);
      return file;
    }));
    const program = ts.createProgram(files, { noEmit: true, allowJs: true, checkJs: true, strict: true, skipLibCheck: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, allowSyntheticDefaultImports: true });
    const errors = ts.getPreEmitDiagnostics(program);
    assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, { getCanonicalFileName: p => p, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n' }));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('live Gardens exports use the current API placement and each page identity', () => {
  const dir = mkdtempSync(resolve('.generated-check-'));
  try {
    const files = ['react', 'vanilla'].map(integration => {
      const source = configurationFile({ integration, placement: { kind: 'gardens-community', chainId: 8453, community: '0x9a378ebed22610e9fbb941fe27323fe00cdeebc6' }, signTheme: { mode: 'dark' }, modalTheme: { mode: 'dark' } });
      assert.ok(source.includes("kind: 'gardens-community'"));
      assert.ok(source.includes('page.communityId') || source.includes('community: communityId'));
      assert.ok(!source.includes('0x9a378ebed22610e9fbb941fe27323fe00cdeebc6'), 'export must not pin the preview community');
      const file = resolve(dir, integration === 'react' ? 'SiteMarkee.tsx' : 'markee.js');
      writeFileSync(file, source);
      return file;
    });
    const program = ts.createProgram(files, { noEmit: true, allowJs: true, checkJs: true, strict: true, skipLibCheck: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, allowSyntheticDefaultImports: true });
    const errors = ts.getPreEmitDiagnostics(program);
    assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, { getCanonicalFileName: p => p, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n' }));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('custom rules in a board link become the versioned SDK policy', () => {
  const { rules } = readPlaygroundLink(`?board=${address}&rules=profanity,ens`);
  assert.deepEqual(rules, { profanity: true, links: false, addresses: false, ens: true });
  assert.equal(readPlaygroundLink('?rules=unknown').rules, undefined);
  const source = configurationFile({ moderation: { version: 1, severity: 'standard', rules }, placement: { kind: 'board', chainId: 8453, address }, signTheme: { mode: 'dark' }, modalTheme: { mode: 'dark' } });
  assert.ok(source.includes('\"ens\": true'));
  assert.ok(source.includes('\"links\": false'));
});

test('strategy and severity query parameters configure the preview without adding SDK strategy config', () => {
  for (const strategy of ['ForSale', 'ForRent']) {
    const link = readPlaygroundLink(`?integration=vanilla&board=${address}&strategy=${strategy}&severity=strict`);
    assert.equal(link.strategy, strategy);
    assert.equal(link.severity, 'strict');
  }
  assert.equal(readPlaygroundLink('?strategy=unknown&severity=disabled').strategy, undefined);
  assert.equal(readPlaygroundLink('?severity=disabled').severity, 'standard');
});

test('shared exports define colors once and independent modal exports preserve separate colors', () => {
  for (const separateModal of [false, true]) {
    const source = configurationFile({ integration: 'vanilla', separateModal, placement: { kind: 'board', chainId: 8453, address }, signTheme: { mode: 'dark', colors: { primary: '#123456' }, sign: { hoverLogo: false } }, modalTheme: { mode: 'light', colors: { primary: '#abcdef' } } });
    // Evaluate only generated configuration declarations, without mounting SDK UI.
    const declarations = source.slice(source.indexOf('export const sharedTheme'), source.indexOf('const container')).replaceAll('export const', 'const');
    const config = Function(declarations + '; return { sharedTheme, signConfig, modalConfig };')();
    assert.equal(config.signConfig.theme.colors, config.sharedTheme.colors);
    assert.equal(config.signConfig.theme.sign.hoverLogo, false);
    assert.equal(config.modalConfig.theme.colors.primary, separateModal ? '#abcdef' : '#123456');
    assert.equal(config.modalConfig.theme === config.sharedTheme, !separateModal);
    assert.equal(source.split('#123456').length - 1, 1);
  }
});
