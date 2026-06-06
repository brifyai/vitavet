// ===== Helpers =====
const $ = (id) => document.getElementById(id);
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Navbar: shadow on scroll + mobile menu =====
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

// ===== Material ripple on buttons =====
if (!prefersReduced) {
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const r = document.createElement('span');
      const d = Math.max(btn.clientWidth, btn.clientHeight);
      r.className = 'ripple';
      r.style.width = r.style.height = d + 'px';
      r.style.left = (e.offsetX - d / 2) + 'px';
      r.style.top = (e.offsetY - d / 2) + 'px';
      btn.appendChild(r);
      setTimeout(() => r.remove(), 600);
    });
  });
}

// ===== Single throttled scroll handler (rAF) =====
const onScrollTasks = [];
let scrollTicking = false;
function addScrollTask(fn) { onScrollTasks.push(fn); }
window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    onScrollTasks.forEach((fn) => fn());
    scrollTicking = false;
  });
}, { passive: true });

if (nav) addScrollTask(() => nav.classList.toggle('scrolled', window.scrollY > 20));

// ===== Animated stats counter =====
const nums = document.querySelectorAll('.stat__num');
const statsEl = document.querySelector('.stats');
let counted = false;
function runCounters() {
  if (counted || !statsEl) return;
  if (statsEl.getBoundingClientRect().top > window.innerHeight - 80) return;
  counted = true;
  nums.forEach((n) => {
    const target = +n.dataset.target;
    const fmt = (v) => (n.dataset.prefix||'') + String(v).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
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
}
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
  function goTo(i) {
    idx = i;
    track.style.transform = `translateX(-${i * 100}%)`;
    [...dotsBox.children].forEach((d, k) => d.classList.toggle('active', k === i));
  }
  function start() {
    if (prefersReduced || slides <= 1) return;
    timer = setInterval(() => goTo((idx + 1) % slides), 5000);
  }
  function restart() { clearInterval(timer); start(); }

  // Pause auto-advance on hover/focus (a11y)
  const testi = $('testi');
  if (testi) {
    ['mouseenter', 'focusin'].forEach((ev) => testi.addEventListener(ev, () => clearInterval(timer)));
    ['mouseleave', 'focusout'].forEach((ev) => testi.addEventListener(ev, restart));
  }
  start();
}

// ===== Services carousel =====
const svcTrack = $('svcTrack');
const svcPrev = $('svcPrev');
const svcNext = $('svcNext');
if (svcTrack) {
  const cardW = () => svcTrack.querySelector('.svc-card').offsetWidth + 22;
  if (svcPrev) svcPrev.addEventListener('click', () => { svcTrack.scrollBy({ left: -cardW(), behavior: 'smooth' }); resetSvcAuto(); });
  if (svcNext) svcNext.addEventListener('click', () => { svcTrack.scrollBy({ left: cardW(), behavior: 'smooth' }); resetSvcAuto(); });

  let svcTimer = null;
  function svcAutoScroll() {
    if (prefersReduced) return;
    svcTimer = setInterval(() => {
      const maxScroll = svcTrack.scrollWidth - svcTrack.clientWidth;
      if (svcTrack.scrollLeft >= maxScroll - 2) {
        svcTrack.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        svcTrack.scrollBy({ left: cardW(), behavior: 'smooth' });
      }
    }, 2500);
  }
  function resetSvcAuto() { clearInterval(svcTimer); svcAutoScroll(); }

  ['mouseenter','focusin'].forEach(ev => svcTrack.addEventListener(ev, () => clearInterval(svcTimer)));
  ['mouseleave','focusout'].forEach(ev => svcTrack.addEventListener(ev, resetSvcAuto));

  svcAutoScroll();
}

// ===== Team carousel =====
const teamTrack = $('teamTrack');
const teamPrev = $('teamPrev');
const teamNext = $('teamNext');
if (teamTrack) {
  const cardW = () => teamTrack.querySelector('.team-slide').offsetWidth + 22;
  if (teamPrev) teamPrev.addEventListener('click', () => { teamTrack.scrollBy({ left: -cardW(), behavior: 'smooth' }); resetTeamAuto(); });
  if (teamNext) teamNext.addEventListener('click', () => { teamTrack.scrollBy({ left: cardW(), behavior: 'smooth' }); resetTeamAuto(); });
  let teamTimer = null;
  function teamAutoScroll() {
    if (prefersReduced) return;
    teamTimer = setInterval(() => {
      const max = teamTrack.scrollWidth - teamTrack.clientWidth;
      if (teamTrack.scrollLeft >= max - 2) { teamTrack.scrollTo({ left: 0, behavior: 'smooth' }); }
      else { teamTrack.scrollBy({ left: cardW(), behavior: 'smooth' }); }
    }, 2000);
  }
  function resetTeamAuto() { clearInterval(teamTimer); teamAutoScroll(); }
  ['mouseenter','focusin'].forEach(ev => teamTrack.addEventListener(ev, () => clearInterval(teamTimer)));
  ['mouseleave','focusout'].forEach(ev => teamTrack.addEventListener(ev, resetTeamAuto));
  teamAutoScroll();
}

// ===== Hero background slideshow =====
const heroSlides = $('heroSlides');
if (heroSlides) {
  const imgs = [...heroSlides.children];
  if (imgs.length > 1 && !prefersReduced) {
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

// ===== Appointment form (real submit + mailto fallback) =====
const form = $('apptForm');
const success = $('apptSuccess');
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
        showSuccess();
        form.reset();
      } else {
        alert(json.message || 'No pudimos enviar la solicitud. Escríbenos a contacto@vitavetclinica.com');
      }
    } catch (err) {
      alert('Error de conexión. Escríbenos a contacto@vitavetclinica.com o llámanos al +56 9 65354764.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Enviar solicitud'; }
    }
  });
}
function showSuccess() {
  if (!success) return;
  success.classList.add('show');
  setTimeout(() => success.classList.remove('show'), 5000);
}

// ===== Newsletter =====
const newsForm = $('newsForm');
const newsOk = $('newsOk');
if (newsForm) {
  newsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!newsForm.checkValidity()) { newsForm.reportValidity(); return; }
    newsForm.reset();
    if (newsOk) {
      newsOk.classList.add('show');
      setTimeout(() => newsOk.classList.remove('show'), 4000);
    }
  });
}
