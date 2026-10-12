/* reveal.js — aparición de bloques al entrar en pantalla.
   Se llama después de la cuenta atrás inicial, para que la portada no se
   anime a espaldas del usuario mientras el telón todavía está bajado.
   La portada no aparece aquí: main.js la revela directamente al arrancar. */

const SELECTOR = '[data-reveal]';

export function initReveal({ reduce = false } = {}) {
  const items = document.querySelectorAll(SELECTOR);

  // Sin movimiento o sin soporte: todo visible, sin más.
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return { revealAll: () => items.forEach((el) => el.classList.add('is-in')) };
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
  );

  items.forEach((el) => io.observe(el));

  return {
    revealAll() {
      io.disconnect();
      items.forEach((el) => el.classList.add('is-in'));
    },
  };
}
