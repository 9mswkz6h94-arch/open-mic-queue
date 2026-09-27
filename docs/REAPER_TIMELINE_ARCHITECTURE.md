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
2. Make performer row transitions and their timeline cues one database transaction. This branch makes cue writes durable and ordered, but the existing performer updates remain separate requests.
3. Add an IndexedDB outbox for venue-network interruptions. Current retry IDs are safe, but unsent cues do not yet survive a browser crash.
4. Add a local REAPER importer or ReaScript against the checked-in JSON fixture and verify generated regions against a copied multitrack session.
5. Exercise the new controls in mock mode at the four reference viewports, keyboard-only, 200% zoom, reduced motion, and the physical event tablet.

## Activation sequence

1. Review and merge the branch.
2. Create a disposable Supabase environment and apply `20260927010000_reaper_timeline.sql`.
3. Run the app in explicit sandbox mode; verify host/cohost success and anon/non-member denial.
4. Import the fixture into a copied REAPER project and compare every marker/region time.
5. Complete the atomic transition and offline-outbox follow-ups above.
6. Obtain a separate production go/no-go for migration and deployment.

Rollback SQL is provided beside the migration. It is not an authorization to run it in production.
