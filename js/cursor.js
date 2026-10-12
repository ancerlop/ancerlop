/* cursor.js — diafragma que sigue al puntero.
   Sólo en ratón (pointer:fine) y nunca con movimiento reducido. Si algo
   fallara aquí, el cursor nativo sigue estando: la clase que lo oculta la
   pone este módulo, no el CSS. */

import { add } from './ticker.js';

const LINKY = 'a, button, input, textarea, select, summary, [role="button"], .critter';

export function initCursor({ reduce = false } = {}) {
  const el = document.getElementById('cursor');
  const fine = window.matchMedia('(pointer: fine)').matches;

  if (!el || reduce || !fine) return;

  const root = document.documentElement;
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;
  let visible = false;
  let down = false;
  let overStage = false;

  // Ojo: la clase que oculta el cursor nativo sólo se pone cuando el ratón se
  // mueve de verdad. Si apareciera al cargar, el diafragma se quedaría quieto
  // en el centro de la pantalla y el usuario se quedaría sin puntero.
  function setState() {
    el.dataset.state = down && overStage ? 'drag' : el.dataset.hover === 'link' ? 'link' : 'idle';
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        x = tx;
        y = ty;
        root.classList.add('cursor-on');
      }
      const hit = e.target instanceof Element ? e.target.closest(LINKY) : null;
      el.dataset.hover = hit ? 'link' : 'idle';
      setState();
    },
    { passive: true }
  );

  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const hit = e.target instanceof Element ? e.target.closest(LINKY) : null;
    el.dataset.hover = hit ? 'link' : 'idle';
    setState();
  });

  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    overStage = !!(e.target instanceof Element && e.target.closest('.lab__stage'));
    down = true;
    setState();
  });

  document.addEventListener('pointerup', () => {
    down = false;
    overStage = false;
    setState();
  });

  document.addEventListener('mouseleave', () => {
    visible = false;
    el.style.opacity = '0';
  });

  const stop = add(() => {
    // suavizado: el anillo va un poco por detrás, como un foco que pesa
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    el.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
  });

  return stop;
}
