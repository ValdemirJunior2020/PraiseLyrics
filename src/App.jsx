import React, { useCallback, useEffect, useRef, useState } from 'react';
import { STARTER_LYRICS, mergeStarterLyrics } from './starterLyrics.js';

const CHANNEL_NAME = 'praise-lyrics-live-v2';
const LIBRARY_FILE = 'PraiseLyrics-Library.json';
const HANDLE_DB = 'praise-lyrics-permissions';
const HANDLE_STORE = 'handles';
const HANDLE_KEY = 'lyrics-folder';
const TODAY_HANDLE_KEY = 'today-lyrics-folder';
const BROWSER_BACKUP_KEY = 'praise-lyrics-browser-backup-v1';

function localDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayLyricsFileName(dateKey = localDateKey()) {
  return `Todays-Lyrics-${dateKey}.json`;
}

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

const DEFAULT_LYRICS = {
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
  verticalOffset: 0,
};

const COPY = {
  en: {
    appTitle: 'Church Lyrics Control',
    appSubtitle: 'Control everything here. The TV wall only receives the live lyrics.',
    detect: 'Detect Displays',
    openWall: 'Open Wall',
    openLocalLyrics: 'Open Local Lyrics',
    localLyricsOpened: 'Local lyrics opened ✓',
    localLyricsError: 'Could not open that lyrics file.',
    fullscreenHint: 'Click anywhere once to make the wall full screen',
    showLyrics: 'Show Lyrics',
    blankWall: 'Blank Wall',
    wallBlank: 'WALL BLANK',
    live: 'LIVE',
    library: 'Lyrics Library',
    lyricsCount: (n) => `${n} ${n === 1 ? 'Lyrics' : 'Lyrics'}`,
    newLyrics: 'New Lyrics',
    renameLyrics: 'Rename Lyrics',
    deleteLyrics: 'Delete Lyrics',
    chooseFolder: 'Choose Lyrics Folder',
    saveToFolder: 'Save Current Lyrics',
    todayLyrics: 'Lyrics for Today',
    createToday: "Create Today's Lyrics",
    openToday: 'Open Lyrics for Today',
    addToToday: 'Add to Today',
    removeFromToday: 'Remove',
    backToLibrary: 'Back to Library',
    clearToday: 'Clear Today',
    todayEmpty: 'No lyrics planned for today yet.',
    folderHelp: 'Choose Downloads once. PraiseLyrics will save the complete library there automatically.',
    tvWall: 'TV Wall',
    chooseDisplay: 'Choose after Detect Displays',
    displayHelp: 'If Windows sees all TVs as one wall, it should appear here as one display.',
    serviceControl: 'Service Control',
    previous: 'Previous',
    next: 'Next',
    addVerse: 'Add Verse',
    send: 'Send',
    edit: 'Edit',
    copy: 'Copy',
    delete: 'Delete',
    addFirstVerse: 'Add the first verse',
    keyboard: 'Keyboard: ← Previous · → Next · ↑ Move lyrics up · ↓ Move lyrics down · Space Blank/Show · 1–9 jump directly to a slide',
    appearance: 'Wall Appearance',
    backgroundFor: 'Background for',
    selectedVerse: 'Selected Verse',
    textColor: 'Text color',
    fontSize: 'Font size',
    overlay: 'Overlay',
    width: 'Width',
    font: 'Font',
    alignment: 'Alignment',
    verticalPosition: 'Vertical position',
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    resetPosition: 'Center',
    left: 'Left',
    center: 'Center',
    right: 'Right',
    textShadow: 'Strong text shadow for readability',
    imageUrl: 'Background image URL',
    imagePlaceholder: 'Paste a direct image URL',
    useSelected: 'Use on Selected Verse',
    uploadImage: 'Upload Image for Selected Verse',
    clearImage: 'Clear Verse Image',
    freeBackgrounds: 'Free Background Sources',
    findImages: 'Find Worship Images',
    backgroundHelp: 'Select a verse first. Then choose a color or image. Everything is saved in the library file on this computer.',
    howWorks: 'How it works:',
    howWorksText: 'click a verse card, then click a color or upload an image. Only that selected verse changes.',
    editSlide: 'Edit Slide',
    label: 'Label',
    lyrics: 'Lyrics',
    cancel: 'Cancel',
    saveSlide: 'Save Slide',
    renameTitle: 'Rename Lyrics',
    lyricsName: 'Lyrics name',
    save: 'Save',
    untitled: 'Untitled Lyrics',
    newTitle: 'New Lyrics',
    typeHere: 'Type lyrics here',
    folderReady: 'Lyrics are saving automatically to PraiseLyrics-Library.json.',
    folderNeeded: 'Choose your Downloads folder to turn on automatic file saving.',
    saveError: 'Could not save the Lyrics library. Choose the folder again.',
    saved: 'Saved',
    savedNow: 'Saved to folder now',
    saving: 'Saving…',
    loadError: 'The Lyrics library file could not be read.',
    browserNoFolder: 'Automatic file saving needs Chrome or Edge. Use one of those browsers for the church computer.',
    wallNotOpen: 'Wall is not open yet.',
    screenUnsupported: 'This browser cannot list screens. Open the wall and move it manually.',
    screenDetected: (n) => `Detected ${n} display${n === 1 ? '' : 's'}. Select the TV wall, then click Open Wall.`,
    screenDenied: 'Screen permission was not granted.',
    onlyOneScreen: 'Only 1 display detected. Windows/Edge is not exposing a separate TV wall yet.',
    openingExternal: 'Opening wall on the external display…',
    wallBlocked: 'The browser blocked the wall window. Allow popups and try again.',
    wallOpened: 'Wall opened.',
    imageTooLarge: 'That image is larger than 12 MB. Please use a smaller image.',
    installTitle: 'Would you like to add PraiseLyrics to your desktop?',
    installPt: 'Gostaria de adicionar o PraiseLyrics à sua área de trabalho?',
    installButton: 'Add to Desktop / Adicionar à Área de Trabalho',
    notNow: 'Not Now / Agora Não',
    installFallback: 'In Chrome or Edge, open the browser menu and choose Install PraiseLyrics or Create shortcut.',
  },
  pt: {
    appTitle: 'Controle de Letras da Igreja',
    appSubtitle: 'Controle tudo aqui. O telão recebe somente as letras ao vivo.',
    detect: 'Detectar Telas',
    openWall: 'Abrir Telão',
    openLocalLyrics: 'Abrir Letras Locais',
    localLyricsOpened: 'Letras locais abertas ✓',
    localLyricsError: 'Não foi possível abrir esse arquivo de letras.',
    fullscreenHint: 'Clique uma vez para deixar o telão em tela cheia',
    showLyrics: 'Mostrar Letras',
    blankWall: 'Apagar Telão',
    wallBlank: 'TELÃO APAGADO',
    live: 'AO VIVO',
    library: 'Biblioteca de Letras',
    lyricsCount: (n) => `${n} ${n === 1 ? 'Letra' : 'Letras'}`,
    newLyrics: 'Nova Letra',
    renameLyrics: 'Renomear Letra',
    deleteLyrics: 'Excluir Letra',
    chooseFolder: 'Escolher Pasta das Letras',
    saveToFolder: 'Salvar Letra Atual',
    todayLyrics: 'Letras de Hoje',
    createToday: 'Criar Letras de Hoje',
    openToday: 'Abrir Letras de Hoje',
    addToToday: 'Adicionar a Hoje',
    removeFromToday: 'Remover',
    backToLibrary: 'Voltar à Biblioteca',
    clearToday: 'Limpar Hoje',
    todayEmpty: 'Nenhuma letra planejada para hoje ainda.',
    folderHelp: 'Escolha Downloads uma vez. O PraiseLyrics salvará toda a biblioteca automaticamente lá.',
    tvWall: 'Telão',
    chooseDisplay: 'Escolha após Detectar Telas',
    displayHelp: 'Se o Windows enxergar todas as TVs como um único telão, ele aparecerá aqui como uma tela.',
    serviceControl: 'Controle do Culto',
    previous: 'Anterior',
    next: 'Próxima',
    addVerse: 'Adicionar Verso',
    send: 'Enviar',
    edit: 'Editar',
    copy: 'Copiar',
    delete: 'Excluir',
    addFirstVerse: 'Adicionar o primeiro verso',
    keyboard: 'Teclado: ← Anterior · → Próxima · ↑ Subir letra · ↓ Descer letra · Espaço Apagar/Mostrar · 1–9 ir direto para uma tela',
    appearance: 'Aparência do Telão',
    backgroundFor: 'Fundo para',
    selectedVerse: 'Verso Selecionado',
    textColor: 'Cor do texto',
    fontSize: 'Tamanho da fonte',
    overlay: 'Escurecimento',
    width: 'Largura',
    font: 'Fonte',
    alignment: 'Alinhamento',
    verticalPosition: 'Posição vertical',
    moveUp: 'Subir',
    moveDown: 'Descer',
    resetPosition: 'Centralizar',
    left: 'Esquerda',
    center: 'Centro',
    right: 'Direita',
    textShadow: 'Sombra forte no texto para facilitar a leitura',
    imageUrl: 'URL da imagem de fundo',
    imagePlaceholder: 'Cole uma URL direta da imagem',
    useSelected: 'Usar no Verso Selecionado',
    uploadImage: 'Enviar Imagem para o Verso',
    clearImage: 'Remover Imagem do Verso',
    freeBackgrounds: 'Fontes de Fundos Gratuitos',
    findImages: 'Encontrar Imagens de Adoração',
    backgroundHelp: 'Selecione um verso primeiro. Depois escolha uma cor ou imagem. Tudo fica salvo no arquivo da biblioteca neste computador.',
    howWorks: 'Como funciona:',
    howWorksText: 'clique em um verso e depois escolha uma cor ou envie uma imagem. Apenas o verso selecionado será alterado.',
    editSlide: 'Editar Tela',
    label: 'Rótulo',
    lyrics: 'Letra',
    cancel: 'Cancelar',
    saveSlide: 'Salvar Tela',
    renameTitle: 'Renomear Letra',
    lyricsName: 'Nome da letra',
    save: 'Salvar',
    untitled: 'Letra Sem Nome',
    newTitle: 'Nova Letra',
    typeHere: 'Digite a letra aqui',
    folderReady: 'As letras estão sendo salvas automaticamente em PraiseLyrics-Library.json.',
    folderNeeded: 'Escolha sua pasta Downloads para ativar o salvamento automático.',
    saveError: 'Não foi possível salvar a biblioteca. Escolha a pasta novamente.',
    saved: 'Salvo',
    savedNow: 'Salvo na pasta agora',
    saving: 'Salvando…',
    loadError: 'Não foi possível ler o arquivo da biblioteca.',
    browserNoFolder: 'O salvamento automático precisa do Chrome ou Edge no computador da igreja.',
    wallNotOpen: 'O telão ainda não foi aberto.',
    screenUnsupported: 'Este navegador não consegue listar as telas. Abra o telão e mova manualmente.',
    screenDetected: (n) => `${n} tela${n === 1 ? '' : 's'} detectada${n === 1 ? '' : 's'}. Selecione o telão e clique em Abrir Telão.`,
    screenDenied: 'A permissão para detectar telas não foi concedida.',
    onlyOneScreen: 'Apenas 1 tela detectada. O Windows/Edge ainda não está mostrando o telão como uma tela separada.',
    openingExternal: 'Abrindo o telão na tela externa…',
    wallBlocked: 'O navegador bloqueou a janela do telão. Permita pop-ups e tente novamente.',
    wallOpened: 'Telão aberto.',
    imageTooLarge: 'A imagem tem mais de 12 MB. Use uma imagem menor.',
    installTitle: 'Would you like to add PraiseLyrics to your desktop?',
    installPt: 'Gostaria de adicionar o PraiseLyrics à sua área de trabalho?',
    installButton: 'Add to Desktop / Adicionar à Área de Trabalho',
    notNow: 'Not Now / Agora Não',
    installFallback: 'No Chrome ou Edge, abra o menu do navegador e escolha Instalar PraiseLyrics ou Criar atalho.',
  },
};

function openHandleDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HANDLE_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(HANDLE_STORE)) request.result.createObjectStore(HANDLE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredHandle(key) {
  try {
    const db = await openHandleDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readonly');
      const request = tx.objectStore(HANDLE_STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function storeHandle(key, handle) {
  const db = await openHandleDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite');
    tx.objectStore(HANDLE_STORE).put(handle, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getStoredDirectoryHandle() {
  return getStoredHandle(HANDLE_KEY);
}

async function storeDirectoryHandle(handle) {
  return storeHandle(HANDLE_KEY, handle);
}

async function getStoredTodayDirectoryHandle() {
  return getStoredHandle(TODAY_HANDLE_KEY);
}

async function storeTodayDirectoryHandle(handle) {
  return storeHandle(TODAY_HANDLE_KEY, handle);
}

async function readLibrary(handle) {
  const fileHandle = await handle.getFileHandle(LIBRARY_FILE, { create: true });
  const file = await fileHandle.getFile();
  if (!file.size) return null;
  const text = await file.text();
  return JSON.parse(text);
}

async function writeLibrary(handle, data) {
  const fileHandle = await handle.getFileHandle(LIBRARY_FILE, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

async function writeTodayLyricsFile(handle, dateKey, songs) {
  const fileHandle = await handle.getFileHandle(todayLyricsFileName(dateKey), { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify({
    version: 1,
    date: dateKey,
    savedAt: new Date().toISOString(),
    songs,
  }, null, 2));
  await writable.close();
}

function getSlideStyle(lyrics, slideIndex, style) {
  const slide = lyrics?.slides?.[slideIndex];
  if (!slide) return style;
  return {
    ...style,
    background: slide.background ?? style.background,
    backgroundImage: slide.backgroundImage ?? style.backgroundImage,
    verticalOffset: slide.verticalOffset ?? style.verticalOffset ?? 0,
  };
}

function buildLivePayload(lyrics, slideIndex, style, blank) {
  return {
    type: 'LIVE_UPDATE',
    at: Date.now(),
    lyricsTitle: lyrics?.title || '',
    slide: !blank && lyrics?.slides?.[slideIndex] ? lyrics.slides[slideIndex] : null,
    style: getSlideStyle(lyrics, slideIndex, style),
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
  const [live, setLive] = useState(() => buildLivePayload(null, 0, DEFAULT_STYLE, true));
  const [needsFullscreen, setNeedsFullscreen] = useState(() => !document.fullscreenElement);
  const receive = useCallback((payload) => {
    if (payload?.type === 'LIVE_UPDATE') setLive(payload);
  }, []);

  useEffect(() => {
    const requestFullscreen = async () => {
      if (!document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
        } catch {
          // Browsers only allow fullscreen after a user gesture.
        }
      }
      setNeedsFullscreen(!document.fullscreenElement);
    };
    const syncFullscreen = () => setNeedsFullscreen(!document.fullscreenElement);
    window.addEventListener('click', requestFullscreen, { once: true });
    window.addEventListener('keydown', requestFullscreen, { once: true });
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => {
      window.removeEventListener('click', requestFullscreen);
      window.removeEventListener('keydown', requestFullscreen);
      document.removeEventListener('fullscreenchange', syncFullscreen);
    };
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
      {needsFullscreen && (
        <button
          type="button"
          className="wall-fullscreen-hint"
          onClick={async () => {
            try {
              await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
            } catch {}
            setNeedsFullscreen(!document.fullscreenElement);
          }}
        >
          Full Screen / Tela Cheia
        </button>
      )}
      {!live.blank && live.slide && (
        <div
          className="display-lyrics"
          style={{
            color: style.textColor,
            fontSize: `clamp(24px, ${style.fontSize / 14}vw, ${style.fontSize * 1.8}px)`,
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight,
            textAlign: style.textAlign,
            lineHeight: style.lineHeight,
            width: `${style.maxWidth}vw`,
            transform: `translateY(${Number(style.verticalOffset || 0)}vh)`,
            transition: 'transform 120ms ease-out',
            textShadow: style.textShadow ? '0 4px 18px rgba(0,0,0,.95), 0 1px 3px rgba(0,0,0,1)' : 'none',
          }}
        >
          {live.slide.text}
        </div>
      )}
    </main>
  );
}

function readBrowserBackup() {
  try {
    return JSON.parse(localStorage.getItem(BROWSER_BACKUP_KEY) || 'null');
  } catch {
    return null;
  }
}

function safeLyricsFileName(title) {
  const cleaned = String(title || 'Untitled Lyrics')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '');
  return `${cleaned || 'Untitled Lyrics'}.json`;
}

function ControlView() {
  const [language, setLanguage] = useState('en');
  const t = COPY[language];
  const [lyricsList, setLyricsList] = useState(() => STARTER_LYRICS);
  const [lyricsId, setLyricsId] = useState(STARTER_LYRICS[0].id);
  const [liveIndex, setLiveIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [blank, setBlank] = useState(true);
  const [editingSlide, setEditingSlide] = useState(null);
  const [positionSlide, setPositionSlide] = useState(null);
  const [showLyricsEditor, setShowLyricsEditor] = useState(false);
  const [todayDate] = useState(() => localDateKey());
  const [todayLyricsIds, setTodayLyricsIds] = useState(() => {
    try {
      const storedDate = localStorage.getItem('praise-lyrics-today-date');
      if (storedDate !== localDateKey()) return [];
      return JSON.parse(localStorage.getItem('praise-lyrics-today') || '[]');
    } catch {
      return [];
    }
  });
  const [todayCreated, setTodayCreated] = useState(() => {
    try {
      const storedDate = localStorage.getItem('praise-lyrics-today-date');
      if (storedDate !== localDateKey()) return false;
      return localStorage.getItem('praise-lyrics-today-created') === 'true' ||
        JSON.parse(localStorage.getItem('praise-lyrics-today') || '[]').length > 0;
    } catch {
      return false;
    }
  });
  const [todayDirectoryHandle, setTodayDirectoryHandle] = useState(null);
  const [todaySaveStatus, setTodaySaveStatus] = useState('');
  const [showToday, setShowToday] = useState(false);
  const [screenOptions, setScreenOptions] = useState([]);
  const [selectedScreenId, setSelectedScreenId] = useState('');
  const [status, setStatus] = useState(t.wallNotOpen);
  const [saveStatus, setSaveStatus] = useState(t.folderNeeded);
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [folderReady, setFolderReady] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [installMessage, setInstallMessage] = useState('');
  const wallRef = useRef(null);
  const loadedRef = useRef(false);
  const browserBackupReadyRef = useRef(false);

  const lyrics = lyricsList.find((item) => item.id === lyricsId) || lyricsList[0];
  const selectedSlide = lyrics?.slides?.[selectedIndex];
  const todayLyrics = todayLyricsIds.map((id) => lyricsList.find((item) => item.id === id)).filter(Boolean);

  useEffect(() => {
    localStorage.setItem('praise-lyrics-today-date', todayDate);
    localStorage.setItem('praise-lyrics-today', JSON.stringify(todayLyricsIds));
  }, [todayLyricsIds, todayDate]);

  useEffect(() => {
    localStorage.setItem('praise-lyrics-today-created', String(todayCreated));
  }, [todayCreated]);

  useEffect(() => {
    if (!todayCreated || !todayDirectoryHandle) return undefined;

    const timer = setTimeout(async () => {
      try {
        const permission = await todayDirectoryHandle.queryPermission?.({ mode: 'readwrite' });
        if (permission !== 'granted') {
          setTodaySaveStatus('Open Create Today’s Lyrics to re-authorize the folder.');
          return;
        }

        const songs = todayLyricsIds
          .map((id) => lyricsList.find((item) => item.id === id))
          .filter(Boolean);

        await writeTodayLyricsFile(todayDirectoryHandle, todayDate, songs);
        setTodaySaveStatus(`${todayLyricsFileName(todayDate)} ✓`);
      } catch {
        setTodaySaveStatus('Could not update Today’s Lyrics file.');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [todayCreated, todayDirectoryHandle, todayLyricsIds, lyricsList, todayDate]);

  useEffect(() => {
    const saved = readBrowserBackup();
    if (saved?.lyrics?.length) {
      const mergedLyrics = mergeStarterLyrics(saved.lyrics);
      setLyricsList(mergedLyrics);
      setLyricsId(saved.activeLyricsId && mergedLyrics.some((item) => item.id === saved.activeLyricsId)
        ? saved.activeLyricsId
        : mergedLyrics[0].id);
      setStyle({ ...DEFAULT_STYLE, ...(saved.style || {}) });
      if (Array.isArray(saved.todayLyricsIds)) setTodayLyricsIds(saved.todayLyricsIds);
      if (typeof saved.todayCreated === 'boolean') setTodayCreated(saved.todayCreated);
      else if (Array.isArray(saved.todayLyricsIds) && saved.todayLyricsIds.length) setTodayCreated(true);
    }
    browserBackupReadyRef.current = true;
  }, []);

  useEffect(() => {
    if (!browserBackupReadyRef.current) return undefined;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(BROWSER_BACKUP_KEY, JSON.stringify({
          version: 1,
          savedAt: new Date().toISOString(),
          activeLyricsId: lyrics?.id || lyricsList[0]?.id || '',
          lyrics: lyricsList,
          style,
          todayLyricsIds,
          todayCreated,
        }));
      } catch {
        // Browser backup is best-effort; folder saving still works independently.
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [lyricsList, lyrics?.id, style, todayLyricsIds, todayCreated]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const handle = await getStoredTodayDirectoryHandle();
      if (!cancelled && handle) setTodayDirectoryHandle(handle);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!standalone) setShowInstall(true);
    const handler = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const handle = await getStoredDirectoryHandle();
      if (!handle || cancelled) {
        loadedRef.current = true;
        return;
      }
      try {
        const permission = await handle.queryPermission?.({ mode: 'readwrite' });
        if (permission !== 'granted') {
          loadedRef.current = true;
          return;
        }
        const saved = await readLibrary(handle);
        if (cancelled) return;
        setDirectoryHandle(handle);
        setFolderReady(true);
        if (saved?.lyrics?.length) {
          const mergedLyrics = mergeStarterLyrics(saved.lyrics);
          setLyricsList(mergedLyrics);
          setLyricsId(saved.activeLyricsId || mergedLyrics[0].id);
          setStyle({ ...DEFAULT_STYLE, ...(saved.style || {}) });
          const browserToday = localStorage.getItem('praise-lyrics-today');
          if (browserToday === null && Array.isArray(saved.todayLyricsIds)) {
            setTodayLyricsIds(saved.todayLyricsIds);
          }
          const browserTodayCreated = localStorage.getItem('praise-lyrics-today-created');
          if (browserTodayCreated === null && typeof saved.todayCreated === 'boolean') {
            setTodayCreated(saved.todayCreated);
          } else if (browserTodayCreated === null && Array.isArray(saved.todayLyricsIds) && saved.todayLyricsIds.length) {
            setTodayCreated(true);
          }
        }
        setSaveStatus(COPY[language].folderReady);
      } catch {
        setSaveStatus(COPY[language].loadError);
      } finally {
        loadedRef.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!folderReady || !directoryHandle || !loadedRef.current) return undefined;
    setSaveStatus(t.saving);
    const timer = setTimeout(async () => {
      try {
        await writeLibrary(directoryHandle, {
          version: 2,
          savedAt: new Date().toISOString(),
          activeLyricsId: lyrics?.id || lyricsList[0]?.id || '',
          lyrics: lyricsList,
          style,
          todayLyricsIds,
          todayCreated,
        });
        setSaveStatus(`${t.saved} ✓`);
      } catch {
        setFolderReady(false);
        setSaveStatus(t.saveError);
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [lyricsList, lyrics?.id, style, todayLyricsIds, todayCreated, directoryHandle, folderReady, t.saved, t.saving, t.saveError]);

  useEffect(() => {
    setImageUrl(selectedSlide?.backgroundImage || '');
  }, [selectedSlide?.id, selectedSlide?.backgroundImage]);

  useEffect(() => {
    setStatus((current) => current === COPY.en.wallNotOpen || current === COPY.pt.wallNotOpen ? t.wallNotOpen : current);
    if (!folderReady) setSaveStatus(t.folderNeeded);
    else setSaveStatus(t.folderReady);
  }, [language]);

  const sendLive = useCallback((nextIndex = liveIndex, nextBlank = blank, nextStyle = style) => {
    if (!lyrics || !('BroadcastChannel' in window)) return;
    const payload = buildLivePayload(lyrics, nextIndex, nextStyle, nextBlank);
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(payload);
    channel.close();
  }, [lyrics, liveIndex, blank, style]);

  useEffect(() => {
    sendLive(liveIndex, blank, style);
  }, [style, sendLive, liveIndex, blank]);

  useEffect(() => {
    if (lyrics && liveIndex >= lyrics.slides.length) {
      setLiveIndex(Math.max(0, lyrics.slides.length - 1));
      setSelectedIndex(Math.max(0, lyrics.slides.length - 1));
    }
  }, [lyrics, liveIndex]);

  useEffect(() => {
    const keyHandler = (event) => {
      if (event.target?.matches?.('input, textarea, select')) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveLyricsVertical(-4);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveLyricsVertical(4);
      } else if (event.code === 'Space') {
        event.preventDefault();
        toggleBlank();
      } else if (/^[1-9]$/.test(event.key)) {
        const index = Number(event.key) - 1;
        if (lyrics?.slides?.[index]) makeLive(index);
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  });

  async function openLocalLyrics() {
    try {
      let file;
      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: [{
            description: 'PraiseLyrics JSON',
            accept: { 'application/json': ['.json'] },
          }],
        });
        file = await handle.getFile();
      } else {
        file = await new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json,application/json';
          input.onchange = () => input.files?.[0] ? resolve(input.files[0]) : reject(new Error('No file selected'));
          input.click();
        });
      }

      const parsed = JSON.parse(await file.text());
      if (Array.isArray(parsed?.lyrics)) {
        const mergedLyrics = mergeStarterLyrics(parsed.lyrics);
        setLyricsList(mergedLyrics);
        setLyricsId(parsed.activeLyricsId && mergedLyrics.some((item) => item.id === parsed.activeLyricsId)
          ? parsed.activeLyricsId
          : mergedLyrics[0].id);
        setStyle({ ...DEFAULT_STYLE, ...(parsed.style || {}) });
        if (Array.isArray(parsed.todayLyricsIds)) setTodayLyricsIds(parsed.todayLyricsIds);
      } else if (parsed?.lyrics?.id && Array.isArray(parsed.lyrics.slides)) {
        const incoming = parsed.lyrics;
        setLyricsList((current) => {
          const exists = current.some((item) => item.id === incoming.id);
          return exists
            ? current.map((item) => item.id === incoming.id ? incoming : item)
            : [...current, incoming];
        });
        setLyricsId(incoming.id);
        setSelectedIndex(0);
        setLiveIndex(0);
        setBlank(true);
        if (parsed.style) setStyle({ ...DEFAULT_STYLE, ...parsed.style });
      } else {
        throw new Error('Unsupported PraiseLyrics file');
      }
      setSaveStatus(t.localLyricsOpened);
    } catch (error) {
      if (error?.name !== 'AbortError') setSaveStatus(t.localLyricsError);
    }
  }

  async function chooseLyricsFolder() {
    if (!window.showDirectoryPicker) {
      setSaveStatus(t.browserNoFolder);
      return;
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'downloads' });
      await storeDirectoryHandle(handle);
      const existing = await readLibrary(handle);
      if (existing?.lyrics?.length) {
        setLyricsList(existing.lyrics);
        setLyricsId(existing.activeLyricsId || existing.lyrics[0].id);
        setStyle({ ...DEFAULT_STYLE, ...(existing.style || {}) });
      } else {
        await writeLibrary(handle, {
          version: 2,
          savedAt: new Date().toISOString(),
          activeLyricsId: lyrics?.id || lyricsList[0]?.id || '',
          lyrics: lyricsList,
          style,
          todayLyricsIds,
        });
      }
      setDirectoryHandle(handle);
      setFolderReady(true);
      setSaveStatus(t.folderReady);
    } catch (error) {
      if (error?.name !== 'AbortError') setSaveStatus(t.saveError);
    }
  }

  function downloadCurrentLyrics() {
    if (!lyrics) return;
    const fileName = safeLyricsFileName(lyrics.title);
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      title: lyrics.title,
      lyrics,
      style,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSaveStatus(`${t.savedNow}: ${fileName} ✓`);
  }

  async function saveToFolderNow() {
    if (!lyrics) return;

    const fileName = safeLyricsFileName(lyrics.title);
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      title: lyrics.title,
      lyrics,
      style,
    };

    if (!window.showDirectoryPicker) {
      downloadCurrentLyrics();
      return;
    }

    try {
      setSaveStatus(t.saving);
      let handle = directoryHandle;

      if (!handle) {
        handle = await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'downloads' });
        await storeDirectoryHandle(handle);
      } else {
        let permission = await handle.queryPermission?.({ mode: 'readwrite' });
        if (permission !== 'granted' && handle.requestPermission) {
          permission = await handle.requestPermission({ mode: 'readwrite' });
        }
        if (permission !== 'granted') {
          handle = await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'downloads' });
          await storeDirectoryHandle(handle);
        }
      }

      const fileHandle = await handle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(payload, null, 2));
      await writable.close();

      setDirectoryHandle(handle);
      setFolderReady(true);
      setSaveStatus(`${t.savedNow}: ${fileName} ✓`);
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setFolderReady(false);
        setSaveStatus(t.saveError);
      }
    }
  }

  async function createTodayLyrics() {
    setShowToday(true);

    if (!window.showDirectoryPicker) {
      setTodayCreated(true);
      setTodaySaveStatus('Chrome or Edge is required to choose a persistent local folder.');
      return;
    }

    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'downloads' });
      await storeTodayDirectoryHandle(handle);
      setTodayDirectoryHandle(handle);
      setTodayCreated(true);

      const songs = todayLyricsIds
        .map((id) => lyricsList.find((item) => item.id === id))
        .filter(Boolean);

      await writeTodayLyricsFile(handle, todayDate, songs);
      setTodaySaveStatus(`${todayLyricsFileName(todayDate)} ✓`);
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setTodaySaveStatus('Could not save Today’s Lyrics folder.');
      }
    }
  }

  function addCurrentToToday() {
    if (!lyrics) return;
    setTodayCreated(true);
    setTodayLyricsIds((current) => current.includes(lyrics.id) ? current : [...current, lyrics.id]);
  }

  function addSongToToday(id) {
    setTodayCreated(true);
    setTodayLyricsIds((current) => current.includes(id) ? current : [...current, id]);
  }

  function removeSongFromToday(id) {
    setTodayLyricsIds((current) => current.filter((item) => item !== id));
  }

  function openPlannedLyrics(id) {
    const planned = lyricsList.find((item) => item.id === id);
    if (!planned) return;
    setLyricsId(id);
    setLiveIndex(0);
    setSelectedIndex(0);
    setBlank(true);
  }

  function clearTodayLyrics() {
    setTodayLyricsIds([]);
  }

  async function installDesktop() {
    if (!installPrompt) {
      setInstallMessage(t.installFallback);
      return;
    }
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result?.outcome === 'accepted') setShowInstall(false);
    setInstallPrompt(null);
  }

  function updateLyrics(mutator) {
    setLyricsList((current) => current.map((item) => (item.id === lyrics.id ? mutator(item) : item)));
  }

  function updateSelectedSlide(changes) {
    if (!selectedSlide) return;
    updateLyrics((current) => ({
      ...current,
      slides: current.slides.map((slide, index) => index === selectedIndex ? { ...slide, ...changes } : slide),
    }));
  }

  function applyVerseBackground(background) {
    updateSelectedSlide({ background, backgroundImage: '' });
    setImageUrl('');
  }

  function makeLive(index) {
    if (!lyrics?.slides?.[index]) return;
    setSelectedIndex(index);
    setLiveIndex(index);
    setBlank(false);
    sendLive(index, false, style);
  }

  function moveLyricsVertical(delta) {
    setStyle((current) => ({
      ...current,
      verticalOffset: Math.max(-45, Math.min(45, Number(current.verticalOffset || 0) + delta)),
    }));
  }

  function resetLyricsVertical() {
    setStyle((current) => ({ ...current, verticalOffset: 0 }));
  }

  function goNext() {
    if (!lyrics?.slides?.length) return;
    makeLive(Math.min(lyrics.slides.length - 1, liveIndex + 1));
  }

  function goPrevious() {
    if (!lyrics?.slides?.length) return;
    makeLive(Math.max(0, liveIndex - 1));
  }

  function toggleBlank() {
    const next = !blank;
    setBlank(next);
    sendLive(liveIndex, next, style);
  }

  async function detectScreens() {
    if (!window.getScreenDetails) {
      setStatus(t.screenUnsupported);
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
      if (mapped.length) {
        const nonPrimary = details.screens.find((item) => !item.isPrimary) || details.screens[0];
        setSelectedScreenId(`${nonPrimary.left}:${nonPrimary.top}:${nonPrimary.width}:${nonPrimary.height}`);
      }
      setStatus(mapped.length === 1 ? t.onlyOneScreen : t.screenDetected(mapped.length));
    } catch {
      setStatus(t.screenDenied);
    }
  }

  async function openWall() {
    let selected = null;
    let latestOptions = screenOptions;

    if (window.getScreenDetails) {
      try {
        const details = await window.getScreenDetails();
        latestOptions = details.screens.map((screen, index) => ({
          id: `${screen.left}:${screen.top}:${screen.width}:${screen.height}`,
          label: `${screen.label || `Display ${index + 1}`} — ${screen.width}×${screen.height}${screen.isPrimary ? ' (Primary)' : ''}`,
          left: screen.left,
          top: screen.top,
          width: screen.width,
          height: screen.height,
          isPrimary: screen.isPrimary,
        }));
        setScreenOptions(latestOptions);

        if (latestOptions.length === 1) {
          selected = latestOptions[0];
          setSelectedScreenId(selected.id);
          setStatus(t.onlyOneScreen);
        } else {
          selected =
            latestOptions.find((item) => item.id === selectedScreenId && !item.isPrimary) ||
            latestOptions.find((item) => !item.isPrimary) ||
            latestOptions[0];

          setSelectedScreenId(selected.id);
          setStatus(t.openingExternal);
        }
      } catch {
        setStatus(t.screenDenied);
        return;
      }
    } else {
      selected = latestOptions.find((item) => item.id === selectedScreenId) || null;
    }

    const features = selected
      ? `popup=yes,left=${selected.left},top=${selected.top},width=${selected.width},height=${selected.height},toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes`
      : 'popup=yes,width=1280,height=720,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes';

    const displayUrl = `${window.location.origin}${import.meta.env.BASE_URL}?display=1`;
    if (wallRef.current && !wallRef.current.closed) {
      try { wallRef.current.close(); } catch {}
    }
    wallRef.current = window.open(displayUrl, '_blank', features);

    if (!wallRef.current) {
      setStatus(t.wallBlocked);
      return;
    }

    try {
      if (selected) {
        wallRef.current.moveTo(selected.left, selected.top);
        wallRef.current.resizeTo(selected.width, selected.height);
      }
      wallRef.current.focus();
    } catch {
      // Edge may restrict programmatic moving even after screen permission.
    }

    setStatus(t.wallOpened);
    setTimeout(() => sendLive(liveIndex, blank, style), 700);
  }

  function addSlide() {
    const slide = { id: crypto.randomUUID(), label: `Verse ${lyrics.slides.length + 1}`, text: t.typeHere };
    updateLyrics((current) => ({ ...current, slides: [...current.slides, slide] }));
    setEditingSlide(slide.id);
    setSelectedIndex(lyrics.slides.length);
  }

  function duplicateSlide(index) {
    const original = lyrics.slides[index];
    if (!original) return;
    const copy = { ...original, id: crypto.randomUUID(), label: `${original.label} Copy` };
    updateLyrics((current) => {
      const slides = [...current.slides];
      slides.splice(index + 1, 0, copy);
      return { ...current, slides };
    });
  }

  function deleteSlide(index) {
    if (!lyrics.slides[index]) return;
    updateLyrics((current) => ({ ...current, slides: current.slides.filter((_, i) => i !== index) }));
    setSelectedIndex(Math.max(0, index - 1));
    setLiveIndex((current) => Math.max(0, Math.min(current, lyrics.slides.length - 2)));
  }

  function moveSlide(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= lyrics.slides.length) return;
    updateLyrics((current) => {
      const slides = [...current.slides];
      [slides[index], slides[target]] = [slides[target], slides[index]];
      return { ...current, slides };
    });
    setSelectedIndex(target);
    if (liveIndex === index) setLiveIndex(target);
    else if (liveIndex === target) setLiveIndex(index);
  }

  function saveSlide(id, next) {
    updateLyrics((current) => ({
      ...current,
      slides: current.slides.map((slide) => slide.id === id ? { ...slide, ...next } : slide),
    }));
    setEditingSlide(null);
  }

  function newLyrics() {
    const next = { id: crypto.randomUUID(), title: t.newTitle, slides: [] };
    setLyricsList((current) => [...current, next]);
    setLyricsId(next.id);
    setSelectedIndex(0);
    setLiveIndex(0);
    setBlank(true);
    setShowLyricsEditor(true);
  }

  function deleteLyrics() {
    if (lyricsList.length === 1) return;
    const nextList = lyricsList.filter((item) => item.id !== lyrics.id);
    setLyricsList(nextList);
    setLyricsId(nextList[0].id);
    setLiveIndex(0);
    setSelectedIndex(0);
    setBlank(true);
  }

  function applyImageUrl() {
    updateSelectedSlide({ backgroundImage: imageUrl.trim() });
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setStatus(t.imageTooLarge);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setImageUrl(dataUrl);
      updateSelectedSlide({ backgroundImage: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">PraiseLyrics</div>
          <h1>{t.appTitle}</h1>
          <p>{t.appSubtitle}</p>
        </div>
        <div className="topbar-actions">
          <div className="language-switch" aria-label="Language">
            <button className={language === 'en' ? 'flag-button active' : 'flag-button'} onClick={() => setLanguage('en')} title="English">🇺🇸</button>
            <button className={language === 'pt' ? 'flag-button active' : 'flag-button'} onClick={() => setLanguage('pt')} title="Português">🇧🇷</button>
          </div>
          <button className="secondary" onClick={detectScreens}>{t.detect}</button>
          <button className="primary" onClick={openWall}>{t.openWall}</button>
          <button className={blank ? 'danger active' : 'danger'} onClick={toggleBlank}>{blank ? t.showLyrics : t.blankWall}</button>
        </div>
      </header>

      <div className="savebar">
        <button className="secondary compact" onClick={openLocalLyrics}>📂 {t.openLocalLyrics}</button>
        <button className="secondary compact" onClick={chooseLyricsFolder}>📁 {t.chooseFolder}</button>
        <button className="primary compact" onClick={saveToFolderNow}>💾 {t.saveToFolder}</button>
        <button className="primary compact create-today-button" onClick={() => todayCreated ? setShowToday(true) : createTodayLyrics()}>📅 {todayCreated ? t.openToday : t.createToday}</button>
        <button className="secondary compact" onClick={() => setShowToday(true)}>📖 {t.openToday} ({todayLyrics.length})</button>
        <span className={folderReady ? 'save-state ready' : 'save-state'}>{saveStatus}</span>
      </div>

      <div className="statusbar">
        <span className={blank ? 'dot muted' : 'dot live'} />
        <strong>{blank ? t.wallBlank : `${t.live}: ${lyrics?.slides?.[liveIndex]?.label || '—'}`}</strong>
        <span>{status}</span>
      </div>

      <div className="workspace">
        <aside className="sidebar panel">
          <div className="section-head">
            <div>
              <span className="section-label">{t.library}</span>
              <h2>{t.lyricsCount(lyricsList.length)}</h2>
            </div>
            <button className="icon-button" onClick={newLyrics} title={t.newLyrics}>＋</button>
          </div>

          <div className="song-list">
            {lyricsList.map((item) => (
              <div key={item.id} className={`song-item lyrics-item ${item.id === lyrics.id ? 'selected' : ''}`}>
                <button
                  className="lyrics-name-button"
                  title={t.renameLyrics}
                  onClick={() => {
                    setLyricsId(item.id);
                    setShowToday(false);
                    setShowLyricsEditor(true);
                  }}
                >
                  <strong>{item.title}</strong><span className="rename-mark">✎</span>
                </button>
                <button
                  className="lyrics-open-button"
                  onClick={() => {
                    setLyricsId(item.id);
                    setShowToday(false);
                    setLiveIndex(0);
                    setSelectedIndex(0);
                    setBlank(true);
                  }}
                >
                  {item.slides.length} {language === 'pt' ? (item.slides.length === 1 ? 'tela' : 'telas') : (item.slides.length === 1 ? 'slide' : 'slides')}
                </button>
                {todayLyricsIds.includes(item.id) ? (
                  <span className="today-badge">✓ Today</span>
                ) : (
                  <button
                    className="add-today-mini"
                    title={t.addToToday}
                    aria-label={`${t.addToToday}: ${item.title}`}
                    onClick={() => addSongToToday(item.id)}
                  >
                    ＋
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="sidebar-actions">
            <button className="primary full create-today-button" onClick={() => todayCreated ? setShowToday(true) : createTodayLyrics()}>📅 {todayCreated ? t.openToday : t.createToday}</button>
            <button className="primary full" onClick={addCurrentToToday} disabled={!lyrics || todayLyricsIds.includes(lyrics.id)}>＋ {t.addToToday}</button>
            <button className="secondary full" onClick={() => setShowToday(true)}>📖 {t.openToday} ({todayLyrics.length})</button>
            <button className="secondary full" onClick={() => setShowLyricsEditor(true)}>{t.renameLyrics}</button>
            <button className="ghost full" disabled={lyricsList.length === 1} onClick={deleteLyrics}>{t.deleteLyrics}</button>
          </div>

          <div className="screen-box">
            <span className="section-label">{t.tvWall}</span>
            <select value={selectedScreenId} onChange={(event) => setSelectedScreenId(event.target.value)}>
              <option value="">{t.chooseDisplay}</option>
              {screenOptions.map((screen) => <option key={screen.id} value={screen.id}>{screen.label}</option>)}
            </select>
            <small>{t.displayHelp}</small>
          </div>
        </aside>

        <section className="main-column">
          {showToday ? (
            <div className="panel todays-lyrics-panel">
              <div className="section-head wide">
                <div>
                  <span className="section-label">{t.todayLyrics}</span>
                  <h2>{language === 'pt' ? 'Todas as letras salvas para hoje' : "All today's saved lyrics"}</h2>
                  <small>{todayDate} · {todaySaveStatus || (language === 'pt' ? 'Escolha uma pasta com Criar Letras de Hoje' : "Choose a folder with Create Today's Lyrics")}</small>
                </div>
                <button className="secondary" onClick={() => setShowToday(false)}>{t.backToLibrary}</button>
              </div>
              <div className="todays-lyrics-stack">
                {todayLyrics.map((song, songIndex) => (
                  <section key={song.id} className="today-song-block">
                    <div className="today-song-heading">
                      <span>{String(songIndex + 1).padStart(2, '0')}</span>
                      <h3>{song.title}</h3>
                      <button className="secondary compact" onClick={() => openPlannedLyrics(song.id)}>{language === 'pt' ? 'Editar' : 'Edit'}</button>
                    </div>
                    <div className="today-song-verses">
                      {song.slides?.map((slide) => (
                        <article key={slide.id} className="today-verse-block">
                          <strong>{slide.label}</strong>
                          <p>{slide.text}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
                {!todayLyrics.length && <div className="tip-box">{t.todayEmpty}</div>}
              </div>
            </div>
          ) : (
          <>
          <div className="panel verses-panel">
            <div className="section-head wide">
              <div>
                <span className="section-label">{t.serviceControl}</span>
                <button className="editable-title" onClick={() => setShowLyricsEditor(true)} title={t.renameLyrics}>{lyrics?.title} <span>✎</span></button>
              </div>
              <div className="mini-actions">
                <button className="secondary" onClick={goPrevious}>← {t.previous}</button>
                <button className="secondary" onClick={goNext}>{t.next} →</button>
                <button className="secondary" onClick={() => moveLyricsVertical(-4)}>↑ {t.moveUp}</button>
                <button className="secondary" onClick={() => moveLyricsVertical(4)}>↓ {t.moveDown}</button>
                <button className="ghost" onClick={resetLyricsVertical}>{t.resetPosition}</button>
                <button className="primary" onClick={addSlide}>＋ {t.addVerse}</button>
              </div>
            </div>

            <div className="verse-strip">
              {lyrics?.slides?.map((slide, index) => {
                const cardBackground = slide.backgroundImage
                  ? `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)), url("${slide.backgroundImage}")`
                  : slide.background;
                return (
                  <article
                    key={slide.id}
                    className={`verse-card ${index === liveIndex && !blank ? 'live-card' : ''} ${index === selectedIndex ? 'selected-card' : ''}`}
                    style={cardBackground ? { background: cardBackground, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                    onClick={() => {
                      setSelectedIndex(index);
                      setPositionSlide(slide.id);
                    }}
                    onDoubleClick={() => setEditingSlide(slide.id)}
                  >
                    <div className="verse-card-head">
                      <span>{slide.label}</span>
                      {index === liveIndex && !blank && <strong>{t.live}</strong>}
                    </div>
                    <p>{slide.text}</p>
                    <div className="verse-card-actions">
                      <button onClick={(event) => { event.stopPropagation(); makeLive(index); }}>{t.send}</button>
                      <button onClick={(event) => { event.stopPropagation(); setEditingSlide(slide.id); }}>{t.edit}</button>
                      <button onClick={(event) => { event.stopPropagation(); duplicateSlide(index); }}>{t.copy}</button>
                      <button onClick={(event) => { event.stopPropagation(); moveSlide(index, -1); }}>←</button>
                      <button onClick={(event) => { event.stopPropagation(); moveSlide(index, 1); }}>→</button>
                      <button className="delete" onClick={(event) => { event.stopPropagation(); deleteSlide(index); }}>{t.delete}</button>
                    </div>
                  </article>
                );
              })}
              {!lyrics?.slides?.length && <button className="empty-card" onClick={addSlide}>＋ {t.addFirstVerse}</button>}
            </div>
            <div className="keyboard-help">{t.keyboard}</div>
          </div>

          <div className="lower-grid">
            <div className="panel appearance-panel">
              <div className="section-head">
                <div>
                  <span className="section-label">{t.appearance}</span>
                  <h2>{t.backgroundFor} {selectedSlide?.label || t.selectedVerse}</h2>
                </div>
              </div>

              <div className="gradient-grid">
                {DEFAULT_GRADIENTS.map((preset) => (
                  <button key={preset.name} className="gradient-swatch" style={{ background: preset.value }} onClick={() => applyVerseBackground(preset.value)}>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>

              <div className="control-grid">
                <label>{t.textColor}<input type="color" value={style.textColor} onChange={(event) => setStyle((current) => ({ ...current, textColor: event.target.value }))} /></label>
                <label>{t.fontSize}<input type="range" min="24" max="320" value={style.fontSize} onChange={(event) => setStyle((current) => ({ ...current, fontSize: Number(event.target.value) }))} /><span>{style.fontSize}px</span></label>
                <label>{t.overlay}<input type="range" min="0" max="0.85" step="0.05" value={style.overlay} onChange={(event) => setStyle((current) => ({ ...current, overlay: Number(event.target.value) }))} /><span>{Math.round(style.overlay * 100)}%</span></label>
                <label>{t.width}<input type="range" min="50" max="96" value={style.maxWidth} onChange={(event) => setStyle((current) => ({ ...current, maxWidth: Number(event.target.value) }))} /><span>{style.maxWidth}%</span></label>
                <label>{t.verticalPosition}<input type="range" min="-45" max="45" step="1" value={style.verticalOffset || 0} onChange={(event) => setStyle((current) => ({ ...current, verticalOffset: Number(event.target.value) }))} /><span>{style.verticalOffset || 0}</span></label>
                <label>{t.font}<select value={style.fontFamily} onChange={(event) => setStyle((current) => ({ ...current, fontFamily: event.target.value }))}><option value="Arial, Helvetica, sans-serif">Arial</option><option value="Georgia, serif">Georgia</option><option value="Verdana, sans-serif">Verdana</option><option value="Trebuchet MS, sans-serif">Trebuchet</option><option value="system-ui, sans-serif">System</option></select></label>
                <label>{t.alignment}<select value={style.textAlign} onChange={(event) => setStyle((current) => ({ ...current, textAlign: event.target.value }))}><option value="left">{t.left}</option><option value="center">{t.center}</option><option value="right">{t.right}</option></select></label>
              </div>

              <label className="checkbox-row"><input type="checkbox" checked={style.textShadow} onChange={(event) => setStyle((current) => ({ ...current, textShadow: event.target.checked }))} />{t.textShadow}</label>

              <div className="image-controls">
                <label>{t.imageUrl}<input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder={t.imagePlaceholder} /></label>
                <button className="secondary" onClick={applyImageUrl}>{t.useSelected}</button>
                <label className="upload-button">{t.uploadImage}<input type="file" accept="image/*" onChange={handleImageUpload} /></label>
                <button className="ghost" onClick={() => { setImageUrl(''); updateSelectedSlide({ backgroundImage: '' }); }}>{t.clearImage}</button>
              </div>
            </div>

            <div className="panel background-panel">
              <div className="section-head"><div><span className="section-label">{t.freeBackgrounds}</span><h2>{t.findImages}</h2></div></div>
              <p className="panel-copy">{t.backgroundHelp}</p>
              <div className="background-links">
                {FREE_BACKGROUND_LINKS.map((item) => <a key={item.url} href={item.url} target="_blank" rel="noreferrer">{item.label}<span>↗</span></a>)}
              </div>
              <div className="tip-box"><strong>{t.howWorks}</strong> {t.howWorksText}</div>
            </div>
          </div>
          </>
          )}
        </section>
      </div>

      {positionSlide && (
        <VersePositionEditor
          slide={lyrics.slides.find((item) => item.id === positionSlide)}
          t={t}
          onClose={() => setPositionSlide(null)}
          onChange={(verticalOffset) => {
            updateLyrics((current) => ({
              ...current,
              slides: current.slides.map((slide) =>
                slide.id === positionSlide ? { ...slide, verticalOffset } : slide
              ),
            }));
          }}
        />
      )}

      {editingSlide && (
        <SlideEditor
          slide={lyrics.slides.find((item) => item.id === editingSlide)}
          t={t}
          onClose={() => setEditingSlide(null)}
          onSave={(next) => saveSlide(editingSlide, next)}
        />
      )}

      {showLyricsEditor && (
        <LyricsEditor
          title={lyrics.title}
          t={t}
          onClose={() => setShowLyricsEditor(false)}
          onSave={(title) => {
            updateLyrics((current) => ({ ...current, title }));
            setShowLyricsEditor(false);
          }}
        />
      )}

      {showInstall && (
        <div className="install-card">
          <button className="install-close" onClick={() => setShowInstall(false)} aria-label="Close">×</button>
          <div className="install-icon">♫</div>
          <strong>{t.installTitle}</strong>
          <span>{t.installPt}</span>
          {installMessage && <small>{installMessage}</small>}
          <div className="install-actions">
            <button className="primary" onClick={installDesktop}>{t.installButton}</button>
            <button className="ghost" onClick={() => setShowInstall(false)}>{t.notNow}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function VersePositionEditor({ slide, t, onClose, onChange }) {
  if (!slide) return null;
  const value = Number(slide.verticalOffset || 0);
  const setValue = (next) => onChange(Math.max(-45, Math.min(45, next)));

  return (
    <div className="position-popover-backdrop" onMouseDown={onClose}>
      <div className="position-popover" onMouseDown={(event) => event.stopPropagation()}>
        <div className="position-popover-head">
          <div>
            <span className="section-label">{slide.label}</span>
            <strong>{t.verticalPosition}</strong>
          </div>
          <button className="icon-button" onClick={onClose}>×</button>
        </div>

        <div className="position-control-body">
          <button className="position-arrow" onClick={() => setValue(value - 4)}>↑</button>
          <div className="position-slider-wrap">
            <input
              className="position-vertical-slider"
              type="range"
              min="-45"
              max="45"
              step="1"
              value={value}
              onChange={(event) => setValue(Number(event.target.value))}
              aria-label={t.verticalPosition}
            />
          </div>
          <button className="position-arrow" onClick={() => setValue(value + 4)}>↓</button>
        </div>

        <div className="position-popover-footer">
          <span>{value}</span>
          <button className="ghost compact" onClick={() => setValue(0)}>{t.resetPosition}</button>
        </div>
      </div>
    </div>
  );
}

function SlideEditor({ slide, t, onClose, onSave }) {
  const [label, setLabel] = useState(slide?.label || 'Verse');
  const [text, setText] = useState(slide?.text || '');
  if (!slide) return null;
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head"><div><span className="section-label">{t.editSlide}</span><h2>{slide.label}</h2></div><button className="icon-button" onClick={onClose}>×</button></div>
        <label>{t.label}<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Verse 1 / Chorus / Bridge" /></label>
        <label>{t.lyrics}<textarea rows="10" value={text} onChange={(event) => setText(event.target.value)} /></label>
        <div className="modal-actions"><button className="ghost" onClick={onClose}>{t.cancel}</button><button className="primary" onClick={() => onSave({ label: label.trim() || 'Verse', text })}>{t.saveSlide}</button></div>
      </div>
    </div>
  );
}

function LyricsEditor({ title, t, onClose, onSave }) {
  const [value, setValue] = useState(title);
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal small" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head"><div><span className="section-label">{t.lyrics}</span><h2>{t.renameTitle}</h2></div><button className="icon-button" onClick={onClose}>×</button></div>
        <label>{t.lyricsName}<input autoFocus value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onSave(value.trim() || t.untitled); }} /></label>
        <div className="modal-actions"><button className="ghost" onClick={onClose}>{t.cancel}</button><button className="primary" onClick={() => onSave(value.trim() || t.untitled)}>{t.save}</button></div>
      </div>
    </div>
  );
}

export default function App() {
  const isDisplay = new URLSearchParams(window.location.search).get('display') === '1';
  return isDisplay ? <DisplayView /> : <ControlView />;
}
