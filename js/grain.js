/* grain.js — grano de película sobre todo el sitio.
   No generamos ruido por frame (caro): precalculamos una loseta de 128×128 y
   la estampamos con desplazamientos aleatorios a unos 24 fps. El blend lo
   hace el CSS (soft-light), aquí sólo dibujamos. */

import { add } from './ticker.js';

const TILE = 128;
const FPS = 24;

export function initGrain({ reduce = false } = {}) {
  const canvas = document.getElementById('grain');
  if (!canvas) return;
  if (reduce) {
    canvas.remove();
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  // loseta de ruido con alfa variable: eso es lo que da la textura de plata
  const tile = document.createElement('canvas');
  tile.width = tile.height = TILE;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(TILE, TILE);
  for (let i = 0; i < TILE * TILE; i++) {
    const v = 118 + Math.random() * 137;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = Math.random() * 255;
  }
  tctx.putImageData(img, 0, 0);

  let w = 0;
  let h = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  function resize() {
    w = canvas.width = Math.floor(window.innerWidth * dpr);
    h = canvas.height = Math.floor(window.innerHeight * dpr);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  let acc = 0;
  let tick = 0;

  const stop = add((dt) => {
    if (document.body.dataset.grain === 'off' || document.hidden) return;

    acc += dt;
    if (acc < 1000 / FPS) return;
    acc = 0;

    // parpadeo de lámpara: muy leve, pero se nota
    tick++;
    ctx.globalAlpha = 0.5 + Math.sin(tick * 0.7) * 0.06;
    ctx.clearRect(0, 0, w, h);

    const ox = -Math.floor(Math.random() * TILE);
    const oy = -Math.floor(Math.random() * TILE);

    for (let y = oy; y < h; y += TILE) {
      for (let x = ox; x < w; x += TILE) {
        ctx.drawImage(tile, x, y);
      }
    }
  });

  return stop;
}
