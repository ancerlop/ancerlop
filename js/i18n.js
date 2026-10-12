/* i18n.js — castellano e inglés sin diccionarios ni peticiones.
   El castellano vive en el HTML (texto normal, indexable) y el inglés en
   atributos data-en / data-en-html / data-en-aria / data-en-placeholder.
   Los textos que cambian en tiempo de ejecución (controles del laboratorio)
   se piden con t('es','en'). */

const STORE = 'ancerlop:lang';
const ATTRS = ['data-en', 'data-en-html', 'data-en-aria', 'data-en-placeholder'];

const els = [...document.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(','))];
const origin = new WeakMap();
const listeners = new Set();

let lang = 'es';

// guardamos el castellano original antes de tocar nada
for (const el of els) {
  origin.set(el, {
    text: el.textContent,
    html: el.innerHTML,
    aria: el.getAttribute('aria-label'),
    placeholder: el.getAttribute('placeholder'),
  });
}

/** Devuelve el texto según el idioma activo. */
export function t(es, en) {
  return lang === 'en' ? en : es;
}

export function getLang() {
  return lang;
}

/** Avisa cuando cambia el idioma (lo usan los controles dinámicos). */
export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function apply(next) {
  lang = next;

  for (const el of els) {
    const es = origin.get(el);

    if (el.hasAttribute('data-en-html')) {
      el.innerHTML = next === 'en' ? el.getAttribute('data-en-html') : es.html;
    } else if (el.hasAttribute('data-en')) {
      el.textContent = next === 'en' ? el.getAttribute('data-en') : es.text;
    }

    if (el.hasAttribute('data-en-aria')) {
      el.setAttribute('aria-label', next === 'en' ? el.getAttribute('data-en-aria') : es.aria);
    }

    if (el.hasAttribute('data-en-placeholder')) {
      el.setAttribute('placeholder', next === 'en' ? el.getAttribute('data-en-placeholder') : es.placeholder);
    }
  }

  document.documentElement.lang = next;

  const btn = document.getElementById('langBtn');
  if (btn) {
    btn.textContent = next === 'en' ? 'ES' : 'EN';
    btn.setAttribute('aria-pressed', String(next === 'en'));
    btn.setAttribute('aria-label', next === 'en' ? 'Cambiar a castellano' : 'Switch to English');
    btn.setAttribute('lang', next === 'en' ? 'es' : 'en');
  }

  for (const fn of listeners) {
    try {
      fn(next);
    } catch (err) {
      console.error('[i18n] listener con error:', err);
    }
  }
}

export function initI18n() {
  const btn = document.getElementById('langBtn');

  let saved = null;
  try {
    saved = localStorage.getItem(STORE);
  } catch {
    /* modo privado: da igual, seguimos en castellano */
  }

  if (saved === 'en') apply('en');

  btn?.addEventListener('click', () => {
    const next = lang === 'en' ? 'es' : 'en';
    apply(next);
    try {
      localStorage.setItem(STORE, next);
    } catch {
      /* sin persistencia */
    }
  });

  return { t, onChange, getLang };
}
