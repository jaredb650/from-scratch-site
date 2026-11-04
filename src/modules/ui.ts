/** Small pieces: phone menu, device loupe, footer wordmark fit. */

export function initMenu() {
  const obi = document.querySelector<HTMLElement>(".obi");
  const btn = document.querySelector<HTMLButtonElement>(".obi__menu");
  const sheet = document.getElementById("sheet");
  if (!obi || !btn || !sheet) return;
  const set = (open: boolean) => {
    obi.toggleAttribute("data-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.querySelector("use")?.setAttribute("href", open ? "#i-close" : "#i-menu");
    btn.querySelector(".vh")!.textContent = open ? "Close menu" : "Menu";
  };
  btn.addEventListener("click", () => set(!obi.hasAttribute("data-open")));
  sheet.addEventListener("click", (e) => { if ((e.target as Element).closest("a")) set(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && obi.hasAttribute("data-open")) { set(false); btn.focus(); } });
  document.addEventListener("pointerdown", (e) => { if (obi.hasAttribute("data-open") && !obi.contains(e.target as Node)) set(false); });
}

/** A 2.6x window into the 4x device render, for a mouse. Touch keeps native pinch zoom. */
export function initLoupe() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const K = 2.6;
  document.querySelectorAll<HTMLElement>("[data-loupe]").forEach((shot) => {
    const img = shot.querySelector("img");
    if (!img) return;
    const big = (img.getAttribute("srcset") || "").split(",").map((s) => s.trim().split(" ")[0]).pop() || img.src;
    const lens = document.createElement("div");
    lens.className = "loupe";
    lens.setAttribute("aria-hidden", "true");
    shot.appendChild(lens);
    let ready = false;
    shot.addEventListener("pointerenter", () => {
      if (!ready) { lens.style.backgroundImage = `url("${big}")`; ready = true; }
      shot.dataset.loupeOn = "";
    });
    shot.addEventListener("pointerleave", () => delete shot.dataset.loupeOn);
    shot.addEventListener("pointermove", (e) => {
      const r = shot.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const lw = lens.offsetWidth, lh = lens.offsetHeight;
      lens.style.left = Math.min(r.width - lw, Math.max(0, x - lw / 2)) + "px";
      lens.style.top = Math.min(r.height - lh, Math.max(0, y - lh / 2)) + "px";
      lens.style.backgroundSize = `${r.width * K}px ${r.height * K}px`;
      lens.style.backgroundPosition = `${-(x * K - lw / 2)}px ${-(y * K - lh / 2)}px`;
    });
  });
}

/** The footer wordmark runs exactly from margin to margin. */
export function initFit() {
  const mark = document.querySelector<HTMLElement>(".foot__mark");
  if (!mark) return;
  const fit = () => {
    const cs = getComputedStyle(mark);
    const avail = mark.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const spans = Array.from(mark.children) as HTMLElement[];
    mark.style.setProperty("--fit", "100px");
    const stacked = cs.flexDirection === "column";
    const natural = stacked
      ? Math.max(...spans.map((s) => s.scrollWidth))
      : spans.reduce((w, s) => w + s.scrollWidth, 0) + 25; // .25em gap at 100px
    mark.style.setProperty("--fit", `${Math.floor((100 * avail) / natural * 0.995)}px`);
  };
  document.fonts?.ready.then(fit);
  fit();
  new ResizeObserver(() => requestAnimationFrame(fit)).observe(document.documentElement);
}
