#!/usr/bin/env python3
"""Comprobaciones del sitio, sin dependencias externas.

    python tools/validate.py

Qué mira:
  1. HTML  · etiquetas equilibradas, ids duplicados, enlaces internos rotos,
             rutas locales (src/href) que no existen, alt en las imágenes.
  2. CSS   · llaves y paréntesis equilibrados, variables usadas sin declarar.
  3. JS    · sintaxis de módulo ES de cada archivo (necesita node en el PATH).

Sale con código 1 si algo falla, para poder colgarlo de un hook o de CI.
"""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent

VOID = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}

errors: list[str] = []
warnings: list[str] = []


# --------------------------------------------------------------------- HTML
class Checker(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[tuple[str, int]] = []
        self.ids: dict[str, int] = {}
        self.refs: list[tuple[str, str, int]] = []
        self.images: list[tuple[dict, int]] = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        line = self.getpos()[0]

        if "id" in a:
            if a["id"] in self.ids:
                errors.append(f"HTML · id duplicado «{a['id']}» (líneas {self.ids[a['id']]} y {line})")
            self.ids[a["id"]] = line

        for key in ("href", "src"):
            if key in a and a[key]:
                self.refs.append((key, a[key], line))

        if tag == "img":
            self.images.append((a, line))

        if tag not in VOID:
            self.stack.append((tag, line))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        line = self.getpos()[0]
        if not self.stack:
            errors.append(f"HTML · </{tag}> sin apertura (línea {line})")
            return
        open_tag, open_line = self.stack.pop()
        if open_tag != tag:
            errors.append(
                f"HTML · se cierra </{tag}> (línea {line}) pero se esperaba </{open_tag}> (abierto en línea {open_line})"
            )


def revisar_html(path: Path, exigir_h1: bool = True) -> None:
    """Revisa un archivo HTML. Las rutas locales se resuelven contra su carpeta,
    no contra la raíz, para que las páginas en subcarpetas se validen bien."""
    nombre = path.relative_to(ROOT).as_posix()
    raw = path.read_text(encoding="utf-8")

    parser = Checker()
    parser.feed(raw)
    parser.close()

    for tag, line in parser.stack:
        errors.append(f"HTML · {nombre}: <{tag}> abierto en la línea {line} y nunca cerrado")

    for key, value, line in parser.refs:
        if value.startswith(("http://", "https://", "mailto:", "tel:", "data:", "#", "//")):
            continue
        target = unquote(value.split("?")[0].split("#")[0])
        if target and not (path.parent / target).exists():
            errors.append(f"HTML · {nombre}: {key} apunta a un archivo que no existe: {value} (línea {line})")

    # Los enlaces internos se buscan fuera de <script> y <style>: dentro de un
    # script puede haber cadenas con href="#..." que no son enlaces reales.
    solo_marcado = re.sub(r"<(script|style)\b.*?</\1>", "", raw, flags=re.S | re.I)
    for match in re.finditer(r'href="#([^"]+)"', solo_marcado):
        if match.group(1) not in parser.ids:
            warnings.append(f"HTML · {nombre}: enlace interno #{match.group(1)} sin destino")

    for attrs, line in parser.images:
        if "alt" not in attrs:
            errors.append(f"HTML · {nombre}: <img> sin alt (línea {line})")
        if "loading" not in attrs and "fetchpriority" not in attrs:
            warnings.append(f"HTML · {nombre}: <img> sin loading (línea {line})")

    if exigir_h1:
        if "<h1" not in raw:
            errors.append(f"HTML · {nombre}: no hay ningún h1")
        if raw.count("<h1") > 1:
            warnings.append(f"HTML · {nombre}: hay {raw.count('<h1')} etiquetas h1")


def check_html() -> None:
    raiz = ROOT / "index.html"
    if not raiz.exists():
        errors.append("HTML · no existe index.html")
    else:
        revisar_html(raiz)

    # los mockups y el resto de páginas del sitio también se validan
    for carpeta, exigir in ((ROOT / "mockups", True), (ROOT / "tools" / "capture", False)):
        for path in sorted(carpeta.glob("*.html")):
            revisar_html(path, exigir_h1=exigir)


# ---------------------------------------------------------------------- CSS
def check_css() -> None:
    files = sorted((ROOT / "css").glob("*.css"))
    if not files:
        errors.append("CSS · no hay hojas en css/")
        return

    defined: set[str] = set()
    used: list[tuple[str, str]] = []
    text_all = ""

    # las variables también pueden venir declaradas en estilos en línea del HTML
    html_path = ROOT / "index.html"
    if html_path.exists():
        defined.update(re.findall(r"(--[a-z0-9-]+)\s*:", html_path.read_text(encoding="utf-8")))

    for path in files:
        text = path.read_text(encoding="utf-8")
        text_all += text

        for opener, closer in (("{", "}"), ("(", ")")):
            if text.count(opener) != text.count(closer):
                errors.append(f"CSS · {path.name}: desequilibrio entre {opener} y {closer}")

        defined.update(re.findall(r"(--[a-z0-9-]+)\s*:", text))
        used.extend((path.name, m) for m in re.findall(r"var\(\s*(--[a-z0-9-]+)", text))

    for name, var in used:
        if var not in defined:
            errors.append(f"CSS · {name}: se usa {var} sin declararla en ninguna hoja")

    if "@layer" not in text_all:
        warnings.append("CSS · no se usan capas (@layer)")


# ----------------------------------------------------------------------- JS
def check_js() -> None:
    node = shutil.which("node")
    files = sorted((ROOT / "js").glob("*.js"))
    if not files:
        errors.append("JS · no hay módulos en js/")
        return
    if not node:
        warnings.append("JS · node no está en el PATH: no se comprueba la sintaxis")
        return

    with tempfile.TemporaryDirectory() as tmp:
        for path in files:
            copy = Path(tmp) / (path.stem + ".mjs")
            copy.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
            proc = subprocess.run(
                [node, "--check", str(copy)], capture_output=True, text=True
            )
            if proc.returncode != 0:
                errors.append(f"JS · {path.name}: {proc.stderr.strip().splitlines()[-1] if proc.stderr else 'error de sintaxis'}")

    # el HTML debe cargar el punto de entrada
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    if "js/main.js" not in html:
        errors.append("JS · index.html no carga js/main.js")


def main() -> int:
    check_html()
    check_css()
    check_js()

    for w in warnings:
        print(f"  aviso  {w}")
    for e in errors:
        print(f"  ERROR  {e}")

    if errors:
        print(f"\n{len(errors)} error(es), {len(warnings)} aviso(s)")
        return 1

    print(f"todo correcto · {len(warnings)} aviso(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
