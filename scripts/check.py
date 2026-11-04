"""DOM checks (no screenshots): overflow, headline line counts, first-screen facts, bezels, clock, pinned story.
Usage: python3 scripts/check.py [url]   (default http://localhost:4610/)
"""
import json
import sys

from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4610/"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

JS = r"""
() => {
  const vw = innerWidth, vh = innerHeight;
  const out = {};
  out.overflowX = document.documentElement.scrollWidth - vw;
  // elements sticking out past the right edge (ignore clipped containers)
  out.wide = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width && r.right > vw + 1 && !el.closest('.asks, .hero, .foot__mark, .fx, .sprite, .sheet')) out.wide.push((el.className || el.tagName).toString().slice(0, 40) + ' ' + Math.round(r.right));
  });
  out.wide = out.wide.slice(0, 12);
  const lines = el => { const r = el.getBoundingClientRect(); const lh = parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize); return Math.round(r.height / lh); };
  out.headings = [...document.querySelectorAll('h1 span[data-split], h2, h3.step__title, h3.dev__name')].map(h => `${lines(h)}L ${h.textContent.trim().slice(0, 34)}`).filter(s => !s.startsWith('1L'));
  const hero = q => { const el = document.querySelector(q); if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
  out.hero = { from: hero('.hero__from'), scratch: hero('.hero__scratch'), mech: hero('.hero__mech'), logo: hero('.hero__logo'), intro: hero('.hero__intro'), when: hero('.hero__when'), rsvp: hero('.hero__actions .btn'), badge: hero('.hero__badge'), heroBox: hero('.hero') };
  out.rsvpAboveFold = (() => { const r = document.querySelector('.hero__actions .btn').getBoundingClientRect(); return r.bottom <= vh; })();
  out.bezels = [...document.querySelectorAll('.bz svg')].map(s => s.querySelectorAll('path').length).join(',');
  out.clock = document.querySelector('[data-clock="value"]').textContent + ' | ' + document.querySelector('[data-clock="short"]').textContent;
  out.small = [...document.querySelectorAll('p, span, a, b, dt, li')].filter(el => el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && el.offsetParent && parseFloat(getComputedStyle(el).fontSize) < 12.5).map(el => el.textContent.trim().slice(0, 24) + ' ' + getComputedStyle(el).fontSize).slice(0, 10);
  out.imgsNoAlt = [...document.querySelectorAll('img:not([alt])')].length;
  out.pageHeight = document.documentElement.scrollHeight;
  return out;
}
"""

with sync_playwright() as p:
    for w, h in [(390, 844), (1440, 900)]:
        # own profile dir so this never collides with the user's Chrome
        b = p.chromium.launch_persistent_context(f"/tmp/fs-chrome-prof-check-{w}", executable_path=CHROME, headless=True,
                                                 args=["--autoplay-policy=no-user-gesture-required"],
                                                 viewport={"width": w, "height": h}, device_scale_factor=1)
        pg = b.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(URL, wait_until="networkidle")
        pg.wait_for_timeout(1200)
        res = pg.evaluate(JS)
        # pinned story: scroll to each step and read the active clip
        story = []
        for i in range(5):
            pg.evaluate(f"(() => {{ const s = document.querySelectorAll('.step')[{i}]; const r = s.getBoundingClientRect(); window.scrollTo({{top: (innerWidth >= 900 ? r.top + r.height/2 - innerHeight*0.5 : r.top - innerHeight*0.45) + scrollY, behavior: 'instant'}}); }})()")
            pg.wait_for_timeout(700)
            story.append(pg.evaluate("document.querySelector('[data-mon-name]').textContent + ' ' + (document.querySelector('[data-monitor]').getAttribute('src')||'-')"))
        res["story"] = story
        res["errors"] = errs
        print(f"== {w}x{h}")
        print(json.dumps(res, indent=1, ensure_ascii=False))
        b.close()
