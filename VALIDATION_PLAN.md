# Open Mic Queue — 90-Day Validation Plan

**Status:** Working draft  
**Created:** 2026-08-09  
**Goal:** Determine whether recurring open-mic hosts will independently use and pay for the product before undertaking a full SaaS rebuild.

## Questions This Validation Must Answer

1. Do hosts experience the problem frequently enough to change their workflow?
2. Which part creates the most value: signup, live queue, artist discovery, timestamps, or history?
3. Can a host run an event without Jonathan or Crystal present?
4. Will hosts pay, and do they prefer per-event or subscription pricing?
5. What minimum accessibility and offline fallback are required in real venues?
6. How much onboarding and live support does each account require?

## Phase 0 — Make the Current Reference Event Reliable

Complete before recruiting outside pilots:

- [ ] Apply the `started_at` / `completed_at` production migration.
- [ ] Run the documented Start → Mark Performed → Export Timestamps smoke test.
- [ ] Remove the test performer and verify the live queue is clean.
- [ ] Confirm or remove the duplicate email field.
- [ ] Fix inconsistent social-link rendering.
- [ ] Verify mobile checkbox and touch-target sizing.
- [ ] Complete a keyboard-only host and performer walkthrough.
- [ ] Write a one-page emergency fallback for loss of internet or database access.

This phase validates the current Rainbow Heart Studio workflow; it does not require multi-tenancy yet.

## Phase 1 — Discovery Interviews

Interview 12–15 recurring hosts across several venue types.

### Recruitment Mix

- 4–5 music open-mic hosts
- 2–3 songwriter/showcase hosts
- 2 poetry or comedy hosts
- 2 venue managers with recurring community programming
- 1–2 arts-organization or college event coordinators

Non-music interviews are exploratory. The initial product remains music-focused unless evidence supports expansion.

### Interview Prompts

Do not begin by giving a product tour.

- Walk me through the day of your most recent event.
- How do performers sign up?
- Who changes the order, and why?
- How do performers learn when they are next?
- What goes wrong most often?
- What information do you keep after the event?
- Do you publish artist links, photos, or recordings?
- How do you handle no-shows, late arrivals, and walk-ins?
- What happens when internet service is poor?
- Which tools are you currently paying for?
- What would make switching feel risky?
- If this saved an hour per event, what would that be worth?

### Evidence to Capture

- Number of events per month
- Typical performer count
- Current tools and workarounds
- Most stressful moments
- Existing spending
- Required fields and event rules
- Accessibility needs
- Recording/media practices
- Interest in per-event versus monthly pricing

Record conclusions, not sensitive participant details, in a research summary.

## Phase 2 — Concierge Pilot

Recruit three outside hosts. Set up each pilot manually rather than building a general onboarding system first.

### Pilot Conditions

- A real public event, not a simulated demo
- Host receives a 20–30 minute onboarding session
- Host gets a one-page event checklist
- Jonathan/Crystal observe but do not operate the queue unless safety or event continuity requires it
- Host completes a short debrief within 48 hours

### Observe

- Signup completion and abandonment
- Time required to configure the event
- Reorders, skips, and corrections
- Host errors and hesitation
- Performer questions
- Audience use of the public display
- Mobile usability
- Connectivity problems
- Support messages before and during the event
- Whether exported timestamps or artist information are used afterward

## Phase 3 — Payment Test

After a successful first event, offer a concrete paid continuation rather than asking abstract willingness-to-pay questions.

Test two offers across pilots:

- **Event pass:** $15 for the next event
- **Founding host:** $20/month for up to two events per month, with direct feedback access

The goal is not to optimize pricing. It is to learn whether the product crosses the line from appreciated to purchased.

Do not offer lifetime access.

## Phase 4 — Lightweight Multi-Tenant Build

Only begin this phase after at least three hosts have run real events and at least one has paid.

Build the minimum structure needed for five to ten pilots:

- Organizations/hosts
- Events
- Host memberships
- Event-specific performers
- Event-specific public and signup links
- Supabase row-level security
- Removal of hard-coded admin identity
- Basic event duplication
- Basic branding
- Account and event deletion behavior

Avoid billing automation until the manual payment test shows demand.

## Measurement Dashboard

Track manually at first.

| Measure | Initial target |
|---|---:|
| Discovery interviews | 12–15 |
| Outside hosts completing onboarding | 5 |
| Real outside events run | 5 |
| Events run without live operator help | 3 |
| Hosts who pay | 3 |
| Hosts who create/run a second event | 3 |
| Critical privacy/tenant incidents | 0 |
| Average onboarding time | Under 45 minutes |
| Live support required | Under 15 minutes/event |

## Stop or Reposition Signals

Pause or change direction if:

- Hosts like the idea but repeatedly return to paper or spreadsheets.
- The product requires Jonathan or Crystal to operate each outside event.
- Most desired value is unrelated to queue management.
- Hosts will not pay even after successful events.
- Connectivity makes the product unreliable without a costly offline rebuild.
- The required legal or insurance burden materially exceeds expected revenue.
- Support load would consume the creative time the business is meant to buy back.

## Deliverables at Day 90

1. Interview synthesis
2. Pilot event notes
3. Usage and support measurements
4. Payment results
5. Ranked MVP requirements
6. Documented legal/privacy questions for professional review
7. Go, reposition, or stop decision
8. If “go,” a scoped multi-tenant architecture plan and six-month budget

## Decision Rule

Advance to a commercial beta only if real hosts can run the product independently, several return for a second event, and at least three make an actual payment.

