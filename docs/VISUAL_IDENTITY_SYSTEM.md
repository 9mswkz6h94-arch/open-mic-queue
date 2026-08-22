# Open Mic Visual Identity System

**Status:** Foundation architecture  
**Created:** 2026-08-09  
**Current implementation:** Scaffold  

## Purpose

Open Mic Queue uses one accessible component system with multiple visual identities layered over it. New features begin in **Scaffold**, where structure and interaction can be judged without decoration. Once stable, the same components can receive either the **Rainbow Heart** or **Prism** identity without rewriting product behavior.

This is a design progression, not three separate applications:

```text
product behavior
→ Scaffold foundation
→ accessibility and responsive verification
→ selected identity layer
→ real-environment verification
```

## The three identities

| Identity | Primary purpose | Character | Geometry | Color behavior |
|---|---|---|---|---|
| **Scaffold** | Product design and first implementation | Raw, structural, honest | Exposed grid, square edges | Neutral monochrome |
| **Rainbow Heart** | Studio, community, teaching, and welcoming guest experiences | Warm, inclusive, expressive | Soft and organic | Broad, friendly spectrum |
| **Prism** | Bars, stages, breweries, and live-event operation | Nocturnal, precise, confident | Sharp, refracted, hard-edged | Dark field with restrained spectral light |

## What never changes

Themes may change presentation but may not weaken:

- Information hierarchy
- Semantic HTML
- Keyboard navigation
- Screen-reader names and live announcements
- Minimum 48 px touch targets
- Visible focus
- Text zoom and responsive behavior
- Error recovery
- Meaningful action labels
- Destructive-action separation
- Privacy boundaries between audience, performer, kiosk, and host views

If a design only works because of color, animation, hover, or a decorative icon, the foundation is incomplete.

## Scaffold

### Role

Scaffold is the default first draft for new screens and components. A more precise product-design term is **foundation theme**. It is intentionally finished enough to use, but visually neutral enough to expose weak hierarchy.

### Rules

- Black, white, and neutral gray
- System or neutral interface type
- No gradients
- No decorative shadows
- No brand-dependent imagery
- Square or minimally rounded geometry
- Borders reveal grouping and layout
- Numbers and labels reveal sequence and status
- Text labels replace ambiguous functional emoji
- Background grid may expose spacing rhythm during development

### Scaffold review questions

- Can the user identify the next action without color?
- Can state be understood without an icon?
- Does the layout survive long names and missing images?
- Does it work at phone, tablet, desktop, and 200% zoom?
- Can destructive controls be mistaken for progression controls?
- Does the feature still feel understandable when all decoration is removed?

## Rainbow Heart

### Role

Rainbow Heart is the accessibility-centered, welcoming identity associated with Rainbow Heart Studio and community-facing creative experiences.

### Principles

- Color as welcome
- Atkinson Hyperlegible as the preferred default interface face
- OpenDyslexic as an optional preference
- Rounded, approachable surfaces
- Generous spacing
- Organic shapes and broad-spectrum accents
- Calm motion with reduced-motion support
- Accessibility controls presented positively and visibly

Rainbow Heart should feel inclusive and creative without becoming childish or visually busy.

## Prism

### Role

Prism is the dark live-venue identity for bars, breweries, listening rooms, stages, and high-attention host operation.

### Concept

A prism requires hard edges and exact structure to turn one beam into a spectrum. Most of the interface remains dark and quiet. Spectral color appears where information changes state or attention is required.

### Principles

- Structure creates the spectrum
- Near-black operational surfaces
- Crisp or clipped geometry
- Warm white text
- Condensed display type for performer names
- Amber for live state
- Violet for on-deck state
- Teal for completion
- Red reserved for errors and destructive actions
- Thin refracted highlights rather than broad rainbow gradients
- Glow used sparingly and never as the only state indicator

Prism is not a neon nightclub theme. Avoid equalizer decoration, smoky backgrounds, fake brick, excessive glow, and color on every edge.

## Theme architecture

Components should consume semantic tokens rather than identity-specific colors.

```css
--color-canvas
--color-surface
--color-text
--color-text-muted
--color-border
--color-action
--color-focus
--color-live
--color-on-deck
--color-complete
--color-danger

--font-interface
--font-display
--font-mono

--shape-surface
--shape-control
--border-surface
--shadow-surface
```

Each identity defines those tokens. Components define layout and behavior only.

Recommended file organization:

```text
src/
  styles/
    foundation.css
    components.css
  themes/
    scaffold.css
    rainbow-heart.css
    prism.css
```

The current Scaffold implementation begins in `src/themes/scaffold.css`. Later refactoring should move any layout rules that truly never change into `foundation.css` and leave only visual token choices in theme files.

## Component development workflow

1. Define the job the component performs.
2. Build semantic markup and states.
3. Style it in Scaffold.
4. Test keyboard, touch, zoom, long text, empty data, error data, and loading.
5. Approve the component structure.
6. Apply Rainbow Heart or Prism tokens.
7. Test the selected identity for contrast and legibility.
8. Test in its real environment.

Do not solve a structural problem with theme decoration.

## Required states for every component

- Default
- Hover where relevant
- Keyboard focus
- Pressed/active
- Disabled
- Loading
- Empty
- Error
- Success or completion where relevant
- Long-content stress case
- Reduced-motion behavior

## Choosing an identity

Use **Scaffold** when:

- Building a new feature
- Comparing layout alternatives
- Debugging hierarchy or responsive behavior
- Testing accessibility without decorative help

Use **Rainbow Heart** when:

- The experience represents Rainbow Heart Studio directly
- Warmth, learning, community, or reassurance is primary
- The audience includes students, families, and creative guests

Use **Prism** when:

- The experience happens in a dim live venue
- The user is operating an event under time pressure
- Performance status and glanceability are primary
- A venue-neutral product identity is preferable to Studio branding

An application may use more than one identity by context—for example, Rainbow Heart marketing, Prism event operation, and Scaffold development—but one screen should never mix their decorative languages casually.

## Current Open Mic decision

Open Mic Queue is being rebuilt locally in Scaffold first. The immediate goal is to stabilize:

- Public queue hierarchy
- Tablet signup structure
- Host-console density and action safety
- Responsive navigation
- Accessible controls and state language

After the foundation is approved, the live-event surfaces should move into Prism. Rainbow Heart remains available for Studio-facing promotion or community-oriented experiences where that identity is appropriate.

## Approval gates

Before moving from Scaffold to a themed phase:

- Core flow is usable without decorative color.
- No supported viewport scrolls horizontally.
- Keyboard and touch walkthroughs pass.
- Error, loading, empty, and offline states are designed.
- High-risk actions have separation and confirmation.
- The feature has been tested with realistic content.

Before deploying a themed phase:

- All color combinations pass contrast testing.
- Reduced motion and text zoom remain functional.
- The identity has been reviewed in its intended environment.
- Theme styling has not duplicated or altered product behavior.

