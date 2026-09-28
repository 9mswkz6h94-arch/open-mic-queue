# Design Handoff — Open Mic Queue

**Project:** `proj-002`  
**Design-system version:** `0.8.0`  
**Current phase:** Spotlight identity application  
**Target identity:** Spotlight  
**Last updated:** 2026-09-27

## Read first

1. `../rainbowheart-os/START_HERE.md`
2. `DESIGN_PROFILE.json`
3. `SCAFFOLD_REVIEW.md`
4. `../rainbowheart-os/SCAFFOLD_STYLE_GUIDE.md`
5. This handoff
6. `docs/TABLET_SIGNUP_EXPERIENCE.md`
7. `docs/BAR_VENUE_VISUAL_REDESIGN.md`
8. The current source and working tree

The shared visual-identity rules now live in Rainbow Heart OS. The older `docs/VISUAL_IDENTITY_SYSTEM.md` captures the Open Mic conversation that seeded the shared system and should not supersede it.

## Completed

0.3. Repaired the Spotlight venue display and public queue at their two critical presentation sizes. The 1920×1080 and 1366×668 TV compositions now keep the complete event title, performer/photo field, queue QR, support controls, and Up Next ticker inside the viewport. The 390×844 public queue now constrains the mock-review banner, navigation grid, hero, and queue surfaces without horizontal clipping while preserving 48 px controls and the Spotlight hierarchy. Production remains undeployed.

0.4. Reflowed each desktop Host Console queue entry into a dedicated performer-information row and a separate three-column action grid. Matching stage and real names no longer render twice, song titles retain readable line height, and Edit, Make Featured, Start, Done, and Delete remain full-size labeled controls without compressing the artist information.

0.2. Extended Spotlight from the venue display to the entire application through `src/themes/spotlight.css`, loaded after Scaffold so structure remains authoritative. Public queue, signup, artist entry, account access, Host Console, queue states, forms, messages, and timeline surfaces now share the accepted local fonts, room palette, purpose-color mapping, square/2px geometry, explicit focus, and non-color state edges. Local mock-isolated rendered review covered the public queue, signup, artist-entry empty state, and Host Console. Production remains undeployed.

0.1. Jonathan explicitly authorized the Spotlight identity pass after the September live-event field report. The venue display now uses the accepted Spotlight Focus expression, locally bundled Instrument Sans/Serif and Space Mono, the canonical room palette, one bounded orange-yellow performer reveal, an unobstructed known subject, a serif witness line, and a violet labeled Up Next edge. Structural TV collision repairs remain intact. This does not authorize production deployment.

0. On the isolated `feat/reaper-timeline` branch, added an event-scoped, append-only recording timeline, host recording/marker/gap controls, privacy-limited JSON/CSV/REAPER exports, deterministic mock persistence, a synthetic Nelson's fixture, and migration/rollback files. No production migration or deployment was performed. See `docs/REAPER_TIMELINE_ARCHITECTURE.md`.

