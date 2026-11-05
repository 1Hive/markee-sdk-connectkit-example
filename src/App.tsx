import { useMemo, useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';
import { MarkeeModal, MarkeeSign } from '@markee_team/sdk/react';
import type { Address, MarkeeTheme, Placement } from '@markee_team/sdk';
import { useMarkeeWallet } from './wallet';
import { configurationFile } from './config-export';
import { readPlaygroundLink, type Integration } from './playground';
import { ThemeColors } from './ThemeColors';

const initialLink = readPlaygroundLink(window.location.search);
const sale = import.meta.env.VITE_SALE_BOARD || '0x80783947c9561EFa9BA484D44BBd5AAa03028242';
const apiUrl = import.meta.env.VITE_MARKEE_API_URL || undefined;
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
type ThemeName = keyof typeof themes;
function ThemePicker({ id, label, value, onChange }: { id: string; label: string; value: ThemeName; onChange(value: ThemeName): void }) {
  return <div className="config theme-config"><label htmlFor={id}>{label}</label><div className="theme-picker"><select id={id} value={value} onChange={event => onChange(event.target.value as ThemeName)}><option value="charcoal">Charcoal · sign style</option><option value="light">Light</option><option value="dark">Dark</option><option value="system">Match device</option><option value="plum">Plum · custom brand</option></select><span className={`theme-swatch ${value}`} aria-hidden="true"><i/><i/><i/></span></div></div>;
}
export function App() {
  const [mode, setMode] = useState<'sale' | 'rent' | 'community' | 'board'>(initialLink.board ? 'board' : 'sale');
  const [board, setBoard] = useState(initialLink.board);
  const [integration, setIntegration] = useState<Integration>(initialLink.integration);
  const [signTheme, setSignTheme] = useState<ThemeName>('charcoal');
  const [signColors, setSignColors] = useState<NonNullable<MarkeeTheme['colors']>>({});
  const [modalColors, setModalColors] = useState<NonNullable<MarkeeTheme['colors']>>({});
  const [hoverEnabled, setHoverEnabled] = useState(true);
  const [modalTheme, setModalTheme] = useState<ThemeName>('light');
  const [rent, setRent] = useState(import.meta.env.VITE_RENT_BOARD || '0xAce1e0dfD123525B1270a69CF9b1C5b6F850f1e6');
  const [community, setCommunity] = useState(import.meta.env.VITE_COMMUNITY_ADDRESS || '');
  const [chainId, setChainId] = useState(Number(import.meta.env.VITE_COMMUNITY_CHAIN_ID || 100));
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [exportNotice, setExportNotice] = useState('');
  const wallet = useMarkeeWallet();
  const account = useAccount();
  const placement = useMemo<Placement>(() => mode === 'community' ? { kind: 'gardens-community', chainId, community: community as Address } : { kind: 'board', chainId: 8453, address: (mode === 'board' ? board : mode === 'sale' ? sale : rent) as Address }, [mode, chainId, community, rent, board]);
  const signThemeConfig = useMemo<MarkeeTheme>(() => ({
    ...themes[signTheme],
    colors: { ...(themes[signTheme] as MarkeeTheme).colors, ...signColors },
    sign: { hoverLogo: hoverEnabled },
  }), [signTheme, hoverEnabled, signColors]);
  const modalThemeConfig = useMemo<MarkeeTheme>(() => ({ ...themes[modalTheme], colors: { ...(themes[modalTheme] as MarkeeTheme).colors, ...modalColors } }), [modalTheme, modalColors]);
  const valid = /^0x[\da-fA-F]{40}$/.test(mode === 'community' ? community : mode === 'board' ? board : mode === 'rent' ? rent : sale);
  const configSource = configurationFile({ integration, placement, signTheme: signThemeConfig, modalTheme: modalThemeConfig, apiUrl });
  const filename = integration === 'react' ? 'SiteMarkee.tsx' : 'markee.js';
  const copyConfig = async () => {
    try { await navigator.clipboard.writeText(configSource); setExportNotice('Configuration copied.'); }
    catch { setExportNotice('Copy unavailable. Select the code below or download the file.'); }
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
      <section className="intro"><div className="overline"><span className="live-dot" /> A PLACE FOR YOUR MESSAGE</div><h1>A live sign.<br/>A little more<br/><em>possibility.</em></h1><p>Display a live, moderated Markee sign. Open the payment modal independently when someone wants to participate.</p><div className="features"><div><span>01</span><strong>Your app’s wallet</strong><small>Connect once with ConnectKit.</small></div><div><span>02</span><strong>Both ways to back</strong><small>One payment or a rental stream.</small></div><div><span>03</span><strong>Rewards to you</strong><small>MARKEE arrives in your wallet.</small></div></div></section>
      <section className="demo"><div className="demo-top"><span>THE INTEGRATION PLAYGROUND</span><span className="network">Base</span></div><div className="tabs" aria-label="Placement type">{(['sale', 'rent', 'community', 'board'] as const).map(value => <button key={value} className={mode === value ? 'selected' : ''} onClick={() => { setMode(value); setNotice(''); }}>{value === 'sale' ? 'For sale' : value === 'rent' ? 'For rent' : value === 'board' ? 'Your board' : 'Community'}</button>)}</div><div className="preview"><div className="preview-top"><span className="tiny-mark">m</span><span>{mode === 'board' ? 'Your live Markee preview' : mode === 'sale' ? 'A message that stays with you' : mode === 'rent' ? 'Your message, in the spotlight' : 'Built around your community'}</span></div>{valid ? <MarkeeSign className="live-sign" apiUrl={apiUrl} placement={placement} theme={signThemeConfig} onOpen={() => setOpen(true)} /> : <div className="illustration" aria-hidden="true"><div className="orb"/><div className="mini-sign"><span>MARK YOUR MOMENT</span><strong>Hello,<br/>possibility.</strong><span className="mini-bottom">✳ &nbsp; powered by markee</span></div><div className="floating-tag">{mode === 'sale' ? 'YOURS TO OWN ↗' : 'YOURS TO BACK ↗'}</div></div>}<h2>{mode === 'board' ? 'Your leaderboard. Your style.' : mode === 'sale' ? 'Make your mark.' : mode === 'rent' ? 'Keep the conversation going.' : 'A voice. A shared treasury.'}</h2><p>{mode === 'board' ? 'Preview your leaderboard and customize its integration below.' : mode === 'sale' ? 'Explore the sample For Sale board, create a message, and fund your place on the leaderboard.' : mode === 'rent' ? 'Choose a rental board to start, adjust, or stop a stream and manage your ETHx balance.' : 'Open a community board, activate its integration, and manage revenue with your council wallet.'}</p></div>
      {mode === 'board' && <div className="config"><label htmlFor="custom-board">Leaderboard address (Base)</label><input id="custom-board" value={board} onChange={event => setBoard(event.target.value)} placeholder="0x…" spellCheck={false}/><small>For Sale or For Rent is detected automatically by the SDK.</small></div>}
      {mode === 'rent'  && <div className="config"><label htmlFor="rent-board">Rental board address</label><input id="rent-board" value={rent} onChange={event => setRent(event.target.value)} placeholder="0x…" spellCheck={false}/></div>}
      {mode === 'community' && <div className="config"><label htmlFor="community-chain">Community network</label><select id="community-chain" value={chainId} onChange={event => setChainId(Number(event.target.value))}>{[[100, 'Gnosis'], [8453, 'Base'], [10, 'Optimism'], [42161, 'Arbitrum'], [42220, 'Celo'], [137, 'Polygon'], [1, 'Ethereum'], [11155111, 'Sepolia'], [421614, 'Arbitrum Sepolia'], [11155420, 'Optimism Sepolia']].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><label htmlFor="community-address">Community address</label><input id="community-address" value={community} onChange={event => setCommunity(event.target.value)} placeholder="0x…" spellCheck={false}/></div>}
      <ThemePicker id="sign-theme" label="Sign theme" value={signTheme} onChange={value => { setSignTheme(value); setSignColors({}); }} />
      <ThemeColors label="Sign" theme={themes[signTheme]} overrides={signColors} onChange={setSignColors} />
      <div className="config hover-config"><label className="hover-toggle" htmlFor="sign-hover-enabled"><input id="sign-hover-enabled" type="checkbox" checked={hoverEnabled} onChange={event => setHoverEnabled(event.target.checked)} /> Markee logo on hover</label></div>
      <ThemePicker id="modal-theme" label="Modal theme" value={modalTheme} onChange={value => { setModalTheme(value); setModalColors({}); }} />
      <ThemeColors label="Modal" theme={themes[modalTheme]} overrides={modalColors} onChange={setModalColors} />
      <div className="launch"><button className="launch-button" disabled={!valid} onClick={() => setOpen(true)}>Open Markee <span>↗</span></button><span className="launch-note">{account.isConnected ? 'Uses your connected app wallet' : 'Browse first. Connect when you’re ready.'}</span><a className="view-code" href="#sdk-configuration">View generated code <span aria-hidden="true">↓</span></a></div></section>
    </main>
    <section id="sdk-configuration" className="config-export" aria-labelledby="config-export-title" tabIndex={-1}>
      <div className="export-heading"><div><div className="overline">TAKE IT INTO YOUR APP</div><h2 id="config-export-title">Your SDK configuration</h2><p>Updates as you change the placement, themes, and hover option above.</p></div><div className="export-actions"><button disabled={!valid} onClick={copyConfig}>Copy code</button><button disabled={!valid} onClick={downloadConfig}>Download {integration === 'react' ? '.tsx' : '.js'} ↗</button></div></div>
      <div className="config integration-format"><label htmlFor="integration-format">Integration code</label><select id="integration-format" value={integration} onChange={event => { setIntegration(event.target.value as Integration); setExportNotice(''); }}><option value="react">React / Next.js</option><option value="vanilla">Vanilla JavaScript (npm bundler)</option></select></div>
      <div className="export-filename">{filename} <span>{valid ? 'Ready to use' : 'Enter a valid address to export'}</span></div>
      <pre tabIndex={0} aria-label="Generated SDK configuration"><code>{configSource}</code></pre>
      <p className="export-help">Install @markee_team/sdk@latest, then add this file to your app. Reuse your app’s wallet adapter if it has one. No API key is needed. For public site verification, add a server-rendered data-markee-address marker and register your own deployed HTTPS page on Markee.</p>
      <p role="status" className="export-status">{exportNotice}</p>
    </section>
    <footer className="site-footer"><span>MARK BOTH THE MOMENT & THE FUTURE.</span><span>Markee SDK × ConnectKit</span></footer>{notice && <div className="toast" role="status">{notice}</div>}
    <MarkeeModal apiUrl={apiUrl} siteUrl={mode === 'community' || mode === 'board' ? undefined : siteUrl} wallet={wallet} theme={modalThemeConfig} placement={placement} open={open} onClose={() => setOpen(false)} onEvent={event => { if (event.type === 'confirmed') setNotice('Your Markee transaction is confirmed.'); }} />
  </div>;
}
