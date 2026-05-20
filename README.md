# Lynn Scott Inc. — LSI Website

Awards-style marketing site for Lynn Scott Inc. (LSI).  
Built with Node.js + Express, vanilla JS, GSAP, and Lenis.

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
├── package.json
├── public/
│   ├── index.html         Single-page site
│   ├── css/styles.css     All styles
│   ├── js/main.js         All interactivity (GSAP, Lenis, cursor, reveals)
│   └── assets/            Drop real project images here
└── README.md
```

## Where to swap placeholder content

| What                  | File            | What to look for                           |
|-----------------------|-----------------|--------------------------------------------|
| Phone numbers         | `index.html`    | `tel:+1919...` links and visible text      |
| Email address         | `index.html`    | `mailto:lynnscottinc@gmail.com`            |
| Social links          | `index.html`    | `footer-link` anchors marked `# TODO`     |
| Work card images      | `index.html`    | `.work-card-img` — add `<img>` tags inside |
| Project names / tags  | `index.html`    | `.work-card-name` / `.work-card-tag`       |
| Year established      | `index.html`    | Hero label text (`EST. 2024`)              |
| Accent color          | `css/styles.css`| `--green` custom property (line ~8)        |

## Adding real project images

Replace each `.work-card-img` block in `index.html`:

```html
<!-- Before -->
<div class="work-card-img" style="--card-bg: #111111;">
  <span class="work-card-ph">PROJECT 01</span>
</div>

<!-- After -->
<div class="work-card-img">
  <img src="/assets/project-01.jpg" alt="Local Restaurant website" />
</div>
```

Add matching CSS to make the image fill the container:

```css
.work-card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}
.work-card:hover .work-card-img img { transform: scale(1.05); }
```

## Tech used

- **Express 4** — static file server  
- **GSAP 3.12** (CDN) — animations, scroll triggers, magnetic buttons  
- **Lenis 1.1** (CDN) — smooth scroll  
- **Poppins** (Google Fonts) — primary typeface  
- No build step required — edit files and refresh
