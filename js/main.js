/* main.js — punto de entrada del sitio.
   Todo se inicializa desde aquí y a prueba de fallos: si un módulo revienta,
   el resto de la página sigue funcionando. El HTML y el CSS ya son válidos por
   sí solos; el JS sólo añade. */

// Primera línea y a propósito: la guarda de arranque del final del documento
// mira esta marca para saber si el módulo llegó a ejecutarse (y darle margen)
// o si no va a llegar nunca (y destapar la página por su cuenta).
window.__ancerlopArrancando = true;

import { initIntro } from './intro.js';
import { initI18n } from './i18n.js';
import { initReveal } from './reveal.js';
import { initNav } from './nav.js';
import { initGrain } from './grain.js';
import { initBeam } from './beam.js';
import { initCursor } from './cursor.js';
import { initContact } from './contact.js';
import { initDescent } from './lab-descent.js';
import { initVivero } from './vivero.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function safe(name, fn) {
  try {
    return fn();
  } catch (err) {
    console.error(`[main] el módulo «${name}» ha fallado:`, err);
    return null;
  }
}

function revealEverything() {
  document.querySelectorAll('[data-reveal], .hero').forEach((el) => el.classList.add('is-in'));
}

/* --- lo que puede arrancar ya --- */
safe('i18n', initI18n);
safe('contacto', initContact);

const nav = safe('navegación', initNav);
safe('grano', () => initGrain({ reduce }));
safe('haz', () => initBeam({ reduce }));
safe('cursor', () => initCursor({ reduce }));
safe('laboratorio', () => initDescent({ reduce }));
safe('vivero', () => initVivero({ reduce }));

/* --- la portada espera a que suba el telón --- */
initIntro({ reduce })
  .then(() => {
    document.body.classList.add('is-ready');

    // La portada está siempre en pantalla al arrancar, así que se revela aquí y
    // no por IntersectionObserver: si el observador llega tarde (o no llega,
    // como ocurre en entornos automatizados) el titular se quedaría oculto para
    // siempre. Es la única sección que no necesita que nadie le avise.
    document.querySelector('.hero')?.classList.add('is-in');

    try {
      initReveal({ reduce });
    } catch (err) {
      console.error('[main] revelados con error:', err);
      revealEverything();
    }
  })
  .catch(() => {
    document.body.classList.add('is-ready');
    revealEverything();
  });

/* Red de seguridad: pase lo que pase, a los 5 s no queda nada oculto. */
setTimeout(() => {
  if (!document.body.classList.contains('is-ready')) {
    document.body.classList.add('is-ready');
    revealEverything();
  }
}, 5000);

/* Las fuentes y las imágenes cambian la altura del documento: recalculamos. */
window.addEventListener('load', () => nav?.refresh?.(), { once: true });
document.fonts?.ready.then(() => nav?.refresh?.());
window.addEventListener('resize', () => nav?.refresh?.(), { passive: true });
