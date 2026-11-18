import { previewFetch } from './preview-fetch';
import { createMarkee } from '@markee_team/sdk';
import type { MarkeeTheme, ModerationOptions, PlacementInput } from '@markee_team/sdk';

let preview: ReturnType<typeof createMarkee> | undefined;
let key = '';
// The document is inert: this is a visual preview, not another payment surface.
window.addEventListener('message', event => {
  if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== 'markee-playground:preview-config') return;
  const config = event.data.config as (PlacementInput & { theme: MarkeeTheme; moderation: ModerationOptions; apiUrl?: string }) | undefined;
  if (!config || !((!!config.placement) !== (!!config.multiBoard)) || config.moderation?.version !== 1 || !['relaxed', 'standard', 'strict'].includes(config.moderation.severity ?? '')) return;
  const input = config.placement ? { placement: config.placement } : { multiBoard: config.multiBoard! };
  const nextKey = JSON.stringify([input, config.moderation, config.apiUrl]);
  if (preview && key === nextKey) { preview.setTheme(config.theme); return; }
  preview?.close();
  key = nextKey;
  preview = createMarkee({
    apiUrl: config.apiUrl, theme: config.theme, moderation: config.moderation,
    wallet: { getProvider: async () => null, connect: async () => { throw new Error('Open Markee to connect and pay.'); } },
    fetch: previewFetch,
  });
  preview.open(input);
});
window.addEventListener('pagehide', () => preview?.close());
if (window.parent !== window) window.parent.postMessage({ type: 'markee-playground:preview-ready' }, window.location.origin);
