/* beam.js — el haz del proyector y el polvo en suspensión de la portada.
   Sprite precalculado + composite 'lighter': mucho brillo, coste mínimo.
   Sólo se dibuja mientras la portada está en pantalla. */

import { add } from './ticker.js';

const MOTES = 64;

export function initBeam({ reduce = false } = {}) {
  const canvas = document.querySelector('.beam');
  if (!canvas || reduce) {
    canvas?.remove();
    return;
  }

  const ctx = canvas.getContext('2d');
  const host = canvas.parentElement;
  if (!ctx || !host) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;

  // sprite de mota: un degradado radial pequeño, reutilizado miles de veces
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 32;
  const sctx = sprite.getContext('2d');
  const g = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,225,180,1)');
  g.addColorStop(0.4, 'rgba(255,200,130,.35)');
  g.addColorStop(1, 'rgba(255,180,84,0)');
  sctx.fillStyle = g;
  sctx.fillRect(0, 0, 32, 32);

  const motes = Array.from({ length: MOTES }, () => spawn(true));

  function spawn(anywhere) {
    return {
      x: Math.random(),
      y: anywhere ? Math.random() : -0.05,
      r: 0.4 + Math.random() * 1.9,
      vx: (Math.random() - 0.5) * 0.00016,
      vy: 0.00006 + Math.random() * 0.00028,
      a: 0.12 + Math.random() * 0.55,
      ph: Math.random() * Math.PI * 2,
    };
  }

  function resize() {
    const rect = host.getBoundingClientRect();
    w = canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    h = canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  }

  resize();
  const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  ro?.observe(host);
  window.addEventListener('resize', resize, { passive: true });

  // el haz no se dibuja si la portada no se ve
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.02 }
    ).observe(host);
  }

  let time = 0;
  // El cono se dibuja en una capa aparte y se difumina al componer: si se
  // desenfoca dentro del propio clip, el recorte se come el desenfoque y el
  // borde vuelve a salir duro.
  const canBlur = 'filter' in ctx;
  const layer = document.createElement('canvas');
  const lctx = layer.getContext('2d');

  const stop = add((dt) => {
    if (!visible || document.hidden) return;
    time += dt;

    // parpadeo de lámpara: dos senos desfasados, nada de ruido puro
    const flicker = 0.94 + Math.sin(time * 0.0021) * 0.035 + Math.sin(time * 0.0073) * 0.02;

    const apexX = w * 0.62;
    const apexY = -h * 0.08;
    const spread = w * 0.42;

    /* --- capa: cono + halo, con bordes geométricos --- */
    if (layer.width !== w || layer.height !== h) {
      layer.width = w;
      layer.height = h;
    }
    lctx.clearRect(0, 0, w, h);
    lctx.globalCompositeOperation = 'source-over';

    lctx.save();
    lctx.beginPath();
    lctx.moveTo(apexX, apexY);
    lctx.lineTo(apexX - spread, h * 1.02);
    lctx.lineTo(apexX + spread, h * 1.02);
    lctx.closePath();
    lctx.clip();

    const cone = lctx.createRadialGradient(apexX, apexY, 0, apexX, apexY, h * 1.15);
    cone.addColorStop(0, `rgba(255,214,150,${0.42 * flicker})`);
    cone.addColorStop(0.22, `rgba(255,196,124,${0.2 * flicker})`);
    cone.addColorStop(0.6, `rgba(255,186,110,${0.08 * flicker})`);
    cone.addColorStop(1, 'rgba(255,180,84,0)');
    lctx.fillStyle = cone;
    lctx.fillRect(0, 0, w, h);
    lctx.restore();

    const halo = lctx.createRadialGradient(apexX, apexY, 0, apexX, apexY, h * 0.6);
    halo.addColorStop(0, `rgba(255,224,176,${0.26 * flicker})`);
    halo.addColorStop(0.5, `rgba(255,196,124,${0.07 * flicker})`);
    halo.addColorStop(1, 'rgba(255,180,84,0)');
    lctx.fillStyle = halo;
    lctx.fillRect(0, 0, w, h);

    /* --- composición: capa difuminada + polvo nítido --- */
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    if (canBlur) ctx.filter = `blur(${Math.max(4, Math.round(h * 0.014))}px)`;
    ctx.drawImage(layer, 0, 0);
    if (canBlur) ctx.filter = 'none';

    // polvo
    for (const m of motes) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.y > 1.06 || m.x < -0.06 || m.x > 1.06) Object.assign(m, spawn(false));

      // las motas sólo lucen dentro del cono
      const cx = m.x * w;
      const cy = m.y * h;
      const dx = Math.abs(cx - apexX) / (spread * (0.25 + m.y));
      const inCone = dx < 1 ? 1 - dx * 0.85 : 0.06;
      const twinkle = 0.65 + Math.sin(time * 0.0016 + m.ph) * 0.35;
      const size = m.r * 9 * dpr;

      ctx.globalAlpha = m.a * inCone * twinkle * flicker;
      ctx.drawImage(sprite, cx - size / 2, cy - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  });

  return stop;
}
