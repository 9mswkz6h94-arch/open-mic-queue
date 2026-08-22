# Bar-Venue Visual Redesign

**Status:** Design direction and implementation brief  
**Created:** 2026-08-09  
**Product:** Open Mic Queue  
**Working design name:** Prism  
**Architecture:** See `VISUAL_IDENTITY_SYSTEM.md`; Prism is applied after the Scaffold foundation is approved.

## Design objective

Redesign Open Mic Queue as a confident live-event utility that belongs in a bar, brewery, listening room, cafe, or small venue.

The product should retain Rainbow Heart Studio's warmth, inclusion, and creative personality without looking like a page inside the Studio website. It needs its own operational identity: darker, bolder, calmer, and easier to read while people are moving, talking, carrying drinks, and watching a stage.

## What exists today

### Rainbow Heart Studio language

The wider Studio application establishes several useful design traits:

- Welcoming, optimistic color
- Rounded cards and pill-shaped actions
- Generous spacing
- Friendly editorial headings
- Clear tool cards
- Gradients used to create energy and identity
- An inclusive, non-corporate voice

These traits should survive as personality, not be copied literally.

### Current Open Mic language

The queue currently uses:

- White and pale-gray application surfaces
- Purple gradients for featured performers
- Rounded cards and light shadows
- Emoji as most navigation and status iconography
- A single purple primary action color
- OpenDyslexic as the forced default typeface
- Dense signed-in navigation that overflows on small screens
- Similar visual treatment for audience, performer, and administrator contexts

The result is friendly but feels closer to a studio prototype than a live venue tool. The redesign should add hierarchy, atmosphere, role clarity, and resilience without making the interface theatrical or difficult to operate.

## Product personality

**Prism** should feel:

- Warm, not cute
- Musical, not novelty-themed
- Dark, not gloomy
- Energetic, not visually noisy
- Independent, not corporate SaaS
- Inclusive, not juvenile
- Fast and dependable under pressure

Avoid nightclub clichés: excessive neon, fake brick textures, glowing equalizers, vinyl-record decoration, smoky gradients, and animation for its own sake.

## Core visual concept

Use a near-black stage environment with warm paper and amber details inspired by stage lights, handwritten set lists, instrument hardware, and venue signage. Rainbow Heart purple remains a recognizable accent but no longer carries the entire interface. Hard, precise edges act like a physical prism: the structure makes restrained spectral highlights possible.

The visual hierarchy should resemble a good stage plot:

1. The thing happening now is unmistakable.
2. The next action is easy to find.
3. Supporting information stays quiet.
4. Dangerous actions are physically and visually separated.

## Color system

### Base palette

| Token | Suggested value | Use |
|---|---:|---|
| `--ink-950` | `#11100F` | Main application background |
| `--ink-900` | `#191816` | Navigation and elevated dark surfaces |
| `--ink-800` | `#26231F` | Cards and controls |
| `--paper-100` | `#F4EFE6` | Primary text on dark backgrounds |
| `--paper-300` | `#CFC6B7` | Secondary text |
| `--line` | `#3B3731` | Borders and dividers |
| `--amber-400` | `#F0A23A` | Primary actions and live emphasis |
| `--amber-300` | `#FFC064` | Hover/focus highlight |
| `--violet-400` | `#8D7CF6` | Rainbow Heart connection and secondary accents |
| `--teal-400` | `#36C5A5` | Confirmed/success states |
| `--red-400` | `#E35D5D` | Errors and destructive actions only |

All final combinations must meet WCAG AA contrast. Do not rely on these draft values without testing them in context.

### Role accents

- **Live now:** amber
- **On deck:** violet
- **Completed:** muted teal
- **Paused/waiting:** paper gray
- **Error/destructive:** red

Color must always be paired with text, shape, or iconography.

## Typography

Use type to distinguish atmosphere from operation.

### Recommended roles

