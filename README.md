# FROM SCRATCH (from-scratch.art)

Home of FROM SCRATCH, a community series of open production sessions: a producer starts a track from scratch, live, in front of
whoever shows up. The featured volume is Vol. #001 with MEKA, Thu Nov 5 2026, 4-10 PM AST, Shipwreck Studios, 202 C. San Agustín, San Juan.
Vite + vanilla TypeScript, no framework, no backend. Output is plain files in `dist/`.

## Run it

```sh
npm install
npm run dev        # http://localhost:5173, live reload
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ (http://localhost:4173)
```

Preview the event-day states with `?t=` (Puerto Rico time): `/?t=2026-11-05T18:30` shows the session live with the playhead
moving, `/?t=2026-11-05T23:00` shows the after state ("Vol. #001 has wrapped").

## Change the RSVP link (do this when the RSVP system is live)

Every RSVP button on the site reads one value: `SITE.RSVP_URL` in `site.config.ts`.

```ts
RSVP_URL: "/rsvp",          // now: the placeholder page in rsvp/index.html
RSVP_URL: "https://...",    // later: the real RSVP form
```

Then `npm run build` and redeploy. Once it points elsewhere, `rsvp/index.html` can be deleted (also remove it from
`build.rollupOptions.input` in `vite.config.ts`).

The same file holds `INSTAGRAM_URL` (the series account, `https://www.instagram.com/frm_scrtch_/`), `SITE_URL`,
`MAPS_URL` and the event start/end used by the countdown. `{{KEY}}` tokens in the HTML pages are filled from it at build time.

## Add or change a volume

The "Volumes" list on the home page comes from `volumes.config.ts` and is written into the HTML at build time
(the `<!--VOLUMES-->` marker in `index.html`). Each entry has a status: `next` (the featured upcoming one), `past`, or `tba`
(renders "Next volume: to be announced" with a "Host a session" link). Only add confirmed facts. Set `rsvp: true` only on the
volume that `SITE.RSVP_URL` belongs to.

The long Vol. #001 section (arrangement clock, clips, devices, host bio, address) is hand-written in `index.html` from `#vol-001`
down. When Vol. #002 is announced, the simplest path is: mark 001 `past`, add 002 as `next`, and swap the `#vol-001` sections
(or move them to their own page, e.g. `vol/001/index.html`, added to `build.rollupOptions.input`).

## Where things live

| What | File |
| --- | --- |
| All page copy, English and Spanish | `index.html` (Spanish sits right under each English line, marked `lang="es"`) |
| Volumes list | `volumes.config.ts` |
| RSVP placeholder page | `rsvp/index.html` |
| Styles (tokens at the top, then one block per section) | `src/styles/main.css` |
| HUD bezels (`data-bz`, `data-label`, `data-bottom`) | `src/modules/bezel.ts` |
| Countdown, live playhead, after-state | `src/modules/clock.ts` |
| Reel and session-clip players | `src/modules/media.ts` |
| Entrances and scroll-linked motion | `src/modules/motion.ts` |
| Phone menu, device loupe, footer wordmark fit | `src/modules/ui.ts` |
| Calendar file | `public/from-scratch-vol-001.ics` |
| DOM checks (overflow, headlines, clock, pinned story) | `scripts/check.py` (Playwright; run against `npm run preview -- --port 4610`) |

## Assets

Fonts (woff2 subsets), images (AVIF + WebP) and video (H.264 + posters) in `public/` are generated from the flyer and promo
projects in `~/code/liveSeshFLyer` (read only):

```sh
npm run assets            # everything
npm run assets -- images  # or: fonts | video
```

Needs `python3` with `fontTools` and `Pillow`, plus `ffmpeg`, `cwebp` and `avifenc`. `python3 scripts/prep_images.py --icons`
rebuilds only the FS mark and the favicons. The outputs are committed in `public/`, so a deploy does not need
to run this.

## Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages):

- Build command: `npm run build`
- Output directory: `dist`
- Node 20 or newer

`/rsvp` is served from `dist/rsvp/index.html`. `.ics` should go out as `text/calendar` (most hosts do this already).
Point the `from-scratch.art` domain at the host. Nothing here creates accounts or deploys by itself.

## Notes

- Mobile first (most traffic comes from Instagram). Checked at 390x844 and 1440x900 with no horizontal scroll.
- `prefers-reduced-motion` drops all travel and autoplay; content stays.
- Video only autoplays muted while on screen; one player can have sound at a time.
- The brand is the series: the chrome FS logo, the FROM SCRATCH wordmark, the obi strip. MEKA appears as the host of Vol. #001.
- `PRODUCT.md` holds the brief and brand rules; `HANDOFF.md` is the working log.
