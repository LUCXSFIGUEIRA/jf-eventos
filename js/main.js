/* =========================================================
   JF EVENTOS - interações e animações
   GSAP + ScrollTrigger + Lenis
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  let lenis = null;
  $('.year').textContent = new Date().getFullYear();

  /* ---------- Troca de foto dentro do arco (hero e eventos) ---------- */
  function archSwap(arch, i) {
    const imgs = $$('img', arch);
    const next = imgs[i];
    const prev = imgs.find(im => im.classList.contains('is-active'));
    if (!next || next === prev) return;
    if (!hasGSAP || reduceMotion) {
      prev?.classList.remove('is-active');
      next.classList.add('is-active');
      return;
    }
    imgs.forEach(im => { im.style.zIndex = ''; });
    if (prev) prev.style.zIndex = 1;
    next.style.zIndex = 2;
    next.classList.add('is-active');
    gsap.killTweensOf(next);
    // a nova foto "sobe" como uma porta se abrindo
    gsap.fromTo(next, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.14 }, {
      clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.1, ease: 'expo.inOut',
      onComplete: () => { if (prev && prev !== next) prev.classList.remove('is-active'); next.style.zIndex = ''; }
    });
  }

  /* ---------- Palavra que gira no hero + foto do arco junto ---------- */
  function initRotator() {
    const words = $$('.rotator__word');
    const arch = $('.hero__arch');
    if (words.length < 2) return;
    let i = 0, paused = false;
    if (hasGSAP) ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onToggle: s => { paused = !s.isActive; } });
    setInterval(() => {
      if (paused || document.hidden) return;
      const cur = words[i]; i = (i + 1) % words.length; const next = words[i];
      archSwap(arch, i);
      if (!hasGSAP || reduceMotion) { cur.classList.remove('is-active'); next.classList.add('is-active'); return; }
      gsap.to(cur, { y: 0, yPercent: -100, opacity: 0, duration: .6, ease: 'power3.in', onComplete: () => cur.classList.remove('is-active') });
      gsap.fromTo(next, { y: 0, yPercent: 100, opacity: 0 }, { y: 0, yPercent: 0, opacity: 1, duration: .8, delay: .15, ease: 'expo.out', onStart: () => next.classList.add('is-active') });
    }, 3200);
  }

  /* ---------- Eventos: escolher um tipo troca a foto do arco ---------- */
  function initEventList() {
    const items = $$('.ev');
    const arch = $('.events__arch');
    const select = btn => {
      if (btn.classList.contains('is-active')) return;
      items.forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', b === btn); });
      archSwap(arch, +btn.dataset.index);
      if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 650);
    };
    items.forEach(btn => {
      btn.addEventListener('click', () => select(btn));
      if (finePointer) btn.addEventListener('mouseenter', () => select(btn));
    });
  }

  /* ---------- Galeria: filtros ---------- */
  function initFilters() {
    const chips = $$('.chip');
    const figs = $$('.g');
    chips.forEach(chip => chip.addEventListener('click', () => {
      const f = chip.dataset.filter;
      chips.forEach(c => { c.classList.toggle('is-active', c === chip); c.setAttribute('aria-pressed', c === chip); });
      figs.forEach(g => g.classList.toggle('is-hidden', f !== 'all' && g.dataset.cat !== f));
      const shown = figs.filter(g => !g.classList.contains('is-hidden'));
      if (hasGSAP && !reduceMotion) gsap.fromTo(shown, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, ease: 'expo.out', stagger: .04, clearProps: 'transform,opacity' });
      if (hasGSAP) ScrollTrigger.refresh();
    }));
  }

  /* ---------- Menu mobile ---------- */
  function initMenu() {
    const burger = $('.nav__burger');
    const toggle = open => {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      $('.menu').setAttribute('aria-hidden', !open);
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    burger.addEventListener('click', () => toggle(!document.body.classList.contains('menu-open')));
    $$('.menu a').forEach(a => a.addEventListener('click', () => toggle(false)));
  }

  /* ---------- Lightbox (só fotos visíveis da galeria) ---------- */
  function initLightbox() {
    const lb = $('.lightbox'), img = $('img', lb);
    let items = [], idx = 0, opener = null;
    const show = i => {
      idx = (i + items.length) % items.length;
      img.style.opacity = 0;
      img.onload = () => { img.style.opacity = 1; };
      img.src = items[idx].currentSrc || items[idx].src; img.alt = items[idx].alt;
    };
    const open = el => {
      items = $$('.g:not(.is-hidden) img');
      opener = document.activeElement; show(items.indexOf(el));
      lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); lenis?.stop(); $('.lightbox__close').focus();
    };
    const close = () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); lenis?.start(); opener?.focus(); };
    $$('.g').forEach(fig => {
      const it = $('img', fig);
      fig.tabIndex = 0; fig.setAttribute('role', 'button'); fig.setAttribute('aria-label', 'Ampliar foto: ' + it.alt);
      fig.addEventListener('click', () => open(it));
      fig.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(it); } });
    });
    $('.lightbox__close').addEventListener('click', close);
    $('.lightbox__prev').addEventListener('click', e => { e.stopPropagation(); show(idx - 1); });
    $('.lightbox__next').addEventListener('click', e => { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
  }

  /* ---------- Sem GSAP: a página funciona estática ---------- */
  if (!hasGSAP) {
    $('.preloader')?.classList.add('is-done');
    $('.wa-float')?.classList.add('is-visible');
    initMenu(); initLightbox(); initRotator(); initEventList(); initFilters();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add('is-loading');

  /* ---------- Rolagem suave (Lenis) ---------- */
  if (typeof window.Lenis !== 'undefined' && !reduceMotion) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  const scrollTo = target => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    else (typeof target === 'number' ? window.scrollTo({ top: target, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
  };
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const el = id === '#inicio' ? 0 : $(id);
      if (el === null) return;
      e.preventDefault();
      lenis?.start();
      scrollTo(el);
    });
  });

  function wrapWords(el, cls = 'w') {
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(tok => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span'); s.className = cls; s.textContent = tok; frag.appendChild(s);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(el);
    return $$('.' + cls, el);
  }

  /* ---------- Abertura → entrada do hero ---------- */
  let started = false;
  function intro() {
    if (started) return;
    started = true;
    const reveal = () => {
      $('.preloader').classList.add('is-done');
      document.body.classList.remove('is-loading');
      lenis?.start();
    };
    if (reduceMotion) { reveal(); return; }
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.preloader__logo img', { y: 0, duration: .7 })
      .to('.preloader__logo', { yPercent: -60, opacity: 0, duration: .45, ease: 'power3.in' }, '+=.1')
      .to('.preloader__curtain--1', { yPercent: -100, duration: .85, ease: 'expo.inOut' }, '-=.15')
      .to('.preloader__curtain--2', { yPercent: -100, duration: .85, ease: 'expo.inOut' }, '-=.72')
      .add(reveal)
      // o arco se abre de baixo para cima, como um portal
      .fromTo('.hero__arch', { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 14px 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 999px 999px 14px 14px)', duration: 1.6, ease: 'expo.inOut', clearProps: 'clipPath' }, '-=.75')
      .from('.hero__arch img.is-active', { scale: 1.25, duration: 2.2 }, '<')
      .from('.hero__title .word', { yPercent: 115, duration: 1.3, stagger: .1 }, '-=1.9')
      .from('.hero__eyebrow', { opacity: 0, y: 16, duration: 1 }, '-=1.1')
      .from('.hero__sub', { opacity: 0, y: 24, duration: 1 }, '-=.9')
      .from('.hero__ctas > *', { opacity: 0, y: 24, duration: 1, stagger: .08 }, '-=.8')
      .from('.hero__float', { opacity: 0, scale: .8, rotate: -6, duration: 1.2, ease: 'back.out(1.4)' }, '-=1')
      .from('.nav', { yPercent: -100, opacity: 0, duration: 1, clearProps: 'transform,opacity' }, '-=1');
  }

  /* ---------- Hero: profundidade ao rolar ---------- */
  function initHero() {
    if (reduceMotion) return;
    gsap.to('.hero__arch', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__float', { yPercent: -45, rotate: -4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- Marquee acompanha a velocidade do scroll ---------- */
  function initMarquee() {
    if (reduceMotion) return;
    const loop = gsap.to('.marquee__track', { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      onUpdate: self => {
        const v = self.getVelocity();
        gsap.to(loop, { timeScale: self.direction * Math.min(5, 1 + Math.abs(v) / 300), duration: .2, overwrite: true });
        gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: .2 });
      }
    });
  }

  /* ---------- Títulos e textos ---------- */
  function initReveals() {
    if (reduceMotion) return;
    $$('.title').forEach(el => {
      if (el.closest('.hero')) return;
      gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    // frase do "Sobre" acende palavra por palavra conforme a leitura
    $$('.reveal-words').forEach(el => {
      gsap.to(wrapWords(el), { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 50%', scrub: true } });
    });
    $$('.about__img').forEach((fig, i) => {
      gsap.from(fig, { y: 80, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: fig, start: 'top 90%' } });
      gsap.fromTo($('img', fig), { yPercent: -14 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.to(fig, { y: i ? -60 : -20, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- Um dia no JF: cor e relógio acompanham a hora do dia ---------- */
  function initStory() {
    const story = $('.story');
    const chaps = $$('.chap', story);
    const dial = $('.sundial');
    const body = $('.sundial__body');
    const label = $('.sundial__label');
    const root = document.documentElement;
    const css = (el, v) => getComputedStyle(el).getPropertyValue(v).trim();

    story.classList.add('is-live');
    const theme = (bg, fg) => gsap.to(story, { '--story-bg': bg, '--story-fg': fg, duration: reduceMotion ? 0 : 1, ease: 'power2.out', overwrite: 'auto' });
    gsap.set(story, { '--story-bg': css(root, '--tarde-bg'), '--story-fg': css(root, '--tarde-fg') });

    const segments = [
      { el: $('.story__intro'), bg: () => css(root, '--tarde-bg'), fg: () => css(root, '--tarde-fg') },
      ...chaps.map(ch => ({ el: ch, bg: () => css(ch, '--c-bg'), fg: () => css(ch, '--c-fg'), moment: ch.dataset.moment })),
      { el: $('.story__end'), bg: () => css(root, '--paper'), fg: () => css(root, '--ink') }
    ];
    segments.forEach(seg => ScrollTrigger.create({
      trigger: seg.el, start: 'top 55%', end: 'bottom 55%',
      onToggle: s => {
        if (!s.isActive) return;
        theme(seg.bg(), seg.fg());
        if (seg.moment) label.textContent = seg.moment;
      }
    }));

    // relógio: o sol cruza o arco até o pôr do sol; depois a lua sobe
    const R = 52, CX = 60, CY = 58;
    const place = deg => { const a = deg * Math.PI / 180; body.setAttribute('cx', (CX + R * Math.cos(a)).toFixed(2)); body.setAttribute('cy', (CY - R * Math.sin(a)).toFixed(2)); };
    place(150);
    ScrollTrigger.create({
      trigger: '.story__chapters', start: 'top 55%', end: 'bottom 55%',
      onToggle: s => dial.classList.toggle('is-on', s.isActive),
      onUpdate: s => {
        const p = s.progress;
        const night = p > .5;
        dial.classList.toggle('is-night', night);
        place(night ? 180 - (p - .5) / .5 * 130 : 150 - p / .5 * 150);
      }
    });

    if (reduceMotion) return;
    $$('.ph', story).forEach((ph, i) => {
      gsap.fromTo(ph, { clipPath: 'inset(14% 10% 14% 10% round 14px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: ph, start: 'top 88%' }
      });
      gsap.fromTo($('img', ph), { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: ph, start: 'top 88%' } });
      if (ph.classList.contains('ph--low')) gsap.to(ph, { y: -70, ease: 'none', scrollTrigger: { trigger: ph, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.chap__head', story).forEach(h => gsap.from(h.children, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: h.parentElement, start: 'top 70%' } }));
    const endWords = wrapWords($('.story__end p'));
    gsap.from(endWords, { yPercent: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: '.story__end', start: 'top 70%' } });
  }

  /* ---------- Estrutura, galeria, passos ---------- */
  function initSections() {
    if (reduceMotion) return;
    gsap.from('.ev', { x: -40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '.events__list', start: 'top 85%' }, clearProps: 'transform,opacity' });
    gsap.from('.events__arch', { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 14px 14px)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: '.events', start: 'top 70%' }, clearProps: 'clipPath' });

    gsap.from('.bento .cell', { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.bento', start: 'top 80%' } });

    $$('.g').forEach((g, i) => gsap.from(g, { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', delay: (i % 3) * .08, scrollTrigger: { trigger: g, start: 'top 94%' }, clearProps: 'transform,opacity' }));

    const path = $('.steps__line path');
    if (path) {
      gsap.set(path, { strokeDasharray: 1, strokeDashoffset: 1, attr: { pathLength: 1 } });
      gsap.to(path, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.steps__wrap', start: 'top 75%', end: 'bottom 60%', scrub: true } });
    }
    gsap.from('.step', { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .14, scrollTrigger: { trigger: '.steps__list', start: 'top 82%' } });
    gsap.from('.step__dot', { scale: 0, duration: 1, ease: 'back.out(2)', stagger: .14, scrollTrigger: { trigger: '.steps__list', start: 'top 82%' } });

    gsap.from('.location__panel', { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.location', start: 'top 70%' } });
    gsap.from('.footer__top > *', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.footer', start: 'top 90%' } });
  }

  /* ---------- Chamada final + confete ---------- */
  function initCTA() {
    if (!reduceMotion) {
      gsap.to('.cta__bg', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from('.cta__line > *', { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.cta', start: 'top 70%' } });
      gsap.from(['.cta__sub', '.cta__btn'], { opacity: 0, y: 30, duration: 1, ease: 'expo.out', stagger: .12, delay: .3, scrollTrigger: { trigger: '.cta', start: 'top 70%' } });
    }
    const canvas = $('.cta__confetti'); const ctx = canvas.getContext('2d');
    const colors = ['#c2306b', '#f7a3c4', '#fbf4f8', '#dfe7d8', '#7fb08f', '#f6dccb'];
    let pieces = [], animating = false, w, h;
    const resize = () => { const dpr = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); window.addEventListener('resize', resize);

    const burst = (x, y, n = 140) => {
      if (reduceMotion) return;
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2, sp = Math.random() * 11 + 4;
        pieces.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 6, w: Math.random() * 8 + 4, h: Math.random() * 5 + 3, rot: Math.random() * 360, vr: (Math.random() - .5) * 18, c: colors[i % colors.length], life: 1, shape: Math.random() > .7 ? 'c' : 'r' });
      }
      if (!animating) { animating = true; tick(); }
    };
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      pieces = pieces.filter(p => p.life > 0 && p.y < h + 40);
      for (const p of pieces) {
        p.vy += .28; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= .006;
        ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5)); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.c;
        if (p.shape === 'c') { ctx.beginPath(); ctx.arc(0, 0, p.h / 1.6, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.scale(1, Math.cos(p.rot * Math.PI / 90)); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        ctx.restore();
      }
      if (pieces.length) requestAnimationFrame(tick); else { animating = false; ctx.clearRect(0, 0, w, h); }
    };
    ScrollTrigger.create({ trigger: '.cta', start: 'top 45%', once: true, onEnter: () => { burst(w * .2, h * .55, 110); setTimeout(() => burst(w * .8, h * .55, 110), 250); } });
    const btn = $('.cta__btn');
    const fromBtn = () => { const r = btn.getBoundingClientRect(), c = canvas.getBoundingClientRect(); burst(r.left - c.left + r.width / 2, r.top - c.top + r.height / 2, 90); };
    btn.addEventListener('mouseenter', fromBtn);
    btn.addEventListener('click', fromBtn);
  }

  /* ---------- Nav: esconde ao descer, link ativo, botão flutuante ---------- */
  function initNav() {
    const nav = $('.nav');
    const wa = $('.wa-float');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: self => {
        const y = self.scroll();
        nav.classList.toggle('is-scrolled', y > 40);
        if (!document.body.classList.contains('menu-open')) nav.classList.toggle('is-hidden', self.direction === 1 && y > 500);
        wa.classList.toggle('is-visible', y > window.innerHeight * .6);
      }
    });
    $$('.nav__links a').forEach(a => {
      const sec = $(a.getAttribute('href'));
      if (sec) ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: s => a.classList.toggle('is-active', s.isActive) });
    });
  }

  /* ---------- Botões magnéticos (só mouse) ---------- */
  function initMagnetic() {
    if (!finePointer || reduceMotion) return;
    $$('.magnetic').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .4)' });
      const my = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .3); my((e.clientY - r.top - r.height / 2) * .3);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  /* ---------- Início ---------- */
  initMenu();
  initLightbox();
  initMagnetic();
  initHero();
  initRotator();
  initEventList();
  initFilters();
  initMarquee();
  initReveals();
  initStory();
  initSections();
  initCTA();
  initNav();

  // começa quando a foto principal carregar (ou após 3s, para não prender ninguém)
  const start = () => { intro(); ScrollTrigger.refresh(); };
  const heroImg = $('.hero__arch img.is-active');
  if (heroImg.complete) start();
  else { heroImg.addEventListener('load', start, { once: true }); heroImg.addEventListener('error', start, { once: true }); }
  setTimeout(start, 3000);
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