- **Display and performer names:** `Barlow Condensed`, `Oswald`, or another sturdy condensed sans serif
- **Interface and body:** `Atkinson Hyperlegible`, already used elsewhere in the Studio ecosystem
- **Numbers and timestamps:** a tabular-numeral face or system font with `font-variant-numeric: tabular-nums`

Do not force a dyslexia-oriented typeface on every user. Offer OpenDyslexic as a preference. Atkinson Hyperlegible is a strong accessible default that still feels intentional.

### Minimum practical sizes

- Public display performer name: 40–72 px depending on screen
- Tablet page title: 30–40 px
- Admin page title: 28–36 px
- Body and form text: 18 px on shared tablets; 16 px elsewhere
- Supporting metadata: never below 14 px

## Shape, borders, and depth

- Use 10–14 px corner radii rather than extreme pills on large surfaces.
- Prefer visible 1 px borders over soft shadows in dark mode.
- Use shadows sparingly; venue lighting and lower-quality screens can make subtle shadows disappear.
- Reserve pill shapes for status badges, filters, and short metadata.
- Use a strong left rail or top edge to communicate performer status.

## Iconography

Replace functional emoji with one consistent icon set. Emoji may remain in celebratory empty states or artist-facing moments, but not as the primary meaning for admin controls.

Every icon-only control needs:

- An accessible name
- A visible tooltip where appropriate
- A 48 px minimum touch target
- A text-label alternative in high-stakes actions

Delete, finish, skip, start, and reorder should not be represented by ambiguous symbols alone.

## Three related interface modes

The product should share tokens and components while giving each audience the right density.

### 1. Audience display

Purpose: answer `Who is playing? Who is next?`

- Full-bleed dark layout
- Current artist dominates the first viewport
- Two on-deck performers are clearly ranked
- Social links and artist stories remain secondary
- No account or admin navigation
- Suitable for a phone, projected display, TV, or QR visitor
- Optional venue logo and event title

### 2. Guest signup

Purpose: complete one task privately and quickly.

- Guided tablet flow from `TABLET_SIGNUP_EXPERIENCE.md`
- One major decision per screen
- Large touch controls
- Calm background with restrained accents
- Clear privacy reset between guests

### 3. Host console

Purpose: operate the room with minimal attention.

- Denser than the audience or signup views
- Sticky current-performer panel
- Large **Finish & Start Next** primary action
- Upcoming queue supports touch, pointer, and keyboard reordering
- Undo for skip/complete/reorder actions
- Destructive tools separated into an overflow or event-settings area
- Timestamps visible without competing with performer identity

## Navigation model

The current signed-in navigation is too wide for phones and tablets. Replace it with role-aware navigation.

### Audience/guest

- Compact event mark
- Queue
- Sign up
- Accessibility

### Performer

- Queue
- My signup
- Profile
- Account menu

### Host

- Queue
- Signup mode
- Event
- More/account menu

On small screens, use a bottom navigation bar for the three most important destinations and an overflow menu for secondary tools. Never expose admin navigation inside kiosk mode.

## Component direction

### Current performer card

- Amber status rail and `LIVE NOW` label
- Large performer name
- Songs as a short set list
- Elapsed time or start time for the host; omit operational time from the audience view unless useful
- Photo optional; layout remains balanced without one

### Queue row

- Large numeric position
- Performer name and concise song summary
- Clear state label
- Admin actions revealed intentionally, not mixed with the content
- Drag affordance large enough for touch

### Buttons

- Primary: filled amber on dark surface
- Secondary: dark surface with visible border
- Success: teal with explicit action text
- Destructive: red outline by default; filled red only at final confirmation
- Avoid hover movement that makes controls feel unstable

### Forms

- Persistent labels
- Dark fields with clear borders
- Large focus ring using amber or violet
- Helper copy only when it changes the decision
- Errors summarized at the top and repeated at the field

## Accessibility foundation

Accessibility is part of the design system rather than a floating optional panel.

