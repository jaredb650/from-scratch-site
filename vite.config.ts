import { defineConfig } from "vite";
import { resolve } from "node:path";
import { SITE } from "./site.config";
import { renderVolumes } from "./volumes.config";

// Render the volumes index from volumes.config.ts, then replace {{RSVP_URL}} etc. with the values from site.config.ts.
const siteTokens = () => ({
  name: "site-tokens",
  transformIndexHtml(html: string) {
    return html.replace("<!--VOLUMES-->", renderVolumes()).replace(/\{\{(\w+)\}\}/g, (m, k: string) => (k in SITE ? String(SITE[k as keyof typeof SITE]) : m));
  },
});

export default defineConfig({
  plugins: [siteTokens()],
  build: {
    target: "es2020",
    cssMinify: "lightningcss",
    assetsInlineLimit: 0,
    rollupOptions: {
      input: { main: resolve(__dirname, "index.html"), rsvp: resolve(__dirname, "rsvp/index.html") },
    },
  },
});
