import React, { useEffect, useMemo, useRef, useState } from 'react';

const CHANNEL_NAME = 'praise-lyrics-live-v1';
const STORAGE_KEY = 'praise-lyrics-state-v1';

const DEFAULT_GRADIENTS = [
  { name: 'Midnight', value: 'linear-gradient(135deg,#020617 0%,#111827 45%,#1e293b 100%)' },
  { name: 'Deep Blue', value: 'linear-gradient(135deg,#07152e 0%,#0f2f57 55%,#09111f 100%)' },
  { name: 'Royal Purple', value: 'linear-gradient(135deg,#13071f 0%,#3b1767 50%,#12051e 100%)' },
  { name: 'Warm Amber', value: 'linear-gradient(135deg,#1d0d03 0%,#6b2c0b 48%,#f59e0b 130%)' },
  { name: 'Forest', value: 'linear-gradient(135deg,#04140b 0%,#0f3d24 55%,#092017 100%)' },
  { name: 'Rose', value: 'linear-gradient(135deg,#250812 0%,#6b1738 50%,#1d0711 100%)' },
  { name: 'Slate', value: 'linear-gradient(135deg,#0b0f15 0%,#2b3441 52%,#0f141b 100%)' },
  { name: 'Pure Black', value: '#000000' },
];

const FREE_BACKGROUND_LINKS = [
  { label: 'Sunrise Mountains', url: 'https://unsplash.com/s/photos/sunrise-mountain' },
  { label: 'Christian Cross', url: 'https://unsplash.com/s/photos/cross' },
  { label: 'Church Backgrounds', url: 'https://unsplash.com/s/photos/church-background' },
  { label: 'Worship', url: 'https://unsplash.com/s/photos/worship' },
  { label: 'Hands Raised', url: 'https://unsplash.com/s/photos/hands-raised-in-worship' },
  { label: 'Mountains', url: 'https://unsplash.com/s/photos/mountains' },
  { label: 'Ocean', url: 'https://unsplash.com/s/photos/ocean' },
  { label: 'Clouds', url: 'https://unsplash.com/s/photos/clouds' },
  { label: 'Forest', url: 'https://unsplash.com/s/photos/forest' },
  { label: 'Night Sky', url: 'https://unsplash.com/s/photos/night-sky' },
  { label: 'Sunset', url: 'https://unsplash.com/s/photos/sunset' },
  { label: 'Light Rays', url: 'https://unsplash.com/s/photos/light-rays' },
];

const DEFAULT_SONG = {
  id: crypto.randomUUID(),
  title: 'Amazing Grace',
  slides: [
    {
      id: crypto.randomUUID(),
      label: 'Verse 1',
      text: 'Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.',
    },
    {
      id: crypto.randomUUID(),
      label: 'Verse 2',
      text: "'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed.",
    },
  ],
};

const DEFAULT_STYLE = {
  background: '#000000',
  backgroundImage: '',
  overlay: 0.48,
  textColor: '#ffffff',
  fontSize: 72,
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontWeight: 700,
  textAlign: 'center',
  lineHeight: 1.22,
  textShadow: true,
  maxWidth: 88,
};

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getSlideStyle(song, slideIndex, style) {
  const slide = song?.slides?.[slideIndex];
  if (!slide) return style;
  return {
    ...style,
    background: slide.background ?? style.background,
    backgroundImage: slide.backgroundImage ?? style.backgroundImage,
  };
}

function buildLivePayload(song, slideIndex, style, blank) {
  return {
    type: 'LIVE_UPDATE',
    at: Date.now(),
    songTitle: song?.title || '',
    slide: !blank && song?.slides?.[slideIndex] ? song.slides[slideIndex] : null,
    style: getSlideStyle(song, slideIndex, style),
    blank,
  };
}

function BroadcastBridge({ onMessage }) {
  useEffect(() => {
    if (!('BroadcastChannel' in window)) return undefined;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => onMessage(event.data);
    return () => channel.close();
  }, [onMessage]);
  return null;
}

