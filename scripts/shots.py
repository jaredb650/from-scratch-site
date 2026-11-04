"""Final screenshots + the social card. Needs `npm run preview -- --port 4610 --strictPort` running.
Usage: python3 scripts/shots.py [url] [--og]   (--og: only re-render public/og.jpg)
Writes public/og.jpg (1200x630) and screenshots/{desktop,mobile}-{hero,full}.(jpg|png).
"""
import io
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4610/"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "screenshots"
OUT.mkdir(exist_ok=True)


def ctx(p, name, w, h, dsf=1, reduced="no-preference"):
    # own profile dir so this never collides with the user's Chrome
    return p.chromium.launch_persistent_context(f"/tmp/fs-chrome-prof-shots-{name}", executable_path=CHROME, headless=True,
                                                viewport={"width": w, "height": h}, device_scale_factor=dsf, reduced_motion=reduced)


ONLY_OG = "--og" in sys.argv
if ONLY_OG: sys.argv.remove("--og")
URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4610/"

with sync_playwright() as p:
    # social card: the desktop hero composed at 1440x756, scaled to 1200x630
    c = ctx(p, "og", 1440, 756, dsf=1200 / 1440)
    pg = c.new_page(); pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(2600)
    # the countdown would be stale in a shared card; hide it (keeps its space so nothing shifts)
    pg.add_style_tag(content=".hero__clock { visibility: hidden; }")
    pg.screenshot(path=str(ROOT / "public/og.jpg"), type="jpeg", quality=86)
    c.close()
    if ONLY_OG:
        raise SystemExit(0)

    for name, w, h, dsf in [("desktop", 1440, 900, 1), ("mobile", 390, 844, 2)]:
        c = ctx(p, name, w, h, dsf)
        pg = c.new_page(); pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(2600)
        pg.screenshot(path=str(OUT / f"{name}-hero.png"))
        c.close()
        # full page: reduced motion so every block is settled and nothing is mid-transform
        # 1x: a 2x phone page is ~32k px tall, past Chrome's ~16k capture limit, and the image repeats
        c = ctx(p, name + "-full", w, h, 1, reduced="reduce")
        pg = c.new_page(); pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(1000)
        # walk the page once so every lazy image loads, then go back to the top
        H = pg.evaluate("document.documentElement.scrollHeight")
        for y in range(0, H, h): pg.evaluate(f"window.scrollTo({{top:{y},behavior:'instant'}})"); pg.wait_for_timeout(120)
        # lazy images that never started would never fire onload, so cap the wait
        pg.evaluate("Promise.race([Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))), new Promise(r => setTimeout(r, 4000))])")
        pg.evaluate("window.scrollTo({top:0,behavior:'instant'})"); pg.wait_for_timeout(600)
        # Chrome cannot capture more than ~16k px in one go (the image starts repeating), so shoot 6000 px slices and stitch
        H = pg.evaluate("document.documentElement.scrollHeight")
        sheet = Image.new("RGB", (w, H))
        for y in range(0, H, 6000):
            part = pg.screenshot(full_page=True, clip={"x": 0, "y": y, "width": w, "height": min(6000, H - y)}, type="png")
            sheet.paste(Image.open(io.BytesIO(part)).convert("RGB"), (0, y))
        sheet.save(OUT / f"{name}-full.jpg", quality=80)
        c.close()
    c = ctx(p, "rsvp", 390, 844, 2)
    pg = c.new_page(); pg.goto(URL.rstrip("/") + "/rsvp/", wait_until="networkidle"); pg.wait_for_timeout(1500)
    pg.screenshot(path=str(OUT / "mobile-rsvp.png"))
    c.close()
print("done")
