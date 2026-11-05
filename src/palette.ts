import type { MarkeeThemeColors } from '@markee_team/sdk';

export function contrastRatio(first: string, second: string): number {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map(start => {
      const value = parseInt(hex.slice(start, start + 2), 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function hsl(hue: number, saturation: number, lightness: number): string {
  const h = ((hue % 360) + 360) % 360 / 30;
  const a = saturation / 100 * Math.min(lightness / 100, 1 - lightness / 100);
  const channel = (offset: number) => {
    const k = (offset + h) % 12;
    return Math.round(255 * (lightness / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/** Adjust the foreground's lightness after RGB rounding, not just its HSL input. */
function readable(hue: number, saturation: number, backgrounds: string[], dark: boolean, target = 4.5): string {
  for (let i = 0; i <= 100; i++) {
    const color = hsl(hue, saturation, dark ? i : 100 - i);
    if (backgrounds.every(background => contrastRatio(color, background) >= target)) return color;
  }
  throw new Error('No contrasting foreground for this palette');
}

export const textPairs = [
  ['text', 'background'], ['text', 'surface'], ['muted', 'background'], ['muted', 'surface'],
  ['muted', 'inputBackground'], ['text', 'accentSurface'], ['muted', 'accentSurface'], ['link', 'accentSurface'],
  ['text', 'selected'], ['muted', 'selected'], ['link', 'selected'],
  ['accentSurfaceText', 'background'], ['accentSurfaceText', 'surface'],
  ['inputText', 'inputBackground'], ['primaryText', 'primary'], ['accentText', 'accent'],
  ['accentSurfaceText', 'accentSurface'], ['selectedText', 'selected'],
  ['warningText', 'warning'], ['errorText', 'error'], ['successText', 'success'], ['infoText', 'info'],
  ['link', 'background'], ['link', 'surface'],
] as const;

export function minimumTextContrast(colors: Required<MarkeeThemeColors>): number {
  return Math.min(...textPairs.map(([foreground, background]) => contrastRatio(colors[foreground], colors[background])));
}

/** One analogous brand palette, neutral surfaces, and stable semantic hues. */
export function randomPalette(dark: boolean, random: () => number = Math.random): Required<MarkeeThemeColors> {
  const hue = random() * 360;
  const accentHue = hue + 20 + random() * 25;
  const saturation = 45 + random() * 30;
  const background = hsl(hue, 16, dark ? 8 : 97);
  const surface = hsl(hue, 14, dark ? 13 : 100);
  const inputBackground = hsl(hue, 18, dark ? 9 : 99);
  const surfaces = [background, surface, inputBackground];
  const primary = hsl(hue, saturation, dark ? 75 : 35);
  const accent = hsl(accentHue, saturation, dark ? 70 : 83);
  const accentSurface = hsl(accentHue, 28, dark ? 19 : 93);
  const selected = hsl(hue, 28, dark ? 23 : 91);
  const textSurfaces = [...surfaces, accentSurface, selected];
  const semantic = (semanticHue: number) => {
    const fill = hsl(semanticHue, dark ? 38 : 75, dark ? 16 : 95);
    return { fill, text: readable(semanticHue, 60, [fill], dark), border: readable(semanticHue, 55, [fill, ...surfaces], dark, 3.1) };
  };
  const warning = semantic(40), error = semantic(2), success = semantic(142), info = semantic(215);
  return {
    background, surface, inputBackground,
    text: readable(hue, 20, textSurfaces, dark, 7),
    muted: readable(hue, 12, textSurfaces, dark),
    inputText: readable(hue, 20, [inputBackground], dark, 7),
    border: readable(hue, 15, surfaces, dark, 3.1),
    primary, primaryText: readable(hue, 15, [primary], !dark),
    accent, accentText: readable(accentHue, 20, [accent], false),
    accentSurface, accentSurfaceText: readable(accentHue, 40, [...surfaces, accentSurface], dark),
    accentBorder: readable(accentHue, 40, [...surfaces, accentSurface], dark, 3.1),
    selected, selectedText: readable(hue, 20, [selected], dark),
    warning: warning.fill, warningText: warning.text, warningBorder: warning.border,
    error: error.fill, errorText: error.text, success: success.fill, successText: success.text,
    info: info.fill, infoText: info.text,
    link: readable(hue, saturation, textSurfaces, dark),
    focusRing: readable(accentHue, saturation, surfaces, dark, 3.1),
    overlay: hsl(hue, 25, 5) + (dark ? 'b8' : '88'),
  };
}
