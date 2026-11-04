/**
 * The one place to change site-wide links and the event clock.
 * Every `{{KEY}}` in index.html / rsvp/index.html is replaced with these values at dev and build time,
 * and the scripts import them directly.
 */
export const SITE = {
  /** Where every "RSVP" button goes.
   *  TODO: point this at the RSVP system (ticketFoo) once it is deployed, e.g. "https://rsvp.from-scratch.art".
   *  While it is "/rsvp", the placeholder page in rsvp/index.html is served. */
  RSVP_URL: "https://rsvp.from-scratch.art/e/from-scratch-001-meka",   // FROM SCRATCH store on ticketFoo (custom domain, 11-04)
  /** The series' Instagram (@frm_scrtch_), used for "want the hot seat?", the RSVP placeholder and the footer. */
  INSTAGRAM_URL: "https://www.instagram.com/frm_scrtch_/",
  SITE_URL: "https://from-scratch.art",
  MAPS_URL: "https://www.google.com/maps/search/?api=1&query=Shipwreck+Studios+202+Calle+San+Agust%C3%ADn+San+Juan+PR+00901",
  /** Vol. #001: Thu Nov 5 2026, 4-10 PM Atlantic Standard Time (UTC-4, Puerto Rico has no DST). */
  EVENT_START: "2026-11-05T16:00:00-04:00",
  EVENT_END: "2026-11-05T22:00:00-04:00",
} as const;

export type SiteKey = keyof typeof SITE;
