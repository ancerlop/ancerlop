/* intro.js — cuenta atrás de proyector (el "academy leader" de toda la vida).
   Dura poco más de un segundo, se puede saltar con cualquier gesto, no vuelve
   a aparecer en la misma sesión y no existe si el usuario pide menos movimiento.
   Devuelve una promesa: el resto de animaciones esperan a que suba el telón. */

const STORE = 'ancerlop:intro';
const STEPS = [5, 4, 3, 2, 1];
const STEP_MS = 250;

export function initIntro({ reduce = false } = {}) {
  return new Promise((resolve) => {
    const leader = document.getElementById('leader');
    const num = document.getElementById('leaderNum');

    let seen = false;
    try {
      seen = sessionStorage.getItem(STORE) === '1';
    } catch {
      /* modo privado */
    }

    if (!leader || reduce || seen) {
      leader?.remove();
      resolve();
      return;
    }

    let done = false;
    let i = 0;
    let timer = 0;

    function finish() {
      if (done) return;
      done = true;
      clearInterval(timer);
      window.removeEventListener('pointerdown', finish);
      window.removeEventListener('keydown', finish);
      window.removeEventListener('wheel', finish);
      window.removeEventListener('touchstart', finish);
      try {
        sessionStorage.setItem(STORE, '1');
      } catch {
        /* sin persistencia */
      }
      leader.classList.add('is-out');
      // resolvemos ya: la portada se anima mientras el telón se desvanece
      resolve();
      setTimeout(() => leader.remove(), 700);
    }

    if (num) num.textContent = String(STEPS[0]);

    timer = setInterval(() => {
      i++;
      if (i >= STEPS.length) {
        finish();
        return;
      }
      if (num) num.textContent = String(STEPS[i]);
    }, STEP_MS);

    // red de seguridad: pestaña en segundo plano, temporizadores estrangulados
    setTimeout(finish, STEP_MS * STEPS.length + 900);

    window.addEventListener('pointerdown', finish, { passive: true });
    window.addEventListener('keydown', finish);
    window.addEventListener('wheel', finish, { passive: true });
    window.addEventListener('touchstart', finish, { passive: true });
  });
}
