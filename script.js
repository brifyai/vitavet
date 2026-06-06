// ===== Helpers =====
const $ = (id) => document.getElementById(id);
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Navbar =====
const nav = $('nav');
const navLinks = $('navLinks');
const navToggle = $('navToggle');

if (navToggle && navLinks) {
  const setOpen = (open) => {
    navLinks.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };
  navToggle.addEventListener('click', () => setOpen(!navLinks.classList.contains('open')));
  navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
}

// ===== Material ripple =====
if (!prefersReduced) {
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const r = document.createElement('span');
      const d = Math.max(btn.clientWidth, btn.clientHeight);
      r.className = 'ripple';
      r.style.cssText = `width:${d}px;height:${d}px;left:${e.offsetX - d / 2}px;top:${e.offsetY - d / 2}px`;
      btn.appendChild(r);
      setTimeout(() => r.remove(), 600);
    });
  });
}

// ===== Throttled scroll handler =====
const onScrollTasks = [];
let scrollTicking = false;
const addScrollTask = (fn) => onScrollTasks.push(fn);
window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => { onScrollTasks.forEach((fn) => fn()); scrollTicking = false; });
}, { passive: true });

if (nav) addScrollTask(() => nav.classList.toggle('scrolled', window.scrollY > 20));

// ===== Animated stats counter =====
const nums = document.querySelectorAll('.stat__num');
const statsEl = document.querySelector('.stats');
let counted = false;
const runCounters = () => {
  if (counted || !statsEl) return;
  if (statsEl.getBoundingClientRect().top > window.innerHeight - 80) return;
  counted = true;
  nums.forEach((n) => {
    const target = +n.dataset.target;
    const fmt = (v) => (n.dataset.prefix || '') + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (prefersReduced) { n.textContent = fmt(target); return; }
    const step = Math.max(1, Math.ceil(target / 60));
    let cur = 0;
    const tick = () => {
      cur = Math.min(target, cur + step);
      n.textContent = fmt(cur);
      if (cur < target) requestAnimationFrame(tick);
    };
    tick();
  });
};
addScrollTask(runCounters);
window.addEventListener('load', runCounters);

// ===== Testimonials carousel =====
const track = $('testiTrack');
const dotsBox = $('testiDots');
if (track && dotsBox) {
  const slides = track.children.length;
  let idx = 0;
  let timer = null;

  for (let i = 0; i < slides; i++) {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Ir al testimonio ${i + 1}`);
    if (i === 0) b.classList.add('active');
    b.addEventListener('click', () => { goTo(i); restart(); });
    dotsBox.appendChild(b);
  }
  const goTo = (i) => {
    idx = i;
    track.style.transform = `translateX(-${i * 100}%)`;
    [...dotsBox.children].forEach((d, k) => d.classList.toggle('active', k === i));
  };
  const start = () => {
    if (prefersReduced || slides <= 1) return;
    timer = setInterval(() => goTo((idx + 1) % slides), 5000);
  };
  const restart = () => { clearInterval(timer); start(); };

  const testi = $('testi');
  if (testi) {
    ['mouseenter', 'focusin'].forEach((ev) => testi.addEventListener(ev, () => clearInterval(timer)));
    ['mouseleave', 'focusout'].forEach((ev) => testi.addEventListener(ev, restart));
  }
  start();
}

// ===== Generic scroll carousel factory =====
// Handles Services and Team (same pattern, one function)
const initScrollCarousel = ({ trackId, prevId, nextId, cardSelector, interval }) => {
  const trackEl = $(trackId);
  if (!trackEl) return;

  const getCardW = () => {
    const card = trackEl.querySelector(cardSelector);
    return card ? card.offsetWidth + 22 : 260;
  };

  let timer = null;

  const autoScroll = () => {
    if (prefersReduced) return;
    timer = setInterval(() => {
      const max = trackEl.scrollWidth - trackEl.clientWidth;
      if (trackEl.scrollLeft >= max - 2) {
        trackEl.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        trackEl.scrollBy({ left: getCardW(), behavior: 'smooth' });
      }
    }, interval);
  };

  const reset = () => { clearInterval(timer); autoScroll(); };

  const prevEl = $(prevId);
  const nextEl = $(nextId);
  if (prevEl) prevEl.addEventListener('click', () => { trackEl.scrollBy({ left: -getCardW(), behavior: 'smooth' }); reset(); });
  if (nextEl) nextEl.addEventListener('click', () => { trackEl.scrollBy({ left: getCardW(), behavior: 'smooth' }); reset(); });

  ['mouseenter', 'focusin'].forEach((ev) => trackEl.addEventListener(ev, () => clearInterval(timer)));
  ['mouseleave', 'focusout'].forEach((ev) => trackEl.addEventListener(ev, reset));

  autoScroll();
};

initScrollCarousel({ trackId: 'svcTrack',  prevId: 'svcPrev',  nextId: 'svcNext',  cardSelector: '.svc-card',   interval: 2500 });
initScrollCarousel({ trackId: 'teamTrack', prevId: 'teamPrev', nextId: 'teamNext', cardSelector: '.team-slide', interval: 2000 });

// ===== Hero background slideshow =====
const heroSlides = $('heroSlides');
if (heroSlides && !prefersReduced) {
  const imgs = [...heroSlides.children];
  if (imgs.length > 1) {
    let cur = 0;
    setInterval(() => {
      imgs[cur].classList.remove('is-active');
      cur = (cur + 1) % imgs.length;
      imgs[cur].classList.add('is-active');
    }, 5000);
  }
}

// ===== Reveal on scroll =====
const revealEls = document.querySelectorAll('.section, .quick__card, .card');
if (prefersReduced || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('in'));
} else {
  revealEls.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}

// ===== Appointment form =====
const form = $('apptForm');
const success = $('apptSuccess');
const formError = $('apptError');

const showMsg = (el, duration) => {
  if (!el) return;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
};

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const btn = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    const action = form.getAttribute('action') || 'send.php';

    try {
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
      const res = await fetch(action, { method: 'POST', body: data });
      const json = await res.json();
      if (json.ok) {
        showMsg(success, 5000);
        form.reset();
      } else {
        if (formError) { formError.textContent = json.message; showMsg(formError, 6000); }
      }
    } catch {
      if (formError) { formError.textContent = 'Error de conexión. Llámanos al +56 9 65354764.'; showMsg(formError, 6000); }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Enviar solicitud'; }
    }
  });
}
