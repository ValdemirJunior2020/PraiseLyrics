// November 8, 2026 — worship set with lyrics provided by the worship team.
import { REST_SLIDES } from './sunday1108RestLyrics.js';
import { WHO_ELSE_SLIDES } from './sunday1108WhoElseLyrics.js';
import { NO_ONE_SLIDES } from './sunday1108NoOneLyrics.js';
import { BEAUTIFUL_NAME_SLIDES } from './sunday1108BeautifulLyrics.js';

export { BEAUTIFUL_NAME_SLIDES };
export const SUNDAY_2026_11_08_SONG_IDS = [
  'sunday-2026-11-08-holy-spirit-rest-on-us',
  'sunday-2026-11-08-who-else',
  'sunday-2026-11-08-no-one-like-the-lord',
  'starter-what-a-beautiful-name',
];

export const SUNDAY_2026_11_08_SONGS = [
  { id: SUNDAY_2026_11_08_SONG_IDS[0], title: 'Holy Spirit + Rest on Us', key: 'C', language: 'en', slides: REST_SLIDES },
  { id: SUNDAY_2026_11_08_SONG_IDS[1], title: 'Who Else', key: 'C', language: 'en', slides: WHO_ELSE_SLIDES },
  { id: SUNDAY_2026_11_08_SONG_IDS[2], title: 'No One Like the Lord', key: 'D', language: 'en', slides: NO_ONE_SLIDES },
];
