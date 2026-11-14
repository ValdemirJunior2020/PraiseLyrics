// The user's licensed Bible file remains in this browser's IndexedDB.
// Nothing in this module uploads or publishes NKJV text.
const DB_NAME = 'praiselyrics-private-bibles';
const STORE = 'translations';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('This browser cannot store a local Bible.'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Unable to open browser storage'));
  });
}
async function transaction(mode, operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = operation(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Local Bible storage failed'));
    tx.oncomplete = () => db.close();
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Bible storage transaction failed')); };
  });
}

export const readPrivateBible = (code) => transaction('readonly', store => store.get(code));
export const savePrivateBible = (code, bible) => transaction('readwrite', store => store.put(bible, code));

function clean(value) { return String(value ?? '').replace(/<[^>]*>/g, '').trim(); }
export function parsePrivateBible(payload) {
  let rows = [];
  if (Array.isArray(payload?.verses)) rows = payload.verses;
  else if (Array.isArray(payload)) rows = payload;
  else if (Array.isArray(payload?.books)) {
    rows = payload.books.flatMap(book =>
      (book.chapters || []).flatMap(chapter =>
        (chapter.verses || []).map(verse => ({
          book: book.name || book.book || book.book_name,
          chapter: chapter.chapter || chapter.number || chapter.nr,
          verse: verse.verse || verse.number || verse.nr,
          text: verse.text || verse.verse_text || verse.content,
        }))
      )
    );
  } else throw new Error('Unsupported format. Import VerseFlow NKJV JSON with a verses array.');

  const books = [];
  const index = new Map();
  let count = 0;
  for (const item of rows) {
    const book = clean(item?.book || item?.book_name);
    const chapter = Number(item?.chapter);
    const verse = Number(item?.verse);
    const text = clean(item?.text || item?.verse_text || item?.content);
    if (!book || !Number.isInteger(chapter) || chapter < 1 ||
        !Number.isInteger(verse) || verse < 1 || !text) continue;
    if (!index.has(book)) {
      index.set(book, new Map());
      books.push({ name: book, chapters: 0 });
    }
    const chapters = index.get(book);
    if (!chapters.has(chapter)) chapters.set(chapter, []);
    chapters.get(chapter).push({ number: verse, text });
    ++count;
  }
  if (count < 30000 || books.length < 66) {
    throw new Error('The selected file is incomplete. Please import a complete 66-book NKJV file.');
  }
  const normalized = [];
  for (const entry of books) {
    const chapters = index.get(entry.name);
    entry.chapters = Math.max(...chapters.keys());
    for (const [chapter, verses] of chapters) normalized.push({ book: entry.name, chapter, verses });
  }
  return { books, chapters: normalized, importedAt: new Date().toISOString() };
}

export function getPrivateChapter(bible, book, chapter) {
  const item = bible?.chapters?.find(x => x.book === book && x.chapter === Number(chapter));
  return { ok: true, verses: item?.verses || [] };
}
