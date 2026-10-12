/* vivero.js — criaturas procedurales para Kreatures.
   Cada bicho es una semilla: PRNG determinista → silueta, ojos, patas, manchas
   y paleta. Nada de imágenes ni librerías. Pulsar una criatura la evoluciona;
   los ojos siguen al puntero porque, si no, no son criaturas. */

import { t, onChange } from './i18n.js';

const SLOTS = 6;

const PALETTES = [
  { body: '#2f6f5e', belly: '#a8dcc8', ink: '#0d2a24', accent: '#f2b544' },
  { body: '#c2543a', belly: '#f3c9a8', ink: '#3a140c', accent: '#2f6f5e' },
  { body: '#2b4b7d', belly: '#bcd3f0', ink: '#0d1a30', accent: '#f26d5b' },
  { body: '#7a4a8c', belly: '#e0c9ea', ink: '#2a1030', accent: '#66c9a8' },
  { body: '#b8862f', belly: '#f6e3b4', ink: '#33240a', accent: '#3f6f8c' },
  { body: '#3b3f4a', belly: '#cfd4de', ink: '#12141a', accent: '#ffb454' },
  { body: '#1f7a6a', belly: '#c9f0e2', ink: '#062b25', accent: '#ff7a59' },
];

/* PRNG pequeño y determinista (mulberry32) */
function rngFrom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n) => Math.round(n * 100) / 100;

/* curva cerrada suave a partir de puntos (cuadráticas por puntos medios) */
function smoothPath(points) {
  const n = points.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let start = mid(points[n - 1], points[0]);
  let d = `M${round(start[0])} ${round(start[1])}`;
  for (let i = 0; i < n; i++) {
    const cur = points[i];
    const nxt = points[(i + 1) % n];
    const m = mid(cur, nxt);
    d += `Q${round(cur[0])} ${round(cur[1])} ${round(m[0])} ${round(m[1])}`;
  }
  return `${d}Z`;
}

function build(seed) {
  const rng = rngFrom(seed);
  const pal = PALETTES[Math.floor(rng() * PALETTES.length)];

  const cx = 50;
  const cy = 54;
  const R = 20 + rng() * 7;

  // --- silueta: radio modulado por armónicos ---
  const h = [1, 2, 3, 4].map((k) => ({ k, amp: (0.06 + rng() * 0.1) / k, ph: rng() * Math.PI * 2 }));
  const pts = [];
  const STEPS = 44;
  for (let i = 0; i < STEPS; i++) {
    const th = (i / STEPS) * Math.PI * 2;
    let r = 1;
    for (const { k, amp, ph } of h) r += amp * Math.cos(k * th + ph);
    // ligeramente más ancho que alto: menos "pelota"
    pts.push([cx + Math.cos(th) * R * r * 1.06, cy + Math.sin(th) * R * r * 0.94]);
  }

  const parts = [];

  // sombra en el suelo
  parts.push(`<ellipse cx="${cx}" cy="${cy + R * 1.12}" rx="${round(R * 0.86)}" ry="${round(R * 0.17)}" fill="${pal.ink}" opacity=".13"/>`);

  // patas
  const legs = 2 + Math.floor(rng() * 5);
  for (let i = 0; i < legs; i++) {
    const f = (i + 1) / (legs + 1);
    const x0 = cx - R * 0.72 + f * R * 1.44;
    const y0 = cy + R * 0.6;
    const len = 7 + rng() * 11;
    const sway = (rng() - 0.5) * 8;
    parts.push(
      `<path d="M${round(x0)} ${round(y0)} q${round(sway * 0.5)} ${round(len * 0.65)} ${round(sway)} ${round(len)}" fill="none" stroke="${pal.ink}" stroke-width="2.6" stroke-linecap="round"/>`
    );
  }

  // antenas o cuernos
  const horns = Math.floor(rng() * 3);
  for (let i = 0; i < horns; i++) {
    const dir = i === 0 ? -1 : 1;
    const x0 = cx + dir * R * 0.42;
    const y0 = cy - R * 0.72;
    const tipX = x0 + dir * (5 + rng() * 8);
    const tipY = y0 - (9 + rng() * 9);
    parts.push(
      `<path d="M${round(x0)} ${round(y0)} Q${round(x0 + dir * 2)} ${round((y0 + tipY) / 2)} ${round(tipX)} ${round(tipY)}" fill="none" stroke="${pal.ink}" stroke-width="2" stroke-linecap="round"/>` +
        `<circle cx="${round(tipX)}" cy="${round(tipY)}" r="${round(1.8 + rng() * 1.4)}" fill="${pal.accent}"/>`
    );
  }

  // cuerpo + barriga
  parts.push(`<path d="${smoothPath(pts)}" fill="${pal.body}" stroke="${pal.ink}" stroke-width="2.2"/>`);
  parts.push(
    `<ellipse cx="${round(cx)}" cy="${round(cy + R * 0.34)}" rx="${round(R * 0.56)}" ry="${round(R * 0.36)}" fill="${pal.belly}" opacity=".9"/>`
  );

  // manchas
  const spots = Math.floor(rng() * 5);
  for (let i = 0; i < spots; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * R * 0.62;
    parts.push(
      `<circle cx="${round(cx + Math.cos(a) * d)}" cy="${round(cy + Math.sin(a) * d * 0.8 - R * 0.2)}" r="${round(1.4 + rng() * 2.8)}" fill="${pal.accent}" opacity=".75"/>`
    );
  }

  // ojos (1 a 3) con pupila que sigue al puntero
  const eyes = 1 + Math.floor(rng() * 3);
  const eyeR = 4.2 + rng() * 2.6;
  for (let i = 0; i < eyes; i++) {
    const spread = (eyes - 1) * 0.5;
    const ex = cx + (i - spread) * (eyeR * 2.35);
    const ey = cy - R * 0.18 + (rng() - 0.5) * 4;
    const max = eyeR * 0.42;
    parts.push(`<circle cx="${round(ex)}" cy="${round(ey)}" r="${round(eyeR)}" fill="#fffdf7" stroke="${pal.ink}" stroke-width="1.8"/>`);
    parts.push(`<circle data-pupil data-max="${round(max)}" cx="${round(ex)}" cy="${round(ey)}" r="${round(eyeR * 0.46)}" fill="${pal.ink}"/>`);
  }

  // boca
  const mouthY = cy + R * 0.3;
  if (rng() > 0.35) {
    const w = 3 + rng() * 4;
    parts.push(
      `<path d="M${round(cx - w)} ${round(mouthY)} q${round(w)} ${round(3 + rng() * 4)} ${round(w * 2)} 0" fill="none" stroke="${pal.ink}" stroke-width="1.9" stroke-linecap="round"/>`
    );
  } else {
    parts.push(`<circle cx="${round(cx)}" cy="${round(mouthY + 1)}" r="2.1" fill="${pal.ink}"/>`);
  }

  return `<svg viewBox="0 0 100 100" role="presentation" focusable="false">${parts.join('')}</svg>`;
}

