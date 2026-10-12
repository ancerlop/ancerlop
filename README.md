# ancerlop

Web personal de **Andrés Cervantes López** — Director Técnico en Koniec Films
(desde el 13 de octubre de 2026), laboratorio de inteligencia artificial, y
Kreatures en el Polo de Contenidos Digitales de Málaga.

HTML, CSS y JavaScript escritos a mano. Sin build, sin dependencias, sin
rastreadores. Se publica tal cual en GitHub Pages y el código es abierto.

---

## ⚠️ Estado: buscando dirección

Hay **dos cosas** en este repositorio ahora mismo:

| | Qué es |
|---|---|
| **`mockups/`** | **Cinco direcciones de diseño distintas** para elegir. Es lo que hay que mirar. Se abre en `mockups/index.html` |
| **`/` (raíz)** | La versión anterior (la sala de cine y el taller). **Descartada**, se conserva sólo como referencia y para reaprovechar el laboratorio y el vivero |

Abre la galería con el servidor en marcha:

```
http://127.0.0.1:8765/mockups/
```

Cada dirección es un lenguaje distinto de verdad —tipografía, estructura y tono—
no una variación de color. En la galería hay un conmutador para saltar de una a
otra sin cambiar de pestaña, y cada una se puede abrir suelta.

**Regla que ya está aplicada en todas:** nada de Goya. El premio es de la película
y de su director, no tuyo, y presentarlo en la portada era atribuirte algo que no
has ganado. Koniec Films aparece como lo que es: empiezas allí el 13 de octubre.

### Lo que está comprobado en los cinco

No son sólo dibujos: se han medido. Con `tools/capture/audit.html`, que recorre
**todos** los textos visibles de una página y calcula el contraste real contra su
fondo efectivo (sin listas de selectores: vale para cualquier página).

| | Contraste (AA) | Ancho a 390 px |
|---|---|---|
| 01 Editorial | 56 textos, 0 fallos | correcto |
| 02 Tecnológico | 43 textos, 0 fallos | correcto |
| 03 Creativo | 40 textos, 0 fallos | correcto |
| 04 Terminal | 77 textos, 0 fallos | correcto |
| 05 Documental | 40 textos, 0 fallos | correcto |

Encontró cinco cosas que a ojo no se ven, y están corregidas:

1. **El rojo de señal de la 01** estaba en 3,86:1 (mínimo 4,5 para texto pequeño).
2. **El cian del degradado de la 02** daba 2,43:1 sobre blanco. Se usa como texto
   recortado y como fondo del botón, así que el degradado ahora termina en un
   turquesa oscuro: **5,36:1**.
3. **La tarjeta naranja de la 03** no podía llevar texto blanco a 4,5:1 con ese
   naranja: fondo oscurecido.
4. **La etiqueta de imagen de la 02** y **el gris de la 05** se quedaban a dos
   décimas del mínimo.
5. **La 03 y la 04 desbordaban a lo ancho en móvil** (7 y 30 px): un
   `grid-column: span 6` fuera de la media query obligaba a la rejilla a tener
   seis columnas, y la barra de navegación no cabía en una línea.

Un aviso metodológico, porque me pasó a mí: en Windows **`--window-size=390` no da
390 px reales** (la ventana mínima son ~496 px), así que las capturas "de móvil"
pueden ser un recorte de una vista más ancha. Para medir de verdad hay que usar el
marco del iframe (`audit.html?...&w=390&h=844`), que sí fija el ancho.

---

## La idea

La web está montada como un recorrido por dos mundos, porque eso es lo que hay
dentro:

| | **La sala** | **El taller** |
|---|---|---|
| Secciones | portada · Koniec Films · trayectoria · trofeos · contacto | laboratorio de IA · Kreatures |
| Lenguaje | negro de sala, grano de película, didona, luz de proyector | papel técnico, retícula, monoespaciada, acento teal |
| Qué se hace | se cuenta | se toca |

Entre los dos hay un **corte diagonal** con su rótulo de guion: el sitio pasa de
la sala de cine al taller y vuelve. La barra superior cambia de color sola según
el mundo en el que estés.

Detalles que sostienen el conjunto:

- **Cuenta atrás de proyector** al entrar (una vez por sesión, se salta con
  cualquier gesto, y no existe si el sistema pide menos movimiento).
- **Haz de proyector** con polvo en suspensión en la portada: canvas 2D, sprite
  precalculado, dibujado en una capa aparte y difuminado al componer.
- **Grano de película** procedural sobre todo el sitio, con interruptor en la
  barra. Una loseta de ruido de 128×128 estampada a 24 fps: textura de cine a
  coste casi nulo.
