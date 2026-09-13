from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')

import_line = "import { STARTER_LYRICS, mergeStarterLyrics } from './starterLyrics.js';\n"
if import_line not in text:
    text = text.replace(
        "import React, { useCallback, useEffect, useRef, useState } from 'react';\n",
        "import React, { useCallback, useEffect, useRef, useState } from 'react';\n" + import_line,
        1,
    )

text = text.replace(
    "const [lyricsList, setLyricsList] = useState([DEFAULT_LYRICS]);",
    "const [lyricsList, setLyricsList] = useState(() => STARTER_LYRICS);",
    1,
)
text = text.replace(
    "const [lyricsId, setLyricsId] = useState(DEFAULT_LYRICS.id);",
    "const [lyricsId, setLyricsId] = useState(STARTER_LYRICS[0].id);",
    1,
)

old = """        if (saved?.lyrics?.length) {\n          setLyricsList(saved.lyrics);\n          setLyricsId(saved.activeLyricsId || saved.lyrics[0].id);\n          setStyle({ ...DEFAULT_STYLE, ...(saved.style || {}) });\n        }"""
new = """        if (saved?.lyrics?.length) {\n          const mergedLyrics = mergeStarterLyrics(saved.lyrics);\n          setLyricsList(mergedLyrics);\n          setLyricsId(saved.activeLyricsId || mergedLyrics[0].id);\n          setStyle({ ...DEFAULT_STYLE, ...(saved.style || {}) });\n        }"""
if old in text:
    text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
