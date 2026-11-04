/**
 * The motion layer, no library: entrances (IntersectionObserver), one rAF scroll loop for the
 * scroll-linked pieces (hero split, question rows drift, mech parallax, pinned story, floating RSVP).
 * Transform/opacity only. Reduced motion keeps the content and drops the travel.
 */
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function initEntrances() {
  const hero = document.querySelector<HTMLElement>(".hero");
  const fontsReady = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 250))]);
  fontsReady.then(() => requestAnimationFrame(() => {
    if (hero) hero.dataset.in = "";
    const logo = document.querySelector<HTMLElement>(".hero__logo");
    if (logo && !reduced) setTimeout(() => (logo.dataset.sweep = ""), 1100);
  }));

  const items = Array.from(document.querySelectorAll<HTMLElement>("[data-rise]"));
  if (reduced) { items.forEach((el) => (el.dataset.in = "")); return; }
  const io = new IntersectionObserver((entries) => {
    const entering = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
    entering.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    entering.forEach((el, i) => {
      el.style.setProperty("--d", `${i * 80}ms`);
      el.dataset.in = "";
      io.unobserve(el);
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
  items.forEach((el) => io.observe(el));

  // the chrome FS sweeps once when it arrives, and again on hover
  document.querySelectorAll<HTMLElement>(".chrome--sweep").forEach((el) => {
    const sweep = () => { delete el.dataset.sweep; void el.offsetWidth; el.dataset.sweep = ""; };
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { setTimeout(sweep, 500); o.disconnect(); } }, { threshold: 0.6 }).observe(el);
    el.addEventListener("pointerenter", (e) => { if ((e as PointerEvent).pointerType === "mouse") sweep(); });
  });
  const heroLogo = document.querySelector<HTMLElement>(".hero__logo");
  heroLogo?.closest(".hero")?.addEventListener("pointermove", (() => {
    let last = 0;
    return (e: Event) => {
      if ((e as PointerEvent).pointerType !== "mouse" || performance.now() - last < 4000) return;
      const r = heroLogo.getBoundingClientRect(), pe = e as PointerEvent;
      if (pe.clientX > r.left && pe.clientX < r.right && pe.clientY > r.top && pe.clientY < r.bottom) {
        last = performance.now();
        delete heroLogo.dataset.sweep; void heroLogo.offsetWidth; heroLogo.dataset.sweep = "";
      }
    };
  })());
}

export function initScroll(onStep: (clip: string, i: number) => void) {
  const hero = document.querySelector<HTMLElement>(".hero");
  const from = document.querySelector<HTMLElement>(".hero__from");
  const scratch = document.querySelector<HTMLElement>(".hero__scratch");
  // the chrome FS sinks back as the name splits (it took the mech's place when the hero became the series)
  const mech = document.querySelector<HTMLElement>(".hero__logo");
  const tribal = document.querySelector<HTMLElement>(".hero__tribal");
  const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-drift]"));
  const asks = document.querySelector<HTMLElement>(".asks");
  const mekaArt = document.querySelector<HTMLElement>(".meka__art");
  const steps = Array.from(document.querySelectorAll<HTMLElement>(".step"));
  const segs = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-seg]"));
  const name = document.querySelector<HTMLElement>("[data-mon-name]");
  const nameEs = document.querySelector<HTMLElement>("[data-mon-name-es]");
  const bpm = document.querySelector<HTMLElement>("[data-mon-bpm]");
  const fcta = document.querySelector<HTMLElement>("[data-fcta]");
  const hideCta = [document.querySelector("#visit .rows"), document.querySelector(".foot"), document.querySelector(".get__foot"), document.querySelector(".devices__title .btn"), document.querySelector(".vol__rsvp"), document.querySelector(".vols"), document.querySelector(".vol__intro"), document.querySelector(".arr")].filter(Boolean) as Element[];
  const desktop = matchMedia("(min-width: 900px)");

  let active = -1;
  const setStep = (i: number) => {
    if (i === active || !steps[i]) return;
    active = i;
    steps.forEach((s, k) => s.toggleAttribute("data-active", k === i));
    segs.forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
    const s = steps[i];
    if (name) name.textContent = s.dataset.name || "";
    if (nameEs) nameEs.textContent = s.dataset.nameEs || "";
    if (bpm) bpm.textContent = s.dataset.bpm || "";
    onStep(s.dataset.clip || "acid2", i);
  };
  segs.forEach((b, k) => b.addEventListener("click", () => {
    const s = steps[k];
    const r = s.getBoundingClientRect();
    // desktop: bring the step's centre to mid-screen; phone: its top just under the sticky monitor
    const top = desktop.matches ? r.top + scrollY + r.height / 2 - innerHeight * 0.5 : r.top + scrollY - innerHeight * 0.5;
    scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
    setStep(k);
  }));

  let ticking = false;
  const frame = () => {
    ticking = false;
    const vh = innerHeight;

    // pinned story. Desktop steps centre their text in a tall box, so switch when the centre passes 60%;
    // phone steps are top-aligned under the sticky monitor, so switch when the top passes 60%.
    let next = 0;
    steps.forEach((s, k) => { const r = s.getBoundingClientRect(); if ((desktop.matches ? r.top + r.height / 2 : r.top) < vh * 0.6) next = k; });
    setStep(next);

    // floating RSVP: after the hero, out of the way of the other RSVP buttons
    if (fcta && hero) {
      const past = hero.getBoundingClientRect().bottom < 0;
      const blocked = hideCta.some((el) => { const r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0; });
      const show = past && !blocked;
      if (show !== fcta.hasAttribute("data-show")) {
        fcta.toggleAttribute("data-show", show);
        fcta.tabIndex = show ? 0 : -1;
        fcta.setAttribute("aria-hidden", String(!show));
      }
    }

    if (reduced) return;

    // hero: the name splits apart, the mech sinks back
    if (hero) {
      const r = hero.getBoundingClientRect();
      if (r.bottom > 0) {
        const p = clamp(-r.top / r.height);
        const d = desktop.matches ? 22 : 14;
        if (from) from.style.transform = `translate3d(${(-p * d).toFixed(2)}vw,0,0)`;
        if (scratch) scratch.style.transform = `translate3d(${(p * d).toFixed(2)}vw,0,0)`;
        if (mech) mech.style.transform = `translate3d(0,${(p * 90).toFixed(1)}px,0) scale(${(1 + p * 0.07).toFixed(4)})`;
        if (tribal) tribal.style.transform = `translate3d(0,${(p * 160).toFixed(1)}px,0) rotate(${(p * 4).toFixed(2)}deg)`;
      }
    }

    // the questions drift in opposite directions
    if (asks) {
      const r = asks.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const p = (vh - r.top) / (vh + r.height);
        rows.forEach((row) => { row.style.transform = `translate3d(${(Number(row.dataset.drift) * (p - 0.5) * 22).toFixed(2)}vw,0,0)`; });
      }
    }

    if (mekaArt) {
      const r = mekaArt.parentElement!.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const p = (vh - r.top) / (vh + r.height) - 0.5;
        mekaArt.style.transform = `translate3d(0,${(p * -120).toFixed(1)}px,0)`;
      }
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  frame();
}
