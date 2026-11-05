/** Preview reads are live; mutations never leave the browser. */
export function previewFetch(input: RequestInfo | URL, init?: RequestInit, read: typeof fetch = fetch): Promise<Response> {
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') return Promise.resolve(Response.json({ error: 'Visual preview only. Open Markee to interact.' }, { status: 403 }));
  return read(input, init);
}
