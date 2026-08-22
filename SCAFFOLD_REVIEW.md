# Scaffold Approval Matrix — Open Mic Queue

**Project:** `proj-002`  
**Design-system version:** `0.1.3`  
**Review data mode:** `mock-isolated`  
**Last updated:** 2026-08-09  

Allowed statuses: `Passed`, `Failed`, `Not tested`, `Blocked`, `Static review only`.

| Gate | Status | Evidence | Environment | Follow-up |
|---|---|---|---|---|
| Phone 390×844 | Passed | Long-content fixture rendered without horizontal page overflow; visible interactive controls met 48 px minimums; phone screenshot inspected | Local browser, mock-isolated | Repeat on physical event tablet/phone when available |
| Tablet portrait 768×1024 | Passed | Long-content fixture rendered without horizontal page overflow and visible interactive controls met 48 px minimums | Local browser, mock-isolated | Physical tablet remains separate gate |
| Tablet landscape 1024×768 | Passed | Long-content fixture rendered without horizontal page overflow and visible interactive controls met 48 px minimums | Local browser, mock-isolated | Physical tablet remains separate gate |
| Desktop 1440×900 | Passed | Long-content fixture rendered without horizontal page overflow and visible interactive controls met 48 px minimums | Local browser, mock-isolated | Include in future regression automation |
| Keyboard-only workflow | Passed | Jonathan completed the requested human review and reported the result as working well | Human review, mock-isolated | Include in future regression testing |
| Visible focus | Passed | Focused navigation button rendered a 3 px solid blue outline | Local browser, mock-isolated | Confirm throughout human keyboard pass |
| Minimum 48×48 touch targets | Passed | Rendered audit found no visible button, select, link, input, textarea, or role=button below 48 px at all four reference viewports after social-link correction | Local browser, mock-isolated | Include in regression automation |
| 200% text zoom | Passed | Jonathan completed the requested human review and reported the result as working well | Human review, mock-isolated | Recheck on the physical event tablet |
| Reduced motion | Static review only | CSS preference rule removes scrolling behavior and reduces transition duration | Source inspection | Verify with OS preference enabled |
| No horizontal page scrolling | Passed | `scrollWidth` did not exceed `clientWidth` at 390, 768, 1024, or 1440 px with long fixture content | Local browser, mock-isolated | Include in regression automation |
| Loading state | Static review only | Deterministic delayed-loading fixture exists and resolves after 1.2 seconds | Source inspection | Verify announcement with assistive technology |
| Empty state | Passed | Empty fixture rendered “The queue is open / No performers have signed up yet” | Local browser, mock-isolated | Include in regression pass |
| Error and recovery state | Passed | Error fixture rendered an alert with the fixture error and a Try again control instead of hanging | Local browser, mock-isolated | Include in keyboard and screen-reader pass |
| Long-content stress case | Passed | Eleven-performer fixture includes intentionally long artist, person, song, URL, and note content; all content remained present without page overflow | Local browser, mock-isolated | Repeat at 200% zoom |
| Card color and text contrast | Passed | Human review found white inherited text on white On Deck cards and opacity-shifted Performed cards; Scaffold overrides now render both on white with `#111111` text at full opacity | Human report plus computed-style verification, mock-isolated | Recheck during 200% zoom pass |
| Visual-system consistency | Passed | Human follow-up caught over-normalization that weakened state differentiation. The correction restores black numbered Queue tiles, outlined On Deck sequence markers, textual Performed status, semantic completed edge, and readable underlined “Visit [platform]” links. The latest audit also keeps the `01`–`04` sequence visible with an explicit `03 Queue / 00` state, zero-pads counts, removes the internal style shorthand from the public wordmark, and exposes the active navigation state. No page, card, row, or link overflow remains. | Human review plus local browser at 390, 768, 1024, and 1440 px, mock-isolated | Preserve state hierarchy during Prism theming |
| Couture DIY 95 reference treatment | Passed | Editorial masthead, controlled font roles, tailored rule weights, visible construction edges, direct utility controls, and differentiated queue states were applied across Queue, Signup, and Host Console with no rendered page or component overflow | Local browser across phone, tablet, desktop, and the active 200% zoom context, mock-isolated | Use as the reference when onboarding the next app |
| Destructive-action separation | Static review only | Reset moved to collapsed development tools | Local host-console inspection | Verify touch and keyboard behavior in mock mode |
| Privacy boundary review | Static review only | Public queue source does not render contact email | Source inspection | Add automated field exposure check |
| Safe review mode verified | Passed | Local development loaded `mock-isolated`, exposed named fixtures, and rendered mock queue data without instantiating the Supabase client | Local browser and source inspection | Keep production-connected mode explicit and visibly warned |
| Physical target-device review | Not tested | | | Test on actual event tablet at Nelson Brew Works |

## Approval decision

**Status:** Not approved  
**Decision record:** None  

Scaffold cannot advance to Prism while the OS-level reduced-motion check and physical-device evidence remain incomplete. Keyboard-only and 200% zoom are recorded as passed above; static-only evidence remains labeled without being promoted by this audit.