1. Added Jonathan's email to the local admin allowlist.
2. Created a neutral Scaffold theme in `src/themes/scaffold.css`.
3. Replaced major functional emoji and ambiguous icon-only admin actions with text labels.
4. Reworked public queue hierarchy using structural numbering and exposed borders.
5. Reworked the signed-in navigation for phone and tablet widths.
6. Reworked signup and host-console surfaces in Scaffold.
7. Moved the production-wide test reset out of the primary toolbar into collapsed development tools.
8. Created tablet-signup and Prism design specifications.
9. Connected the app to Rainbow Heart OS with this profile and handoff.
10. Added a mock-isolated Supabase-compatible adapter with default, empty, delayed-loading, error, and long-content fixtures.
11. Made mock isolation the local-development default and added an explicit environment banner and fixture selector.
12. Added recoverable public-queue error and empty states.
13. Replaced undersized emoji-only social controls with labeled 48 px text controls.
14. Programmatically associated form labels with signup, login, and edit controls.
15. Corrected legacy color leakage that made On Deck text white-on-white and made Performed cards appear as a different color.
16. Completed a full Scaffold craft audit across the public queue, signup, and host console: typography, structural numbering, counts, card proportions, social chips, container treatments, wrapping, and responsive navigation now use one coherent system.
17. Replaced the retired radio-show consent language with active Open Mic promotional-use consent while preserving database compatibility.
18. Rebuilt the Performed cards with the same badge scale, title hierarchy, spacing, border system, and social chips as the rest of the queue while retaining a semantic completed-state edge.
19. Corrected an over-normalized craft pass: Queue positions again carry strong black number tiles, On Deck retains outlined sequencing, completed cards say `Performed`, and social destinations read as underlined `Visit [platform]` links instead of cramped boxed tags.
20. Applied the first full Couture DIY 95 reference treatment: controlled three-role typography, editorial masthead proportions, stronger tailoring rules, visible construction edges, direct utility controls, and responsive composition across Queue, Signup, and Host Console.
21. Tested and accepted the Couture DIY 95 type and neutral-color system: locally bundled IBM Plex Sans, Sans Condensed, and Mono; a major-third type scale; the paper/canvas/ink palette; and regular/semibold-only weight discipline.
22. Applied the accepted treatment across performer registration, account access, entry editing, loading and feedback states, and the Host Console. Removed remaining rounded legacy treatments from current/completed host records and aligned section headings, supporting copy, images, and semantic messages with the canonical grammar.
23. Removed the last legacy typography overrides: every visible text element now resolves to one of the three canonical IBM Plex roles, all synthetic 700-weight rendering is eliminated, and small measurement/link text is restored to the documented 12px or 14px steps. The `Performed` label now uses ink text and an ink border; completion green is limited to the card's narrow semantic edge.
24. Corrected the live typography entry point: `src/index.jsx` now imports the locally packaged IBM Plex Sans, Sans Condensed, and Mono styles used by the app, the obsolete Google-hosted OpenDyslexic request is removed, legacy 500/700 weights now use the accepted 400/600 discipline, and the remaining 11px timestamp plus one-off fixed text sizes now use the canonical scale.
25. Replaced the clickable navigation `h1` with a real keyboard-operable home button and added `aria-current="page"` to the active navigation control.
26. Removed the internal `Couture DIY 95` shorthand from the guest-facing wordmark and replaced it with the functional descriptor `Live running order`; the canonical phrase remains in Rainbow Heart OS rather than becoming an accidental public brand.
27. Preserved the four-step structural sequence when no general queue remains by rendering an explicit `03 Queue / 00` empty state instead of jumping visually from On Deck to Performed.
28. Normalized public and host-console counts to zero-padded measurement formatting and converted the performer-access account switch into a full-size, visibly focused text action.

## Evidence collected

- Mock-isolated renders using the public `tonight-show` fixture passed at 1920×1080 and the venue reference size of 1366×668. The full event title, Brother Jon photo, two fallback song labels, primary queue QR, both support QR controls, and scrolling Up Next region stayed within the 16:9 viewport.
- A true 390×844-equivalent phone render passed without horizontal clipping after constraining the environment banner, two-column navigation controls, hero, and root surfaces. Brother Jon's current-performer card remained next in the reading order after the event introduction.
- Seventeen automated tests passed and the production Vite build completed with 113 modules after the responsive repair.
- The crowded Host Console queue entry reported during rendered review was rechecked at 1524×1252. Performer identity and songs remained in an uncluttered top row, five actions rendered below in a three-column grid, and eighteen automated tests plus the production build passed.
- The companion recording workflow imported the checked-in Nelson's JSON fixture into a project copy with 8 cues, 6 logical entries, 8 REAPER marker/region lines, zero warnings, preserved source hashing, idempotent `[OMQ]` replacement, and four passing importer tests. This is synthetic integration evidence, not production activation approval.

