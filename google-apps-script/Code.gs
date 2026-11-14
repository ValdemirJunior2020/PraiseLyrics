/**
 * PraiseLyrics Google Sheets database
 * Spreadsheet: 1x6OVrZl85GP6fteGwGlkLLbCOxj6JfZdTwJMj4gqtns
 *
 * 1. Paste into Extensions > Apps Script > Code.gs
 * 2. Run setupDatabase() once and approve permissions
 * 3. Deploy > New deployment > Web app > Execute as Me > Anyone
 * 4. Copy the /exec URL into Netlify env PRAISELYRICS_APPS_SCRIPT_URL.
 *
 * Public GET is read-only. POST is disabled until you explicitly set a random
 * ADMIN_WRITE_TOKEN in Apps Script > Project Settings > Script Properties.\n * Global appearance saves use a separate SETTINGS_PIN Script Property.
 * NEVER expose that token in browser React code or VITE_* variables.
 */
const CONFIG = Object.freeze({
  spreadsheetId: '1x6OVrZl85GP6fteGwGlkLLbCOxj6JfZdTwJMj4gqtns',
  sheetName: 'Lyrics',
  columns: ['id', 'title', 'artist', 'language', 'key', 'lyrics', 'slides_json', 'tags', 'status', 'updated_at']
});

function getLyricsSheet_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  if (!sheet) throw new Error('Missing Lyrics tab. Run setupDatabase().');
  return sheet;
}

function setupDatabase() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = spreadsheet.getSheetByName(CONFIG.sheetName) || spreadsheet.insertSheet(CONFIG.sheetName);
  sheet.getRange(1, 1, 1, CONFIG.columns.length).setValues([CONFIG.columns]);
  sheet.setFrozenRows(1);
  const settingsSheet = spreadsheet.getSheetByName(DISPLAY_SETTINGS_TAB) || spreadsheet.insertSheet(DISPLAY_SETTINGS_TAB);
  settingsSheet.getRange(1, 1, 1, 3).setValues([['profile', 'settings_json', 'updated_at']]);
  settingsSheet.setFrozenRows(1);
  if (!sheet.getFilter()) sheet.getRange(1, 1, Math.max(2, sheet.getLastRow()), CONFIG.columns.length).createFilter();
  return 'PraiseLyrics database is ready. Existing rows were preserved.';
}


/**
 * Global worship display profile (independent of the song library).
 * This profile is shared by all devices using PraiseLyrics.
 */
const DISPLAY_SETTINGS_TAB = 'Display Settings';
const DISPLAY_PROFILE = 'default';
const SETTINGS_KEYS = [
  'background', 'backgroundImage', 'overlay', 'textColor', 'fontSize',
  'fontFamily', 'fontWeight', 'textAlign', 'lineHeight', 'textShadow',
  'maxWidth', 'verticalOffset'
];

function getDisplaySettingsSheet_() {
  const book = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = book.getSheetByName(DISPLAY_SETTINGS_TAB);
  if (!sheet) throw new Error('Missing Display Settings tab. Run setupDatabase().');
  return sheet;
}

function sanitizeDisplaySettings_(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid display settings.');
  }
  const safe = {};
  const numeric = { overlay: [0, 0.85], fontSize: [24, 320], fontWeight: [100, 900], lineHeight: [0.8, 3], maxWidth: [50, 96], verticalOffset: [-45, 45] };
  for (const key of SETTINGS_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
    const v = value[key];
    if (key in numeric) {
      const num = Number(v);
      if (!Number.isFinite(num)) throw new Error('Invalid numeric value: ' + key);
      safe[key] = Math.max(numeric[key][0], Math.min(numeric[key][1], num));
    } else if (key === 'textShadow') {
      safe[key] = Boolean(v);
    } else if (key === 'textAlign') {
      if (!['left','right','center'].includes(v)) throw new Error('Invalid alignment.');
      safe[key] = v;
    } else if (typeof v === 'string' && v.length <= 1500) {
      safe[key] = v;
    }
  }
  return safe;
}

function getDisplaySettings_() {
  const sheet = getDisplaySettingsSheet_();
  const last = sheet.getLastRow();
  if (last <= 1) return { settings: null, updated_at: '' };
  const rows = sheet.getRange(2, 1, last - 1, 3).getValues();
  const row = rows.find(item => String(item[0]).trim() === DISPLAY_PROFILE);
  if (!row) return { settings: null, updated_at: '' };
  try {
    return { settings: sanitizeDisplaySettings_(JSON.parse(String(row[1]) || '{}')), updated_at: String(row[2] || '') };
  } catch (_) {
    throw new Error('Display settings are malformed.');
  }
}

