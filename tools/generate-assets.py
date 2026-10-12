#!/usr/bin/env python3
"""Genera los assets binarios del sitio (imagen Open Graph e iconos).

Todo lo que es binario en este repo sale de aquí, para que sea reproducible:

    python tools/generate-assets.py

Salidas:
    assets/og.jpg        1200x630  tarjeta social
    assets/icon-180.png  180x180   icono para iOS

Necesita Pillow. Las fuentes se buscan en las rutas habituales de Windows,
macOS y Linux; si no encuentra ninguna, usa la fuente por defecto de Pillow
(el resultado pierde gracia, pero no falla).
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

FONT_CANDIDATES = {
    "display": [
        "C:/Windows/Fonts/georgiab.ttf",
        "C:/Windows/Fonts/georgia.ttf",
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    ],
    "body": [
        "C:/Windows/Fonts/segoeui.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ],
    "mono": [
        "C:/Windows/Fonts/consola.ttf",
        "/System/Library/Fonts/Supplemental/Andale Mono.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ],
}

BG = (8, 8, 10)
FG = (244, 241, 234)
DIM = (176, 171, 160)
GOLD = (227, 176, 75)
AMBER = (255, 180, 84)


def font(kind: str, size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES[kind]:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default(size)


def grain(img: Image.Image, sigma: float = 12, opacity: float = 0.05) -> Image.Image:
    """Ruido monocromo encima, como el grano del sitio."""
    noise = Image.effect_noise(img.size, sigma).convert("L")
    noise_rgb = Image.merge("RGB", (noise, noise, noise))
    return Image.blend(img, noise_rgb, opacity)


def radial_glow(size: tuple[int, int], center: tuple[int, int], radius: int,
                color: tuple[int, int, int], strength: float) -> Image.Image:
    """Mancha de luz cálida, hecha a mano: degradado radial por distancia."""
    w, h = size
    cx, cy = center
    layer = Image.new("RGB", size, (0, 0, 0))
    px = layer.load()
    r2 = radius * radius
    for y in range(h):
        dy = y - cy
        for x in range(w):
            dx = x - cx
            d2 = dx * dx + dy * dy
            if d2 >= r2:
                continue
            k = (1 - d2 / r2) ** 2 * strength
            px[x, y] = (int(color[0] * k), int(color[1] * k), int(color[2] * k))
    return layer.filter(ImageFilter.GaussianBlur(radius / 6))


def fit_text(d: ImageDraw.ImageDraw, text: str, kind: str, max_w: int,
             start: int, floor: int = 24) -> ImageFont.FreeTypeFont:
    """Baja el cuerpo de la fuente hasta que el texto quepa en max_w."""
    size = start
    while size > floor:
        f = font(kind, size)
        if d.textlength(text, font=f) <= max_w:
            return f
        size -= 2
    return font(kind, floor)


def build_og() -> None:
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BG)

    # luz de proyector entrando por arriba a la derecha (aditiva, como en el sitio)
    img = ImageChops.add(img, radial_glow((W, H), (900, -160), 1000, AMBER, 0.85))
    img = ImageChops.add(img, radial_glow((W, H), (1160, 660), 760, (96, 64, 168), 0.30))

    # viñeta
    vig = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vig)
    vd.ellipse([-300, -240, W + 300, H + 280], fill=205)
    vig = vig.filter(ImageFilter.GaussianBlur(130))
    img = Image.composite(img, Image.new("RGB", (W, H), (0, 0, 0)), vig)

    d = ImageDraw.Draw(img)

    # pieza: el cerebro partido en dos, a la derecha, sin invadir el texto
    piece_path = ASSETS / "cerebro.jpg"
    text_right = 700
    if piece_path.exists():
        piece = Image.open(piece_path).convert("RGB")
        pw = 356
        ph = int(piece.height * pw / piece.width)
        piece = piece.resize((pw, ph), Image.LANCZOS)
        px, py = W - pw - 74, (H - ph) // 2

        shadow = Image.new("L", (W, H), 0)
        shadow.paste(piece.convert("L"), (px + 20, py + 24))
        shadow = shadow.filter(ImageFilter.GaussianBlur(22)).point(lambda v: int(v * 0.75))
        img = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), img, shadow)

        img.paste(piece, (px, py))
        d = ImageDraw.Draw(img)
        d.rectangle([px - 1, py - 1, px + pw, py + ph], outline=GOLD)
        text_right = px - 56

    max_w = text_right - 88
    x = 88

    f_mono = font("mono", 20)
    d.text((x, 150), "A N C E R L O P   ·   M Á L A G A", font=f_mono, fill=GOLD)

    line1 = "Entreno inteligencias,"
    line2 = "construyo mundos."
    size = min(
        fit_text(d, line1, "display", max_w, 64, 30).size,
        fit_text(d, line2, "display", max_w, 64, 30).size,
    )
    f_display = font("display", size)
    d.text((x, 200), line1, font=f_display, fill=FG)
    d.text((x, 200 + int(size * 1.16)), line2, font=f_display, fill=AMBER)

    rule_y = 200 + int(size * 1.16) + size + 34
    d.line([(x, rule_y), (x + 120, rule_y)], fill=GOLD, width=2)

    f_body = font("body", 24)
    d.text((x, rule_y + 30), "Director Técnico · Koniec Films", font=f_body, fill=FG)
    d.text((x, rule_y + 66), "Laboratorio de IA  ·  Kreatures  ·  Málaga", font=f_body, fill=DIM)

    img = grain(img, 14, 0.10)
    out = ASSETS / "og.jpg"
    img.save(out, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"escrito {out.relative_to(ROOT)} ({out.stat().st_size / 1024:.1f} KB)")


def aperture(d: ImageDraw.ImageDraw, cx: float, cy: float, r: float, color, width: int, blades: int = 6) -> None:
    """Diafragma: aro, aspas y punto central. El mismo motivo del favicon."""
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=width)
    for i in range(blades):
        a = (i / blades) * 6.28318530718
        d.line(
            [(cx + math.cos(a) * r * 0.92, cy + math.sin(a) * r * 0.92),
             (cx + math.cos(a + 2.0) * r * 0.62, cy + math.sin(a + 2.0) * r * 0.62)],
            fill=color,
            width=width,
        )
    d.ellipse([cx - r * 0.12, cy - r * 0.12, cx + r * 0.12, cy + r * 0.12], fill=color)


def build_icon() -> None:
    S = 180
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=38, fill=(8, 8, 10, 255))
    d.rounded_rectangle([2, 2, S - 3, S - 3], radius=36, outline=(227, 176, 75, 120), width=1)
    aperture(d, S / 2, S / 2, S * 0.30, (227, 176, 75, 255), 5)
    out = ASSETS / "icon-180.png"
    img.save(out, "PNG", optimize=True)
    print(f"escrito {out.relative_to(ROOT)} ({out.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    random.seed(7)
    ASSETS.mkdir(exist_ok=True)
    build_og()
    build_icon()