export function initVivero({ reduce = false } = {}) {
  const grid = document.getElementById('viveroGrid');
  const btn = document.getElementById('viveroBtn');
  if (!grid) return;

  let seeds = Array.from({ length: SLOTS }, () => (Math.random() * 0xffffffff) >>> 0);
  let pupils = [];

  const label = () => t('Criatura generada por semilla. Pulsa para evolucionarla.', 'Creature generated from a seed. Press to evolve it.');

  function paint(index, animate) {
    const node = grid.children[index];
    if (!node) return;

    seeds[index] = (Math.imul(seeds[index], 1664525) + 1013904223) >>> 0;
    const seed = seeds[index];

    node.innerHTML = build(seed) + `<span class="critter__seed">#${seed.toString(16).slice(0, 4)}</span>`;
    node.setAttribute('aria-label', `${label()} #${seed.toString(16).slice(0, 4)}`);

    if (animate && !reduce) {
      node.classList.remove('is-new');
      // reflow para reiniciar la animación
      void node.offsetWidth;
      node.classList.add('is-new');
    }
  }

  for (let i = 0; i < SLOTS; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'critter';
    b.addEventListener('click', () => paint(i, true));
    grid.appendChild(b);
    paint(i, false);
  }

  function collectPupils() {
    pupils = [...grid.querySelectorAll('circle[data-pupil]')].map((el) => ({
      el,
      max: Number(el.dataset.max || 2),
      host: el.closest('.critter'),
    }));
  }

  collectPupils();

  btn?.addEventListener('click', () => {
    seeds = seeds.map(() => (Math.random() * 0xffffffff) >>> 0);
    for (let i = 0; i < SLOTS; i++) {
      const node = grid.children[i];
      node.innerHTML = build(seeds[i]) + `<span class="critter__seed">#${seeds[i].toString(16).slice(0, 4)}</span>`;
      node.setAttribute('aria-label', `${label()} #${seeds[i].toString(16).slice(0, 4)}`);
      if (!reduce) {
        node.classList.remove('is-new');
        void node.offsetWidth;
        node.classList.add('is-new');
      }
    }
    collectPupils();
  });

  /* --------------------------- ojos que te siguen --------------------------- */
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    let pending = null;
    let queued = false;

    function apply() {
      queued = false;
      if (!pending) return;
      const { x, y } = pending;

      for (const p of pupils) {
        if (!p.host) continue;
        const r = p.host.getBoundingClientRect();
        const dx = x - (r.left + r.width / 2);
        const dy = y - (r.top + r.height / 2);
        const len = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, len / 160);
        p.el.setAttribute(
          'transform',
          `translate(${round((dx / len) * p.max * k)} ${round((dy / len) * p.max * k)})`
        );
      }
    }

    window.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        pending = { x: e.clientX, y: e.clientY };
        if (!queued) {
          queued = true;
          requestAnimationFrame(apply);
        }
      },
      { passive: true }
    );

    grid.addEventListener('focusin', () => {
      pending = null;
    });
  }

  onChange(() => {
    for (let i = 0; i < SLOTS; i++) {
      const node = grid.children[i];
      if (node) node.setAttribute('aria-label', `${label()} #${seeds[i].toString(16).slice(0, 4)}`);
    }
  });

  return () => {
    grid.replaceChildren();
  };
}
