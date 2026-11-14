// On-demand Bible chapter API. Only small JSON results reach the browser.
// Scripture source: ValdemirJunior2020/VERSE-FLOW bibles/bundled (read-only).
const TRANSLATIONS = Object.freeze({
  KJV: { file: 'kjv.json', label: 'English — King James Version', language: 'en' },
  'ALMEIDA-RC': { file: 'almeida_rc.json', label: 'Português — Almeida Revista e Corrigida', language: 'pt' },
  RV1909: { file: 'rv1909.json', label: 'Español — Reina-Valera 1909', language: 'es' },
});
const SOURCE = 'https://raw.githubusercontent.com/ValdemirJunior2020/VERSE-FLOW/main/bibles/bundled/';
const CACHE_MS = 30 * 60 * 1000;
const memo = new Map();
const pending = new Map();

const json = (data, status = 200) => Response.json(data, {
  status,
  headers: { 'cache-control': status === 200 ? 'public, max-age=120, s-maxage=900' : 'no-store' }
});

async function getTranslation(code) {
  const cached = memo.get(code);
  if (cached && cached.expires > Date.now()) return cached.data;
  if (pending.has(code)) return pending.get(code);
  const task = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 22000);
    try {
      const response = await fetch(SOURCE + TRANSLATIONS[code].file, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'PraiseLyricsBible/1.0' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error('VERSE-FLOW source is unavailable');
      const bible = await response.json();
      if (!Array.isArray(bible.verses) || bible.verses.length < 30000) throw new Error('Invalid or incomplete Bible');
      const bookMap = new Map();
      for (const v of bible.verses) {
        const book = String(v.book || '').trim();
        const chapter = Number(v.chapter);
        const verse = Number(v.verse);
        if (!book || !Number.isInteger(chapter) || chapter < 1 || !Number.isInteger(verse) || verse < 1) continue;
        if (!bookMap.has(book)) bookMap.set(book, new Map());
        const chapters = bookMap.get(book);
        if (!chapters.has(chapter)) chapters.set(chapter, []);
        chapters.get(chapter).push({ number: verse, text: String(v.text || '') });
      }
      const books = [...bookMap].map(([name, chapters]) => ({
        name, chapters: Math.max(...chapters.keys())
      }));
      if (books.length < 66) throw new Error('Bible has missing books');
      const data = { books, bookMap };
      memo.set(code, { data, expires: Date.now() + CACHE_MS });
      return data;
    } finally { clearTimeout(timer); }
  })().finally(() => pending.delete(code));
  pending.set(code, task);
  return task;
}

export default async function handler(request) {
  if (request.method !== 'GET') return json({ ok: false, error: 'Method not allowed' }, 405);
  const url = new URL(request.url);
  const translation = url.searchParams.get('translation') || 'KJV';
  if (!Object.hasOwn(TRANSLATIONS, translation)) return json({ ok: false, error: 'Unsupported Bible translation' }, 400);
  const action = url.searchParams.get('action') || 'books';
  if (!['books', 'chapter'].includes(action)) return json({ ok: false, error: 'Unknown Bible action' }, 400);
  try {
    const bible = await getTranslation(translation);
    const info = TRANSLATIONS[translation];
    if (action === 'books') return json({ ok: true, translation, label: info.label, books: bible.books });
    const book = url.searchParams.get('book') || '';
    const chapter = Number(url.searchParams.get('chapter') || 0);
    const chapters = bible.bookMap.get(book);
    if (!chapters || !Number.isInteger(chapter) || !chapters.has(chapter)) {
      return json({ ok: false, error: 'Book or chapter not found' }, 404);
    }
    return json({
      ok: true, translation, book, chapter,
      totalChapters: Math.max(...chapters.keys()),
      verses: chapters.get(chapter)
    });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Bible source unavailable' }, 502);
  }
}
export const config = { path: '/api/bible' };
