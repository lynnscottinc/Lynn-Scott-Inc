# Lynn Scott Inc. — LSI Website

Awwwards-style marketing site for Lynn Scott Inc. (LSI).
Built with Node.js + Express, vanilla JS, GSAP, and Lenis.

## Visual direction

The site uses a **cinematic navy + gold** identity — golden geometric
particles drifting through deep midnight-navy space. An animated
**hexagon canvas** rises like an ocean wave on load, then settles into
a gentle breathing loop and responds to scroll with depth-based
parallax. Soft radial glows, a grain texture, and gold luminance give
it a premium, atmospheric feel.

> Previous build used a black + electric-green scheme. That has been
> fully replaced by the navy/gold palette below.

| Token            | Value     | Use                          |
|------------------|-----------|------------------------------|
| Primary bg       | `#0d1424` | deep midnight navy           |
| Secondary bg     | `#1a2238` | lifted navy (cards)          |
| Accent gold      | `#e8c547` | hero accent, glows           |
| Deep gold        | `#b8932f` | shadows, hovers              |
| Smoky purple-gray| `#4a4860` | atmospheric mid-tones        |
| Soft haze        | `#8a8aa3` | subtle elements              |
| Text primary     | `#f4f1e8` | warm off-white               |
| Text muted       | `#9a9aad` | muted copy                   |

## Setup

```bash
cd lsi-website
npm install
npm start
```

Open **http://localhost:3000** in your browser.

For live-reload during development:

```bash
npm run dev   # uses nodemon
```

## Project structure

```
lsi-website/
├── server.js              Express server (port 3000)
├── build.js               Deploy helper — produces .next/ output dir
├── package.json
├── public/
│   ├── index.html         Single-page site
│   ├── css/styles.css     All styles
│   ├── js/main.js          All interactivity (hexagons, GSAP, Lenis, cursor)
│   └── assets/            Static assets
└── README.md
```

Page flow: **Hero → About → Services → Contact → Footer**.

## Tuning the hexagon background

All hexagon behaviour is controlled by the `HEX_CONFIG` object near the
top of `public/js/main.js`:

```js
const HEX_CONFIG = {
  count:        62,    // total hexagons — keep 40–80 for good perf
  riseDuration: 1500,  // ms for one hexagon to rise into place
  riseStagger:  1200,  // ms — spread of staggered rise start times
  parallax:     0.22,  // scroll parallax strength (higher = more drift)
  goldRatio:    0.55,  // fraction of hexagons that are gold vs navy
};
```

- **More / fewer hexagons** — change `count`. Above ~80 you may see
  CPU cost on low-end devices (glowing hexagons use canvas shadows).
- **Faster / slower wave** — lower `riseDuration` for a snappier rise;
  lower `riseStagger` to make hexagons arrive more in unison.
- **Stronger parallax** — raise `parallax` (e.g. `0.35`) for more
  dramatic scroll drift; lower it for a calmer background.

The system respects `prefers-reduced-motion`: when set, hexagons are
drawn once, statically, with no animation loop.

## Where to swap placeholder content

| What               | File             | What to look for                          |
|--------------------|------------------|--------------------------------------------|
| Email address      | `index.html`     | `mailto:lynnscottinc@gmail.com`            |
| Phone numbers      | `index.html`     | `tel:+1919...` links (Joshua / Matthew)    |
| Team member names  | `index.html`     | `.contact-name` spans                      |
| Social links       | `index.html`     | `.social-icon` anchors marked `TODO`       |
| Year established   | `index.html`     | Hero label `EST. 2026` + footer copy       |
| Colors             | `css/styles.css` | `:root` custom properties (top of file)    |
| Hexagon behaviour  | `js/main.js`     | `HEX_CONFIG` object                        |

## Tech used

- **Express 4** — static file server
- **GSAP 3.12** (CDN) — entrance/scroll animations, magnetic buttons
- **ScrollTrigger** (CDN) — scroll-driven reveals
- **Lenis 1.1** (CDN) — smooth scroll
- **HTML5 Canvas** — hexagon background system (no library)
- **Poppins** (Google Fonts) — primary typeface
- No build step required for local dev — edit files and refresh

## Deployment note

`npm run build` runs `build.js`, which copies `public/` into a `.next/`
directory. This exists only to satisfy a hosting platform whose
framework preset is configured as "Next.js" and expects that output
folder — the site itself has no compile step.
