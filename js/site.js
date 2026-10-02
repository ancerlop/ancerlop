document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('contactForm');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(form);
    location.href = 'mailto:ancerlop@gmail.com?subject=' +
      encodeURIComponent('Contacto web ancerlop') + '&body=' +
      encodeURIComponent('Hola Andrés, soy ' + f.get('nombre') + ' (' + f.get('email') + '). ' + (f.get('mensaje') || ''));
  });
});
