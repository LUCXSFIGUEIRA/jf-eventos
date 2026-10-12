# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page landing site for **JF Eventos**, an event venue in Guareí-SP. All site copy, comments and commit messages are in **Brazilian Portuguese**. Keep new copy, comments and commit messages in Portuguese.

Static HTML/CSS/JS with no build step, no package manager and no tests. To run it, open `index.html` in a browser, or serve the folder with any static server (for example `python -m http.server`). Publishing is done by pushing to `main` on GitHub (GitHub Pages: https://lucxsfigueira.github.io/jf-eventos/).

## Structure

- `index.html`: all markup. Sections in order: nav/menu, hero "as portas" (`#inicio`), about (`#sobre`), story "Um dia no JF" (`#historia`), events strips (`#eventos`), spaces (`#estrutura`), gallery reels (`#galeria`), CTA with the four steps, location/map (`#localizacao`), footer, floating WhatsApp button, lightbox.
- `css/style.css`: one stylesheet. Design tokens live in `:root`:
  - the palette (`--bg`, `--bg-2`, `--surface`, `--ink`, `--sky`, `--sky-deep`, `--wood`, `--wood-deep`, `--on-wood`, `--night`, `--on-night`);
  - brand colors `--wa`/`--ig`;
  - the radius `--r` (4px everywhere) and `--nav-h`;
  - the story sky colors (`--tarde-*`, `--sim-*`, `--sol-*`, `--recep-*`, `--noite-*`, `--festa-*`);
  - a z-index scale (`--z-*`).

  Dark mode is automatic: a `@media (prefers-color-scheme: dark)` block overrides the same tokens, so always use tokens instead of hard-coded colors. Class names are BEM-style (`block__element--modifier`), and states use `is-*` classes.
- `js/main.js`: one IIFE. Each feature has its own `init*()` function, and all of them are called in the "Início" block at the bottom. Keep the order there: pinned sections (hero, then story) must be created top to bottom.
- `fonts/`: self-hosted Satoshi (woff2). Icons come from Phosphor via unpkg (`ph-light`, `ph-fill` classes).
- `img/site/`: the only photos the site uses (optimized WebP, plus `og.jpg` for link previews). Original photos (`img/*.jpg`, `img/Casamento Lucas e Cássia/`) are git-ignored and stay on the owner's machine.
- `img/LEIA-ME.txt`: owner-facing guide (Portuguese) that explains how to swap photos and where each one appears. Update it whenever you add, rename or move a photo.

External libraries are loaded from CDNs at the end of `index.html`: GSAP 3.12.5 + ScrollTrigger (cdnjs) and Lenis 1.1.13 (jsdelivr).

## Things that span multiple files

- **Cache busting**: `css/style.css?v=N` and `js/main.js?v=N` are referenced in `index.html` with a version query. Increment `N` on both whenever you change CSS or JS so visitors don't get stale cached files.
- **Photos**: every `<img>` points at `img/site/<name>.webp` and has explicit `width`/`height`. To replace a photo, the owner saves a new WebP with the same filename. There is no fallback system, so a missing file shows as broken.
- **Logo variants**: `img/logo-dark.png` is for light backgrounds and `img/logo-light.png` for dark ones. The nav uses a `<picture>` with a `prefers-color-scheme: dark` source, and the footer (always dark) uses `logo-light.png`. `favicon.png` and `apple-touch-icon.png` are derived from `img/LOGO JF.png`.
- **Hero doors** (`initHero`): `.door--a`/`.door--b` cover `.hero__view` and leave a slit of width `--slit`. The `.hero` section is pinned, and scrolling moves the doors out (`xPercent` on desktop, `yPercent` on ≤860px, where the doors are stacked top/bottom). The heading is split visually across the doors. The `<h1>` holds "A festa inteira" plus a `.visually-hidden` " num lugar só.", and the second half in `.door--b` is `aria-hidden`.
- **Story section** (`initStory`): CSS lays the chapters out vertically by default, each `.chap` colored by `:nth-of-type` (`--c-bg`/`--c-fg`). On desktop with GSAP, JS adds `.story.is-h`, pins the section and slides `.story__track` sideways.
  - Each chapter's center is a color stop. JS interpolates `--story-bg`/`--story-fg` between the stops and moves `.horizon__sun` across the six `.horizon__marks`. From the fifth chapter on, `.horizon.is-night` turns the sun into the moon.
  - Adding a chapter needs a new `:nth-of-type` rule, a time-of-day token pair and a new mark.
- **Event strips** (`initStrips`): `.strip` buttons inside `.strips`. One has `is-open` (`aria-expanded`). They open on click and focus, and also on hover with a mouse. On desktop the open strip grows with `flex-grow`, and on ≤860px with `height`.
- **Spaces** (`initSpaces`): each `.space` article matches, by position, an image in `.spaces__media` (the sticky photo on desktop). The `.spaces__extra` list has no photo. JS adds `.spaces.is-live` (dims the inactive items) and toggles `is-active`. On ≤860px the sticky media is hidden and each `.space__img` is shown inline instead.
- **Gallery** (`initGallery`): two `.reel` rows of `.g` figures. By default they are native horizontal scrollers. On desktop with GSAP, `.gallery.is-drift` turns them into rows that move in opposite directions with the scroll. The lightbox cycles through all `.g img`.
- **JS progressive enhancement**: `main.js` checks for GSAP/ScrollTrigger. Without them, it runs only `initMenu`, `initLightbox` and `initStrips`, and the page stays static and readable. With them, it also respects `prefers-reduced-motion` (no Lenis, no pins or scroll animations, no confetti) and `(hover: hover) and (pointer: fine)` (magnetic buttons and opening strips on hover run only with a mouse).
- **Hooks between JS and HTML/CSS**: renaming any of these breaks its behavior.
  - Hero: `.hero`, `.hero__view`, `.hero__caption`, `.door--a`, `.door--b`, `.door__handle`, `.hero__word`.
  - About and story: `.about__lede`, `.about__pic`, `.story`, `.story__track`, `.chap`, `.ph`, `.horizon*`.
  - Strips, spaces and gallery: `.strip`, `.space`, `.spaces__media img`, `.reel`, `.g`.
  - CTA and other reveals: `.cta__*`, `.step`, `.title`, `.fade-up`, `.location__map`, `.info li`, `.footer__top`.
  - `.magnetic` makes a button follow the mouse.
- **Smooth scroll**: when Lenis is active, in-page anchor links (`a[href^="#"]`) are intercepted and scrolled through Lenis. The mobile menu and lightbox call `lenis.stop()`/`start()`. Any new overlay should do the same.
- **Breakpoints**: JS uses `(min-width: 861px)` (constant `DESKTOP`) for the doors' direction, the horizontal story and the gallery drift. The CSS uses the same 860px breakpoint, plus 1100px, 1024px and 600px. Change both together.
- **Contact info** (WhatsApp `5515997615353`, Instagram `_eventosjf`, address Av. Ataliba Figueira, 122, Centro, Guareí-SP) is hard-coded in many `wa.me`/Instagram links throughout `index.html`, and is also in `README.md`. Update every occurrence together.

## Design

The identity is "Céu e madeira":
- **Palette:** off-white `--bg`, night blue `--ink`/`--night`, slate sky blue `--sky` and wood/terracotta `--wood`. Wood is the single accent, used for buttons, emphasis in italics and the door handles.
- **Shape and type:** every corner uses a 4px radius, and buttons are rectangular, not pills. Emphasis uses italic of the same family (Satoshi).
- **Concept:** the page is built around the venue's wooden doors and the view from the deck.
- **Avoid:** the owner explicitly rejected diagonal marquee bands, arch-shaped photo frames and the previous green/pink palette, so don't reintroduce them.
- **Other colors:** the only colors outside the palette are the green WhatsApp icons and the gradient Instagram icons.

`.claude/skills/` (git-ignored, local only) has frontend design skills (taste-skill, redesign-skill, minimalist-skill, etc.). Earlier revisions used `taste-skill`.
