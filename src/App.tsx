import { useMemo, useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';
import { MarkeeModal, MarkeeSign } from '@markee_team/sdk/react';
import type { Address, MarkeeTheme, ModerationOptions, PlacementInput } from '@markee_team/sdk';
import { useMarkeeWallet } from './wallet';
import { configurationFile } from './config-export';
import { createShareUrl, readSharedPlaygroundLink, validPlatformIdentity, type Integration, type PlatformId, type Severity, type ThemeName } from './playground';
import { ModalPreview } from './ModalPreview';
import { ThemeColors } from './ThemeColors';
import { GivethConceptDialog, GivethConceptPreview } from './GivethConcept';

const initialLink = readSharedPlaygroundLink(window.location.search);
const sale = initialLink.saleBoard || import.meta.env.VITE_SALE_BOARD || '0x80783947c9561EFa9BA484D44BBd5AAa03028242';
const apiUrl = import.meta.env.VITE_MARKEE_API_URL || undefined;
const multiBoardPreview = import.meta.env.VITE_MULTI_BOARD_PREVIEW === 'true';
const initialPlatformId = multiBoardPreview || initialLink.platformId === 'giveth' ? initialLink.platformId : 'gardens';
const publishedSite = import.meta.env.VITE_PUBLIC_SITE_URL || 'https://markee-sdk-connectkit-example.vercel.app';
const siteUrl = typeof window !== 'undefined' && window.location.origin === publishedSite ? publishedSite : undefined;
const themes = {
  light: { mode: 'light' },
  dark: { mode: 'dark' },
  system: { mode: 'system' },
  charcoal: { mode: 'dark', radius: 18, colors: { surface: '#1d1f1e', text: '#f3f5f3', muted: '#969d98', border: '#464d48', accent: '#72c4a4', accentText: '#14392b', accentBorder: '#52977a', focusRing: '#a2eac8' } },
  plum: {
    mode: 'light', fontFamily: '"DM Sans", system-ui, sans-serif', radius: 8,
    colors: {
      background: '#fff8fc', surface: '#ffffff', text: '#39283d', muted: '#77607c', border: '#e5d3e5',
      inputBackground: '#ffffff', inputText: '#39283d',
      primary: '#743a84', primaryText: '#ffffff', accent: '#eac6f1', accentText: '#50265b',
      accentSurface: '#f6eafa', accentSurfaceText: '#743a84', accentBorder: '#d8b4e3',
      selected: '#f0ddf5', selectedText: '#50265b', link: '#743a84', focusRing: '#a751be',
      overlay: '#351c3e99',
    },
  },
} satisfies Record<string, MarkeeTheme>;
function ThemePicker({ id, label, value, colors, onChange }: { id: string; label: string; value: ThemeName; colors?: MarkeeTheme['colors']; onChange(value: ThemeName): void }) {
  return <div className="config theme-config"><label htmlFor={id}>{label}</label><div className="theme-picker"><select id={id} value={value} onChange={event => onChange(event.target.value as ThemeName)}><option value="charcoal">Charcoal · sign style</option><option value="light">Light</option><option value="dark">Dark</option><option value="system">Match device</option><option value="plum">Plum · custom brand</option></select><span className={`theme-swatch ${value}`} aria-hidden="true"><i style={{ background: colors?.surface ?? colors?.background }}/><i style={{ background: colors?.primary ?? colors?.text }}/><i style={{ background: colors?.accent }}/></span></div></div>;
}
export function App() {
  const [mode, setMode] = useState(initialLink.mode);
  const [board, setBoard] = useState(initialLink.board);
  const [integration, setIntegration] = useState<Integration>(initialLink.integration);
  const [severity, setSeverity] = useState<Severity>(initialLink.severity);
  const [rules, setRules] = useState(initialLink.rules);
  const moderation = useMemo<ModerationOptions>(() => ({ version: 1, severity, rules: rules ?? {} }), [severity, rules]);
  const [sharedTheme, setSharedTheme] = useState<ThemeName>(initialLink.theme);
  const [sharedColors, setSharedColors] = useState<NonNullable<MarkeeTheme['colors']>>(initialLink.colors);
  const [customizeModal, setCustomizeModal] = useState(initialLink.customizeModal);
  const [modalOverride, setModalOverride] = useState<{ theme: ThemeName; colors: NonNullable<MarkeeTheme['colors']> } | null>(initialLink.customizeModal ? { theme: initialLink.modalTheme, colors: initialLink.modalColors } : null);
  const [hoverEnabled, setHoverEnabled] = useState(initialLink.hoverEnabled);
  const [rent, setRent] = useState(initialLink.rentBoard || import.meta.env.VITE_RENT_BOARD || '0xAce1e0dfD123525B1270a69CF9b1C5b6F850f1e6');
  const [platformId, setPlatformId] = useState<PlatformId>(initialPlatformId);
  const [communityId, setCommunityId] = useState(initialPlatformId === initialLink.platformId ? initialLink.communityId || import.meta.env.VITE_COMMUNITY_ADDRESS || '' : '');
  const [chainId, setChainId] = useState(initialPlatformId !== 'gardens' ? 8453 : initialPlatformId === initialLink.platformId && initialLink.communityId ? initialLink.chainId : Number(import.meta.env.VITE_COMMUNITY_CHAIN_ID || 100));
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [exportNotice, setExportNotice] = useState('');
  const wallet = useMarkeeWallet();
  const account = useAccount();
  const givethConcept = mode === 'community' && platformId === 'giveth';
  const placementInput = useMemo<PlacementInput>(() => mode === 'community'
    ? multiBoardPreview
      ? { multiBoard: { platformId, chainId, communityId } }
      : { placement: { kind: 'gardens-community', chainId, community: communityId as Address } }
    : { placement: { kind: 'board', chainId: 8453, address: (mode === 'board' ? board : mode === 'sale' ? sale : rent) as Address } },
  [mode, platformId, chainId, communityId, sale, rent, board]);
  const sharedThemeConfig = useMemo<MarkeeTheme>(() => ({ ...themes[sharedTheme], colors: { ...(themes[sharedTheme] as MarkeeTheme).colors, ...sharedColors } }), [sharedTheme, sharedColors]);
  const signThemeConfig = useMemo<MarkeeTheme>(() => ({ ...sharedThemeConfig, sign: { hoverLogo: hoverEnabled } }), [sharedThemeConfig, hoverEnabled]);
  const modalThemeConfig = useMemo<MarkeeTheme>(() => customizeModal && modalOverride
    ? { ...themes[modalOverride.theme], colors: { ...(themes[modalOverride.theme] as MarkeeTheme).colors, ...modalOverride.colors } }
    : sharedThemeConfig, [customizeModal, modalOverride, sharedThemeConfig]);
  const valid = mode === 'community' ? validPlatformIdentity(platformId, chainId, communityId)
    : /^0x[\da-fA-F]{40}$/.test(mode === 'board' ? board : mode === 'rent' ? rent : sale);
  const identityInputId = mode === 'community' ? 'community-id' : mode === 'board' ? 'custom-board' : 'rent-board';
  const missingIdentity = mode === 'community'
    ? platformId === 'gardens' ? 'Enter a Gardens RegistryCommunity address.' : platformId === 'giveth' ? 'Enter a Giveth Project ID.' : 'Enter a Revnet project ID.'
    : 'Enter a valid Base board address.';
  const openMarkee = () => {
    if (valid) { setOpen(true); return; }
    document.getElementById(identityInputId)?.focus();
  };
  const configSource = givethConcept ? '// Giveth is a design preview. Live activation and SDK export are unavailable.' : configurationFile({ integration, moderation, ...placementInput, signTheme: signThemeConfig, modalTheme: modalThemeConfig, separateModal: customizeModal, apiUrl });
  const filename = integration === 'react' ? 'SiteMarkee.tsx' : 'markee.js';
  const copyConfig = async () => {
    try { await navigator.clipboard.writeText(configSource); setExportNotice('Configuration copied.'); }
    catch { setExportNotice('Copy unavailable. Select the code below or download the file.'); }
  };
  const share = async () => {
    if (!valid) return;
    const url = createShareUrl(window.location.href, {
      mode, board, saleBoard: sale, rentBoard: rent, platformId, chainId, communityId,
      integration, severity, rules, theme: sharedTheme, colors: sharedColors,
      customizeModal, modalTheme: modalOverride?.theme ?? sharedTheme,
      modalColors: modalOverride?.colors ?? {}, hoverEnabled,
    });
    window.history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url); setNotice('Share link copied.'); }
    catch { setNotice('Share link is in your address bar. Copy it from there.'); }
  };
  const downloadConfig = () => {
    const url = URL.createObjectURL(new Blob([configSource], { type: integration === 'react' ? 'text/typescript;charset=utf-8' : 'text/javascript;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportNotice('Configuration downloaded.');
  };
  return <div className="app">
    <header className="site-header"><a href="#" className="wordmark"><span>m</span> markee <i>×</i> <b>ConnectKit</b></a><ConnectKitButton /></header>
    <main className="layout">
      <section className="live-preview" aria-labelledby="preview-title" tabIndex={0}>
        <div className="overline"><span className="live-dot" /> LIVE PREVIEW</div>
        <h1 id="preview-title">Your Markee, <em>your style.</em></h1>
        <p className="preview-description">Adjust the controls to see your sign and modal change together.</p>
        <div className="sign-preview-card"><div className="preview-caption">Sign preview</div>{givethConcept && valid ? <GivethConceptPreview projectId={communityId} /> : valid ? <MarkeeSign moderation={moderation} className="live-sign" apiUrl={apiUrl} {...placementInput} theme={signThemeConfig} onOpen={() => setOpen(true)} /> : <p className="preview-empty">Enter a valid board address or platform community ID to preview your Markee.</p>}</div>
        <div className="modal-preview-card"><div className="preview-caption">Modal preview <span>{givethConcept ? 'Concept only · no live Giveth activation' : 'Visual preview · use Open Markee to interact'}</span></div>{givethConcept && valid ? <div className="giveth-modal-preview"><span className="giveth-concept-badge">Giveth design preview</span><h3>Activate Project #{communityId}</h3><p>Choose a payment model and enter a Base beneficiary in the concept preview.</p><button type="button" onClick={() => setOpen(true)}>View concept setup</button></div> : valid ? <ModalPreview {...placementInput} theme={modalThemeConfig} moderation={moderation} apiUrl={apiUrl} /> : <p className="preview-empty">Enter a valid board address or platform community ID to preview the modal.</p>}</div>
      </section>
      <section className="demo"><div className="demo-top"><span>THE INTEGRATION PLAYGROUND</span><div className="demo-top-actions"><button type="button" className="share-button" onClick={share} disabled={!valid} aria-label="Copy share link for current playground settings">Share ↗</button><span className="network">Base board</span></div></div><div className="tabs" aria-label="Placement type">{(initialLink.board && initialLink.mode === 'board' ? (['board'] as const) : (['sale', 'rent', 'community', 'board'] as const)).map(value => <button key={value} className={mode === value ? 'selected' : ''} onClick={() => { setMode(value); setNotice(''); }}>{value === 'sale' ? 'For sale' : value === 'rent' ? 'For rent' : value === 'board' ? initialLink.strategy === 'ForRent' ? 'Your For Rent' : initialLink.strategy === 'ForSale' ? 'Your For Sale' : 'Your board' : 'Community'}</button>)}</div><div className="preview"><div className="preview-top"><span className="tiny-mark">m</span><span>{mode === 'board' ? 'Your live Markee preview' : mode === 'sale' ? 'A message that stays with you' : mode === 'rent' ? 'Your message, in the spotlight' : givethConcept ? 'A proposed Giveth integration' : 'Built around your community'}</span></div><h2>{mode === 'board' ? 'Your leaderboard. Your style.' : mode === 'sale' ? 'Make your mark.' : mode === 'rent' ? 'Keep the conversation going.' : givethConcept ? 'Giveth Projects concept.' : 'One community. Its Markee.'}</h2><p>{mode === 'board' ? 'Preview your leaderboard and customize its integration below.' : mode === 'sale' ? 'Explore the sample For Sale board, create a message, and fund your place on the leaderboard.' : mode === 'rent' ? 'Choose a rental board to start, adjust, or stop a stream and manage your ETHx balance.' : givethConcept ? 'Explore the proposed Project ID and Base beneficiary flow. No Giveth project data or wallet authorization is loaded.' : 'Look up the current community board. Authorized owners can activate a new Base board with a Base beneficiary when Markee enables the platform.'}</p></div>
      {mode === 'board' && <div className="config"><label htmlFor="custom-board">Leaderboard address (Base)</label><input id="custom-board" value={board} onChange={event => setBoard(event.target.value)} placeholder="0x…" spellCheck={false}/><small>For Sale or For Rent is detected automatically by the SDK.</small></div>}
      {mode === 'rent'  && <div className="config"><label htmlFor="rent-board">Rental board address</label><input id="rent-board" value={rent} onChange={event => setRent(event.target.value)} placeholder="0x…" spellCheck={false}/></div>}
      {mode === 'community' && <div className="config"><label htmlFor="community-platform">Platform</label><select id="community-platform" value={platformId} onChange={event => { const next = event.target.value as PlatformId; setPlatformId(next); setChainId(next === 'gardens' ? 100 : 8453); setCommunityId(''); }}><option value="gardens">Gardens</option>{multiBoardPreview && <option value="revnet">Revnet (activation gated)</option>}<option value="giveth">Giveth Projects · concept preview</option></select><label htmlFor="community-chain">Identity network</label><select id="community-chain" value={chainId} onChange={event => setChainId(Number(event.target.value))} disabled={platformId !== 'gardens'}>{platformId !== 'gardens' ? <option value={8453}>Base</option> : [[100, 'Gnosis'], [8453, 'Base'], [10, 'Optimism'], [42161, 'Arbitrum'], [42220, 'Celo'], [137, 'Polygon'], [1, 'Ethereum']].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><label htmlFor="community-id">{platformId === 'gardens' ? 'RegistryCommunity address' : platformId === 'giveth' ? 'Giveth Project ID' : 'Revnet project ID'}</label><input id="community-id" value={communityId} onChange={event => setCommunityId(event.target.value.trim())} placeholder={platformId === 'gardens' ? '0x…' : 'Project ID (for example, 42)'} inputMode={platformId === 'gardens' ? 'text' : 'numeric'} spellCheck={false}/><small>{givethConcept ? 'Design preview with no Giveth API data, owner verification, SDK export, or live activation.' : multiBoardPreview ? 'Preview of the new platform lookup. It requires Markee’s platform API deployment; activation stays gated.' : 'Looks up an existing Gardens integration through Markee’s live API. A valid community may still have no Markee board.'}</small></div>}
      {!givethConcept && <><div className="config"><label htmlFor="moderation-severity">Automatic moderation severity</label><select id="moderation-severity" value={rules ? 'custom' : severity} onChange={event => { setSeverity(event.target.value as Severity); setRules(undefined); }}><option value="relaxed">Relaxed · scam and phishing rules</option><option value="standard">Standard · current rules and profanity</option><option value="strict">Strict · also hide links and payment addresses</option>{rules && <option value="custom">Custom board rules</option>}</select><small>Board owners can change saved moderation in Markee. Saved board rules take precedence over this versioned integration default.</small></div>
      <ThemePicker id="shared-theme" label="Shared theme" value={sharedTheme} colors={sharedThemeConfig.colors} onChange={value => { setSharedTheme(value); setSharedColors({}); }} />
      <div className="config"><small>{customizeModal ? 'Used by the sign. The modal uses its separate theme below.' : 'Applies to both the sign and modal.'}</small></div>
      <ThemeColors label="Shared" theme={themes[sharedTheme]} overrides={sharedColors} onChange={setSharedColors} />
      <div className="config hover-config"><label className="hover-toggle" htmlFor="customize-modal"><input id="customize-modal" type="checkbox" checked={customizeModal} onChange={event => { const enabled = event.target.checked; if (enabled && !modalOverride) setModalOverride({ theme: sharedTheme, colors: { ...sharedColors } }); setCustomizeModal(enabled); }} /> Customize modal separately</label></div>
      {customizeModal && modalOverride && <div className="modal-theme-override">
        <ThemePicker id="modal-theme" label="Modal theme" value={modalOverride.theme} colors={modalThemeConfig.colors} onChange={value => setModalOverride({ theme: value, colors: {} })} />
        <ThemeColors label="Modal" theme={themes[modalOverride.theme]} overrides={modalOverride.colors} onChange={colors => setModalOverride({ ...modalOverride, colors })} />
      </div>}
      <div className="config hover-config"><label className="hover-toggle" htmlFor="sign-hover-enabled"><input id="sign-hover-enabled" type="checkbox" checked={hoverEnabled} onChange={event => setHoverEnabled(event.target.checked)} /> Markee logo on hover</label></div>
      </>}
      <div className="launch"><button className="launch-button" onClick={openMarkee} aria-describedby="launch-note">{valid ? givethConcept ? 'View Giveth concept' : 'Open Markee' : mode === 'community' ? 'Choose a community' : 'Enter a board address'} <span>↗</span></button><span className="launch-note" id="launch-note" role="status">{valid ? givethConcept ? 'Preview only. No wallet action or live activation.' : account.isConnected ? 'Uses your connected app wallet' : 'Browse first. Connect when you’re ready.' : `${missingIdentity} Your wallet connection does not select one automatically.`}</span>{!givethConcept && <a className="view-code" href="#sdk-configuration">View generated code <span aria-hidden="true">↓</span></a>}</div></section>
    </main>
    {!givethConcept && <section id="sdk-configuration" className="config-export" aria-labelledby="config-export-title" tabIndex={-1}>
      <div className="export-heading"><div><div className="overline">TAKE IT INTO YOUR APP</div><h2 id="config-export-title">Your SDK configuration</h2><p>{givethConcept ? 'Giveth integration is a design preview; there is no live SDK setup to export yet.' : 'Updates as you change the placement, themes, and hover option above.'}</p></div><div className="export-actions"><button disabled={!valid || givethConcept} onClick={copyConfig}>Copy code</button><button disabled={!valid || givethConcept} onClick={downloadConfig}>Download {integration === 'react' ? '.tsx' : '.js'} ↗</button></div></div>
      <div className="config integration-format"><label htmlFor="integration-format">Integration code</label><select id="integration-format" value={integration} onChange={event => { setIntegration(event.target.value as Integration); setExportNotice(''); }}><option value="react">React / Next.js</option><option value="vanilla">Vanilla JavaScript (npm bundler)</option></select></div>
      <div className="export-filename">{filename} <span>{givethConcept ? 'Prototype only · export unavailable' : valid ? 'Ready to use' : 'Enter a valid board address or community ID to export'}</span></div>
      <pre tabIndex={0} aria-label="Generated SDK configuration"><code>{configSource}</code></pre>
      <p className="export-help">Install @markee_team/sdk@latest, then add this file to your app. Reuse your app’s wallet adapter if it has one. No API key is needed. For public site verification, add a server-rendered data-markee-address marker and register your own deployed HTTPS page on Markee.</p>
      <p role="status" className="export-status">{exportNotice}</p>
    </section>}
    <footer className="site-footer"><span>MARK BOTH THE MOMENT & THE FUTURE.</span><span>Markee SDK × ConnectKit</span></footer>{notice && <div className="toast" role="status">{notice}</div>}
    {givethConcept ? open && valid && <GivethConceptDialog key={communityId} projectId={communityId} onClose={() => setOpen(false)} /> : valid && <MarkeeModal moderation={moderation} apiUrl={apiUrl} siteUrl={mode === 'community' || mode === 'board' ? undefined : siteUrl} wallet={wallet} theme={modalThemeConfig} {...placementInput} open={open} onClose={() => setOpen(false)} onEvent={event => { if (event.type === 'confirmed') setNotice('Your Markee transaction is confirmed.'); }} />}
  </div>;
}
