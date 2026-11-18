import { useState } from 'react';

const validAddress = (value: string) => /^0x[\da-fA-F]{40}$/.test(value) && !/^0x0{40}$/i.test(value);

function ConceptLabel() {
  return <span className="giveth-concept-badge">Concept preview · no live activation</span>;
}

export function GivethConceptPreview({ projectId, onOpen }: { projectId: string; onOpen(): void }) {
  return <button type="button" className="giveth-concept-preview" onClick={onOpen} aria-label={`Preview Markee setup for Giveth Project ${projectId}`}>
    <span className="giveth-concept-art" aria-hidden="true">G<span>✦</span></span>
    <span className="giveth-concept-preview-content"><ConceptLabel /><strong>Give your project a voice.</strong><span>Project #{projectId} · Markee on Base</span><span className="giveth-concept-preview-action">Explore the concept <span aria-hidden="true">↗</span></span></span>
  </button>;
}

export function GivethConceptModalPreview({ projectId, onOpen }: { projectId: string; onOpen(): void }) {
  return <div className="giveth-modal-preview">
    <div className="giveth-modal-preview-art"><span>PROJECT #{projectId}</span><strong>Make room for<br />your community.</strong><span className="giveth-modal-preview-spark" aria-hidden="true">✳</span></div>
    <div className="giveth-modal-preview-body"><ConceptLabel /><h3>Bring Markee to your project</h3><p>Choose how messages pay, then select the Base address that would receive revenue.</p><button type="button" onClick={onOpen}>Preview setup <span aria-hidden="true">↗</span></button></div>
  </div>;
}

export function GivethConceptDialog({ projectId, onClose }: { projectId: string; onClose(): void }) {
  const [strategy, setStrategy] = useState<'sale' | 'rent'>('sale');
  const [beneficiary, setBeneficiary] = useState('');
  return <div className="giveth-concept-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="giveth-concept-dialog" role="dialog" aria-modal="true" aria-labelledby="giveth-concept-title">
      <header className="giveth-concept-dialog-hero"><div><ConceptLabel /><span className="giveth-concept-project">GIVETH PROJECT #{projectId}</span><h2 id="giveth-concept-title">A new way for your<br />community to be seen.</h2><p>Explore how Markee activation could work for a Giveth Project.</p></div><button type="button" aria-label="Close Giveth preview" onClick={onClose}>×</button><span className="giveth-concept-hero-spark" aria-hidden="true">✳</span></header>
      <div className="giveth-concept-body">
        <div className="giveth-concept-notice"><strong>Design concept</strong><span>Project data, owner authorization, and activation are not connected yet.</span></div>
        <section><div className="giveth-concept-step-heading"><span>01</span><div><h3>Choose a payment model</h3><p>How should messages support your project?</p></div></div><div className="giveth-concept-choices"><button type="button" aria-pressed={strategy === 'sale'} onClick={() => setStrategy('sale')}><strong>For Sale</strong><span>One-time ETH payments</span></button><button type="button" aria-pressed={strategy === 'rent'} onClick={() => setStrategy('rent')}><strong>For Rent</strong><span>Continuous ETHx streams</span></button></div></section>
        <section><div className="giveth-concept-step-heading"><span>02</span><div><h3>Set your Base beneficiary</h3><p>Enter the wallet or contract that would receive payments. Nothing is preselected.</p></div></div><label htmlFor="giveth-beneficiary">Beneficiary address on Base</label><input id="giveth-beneficiary" value={beneficiary} onChange={event => setBeneficiary(event.target.value.trim())} placeholder="0x…" autoComplete="off" spellCheck={false} aria-describedby="giveth-beneficiary-help"/><small id="giveth-beneficiary-help">{strategy === 'sale' ? 'For Sale sends native ETH. Confirm the address can receive ETH transfers.' : 'For Rent sends a Superfluid ETHx stream. Confirm the address can receive that stream.'}</small>{beneficiary && !validAddress(beneficiary) && <small className="giveth-concept-error">Enter a valid, nonzero Base address.</small>}</section>
      </div><footer><span>Preview only · no wallet action</span><button type="button" onClick={onClose}>Done</button></footer>
    </section>
  </div>;
}
