# CONTENIDO — lo que falta por rellenar y por verificar

Este archivo es la lista de trabajo editorial del sitio. Nada de lo que hay aquí
está inventado en el código: donde no había dato, hay un hueco marcado o una
frase deliberadamente genérica, y todo eso aparece listado abajo.

---

## 1. Huecos de material (slots)

Pensados para que se vea **que falta material** sin que parezca un descuido.

| Dónde | Qué buscar | Cómo sustituirlo |
|---|---|---|
| `index.html`, sección **SEC 01 Koniec Films** | Fotograma autorizado, teaser o making-of del largo de animación en producción | Sustituye el `<figure class="frame slot">` completo por `<figure class="frame"><img src="..." alt="..."><figcaption>…</figcaption></figure>`. El marco ya viene en 2.39:1 |
| Portada | Opcional: un retrato o una pieza gráfica propia | La portada está pensada para funcionar sin imagen. Si añades una, que sea 4:5 o 1:1 y con fondo oscuro |

El resto de imágenes del sitio son procedurales (canvas y SVG) y no necesitan
sustitución.

## 2. Datos por verificar o completar

Cada punto indica dónde está en el código y qué comprobar.

1. **El Goya: fuera, y ya no vuelve.** Estuvo mal puesto. El premio es de la
   película *Buñuel en el laberinto de las tortugas* (Goya 2020 a Mejor Película
   de Animación) y lo recogieron sus productoras —Sygnatia, The Glow Animation
   Studio y Hampa Studio— con Salvador Simó en la dirección. Tú no estabas ahí:
   **empiezas en Koniec Films el 13 de octubre de 2026**. Se ha eliminado de la
   portada, de la ficha, de los trofeos, de la marquesina, de los metadatos y del
   JSON-LD. Ninguna de las cinco direcciones nuevas lo menciona, y no debe
   aparecer en ninguna versión futura salvo que tú hayas ganado un premio.
2. **El laboratorio de inteligencia artificial.** El sitio lo llama «AI lab ·
   Málaga» en la trayectoria y lo marca con *«por confirmar»* en pantalla
   (`index.html`, `data-todo`). Antes aparecía Grupo AL: **¿es el mismo sitio o
   son dos etapas distintas?** Cuando lo confirmes, quita el `data-todo` y pon el
   nombre real.
3. **Fechas de la trayectoria.** Koniec Films está como `2026 →` y Kreatures
   como `2023 →`. Las etapas cerradas llevan sólo año de inicio cuando no hay
   fecha de fin documentada. Repásalas: `index.html`, sección SEC 04.
4. **Kreatures.** «Fundado: octubre 2023» sale del CV. «Equipo: se arma por
   proyecto» y «Modo: remoto / presencial» son descripciones prudentes, no datos
   cerrados. Corrígelas si procede.
5. **Palabras de caramelo.** No se menciona en el sitio. Si estás trabajando en
   ella, **es lo primero que debería aparecer** en la sección de Koniec Films.
6. **Enlaces de premios.** CM Málaga apunta a `cmmalaga.fycma.com` y Hack for
   Good a `telefonica.es` (genéricos, para no enlazar a una nota de prensa que
   puede cambiar). Si tienes las URLs exactas, mejor.
7. **LinkedIn.** No hay enlace porque no me has dado el perfil. Si lo quieres,
   añádelo en `#contacto` junto a GitHub.
8. **Nintendo Switch.** El CV antiguo mencionaba un port a Switch. Ahora mismo la
   web no lo dice en ninguna parte. Si sigue siendo cierto y quieres que se vea,
   es un dato que a un jurado técnico le interesa.

## 3. Traducción al inglés

Todo el texto tiene versión inglesa en atributos `data-en`, `data-en-html`,
`data-en-aria` y `data-en-placeholder`. Está escrita a mano, no traducida
automáticamente, pero **conviene que la leas entera**: es el idioma en el que te
va a juzgar un jurado internacional.

