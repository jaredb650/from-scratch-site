"""Resize the flyer/brand artwork and encode AVIF + WebP into public/img.

Sources are read from the flyer project (read only). Re-run with `npm run assets`.
"""
import os
import subprocess
import sys
import tempfile

from PIL import Image

SRC = os.environ.get("FLYER", "/Users/jaredbeguelin/code/liveSeshFLyer/flyer")
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "img")
os.makedirs(OUT, exist_ok=True)

# name, source, widths, crop box (or None), webp quality, avif quality (lower = smaller)
JOBS = [
    ("tribal", "assets/tribal-frame.jpg", [1100, 700], None, 72, 30),
    ("mech", "assets/meka-mech-xl.png", [1400, 800], None, 80, 34),
    ("meka-chrome", "assets/meka-logo-chrome.png", [1800, 900], None, 85, 30),
    ("fs-chrome", "rsvp/img/fs-logo.png", [1600, 800], (180, 110, 2760, 1560), 82, 30),
    ("fs-pump", "rsvp/img/fs-pump.png", [2552, 1300], None, 86, 28),
    ("fs-clip", "rsvp/img/fs-clip-fold.png", [2440, 1300], None, 86, 28),   # FOLD selected (5-row Shape tab, 11-04)
    ("fs-eq", "rsvp/img/fs-eq.png", [3192, 1600], None, 86, 28),
    ("meka-icon", "assets/meka-icon.png", [160], None, 85, 30),
    # the series mark (obi icon): transparent chrome FS, cropped to the letters
    ("fs-mark", "logo/fromscratch-fs-chrome-transparent.png", [240], (70, 244, 1009, 836), 86, 30),
]

if len(sys.argv) > 1 and sys.argv[1] == "--icons":
    JOBS = [j for j in JOBS if j[0] == "fs-mark"]
elif len(sys.argv) > 2 and sys.argv[1] == "--only":   # e.g. --only fs-clip: re-encode one image, nothing else
    JOBS = [j for j in JOBS if j[0] == sys.argv[2]]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"failed: {' '.join(cmd)}\n{r.stderr}")


for name, rel, widths, crop, wq, aq in JOBS:
    im = Image.open(os.path.join(SRC, rel))
    if crop:
        im = im.crop(crop)
    alpha = im.mode in ("RGBA", "LA", "P")
    im = im.convert("RGBA" if alpha else "RGB")
    for w in widths:
        h = round(im.height * w / im.width)
        r = im.resize((w, h), Image.LANCZOS) if w != im.width else im
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as t:
            r.save(t.name)
        base = os.path.join(OUT, f"{name}-{w}")
        run(["cwebp", "-quiet", "-q", str(wq), "-alpha_q", "90", "-m", "6", t.name, "-o", base + ".webp"])
        run(["nice", "avifenc", "-q", str(100 - aq * 2), "-s", "5", "-j", "4", t.name, base + ".avif"])
        os.unlink(t.name)
        print(f"{name}-{w}: {w}x{h}  webp {os.path.getsize(base + '.webp')//1024}K  avif {os.path.getsize(base + '.avif')//1024}K")

if len(sys.argv) > 2 and sys.argv[1] == "--only":
    sys.exit(0)

# favicons: the FS mark on black (the brand is the series, not the host)
mark = Image.open(os.path.join(SRC, "logo/fromscratch-fs-chrome-transparent.png")).convert("RGBA").crop((70, 244, 1009, 836))
PUB = os.path.join(os.path.dirname(__file__), "..", "public")
for size, fname in [(64, "favicon.png"), (180, "apple-touch-icon.png")]:
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    w = round(size * 0.86); h = round(mark.height * w / mark.width)
    bg.alpha_composite(mark.resize((w, h), Image.LANCZOS), ((size - w) // 2, (size - h) // 2))
    bg.convert("RGB").save(os.path.join(PUB, fname))
print("favicons done")
if len(sys.argv) > 1 and sys.argv[1] == "--icons":
    sys.exit(0)

# print texture: one grey tile, softened a touch (the page adds its own grain), used as a soft-light overlay
from PIL import ImageFilter
tex = Image.open(os.path.join(SRC, "assets/textures/creased-tile.jpg")).convert("L").resize((1024, 1024), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.8))
tp = os.path.join(tempfile.gettempdir(), "creased.png")
tex.save(tp)
run(["cwebp", "-quiet", "-q", "40", tp, "-o", os.path.join(OUT, "creased.webp")])
run(["nice", "avifenc", "-q", "45", "-s", "5", tp, os.path.join(OUT, "creased.avif")])
os.unlink(tp)
print("creased tile done")
