export type Severity = 'relaxed' | 'standard' | 'strict';
export type Integration = 'react' | 'vanilla';
export type PlatformId = 'gardens' | 'revnet';
export type PlaygroundMode = 'sale' | 'rent' | 'community' | 'board';
export type ThemeName = 'light' | 'dark' | 'system' | 'charcoal' | 'plum';
export const moderationRuleNames = ['profanity', 'links', 'addresses', 'ens'] as const;
const themeNames: ThemeName[] = ['light', 'dark', 'system', 'charcoal', 'plum'];
const colorNames = ['background', 'surface', 'text', 'muted', 'border', 'inputBackground', 'inputText', 'primary', 'primaryText', 'accent', 'accentText', 'accentSurface', 'accentSurfaceText', 'accentBorder', 'selected', 'selectedText', 'warning', 'warningText', 'warningBorder', 'info', 'infoText', 'error', 'errorText', 'success', 'successText', 'link', 'focusRing', 'overlay'];
const addressPattern = /^0x[\da-fA-F]{40}$/;

function readColors(value: string | null): Record<string, string> {
  if (!value || value.length > 3000) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([key, color]) => colorNames.includes(key) && typeof color === 'string' && /^#[\da-fA-F]{6}(?:[\da-fA-F]{2})?$/.test(color)));
  } catch { return {}; }
}

function readTheme(value: string | null): ThemeName {
  return themeNames.includes(value as ThemeName) ? value as ThemeName : 'charcoal';
}

/** The playground validates identity syntax; Markee's API owns registration and authorization. */
export function validPlatformIdentity(platformId: PlatformId, chainId: number, communityId: string): boolean {
  if (!Number.isSafeInteger(chainId) || chainId <= 0) return false;
  if (platformId === 'gardens') return /^0x[\da-fA-F]{40}$/.test(communityId) && !/^0x0{40}$/i.test(communityId);
  if (platformId !== 'revnet' || !/^[1-9][0-9]*$/.test(communityId) || communityId.length > 78) return false;
  return BigInt(communityId) < 2n ** 256n;
}

/** URL input configures a preview only; it never registers the sample as the board's site. */
export function readPlaygroundLink(search: string) {
  const params = new URLSearchParams(search);
  const board = params.get('board') ?? '';
  const requestedRules = params.get('rules');
  const ruleNames = requestedRules?.split(',').filter(Boolean);
  const rules = requestedRules !== null && ruleNames?.every(name => moderationRuleNames.includes(name as typeof moderationRuleNames[number]))
    ? Object.fromEntries(moderationRuleNames.map(name => [name, ruleNames.includes(name)])) as Record<typeof moderationRuleNames[number], boolean>
    : undefined;
  return {
    integration: (params.get('integration') === 'vanilla' ? 'vanilla' : 'react') as Integration,
    strategy: params.get('strategy') === 'ForRent' ? 'ForRent' : params.get('strategy') === 'ForSale' ? 'ForSale' : undefined,
    severity: (['relaxed', 'standard', 'strict'].includes(params.get('severity') ?? '') ? params.get('severity') : 'standard') as Severity,
    rules,
    board: addressPattern.test(board) ? board : '',
  };
}

/** Share links configure this playground only; they never grant board authorization. */
export function readSharedPlaygroundLink(search: string) {
  const legacy = readPlaygroundLink(search);
  const params = new URLSearchParams(search);
  const requestedMode = params.get('mode');
  const mode: PlaygroundMode = requestedMode === 'sale' || requestedMode === 'rent' || requestedMode === 'community' || requestedMode === 'board'
    ? requestedMode : legacy.board ? 'board' : 'sale';
  const platformId: PlatformId = params.get('platformId') === 'revnet' ? 'revnet' : 'gardens';
  const requestedChain = Number(params.get('chainId'));
  const chainId = Number.isSafeInteger(requestedChain) && requestedChain > 0 ? requestedChain : platformId === 'revnet' ? 8453 : 100;
  const communityId = params.get('communityId') ?? '';
  const customModal = params.get('customizeModal') === '1';
  return {
    ...legacy, mode,
    saleBoard: addressPattern.test(params.get('saleBoard') ?? '') ? params.get('saleBoard')! : '',
    rentBoard: addressPattern.test(params.get('rentBoard') ?? '') ? params.get('rentBoard')! : '',
    platformId,
    chainId: platformId === 'revnet' ? 8453 : chainId,
    communityId: validPlatformIdentity(platformId, platformId === 'revnet' ? 8453 : chainId, communityId) ? communityId : '',
    theme: readTheme(params.get('theme')),
    colors: readColors(params.get('colors')),
    customizeModal: customModal,
    modalTheme: readTheme(params.get('modalTheme')),
    modalColors: readColors(params.get('modalColors')),
    hoverEnabled: params.get('hover') !== '0',
  };
}

export type ShareSettings = {
  mode: PlaygroundMode; board: string; saleBoard: string; rentBoard: string;
  platformId: PlatformId; chainId: number; communityId: string;
  integration: Integration; severity: Severity; rules?: Record<typeof moderationRuleNames[number], boolean>;
  theme: ThemeName; colors: Record<string, string>; customizeModal: boolean;
  modalTheme: ThemeName; modalColors: Record<string, string>; hoverEnabled: boolean;
};

export function createShareUrl(pageUrl: string, settings: ShareSettings): string {
  const url = new URL(pageUrl);
  const params = new URLSearchParams();
  params.set('mode', settings.mode);
  if (settings.mode === 'board') params.set('board', settings.board);
  if (settings.mode === 'sale') params.set('saleBoard', settings.saleBoard);
  if (settings.mode === 'rent') params.set('rentBoard', settings.rentBoard);
  if (settings.mode === 'community') {
    params.set('platformId', settings.platformId);
    params.set('chainId', String(settings.chainId));
    params.set('communityId', settings.communityId);
  }
  params.set('integration', settings.integration);
  params.set('severity', settings.severity);
  if (settings.rules) params.set('rules', moderationRuleNames.filter(name => settings.rules?.[name]).join(','));
  params.set('theme', settings.theme);
  if (Object.keys(settings.colors).length) params.set('colors', JSON.stringify(settings.colors));
  if (settings.customizeModal) {
    params.set('customizeModal', '1');
    params.set('modalTheme', settings.modalTheme);
    if (Object.keys(settings.modalColors).length) params.set('modalColors', JSON.stringify(settings.modalColors));
  }
  if (!settings.hoverEnabled) params.set('hover', '0');
  url.search = params.toString();
  url.hash = '';
  return url.toString();
}