Para revisarla, en el navegador basta con pulsar **EN** en la barra; para
capturarla:

```
tools/capture/harness.html?w=1440&h=900&y=0&lang=en
```

Dos cosas que **no** cambian con el idioma y quizá quieras ajustar:
el `<title>`, la `meta description` y los datos estructurados JSON-LD están sólo
en castellano (es lo que indexan los buscadores).

## 4. Ideas para la siguiente vuelta

- **Segunda pieza del taller**: un pequeño autómata celular o un generador de
  paletas a partir de un fotograma. El taller aguanta una demo más.
- **Página de proyecto** por cada trabajo, si aparece cartera real.
- **`hreflang`** y URLs `/en/` si el inglés deja de ser un extra y pasa a ser
  importante para posicionar.
- **Vídeo de fondo** en la portada en lugar del haz procedural, si consigues
  metraje propio: ahora mismo el haz es una solución de compromiso, no una
  limitación técnica.

## 5. Cómo se ha verificado

Dos niveles, y los dos se pueden repetir:

- `python tools/validate.py` → sin errores ni avisos.
- `tools/capture/checks.html` (con `tools/capture/collect.py`) → **71
  comprobaciones, todo correcto** en movimiento normal y **69, todo correcto**
  con `prefers-reduced-motion`. Maneja el sitio de verdad: pulsa, arrastra,
  cambia de idioma, recorre secciones y mide.

Lo que la medición destapó, y que no se veía revisando capturas:

1. **La navegación quedaba ilegible sobre el mundo claro.** Los enlaces heredan
   el color de la barra, que se anima al cambiar de mundo, pero tenían
   `transition: color` **con retardo**: la transición del hijo nunca arrancaba y
   el enlace se quedaba con el color del mundo anterior. Se detectó midiendo
   estilos computados, no mirando.
2. **La etiqueta de semilla del vivero estaba en 2.85:1**, por debajo del mínimo
   AA de 4.5:1. Subida la mezcla del 40% al 66% → **6.03:1**.
3. **La rama de divergencia del laboratorio era inalcanzable.** El texto invita a
   subir el ritmo «hasta que el modelo se descontrole», pero el deslizador
   llegaba a 0.30 y la inestabilidad aparece por encima de ~0.8: era una promesa
   que la interfaz no podía cumplir. El recorrido ahora llega a 4.00, el panel lo
   explica y la batería comprueba que de verdad se descontrola.
4. **La portada dependía sólo del `IntersectionObserver`.** Si el observador
   llegaba tarde, el titular se quedaba oculto. Ahora `main.js` la revela
   directamente al arrancar; es la única sección que no necesita que le avisen.
5. **La cuenta atrás podía bloquear la página entera.** Al abrir `index.html` con
   doble clic, el navegador bloquea los módulos ES por CORS, así que no se
   ejecutaba nada y el «5» se quedaba clavado tapando el sitio para siempre. La
   capa que tapa la página no puede depender justo de lo que puede no cargar:
   ahora una guarda de arranque (script clásico, no módulo) la retira pase lo que
   pase y, si el motivo es `file://`, lo explica con el comando para servirlo.

Además, en la revisión visual se corrigieron: el borde duro del haz del
proyector, el solapamiento del rótulo con las etiquetas del gráfico, la columna
vacía del laboratorio, la celda vacía de la rejilla del vivero, el pie de foto
que tapaba la pieza y el numeral del Goya, que en didona se leía como una barra
suelta.

Y una limitación del entorno, por si alguien repite esto: con
`--virtual-time-budget` los `requestAnimationFrame` se agotan a los ~1,5 s, así
que la batería hay que lanzarla en tiempo real (con `--remote-debugging-port`
para que el navegador no se cierre antes de terminar). El informe lo avisa solo,
en la línea `FOTOGRAMAS`.

