const SECTION_RE = /^\s*(?:(verse|verso)\s*(\d+)?|(chorus|refr[aã]o|coro)|(pre[-\s]?chorus|pr[eé][ -]?refr[aã]o)|(bridge|ponte)|(intro|introdu[cç][aã]o)|(outro|final)|(tag)|(interlude|interl[uú]dio)|(vamp))\s*[:\-–—]?\s*$/i;

function normalizeLabel(match, language, counts) {
  const raw = (match?.[1] || match?.[3] || match?.[4] || match?.[5] || match?.[6] || match?.[7] || match?.[8] || match?.[9] || match?.[10] || '').toLowerCase();
  const explicitNumber = match?.[2] ? Number(match[2]) : null;
  const pt = language === 'pt';

  if (/verse|verso/.test(raw)) {
    counts.verse += 1;
    return `${pt ? 'Verso' : 'Verse'} ${explicitNumber || counts.verse}`;
  }
  if (/chorus|refr|coro/.test(raw)) return pt ? 'Refrão' : 'Chorus';
  if (/pre/.test(raw)) return pt ? 'Pré-Refrão' : 'Pre-Chorus';
  if (/bridge|ponte/.test(raw)) return pt ? 'Ponte' : 'Bridge';
  if (/intro|introdu/.test(raw)) return 'Intro';
  if (/outro|final/.test(raw)) return pt ? 'Final' : 'Outro';
  if (/tag/.test(raw)) return 'Tag';
  if (/interlude|interl/.test(raw)) return pt ? 'Interlúdio' : 'Interlude';
  if (/vamp/.test(raw)) return 'Vamp';
  counts.verse += 1;
  return `${pt ? 'Verso' : 'Verse'} ${counts.verse}`;
}

export function parseFullLyrics(input, language = 'en') {
  const text = String(input || '').replace(/\r\n?/g, '\n').trim();
  if (!text) return [];

  const lines = text.split('\n');
  const sections = [];
  const counts = { verse: 0 };
  let current = null;
  let foundHeading = false;

  const pushCurrent = () => {
    if (!current) return;
    const body = current.lines.join('\n').trim();
    if (body) sections.push({ label: current.label, text: body });
    current = null;
  };

  for (const line of lines) {
    const heading = line.match(SECTION_RE);
    if (heading) {
      foundHeading = true;
      pushCurrent();
      current = { label: normalizeLabel(heading, language, counts), lines: [] };
      continue;
    }

    if (!current) {
      current = { label: '', lines: [] };
    }
    current.lines.push(line);
  }
  pushCurrent();

  if (foundHeading) {
    let autoVerse = 0;
    return sections.map((section) => {
      if (section.label) return section;
      autoVerse += 1;
      return { ...section, label: `${language === 'pt' ? 'Verso' : 'Verse'} ${autoVerse}` };
    });
  }

  const blocks = text.split(/\n\s*\n+/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block, index) => ({
    label: `${language === 'pt' ? 'Verso' : 'Verse'} ${index + 1}`,
    text: block,
  }));
}