- Production build completed successfully with Vite on 2026-08-09.
- Public queue was visually inspected at desktop width.
- Signup was visually inspected at 1024×768 and 768×1024.
- Host console was visually inspected at 768×1024.
- No production queue records were changed during design inspection.
- Netlify was not deployed.
- Mock default, empty, and error fixtures were verified in the local browser.
- The production build completed after the mock adapter was added.
- Long-content rendering, horizontal overflow, and rendered touch targets passed at all four reference viewports.
- Safe mock signup and host queue-advance workflows completed successfully.
- The accepted typography and palette produced no horizontal overflow or undersized interactive targets at 390×844, 768×1024, 1024×768, or 1440×900.
- The long-content fixture produced no horizontal overflow at phone width after the font change.
- Computed styles confirmed IBM Plex Sans for interface copy, IBM Plex Sans Condensed for display, and IBM Plex Mono for measurement roles.
- Signup and Host Console remained free of horizontal overflow after the full treatment at all four reference widths. The four 24px checkbox controls remain nested inside full-width labels measuring at least 52px high, so their complete labeled rows are the interactive targets.
- A source-wide typography audit found no remaining external font request or 500/700+ application declaration. The production build completed successfully on 2026-08-09 and emitted IBM Plex Sans, IBM Plex Sans Condensed, and IBM Plex Mono as local font assets.
- The refined navigation, explicit zero-count queue state, and normalized measurement counts rendered in mock-isolated mode. The long-content fixture produced no horizontal page overflow and no visible interactive target below 48×48 at 390×844, 768×1024, 1024×768, or 1440×900.
- The active Queue control exposes `aria-current="page"`, the wordmark is a native button, and the production build completed successfully after the refinement.
- Rainbow Heart OS `0.1.3` validation passed against the connected Open Mic app after the refinement.

These are static-review observations, not completed workflow approval. The authoritative gate status and missing evidence are recorded in `SCAFFOLD_REVIEW.md`.

## Known issues

- Atomic show-transition RPCs and a durable IndexedDB retry outbox are implemented on the isolated timeline branch. They still require disposable-Supabase execution and physical network-interruption/browser-restart evidence before production activation. The migrations remain intentionally unapplied.

- The existing signup is still one long form; the six-screen tablet kiosk flow is specified but not implemented.
- Guest-facing radio-show consent has been replaced with Open Mic social-media, event-promotion, and future-show promotional consent. Its value temporarily maps to the legacy `radio_featured_confirmed` column until a separately approved migration renames it.
- Production-connected inspection remains available through the explicit local `?dataMode=production` switch and is static-only.
- Accessibility menu code exists but is not mounted, and legacy styles remain beneath the Scaffold override.
- Loading can remain indefinite when Supabase is unavailable.
- Admin authorization is still a frontend email allowlist rather than membership-based roles.
- Queue mutations are not transactional and several failures can be silent.
- Automated accessibility and responsive checks do not yet exist.
- Scaffold has been visually inspected but not approved on the physical event tablet.

## Safe boundaries

The default local review mode is `mock-isolated`. Its queue, auth, and mutations remain in named browser-local fixtures and may be safely operated or reset. The production site retains its existing Supabase behavior. If local production-connected inspection is explicitly selected with `?dataMode=production`, do not submit forms, change queue state, reset data, or exercise any mutation path. Follow `../rainbowheart-os/SAFE_REVIEW_PROTOCOL.md`.

| Safe to change during Scaffold review | Do not change without explicit approval |
|---|---|
| Layout, semantic labels, responsive behavior, focus, recovery states, local documentation | Netlify production, Supabase schema, production performers, credentials, destructive cleanup, unrelated user files |

The uncommitted strategy and validation documents belong to existing work and must be preserved.

## Decisions affecting this app

- `../rainbowheart-os/decisions/0001-vendor-neutral-source-of-truth.md`
- `../rainbowheart-os/decisions/0002-scaffold-first.md`
- `../rainbowheart-os/decisions/0003-three-identities.md`
- `../rainbowheart-os/decisions/0004-safe-review-evidence.md`
- `../rainbowheart-os/decisions/0005-scaffold-component-grammar.md`
- `../rainbowheart-os/decisions/0006-couture-diy-95.md`
- `../rainbowheart-os/decisions/0007-couture-diy-95-type-and-color.md`
- `docs/TABLET_SIGNUP_EXPERIENCE.md`
- `docs/BAR_VENUE_VISUAL_REDESIGN.md`

## One next action

Complete responsive and workflow review of Spotlight across phone, tablet, desktop, 200% zoom, and reduced motion; then make dead-space, MC-talk, and host-note controls more conspicuous without changing production data.
