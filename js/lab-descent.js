/* lab-descent.js — regresión lineal entrenada por descenso de gradiente.
   Nada decorativo: los pesos se actualizan con el gradiente real de la MSE,
   un paso por frame, y la curva de pérdida se dibuja con el histórico.

   Interacción: arrastrar un punto · clic en vacío para añadir · alt+clic para
   borrar. Los mandos de HTML hacen lo mismo, así que todo es operable con
   teclado y el estado se anuncia por aria-live. */

import { add } from './ticker.js';
import { t, onChange } from './i18n.js';

const MAX_HISTORY = 220;
const PAD = { l: 44, r: 18, t: 46, b: 34 };
const DPR = Math.min(window.devicePixelRatio || 1, 2);

export function initDescent({ reduce = false } = {}) {
  const root = document.getElementById('labDescent');
  const canvas = document.getElementById('descentStage');
  const lossCanvas = document.getElementById('lossChart');
  if (!root || !canvas || !lossCanvas) return;

  const ctx = canvas.getContext('2d');
  const lctx = lossCanvas.getContext('2d');
  if (!ctx || !lctx) return;

  const els = {
    badge: document.getElementById('descentBadge'),
    badgeText: document.querySelector('#descentBadge span'),
    steps: document.getElementById('outSteps'),
    loss: document.getElementById('outLoss'),
    w: document.getElementById('outW'),
    b: document.getElementById('outB'),
    lr: document.getElementById('lr'),
    lrOut: document.getElementById('lrOut'),
    toggle: document.getElementById('descentToggle'),
    shake: document.getElementById('descentShake'),
    reset: document.getElementById('descentReset'),
    live: document.getElementById('descentLive'),
    eq: document.getElementById('descentEq'),
  };

  const css = getComputedStyle(document.documentElement);
  const col = (name, fallback) => css.getPropertyValue(name).trim() || fallback;

  const INK = col('--fg-shop', '#101217');
  const TEAL = col('--teal', '#0a5b64');
  const EMBER = col('--ember', '#ff6a3d');
  const PAPER = col('--panel-shop', '#fffefb');

  /* ------------------------------- estado -------------------------------- */
  const state = {
    points: [],
    w: 0,
    b: 0,
    steps: 0,
    history: [],
    running: !reduce,
    diverged: false,
    hover: -1,
    drag: -1,
    still: 0,
  };

  let box = { w: 0, h: 0, plotW: 1, plotH: 1 };
  let dirty = true;

  function seedPoints(n = 26) {
    state.points = [];
    for (let i = 0; i < n; i++) {
      const x = 0.05 + (i / (n - 1)) * 0.9;
      const y = 0.24 + 0.5 * x + (Math.random() - 0.5) * 0.26;
      state.points.push({ x, y: Math.min(0.96, Math.max(0.04, y)) });
    }
  }

  function reset({ keepPoints = false } = {}) {
    if (!keepPoints) seedPoints();
    state.w = 0;
    state.b = 0;
    state.steps = 0;
    state.history = [];
    state.diverged = false;
    state.still = 0;
    state.running = !reduce;
    dirty = true;
    syncControls();
  }

  /* ------------------------------- modelo -------------------------------- */
  function loss() {
    const n = state.points.length;
    if (!n) return 0;
    let s = 0;
    for (const p of state.points) {
      const e = state.w * p.x + state.b - p.y;
      s += e * e;
    }
    return s / n;
  }

  function train() {
    const n = state.points.length;
    if (!n) return;

    let dw = 0;
    let db = 0;
    for (const p of state.points) {
      const e = state.w * p.x + state.b - p.y;
      dw += 2 * p.x * e;
      db += 2 * e;
    }
    const lr = Number(els.lr?.value || 6) / 100;

    state.w -= (lr * dw) / n;
    state.b -= (lr * db) / n;

    // el laboratorio también sirve para ver cuándo algo se va al carajo
    if (!Number.isFinite(state.w) || !Number.isFinite(state.b) || Math.abs(state.w) > 1e4) {
      state.diverged = true;
      state.running = false;
      announce(t('El modelo ha divergido: el ritmo de aprendizaje es demasiado alto.',
                 'The model has diverged: the learning rate is too high.'));
      syncControls();
      return;
    }

    state.steps++;

    const l = loss();
    state.history.push(l);
    if (state.history.length > MAX_HISTORY) state.history.shift();

    const prev = state.history[state.history.length - 2];
    if (prev !== undefined && Math.abs(prev - l) < 1e-7) {
      state.still++;
      if (state.still === 40) {
        announce(t('El modelo ha convergido. Pérdida final: ', 'The model has converged. Final loss: ') + l.toFixed(5));
      }
    } else {
      state.still = 0;
    }
  }

  function announce(text) {
    if (els.live) els.live.textContent = text;
  }

  /* ------------------------------- dibujo -------------------------------- */
  function layout() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const cssW = Math.max(240, Math.round(rect.width));
    const cssH = Math.max(200, Math.round(rect.height));

    canvas.width = Math.round(cssW * DPR);
    canvas.height = Math.round(cssH * DPR);
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    box = {
      w: cssW,
      h: cssH,
      plotW: cssW - PAD.l - PAD.r,
      plotH: cssH - PAD.t - PAD.b,
    };
    dirty = true;
  }

  const toPx = (x) => PAD.l + x * box.plotW;
  const toPy = (y) => box.h - PAD.b - y * box.plotH;

  function draw() {
    ctx.clearRect(0, 0, box.w, box.h);

    // rejilla
    ctx.strokeStyle = 'rgba(16,18,23,.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const x = toPx(i / 4);
      const y = toPy(i / 4);
      ctx.moveTo(Math.round(x) + 0.5, PAD.t);
      ctx.lineTo(Math.round(x) + 0.5, box.h - PAD.b);
      ctx.moveTo(PAD.l, Math.round(y) + 0.5);
      ctx.lineTo(box.w - PAD.r, Math.round(y) + 0.5);
    }
    ctx.stroke();

    // ejes
    ctx.strokeStyle = 'rgba(16,18,23,.28)';
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t);
    ctx.lineTo(PAD.l, box.h - PAD.b);
    ctx.lineTo(box.w - PAD.r, box.h - PAD.b);
    ctx.stroke();

    // residuales: la distancia que el modelo todavía no explica
    ctx.strokeStyle = 'rgba(10,91,100,.28)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (const p of state.points) {
      const yHat = state.w * p.x + state.b;
      ctx.moveTo(toPx(p.x), toPy(p.y));
      ctx.lineTo(toPx(p.x), toPy(Math.min(1.4, Math.max(-0.4, yHat))));
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // la recta del modelo
    if (!state.diverged) {
      ctx.strokeStyle = EMBER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toPx(0), toPy(state.b));
      ctx.lineTo(toPx(1), toPy(state.w + state.b));
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // puntos
    state.points.forEach((p, i) => {
      const r = i === state.drag ? 7 : i === state.hover ? 6 : 4.5;
      ctx.beginPath();
      ctx.arc(toPx(p.x), toPy(p.y), r, 0, Math.PI * 2);
      ctx.fillStyle = i === state.drag || i === state.hover ? EMBER : TEAL;
      ctx.fill();
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.lineWidth = 1;
    });

    // etiquetas
    ctx.fillStyle = 'rgba(16,18,23,.5)';
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillText('x', box.w - PAD.r - 4, box.h - PAD.b + 16);
    ctx.fillText('y', PAD.l - 14, PAD.t + 8);
    ctx.fillText(`${state.points.length} pts`, PAD.l + 6, PAD.t + 12);
  }

  function drawLoss() {
    const rect = lossCanvas.parentElement.getBoundingClientRect();
    const cssW = Math.max(80, Math.round(rect.width));
    const cssH = Math.max(40, Math.round(rect.height));
    lossCanvas.width = Math.round(cssW * DPR);
    lossCanvas.height = Math.round(cssH * DPR);
    lctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    lctx.clearRect(0, 0, cssW, cssH);

    const h = state.history;
    if (h.length < 2) {
      lctx.fillStyle = 'rgba(16,18,23,.35)';
      lctx.font = '10px "IBM Plex Mono", monospace';
      lctx.fillText('pérdida · sin datos todavía', 8, cssH / 2);
      return;
    }

    const max = Math.max(...h);
    const min = Math.min(...h);
    const span = Math.max(1e-9, max - min);
    const px = (i) => (i / (MAX_HISTORY - 1)) * cssW;
    const py = (v) => cssH - 6 - ((v - min) / span) * (cssH - 14);

    lctx.beginPath();
    lctx.moveTo(0, cssH);
    h.forEach((v, i) => lctx.lineTo(px(i), py(v)));
    lctx.lineTo(px(h.length - 1), cssH);
    lctx.closePath();
    lctx.fillStyle = 'rgba(255,106,61,.12)';
    lctx.fill();

    lctx.beginPath();
    h.forEach((v, i) => (i ? lctx.lineTo(px(i), py(v)) : lctx.moveTo(px(i), py(v))));
    lctx.strokeStyle = EMBER;
    lctx.lineWidth = 1.5;
    lctx.stroke();

    lctx.fillStyle = 'rgba(16,18,23,.5)';
    lctx.font = '10px "IBM Plex Mono", monospace';
    lctx.fillText(`min ${min.toFixed(4)}`, 6, 11);
    lctx.fillText(`max ${max.toFixed(4)}`, 6, cssH - 4);
  }

  /* ------------------------------ mandos --------------------------------- */
  function syncControls() {
    if (els.toggle) {
      els.toggle.setAttribute('aria-pressed', String(state.running));
      els.toggle.textContent = state.running ? t('Pausar', 'Pause') : t('Reanudar', 'Resume');
    }
    if (els.badge && els.badgeText) {
      els.badge.dataset.state = state.diverged ? 'paused' : state.running ? 'running' : 'paused';
      els.badgeText.textContent = state.diverged
        ? t('Divergió', 'Diverged')
        : state.running
          ? t('Entrenando en vivo', 'Training live')
          : t('En pausa', 'Paused');
    }
  }

  function syncReadouts() {
    const l = loss();
    if (els.steps) els.steps.textContent = String(state.steps);
    if (els.loss) els.loss.textContent = Number.isFinite(l) ? l.toFixed(5) : '—';
    if (els.w) els.w.textContent = state.w.toFixed(3);
    if (els.b) els.b.textContent = state.b.toFixed(3);
    if (els.eq) {
      els.eq.textContent = `ŷ = ${state.w.toFixed(3)}·x ${state.b < 0 ? '−' : '+'} ${Math.abs(state.b).toFixed(3)}`;
    }
  }

  els.toggle?.addEventListener('click', () => {
    state.running = !state.running;
    state.still = 0;
    syncControls();
    announce(
      state.running
        ? t('Entrenamiento en marcha.', 'Training resumed.')
        : t(`Entrenamiento en pausa en el paso ${state.steps}.`, `Training paused at step ${state.steps}.`)
    );
    dirty = true;
  });

  els.shake?.addEventListener('click', () => {
    for (const p of state.points) {
      p.y = Math.min(0.96, Math.max(0.04, p.y + (Math.random() - 0.5) * 0.22));
    }
    state.still = 0;
    state.diverged = false;
    if (!state.running) state.running = true;
    syncControls();
    announce(t('Puntos sacudidos: vuelve a ajustarse.', 'Points shaken: it is readjusting.'));
    dirty = true;
  });

  els.reset?.addEventListener('click', () => {
    reset();
    announce(t('Laboratorio reiniciado.', 'Lab reset.'));
  });

  els.lr?.addEventListener('input', () => {
    const lr = Number(els.lr.value) / 100;
    if (els.lrOut) els.lrOut.textContent = lr.toFixed(3);
    state.still = 0;
    state.diverged = false;
    dirty = true;
  });

  /* ------------------------------ puntero -------------------------------- */
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    let best = -1;
    let bestD = 20;

    state.points.forEach((p, i) => {
      const dx = toPx(p.x) - cx;
      const dy = toPy(p.y) - cy;
      const d = Math.hypot(dx, dy);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }

  function toData(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left - PAD.l) / box.plotW;
    const y = (box.h - PAD.b - (e.clientY - r.top)) / box.plotH;
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
  }

  canvas.addEventListener('pointerdown', (e) => {
    const hit = pick(e);

    if (e.altKey || e.button === 2) {
      if (hit >= 0 && state.points.length > 3) {
        state.points.splice(hit, 1);
        state.diverged = false;
        announce(t(`Punto eliminado. Quedan ${state.points.length}.`, `Point removed. ${state.points.length} left.`));
        dirty = true;
      }
      return;
    }

    if (hit >= 0) {
      state.drag = hit;
      canvas.setPointerCapture?.(e.pointerId);
    } else {
      state.points.push(toData(e));
      announce(t(`Punto añadido. Total ${state.points.length}.`, `Point added. ${state.points.length} in total.`));
      dirty = true;
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const hit = pick(e);

    if (state.drag >= 0) {
      const d = toData(e);
      state.points[state.drag] = d;
      dirty = true;
      return;
    }

    if (hit !== state.hover) {
      state.hover = hit;
      dirty = true;
    }
  });

  const release = (e) => {
    if (state.drag >= 0) {
      state.drag = -1;
      dirty = true;
    }
    if (e?.pointerId != null) canvas.releasePointerCapture?.(e.pointerId);
  };

  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => {
    if (state.hover !== -1) {
      state.hover = -1;
      dirty = true;
    }
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  /* ------------------------------- arranque ------------------------------- */
  seedPoints();
  layout();
  syncControls();

  if (els.lrOut) els.lrOut.textContent = (Number(els.lr?.value || 6) / 100).toFixed(3);
  if (reduce) announce(t('Laboratorio en pausa (movimiento reducido). Pulsa Entrenar.', 'Lab paused (reduced motion). Press Train.'));

  let ro = null;

  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => {
      layout();
      drawLoss();
    });
    ro.observe(canvas.parentElement);
  }

  onChange(() => {
    syncControls();
    dirty = true;
  });

  const stop = add(() => {
    if (state.running && !state.diverged) {
      train();
      dirty = true;
    }
    if (dirty) {
      draw();
      syncReadouts();
      dirty = false;
    }
  });

  return () => {
    stop();
    ro?.disconnect();
  };
}
