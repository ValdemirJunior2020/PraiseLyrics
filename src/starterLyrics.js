const makeLyrics = (id, title, artist, language = 'en') => ({
  id: `starter-${id}`,
  title,
  artist,
  language,
  slides: [
    {
      id: `starter-${id}-verse-1`,
      label: language === 'pt' ? 'Verso 1' : 'Verse 1',
      text: '',
    },
  ],
});

export const STARTER_LYRICS = [
  makeLyrics('goodness-of-god', 'Goodness of God', 'Bethel Music / Jenn Johnson'),
  makeLyrics('holy-forever', 'Holy Forever', 'Chris Tomlin'),
  makeLyrics('great-are-you-lord', 'Great Are You Lord', 'All Sons & Daughters'),
  makeLyrics('worthy-of-it-all', 'Worthy of It All', 'David Brymer / Ryan Hall'),
  makeLyrics('gratitude', 'Gratitude', 'Brandon Lake'),
  makeLyrics('build-my-life', 'Build My Life', 'Housefires / Pat Barrett'),
  makeLyrics('way-maker', 'Way Maker', 'Sinach / Leeland'),
  makeLyrics('what-a-beautiful-name', 'What a Beautiful Name', 'Hillsong Worship'),
  makeLyrics('living-hope', 'Living Hope', 'Phil Wickham'),
  makeLyrics('battle-belongs', 'Battle Belongs', 'Phil Wickham'),
  makeLyrics('house-of-the-lord', 'House of the Lord', 'Phil Wickham'),
  makeLyrics('this-is-amazing-grace', 'This Is Amazing Grace', 'Phil Wickham'),
  makeLyrics('king-of-kings', 'King of Kings', 'Hillsong Worship'),
  makeLyrics('who-you-say-i-am', 'Who You Say I Am', 'Hillsong Worship'),
  makeLyrics('oceans', 'Oceans (Where Feet May Fail)', 'Hillsong UNITED'),
  makeLyrics('same-god', 'Same God', 'Elevation Worship'),
  makeLyrics('trust-in-god', 'Trust in God', 'Elevation Worship'),
  makeLyrics('praise', 'Praise', 'Elevation Worship'),
  makeLyrics('jireh', 'Jireh', 'Elevation Worship / Maverick City Music'),
  makeLyrics('firm-foundation', 'Firm Foundation (He Won’t)', 'Cody Carnes'),
  makeLyrics('run-to-the-father', 'Run to the Father', 'Cody Carnes'),
  makeLyrics('the-blessing', 'The Blessing', 'Kari Jobe / Cody Carnes / Elevation Worship'),
  makeLyrics('i-speak-jesus', 'I Speak Jesus', 'Charity Gayle'),
  makeLyrics('thank-you-jesus-for-the-blood', 'Thank You Jesus for the Blood', 'Charity Gayle'),
  makeLyrics('a-thousand-hallelujahs', 'A Thousand Hallelujahs', 'Brooke Ligertwood'),
  makeLyrics('honey-in-the-rock', 'Honey in the Rock', 'Brooke Ligertwood / Brandon Lake'),
  makeLyrics('rest-on-us', 'Rest on Us', 'Maverick City Music / UPPERROOM'),
  makeLyrics('promises', 'Promises', 'Maverick City Music'),
  makeLyrics('fear-is-not-my-future', 'Fear Is Not My Future', 'Maverick City Music'),
  makeLyrics('god-of-revival', 'God of Revival', 'Bethel Music'),
  makeLyrics('raise-a-hallelujah', 'Raise a Hallelujah', 'Bethel Music'),
  makeLyrics('no-longer-slaves', 'No Longer Slaves', 'Bethel Music'),
  makeLyrics('reckless-love', 'Reckless Love', 'Cory Asbury'),
  makeLyrics('yes-i-will', 'Yes I Will', 'Vertical Worship'),
  makeLyrics('do-it-again', 'Do It Again', 'Elevation Worship'),

  makeLyrics('bondade-de-deus', 'Bondade de Deus', 'Isaías Saad', 'pt'),
  makeLyrics('a-casa-e-sua', 'A Casa É Sua', 'Casa Worship', 'pt'),
  makeLyrics('lugar-secreto', 'Lugar Secreto', 'Gabriela Rocha', 'pt'),
  makeLyrics('me-atraiu', 'Me Atraiu', 'Gabriela Rocha', 'pt'),
  makeLyrics('ninguem-explica-deus', 'Ninguém Explica Deus', 'Preto no Branco', 'pt'),
  makeLyrics('todavia-me-alegrarei', 'Todavia Me Alegrarei', 'Samuel Messias', 'pt'),
  makeLyrics('y​​eshua', 'Yeshua', 'Casa Worship / versões brasileiras', 'pt'),
  makeLyrics('eu-te-vejo-em-tudo', 'Eu Te Vejo em Tudo', 'Casa Worship', 'pt'),
  makeLyrics('santo-pra-sempre', 'Santo Pra Sempre', 'Gabriel Guedes', 'pt'),
  makeLyrics('ruja-o-leao', 'Ruja o Leão', 'Talita Catanzaro / Isaías Saad', 'pt'),
  makeLyrics('ousado-amor', 'Ousado Amor', 'Isaías Saad', 'pt'),
  makeLyrics('algo-novo', 'Algo Novo', 'Kemuel / Lukas Agustinho', 'pt'),
  makeLyrics('em-teus-bracos', 'Em Teus Braços', 'Laura Souguellis', 'pt'),
  makeLyrics('so-tu-es-santo', 'Só Tu És Santo', 'Morada', 'pt'),
  makeLyrics('uma-coisa', 'Uma Coisa', 'Morada', 'pt'),
];

export function mergeStarterLyrics(existing = []) {
  const normalize = (value) => String(value || '').trim().toLocaleLowerCase();
  const titles = new Set(existing.map((item) => normalize(item.title)));
  const missing = STARTER_LYRICS.filter((item) => !titles.has(normalize(item.title)));
  return [...existing, ...missing];
}
