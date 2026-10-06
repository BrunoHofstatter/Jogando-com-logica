"""Export the resting blue pieces from source CSS, without a browser.

Reference layout: desktop 1920 x 1080, normal unselected game pieces.
Original PNG symbols are preserved; no generated replacement artwork.
"""
from pathlib import Path
import math

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
DEST = Path(__file__).resolve().parent
SIZE = 2048
AA = 2


def export_piece(symbol_name, filename, king=False):
    # board.module.css: 6.5vw cells, .5vw bottom margin, .2vw borders.
    # Bootstrap sets border-box globally. piece.tsx sets 75% dimensions.
    vw = 19.2
    cell = min(max(2.6 * vw, 12.35 * 10.8), 6.5 * vw)
    width = (cell - 0.4 * vw) * 0.75
    height = (cell - 0.5 * vw - 0.4 * vw) * 0.75
    border = 0.3 * vw
    shadow = 0.5 * vw
    scale = 1630 / width * (1.05 if king else 1)
    w, h, b, dy = [v * scale * AA for v in (width, height, border, shadow)]
    side = SIZE * AA
    x = (side - w) / 2
    y = (side - h - dy) / 2
    canvas = Image.new('RGBA', (side, side))
    shadow_layer = Image.new('RGBA', canvas.size)
    ImageDraw.Draw(shadow_layer).ellipse((x, y + dy, x + w, y + h + dy), fill=(0, 0, 0, 102))
    canvas.alpha_composite(shadow_layer)

    # CSS radial-gradient(circle, #5dade2, #2980b9), farthest-corner.
    # Background positioning area is the padding box; the border is opaque.
    nx, ny = int(math.ceil(w)), int(math.ceil(h))
    xs = (np.arange(nx, dtype=np.float32) + 0.5 - w / 2)[None, :]
    ys = (np.arange(ny, dtype=np.float32) + 0.5 - h / 2)[:, None]
    radius = math.hypot(w / 2 - b, h / 2 - b)
    t = np.clip(np.sqrt(xs * xs + ys * ys) / radius, 0, 1)
    pixels = np.empty((ny, nx, 4), dtype=np.uint8)
    start, end = (93, 173, 226), (41, 128, 185)
    for channel in range(3):
        pixels[:, :, channel] = np.rint(start[channel] + t * (end[channel] - start[channel]))
    pixels[:, :, 3] = 255
    outer = Image.new('L', (nx, ny))
    ImageDraw.Draw(outer).ellipse((0, 0, w, h), fill=255)
    token = Image.new('RGBA', (nx, ny), (30, 58, 138, 255))
    gradient = Image.fromarray(pixels)
    inner = Image.new('L', (nx, ny))
    ImageDraw.Draw(inner).ellipse((b, b, w - b, h - b), fill=255)
    token.paste(gradient, (0, 0), inner)
    token.putalpha(outer)
    canvas.alpha_composite(token, (round(x), round(y)))

    # pieceSymbol: 70% of content box in both axes, object-fit: contain.
    icon = Image.open(ROOT / 'public' / symbol_name).convert('RGBA')
    icon_scale = min((w - 2 * b) * 0.7 / icon.width, (h - 2 * b) * 0.7 / icon.height)
    icon = icon.resize((round(icon.width * icon_scale), round(icon.height * icon_scale)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(icon, (round(x + (w - icon.width) / 2), round(y + (h - icon.height) / 2)))
    canvas = canvas.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    canvas.save(DEST / filename, optimize=True)
    assert canvas.mode == 'RGBA' and canvas.size == (SIZE, SIZE)
    assert canvas.getpixel((0, 0))[3] == 0
    bounds = canvas.getchannel('A').getbbox()
    assert bounds and all(0 < v < SIZE for v in bounds), bounds
    print(f'{filename}: {SIZE} x {SIZE}, transparent RGBA, bounds={bounds}')


if __name__ == '__main__':
    export_piece('crownchaseKingSymbol.png', 'rei-azul.png', king=True)
    export_piece('crownchaseAssassinSymbol.png', 'assassino-azul.png')
    export_piece('crownchaseJumperSymbol.png', 'saltador-azul.png')
