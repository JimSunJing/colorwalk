# Color Walk (Next.js)

Color Walk is a mobile-first color walk web app:
- Lock one target color per day.
- Only photos with enough target-color coverage pass validation.
- Export today's collage as a high-resolution PNG.

## Stack

- Next.js (App Router)
- React
- Three.js (WebGL background)
- Tailwind CSS

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build and start

```bash
npm run build
npm run start
```

## Project structure

- `app/page.js`: main page and core logic
- `app/globals.css`: global styles and Tailwind layers
- `public/logo.svg`: logo used by UI and export
