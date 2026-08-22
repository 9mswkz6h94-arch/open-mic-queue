# Tablet Signup Experience

**Status:** Design specification  
**Created:** 2026-08-09  
**Product:** Open Mic Queue  
**Primary environment:** A shared tablet at the entrance or host station of a bar, brewery, cafe, or listening room

## Product decision

Open Mic Queue should have a dedicated **Guest Signup Mode** for a shared tablet. It is not the existing mobile form enlarged for a wider screen. It is a short, guided kiosk experience designed for dim rooms, noisy surroundings, hurried guests, repeated use, and minimal host assistance.

The tablet is one signup channel. Guests should still be able to use their own phones through an event link or QR code.

## Design goals

1. A first-time guest can join the queue in under two minutes.
2. The next guest never sees the previous guest's personal information.
3. The interface remains legible in dim, colored, or uneven venue lighting.
4. Every control works comfortably by touch without precise tapping.
5. The host can enter and leave kiosk mode without exposing admin controls.
6. Consent is understandable and specific to the actual event.
7. A temporary connection problem does not silently lose a completed form.

## Operating model

The host opens an event and chooses **Start Guest Signup**. The tablet enters a locked-down presentation with:

- Venue and event name
- Event date and signup status
- A large progress indicator
- A persistent **Ask the host for help** message
- No admin navigation, account email, queue-management controls, or destructive actions
- An obvious host-only exit protected by a short PIN or reauthentication

The kiosk should automatically return to its welcome screen after a successful signup or a period of inactivity.

## Recommended flow

### Screen 1 — Welcome

**Headline:** `Ready to play?`  
**Supporting text:** `Join tonight's queue in about 90 seconds.`

Primary action:

- **Join the queue**

Secondary information:

- Number of open spots, when configured
- Typical performance allowance, such as `2 songs / 10 minutes`
- QR code labeled **Prefer your own phone?**
- Short event rules link

### Screen 2 — Performer identity

Fields:

- Stage or performer name
- Contact email or phone, based on the host's event settings
- Optional real/legal name, shown only when the host genuinely needs it

Requirements:

- Labels remain visible above fields; placeholders are examples, not labels.
- The tablet keyboard type matches the field.
- Returning performers can choose **I've performed here before** and use a privacy-preserving lookup flow.
- Do not reveal whether an unrelated email address has an account.

### Screen 3 — Performance details

Fields:

- Song or piece 1
- Song or piece 2, optional when the event allows one selection
- Optional short artist or song note
- Optional social link entry through an **Add a link** control

The form should explain which information appears publicly. Private contact information must never appear on the audience queue.

### Screen 4 — Agreements

Use separate, plain-language choices. Do not bundle unrelated permissions.

- Agreement to the event's performance rules
- Recording consent, when recording is occurring
- Livestream consent, when livestreaming is occurring
- Optional marketing email consent
- Guardian confirmation when a minors workflow is enabled

The retired radio-show consent must be removed. Hosts should only see consent options enabled for that event.

### Screen 5 — Review

Show one calm summary:

- Performer name
- Songs or pieces
- Public artist information
- Permissions granted

Actions:

- **Join the queue**
- **Go back and edit**

The final button should be visually distinct and resistant to accidental double submission.

### Screen 6 — Success and privacy reset

**Headline:** `You're in, [Stage Name]!`  
Show the assigned position and a QR code or short link for checking the live queue.

Actions:

- **Done — clear my information**
- Optional **Add another performer**

After 12 seconds, automatically clear all fields, remove the authenticated session from the shared device, and return to the welcome screen. Display a visible countdown so the performer is not surprised.

## Visual and interaction requirements