function DisplayView() {
  const [live, setLive] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`${STORAGE_KEY}:live`)) || buildLivePayload(null, 0, DEFAULT_STYLE, true);
    } catch {
      return buildLivePayload(null, 0, DEFAULT_STYLE, true);
    }
  });

  const receive = React.useCallback((payload) => {
    if (payload?.type === 'LIVE_UPDATE') setLive(payload);
  }, []);

  useEffect(() => {
    const storageHandler = (event) => {
      if (event.key !== `${STORAGE_KEY}:live` || !event.newValue) return;
      try {
        setLive(JSON.parse(event.newValue));
      } catch {
        // Ignore malformed storage events.
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }, []);

  useEffect(() => {
    const requestFullscreen = () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    };
    window.addEventListener('click', requestFullscreen, { once: true });
    return () => window.removeEventListener('click', requestFullscreen);
  }, []);

  const style = live?.style || DEFAULT_STYLE;
  const backgroundStyle = style.backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,${style.overlay}),rgba(0,0,0,${style.overlay})), url("${style.backgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : { background: style.background || '#000' };

  return (
    <main className="display-root" style={backgroundStyle}>
      <BroadcastBridge onMessage={receive} />
      {!live.blank && live.slide && (
        <div
          className="display-lyrics"
          style={{
            color: style.textColor,
            fontSize: `clamp(36px, ${style.fontSize / 18}vw, ${style.fontSize * 1.3}px)`,
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight,
            textAlign: style.textAlign,
            lineHeight: style.lineHeight,
            width: `${style.maxWidth}vw`,
            textShadow: style.textShadow ? '0 4px 18px rgba(0,0,0,.95), 0 1px 3px rgba(0,0,0,1)' : 'none',
          }}
        >
          {live.slide.text}
        </div>
      )}
      <div className="display-click-hint">Click once if the browser asks to enter full screen</div>
    </main>
  );
}

