/**
 * The live thing: the six-hour session as an arrangement with a playhead at the real time in Puerto Rico.
 * Before 4 PM: a countdown and an empty clip. 4-10 PM: the clip fills up to the playhead. After: done.
 * Preview any moment with ?t=2026-11-05T19:30 (read as Puerto Rico time).
 */
import { SITE } from "../../site.config";

const START = Date.parse(SITE.EVENT_START);
const END = Date.parse(SITE.EVENT_END);
const SPAN = END - START;

function override(): number | null {
  const t = new URLSearchParams(location.search).get("t");
  if (!t) return null;
  const v = Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(t) ? t : t + "-04:00");
  return Number.isNaN(v) ? null : v;
}

const pad = (n: number) => String(n).padStart(2, "0");
const hms = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

/** Deterministic little MIDI pattern for the clip body (hard trance: driving 16ths, a few long notes). */
function drawNotes(svg: SVGSVGElement) {
  const W = 1200, H = 80, rows = 7;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const parts: string[] = [];
  for (let x = 0; x < W; x += 12.5) {
    const bar = Math.floor(x / 100);
    if (rnd() < 0.18 + (bar % 4 === 3 ? 0.25 : 0)) continue;
    const row = Math.floor(rnd() * rows);
    const len = rnd() < 0.12 ? 37.5 : 10;
    parts.push(`<rect x="${x.toFixed(1)}" y="${(8 + row * ((H - 16) / rows)).toFixed(1)}" width="${len}" height="6" />`);
    if (x % 50 === 0) parts.push(`<rect x="${x.toFixed(1)}" y="${H - 10}" width="10" height="6" opacity=".7" />`);
  }
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = `<g fill="currentColor">${parts.join("")}</g>`;
}

const Q_AT = [3, 9, 15, 22, 30, 37, 45, 52, 61, 70, 79, 90];

export function initClock() {
  const fixed = override();
  const now = () => (fixed ?? Date.now());

  const arr = document.querySelector<HTMLElement>(".arr");
  const label = document.querySelector<HTMLElement>('[data-clock="label"]');
  const value = document.querySelector<HTMLElement>('[data-clock="value"]');
  const status = document.querySelector<HTMLElement>('[data-clock="status"]');
  const short = document.querySelector<HTMLElement>('[data-clock="short"]');
  const scratch = document.querySelector<HTMLElement>(".clip__scratch");
  const qs = Array.from(document.querySelectorAll<HTMLElement>(".q"));
  const notes = document.querySelector<SVGSVGElement>("[data-notes]");
  if (notes) drawNotes(notes);
  qs.forEach((q, i) => (q.style.left = Q_AT[i % Q_AT.length] + "%"));

  let lastPhase = "";
  const tick = () => {
    const t = now();
    const phase = t < START ? "before" : t < END ? "live" : "after";
    const p = phase === "before" ? 0 : phase === "live" ? (t - START) / SPAN : 1;
    arr?.style.setProperty("--p", (p * 100).toFixed(3) + "%");

    if (phase === "before") {
      const left = START - t;
      if (value) value.textContent = hms(left);
      const h = Math.floor(left / 3.6e6), m = Math.floor((left % 3.6e6) / 6e4);
      if (short) short.innerHTML = `<b>Starts in ${h >= 1 ? `${h} h ${pad(m)} m` : `${m} min`}</b>. Come and go anytime.`;
    } else if (phase === "live") {
      if (value) value.textContent = hms(t - START);
      const hour = Math.min(6, Math.floor((t - START) / 3.6e6) + 1);
      if (short) short.innerHTML = `<b>Live now, hour ${hour} of 6.</b> Come by, the door is open.`;
    } else if (value) value.textContent = "06:00:00";

    if (phase !== lastPhase) {
      lastPhase = phase;
      if (arr) arr.dataset.phase = phase;
      if (label) label.textContent = phase === "before" ? "Starts in" : phase === "live" ? "Session time" : "Session";
      if (status) status.innerHTML =
        phase === "before" ? "<b>Doors at 4 PM on Thursday.</b> Stay as long as you want. <span lang=\"es\">Entre y salga cuando guste.</span>"
        : phase === "live" ? "<b>Happening now at Shipwreck Studios.</b> Come by and ask what he just did. <span lang=\"es\">Pase y pregunte.</span>"
        : "<b>Vol. #001 is done.</b> Thanks to everyone who came by. Follow MEKA on Instagram for the next one.";
      if (phase === "after" && short) short.innerHTML = "<b>Vol. #001 has wrapped.</b> Thanks for coming by.";
      if (scratch) scratch.textContent = phase === "before" ? "Empty project. Nothing here yet." : phase === "live" ? "Still empty" : "";
    }
    if (scratch) scratch.hidden = p > 0.82;
    qs.forEach((q, i) => q.toggleAttribute("data-future", Q_AT[i % Q_AT.length] / 100 > p));
  };
  tick();
  if (fixed === null) {
    // one shared 1 Hz ticker, aligned to the second; parked while the tab is hidden
    let id = 0;
    const loop = () => { tick(); id = window.setTimeout(loop, 1000 - (Date.now() % 1000) + 5); };
    loop();
    document.addEventListener("visibilitychange", () => { clearTimeout(id); if (!document.hidden) loop(); });
  }
}
