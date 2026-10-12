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
  const DESKTOP = '(min-width: 861px)';

  let lenis = null;
  $('.year').textContent = new Date().getFullYear();

  /* ---------- Eventos: faixas que se abrem ---------- */
  function initStrips() {
    const strips = $$('.strip');
    const open = s => strips.forEach(x => {
      const on = x === s;
      x.classList.toggle('is-open', on);
      x.setAttribute('aria-expanded', on);
    });
    strips.forEach(s => {
      s.addEventListener('click', () => open(s));
      s.addEventListener('focus', () => open(s));
      if (finePointer) s.addEventListener('mouseenter', () => open(s));
    });
  }

  /* ---------- Menu do celular ---------- */
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

  /* ---------- Lightbox da galeria ---------- */
  function initLightbox() {
    const lb = $('.lightbox'), img = $('img', lb);
    const items = $$('.g img');
    let idx = 0, opener = null;
    const show = i => {
      idx = (i + items.length) % items.length;
      img.style.opacity = 0;
      img.onload = () => { img.style.opacity = 1; };
      img.src = items[idx].currentSrc || items[idx].src; img.alt = items[idx].alt;
    };
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

  /* ---------- Sem GSAP: a página funciona estática ---------- */
  if (!hasGSAP) {
    $('.wa-float')?.classList.add('is-visible');
    initMenu(); initLightbox(); initStrips();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Rolagem suave (Lenis) ---------- */
  if (typeof window.Lenis !== 'undefined' && !reduceMotion) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const el = id === '#inicio' ? 0 : $(id);
      if (el === null) return;
      e.preventDefault();
      lenis?.start();
      if (lenis) lenis.scrollTo(el, { duration: 1.6 });
      else if (el === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
      else el.scrollIntoView({ behavior: 'smooth' });
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

  /* ---------- Entrada da página ---------- */
  let started = false;
  function intro() {
    if (started || reduceMotion) return;
    started = true;
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('.hero__view', { scale: 1.25, duration: 2.2 })
      .from('.door__handle', { scale: 0, duration: 1.2, stagger: .1 }, .3)
      .from('.hero__word', { yPercent: 110, duration: 1.2, stagger: .08 }, .5)
      .from(['.door--a .eyebrow', '.hero__sub', '.hero__ctas > *'], { opacity: 0, y: 18, duration: 1, stagger: .08 }, .9)
      .from('.nav', { yPercent: -100, opacity: 0, duration: 1, clearProps: 'transform,opacity' }, .6);
  }

  /* ---------- Hero: as portas se abrem com a rolagem ---------- */
  function initHero() {
    if (reduceMotion) return;
    const mm = gsap.matchMedia();
    const build = (prop, a, b) => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=110%', pin: true, scrub: .8, anticipatePin: 1 }
      });
      tl.to('.door--a', { [prop]: a, ease: 'power2.inOut' }, 0)
        .to('.door--b', { [prop]: b, ease: 'power2.inOut' }, 0)
        .fromTo('.hero__view img', { scale: 1.12 }, { scale: 1, ease: 'none' }, 0)
        .to('.hero__caption', { opacity: 1, duration: .2 }, .8);
      return tl;
    };
    mm.add(DESKTOP, () => { build('xPercent', -101, 101); });
    mm.add('(max-width: 860px)', () => { build('yPercent', -101, 101); });
  }

  /* ---------- Sobre: palavras acendem com a leitura, fotos sobem ---------- */
  function initAbout() {
    if (reduceMotion) return;
    const lede = $('.about__lede');
    gsap.to(wrapWords(lede), { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: lede, start: 'top 80%', end: 'bottom 50%', scrub: true } });
    gsap.from('.about__pic', { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.about__trio', start: 'top 85%' } });
  }

  /* ---------- Um dia no JF: percurso horizontal, céu muda de cor ---------- */
  function initStory() {
    const story = $('.story');
    const track = $('.story__track');
    const chaps = $$('.chap', story);
    const sun = $('.horizon__sun');
    const marks = $$('.horizon__marks li');
    const horizon = $('.horizon');
    const css = (el, v) => getComputedStyle(el).getPropertyValue(v).trim();
    const mm = gsap.matchMedia();

    mm.add(DESKTOP, () => {
      if (reduceMotion) return;
      story.classList.add('is-h');
      const dist = () => track.scrollWidth - window.innerWidth;
      let stops = [], bgs = [], fgs = [];

      // cada capítulo é uma "parada": quando ele está no centro da tela, o céu tem a cor dele
      const measure = () => {
        const d = dist();
        const centerOf = el => Math.min(1, Math.max(0, (el.offsetLeft + el.offsetWidth / 2 - window.innerWidth / 2) / d));
        stops = [0, ...chaps.map(centerOf), 1];
        const root = document.documentElement;
        bgs = [css(root, '--tarde-bg'), ...chaps.map(c => css(c, '--c-bg')), css(root, '--festa-bg')];
        fgs = [css(root, '--tarde-fg'), ...chaps.map(c => css(c, '--c-fg')), css(root, '--festa-fg')];
      };

      const paint = p => {
        let i = 0;
        while (i < stops.length - 2 && p > stops[i + 1]) i++;
        const span = stops[i + 1] - stops[i] || 1;
        const t = Math.min(1, Math.max(0, (p - stops[i]) / span));
        story.style.setProperty('--story-bg', gsap.utils.interpolate(bgs[i], bgs[i + 1], t));
        story.style.setProperty('--story-fg', gsap.utils.interpolate(fgs[i], fgs[i + 1], t));
        // sol: parada 1..6 = capítulos, marcadores igualmente espaçados
        const chapPos = Math.min(chaps.length - 1, Math.max(0, i - 1 + t));
        sun.style.left = (chapPos / (chaps.length - 1)) * 100 + '%';
        const active = Math.round(chapPos);
        marks.forEach((m, k) => m.classList.toggle('is-active', k === active && p > stops[0] + .02));
        horizon.classList.toggle('is-night', active >= 4);
      };

      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: story, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
          onRefresh: measure, onUpdate: s => paint(s.progress)
        }
      });
      measure(); paint(0);

      // fotos de cada capítulo entram em leque conforme chegam
      chaps.forEach(ch => {
        gsap.from($$('.ph', ch), {
          y: 60, opacity: 0, rotate: (i) => [-2, 3, -1][i % 3], duration: 1, ease: 'expo.out', stagger: .1,
          scrollTrigger: { trigger: ch, containerAnimation: tween, start: 'left 75%' }
        });
      });

      return () => { story.classList.remove('is-h'); story.style.removeProperty('--story-bg'); story.style.removeProperty('--story-fg'); };
    });

    mm.add('(max-width: 860px)', () => {
      // celular: barra do horizonte fixa embaixo, o sol anda de capítulo em capítulo
      const n = chaps.length;
      const showBar = ScrollTrigger.create({
        trigger: chaps[0], endTrigger: chaps[n - 1], start: 'top 70%', end: 'bottom 60%',
        onToggle: s => horizon.classList.toggle('is-on', s.isActive)
      });
      const setChap = (k, prog) => {
        sun.style.left = Math.min(100, ((k + prog) / n) * 100) + '%';
        marks.forEach((m, j) => m.classList.toggle('is-active', j === k));
        horizon.classList.toggle('is-night', k >= 4);
        story.style.setProperty('--story-bg', css(chaps[k], '--c-bg'));
        story.style.setProperty('--story-fg', css(chaps[k], '--c-fg'));
      };
      const triggers = chaps.map((ch, k) => ScrollTrigger.create({
        trigger: ch, start: 'top 60%', end: 'bottom 60%',
        onUpdate: s => setChap(k, s.progress),
        onToggle: s => { if (s.isActive) setChap(k, s.progress); }
      }));
      setChap(0, 0);
      const cleanup = () => { showBar.kill(); triggers.forEach(t => t.kill()); horizon.classList.remove('is-on', 'is-night'); story.style.removeProperty('--story-bg'); story.style.removeProperty('--story-fg'); };
      if (reduceMotion) return cleanup;
      $$('.ph', story).forEach(ph => gsap.from(ph, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: ph, start: 'top 90%' } }));
      return cleanup;
    });
  }

  /* ---------- Estrutura: a foto fixa troca conforme o texto ---------- */
  function initSpaces() {
    const section = $('.spaces');
    const items = $$('.space', section);
    const imgs = $$('.spaces__media img', section);
    section.classList.add('is-live');
    const activate = i => {
      items.forEach((it, k) => it.classList.toggle('is-active', k === i));
      imgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
    };
    activate(0);
    items.forEach((it, i) => ScrollTrigger.create({ trigger: it, start: 'top 60%', end: 'bottom 60%', onToggle: s => { if (s.isActive) activate(i); } }));
  }

  /* ---------- Galeria: fileiras em sentidos opostos ---------- */
  function initGallery() {
    const mm = gsap.matchMedia();
    mm.add(DESKTOP, () => {
      if (reduceMotion) return;
      const gallery = $('.gallery');
      gallery.classList.add('is-drift');
      const [a, b] = $$('.reel', gallery);
      const over = el => Math.max(0, el.scrollWidth - window.innerWidth);
      const st = { trigger: gallery, start: 'top bottom', end: 'bottom top', scrub: .6, invalidateOnRefresh: true };
      gsap.fromTo(a, { x: 0 }, { x: () => -over(a), ease: 'none', scrollTrigger: st });
      gsap.fromTo(b, { x: () => -over(b) }, { x: 0, ease: 'none', scrollTrigger: { ...st } });
      return () => gallery.classList.remove('is-drift');
    });
  }

  /* ---------- Títulos e blocos entrando ---------- */
  function initReveals() {
    if (reduceMotion) return;
    $$('.title').forEach(el => {
      if (el.closest('.hero') || el.closest('.story')) return;
      gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    $$('.fade-up').forEach(el => gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
    gsap.from('.strip', { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '.strips', start: 'top 85%' }, clearProps: 'transform,opacity' });
    gsap.from('.spaces__extra li', { y: 20, opacity: 0, duration: .8, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '.spaces__extra', start: 'top 92%' } });
    gsap.from('.location__map', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: '.location', start: 'top 70%' }, clearProps: 'clipPath' });
    gsap.from('.info li', { x: -20, opacity: 0, duration: .9, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.info', start: 'top 85%' } });
    gsap.from('.footer__top > *', { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.footer', start: 'top 90%' } });
  }

  /* ---------- Chamada final + confete ---------- */
  function initCTA() {
    if (!reduceMotion) {
      gsap.to('.cta__bg', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from(['.cta__title', '.cta__sub', '.cta__btn'], { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.cta', start: 'top 70%' } });
      gsap.from('.step', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.steps', start: 'top 90%' } });
    }
    const canvas = $('.cta__confetti'); const ctx = canvas.getContext('2d');
    const colors = ['#a95b33', '#e9a77e', '#f4f2ee', '#8fa3b8', '#dde5ec', '#ebcdb4'];
    let pieces = [], animating = false, w, h;
    const resize = () => { const dpr = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); window.addEventListener('resize', resize);
    const burst = (x, y, n = 120) => {
      if (reduceMotion) return;
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2, sp = Math.random() * 10 + 4;
        pieces.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 6, w: Math.random() * 8 + 4, h: Math.random() * 5 + 3, rot: Math.random() * 360, vr: (Math.random() - .5) * 18, c: colors[i % colors.length], life: 1 });
      }
      if (!animating) { animating = true; tick(); }
    };
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      pieces = pieces.filter(p => p.life > 0 && p.y < h + 40);
      for (const p of pieces) {
        p.vy += .28; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= .006;
        ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5)); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.c; ctx.scale(1, Math.cos(p.rot * Math.PI / 90)); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (pieces.length) requestAnimationFrame(tick); else { animating = false; ctx.clearRect(0, 0, w, h); }
    };
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
        if (!document.body.classList.contains('menu-open')) nav.classList.toggle('is-hidden', self.direction === 1 && y > window.innerHeight * 1.2);
        wa.classList.toggle('is-visible', y > window.innerHeight);
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
        mx((e.clientX - r.left - r.width / 2) * .25); my((e.clientY - r.top - r.height / 2) * .25);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  /* ---------- Início (ordem importa: pins de cima para baixo) ---------- */
  initMenu();
  initLightbox();
  initStrips();
  initMagnetic();
  initHero();
  initAbout();
  initStory();
  initSpaces();
  initGallery();
  initReveals();
  initCTA();
  initNav();

  const start = () => { intro(); ScrollTrigger.refresh(); };
  const heroImg = $('.hero__view img');
  if (heroImg.complete) start();
  else { heroImg.addEventListener('load', start, { once: true }); heroImg.addEventListener('error', start, { once: true }); }
  setTimeout(start, 2500);
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
