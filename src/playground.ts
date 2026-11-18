export type Severity = 'relaxed' | 'standard' | 'strict';
export type Integration = 'react' | 'vanilla';
export type PlatformId = 'gardens' | 'revnet';
export const moderationRuleNames = ['profanity', 'links', 'addresses', 'ens'] as const;

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
    board: /^0x[\da-fA-F]{40}$/.test(board) ? board : '',
  };
}
