# PraiseLyrics

PraiseLyrics is a browser-based church lyrics controller built for a control PC plus a dedicated TV/video wall.

## Main idea

- The PC monitor is the control dashboard.
- The 3x3 TV wall is display-only.
- If Windows sees the 9 TVs as one large display, PraiseLyrics treats that wall as one screen.
- Click a verse card on the PC and send it live to the wall.
- No desktop app install is required for normal use once the site is deployed.

## Features

- Song library
- Add, edit, copy, delete, and reorder verse cards
- Verse / Chorus / Bridge labels
- Send any card live instantly
- Previous / Next controls
- Blank wall / restore lyrics
- Keyboard shortcuts
  - Left arrow: previous slide
  - Right arrow: next slide
  - Space: blank/show wall
  - 1-9: jump to a slide
- Detect connected displays in supported Chrome/Edge browsers
- Select the TV wall and open the display window there
- Background colors and gradient presets
- Upload a custom background image
- Paste a direct image URL
- Text color, font, size, width, alignment, overlay, and shadow controls
- Local browser storage for songs and settings
- Separate clean wall view with lyrics only

## Browser display detection

PraiseLyrics uses the browser Window Management API when available. Chrome or Edge may ask permission before connected displays can be listed. If the API is unavailable, `Open Wall` still opens a separate display window that can be moved to the TV wall manually.

For the best result, use the deployed HTTPS version because multi-screen browser APIs are restricted to secure contexts.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## GitHub Pages

The included GitHub Actions workflow builds and deploys the `main` branch to GitHub Pages.

If Pages has not been enabled for the repository yet, open the repository settings, choose **Pages**, and set the source to **GitHub Actions**.

## Background images

The control panel includes links to free Unsplash search pages for worship, cross, sunrise, mountains, ocean, sky, forest, and other church-friendly backgrounds. Download the image you want and upload it into PraiseLyrics. Keeping the selected background local in the browser makes the wall more reliable during a service.