function ControlView() {
  const saved = useMemo(() => loadSavedState(), []);
  const [songs, setSongs] = useState(saved?.songs?.length ? saved.songs : [DEFAULT_SONG]);
  const [songId, setSongId] = useState(saved?.songId || (saved?.songs?.[0]?.id ?? DEFAULT_SONG.id));
  const [liveIndex, setLiveIndex] = useState(saved?.liveIndex ?? 0);
  const [selectedIndex, setSelectedIndex] = useState(saved?.selectedIndex ?? 0);
  const [style, setStyle] = useState({ ...DEFAULT_STYLE, ...(saved?.style || {}) });
  const [blank, setBlank] = useState(saved?.blank ?? true);
  const [showSongEditor, setShowSongEditor] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [screenOptions, setScreenOptions] = useState([]);
  const [selectedScreenId, setSelectedScreenId] = useState(saved?.selectedScreenId || '');
  const [status, setStatus] = useState('Wall is not open yet.');
  const [imageUrl, setImageUrl] = useState('');
  const wallRef = useRef(null);

  const song = songs.find((item) => item.id === songId) || songs[0];
  const selectedSlide = song?.slides?.[selectedIndex];

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ songs, songId: song?.id, liveIndex, selectedIndex, style, blank, selectedScreenId })
    );
  }, [songs, songId, liveIndex, selectedIndex, style, blank, selectedScreenId, song?.id]);

  useEffect(() => {
    setImageUrl(selectedSlide?.backgroundImage || '');
  }, [selectedSlide?.id, selectedSlide?.backgroundImage]);

  const sendLive = React.useCallback(
    (nextIndex = liveIndex, nextBlank = blank, nextStyle = style) => {
      if (!song) return;
      const payload = buildLivePayload(song, nextIndex, nextStyle, nextBlank);
      localStorage.setItem(`${STORAGE_KEY}:live`, JSON.stringify(payload));
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage(payload);
        channel.close();
      }
    },
    [song, liveIndex, blank, style]
  );

  useEffect(() => {
    sendLive(liveIndex, blank, style);
  }, [style, sendLive, liveIndex, blank]);

  useEffect(() => {
    if (song && liveIndex >= song.slides.length) {
      setLiveIndex(Math.max(0, song.slides.length - 1));
      setSelectedIndex(Math.max(0, song.slides.length - 1));
    }
  }, [song, liveIndex]);

  useEffect(() => {
    const keyHandler = (event) => {
      const target = event.target;
      if (target?.matches?.('input, textarea, select')) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
      } else if (event.code === 'Space') {
        event.preventDefault();
        toggleBlank();
      } else if (/^[1-9]$/.test(event.key)) {
        const index = Number(event.key) - 1;
        if (song?.slides?.[index]) makeLive(index);
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  });

  function updateSong(mutator) {
    setSongs((current) => current.map((item) => (item.id === song.id ? mutator(item) : item)));
  }

  function updateSelectedSlide(changes) {
    if (!selectedSlide) return;
    updateSong((current) => ({
      ...current,
      slides: current.slides.map((slide, index) =>
        index === selectedIndex ? { ...slide, ...changes } : slide
      ),
    }));
  }

  function applyVerseBackground(background) {
    updateSelectedSlide({ background, backgroundImage: '' });
    setImageUrl('');
    setStatus(`${selectedSlide?.label || 'Selected verse'} background updated.`);
  }

  function makeLive(index) {
    if (!song?.slides?.[index]) return;
    setSelectedIndex(index);
    setLiveIndex(index);
    setBlank(false);
    sendLive(index, false, style);
  }

  function goNext() {
    if (!song?.slides?.length) return;
    makeLive(Math.min(song.slides.length - 1, liveIndex + 1));
  }

  function goPrevious() {
    if (!song?.slides?.length) return;
    makeLive(Math.max(0, liveIndex - 1));
  }

  function toggleBlank() {
    const next = !blank;
    setBlank(next);
    sendLive(liveIndex, next, style);
  }

  async function detectScreens() {
    if (!window.getScreenDetails) {
      setStatus('This browser cannot list screens. Use Chrome/Edge and click Open Wall; you can move it to the TV wall manually.');
      return;
    }
    try {
      const details = await window.getScreenDetails();
      const mapped = details.screens.map((screen, index) => ({
        id: `${screen.left}:${screen.top}:${screen.width}:${screen.height}`,
        label: `${screen.label || `Display ${index + 1}`} — ${screen.width}×${screen.height}${screen.isPrimary ? ' (Primary)' : ''}`,
        left: screen.left,
        top: screen.top,
        width: screen.width,
        height: screen.height,
      }));
      setScreenOptions(mapped);
      if (!selectedScreenId && mapped.length) {
        const nonPrimary = details.screens.find((item) => !item.isPrimary) || details.screens[0];
        setSelectedScreenId(`${nonPrimary.left}:${nonPrimary.top}:${nonPrimary.width}:${nonPrimary.height}`);
      }
      setStatus(`Detected ${mapped.length} display${mapped.length === 1 ? '' : 's'}. Select the TV wall, then click Open Wall.`);
    } catch (error) {
      setStatus(`Screen permission was not granted: ${error?.message || 'unknown error'}`);
    }
  }

  async function openWall() {
    const selected = screenOptions.find((item) => item.id === selectedScreenId);
    const features = selected
      ? `popup=yes,left=${selected.left},top=${selected.top},width=${selected.width},height=${selected.height}`
      : 'popup=yes,width=1280,height=720';
    const displayUrl = `${window.location.origin}${import.meta.env.BASE_URL}?display=1`;
    wallRef.current = window.open(displayUrl, 'PraiseLyricsWall', features);
    if (!wallRef.current) {
      setStatus('The browser blocked the wall window. Allow popups for this site and try again.');
      return;
    }
    try {
      wallRef.current.focus();
      if (selected) {
        wallRef.current.moveTo(selected.left, selected.top);
        wallRef.current.resizeTo(selected.width, selected.height);
      }
    } catch {
      // Browsers may block moving windows until permission is granted.
    }
    setStatus(selected ? `Wall opened on ${selected.label}.` : 'Wall opened. Move it to the TV wall if needed.');
    setTimeout(() => sendLive(liveIndex, blank, style), 500);
  }

  function addSlide() {
    const slide = { id: crypto.randomUUID(), label: `Verse ${song.slides.length + 1}`, text: 'Type lyrics here' };
    updateSong((current) => ({ ...current, slides: [...current.slides, slide] }));
    setEditingSlide(slide.id);
    setSelectedIndex(song.slides.length);
  }

  function duplicateSlide(index) {
    const original = song.slides[index];
    if (!original) return;
    const copy = { ...original, id: crypto.randomUUID(), label: `${original.label} Copy` };
    updateSong((current) => {
      const slides = [...current.slides];
      slides.splice(index + 1, 0, copy);
      return { ...current, slides };
    });
  }

  function deleteSlide(index) {
    if (!song.slides[index]) return;
    updateSong((current) => ({ ...current, slides: current.slides.filter((_, i) => i !== index) }));
    setSelectedIndex(Math.max(0, index - 1));
    setLiveIndex((current) => Math.max(0, Math.min(current, song.slides.length - 2)));
  }

  function moveSlide(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= song.slides.length) return;
    updateSong((current) => {
      const slides = [...current.slides];
      [slides[index], slides[target]] = [slides[target], slides[index]];
      return { ...current, slides };
    });
    setSelectedIndex(target);
    if (liveIndex === index) setLiveIndex(target);
    else if (liveIndex === target) setLiveIndex(index);
  }

  function saveSlide(id, next) {
    updateSong((current) => ({
      ...current,
      slides: current.slides.map((slide) => (slide.id === id ? { ...slide, ...next } : slide)),
    }));
    setEditingSlide(null);
  }

  function newSong() {
    const next = { id: crypto.randomUUID(), title: 'New Song', slides: [] };
    setSongs((current) => [...current, next]);
    setSongId(next.id);
    setSelectedIndex(0);
    setLiveIndex(0);
    setBlank(true);
    setShowSongEditor(true);
  }

  function deleteSong() {
    if (songs.length === 1) return;
    const nextSongs = songs.filter((item) => item.id !== song.id);
    setSongs(nextSongs);
    setSongId(nextSongs[0].id);
    setLiveIndex(0);
    setSelectedIndex(0);
    setBlank(true);
  }

  function applyImageUrl() {
    const next = imageUrl.trim();
    updateSelectedSlide({ backgroundImage: next });
    setStatus(`${selectedSlide?.label || 'Selected verse'} image background updated.`);
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setStatus('That image is larger than 4 MB. Please use a smaller image so browser storage stays reliable.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setImageUrl(dataUrl);
      updateSelectedSlide({ backgroundImage: dataUrl });
      setStatus(`${selectedSlide?.label || 'Selected verse'} image background updated.`);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">PraiseLyrics</div>
          <h1>Church Lyrics Control</h1>
          <p>Control everything here. The 3×3 TV wall only receives the live lyrics.</p>
        </div>
        <div className="topbar-actions">
          <button className="secondary" onClick={detectScreens}>Detect Displays</button>
          <button className="primary" onClick={openWall}>Open Wall</button>
          <button className={blank ? 'danger active' : 'danger'} onClick={toggleBlank}>{blank ? 'Show Lyrics' : 'Blank Wall'}</button>
        </div>
      </header>

      <div className="statusbar">
        <span className={blank ? 'dot muted' : 'dot live'} />
        <strong>{blank ? 'WALL BLANK' : `LIVE: ${song?.slides?.[liveIndex]?.label || 'No slide'}`}</strong>
        <span>{status}</span>
      </div>

      <div className="workspace">
        <aside className="sidebar panel">
          <div className="section-head">
            <div>
              <span className="section-label">Song Library</span>
              <h2>{songs.length} song{songs.length === 1 ? '' : 's'}</h2>
            </div>
            <button className="icon-button" onClick={newSong} title="New song">＋</button>
          </div>

          <div className="song-list">
            {songs.map((item) => (
              <button
                key={item.id}
                className={`song-item ${item.id === song.id ? 'selected' : ''}`}
                onClick={() => {
                  setSongId(item.id);
                  setLiveIndex(0);
                  setSelectedIndex(0);
                  setBlank(true);
                }}
              >
                <strong>{item.title}</strong>
                <span>{item.slides.length} slide{item.slides.length === 1 ? '' : 's'}</span>
              </button>
            ))}
          </div>

          <div className="sidebar-actions">
            <button className="secondary full" onClick={() => setShowSongEditor(true)}>Rename Song</button>
            <button className="ghost full" disabled={songs.length === 1} onClick={deleteSong}>Delete Song</button>
          </div>

          <div className="screen-box">
            <span className="section-label">TV Wall</span>
            <select value={selectedScreenId} onChange={(event) => setSelectedScreenId(event.target.value)}>
              <option value="">Choose after Detect Displays</option>
              {screenOptions.map((screen) => <option key={screen.id} value={screen.id}>{screen.label}</option>)}
            </select>
            <small>If Windows sees all 9 TVs as one wall, it should appear here as one display.</small>
          </div>
        </aside>

        <section className="main-column">
          <div className="panel verses-panel">
            <div className="section-head wide">
              <div>
                <span className="section-label">Service Control</span>
                <h2>{song?.title}</h2>
              </div>
              <div className="mini-actions">
                <button className="secondary" onClick={goPrevious}>← Previous</button>
                <button className="secondary" onClick={goNext}>Next →</button>
                <button className="primary" onClick={addSlide}>＋ Add Verse</button>
              </div>
            </div>

            <div className="verse-strip">
              {song?.slides?.map((slide, index) => {
                const cardBackground = slide.backgroundImage
                  ? `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)), url("${slide.backgroundImage}")`
                  : slide.background;
                return (
                <article
                  key={slide.id}
                  className={`verse-card ${index === liveIndex && !blank ? 'live-card' : ''} ${index === selectedIndex ? 'selected-card' : ''}`}
                  style={cardBackground ? { background: cardBackground, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                  onClick={() => setSelectedIndex(index)}
                  onDoubleClick={() => setEditingSlide(slide.id)}
                >
                  <div className="verse-card-head">
                    <span>{slide.label}</span>
                    {index === liveIndex && !blank && <strong>LIVE</strong>}
                  </div>
                  <p>{slide.text}</p>
                  <div className="verse-card-actions">
                    <button onClick={(event) => { event.stopPropagation(); makeLive(index); }}>Send</button>
                    <button onClick={(event) => { event.stopPropagation(); setEditingSlide(slide.id); }}>Edit</button>
                    <button onClick={(event) => { event.stopPropagation(); duplicateSlide(index); }}>Copy</button>
                    <button onClick={(event) => { event.stopPropagation(); moveSlide(index, -1); }}>←</button>
                    <button onClick={(event) => { event.stopPropagation(); moveSlide(index, 1); }}>→</button>
                    <button className="delete" onClick={(event) => { event.stopPropagation(); deleteSlide(index); }}>Delete</button>
                  </div>
                </article>
              )})}

              {!song?.slides?.length && (
                <button className="empty-card" onClick={addSlide}>＋ Add the first verse</button>
              )}
            </div>

            <div className="keyboard-help">Keyboard: ← Previous · → Next · Space Blank/Show · 1–9 jump directly to a slide</div>
          </div>

          <div className="lower-grid">
            <div className="panel appearance-panel">
              <div className="section-head">
                <div>
                  <span className="section-label">Wall Appearance</span>
                  <h2>Background for {selectedSlide?.label || 'Selected Verse'}</h2>
                </div>
              </div>

              <div className="gradient-grid">
                {DEFAULT_GRADIENTS.map((preset) => (
                  <button
                    key={preset.name}
                    title={`Apply ${preset.name} to ${selectedSlide?.label || 'selected verse'}`}
                    className="gradient-swatch"
                    style={{ background: preset.value }}
                    onClick={() => applyVerseBackground(preset.value)}
                  >
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>

              <div className="control-grid">
                <label>Text color<input type="color" value={style.textColor} onChange={(event) => setStyle((current) => ({ ...current, textColor: event.target.value }))} /></label>
                <label>Font size<input type="range" min="38" max="140" value={style.fontSize} onChange={(event) => setStyle((current) => ({ ...current, fontSize: Number(event.target.value) }))} /><span>{style.fontSize}px</span></label>
                <label>Overlay<input type="range" min="0" max="0.85" step="0.05" value={style.overlay} onChange={(event) => setStyle((current) => ({ ...current, overlay: Number(event.target.value) }))} /><span>{Math.round(style.overlay * 100)}%</span></label>
                <label>Width<input type="range" min="50" max="96" value={style.maxWidth} onChange={(event) => setStyle((current) => ({ ...current, maxWidth: Number(event.target.value) }))} /><span>{style.maxWidth}%</span></label>
                <label>Font<select value={style.fontFamily} onChange={(event) => setStyle((current) => ({ ...current, fontFamily: event.target.value }))}><option value="Arial, Helvetica, sans-serif">Arial</option><option value="Georgia, serif">Georgia</option><option value="Verdana, sans-serif">Verdana</option><option value="Trebuchet MS, sans-serif">Trebuchet</option><option value="system-ui, sans-serif">System</option></select></label>
                <label>Alignment<select value={style.textAlign} onChange={(event) => setStyle((current) => ({ ...current, textAlign: event.target.value }))}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
              </div>

              <label className="checkbox-row"><input type="checkbox" checked={style.textShadow} onChange={(event) => setStyle((current) => ({ ...current, textShadow: event.target.checked }))} />Strong text shadow for readability</label>

              <div className="image-controls">
                <label>Background image URL<input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Paste a direct image URL" /></label>
                <button className="secondary" onClick={applyImageUrl}>Use on Selected Verse</button>
                <label className="upload-button">Upload Image for Selected Verse<input type="file" accept="image/*" onChange={handleImageUpload} /></label>
                <button className="ghost" onClick={() => { setImageUrl(''); updateSelectedSlide({ backgroundImage: '' }); }}>Clear Verse Image</button>
              </div>
            </div>

            <div className="panel background-panel">
              <div className="section-head">
                <div>
                  <span className="section-label">Free Background Sources</span>
                  <h2>Find Worship Images</h2>
                </div>
              </div>
              <p className="panel-copy">Select a verse first. Then choose a color above or download a free image and upload it. Each verse can have its own background, and it stays saved locally on this PC.</p>
              <div className="background-links">
                {FREE_BACKGROUND_LINKS.map((item) => (
                  <a key={item.url} href={item.url} target="_blank" rel="noreferrer">{item.label}<span>↗</span></a>
                ))}
              </div>
              <div className="tip-box"><strong>How it works:</strong> click a verse card, then click a color or upload an image. Only that selected verse changes.</div>
            </div>
          </div>
        </section>
      </div>

      {editingSlide && (
        <SlideEditor
          slide={song.slides.find((item) => item.id === editingSlide)}
          onClose={() => setEditingSlide(null)}
          onSave={(next) => saveSlide(editingSlide, next)}
        />
      )}

      {showSongEditor && (
        <SongEditor
          title={song.title}
          onClose={() => setShowSongEditor(false)}
          onSave={(title) => {
            updateSong((current) => ({ ...current, title }));
            setShowSongEditor(false);
          }}
        />
      )}
    </div>
  );
}

function SlideEditor({ slide, onClose, onSave }) {
  const [label, setLabel] = useState(slide?.label || 'Verse');
  const [text, setText] = useState(slide?.text || '');
  if (!slide) return null;
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head"><div><span className="section-label">Edit Slide</span><h2>{slide.label}</h2></div><button className="icon-button" onClick={onClose}>×</button></div>
        <label>Label<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Verse 1 / Chorus / Bridge" /></label>
        <label>Lyrics<textarea rows="10" value={text} onChange={(event) => setText(event.target.value)} /></label>
        <div className="modal-actions"><button className="ghost" onClick={onClose}>Cancel</button><button className="primary" onClick={() => onSave({ label: label.trim() || 'Verse', text })}>Save Slide</button></div>
      </div>
    </div>
  );
}

function SongEditor({ title, onClose, onSave }) {
  const [value, setValue] = useState(title);
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal small" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head"><div><span className="section-label">Song</span><h2>Rename Song</h2></div><button className="icon-button" onClick={onClose}>×</button></div>
        <label>Song title<input autoFocus value={value} onChange={(event) => setValue(event.target.value)} /></label>
        <div className="modal-actions"><button className="ghost" onClick={onClose}>Cancel</button><button className="primary" onClick={() => onSave(value.trim() || 'Untitled Song')}>Save</button></div>
      </div>
    </div>
  );
}

export default function App() {
  const isDisplay = new URLSearchParams(window.location.search).get('display') === '1';
  return isDisplay ? <DisplayView /> : <ControlView />;
}
