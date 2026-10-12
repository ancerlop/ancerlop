#!/usr/bin/env python3
"""Servidor de revisión: sirve el sitio y recoge el informe de comprobaciones.

    python tools/capture/collect.py [puerto]

Es un `http.server` normal sobre la raíz del repo (para que el arnés y el sitio
compartan origen) más un endpoint `POST /__results` que va apagando en
`.tmp/checks.txt` cada línea que envía la página de comprobaciones.

Existe porque sacar resultados de un navegador headless por captura de pantalla
o por consola es frágil: con `--virtual-time-budget` el renderer puede quedarse
sin presupuesto a mitad de la batería. Escribiendo cada resultado en el momento
en que se produce, un cuelgue no se lleva por delante lo ya comprobado.
"""

from __future__ import annotations

import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / ".tmp" / "checks.txt"
LOCK = threading.Lock()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self) -> None:  # noqa: N802 (nombre impuesto por la librería)
        if self.path.rstrip("/") != "/__results":
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length).decode("utf-8", "replace")

        OUT.parent.mkdir(parents=True, exist_ok=True)
        # con cerrojo: cada resultado llega en su propia petición y sin esto las
        # líneas pueden intercalarse y dejar el informe ilegible
        with LOCK, OUT.open("a", encoding="utf-8") as fh:
            fh.write(body + "\n")

        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def end_headers(self) -> None:
        # sin caché: se está revisando, no sirviendo en producción
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # silencio: el ruido de peticiones no aporta nada aquí


def main() -> int:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    if OUT.exists():
        OUT.unlink()

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"sirviendo {ROOT} en http://127.0.0.1:{port}")
    print(f"informe en {OUT.relative_to(ROOT)}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
