export type Severity = 'relaxed' | 'standard' | 'strict';
export type Integration = 'react' | 'vanilla';

/** URL input configures a preview only; it never registers the sample as the board's site. */
export function readPlaygroundLink(search: string) {
  const params = new URLSearchParams(search);
  const board = params.get('board') ?? '';
  return {
    integration: (params.get('integration') === 'vanilla' ? 'vanilla' : 'react') as Integration,
    strategy: params.get('strategy') === 'ForRent' ? 'ForRent' : params.get('strategy') === 'ForSale' ? 'ForSale' : undefined,
    severity: (['relaxed', 'standard', 'strict'].includes(params.get('severity') ?? '') ? params.get('severity') : 'standard') as Severity,
    board: /^0x[\da-fA-F]{40}$/.test(board) ? board : '',
  };
}
