/**
 * Two players: the reel (4:5 promo with the song) and the monitor (session clips, swapped by the pinned story).
 * Both: muted autoplay only while on screen, never before they are near the viewport, never under reduced motion.
 * Sound is opt-in with a visible control, and only one of them is ever unmuted.
 */
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

type Player = {
  video: HTMLVideoElement;
  playBtn: HTMLButtonElement;
  soundBtn: HTMLButtonElement;
  label: string;
  userPaused: boolean;
  visible: boolean;
  ensureSrc: () => void;
};
const players: Player[] = [];

function icon(btn: HTMLButtonElement, id: string) {
  btn.querySelector("use")?.setAttribute("href", "#" + id);
}

function syncPlay(p: Player) {
  const playing = !p.video.paused;
  icon(p.playBtn, playing ? "i-pause" : "i-play");
  p.playBtn.setAttribute("aria-label", (playing ? "Pause " : "Play ") + p.label);
}

function syncSound(p: Player) {
  const on = !p.video.muted;
  icon(p.soundBtn, on ? "i-sound" : "i-mute");
  p.soundBtn.setAttribute("aria-pressed", String(on));
  const span = p.soundBtn.querySelector("span");
  if (span) span.textContent = on ? "Sound on" : "Sound off";
  if (!span) p.soundBtn.setAttribute("aria-label", on ? "Mute" : "Unmute");
}

function tryPlay(p: Player) {
  p.ensureSrc();
  p.video.play().catch(() => syncPlay(p));
}

function update(p: Player) {
  const want = p.visible && !p.userPaused && (!reduced.matches || !p.video.muted);
  if (want && p.video.paused) tryPlay(p);
  if (!want && !p.video.paused) p.video.pause();
}

function wire(p: Player) {
  players.push(p);
  p.video.addEventListener("play", () => syncPlay(p));
  p.video.addEventListener("pause", () => syncPlay(p));
  p.playBtn.addEventListener("click", () => {
    if (p.video.paused) { p.userPaused = false; tryPlay(p); } else { p.userPaused = true; p.video.pause(); }
  });
  p.soundBtn.addEventListener("click", () => {
    const turnOn = p.video.muted;
    if (turnOn) players.forEach((o) => { if (o !== p) { o.video.muted = true; syncSound(o); } });
    p.video.muted = !turnOn;
    if (turnOn) { p.userPaused = false; tryPlay(p); }
    syncSound(p);
  });
  // load near the viewport, play only while really on screen
  new IntersectionObserver(([e]) => { if (e.isIntersecting) p.ensureSrc(); }, { rootMargin: "900px 0px" }).observe(p.video);
  new IntersectionObserver(([e]) => { p.visible = e.isIntersecting; update(p); }, { threshold: 0.35 }).observe(p.video);
  document.addEventListener("visibilitychange", () => { if (document.hidden) p.video.pause(); else update(p); });
  syncPlay(p);
  syncSound(p);
}

export function initReel() {
  const video = document.querySelector<HTMLVideoElement>("[data-reel]");
  const playBtn = document.querySelector<HTMLButtonElement>("[data-reel-play]");
  const soundBtn = document.querySelector<HTMLButtonElement>("[data-reel-sound]");
  if (!video || !playBtn || !soundBtn) return;
  const source = video.querySelector<HTMLSourceElement>("source[data-src]");
  wire({
    video, playBtn, soundBtn, label: "reel", userPaused: false, visible: false,
    ensureSrc() {
      if (source && !source.src) { source.src = source.dataset.src!; video.load(); }
    },
  });
}

/** The monitor: returns a function the pinned story calls to switch clips. */
export function initMonitor() {
  const video = document.querySelector<HTMLVideoElement>("[data-monitor]");
  const playBtn = document.querySelector<HTMLButtonElement>("[data-mon-play]");
  const soundBtn = document.querySelector<HTMLButtonElement>("[data-mon-sound]");
  if (!video || !playBtn || !soundBtn) return () => {};
  let clip = "acid2";
  const p: Player = {
    video, playBtn, soundBtn, label: "clip", userPaused: false, visible: false,
    ensureSrc() { if (!video.getAttribute("src")) video.src = `/media/${clip}.mp4`; },
  };
  wire(p);

  return (next: string) => {
    if (next === clip) return;
    clip = next;
    video.poster = `/media/${next}.webp`;
    if (!video.getAttribute("src") && !p.visible) return; // not loaded yet: just remember it
    video.dataset.swapping = "";
    video.src = `/media/${next}.mp4`;
    const done = () => { delete video.dataset.swapping; };
    video.addEventListener("loadeddata", done, { once: true });
    setTimeout(done, 900);
    update(p);
    if (p.visible && !p.userPaused && (!reduced.matches || !video.muted)) tryPlay(p);
  };
}
