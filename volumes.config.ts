/**
 * The FROM SCRATCH volumes. The "Volumes" index on the home page is rendered from this list at dev and build time
 * (the <!--VOLUMES--> marker in index.html, see vite.config.ts). To add a volume, add an entry and rebuild.
 *
 * Only put confirmed facts here. A slot with status "tba" renders as "Next volume: to be announced".
 */
export type Volume = {
  /** "001", "002", ... Leave empty for a "tba" slot. */
  num: string;
  /** "next" = the featured upcoming volume, "past" = done, "tba" = next slot not announced yet. */
  status: "next" | "past" | "tba";
  host?: string;
  /** English and Spanish date lines, e.g. "Thu Nov 5, 2026" / "Jue 5 de noviembre de 2026". */
  date?: string;
  dateEs?: string;
  time?: string;
  venue?: string;
  city?: string;
  style?: string;
  software?: string;
  /** Where "See the details" goes: an anchor on this page now, maybe "/vol/001" later. */
  href?: string;
  /** Show the RSVP button (goes to SITE.RSVP_URL). Only for the volume that RSVP_URL actually belongs to. */
  rsvp?: boolean;
};

export const VOLUMES: Volume[] = [
  {
    num: "001",
    status: "next",
    host: "MEKA",
    date: "Thu Nov 5, 2026",
    dateEs: "Jueves 5 de noviembre de 2026",
    time: "4-10 PM",
    venue: "Shipwreck Studios",
    city: "San Juan",
    style: "Hard trance",
    software: "Ableton Live 12",
    href: "#vol-001",
    rsvp: true,
  },
  { num: "", status: "tba" },
];

const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const STATUS: Record<Volume["status"], [string, string]> = {
  next: ["Next session", "Próxima sesión"],
  past: ["Past session", "Sesión pasada"],
  tba: ["Next volume", "Próximo volumen"],
};

function card(v: Volume): string {
  const [en, es] = STATUS[v.status];
  if (v.status === "tba") {
    return `<li class="vols__item vols__item--tba" data-rise>
  <p class="vols__status"><i class="dash"></i>${en} <span lang="es">${es}</span></p>
  <p class="vols__num vols__num--tba" aria-hidden="true">#???</p>
  <h3 class="vols__title">To be announced <span lang="es">Por anunciarse</span></h3>
  <p class="vols__text">Could be your session. <span lang="es">Podría ser su sesión.</span></p>
  <a class="link" href="#hot-seat">Host a session <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>
</li>`;
  }
  const facts = [
    v.date && v.time ? `<div><dt>When <span lang="es">Cuándo</span></dt><dd>${esc(v.date)}, ${esc(v.time)}${v.dateEs ? ` <span lang="es">${esc(v.dateEs)}</span>` : ""}</dd></div>` : "",
    v.venue ? `<div><dt>Where <span lang="es">Dónde</span></dt><dd>${esc(v.venue)}${v.city ? `, ${esc(v.city)}` : ""}</dd></div>` : "",
    v.style || v.software ? `<div><dt>Session <span lang="es">Sesión</span></dt><dd>${[v.style, v.software].filter(Boolean).map((x) => esc(x)).join(", ")}</dd></div>` : "",
  ].join("");
  return `<li class="vols__item vols__item--${v.status}" data-rise>
  <p class="vols__status"><i class="dash"></i>${en} <span lang="es">${es}</span></p>
  <p class="vols__num" aria-hidden="true">#${esc(v.num)}</p>
  <h3 class="vols__title">Vol. #${esc(v.num)}${v.host ? `: ${esc(v.host)}` : ""}</h3>
  <dl class="vols__facts">${facts}</dl>
  <div class="vols__actions">
    ${v.rsvp ? `<a class="btn btn--red" href="{{RSVP_URL}}">RSVP <span class="btn__sub" lang="es">Confirme</span></a>` : ""}
    ${v.href ? `<a class="link" href="${esc(v.href)}">The details <svg class="ico" aria-hidden="true"><use href="#i-down"/></svg></a>` : ""}
  </div>
</li>`;
}

export function renderVolumes(): string {
  return `<ol class="vols" aria-label="Volumes">\n${VOLUMES.map(card).join("\n")}\n</ol>`;
}
