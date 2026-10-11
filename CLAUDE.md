# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page landing site for **JF Eventos**, an event venue in Guareí-SP. All site copy, comments and commit messages are in **Brazilian Portuguese**. Keep new copy, comments and commit messages in Portuguese.

Static HTML/CSS/JS with no build step, no package manager and no tests. To run it, open `index.html` in a browser, or serve the folder with any static server (for example `python -m http.server`). Publishing is done by pushing to `main` on GitHub (GitHub Pages: https://lucxsfigueira.github.io/jf-eventos/).

## Structure

- `index.html`: all markup. Sections in order: preloader, nav/menu, hero (`#inicio`), marquee, about (`#sobre`), story "Um dia no JF" (`#historia`), events (`#eventos`), features/bento (`#estrutura`), gallery with filters (`#galeria`), steps, CTA, location/map (`#localizacao`), footer, floating WhatsApp button, lightbox.
- `css/style.css`: one stylesheet. Design tokens live in `:root`: light palette (`--paper`, `--surface`, `--ink`, `--forest`, `--accent` pink and variants), brand colors `--wa`/`--ig`, photo radius `--r-photo`, the story time-of-day colors (`--tarde-*`, `--sim-*`, `--sol-*`, `--salao-*`, `--noite-*`, `--festa-*`) and a z-index scale (`--z-*`). Dark mode is automatic: a `@media (prefers-color-scheme: dark)` block overrides the same tokens, so always use tokens instead of hard-coded colors. Class names are BEM-style (`block__element--modifier`), and states use `is-*` classes.
- `js/main.js`: one IIFE. Each feature has its own `init*()` function, and all of them are called in the "Início" block at the bottom.
- `fonts/`: self-hosted Satoshi (woff2). Icons come from Phosphor via unpkg (`ph-light`, `ph-fill` classes).
- `img/site/`: the only photos the site uses (optimized WebP, plus `og.jpg` for link previews). Original photos (`img/*.jpg`, `img/Casamento Lucas e Cássia/`) are git-ignored and stay on the owner's machine.
- `img/LEIA-ME.txt`: owner-facing guide (Portuguese) that explains how to swap photos and where each one appears. Update it whenever you add, rename or move a photo.

External libraries are loaded from CDNs at the end of `index.html`: GSAP 3.12.5 + ScrollTrigger (cdnjs) and Lenis 1.1.13 (jsdelivr).

## Things that span multiple files

- **Cache busting**: `css/style.css?v=N` and `js/main.js?v=N` are referenced in `index.html` with a version query. Increment `N` on both whenever you change CSS or JS so visitors don't get stale cached files.
- **Photos**: every `<img>` points at `img/site/<name>.webp` and has explicit `width`/`height`. To replace a photo, the owner saves a new WebP with the same filename. There is no fallback system, so a missing file shows as broken.
- **Logo variants**: `img/logo-dark.png` is for light backgrounds and `img/logo-light.png` for dark ones. The nav uses a `<picture>` with a `prefers-color-scheme: dark` source. `favicon.png` and `apple-touch-icon.png` are derived from `img/LOGO JF.png`.
- **Arch photo swaps** (`archSwap` in `main.js`): the photos inside an arch are selected by position.
  - In the hero, the Nth `.hero__arch img` matches the Nth `.rotator__word`. Keep the two lists in the same order and with the same count.
  - In the events section, each `.ev` button has a `data-index` that points at the Nth `.events__arch img`.
  - The active photo has the `is-active` class.
- **Story section** (`initStory`): each `.chap` has a `chap--<moment>` class that sets `--c-bg`/`--c-fg` in CSS, plus a `data-moment` label. While scrolling, JS tweens `--story-bg`/`--story-fg` on `.story` to the colors of the active chapter, and moves the `.sundial` sun/moon along `.story__chapters`. To add a chapter, add both the CSS modifier and the time-of-day tokens.
- **Gallery filters**: `.chip[data-filter]` toggles `.is-hidden` on `.g[data-cat]` (`all` shows everything). The lightbox only cycles through visible (`.g:not(.is-hidden)`) photos.
- **JS progressive enhancement**: `main.js` checks for GSAP/ScrollTrigger. Without them, it runs only `initMenu`, `initLightbox`, `initRotator`, `initEventList` and `initFilters`, and shows the page as static. With them, it also respects `prefers-reduced-motion` (no Lenis, no intro timeline, no scroll animations or confetti; arch swaps become instant) and `(hover: hover) and (pointer: fine)` (magnetic buttons and selecting events on hover run only with a mouse).
- **Hooks between JS and HTML/CSS**: animations depend on these class names, so renaming one breaks it:
  - `.title` fades up on scroll (except inside the hero).
  - `.reveal-words` lights up word by word.
  - `.about__img`, `.ph` (story photos, `.ph--low` adds parallax), `.chap__head`, `.story__end p`.
  - `.ev`, `.events__arch`, `.bento .cell`, `.g`, `.steps__line path`, `.step`, `.step__dot`, `.location__panel`, `.footer__top`.
  - `.cta__bg`, `.cta__line`, `.cta__btn`, `.cta__confetti`.
  - `.magnetic` makes a button follow the mouse.
- **Smooth scroll**: when Lenis is active, in-page anchor links (`a[href^="#"]`) are intercepted and scrolled through Lenis. The mobile menu and lightbox call `lenis.stop()`/`start()`. Any new overlay should do the same.
- **Breakpoints**: the CSS uses 1100px, 1024px, 860px and 600px. Keep new responsive rules on these same widths.
- **Contact info** (WhatsApp `5515997615353`, Instagram `_eventosjf`, address Av. Ataliba Figueira, 122, Centro, Guareí-SP) is hard-coded in many `wa.me`/Instagram links throughout `index.html`, and is also in `README.md`. Update every occurrence together.

## Design

The current identity is light and colorful: paper background, forest green and the pink of the aisle flowers (`--accent`), with arch-shaped photo frames inspired by the venue's doorways, and an automatic dark mode. The only colors outside the palette are the green WhatsApp icons and the gradient Instagram icons. The real wedding of Lucas and Cássia drives the hero and the story section.

`.claude/skills/` (git-ignored, local only) has frontend design skills (taste-skill, redesign-skill, minimalist-skill, etc.). Earlier revisions used `taste-skill`.
