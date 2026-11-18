import { useState } from 'react';

const validAddress = (value: string) => /^0x[\da-fA-F]{40}$/.test(value) && !/^0x0{40}$/i.test(value);

export function GivethConceptPreview({ projectId }: { projectId: string }) {
  return <div className="giveth-concept-preview"><span className="giveth-concept-badge">Giveth concept · no live activation</span><h3>Project #{projectId}</h3><p>The proposed integration would check the current project owner through Giveth, then create a Markee board on Base. A beneficiary would be entered explicitly during activation.</p></div>;
}

export function GivethConceptDialog({ projectId, onClose }: { projectId: string; onClose(): void }) {
  const [strategy, setStrategy] = useState<'sale' | 'rent'>('sale');
  const [beneficiary, setBeneficiary] = useState('');
  return <div className="giveth-concept-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="giveth-concept-dialog" role="dialog" aria-modal="true" aria-labelledby="giveth-concept-title">
      <header><div><span className="giveth-concept-badge">Giveth design preview</span><h2 id="giveth-concept-title">Activate Project #{projectId}</h2></div><button type="button" aria-label="Close Giveth preview" onClick={onClose}>×</button></header>
      <div className="giveth-concept-body"><p>This previews the proposed setup. Giveth project data, owner authorization, and live activation are not connected.</p>
        <section><h3>1. Payment model</h3><div className="giveth-concept-choices"><button type="button" aria-pressed={strategy === 'sale'} onClick={() => setStrategy('sale')}><strong>For Sale</strong><span>One-time ETH payments</span></button><button type="button" aria-pressed={strategy === 'rent'} onClick={() => setStrategy('rent')}><strong>For Rent</strong><span>Continuous ETHx streams</span></button></div></section>
        <section><h3>2. Base beneficiary</h3><p>Enter the wallet or contract that would receive payments on Base. No address is chosen for you.</p><label htmlFor="giveth-beneficiary">Beneficiary address on Base</label><input id="giveth-beneficiary" value={beneficiary} onChange={event => setBeneficiary(event.target.value.trim())} placeholder="0x…" autoComplete="off" spellCheck={false} aria-describedby="giveth-beneficiary-help"/><small id="giveth-beneficiary-help">{strategy === 'sale' ? 'For Sale sends native ETH. Confirm the address can receive ETH transfers.' : 'For Rent sends a Superfluid ETHx stream. Confirm the address can receive that stream.'}</small>{beneficiary && !validAddress(beneficiary) && <small className="giveth-concept-error">Enter a valid, nonzero Base address.</small>}</section>
        <p className="giveth-concept-status">Preview only. Activation and wallet signing are unavailable for Giveth.</p>
      </div><footer><button type="button" onClick={onClose}>Close preview</button></footer>
    </section>
  </div>;
}
