import "./styles/main.css";
import { initBezels } from "./modules/bezel";
import { initClock } from "./modules/clock";
import { initMonitor, initReel } from "./modules/media";
import { initEntrances, initScroll } from "./modules/motion";
import { initFit, initLoupe, initMenu } from "./modules/ui";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

initMenu();
initClock();
initBezels(!reduced);
initEntrances();
const switchClip = initMonitor();
initScroll((clip) => switchClip(clip));
initReel();
initLoupe();
initFit();
