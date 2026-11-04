import "./styles/main.css";
import { initBezels } from "./modules/bezel";

initBezels(!matchMedia("(prefers-reduced-motion: reduce)").matches);