function saveDisplaySettings_(settings) {
  const safe = sanitizeDisplaySettings_(settings);
  const sheet = getDisplaySettingsSheet_();
  const last = sheet.getLastRow();
  const ids = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues().flat().map(String) : [];
  const position = ids.indexOf(DISPLAY_PROFILE);
  const row = position >= 0 ? position + 2 : last + 1;
  const updated_at = new Date().toISOString();
  sheet.getRange(row, 1, 1, 3).setValues([[DISPLAY_PROFILE, JSON.stringify(safe), updated_at]]);
  return { settings: safe, updated_at };
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function readRows_() {
  const sheet = getLyricsSheet_();
  const last = sheet.getLastRow();
  if (last <= 1) return [];
  const rows = sheet.getRange(2, 1, last - 1, CONFIG.columns.length).getValues();
  return rows.map((row, index) => {
    const record = Object.fromEntries(CONFIG.columns.map((key, i) => [key, String(row[i] || '')]));
    if (!record.title.trim() || record.status.toLowerCase() === 'archived') return null;
    let slides = [];
    try { slides = JSON.parse(record.slides_json || '[]'); } catch (_) {}
    if (!Array.isArray(slides) || !slides.length) {
      slides = [{ id: 'verse-1', label: 'Full Lyrics', text: record.lyrics }];
    }
    slides = slides.filter(s => s && typeof s.text === 'string')
      .map((s, i) => ({ id: String(s.id || 'verse-' + (i + 1)), label: String(s.label || 'Verse ' + (i + 1)), text: s.text }));
    return {
      id: record.id.trim() || 'sheets-row-' + (index + 2),
      title: record.title.trim(),
      artist: record.artist.trim(),
      language: record.language.trim() || 'en',
      key: record.key.trim(),
      tags: record.tags,
      slides: slides,
      updated_at: record.updated_at,
      source: 'google-sheets'
    };
  }).filter(Boolean);
}

// GET /exec?action=list&q=holy&limit=100
// Searches title, artist, tags, and full lyrics (case insensitive).
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.action === 'settings') {
      return json_({ ok: true, ...getDisplaySettings_() });
    }
    const q = String(p.q || '').trim().toLocaleLowerCase();
    const requestedLimit = Number(p.limit || 100);
    const limit = Math.max(1, Math.min(500, Number.isFinite(requestedLimit) ? requestedLimit : 100));
    const songs = readRows_().filter(song =>
      !q || [song.title, song.artist, song.tags, song.slides.map(s => s.text).join(' ')]
        .some(value => String(value || '').toLocaleLowerCase().includes(q))
    );
    if (p.action === 'health') return json_({ ok: true, service: 'PraiseLyrics', count: songs.length });
    return json_({ ok: true, total: songs.length, songs: songs.slice(0, limit) });
  } catch (error) {
    return json_({ ok: false, error: 'Unable to load lyrics database.' });
  }
}

/**
 * Optional administrative import endpoint (disabled without ADMIN_WRITE_TOKEN).
 * The token belongs in Apps Script Script Properties, never in the public app.
 * JSON body: {token, action:"upsert", song:{id,title,artist,language,key,slides,tags}}
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action === 'saveSettings') {
      // The four-digit settings PIN is stored only in Apps Script's private Script Properties.
      // Do not add it to this public repository or to browser JavaScript.
      const pin = PropertiesService.getScriptProperties().getProperty('SETTINGS_PIN');
      if (!pin || !/^\\d{4}$/.test(pin)) return json_({ ok: false, error: 'Settings PIN not configured in Script Properties.' });
      const cache = CacheService.getScriptCache();
      if (Number(cache.get('settings_pin_failures') || 0) >= 5) {
        return json_({ ok: false, error: 'Too many PIN attempts. Try again in 15 minutes.' });
      }
      if (String(body.pin || '') !== pin) {
        cache.put('settings_pin_failures', String(Number(cache.get('settings_pin_failures') || 0) + 1), 900);
        return json_({ ok: false, error: 'Incorrect PIN.' });
      }
      lock.waitLock(15000);
      cache.remove('settings_pin_failures');
      return json_({ ok: true, ...saveDisplaySettings_(body.settings) });
    }
    const token = PropertiesService.getScriptProperties().getProperty('ADMIN_WRITE_TOKEN');
    if (!token || token.length < 24) return json_({ ok: false, error: 'Writes disabled.' });
    if (body.token !== token) return json_({ ok: false, error: 'Unauthorized.' });
    if (body.action !== 'upsert') return json_({ ok: false, error: 'Unsupported action.' });
    const song = body.song || {};
    const title = String(song.title || '').trim();
    if (!title || title.length > 300) return json_({ ok: false, error: 'Valid title required.' });
    const slides = Array.isArray(song.slides) ? song.slides : [];
    if (!slides.length || slides.some(s => typeof s.text !== 'string')) {
      return json_({ ok: false, error: 'Slides with full text are required.' });
    }
    const id = String(song.id || Utilities.getUuid()).trim();
    const joined = slides.map(s => '[' + String(s.label || 'Verse') + ']\n' + s.text).join('\n\n');
    if (joined.length > 45000 || JSON.stringify(slides).length > 45000) {
      return json_({ ok: false, error: 'Lyrics exceed Google Sheets cell size limit.' });
    }
    lock.waitLock(15000);
    const sheet = getLyricsSheet_();
    const last = sheet.getLastRow();
    const ids = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues().flat().map(String) : [];
    const at = ids.indexOf(id);
    const row = at >= 0 ? at + 2 : last + 1;
    sheet.getRange(row, 1, 1, CONFIG.columns.length).setValues([[
      id, title, String(song.artist || ''), String(song.language || 'en'),
      String(song.key || ''), joined, JSON.stringify(slides),
      String(song.tags || ''), 'published', new Date().toISOString()
    ]]);
    return json_({ ok: true, id, updated: at >= 0 });
  } catch (error) {
    return json_({ ok: false, error: 'Could not save song.' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
