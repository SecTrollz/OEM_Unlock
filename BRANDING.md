# OEM_UNLOCK — Brand & Logo Blueprint

This document is the single source of truth for the project's visual identity.
Every value below (color, type, spacing, logo geometry) is derived from the
same small rule set, so nothing here is arbitrary — if you need a new asset
(a banner, a badge, a favicon), derive it from this system rather than
eyeballing a new one.

## 1. Concept

The mark reads as three ideas stacked in one glyph:

| Element | Meaning | Why |
|---|---|---|
| Hexagonal shield | Security / research boundary | The project operates on network traffic and provisioning APIs — a security-research frame, not a generic app icon. |
| Circuit trace (bottom-left) | Proxy / interception | The tool's core mechanism is a man-in-the-middle tap on API traffic — the trace visualizes a wire being tapped. |
| Open padlock | Unlocked state | The literal outcome the tool produces (OEM unlock toggle enabled). Shackle is drawn *open*, never closed — the closed state is never brand-appropriate here. |

Nothing decorative was added beyond these three elements. If a future asset
needs a new symbol, it must map to one of the tool's actual mechanics —
not to "looking more techy."

## 2. Logo construction

- Source grid: **64×64** viewBox, built on an 8-unit base grid (see §4).
- Shield outline: `M32 4 L54 12 L54 30 C54 46 44 56 32 60 C20 56 10 46 10 30 L10 12 Z`
- Stroke weight: 2.5 (shield), 3 (shackle), 1.6 (circuit trace) — thicker
  strokes mark the higher-meaning elements (lock > shield outline > trace).
- Clear space: maintain a minimum margin around the mark equal to the
  shackle radius (6.5 units) on all sides before any other element (text,
  edge of container, adjacent badge) begins.
- Minimum size: 20px square (mark alone) / 120px wide (full lockup with
  wordmark). Below that, the keyhole and circuit trace stop resolving —
  use the mark-only variant instead of shrinking the lockup.

### Assets

| File | Use |
|---|---|
| `assets/logo-mark.svg` | Icon-only. Favicons, avatars, small badges. |
| `assets/logo-lockup.svg` | Icon + wordmark, dark text — for light backgrounds. |
| `assets/logo-lockup-dark.svg` | Icon + wordmark, light text — for dark backgrounds. |

Never recolor the mark ad hoc. If a new background requires a variant,
add it here as a new file following the same construction rules, not as
an inline color override where it's used.

## 3. Color system

Every color has exactly one job. Do not borrow a color for a new purpose —
add one instead, and document it here first.

| Token | Hex | Role |
|---|---|---|
| `ink` | `#0B0F14` | Shield fill, dark text on light surfaces. The "boundary" color. |
| `paper` | `#E6EDF3` | Lock body, light text on dark surfaces. |
| `accent-network` | `#38BDF8` | Proxy/interception elements (circuit trace, gradient start). Also used for informational callouts in docs. |
| `accent-unlock` | `#35D48A` | Unlock/success elements (shackle, gradient end). Reserve for "this worked" states — success logs, completed steps. |
| `accent-warning` | `#F5A623` | Reserved for caution/disclaimer content (matches the ⚠️ sections already in the docs). Never used in the logo itself. |
| `neutral-mid` | `#7C8B9A` | Secondary text, taglines, muted UI. |

The shield-to-lock gradient (`accent-network → accent-unlock`) is the only
gradient in the system: it reads left-to-right / top-to-bottom as
"traffic in → unlock out," matching what the tool actually does. Don't
introduce a second gradient elsewhere; it would compete with this one.

## 4. Spacing & grid

Base unit: **8px**. Logo geometry, badge padding, and section spacing in
any future rendered asset (banners, social cards) should be multiples of
this unit (8/16/24/32/48…). This keeps hand-built SVG elements aligned
without a design tool.

## 5. Typography

| Role | Stack | Rationale |
|---|---|---|
| Wordmark / headings | `'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` | Monospace signals "this is a code/CLI tool," and matches the JS source and terminal log output already shown in the README. |
| Body copy | System default (`-apple-system, Segoe UI, Roboto, sans-serif`) | Markdown body text stays on GitHub's default stack — the brand asserts itself through the logo and headings, not by fighting GitHub's renderer. |

## 6. Usage rules

**Do**
- Use `logo-lockup.svg` at the top of the README and any top-level doc.
- Use `logo-mark.svg` alone for favicons, small badges, or anywhere the
  full wordmark won't fit at a legible size.
- Keep the shackle open in every derived asset.

**Don't**
- Don't recolor the shield fill to anything other than `ink`/`paper` per
  the light/dark variants above.
- Don't draw the padlock closed — it contradicts what the project does.
- Don't add a second accent color; extend the table in §3 instead.
- Don't stretch the lockup non-uniformly — scale width and height together.

## 7. Applying updates

If the mark or palette ever changes, update it in exactly three places and
nowhere else, so the system stays internally consistent:

1. `assets/logo-mark.svg`, `assets/logo-lockup.svg`, `assets/logo-lockup-dark.svg`
2. The token table in §3 of this file
3. The README header that embeds the lockup (see below)
