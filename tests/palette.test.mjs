import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
const { outputText } = ts.transpileModule(readFileSync('src/palette.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { contrastRatio, randomPalette, textPairs, minimumTextContrast } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('contrast calculation matches black/white and equal-color reference values', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(contrastRatio('#abcdef', '#abcdef'), 1);
  assert.equal(contrastRatio('#ffffff', '#000000'), 21);
});
test('light and dark palettes meet text and focus contrast across the hue wheel', () => {
  for (const dark of [false, true]) for (let hue = 0; hue < 360; hue += 3) {
    let call = 0;
    const colors = randomPalette(dark, () => call++ === 0 ? hue / 360 : (hue % 101) / 100);
    for (const [fg, bg] of textPairs) assert.ok(contrastRatio(colors[fg], colors[bg]) >= 4.5, `${dark} ${hue} ${fg}/${bg}`);
    for (const bg of ['background', 'surface', 'inputBackground']) {
      assert.ok(contrastRatio(colors.focusRing, colors[bg]) >= 3);
      assert.ok(contrastRatio(colors.border, colors[bg]) >= 3);
    }
    assert.ok(minimumTextContrast(colors) >= 4.5);
    for (const [key, value] of Object.entries(colors)) assert.match(value, key === 'overlay' ? /^#[0-9a-f]{8}$/ : /^#[0-9a-f]{6}$/);
  }
});
test('randomized palettes vary while keeping semantic warning/error/success families stable', () => {
  const first = randomPalette(false, () => 0.1), second = randomPalette(false, () => 0.8);
  assert.notEqual(first.primary, second.primary);
  assert.notEqual(first.accent, second.accent);
  assert.equal(first.warning, second.warning);
  assert.equal(first.error, second.error);
  assert.equal(first.success, second.success);
});
