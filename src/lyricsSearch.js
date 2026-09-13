import { STARTER_LYRICS } from './starterLyrics.js';

const artistByTitle = new Map(
  STARTER_LYRICS.map((item) => [String(item.title || '').trim().toLowerCase(), item.artist || ''])
);

let query = '';
let applying = false;

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function filterLyrics() {
  const list = document.querySelector('.song-list');
  if (!list) return;

  const needle = normalize(query);
  list.querySelectorAll('.lyrics-item').forEach((item) => {
    const title = item.querySelector('.lyrics-name-button strong')?.textContent || '';
    const artist = artistByTitle.get(String(title).trim().toLowerCase()) || '';
    const searchable = normalize(`${title} ${artist}`);
    item.style.display = !needle || searchable.includes(needle) ? '' : 'none';
  });
}

function ensureSearch() {
  if (applying) return;
  const sidebar = document.querySelector('.sidebar');
  const list = sidebar?.querySelector('.song-list');
  if (!sidebar || !list) return;

  let wrap = sidebar.querySelector('.lyrics-search-wrap');
  if (!wrap) {
    applying = true;
    wrap = document.createElement('div');
    wrap.className = 'lyrics-search-wrap';
    wrap.innerHTML = `
      <span class="lyrics-search-icon" aria-hidden="true">⌕</span>
      <input
        class="lyrics-search-input"
        type="search"
        autocomplete="off"
        spellcheck="false"
        aria-label="Search Lyrics / Buscar Letras"
        placeholder="Search Lyrics / Buscar Letras"
      />
    `;
    list.before(wrap);

    const input = wrap.querySelector('.lyrics-search-input');
    input.value = query;
    input.addEventListener('input', (event) => {
      query = event.target.value;
      filterLyrics();
    });
    applying = false;
  }

  filterLyrics();
}

const style = document.createElement('style');
style.textContent = `
  .lyrics-search-wrap {
    position: relative;
    margin: 0 0 10px;
  }
  .lyrics-search-input {
    width: 100%;
    height: 39px;
    padding: 8px 34px 8px 34px;
    border: 1px solid #252c36;
    border-radius: 10px;
    background: #0a0d11;
    color: #f8fafc;
    outline: none;
    font-size: 13px;
  }
  .lyrics-search-input::placeholder { color: #64748b; }
  .lyrics-search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,.12);
  }
  .lyrics-search-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 18px;
    pointer-events: none;
    z-index: 1;
  }
  .lyrics-search-input::-webkit-search-cancel-button { cursor: pointer; }
`;
document.head.appendChild(style);

const observer = new MutationObserver(() => {
  window.requestAnimationFrame(ensureSearch);
});
observer.observe(document.documentElement, { childList: true, subtree: true });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureSearch, { once: true });
} else {
  ensureSearch();
}
