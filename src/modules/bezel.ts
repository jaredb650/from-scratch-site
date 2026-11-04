/**
 * HudBezel, ported from red-hybrid-theme/components/cyber/HudBezel.tsx (via the flyer's about.html):
 * chamfered corners, a centre notch on the top edge that holds the label, an optional bottom notch,
 * a red hairline inside, ONE curved corner (bottom-right), connector pins and red accent segments.
 * Drawn as SVG at the measured pixel size so the chamfers never stretch; redrawn on resize only.
 */
type Geo = { c: number; r: number; nd: number; ns: number };
const GEO: Geo = { c: 22, r: 56, nd: 24, ns: 22 };
const GEO_SM: Geo = { c: 14, r: 34, nd: 20, ns: 16 };
const NS = "http://www.w3.org/2000/svg";

function outline(w: number, h: number, i: number, g: Geo, nw: number, bw: number) {
  const c = g.c - i * 0.42, r = Math.max(4, g.r - i), l = i + 0.5, t = i + 0.5, rr = w - i - 0.5, b = h - i - 0.5, mid = w / 2;
  const half = nw / 2 - i * 0.42, bh = bw / 2 - i * 0.42;
  const d = [`M${l + c} ${t}`, `H${mid - half - g.ns}`, `L${mid - half} ${t + g.nd}`, `H${mid + half}`, `L${mid + half + g.ns} ${t}`,
    `H${rr - c}`, `L${rr} ${t + c}`, `V${b - r}`, `A${r} ${r} 0 0 1 ${rr - r} ${b}`];
  if (bw) d.push(`H${mid + bh + g.ns}`, `L${mid + bh} ${b - g.nd}`, `H${mid - bh}`, `L${mid - bh - g.ns} ${b}`);
  d.push(`H${l + c}`, `L${l} ${b - c}`, `V${t + c}`, "Z");
  return d.join(" ");
}

function pins(w: number, h: number, g: Geo, nw: number, bw: number) {
  const mid = w / 2, y = 0.5 + g.nd + 6;
  let d = `M${mid - nw / 2 + 8} ${y}h16M${mid + nw / 2 - 24} ${y}h16`;
  if (bw) { const yb = h - 0.5 - g.nd - 6; d += `M${mid - bw / 2 + 8} ${yb}h16M${mid + bw / 2 - 24} ${yb}h16`; }
  return d;
}

function accents(w: number, h: number, g: Geo) {
  const c = g.c, s = Math.min(64, w * 0.06);
  return `M${c + 6} 0.5h${s}M${w - c - 6 - s} 0.5h${s}M0.5 ${c + 6}v${s * 0.6}M0.5 ${h - c - 6 - s * 0.6}v${s * 0.6}M${w - 0.5} ${c + 6}v${s * 0.6}`;
}

function path(cls: string, d: string) {
  const p = document.createElementNS(NS, "path");
  p.setAttribute("class", cls);
  p.setAttribute("d", d);
  return p;
}

export function initBezels(drawOn: boolean) {
  const hosts = document.querySelectorAll<HTMLElement>("[data-bz]");
  hosts.forEach((host) => {
    const bz = document.createElement("div");
    bz.className = "bz";
    bz.setAttribute("aria-hidden", "true");
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("focusable", "false");
    bz.appendChild(svg);
    const top = document.createElement("span");
    top.className = "bz__label bz__label--top";
    top.textContent = host.dataset.label || "";
    bz.appendChild(top);
    let bottom: HTMLSpanElement | null = null;
    if (host.dataset.bottom) {
      bottom = document.createElement("span");
      bottom.className = "bz__label bz__label--bottom";
      bottom.textContent = host.dataset.bottom;
      bz.appendChild(bottom);
    }
    host.prepend(bz);
    if (drawOn) bz.dataset.draw = "";

    let lastW = 0, lastH = 0;
    const draw = () => {
      const w = Math.round(host.offsetWidth), h = Math.round(host.offsetHeight);
      if (w < 120 || (w === lastW && h === lastH)) return;
      lastW = w; lastH = h;
      const g = w < 600 ? GEO_SM : GEO;
      host.style.setProperty("--bz-nd", g.nd + "px");
      const notch = (el: HTMLElement | null) => {
        if (!el) return 0;
        el.style.width = "auto";
        const nw = Math.ceil(el.scrollWidth) + (w < 600 ? 30 : 52);
        el.style.width = nw + "px";
        return nw;
      };
      const nw = notch(top), bw = notch(bottom);
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      svg.replaceChildren(
        path("bz__fill", outline(w, h, 0, g, nw, bw)),
        path("bz__outer", outline(w, h, 0, g, nw, bw)),
        path("bz__inner", outline(w, h, 6, g, nw, bw)),
        path("bz__pins", pins(w, h, g, nw, bw)),
        path("bz__accent", accents(w, h, g)),
      );
      svg.querySelectorAll<SVGPathElement>(".bz__outer, .bz__inner").forEach((p) => p.style.setProperty("--len", String(Math.ceil(p.getTotalLength()))));
    };
    draw();
    new ResizeObserver(() => requestAnimationFrame(draw)).observe(host);
  });

  if (!drawOn) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const bz = (e.target as HTMLElement).querySelector<HTMLElement>(":scope > .bz");
      if (bz) bz.dataset.draw = "on";
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -12% 0px" });
  hosts.forEach((h) => io.observe(h));
}
