/* ticker.js — un único requestAnimationFrame para todo el sitio.
   Varios canvas animándose por su cuenta es la forma más rápida de arruinar
   la batería en móvil; aquí todos se apuntan a la misma lista. */

const callbacks = new Set();
let raf = 0;
let running = false;
let last = 0;

function loop(t) {
  const dt = last ? Math.min(t - last, 100) : 16;
  last = t;

  // copia: un callback puede darse de baja mientras iteramos
  for (const fn of [...callbacks]) {
    try {
      fn(dt, t);
    } catch (err) {
      console.error('[ticker] callback retirado por error:', err);
      callbacks.delete(fn);
    }
  }

  raf = callbacks.size ? requestAnimationFrame(loop) : 0;
  if (!raf) running = false;
}

/** Apunta una función al bucle compartido. Devuelve una función para darse de baja. */
export function add(fn) {
  callbacks.add(fn);
  if (!running) {
    running = true;
    last = 0;
    raf = requestAnimationFrame(loop);
  }
  return () => remove(fn);
}

export function remove(fn) {
  callbacks.delete(fn);
  if (!callbacks.size && raf) {
    cancelAnimationFrame(raf);
    raf = 0;
    running = false;
  }
}

/** Un solo frame suelto: útil para pintar el estado inicial sin animar nada. */
export function once(fn) {
  requestAnimationFrame((t) => fn(16, t));
}
