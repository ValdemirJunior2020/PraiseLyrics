// Netlify serverless proxy: Apps Script URL remains server-side (not exposed in the Vite bundle).
export default async function handler(request) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
  }
  const upstream = process.env.PRAISELYRICS_APPS_SCRIPT_URL;
  if (!upstream || !/^https:\/\/script\.google\.com\/macros\/s\//.test(upstream)) {
    return new Response(JSON.stringify({ ok: false, error: 'Lyrics database has not been connected yet.' }), {
      status: 503, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
  }
  try {
    const requestURL = new URL(request.url);
    const url = new URL(upstream);
    url.searchParams.set('action', 'list');
    url.searchParams.set('limit', '500');
    const q = String(requestURL.searchParams.get('q') || '').trim().slice(0, 180);
    if (q) url.searchParams.set('q', q);
    const response = await fetch(url.toString(), { redirect: 'follow', signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('Upstream error');
    const payload = await response.json();
    if (!payload || payload.ok !== true || !Array.isArray(payload.songs)) throw new Error('Invalid response');
    return Response.json(payload, {
      headers: { 'cache-control': 'public, max-age=30, s-maxage=60' }
    });
  } catch (_) {
    return Response.json({ ok: false, error: 'Unable to reach Google Sheets lyrics database.' }, {
      status: 502, headers: { 'cache-control': 'no-store' }
    });
  }
}
export const config = { path: '/api/lyrics' };