function waitFor(selector, timeout = 2500) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);
    const started = Date.now();
    const observer = new MutationObserver(() => {
      const node = document.querySelector(selector);
      if (node) {
        observer.disconnect();
        resolve(node);
      } else if (Date.now() - started > timeout) {
        observer.disconnect();
        reject(new Error(`Timed out waiting for ${selector}`));
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

function setReactValue(element, value) {
  const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function getLanguage() {
  const ptFlag = document.querySelector('.flag-button[title="Português"]');
  return ptFlag?.classList.contains('active') ? 'pt' : 'en';
}

async function deleteCurrentSlides() {
  let safety = 100;
  while (document.querySelector('.verse-card-actions .delete') && safety-- > 0) {
    document.querySelector('.verse-card-actions .delete')?.click();
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

async function createSections(sections, replace) {
  if (replace) await deleteCurrentSlides();

  for (const section of sections) {
    const addButton = document.querySelector('.mini-actions .primary');
    if (!addButton) throw new Error('Add Verse button not found');
    addButton.click();

    const modal = await waitFor('.modal-backdrop .modal');
    const input = modal.querySelector('input');
    const textarea = modal.querySelector('textarea');
    const saveButton = modal.querySelector('.modal-actions .primary');
    if (!input || !textarea || !saveButton) throw new Error('Lyrics editor is unavailable');

    setReactValue(input, section.label);
    setReactValue(textarea, section.text);
    saveButton.click();

    await new Promise((resolve) => setTimeout(resolve, 35));
    if (document.querySelector('.modal-backdrop .modal')) {
      await new Promise((resolve) => {
        const observer = new MutationObserver(() => {
          if (!document.querySelector('.modal-backdrop .modal')) {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => { observer.disconnect(); resolve(); }, 1500);
      });
    }
  }
}

function buildModal(language) {
  const pt = language === 'pt';
  const overlay = document.createElement('div');
  overlay.className = 'bulk-lyrics-overlay';
  overlay.innerHTML = `
    <div class="bulk-lyrics-modal" role="dialog" aria-modal="true">
      <div class="bulk-lyrics-head">
        <div>
          <span>${pt ? 'COLAR LETRA COMPLETA' : 'PASTE FULL LYRICS'}</span>
          <h2>${pt ? 'Separar versos automaticamente' : 'Split sections automatically'}</h2>
        </div>
        <button type="button" class="bulk-close">×</button>
      </div>
      <p class="bulk-help">${pt ? 'Cole a letra inteira. O PraiseLyrics reconhece Verso, Refrão, Ponte, Pré-Refrão, Intro e Final. Sem títulos, ele usa linhas em branco.' : 'Paste the complete lyrics. PraiseLyrics recognizes Verse, Chorus, Bridge, Pre-Chorus, Intro and Outro. Without headings, blank lines become verses.'}</p>
      <textarea class="bulk-input" rows="15" placeholder="${pt ? 'Cole toda a letra aqui…' : 'Paste the full lyrics here…'}"></textarea>
      <label class="bulk-replace"><input type="checkbox" checked> ${pt ? 'Substituir as telas atuais desta Lyrics' : 'Replace the current slides in this Lyrics'}</label>
      <div class="bulk-preview-title">${pt ? 'PRÉVIA' : 'PREVIEW'}</div>
      <div class="bulk-preview"><span>${pt ? 'Cole a letra para ver as partes.' : 'Paste lyrics to preview the sections.'}</span></div>
      <div class="bulk-actions">
        <button type="button" class="bulk-cancel">${pt ? 'Cancelar' : 'Cancel'}</button>
        <button type="button" class="bulk-create" disabled>${pt ? 'Criar Telas' : 'Create Slides'}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('.bulk-close').addEventListener('click', close);
  overlay.querySelector('.bulk-cancel').addEventListener('click', close);
  overlay.addEventListener('mousedown', (event) => { if (event.target === overlay) close(); });

  const input = overlay.querySelector('.bulk-input');
  const preview = overlay.querySelector('.bulk-preview');
  const create = overlay.querySelector('.bulk-create');

  const refresh = () => {
    const sections = parseFullLyrics(input.value, language);
    create.disabled = sections.length === 0;
    preview.innerHTML = sections.length
      ? sections.map((section, index) => `<div class="bulk-preview-item"><strong>${index + 1}. ${section.label}</strong><span>${section.text.split('\n').filter(Boolean).length} ${pt ? 'linhas' : 'lines'}</span></div>`).join('')
      : `<span>${pt ? 'Cole a letra para ver as partes.' : 'Paste lyrics to preview the sections.'}</span>`;
  };

  input.addEventListener('input', refresh);
  setTimeout(() => input.focus(), 50);

  create.addEventListener('click', async () => {
    const sections = parseFullLyrics(input.value, language);
    if (!sections.length) return;
    const replace = overlay.querySelector('.bulk-replace input').checked;
    create.disabled = true;
    create.textContent = pt ? 'Criando…' : 'Creating…';
    try {
      close();
      await createSections(sections, replace);
    } catch (error) {
      alert(pt ? 'Não consegui criar todas as telas. Tente novamente.' : 'I could not create all slides. Please try again.');
      console.error(error);
    }
  });
}

function ensureButton() {
  const actions = document.querySelector('.mini-actions');
  if (!actions || actions.querySelector('.bulk-lyrics-button')) return;
  const pt = getLanguage() === 'pt';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'secondary bulk-lyrics-button';
  button.textContent = pt ? '📋 Colar Letra Completa' : '📋 Paste Full Lyrics';
  button.addEventListener('click', () => buildModal(getLanguage()));
  actions.appendChild(button);
}

let lastLanguage = '';
function syncUi() {
  ensureButton();
  const language = getLanguage();
  if (language !== lastLanguage) {
    lastLanguage = language;
    const button = document.querySelector('.bulk-lyrics-button');
    if (button) button.textContent = language === 'pt' ? '📋 Colar Letra Completa' : '📋 Paste Full Lyrics';
  }
}

const observer = new MutationObserver(syncUi);
window.addEventListener('DOMContentLoaded', () => {
  syncUi();
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
});
