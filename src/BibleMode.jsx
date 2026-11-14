import React, { useEffect, useMemo, useRef, useState } from 'react';
import './BibleMode.css';
import { readPrivateBible, savePrivateBible, parsePrivateBible, getPrivateChapter } from './privateBible.js';

const TRANSLATIONS = [
  { code: 'NKJV', label: '⭐ English — NKJV (local import)' },
  { code: 'KJV', label: '🇺🇸 English — KJV' },
  { code: 'ALMEIDA-RC', label: '🇧🇷 Português — Almeida' },
  { code: 'RV1909', label: '🇪🇸 Español — Reina-Valera 1909' },
];

async function requestBible(params, signal) {
  const url = new URL('/api/bible', window.location.origin);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetch(url, { signal });
  const body = await response.json();
  if (!response.ok || !body.ok) throw new Error(body.error || 'Bible is unavailable.');
  return body;
}

export default function BibleMode({ style, setStyle, onBack, onOpenWall, onSendBible, onBlankBible }) {
  const [translation, setTranslation] = useState('KJV');
  const [privateBible, setPrivateBible] = useState(null);
  const [privateBibleStatus, setPrivateBibleStatus] = useState('');
  const [importing, setImporting] = useState(false);
  const [books, setBooks] = useState([]);
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState(1);
  const [verseNumber, setVerseNumber] = useState(1);
  const [verses, setVerses] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [error, setError] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [settingsPin, setSettingsPin] = useState('');
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/bible-settings', { signal: controller.signal, cache: 'no-store' })
      .then(async r => {const data = await r.json(); if(!r.ok || !data.ok) throw Error(data.error || 'Could not load Bible settings'); return data;})
      .then(data => { if (data.settings && !controller.signal.aborted) setStyle(current => ({ ...current, ...data.settings })); })
      .catch(e => { if(e.name!=='AbortError') setSettingsMessage('Using local Bible settings. Cloud: '+e.message); });
    return () => controller.abort();
  }, [setStyle]);

  async function saveBibleSettings(e) {
    e.preventDefault();
    if (!/^\d{4}$/.test(settingsPin)) { setSettingsMessage('Enter your four-digit PIN.'); return; }
    if (style.backgroundImage && !/^https:\/\//i.test(style.backgroundImage)) {
      setSettingsMessage('Use an HTTPS image URL for the background.'); return;
    }
    setSettingsBusy(true);
    setSettingsMessage('');
    try {
      const res = await fetch('/api/bible-settings', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ pin:settingsPin, settings:style })
      });
      const result = await res.json();
      if (!res.ok || !result.ok) throw Error(result.error || 'Unable to save Bible settings');
      setSettingsMessage('✓ Bible settings saved in the Bible Settings tab.');
      setPinPromptOpen(false);
      setShowAppearance(false);
    } catch(e){setSettingsMessage(e.message || 'Save failed');}
    finally {setSettingsPin('');setSettingsBusy(false);}
  }

  const [retryCount, setRetryCount] = useState(0);
  const chooseLastAfterLoad = useRef(false);
  const nextRequest = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingBooks(true);
    setError('');
    setBooks([]);
    setBook('');
    setVerses([]);
    setChapter(1);
    setVerseNumber(1);
    setIsLive(false);
    (translation === 'NKJV'
      ? readPrivateBible('NKJV').then(bible => {
          if (!bible) throw new Error('Import your NKJV JSON file below to enable this translation on this device.');
          if (!controller.signal.aborted) setPrivateBible(bible);
          return { books: bible.books };
        })
      : requestBible({ action: 'books', translation }, controller.signal)
    ).then((data) => {
        if (controller.signal.aborted) return;
        const available = data.books || [];
        setBooks(available);
        setBook(available.find(b => /^(John|João|Juan)$/i.test(b.name))?.name || available[0]?.name || '');
      })
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoadingBooks(false); });
    return () => controller.abort();
  }, [translation, retryCount, privateBible?.importedAt]);

  useEffect(() => {
    if (!book) return undefined;
    const controller = new AbortController();
    const id = ++nextRequest.current;
    setLoadingChapter(true);
    setVerses([]);
    setError('');
    (translation === 'NKJV'
      ? Promise.resolve(getPrivateChapter(privateBible, book, chapter))
      : requestBible({ action: 'chapter', translation, book, chapter }, controller.signal)
    ).then((data) => {
        if (id !== nextRequest.current) return;
        const list = (data.verses || []).filter(v => Number.isInteger(Number(v.number)));
        setVerses(list);
        setVerseNumber(chooseLastAfterLoad.current && list.length ? list[list.length - 1].number : 1);
        chooseLastAfterLoad.current = false;
      })
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoadingChapter(false); });
    return () => controller.abort();
  }, [translation, book, chapter, privateBible]);

  const bookIndex = books.findIndex(b => b.name === book);
  const totalChapters = books[bookIndex]?.chapters || 1;
  const selectedVerse = useMemo(() => verses.find(v => v.number === Number(verseNumber)), [verses, verseNumber]);
  const reference = `${book} ${chapter}:${verseNumber}`;
  const canSend = Boolean(selectedVerse?.text) && !loadingChapter && !error;

  async function importNKJV(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setPrivateBibleStatus('Reading your authorized NKJV copy locally…');
    try {
      if (file.size > 20 * 1024 * 1024) throw Error('Please select a Bible JSON file smaller than 20 MB.');
      const contents = JSON.parse(await file.text());
      const bible = parsePrivateBible(contents);
      await savePrivateBible('NKJV', bible);
      setPrivateBible(bible);
      setTranslation('NKJV');
      setRetryCount(count => count + 1);
      setPrivateBibleStatus('✓ NKJV imported and saved in this browser. It is never uploaded.');
      setError('');
    } catch (error) {
      setPrivateBibleStatus(error.message || 'Could not import NKJV.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  }

  function chooseBook(name) { chooseLastAfterLoad.current = false; setIsLive(false); setBook(name); setChapter(1); setVerseNumber(1); }
  function chooseChapter(number) { chooseLastAfterLoad.current = false; setIsLive(false); setChapter(number); setVerseNumber(1); }
  function chooseVerse(number) { setIsLive(false); setVerseNumber(number); }

  function advance(direction) {
    if (loadingBooks || loadingChapter || !books.length || !verses.length) return;
    const idx = verses.findIndex(v => v.number === Number(verseNumber));
    const next = idx + direction;
    if (next >= 0 && next < verses.length) { chooseVerse(verses[next].number); return; }
    if (direction > 0) {
      if (chapter < totalChapters) chooseChapter(chapter + 1);
      else if (bookIndex + 1 < books.length) chooseBook(books[bookIndex + 1].name);
    } else if (chapter > 1) {
      chooseLastAfterLoad.current = true;
      setIsLive(false);
      setChapter(chapter - 1);
    } else if (bookIndex > 0) {
      const prev = books[bookIndex - 1];
      chooseLastAfterLoad.current = true;
      setIsLive(false);
      setBook(prev.name);
      setChapter(prev.chapters);
    }
  }

  function sendSelected() {
    if (!canSend) return;
    liveVerseRef.current = { reference, text: selectedVerse.text, translation };
    onSendBible(liveVerseRef.current);
    setIsLive(true);
  }

  function openBibleWall() {
    onOpenWall();
    // The browser display may still be mounting when window.open returns.
    if (canSend) {
      const current = { reference, text: selectedVerse.text, translation };
      liveVerseRef.current = current;
      setIsLive(true);
      setTimeout(() => onSendBible(current), 1000);
    }
  }

  useEffect(() => {
    const handleKey = (event) => {
      if (event.target?.closest?.('input,select,textarea,button') || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); advance(1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); advance(-1); }
      else if (event.key === 'Enter' && canSend) { event.preventDefault(); sendSelected(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const changeStyle = (key, value) => setStyle(current => ({ ...current, [key]: value }));
  // Live wall follows Bible appearance changes immediately, without an extra Show button.
  const liveVerseRef = useRef(null);
  useEffect(() => {
    if (isLive && liveVerseRef.current) onSendBible(liveVerseRef.current);
  }, [style]);


  return (
    <div className="app-shell bible-shell">
      <header className="bible-topbar">
        <div>
          <div className="eyebrow">PRAISELYRICS · SCRIPTURE</div>
          <h1>Bible Presenter</h1>
          <p>Choose a book, chapter and verse — one verse per TV screen.</p>
        </div>
        <div className="bible-topbar-actions">
          <button className="secondary" onClick={onBack}>♫ Back to Lyrics</button>
          <button className="secondary" onClick={() => setShowAppearance(current => !current)} aria-expanded={showAppearance}>⚙ Display Settings</button>
          <button className="primary" onClick={openBibleWall}>Open Wall</button>
          <button className="danger" onClick={() => { onBlankBible(); setIsLive(false); }}>Blank Wall</button>
        </div>
      </header>

      {pinPromptOpen && (
        <div className="global-pin-overlay" onMouseDown={e => {if(e.target===e.currentTarget && !settingsBusy) setPinPromptOpen(false);}}>
          <form className="global-pin-dialog" role="dialog" aria-modal="true" aria-label="Save Bible Settings" onSubmit={saveBibleSettings}>
            <strong>Save Bible Settings</strong>
            <p>Enter the settings PIN to save only Bible appearance to Google Sheets.</p>
            <input autoFocus type="password" inputMode="numeric" maxLength={4} pattern="[0-9]{4}" autoComplete="off"
              value={settingsPin} onChange={e=>setSettingsPin(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="••••" aria-label="4-digit PIN"/>
            {settingsMessage && <small role="status">{settingsMessage}</small>}
            <div className="global-settings-actions">
              <button type="submit" className="global-confirm" disabled={settingsBusy || settingsPin.length!==4}>{settingsBusy?'Saving…':'Confirm & Save'}</button>
              <button type="button" className="secondary" onClick={()=>{setSettingsPin('');setPinPromptOpen(false);}}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      <main className="bible-workspace">
        <section className="panel bible-navigator">
          <div className="bible-mode-label">SELECT SCRIPTURE</div>
          <label>Translation
            <select value={translation} onChange={e => setTranslation(e.target.value)}>
              {TRANSLATIONS.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </label>
          {translation === 'NKJV' && (
            <div className="bible-import-nkjv">
              <label className="bible-import-file">
                {importing ? 'Importing NKJV…' : '⬆ Import your NKJV .json'}
                <input type="file" accept=".json,application/json" disabled={importing} onChange={importNKJV}/>
              </label>
              <small>Your own NKJV copy is stored only in this browser, never on our servers. It must be a complete VerseFlow-style JSON file.</small>
              {privateBibleStatus && <small role="status">{privateBibleStatus}</small>}
            </div>
          )}
          <label>Book
            <select value={book} disabled={!books.length || loadingBooks} onChange={e => chooseBook(e.target.value)}>
              {books.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
          </label>
          <div className="bible-chooser-pair">
            <label>Chapter
              <select value={chapter} disabled={!book || loadingChapter} onChange={e => chooseChapter(Number(e.target.value))}>
                {Array.from({ length: totalChapters }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
            </label>
            <label>Verse
              <select value={verseNumber} disabled={!verses.length || loadingChapter} onChange={e => chooseVerse(Number(e.target.value))}>
                {verses.map(v => <option key={v.number} value={v.number}>{v.number}</option>)}
              </select>
            </label>
          </div>
          <div className="bible-chapter-controls">
            <button className="secondary compact" disabled={loadingChapter || !books.length || (bookIndex === 0 && chapter === 1)} onClick={() => { if (chapter > 1) chooseChapter(chapter - 1); else if (bookIndex > 0) { setBook(books[bookIndex - 1].name); setChapter(books[bookIndex - 1].chapters); } }}>← Chapter</button>
            <span>Chapter {chapter} of {totalChapters}</span>
            <button className="secondary compact" disabled={loadingChapter || !books.length || (bookIndex === books.length - 1 && chapter === totalChapters)} onClick={() => { if (chapter < totalChapters) chooseChapter(chapter + 1); else if (bookIndex + 1 < books.length) chooseBook(books[bookIndex + 1].name); }}>Chapter →</button>
          </div>
          {loadingBooks || loadingChapter ? <p role="status" className="bible-status">Loading Scripture…</p> : null}
          {error && <p role="alert" className="bible-error">{error} <button className="secondary compact" onClick={() => setRetryCount(count => count + 1)}>Retry</button></p>}
          <small>Source: VERSE-FLOW. Public-domain translations load on demand. NKJV uses only a local copy you import with permission.</small>
        </section>

        <section className="panel bible-reading">
          <div className="bible-reading-head">
            <div>
              <div className="section-label">SCRIPTURE PREVIEW</div>
              <h2>{book ? reference : 'Choose a Bible passage'}</h2>
              <small>{TRANSLATIONS.find(t => t.code === translation)?.label}</small>
            </div>
            {isLive && <span className="bible-live">● LIVE</span>}
          </div>
          <div className="bible-reading-verse" style={{
            fontFamily: style.fontFamily, textAlign: style.textAlign, color: style.textColor,
            fontWeight: style.fontWeight, lineHeight: style.lineHeight,
            background: style.backgroundImage ? `linear-gradient(rgba(0,0,0,${style.overlay}),rgba(0,0,0,${style.overlay})),url("${style.backgroundImage}") center / cover` : (style.background || '#000')
          }}>
            <div className="bible-preview-text" style={{
              transform: `translateY(${Number(style.verticalOffset || 0) * 2.2}px)`,
              transition: 'transform 240ms ease-out, font-size 180ms ease-out',
              fontSize: `clamp(16px, ${Math.min(52, Number(style.fontSize||76)*0.54)}px, 60px)`,
              maxWidth: `${style.maxWidth || 88}%`,
              textShadow: style.textShadow ? '0 3px 5px rgba(0,0,0,.9)' : 'none'
            }}>
              {selectedVerse?.text || (loadingBooks || loadingChapter ? 'Loading…' : 'Select a verse to begin.')}
            </div>
          </div>
          <div className="bible-navigation-actions">
            <button className="secondary" disabled={loadingChapter || !verses.length} onClick={() => advance(-1)}>← Previous Verse</button>
            <button className="bible-send" disabled={!canSend} onClick={sendSelected}>Show Verse on TV</button>
            <button className="secondary" disabled={loadingChapter || !verses.length} onClick={() => advance(1)}>Next Verse →</button>
          </div>
          <p className="bible-navigation-hint">Keyboard: ← / → to change verses, Enter to show the selected verse.</p>
        </section>
      </main>
      <section className="bible-settings-dock" aria-label="Bible quick presentation settings">
        <div className="bible-dock-header">
          <div><strong>⚙ Bible Display</strong><small>Quick adjustments · Only affects Bible verses</small></div>
          <div className="bible-dock-header-actions">
            <button className="secondary compact" onClick={() => setShowAppearance(open => !open)} aria-expanded={showAppearance}>{showAppearance ? 'Hide More Settings' : 'More Settings'}</button>
            <button className="bible-send compact" onClick={() => { setPinPromptOpen(true); setSettingsMessage(''); }}>☁ Save Bible Settings</button>
          </div>
        </div>
        <div className="bible-quick-tools">
          <div className="bible-quick-control">
            <span>Text size <b>{style.fontSize}px</b></span>
            <div className="bible-quick-row">
              <button className="secondary compact" aria-label="Decrease Bible font size" onClick={() => changeStyle('fontSize', Math.max(24, Number(style.fontSize || 76) - 2))}>A−</button>
              <input type="range" min="24" max="160" step="1" aria-label="Bible font size" value={Math.min(160,Number(style.fontSize||76))} onChange={e=>changeStyle('fontSize',Number(e.target.value))}/>
              <button className="secondary compact" aria-label="Increase Bible font size" onClick={() => changeStyle('fontSize', Math.min(320, Number(style.fontSize || 76) + 2))}>A+</button>
            </div>
          </div>
          <div className="bible-quick-control bible-quick-position">
            <span>Move verse · Fine position <b>{Number(style.verticalOffset || 0).toFixed(2)}</b></span>
            <div className="bible-quick-row">
              <button className="secondary compact" aria-label="Move verse up slowly" title="Move up 0.5 units" onClick={() => changeStyle('verticalOffset', Math.max(-45, Number(style.verticalOffset || 0) - 0.5))}>↑ Up</button>
              <input type="range" min="-45" max="45" step="0.25" aria-label="Fine vertical position" value={Number(style.verticalOffset || 0)} onChange={e=>changeStyle('verticalOffset',Number(e.target.value))}/>
              <button className="secondary compact" aria-label="Move verse down slowly" title="Move down 0.5 units" onClick={() => changeStyle('verticalOffset', Math.min(45, Number(style.verticalOffset || 0) + 0.5))}>↓ Down</button>
              <button className="secondary compact" aria-label="Center verse vertically" onClick={() => changeStyle('verticalOffset',0)}>Center</button>
            </div>
            <small>Each click moves only 0.5vh. Drag the slider for 0.25vh precision.</small>
          </div>
          <div className="bible-quick-control bible-quick-colors">
            <span>Colors &amp; background</span>
            <div className="bible-quick-row">
              <label className="bible-quick-color" title="Text color">Text <input aria-label="Bible text color" type="color" value={style.textColor} onChange={e=>changeStyle('textColor',e.target.value)}/></label>
              <label className="bible-quick-color" title="Background color">BG <input aria-label="Bible background color" type="color" value={/^#[0-9a-f]{6}$/i.test(style.background||'')?style.background:'#000000'} onChange={e=>changeStyle('background',e.target.value)}/></label>
              <button className="secondary compact" onClick={()=>setShowAppearance(true)}>🖼 Image URL</button>
            </div>
          </div>
        </div>
        {settingsMessage && <small role="status" className="bible-settings-status">{settingsMessage}</small>}
        {showAppearance && (
        <section className="panel bible-appearance bible-advanced" aria-label="Bible display settings">
          <strong>Configurações exclusivas da Bíblia · Bible-only settings</strong>
          <div className="bible-settings-grid">
            <label>Font size: {style.fontSize}px
              <input type="range" min="24" max="320" value={style.fontSize} onChange={e => changeStyle('fontSize', Number(e.target.value))} />
            </label>
            <label>Vertical position: {style.verticalOffset || 0}
              <input type="range" min="-45" max="45" value={style.verticalOffset || 0} onChange={e => changeStyle('verticalOffset', Number(e.target.value))} />
            </label>
            <label>Text width: {style.maxWidth}%
              <input type="range" min="50" max="96" value={style.maxWidth} onChange={e => changeStyle('maxWidth', Number(e.target.value))} />
            </label>
            <label>Font
              <select value={style.fontFamily} onChange={e => changeStyle('fontFamily', e.target.value)}>
                <option value="Arial, Helvetica, sans-serif">Arial</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="Trebuchet MS, sans-serif">Trebuchet</option>
                <option value="system-ui, sans-serif">System</option>
              </select>
            </label>
            <label>Text color
              <input type="color" value={style.textColor} onChange={e => changeStyle('textColor', e.target.value)} />
            </label>
            <label>Alignment
              <select value={style.textAlign} onChange={e => changeStyle('textAlign', e.target.value)}>
                <option value="center">Center</option><option value="left">Left</option><option value="right">Right</option>
              </select>
            </label>
          </div>
          <div className="bible-settings-grid">
            <label>Background color
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(style.background || '') ? style.background : '#000000'} onChange={e => changeStyle('background',e.target.value)} />
            </label>
            <label>Background image URL (HTTPS)
              <input type="url" placeholder="https://example.com/background.jpg" value={style.backgroundImage || ''} onChange={e => changeStyle('backgroundImage', e.target.value)} />
            </label>
            <label>Image darkness: {Math.round((style.overlay || 0)*100)}%
              <input type="range" min="0" max="0.85" step="0.05" value={style.overlay || 0} onChange={e => changeStyle('overlay',Number(e.target.value))} />
            </label>
            <label>Line spacing: {style.lineHeight || 1.25}
              <input type="range" min="0.8" max="2.5" step="0.05" value={style.lineHeight || 1.25} onChange={e => changeStyle('lineHeight',Number(e.target.value))} />
            </label>
            <label>Font weight
              <select value={style.fontWeight || 700} onChange={e => changeStyle('fontWeight',Number(e.target.value))}>
                <option value="400">Normal</option><option value="600">Semibold</option><option value="700">Bold</option><option value="800">Extra bold</option>
              </select>
            </label>
            <label className="bible-checkbox"><input type="checkbox" checked={Boolean(style.textShadow)} onChange={e => changeStyle('textShadow',e.target.checked)}/> Text shadow</label>
          </div>
          <div className="bible-pos-buttons">
            <button className="secondary compact" onClick={() => changeStyle('verticalOffset', Math.max(-45, Number(style.verticalOffset || 0) - 4))}>↑ Up</button>
            <button className="secondary compact" onClick={() => changeStyle('verticalOffset', 0)}>Center</button>
            <button className="secondary compact" onClick={() => changeStyle('verticalOffset', Math.min(45, Number(style.verticalOffset || 0) + 4))}>↓ Down</button>
          </div>
          <div className="bible-cloud-actions">
            <button className="bible-send" type="button" onClick={() => { setPinPromptOpen(true); setSettingsMessage(''); }}>☁ Salvar somente a Bíblia</button>
            <button className="secondary" type="button" onClick={() => { setStyle({
              background:'#000000', backgroundImage:'', overlay:0.4, textColor:'#ffffff', fontSize:76,
              fontFamily:'Arial, Helvetica, sans-serif', fontWeight:700, textAlign:'center',
              lineHeight:1.25,textShadow:true,maxWidth:88,verticalOffset:0
            }); }}>Reset Bible appearance</button>
          </div>
          {settingsMessage && <small role="status">{settingsMessage}</small>}
          <small>Saved separately to the Google Sheets “Bible Settings” tab. Lyrics settings never change.</small>
        </section>
      )}
      </section>
    </div>
  );
}