- Default colors meet WCAG AA.
- Keyboard focus is always visible.
- Touch targets are at least 48 px.
- Live queue changes use an appropriate, non-disruptive announcement region.
- Reduced-motion preferences remove nonessential transitions.
- Text supports 200% zoom without horizontal page scrolling.
- OpenDyslexic, increased type size, and stronger contrast are genuine user preferences.
- High-contrast mode changes the entire application, not only its settings panel.
- Status and order never depend on color alone.

## Voice and terminology

The copy should sound like a calm, experienced host.

Prefer:

- `You're on the list.`
- `Up next`
- `Finish & start next`
- `Signup is paused`
- `We lost the connection. Your information is still here.`

Avoid:

- Technical database errors
- Generic SaaS language such as `resource created successfully`
- Retired radio-show references
- Ambiguous labels such as a checkmark with no text
- Overly enthusiastic copy during operational failures

## Responsive priorities

### Phone

- Public queue and performer self-service
- No horizontal scrolling
- Bottom navigation
- Current performer first

### Tablet

- Guest kiosk or host console
- Portrait and landscape layouts
- Two-column host view when width allows
- Controls reachable without stretching across the entire screen

### Desktop/TV

- Audience display can expand type and breathing room
- Host console may show current, upcoming, and event status simultaneously
- Do not simply enlarge mobile cards to fill the screen

## What should remain from the current product

- Performer-first public queue
- Strong distinction between current and upcoming artists
- Optional photos, stories, and social discovery
- Friendly, inclusive tone
- Purple as a connective Rainbow Heart accent
- Rounded, approachable geometry
- Straightforward one-page host operation

## What should change

- White studio-like background becomes a venue-aware dark foundation.
- Emoji controls become consistent icons and text labels.
- One crowded navbar becomes role-aware responsive navigation.
- Purple-only hierarchy becomes an amber/violet/teal status system.
- Forced OpenDyslexic becomes an optional preference.
- Decorative cards become operational surfaces with stronger hierarchy.
- Generic loading and errors become recoverable human states.
- Dangerous test/reset controls leave the primary host screen.

## Implementation sequence

### Phase 1 — Foundations

1. Introduce semantic design tokens for color, type, spacing, borders, focus, and state.
2. Switch the default UI font to Atkinson Hyperlegible or the approved equivalent.
3. Add global focus, contrast, large-text, and reduced-motion behavior.
4. Remove horizontal overflow at phone and tablet widths.
5. Replace the navbar with role-aware responsive navigation.

### Phase 2 — Core surfaces

1. Redesign the public queue.
2. Build the tablet signup experience.
3. Redesign the host console around the current performer and next action.
4. Replace functional emoji and ambiguous icon-only controls.
5. Add deliberate empty, loading, offline, and error states.

### Phase 3 — Venue identity

1. Add event and venue names, logo, and restrained accent customization.
2. Create a large-screen audience display mode.
3. Test under real bar lighting and weak connectivity.
4. Tune density based on live host behavior rather than screenshots alone.

## Design acceptance criteria

- The application feels visually distinct from Rainbow Heart Studio while still related to it.
- A person can identify the current and next performer within two seconds.
- Public, signup, and host modes are visually and functionally distinct.
- No supported phone or tablet layout scrolls horizontally.
- Primary live-event actions are reachable with one hand and at least 48 px tall.
- Destructive actions cannot be mistaken for normal progression.
- Every functional icon has an accessible name.
- All states remain usable without color perception.
- Text at 200% zoom remains functional.
- The design is tested on-site under actual venue lighting before production deployment.

## Decisions to make before implementation

- Approve or revise the **Prism** direction after the Scaffold foundation is stable.
- Choose the display typeface after comparing Barlow Condensed and Oswald in performer-name layouts.
- Decide whether dark mode is the universal default or the default for event surfaces only.
- Decide how much venue branding a host can customize without damaging accessibility.
- Confirm the physical tablet and likely orientation for the reference event.
- Confirm whether the public queue should prioritize artist discovery or maximum glanceability during the show.