- **Diafragma** como cursor (sólo con ratón fino, sólo si el JS arranca bien: la
  clase que oculta el cursor nativo la pone el propio módulo).
- **Timecode** en la barra enlazado al scroll: la página dura 03:20 de metraje.
- **KONIEC**, que en polaco significa «fin»: el cartel de cierre de toda película
  y el nombre del estudio. Es el pie de página.

### Las dos piezas interactivas

1. **Laboratorio** (`js/lab-descent.js`) — una regresión lineal entrenada de
   verdad por descenso de gradiente, con su curva de pérdida. Arrastra los
   puntos, añade con clic, borra con alt+clic, sube el ritmo de aprendizaje y
   mira cómo diverge. Sin caja negra: la pérdida está a la vista.
2. **Vivero** (`js/vivero.js`) — seis criaturas procedurales generadas a partir
   de una semilla (PRNG determinista, silueta por armónicos, patas, antenas,
   manchas y paleta). Se pulsa una para evolucionarla y los ojos siguen al
   puntero. Cero imágenes: todo es geometría calculada en el navegador.

## Estructura

```
index.html               todo el contenido, en castellano y con el inglés en atributos data-en
css/
  site.css               sistema de diseño: capas @layer, tokens, layout y componentes
  lab.css                el taller: laboratorio y vivero
js/
  main.js                punto de entrada; inicializa todo a prueba de fallos
  ticker.js              un único requestAnimationFrame compartido
  intro.js               cuenta atrás de proyector
  reveal.js              apariciones al entrar en pantalla
  nav.js                 barra adaptativa, timecode, progreso, menú móvil, grano
  i18n.js                cambio de idioma sin diccionarios ni peticiones
  grain.js               grano de película
  beam.js                haz de proyector y polvo
  cursor.js              diafragma que sigue al puntero
  contact.js             formulario → mailto
  lab-descent.js         regresión lineal interactiva
  vivero.js              criaturas procedurales
assets/                  favicon, iconos, imagen social y la pieza del cerebro
tools/
  validate.py            comprobaciones de HTML, CSS y JS
  generate-assets.py     regenera og.jpg e icon-180.png (Pillow)
  capture/
    collect.py           sirve el sitio y recoge el informe de comprobaciones
    checks.html          batería que maneja el sitio de verdad y mide contraste
    harness.html         captura una franja exacta de la página
    probe.html           mide la altura del documento y el offset de cada sección
```

## Trabajar en local

> **No abras `index.html` con doble clic.** El navegador bloquea los módulos ES
> en `file://` por CORS, así que no se ejecuta nada del JavaScript. Hay que
> servir la carpeta por HTTP:
>
> ```bash
> python -m http.server 8765
> # y entra en http://127.0.0.1:8765
> ```
>
> Si aun así abres el archivo directamente, la página **ya no se queda colgada**:
> una guarda de arranque (script clásico, no módulo) retira la cuenta atrás,
> muestra el contenido y explica arriba qué pasa y cómo servirlo. Pero las dos
> piezas interactivas necesitan el JavaScript, así que en `file://` salen vacías.

En GitHub Pages no hay que hacer nada de esto: se sirve por HTTP y funciona.

Comprobaciones antes de subir nada:

```bash
python tools/validate.py      # HTML equilibrado, CSS sin variables huérfanas, sintaxis JS
python tools/generate-assets.py   # sólo si cambian los textos de la tarjeta social
```

`validate.py` mira etiquetas sin cerrar, ids duplicados, enlaces internos rotos,
rutas locales inexistentes, `alt` que falten, llaves desequilibradas, variables
CSS usadas sin declarar y la sintaxis de cada módulo (necesita `node` en el PATH).

Para revisar el diseño con capturas reales, sin depender de anclas ni de
capturas de página completa:

```bash
python -m http.server 8765
msedge --headless=new --window-size=1440,900 --screenshot=out.png \
  "http://127.0.0.1:8765/tools/capture/harness.html?w=1440&h=900&y=3200"
```

`tools/capture/probe.html` da la altura del documento y el desplazamiento exacto
de cada sección para saber qué franja capturar en cada caso.

## Verificación

Dos niveles: `tools/validate.py` mira el código quieto y
`tools/capture/checks.html` maneja el sitio de verdad en un navegador.

