/* contact.js — el formulario no tiene servidor: compone un mailto.
   Es honesto con el usuario (el botón lo dice) y funciona en GitHub Pages,
   donde no hay backend. */

import { t } from './i18n.js';

export function initContact() {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      if (status) status.textContent = t('Revisa los campos marcados.', 'Please check the highlighted fields.');
      return;
    }

    const data = new FormData(form);
    const subject = t('Contacto desde ancerlop.github.io', 'Message from ancerlop.github.io');
    const body = [
      `${t('Nombre', 'Name')}: ${data.get('nombre') || ''}`,
      `Email: ${data.get('email') || ''}`,
      '',
      data.get('mensaje') || '',
    ].join('\n');

    if (status) status.textContent = t('Abriendo tu cliente de correo…', 'Opening your mail client…');

    window.location.href =
      `mailto:ancerlop@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