- Optimize first for landscape and portrait tablets from 768–1366 CSS pixels.
- Minimum touch target: 48×48 px; target 56 px for primary kiosk controls.
- Limit the main content column to a comfortable reading width instead of stretching fields edge to edge.
- Use 18 px or larger form text to remain readable and avoid mobile browser zoom behavior.
- Keep one primary action per screen.
- Display progress as words and numbers: `Step 2 of 5 · Your performance`.
- Avoid hover-dependent information.
- Preserve entered data when moving backward.
- Support full keyboard navigation for hosts using a hardware keyboard.
- Provide clear focus rings, error summaries, and errors adjacent to their fields.
- Never identify errors using color alone.

## Bar-environment considerations

- Default to a dark, high-contrast surface that does not flood the entrance with white light.
- Avoid very thin type, faint gray labels, glass effects that reduce contrast, and large animated backgrounds.
- Assume fingerprints, glare, low attention, and one-handed use.
- Keep copy short enough to scan while music and conversation are happening.
- Do not use red for normal navigation; reserve it for destructive actions and genuine errors.
- Provide a **Large text** control without requiring the guest to open a settings menu.

## Account strategy

Kiosk signup should not require every guest to invent and remember a password at the door. Recommended progression:

1. For the Rainbow Heart Studio reference event, allow a one-event guest signup associated with a verified email or phone when needed.
2. After submission, offer an optional link to claim the performer profile on the guest's own device.
3. Keep account creation separate from joining tonight's queue.

This reduces abandonment while preserving a path to recurring artist profiles.

## Failure and recovery states

### Temporary connection loss

- Keep the completed form locally on the tablet.
- Display `Connection lost — your form is still on this tablet.`
- Retry safely without creating duplicates.
- Give the host an offline fallback reference.

### Event closed or full

- Replace the form with a clear closed state.
- Let the host optionally enable a waitlist.
- Never allow a stale open form to bypass the event limit.

### Duplicate performer

- Warn the host or guest without exposing another performer's private information.
- Offer **Update my existing signup** when identity can be safely verified.

## Host controls

The host needs:

- Start, pause, and close guest signup
- Set performance allowance and available fields
- Enable only the consent options relevant to the event
- Preview kiosk mode
- Generate the matching QR code
- Clear a stuck session
- View pending offline submissions
- Exit kiosk mode through a host-only PIN or fresh login

## Data and privacy rules

- Clear guest form state after every signup.
- Never show previous field values through browser autocomplete.
- Do not display private email, phone, or legal name in the public queue.
- Record the exact consent text and time accepted, not only a generic boolean.
- Do not store passwords in kiosk browser state.
- Do not upload performer photos from the shared kiosk in the first version; offer that later on the performer's own device.

## First implementation slice

Build the smallest testable tablet experience before redesigning account infrastructure:

1. Add a dedicated `/signup/:eventId/kiosk` presentation.
2. Use the six-screen guided flow above.
3. Use the existing performer fields, minus retired radio language.
4. Add a review screen, success countdown, and complete state reset.
5. Add a host PIN exit.
6. Test on one actual tablet at Nelson Brew Works under event lighting.

The first slice may still submit to the current single event, but its components should accept an event configuration object so they can support multi-event operation later.

## Acceptance criteria

- A new guest completes signup without host coaching in under two minutes.
- No screen requires horizontal scrolling at 768×1024 or 1024×768.
- All controls meet the 48 px minimum target.
- Text remains readable at 200% zoom.
- The flow can be completed with touch or keyboard alone.
- Back navigation preserves data.
- Double-tapping submit creates only one performer.
- After success or inactivity, no previous guest information remains visible or autofilled.
- A failed connection produces a recoverable state instead of an endless spinner.
- The live public queue never exposes contact information.
- The host can reliably exit kiosk mode without making admin controls available to guests.

## Questions for the first venue test

- Where will the tablet physically sit, and who watches it?
- Is landscape or portrait more natural for that location?
- Do most performers already know their two songs when they arrive?
- Does the host need a phone number, email address, or neither during the event?
- Which permissions genuinely apply at each event?
- How often does the venue lose internet service?
- Would performers prefer a QR handoff to finish optional profile details on their own phones?