```bash
python tools/capture/collect.py 8765          # sirve el sitio y recoge el informe

# en otra terminal: el navegador tiene que quedarse vivo mientras corre la batería
msedge --headless=new --remote-debugging-port=9333 --window-size=2050,1250 \
  "http://127.0.0.1:8765/tools/capture/checks.html"

# y con el sistema pidiendo menos movimiento
msedge --headless=new --remote-debugging-port=9334 --force-prefers-reduced-motion \
  --window-size=2050,1250 "http://127.0.0.1:8765/tools/capture/checks.html"
```

El informe va cayendo en `.tmp/checks.txt` **línea a línea y en el momento en que
se produce**, así que un cuelgue no se lleva por delante lo ya comprobado.

Conviene lanzarlo **sin** `--virtual-time-budget`: con tiempo virtual los
`requestAnimationFrame` dejan de llegar a los ~1,5 s (medido: 93 esperas
resueltas por fotograma y el resto por temporizador) y todo lo que dependa de un
fotograma —revelados, navegación, entrenamiento— da falsos negativos. El propio
informe lo dice al final, en la línea `FOTOGRAMAS`.

Qué cubre, y qué dio la última pasada:

| | |
|---|---|
| Arranque, estructura, `alt`, etiquetas, regiones, salto de contenido | 71 comprobaciones, **todo correcto** |
| Idioma ES↔EN y textos dinámicos | |
| Interruptor de grano, menú móvil, `aria-pressed`/`aria-expanded` | |
| Laboratorio: entrena, pausa, reanuda, reinicia, diverge, añadir y arrastrar puntos, deslizador | |
| Vivero: seis criaturas, evolucionar, nueva camada | |
| Navegación: scroll, timecode, sección activa, cambio de mundo de la barra y su contraste | |
| Contraste medido en 22 pares de texto/fondo (mínimo AA) | |
| Rama de `prefers-reduced-motion` completa | 69 comprobaciones, **todo correcto** |
| Peso y tiempos | **138 KB** propios en 15 archivos, sin librerías; DOM listo en **579 ms** |

El contraste se calcula en el navegador sobre los colores ya resueltos, con
fondo efectivo real (recorre los ancestros hasta encontrar algo opaco) y
componiendo las transparencias. Hay que aceptar que Chromium serializa los
resultados de `color-mix()` como `color(srgb …)` con componentes 0–1: leerlos
como `rgb()` de 0–255 da cifras absurdas.

## Decisiones que conviene conocer

- **Sin WebGL.** Tentaba, pero canvas 2D bien hecho da el mismo brillo con menos
  peso, menos batería y menos formas de romperse. Todo el sitio son tres canvas
  pequeños y un SVG por criatura.
- **Un solo bucle de animación.** `ticker.js` centraliza el `requestAnimationFrame`;
  un canvas que se anima por su cuenta es la vía rápida a fundir la batería.
- **El JS sólo añade.** Sin JavaScript se ve todo el contenido, con su idioma por
  defecto: el CSS sólo oculta cosas bajo `html.js` —está comprobado en la
  batería— y hay una red de seguridad que a los 5 s lo muestra todo. Las dos
  piezas interactivas *son* código, así que sin JS dejan un aviso en su lugar
  (`<noscript>`) en vez de un hueco vacío.
- **Idioma sin diccionarios.** El castellano vive en el HTML (indexable) y el
  inglés en atributos `data-en` / `data-en-html`. Cero peticiones, cero claves
  desincronizadas. Los textos que cambian en caliente (los mandos del
  laboratorio) se piden con `t('es','en')`.
- **Accesibilidad.** `prefers-reduced-motion` desactiva animaciones, grano, haz y
  cuenta atrás; el laboratorio arranca en pausa y se puede manejar sólo con
  teclado desde los mandos de HTML, con el estado anunciado por `aria-live`; el
  grano es opcional porque la textura molesta a algunas personas; foco visible en
  todo, enlace de salto y contraste por encima de AA.
- **Rendimiento.** Sin fuentes autoalojadas ni librerías: una hoja de Google Fonts
  con `display=swap`, tres archivos CSS, once módulos JS y un puñado de assets.
  Los canvas sólo se dibujan cuando están a la vista y la pestaña está activa.

## Publicar

GitHub Pages desde la rama `main`, carpeta raíz:

```bash
git add .
git commit -m "Rediseño: la sala y el taller"
git push origin main
```

Ajusta antes el dominio en `index.html` (`<link rel="canonical">`, `og:url` y
`og:image`) si dejas de usar `ancerlop.github.io`.

## Licencia

Código bajo MIT (ver [LICENSE](LICENSE)). Los textos, imágenes, el currículum y
la marca son de Andrés Cervantes López y no se ceden para reutilización.
