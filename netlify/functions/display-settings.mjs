// Read cloud display settings and save them through the Google Apps Script API.
// Saving requires the admin token configured in Apps Script Script Properties.
const headers = { 'content-type': 'application/json', 'cache-control': 'no-store' };
function reply(payload, status = 200) {
  return Response.json(payload, { status, headers });
}
export default async function handler(request) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return reply({ ok: false, error: 'Method not allowed' }, 405);
  }
  const upstream = process.env.PRAISELYRICS_APPS_SCRIPT_URL;
  if (!upstream || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(upstream)) {
    return reply({ ok: false, error: 'Google Sheets connection is missing.' }, 503);
  }
  try {
    const url = new URL(upstream);
    if (request.method === 'GET') {
      url.searchParams.set('action', 'settings');
      const response = await fetch(url.toString(), {
        redirect: 'follow', signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) throw new Error('Google Apps Script did not respond.');
      const result = await response.json();
      if (!result || result.ok !== true || !Object.hasOwn(result, 'settings')) {
        throw new Error('Update and redeploy Google Apps Script Code.gs first.');
      }
      return reply(result);
    }
    const body = await request.json();
    if (typeof body.token !== 'string' || body.token.length < 24 ||
        !body.settings || typeof body.settings !== 'object') {
      return reply({ ok: false, error: 'Enter your admin key to save settings.' }, 400);
    }
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'saveSettings', token: body.token, settings: body.settings }),
      redirect: 'follow',
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error('Google Apps Script rejected the request.');
    const result = await response.json();
    if (!result.ok) {
      return reply({ ok: false, error: result.error || 'Settings were not saved.' }, 403);
    }
    return reply(result);
  } catch (error) {
    return reply({ ok: false, error: error?.message || 'Cloud settings unavailable.' }, 502);
  }
}
export const config = { path: '/api/display-settings' };
