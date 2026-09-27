# Open Mic → REAPER Timeline

Status: implemented on `feat/reaper-timeline`; not deployed and not migrated in production.

## Purpose

The host console records an append-only, event-scoped timeline while the show runs. The same durable cues support human review, archival exports, and a deterministic REAPER import workflow without exposing performer contact details.

## Time model

- `client_occurred_at` is the operator-device UTC timestamp.
- `server_received_at` records receipt at Supabase.
- `sequence_number` is allocated under an event-row lock and is the canonical event order.
- `recording_relative_ms` is derived from the selected recording session anchor.
- Performer and song labels are snapshots so an export remains useful after a profile or entry changes.
- Corrections append `cue_corrected`; prior cues are never rewritten.

## Vocabulary

Recording: `recording_started`, `recording_stopped`, `recording_resynced`.

Show progression: `performer_started`, `song_started`, `song_ended`, `performer_ended`.

Intervals: start/end pairs for `changeover`, `host_mc`, `technical_delay`, `intermission`, and `unplanned_gap`.

Editorial: `highlight`, `audio_issue`, `do_not_publish_started`, `do_not_publish_ended`, and `cue_corrected`.

## Export contract

The host downloads three files:

1. `*_event-timeline.json` — canonical versioned interchange file.
2. `*_event-timeline.csv` — full human-readable cue ledger.
3. `*_reaper-regions.csv` — convenience song regions and diagnostic markers.

Exports contain stage-name snapshots and stable entry/song identifiers. They intentionally omit real names, phone numbers, and email addresses. A synthetic fixture is in `fixtures/reaper/nelsons-2026-09-27/`.

## Reliability and safety

- Client cue UUIDs make retries idempotent.
- Event-row locking makes server sequence allocation deterministic.
- Recording start refuses a second active session for the event.
- Recording stop closes both the session and runtime pointer.
- RLS and RPC role checks restrict timeline reads/writes to active hosts and cohosts.
- All queue, signup, host, edit, and display reads added in this branch are scoped by event.
- Mock mode persists its isolated timeline in browser storage and does not initialize the production client.

## Known follow-ups before live activation

1. Apply the migration only after review against a disposable Supabase branch/project and run role/RLS checks there.
2. Execute the new atomic-transition migration in a disposable Supabase lab and complete the role/isolation/rollback matrix. The SQL and Host Console integration are implemented but have not been executed because no safe database target or running local Docker engine was available.
3. Physically interrupt venue networking and restart the browser to validate the IndexedDB outbox beyond its persistence/replay unit tests. Recording-session creation remains intentionally online-only so downstream cues always have a durable recording anchor.
4. Promote the verified local JSON-to-RPP adapter into the shared workflow and repeat the check against a copied real multitrack session. The synthetic fixture has already passed the initial importer verification described below.
5. Complete phone/tablet, 200% zoom, reduced-motion, and physical-event-tablet review. Desktop mock interaction and keyboard-visible semantics have passed an initial rendered check.

## Activation sequence

1. Review and merge the branch.
2. Create a disposable Supabase environment and apply `20260927010000_reaper_timeline.sql`.
3. Run the app in explicit sandbox mode; verify host/cohost success and anon/non-member denial.
4. Import the fixture into a copied REAPER project and compare every marker/region time.
5. Complete the disposable-database and physical offline/device follow-ups above.
6. Obtain a separate production go/no-go for migration and deployment.

Rollback SQL is provided beside the migration. It is not an authorization to run it in production.

## Recording-side integration evidence — 2026-09-27

The companion recording workflow imported `fixtures/reaper/nelsons-2026-09-27/event-timeline.json` through its local JSON-to-RPP adapter:

- 8 cues read
- 6 logical entries produced
- 8 REAPER marker/region lines written
- 0 warnings
- Recording start/stop, performer start, song region, highlight, and changeover region matched the expected positions
- The importer wrote only a project copy, preserved the source hash, and replaced only its own prior `[OMQ]` entries on re-import
- Four importer unit tests passed, including append-only cue-correction handling

This proves the synthetic interchange fixture and recording-side adapter agree. It does not authorize a production migration or replace verification against a copied real recording session.

## Pre-production implementation evidence — 2026-09-27

- `20260927020000_atomic_show_transitions.sql` adds event-locked SECURITY DEFINER transitions for performer start/advance, song start/end, gap replacement/closure, and append-only undo restoration. Recording stop remains atomic in the preceding RPC.
- The production Host Console calls those RPCs; mock mode retains its isolated adapter.
- Failed transport requests for cues, transitions, and undo operations are stored in IndexedDB with stable IDs and replayed in original order. Authorization, validation, and other non-network errors are not queued.
- The interface distinguishes Saving, Pending sync, Synced, and Sync error.
- Eight unit tests pass, including outbox reconstruction/replay, duplicate prevention, and failure retention.
- A 1280×720 mock-isolated rendered workflow passed: recording start, song change, highlight, next performer, append-only undo, and recording stop produced eight cues and restored the show state without browser errors.
- Disposable Supabase execution is blocked locally: the Supabase CLI is absent and Docker Desktop's engine is not running. No database was started and no remote project was touched.
