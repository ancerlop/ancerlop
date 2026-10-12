/* nav.js — el "chrome" del sitio: barra que cambia de mundo, timecode ligado
   al scroll, progreso, sección activa, menú móvil y el interruptor de grano. */

const RUNTIME = 200; // segundos de metraje ficticio: 03:20 de película
const REF = 96; // línea de referencia (px desde arriba) para saber dónde estamos

export function initNav() {
  const body = document.body;
  const worlds = [...document.querySelectorAll('main .world')];
  const progress = document.getElementById('progress');
  const timecode = document.getElementById('timecode');
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('nav');
  const grainBtn = document.getElementById('grainBtn');
  const links = nav ? [...nav.querySelectorAll('a[href^="#"]')] : [];

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  let queued = false;

  function frame() {
    queued = false;

    const y = REF;
    let chrome = null;
    let current = null;

    for (const world of worlds) {
      const r = world.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) {
        chrome = world.classList.contains('world--shop') ? 'shop' : 'screen';
        current = world.id;
        break;
      }
    }

    // dentro de un corte diagonal mantenemos el mundo anterior: el corte ya
    // está pintado con los dos colores, así que no hay salto visible
    if (chrome && body.dataset.chrome !== chrome) body.dataset.chrome = chrome;

    if (current) {
      for (const a of links) {
        const on = a.getAttribute('href') === `#${current}`;
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      }
    }

    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    const p = Math.min(1, Math.max(0, window.scrollY / max));

    if (progress) progress.style.scale = `${p.toFixed(4)} 1`;

    if (timecode) {
      const total = p * RUNTIME;
      const hh = Math.floor(total / 3600);
      const mm = Math.floor(total / 60) % 60;
      const ss = Math.floor(total) % 60;
      const ff = Math.floor((total % 1) * 24);
      timecode.textContent = [hh, mm, ss, ff].map((n) => String(n).padStart(2, '0')).join(':');
    }
  }

  function request() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  request();

  /* ------------------------------- menú móvil ------------------------------- */
  function closeMenu() {
    body.classList.remove('nav-open');
    menuBtn?.setAttribute('aria-expanded', 'false');
  }

  menuBtn?.addEventListener('click', () => {
    const open = !body.classList.contains('nav-open');
    body.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });

  links.forEach((a) => a.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) closeMenu();
  });

  /* -------------------------------- grano ---------------------------------- */
  let grain = 'on';
  try {
    grain = localStorage.getItem('ancerlop:grain') || 'on';
  } catch {
    /* modo privado */
  }
  body.dataset.grain = grain;
  grainBtn?.setAttribute('aria-pressed', String(grain === 'on'));

  grainBtn?.addEventListener('click', () => {
    const on = body.dataset.grain === 'on';
    body.dataset.grain = on ? 'off' : 'on';
    grainBtn.setAttribute('aria-pressed', String(!on));
    try {
      localStorage.setItem('ancerlop:grain', on ? 'off' : 'on');
    } catch {
      /* sin persistencia */
    }
  });

  return { refresh: request };
}
