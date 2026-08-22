# Open Mic Queue — Product Strategy

**Status:** Working draft  
**Created:** 2026-08-09  
**Current product:** <https://open-mic-queue.netlify.app>  
**Purpose:** Define the smallest commercially useful product that can grow from Rainbow Heart Studio's working Open Mic Queue.

## Product Thesis

Open Mic Queue can become a lightweight event-operating system for recurring open mics and small artist showcases.

The product should help a host run the event from performer signup through post-show follow-up without requiring performers to download an app or requiring the host to manage a spreadsheet during the show.

The commercial product is not simply a numbered list. Its useful workflow is:

```text
create event
→ accept performer signup
→ organize the running order
→ show now/on-deck status
→ record performance timestamps
→ preserve artist links and event history
→ export production data and follow up after the show
```

## Initial Customer

The first target customer is an independent host who runs at least one open mic or small showcase every month.

Likely early customer types:

- Bars, cafés, listening rooms, and breweries
- Community arts organizations
- Music stores and teaching studios
- Colleges, churches, libraries, and civic programs
- Songwriter circles and poetry/comedy hosts
- Small showcases and recurring community stages

Start with music-focused open mics. Other event types should be tested later rather than assumed.

## Core Problem

Recurring hosts commonly coordinate performers through paper lists, social messages, generic forms, or spreadsheets. Those methods do not naturally provide a live audience view, performer self-service, running-order changes, timestamp history, or a reusable artist directory.

Open Mic Queue should reduce the host's attention load during the event while improving the performer and audience experience.

## Positioning

> Open Mic Queue gives recurring hosts one simple place for artist signup, running order, now/on-deck display, timestamps, and post-show artist history.

Short form:

> Run the room, not the spreadsheet.

## Product Principles

1. **No performer app install.** Signup and self-editing work in a mobile browser.
2. **Fast under pressure.** The host can advance or reorder the queue with one hand during a live event.
3. **Accessible by default.** Keyboard navigation, screen-reader labels, high contrast, large touch targets, and a dyslexia-friendly option are core requirements.
4. **The host controls the room.** Performer self-service cannot override event rules or the running order.
5. **Collect the minimum data.** Do not gather information merely because it could be useful later.
6. **Artist-friendly.** Social links, stories, and media permissions remain transparent and optional.
7. **Works without production complexity.** Timestamp and export tools add value but do not make audio/video production mandatory.

## Product Scope

### Existing Foundation

- Performer signup
- Sequential queue positions
- Public live queue
- Host/admin controls
- Drag-and-drop ordering
- Start and completion timestamps in the application code
- CSV timestamp export
- Performer self-editing
- Artist/song/social fields

The production database migration for `started_at` and `completed_at` must be applied and smoke-tested before timestamping is considered reliable.

### Commercial MVP

The first version that outside hosts can pay for needs:

1. Host accounts and secure login
2. Organizations or venues
3. Multiple isolated events
4. Event-specific signup links
5. Event-specific public queue/display links
6. Host-configurable signup fields and rules
7. Start, complete, skip, restore, and reorder controls
8. Timestamp CSV export
9. Mobile and keyboard accessibility
10. Clear privacy, retention, and performer-consent language
11. Basic event branding: name, logo, colors, and host contact
12. Reliable event closeout and archive behavior

### Not Required for the Commercial MVP

- Native iOS or Android apps
- AI features
- Ticket sales
- Audio or video hosting
- A public social network
- Complex venue booking
- Automated clip creation
- Tips or payment splitting
- A white-label enterprise system
- General-purpose festival scheduling

These should not delay testing whether hosts will pay for the core workflow.

## Differentiation

The product must be more useful than a form plus spreadsheet. Its strongest possible differentiation is the combination of:

- Performer-friendly mobile signup
- Live now/on-deck audience display
- Fast host controls
- Artist profiles and social discovery
- Production-ready timestamps
- Recurring event and performer history
- Accessibility designed into the event experience

## Business Model Hypotheses

These prices are test hypotheses, not final decisions.

| Plan | Candidate price | Intended use |
|---|---:|---|
| Free | $0 | One upcoming event, basic queue, product branding |
| Event Pass | $12–20/event | Occasional showcase or one-time trial |
| Host | $19–29/month | One recurring series and one primary host |
| Venue | $49–79/month | Multiple series, staff accounts, branding, history |
| Community/Network | Custom later | Multiple venues or chapters after demand exists |

Annual plans should only be introduced after monthly retention is understood.

## Revenue Reality

Illustrative gross recurring revenue:

| Paying accounts | Average revenue/account | Monthly revenue |
|---:|---:|---:|
| 25 | $25 | $625 |
| 100 | $30 | $3,000 |
| 250 | $35 | $8,750 |
| 500 | $40 | $20,000 |

These figures exclude payment processing, hosting, support, taxes, refunds, and the labor required to acquire and retain customers.

Open Mic Queue is best treated first as a focused second income stream and commercial-learning platform. It should not be assumed to support two adults until retention and acquisition costs are demonstrated.

## Legal and Trust Review

Open Mic is comparatively straightforward, but not legally automatic. Before charging outside hosts, obtain appropriate professional review of:

- Terms of service
- Privacy policy
- Data retention and account deletion
- Performer consent for public profiles
- Consent for photos, stories, and social links
- Separate consent for recording, streaming, and media reuse
- Rules for minors and guardian consent
- Host responsibility for event safety and local compliance
- Copyright responsibility for performances, backing tracks, and streams
- Payment, refund, cancellation, and tax handling
- Accessibility obligations applicable to the business and customers

The queue product should not imply that agreeing to join a queue grants recording or publicity rights. Media consent must be explicit and separable.

This document is product planning, not legal advice.

## Technical Requirements Before External Customers

1. Convert the current single-event assumptions into explicit organization, venue, series, event, and membership records.
2. Enforce tenant isolation with Supabase row-level security.
3. Remove hard-coded administrator identity assumptions.
4. Add audit-friendly event timestamps and actor information.
5. Establish backups, error reporting, and a recovery procedure.
6. Add a staging environment or safe test organization.
7. Document database migrations and deployment procedures.
8. Define data retention for closed events and deleted accounts.
9. Verify signup and host controls on common mobile devices.
10. Test a complete event under weak or interrupted connectivity.

## Relationship to Rainbow Heart Studio

Rainbow Heart Studio's open mic is the design partner and reference implementation, not merely a demo account.

It should continue using the product in real conditions to answer:

- Which controls matter during the busiest five minutes?
- Which fields do performers actually complete?
- What information does the audience use?
- Do timestamps save real post-production time?
- What failures require a paper or offline fallback?
- Which features improve performer return rates?

Product development should solve observed event problems before speculative marketplace features.

## Success Criteria for the First Commercial Test

Proceed beyond validation when:

- Five outside hosts complete onboarding.
- At least three run a real event without Jonathan or Crystal operating it.
- At least three pay something rather than only accepting free access.
- Hosts create a second event within 60 days.
- No critical data-isolation, privacy, or event-control failures occur.
- Average hands-on support remains low enough for the product to scale.

## Current Strategic Decision

Validate Open Mic Queue before commercializing the Kodály suite or musician tools. Use it to learn customer onboarding, subscriptions, tenant isolation, support, and product operations in a comparatively narrow domain.

