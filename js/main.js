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

  /* ---------- Fallback sem GSAP: página funciona estática ---------- */
  if (!hasGSAP) {
    $('.preloader')?.classList.add('is-done');
    $('.wa-float')?.classList.add('is-visible');
    initMenu(); initLightbox(); initRotator();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add('is-loading');

  /* ---------- Smooth scroll (Lenis) ---------- */
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
      document.body.classList.remove('menu-open');
      $('.nav__burger').setAttribute('aria-expanded', 'false');
      lenis?.start();
      scrollTo(el);
    });
  });

  /* ---------- Text splitting helpers ---------- */
  function splitLines(el) {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(p => `<span class="split-line"><span>${p.trim()}</span></span>`).join('');
    return $$('.split-line > span', el);
  }

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

  function splitChars(el) {
    const words = wrapWords(el, 'wd');
    const chars = [];
    words.forEach(w => {
      w.style.display = 'inline-block'; w.style.whiteSpace = 'nowrap';
      const t = w.textContent; w.textContent = '';
      [...t].forEach(ch => { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; w.appendChild(c); chars.push(c); });
    });
    return chars;
  }

  /* ---------- Preloader → Hero intro ---------- */
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
    // abertura curta: a marca aparece e a cortina sobe sem segurar o conteúdo
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    tl.to('.preloader__logo img', { y: 0, duration: .8 })
      .to('.preloader__bar i', { scaleX: 1, duration: .8, ease: 'power2.inOut' }, '<.05')
      .to('.preloader__inner', { yPercent: -40, opacity: 0, duration: .5, ease: 'power3.in' }, '+=.05')
      .to('.preloader__curtain--1', { yPercent: -100, duration: .9, ease: 'expo.inOut' }, '-=.2')
      .to('.preloader__curtain--2', { yPercent: -100, duration: .9, ease: 'expo.inOut' }, '-=.78')
      .add(reveal)
      .from('.hero__media img', { scale: 1.35, duration: 2.4, ease: 'expo.out' }, '-=1.2')
      .from('.hero__title .word', { yPercent: 115, rotate: 4, duration: 1.4, stagger: .08 }, '-=2')
      .from('.hero__eyebrow', { opacity: 0, y: 20, duration: 1 }, '-=1.2')
      .from('.hero__eyebrow .line', { scaleX: 0, duration: 1.2 }, '<')
      .from('.hero__sub', { opacity: 0, y: 30, duration: 1 }, '-=1')
      .from('.hero__ctas > *', { opacity: 0, y: 30, duration: 1, stagger: .1 }, '-=.8')
      .from('.nav', { yPercent: -100, opacity: 0, duration: 1, clearProps: 'transform,opacity' }, '-=1');

  }

  /* ---------- Hero: parallax + sparkles ---------- */
  function initHero() {
    gsap.to('.hero__media img', {
      yPercent: 12, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero__content', {
      yPercent: -18, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    // Partículas douradas que sobem e reagem ao mouse
    const canvas = $('.hero__sparks');
    const ctx = canvas.getContext('2d');
    let w, h, dpr, parts = [], mouse = { x: -9999, y: -9999 }, running = true;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(110, (w * h) / 14000));
      parts = Array.from({ length: n }, () => spawn(true));
    };
    const spawn = (anywhere) => ({
      x: Math.random() * w, y: anywhere ? Math.random() * h : h + 10,
      r: Math.random() * 1.8 + .4, vy: -(Math.random() * .5 + .15), vx: (Math.random() - .5) * .2,
      a: Math.random() * .6 + .2, tw: Math.random() * Math.PI * 2, ox: 0, oy: 0
    });
    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.tw += .04; p.x += p.vx; p.y += p.vy;
        const dx = p.x + p.ox - mouse.x, dy = p.y + p.oy - mouse.y, d = Math.hypot(dx, dy);
        if (d < 140) { const f = (140 - d) / 140; p.ox += (dx / d) * f * 2.2; p.oy += (dy / d) * f * 2.2; }
        p.ox *= .94; p.oy *= .94;
        if (p.y < -10) Object.assign(p, spawn(false));
        const alpha = p.a * (.55 + .45 * Math.sin(p.tw));
        const x = p.x + p.ox, y = p.y + p.oy;
        const g = ctx.createRadialGradient(x, y, 0, x, y, p.r * 4);
        g.addColorStop(0, `rgba(255,255,255,${alpha})`); g.addColorStop(1, 'rgba(200,204,212,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, p.r * 4, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    resize(); window.addEventListener('resize', resize);
    $('.hero').addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    $('.hero').addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    if (!reduceMotion) {
      draw();
      ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onToggle: s => { running = s.isActive; if (running) draw(); } });
    }
  }

  /* ---------- Rotating words ---------- */
  function initRotator() {
    const words = $$('.rotator__word');
    if (words.length < 2) return;
    let i = 0;
    setInterval(() => {
      const cur = words[i]; i = (i + 1) % words.length; const next = words[i];
      if (typeof gsap === 'undefined') { cur.classList.remove('is-active'); next.classList.add('is-active'); return; }
      gsap.to(cur, { y: 0, yPercent: -100, opacity: 0, duration: .6, ease: 'power3.in', onComplete: () => cur.classList.remove('is-active') });
      gsap.fromTo(next, { y: 0, yPercent: 100, opacity: 0 }, { y: 0, yPercent: 0, opacity: 1, duration: .8, delay: .3, ease: 'expo.out', onStart: () => next.classList.add('is-active') });
    }, 2600);
  }

  /* ---------- Marquee com velocidade do scroll ---------- */
  function initMarquee() {
    const track = $('.marquee__track');
    const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    let dir = 1;
    ScrollTrigger.create({
      onUpdate: self => {
        const v = self.getVelocity();
        if (self.direction !== dir) dir = self.direction;
        gsap.to(loop, { timeScale: dir * Math.min(6, 1 + Math.abs(v) / 300), duration: .2, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: .2 });
      }
    });
  }

  /* ---------- Títulos e reveals genéricos ---------- */
  function initReveals() {
    $$('.split-lines').forEach(el => {
      const lines = splitLines(el);
      gsap.from(lines, {
        yPercent: 110, rotate: 3, duration: 1.3, ease: 'expo.out', stagger: .12,
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });


    $$('.fade-up').forEach(el => gsap.from(el, { opacity: 0, y: 50, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));

    // Palavras acendendo conforme o scroll
    $$('.reveal-words').forEach(el => {
      const words = wrapWords(el);
      gsap.to(words, {
        opacity: 1, stagger: .1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true }
      });
    });

    // Imagens com cortina (clip-path) + parallax interno
    $$('.clip-reveal').forEach(el => {
      gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
      const img = $('img', el);
      if (img) gsap.fromTo(img, { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    gsap.from('.about__badge', { scale: 0, rotate: -180, duration: 1.6, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.about__visual', start: 'top 60%' } });
    gsap.to('.about__img--b', { y: -60, ease: 'none', scrollTrigger: { trigger: '.about__visual', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- Eventos: scroll horizontal fixado ---------- */
  function initEvents() {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      const track = $('.events__track');
      const getDist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -getDist(), ease: 'none',
        scrollTrigger: {
          trigger: '.events', start: 'top top', end: () => '+=' + getDist(),
          pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1
        }
      });
      $$('.ecard', track).forEach(card => {
        const img = $('img', card);
        gsap.from(card, {
          y: 80, rotate: 3, opacity: 0, duration: 1, ease: 'expo.out',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 100%' }
        });
        if (img) gsap.fromTo(img, { xPercent: -8 }, {
          xPercent: 8, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
        });
      });
    });
    mm.add('(max-width: 860px)', () => {
      gsap.from('.ecard', { x: 80, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.events__track', start: 'top 85%' } });
    });
  }

  /* ---------- Estrutura (bento): entrada em sequência + borda que segue o cursor ---------- */
  function initFeatures() {
    gsap.from('.bento .cell', {
      y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .08,
      scrollTrigger: { trigger: '.bento', start: 'top 80%' }
    });
    $$('.cell--img img').forEach(img => gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, {
      yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    }));
    if (!finePointer) return;
    $$('.cell--plain').forEach(cell => {
      cell.addEventListener('pointermove', e => {
        const r = cell.getBoundingClientRect();
        cell.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        cell.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Citação: letras + parallax ---------- */
  function initQuote() {
    gsap.to('.quote__bg', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.quote', start: 'top bottom', end: 'bottom top', scrub: true } });
    const chars = splitChars($('.reveal-chars'));
    gsap.from(chars, {
      opacity: 0, yPercent: 60, rotateX: -90, filter: 'blur(8px)', stagger: .018, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: '.quote', start: 'top 55%' }
    });
  }

  /* ---------- Galeria ---------- */
  function initGallery() {
    $$('.g').forEach((g, i) => {
      gsap.fromTo(g, { clipPath: 'inset(15% 15% 15% 15% round 6px)', opacity: 0 }, {
        clipPath: 'inset(0% 0% 0% 0% round 6px)', opacity: 1, duration: 1.4, ease: 'expo.out', delay: (i % 4) * .08,
        scrollTrigger: { trigger: g, start: 'top 92%' }
      });
      gsap.fromTo($('img', g), { scale: 1.4 }, { scale: 1, duration: 1.8, ease: 'expo.out', delay: (i % 4) * .08, scrollTrigger: { trigger: g, start: 'top 92%' }, clearProps: 'transform' });
    });
  }

  /* ---------- Passos: linha sendo desenhada ---------- */
  function initSteps() {
    const path = $('.steps__line path');
    if (path) {
      gsap.set(path, { strokeDasharray: 1, strokeDashoffset: 1, attr: { pathLength: 1 } });
      gsap.to(path, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.steps__wrap', start: 'top 75%', end: 'bottom 60%', scrub: true } });
    }
    gsap.from('.step', { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .15, scrollTrigger: { trigger: '.steps__list', start: 'top 80%' } });
    gsap.from('.step__dot', { scale: 0, duration: 1, ease: 'back.out(2)', stagger: .15, scrollTrigger: { trigger: '.steps__list', start: 'top 80%' } });
  }

  /* ---------- CTA + confete ---------- */
  function initCTA() {
    gsap.from('.cta__line > *', { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.cta', start: 'top 70%' } });
    gsap.from(['.cta__sub', '.cta__btn'], { opacity: 0, y: 30, duration: 1, ease: 'expo.out', stagger: .12, delay: .3, scrollTrigger: { trigger: '.cta', start: 'top 70%' } });

    const canvas = $('.cta__confetti'); const ctx = canvas.getContext('2d');
    const colors = ['#ffffff', '#f4f4f5', '#e4e4e7', '#c9ccd2', '#a1a1aa', '#71717a', '#3f3f46'];
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

    ScrollTrigger.create({
      trigger: '.cta', start: 'top 45%', once: true,
      onEnter: () => { burst(w * .2, h * .55, 110); setTimeout(() => burst(w * .8, h * .55, 110), 250); }
    });
    const btn = $('.cta__btn');
    const fromBtn = () => { const r = btn.getBoundingClientRect(), c = canvas.getBoundingClientRect(); burst(r.left - c.left + r.width / 2, r.top - c.top + r.height / 2, 90); };
    btn.addEventListener('mouseenter', fromBtn);
    btn.addEventListener('click', fromBtn);
  }

  /* ---------- Localização e footer ---------- */
  function initLocation() {
    gsap.from('.footer__top > *', { y: 40, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.footer', start: 'top 90%' } });
  }

  /* ---------- Nav: esconde/mostra + link ativo + progresso ---------- */
  function initNav() {
    const nav = $('.nav');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: self => {
        nav.classList.toggle('is-scrolled', self.scroll() > 60);
        if (!document.body.classList.contains('menu-open')) nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 500);
        gsap.set('.progress i', { scaleX: self.progress });
        $('.wa-float').classList.toggle('is-visible', self.scroll() > window.innerHeight * .6);
      }
    });
    $$('.nav__links a').forEach(a => {
      const sec = $(a.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: s => a.classList.toggle('is-active', s.isActive) });
    });
  }

  /* ---------- Menu mobile ---------- */
  function initMenu() {
    const burger = $('.nav__burger');
    burger.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
      $('.menu').setAttribute('aria-hidden', !open);
      if (lenis) open ? lenis.stop() : lenis.start();
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
        mx((e.clientX - r.left - r.width / 2) * .35); my((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  /* ---------- Lightbox ---------- */
  function initLightbox() {
    const lb = $('.lightbox'), img = $('img', lb);
    const items = $$('.g img');
    let idx = 0;
    const show = i => {
      idx = (i + items.length) % items.length;
      const src = items[idx].src.replace(/w=\d+/, 'w=1800');
      img.style.opacity = 0;
      img.onload = () => { img.style.opacity = 1; };
      img.src = src; img.alt = items[idx].alt;
    };
    let opener = null;
    const open = i => { opener = document.activeElement; show(i); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); lenis?.stop(); $('.lightbox__close').focus(); };
    const close = () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); lenis?.start(); opener?.focus(); };
    items.forEach((it, i) => {
      const fig = it.parentElement;
      fig.tabIndex = 0; fig.setAttribute('role', 'button'); fig.setAttribute('aria-label', 'Ampliar foto: ' + it.alt);
      fig.addEventListener('click', () => open(i));
      fig.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
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

  /* ---------- Celular: foto ganha cor ao passar pelo centro da tela ---------- */
  function initFocusColor() {
    if (finePointer) return;
    $$('.about__img, .ecard, .g, .cell--img').forEach(el => {
      ScrollTrigger.create({ trigger: el, start: 'top 65%', end: 'bottom 35%', toggleClass: 'in-focus' });
    });
  }

  /* ---------- Boot ---------- */
  initMenu();
  initLightbox();
  initMagnetic();
  initHero();
  initRotator();
  initMarquee();
  initReveals();
  initEvents();
  initFeatures();
  initQuote();
  initGallery();
  initSteps();
  initCTA();
  initLocation();
  initNav();
  initFocusColor();

  // Começa quando a foto principal carregar (ou após 3,5s, para não prender o usuário)
  const start = () => { intro(); ScrollTrigger.refresh(); };
  const heroImg = $('.hero__media img');
  if (heroImg.complete) start();
  else { heroImg.addEventListener('load', start, { once: true }); heroImg.addEventListener('error', start, { once: true }); }
  setTimeout(start, 3500);
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
