import { previewFetch } from './preview-fetch';
import { createMarkee } from '@markee_team/sdk';
import type { MarkeeTheme, ModerationSeverity, Placement } from '@markee_team/sdk';

let preview: ReturnType<typeof createMarkee> | undefined;
let key = '';
// The document is inert: this is a visual preview, not another payment surface.
window.addEventListener('message', event => {
  if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== 'markee-playground:preview-config') return;
  const config = event.data.config as { placement: Placement; theme: MarkeeTheme; severity: ModerationSeverity; apiUrl?: string } | undefined;
  if (!config?.placement || !['relaxed', 'standard', 'strict'].includes(config.severity)) return;
  const nextKey = JSON.stringify([config.placement, config.severity, config.apiUrl]);
  if (preview && key === nextKey) { preview.setTheme(config.theme); return; }
  preview?.close();
  key = nextKey;
  preview = createMarkee({
    apiUrl: config.apiUrl, theme: config.theme, moderation: { severity: config.severity },
    wallet: { getProvider: async () => null, connect: async () => { throw new Error('Open Markee to connect and pay.'); } },
    fetch: previewFetch,
  });
  preview.open({ placement: config.placement });
});
window.addEventListener('pagehide', () => preview?.close());
if (window.parent !== window) window.parent.postMessage({ type: 'markee-playground:preview-ready' }, window.location.origin);
