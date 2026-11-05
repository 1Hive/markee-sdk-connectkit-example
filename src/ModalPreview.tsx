import { useEffect, useRef } from 'react';
import type { MarkeeTheme, Placement, ModerationSeverity } from '@markee_team/sdk';

interface PreviewConfig { placement: Placement; theme: MarkeeTheme; severity: ModerationSeverity; apiUrl?: string }

/** Isolate the real SDK dialog's positioning, focus and scroll behavior. */
export function ModalPreview(props: PreviewConfig) {
  const frame = useRef<HTMLIFrameElement>(null);
  const current = useRef(props); current.current = props;
  const send = () => frame.current?.contentWindow?.postMessage({ type: 'markee-playground:preview-config', config: current.current }, window.location.origin);
  useEffect(() => {
    const ready = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.type === 'markee-playground:preview-ready') send();
    };
    window.addEventListener('message', ready);
    return () => window.removeEventListener('message', ready);
  }, []);
  useEffect(send, [props.placement, props.theme, props.severity, props.apiUrl]);
  return <iframe ref={frame} src="/modal-preview.html" title="Modal theme preview" className="modal-preview-frame" tabIndex={-1} aria-hidden="true" onLoad={send} />;
}
