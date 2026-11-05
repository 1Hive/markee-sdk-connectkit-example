import { useSyncExternalStore } from 'react';
import type { MarkeeTheme, MarkeeThemeColors } from '@markee_team/sdk';

// Defaults match the SDK palettes; export only explicit user overrides.
const light: Required<MarkeeThemeColors> = {
  background: '#fbfcff', surface: '#ffffff', text: '#181b21', muted: '#687080', border: '#dce1ea',
  inputBackground: '#ffffff', inputText: '#202737',
  primary: '#282e3e', primaryText: '#ffffff', accent: '#c9f1a7', accentText: '#2b3c20',
  accentSurface: '#f1f7ea', accentSurfaceText: '#4e6535', accentBorder: '#cde3b5',
  selected: '#e9edf7', selectedText: '#242c47',
  warning: '#fff8e6', warningText: '#754b08', warningBorder: '#d49a26',
  info: '#edf1f9', infoText: '#52617b', error: '#fff0f0', errorText: '#9c3540',
  success: '#edf7e6', successText: '#40602f', link: '#4762a5', focusRing: '#5871c8', overlay: '#17203888',
};

const dark: Required<MarkeeThemeColors> = {
  background: '#151923', surface: '#202633', text: '#f0f3f8', muted: '#a6b1c3', border: '#434f63',
  inputBackground: '#10151e', inputText: '#f0f3f8',
  primary: '#dde6fa', primaryText: '#182238', accent: '#c9f1a7', accentText: '#24361a',
  accentSurface: '#243221', accentSurfaceText: '#c4e5ad', accentBorder: '#526b40',
  selected: '#313d53', selectedText: '#edf3ff',
  warning: '#352a17', warningText: '#f5d48b', warningBorder: '#bd8b32',
  info: '#243149', infoText: '#bdcff1', error: '#44262e', errorText: '#ffbdc5',
  success: '#233b2b', successText: '#b5e4bf', link: '#adc5ff', focusRing: '#a1b4ff', overlay: '#030711b8',
};


const subscribe = (notify: () => void) => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
const isDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
export function ThemeColors({ label, theme, overrides, onChange }: {
  label: string;
  theme: MarkeeTheme;
  overrides: Partial<MarkeeThemeColors>;
  onChange(colors: Partial<MarkeeThemeColors>): void;
}) {
  const systemDark = useSyncExternalStore(subscribe, isDark, () => false);
  const defaults = theme.mode === 'dark' || theme.mode === 'system' && systemDark ? dark : light;
  const colors = { ...defaults, ...theme.colors, ...overrides };
  const title = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
  return <details className="color-editor"><summary>Customize {label.toLowerCase()} colors</summary>
    <div className="color-grid">{(Object.keys(defaults) as (keyof MarkeeThemeColors)[]).map(key => <label className="color-field" key={key}>
      <span>{title(key)}</span><div><input type="color" aria-label={`${label} ${title(key).toLowerCase()} color`} value={colors[key].slice(0, 7)} onInput={event => onChange({ ...overrides, [key]: event.currentTarget.value + colors[key].slice(7) })}/><code>{colors[key]}</code></div>
    </label>)}</div>
    <label className="opacity-field">Overlay opacity <input type="range" min="0" max="255" aria-label={`${label} overlay opacity`} value={parseInt(colors.overlay.slice(7) || 'ff', 16)} onChange={event => onChange({ ...overrides, overlay: colors.overlay.slice(0, 7) + Number(event.target.value).toString(16).padStart(2, '0') })}/></label>
    <button className="reset-colors" disabled={!Object.keys(overrides).length} onClick={() => onChange({})}>Reset to theme colors</button>
  </details>;
}
