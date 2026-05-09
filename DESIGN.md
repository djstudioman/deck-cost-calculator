---
name: DeckCost 2026
description: Localized deck building cost estimator for homeowners, DIYers, and contractors.
colors:
  amber-primary: "oklch(0.75 0.18 75)"
  amber-foreground: "oklch(0.10 0.02 250)"
  navy-bg: "oklch(0.10 0.025 250)"
  navy-surface: "oklch(0.14 0.025 250)"
  navy-elevated: "oklch(0.18 0.02 250)"
  slate-text: "oklch(0.92 0.01 250)"
  slate-muted: "oklch(0.55 0.01 250)"
  border-subtle: "oklch(1 0 0 / 8%)"
  homeowner-accent: "oklch(0.75 0.18 75)"
  diy-accent: "oklch(0.72 0.17 155)"
  contractor-accent: "oklch(0.65 0.18 250)"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.06em"
  mono:
    fontFamily: "JetBrains Mono, Fira Code, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.amber-primary}"
    textColor: "{colors.amber-foreground}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    typography: "{typography.title}"
  button-primary-hover:
    backgroundColor: "oklch(0.80 0.18 75)"
    textColor: "{colors.amber-foreground}"
  button-ghost:
    backgroundColor: "oklch(1 0 0 / 4%)"
    textColor: "{colors.slate-text}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost-hover:
    backgroundColor: "oklch(1 0 0 / 8%)"
    textColor: "{colors.slate-text}"
  card-default:
    backgroundColor: "{colors.navy-surface}"
    textColor: "{colors.slate-text}"
    rounded: "{rounded.lg}"
    padding: "16px"
  card-selected-homeowner:
    backgroundColor: "oklch(0.75 0.18 75 / 10%)"
    textColor: "{colors.slate-text}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input-default:
    backgroundColor: "oklch(1 0 0 / 6%)"
    textColor: "{colors.slate-text}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: DeckCost 2026

## 1. Overview

**Creative North Star: "The Precision Instrument"**

DeckCost 2026 is built on a dark navy foundation that reads as authoritative and focused — the aesthetic of a professional tool, not a consumer website. Every element earns its place by serving a specific informational purpose. The interface is data-dense where it needs to be (contractor bid breakdown, material takeoff) and deliberately simple where it doesn't (homeowner wizard steps).

The system rejects the following explicitly: generic SaaS purple/blue gradients, glassmorphism used decoratively, hero-metric templates (big number + small label + glow), identical card grids, and anything that looks assembled from a template. The goal is an interface that feels hand-crafted and specific to the trade it serves.

The three-audience model (Homeowner / DIYer / Contractor) is the product's core structural idea. Each audience gets a distinct accent color that persists throughout their session — amber for homeowners, emerald for DIYers, blue for contractors. This is not decoration; it is a wayfinding system.

**Key Characteristics:**
- Dark navy base with warm amber as the primary accent
- Three audience-specific accent colors used consistently for selection state, progress, and highlights
- Condensed sans-serif (Barlow Condensed) for headings and labels; regular sans-serif (Barlow) for body; monospace (JetBrains Mono) for all cost figures
- Tonal layering for elevation: no drop shadows on cards, depth expressed through background lightness steps
- Borders are subtle (8% white opacity) and structural, never decorative

## 2. Colors: The Precision Palette

A dark, purposeful palette where amber is the primary signal color and navy provides the instrument-grade backdrop.

### Primary
- **Warm Amber** (`oklch(0.75 0.18 75)` / approx. `#E8A020`): The primary CTA color and homeowner audience accent. Used on the Continue button, progress bar fill, and selected card state for homeowners. Its warmth reads as approachable without being soft.

### Secondary
- **Emerald Signal** (`oklch(0.72 0.17 155)` / approx. `#22C55E`): DIYer audience accent. Used exclusively when the user has selected the DIYer path — progress bar, selected card border, active step indicator.
- **Steel Blue** (`oklch(0.65 0.18 250)` / approx. `#3B82F6`): Contractor audience accent. Used exclusively on the contractor path. Also used for framing estimate stats in the ShapeBuilder summary bar.

### Neutral
- **Deep Navy** (`oklch(0.10 0.025 250)` / approx. `#0B1120`): Page background. The darkest surface; also used for the sticky header with 80% opacity + backdrop blur.
- **Navy Surface** (`oklch(0.14 0.025 250)` / approx. `#111827`): Card backgrounds, step panels, drawer backgrounds.
- **Navy Elevated** (`oklch(0.18 0.02 250)` / approx. `#1E2A3A`): Hover states, secondary surfaces, slightly elevated panels.
- **Slate Text** (`oklch(0.92 0.01 250)` / approx. `#E2E8F0`): Primary text. Near-white with a cool blue tint — never pure white.
- **Slate Muted** (`oklch(0.55 0.01 250)` / approx. `#64748B`): Secondary labels, helper text, placeholder text.
- **Border Subtle** (`oklch(1 0 0 / 8%)`): All structural borders. 8% white opacity — visible enough to define structure, invisible enough not to compete.

### Named Rules
**The Audience Color Rule.** Each audience accent color (amber / emerald / blue) is used only when that audience is active. Never mix audience colors on the same screen. The accent is the user's identity thread through the wizard.

**The Mono Rule.** All cost figures, measurements, and numeric outputs use JetBrains Mono. No exceptions. Numbers in a sans-serif font look like copy; numbers in mono look like data.

## 3. Typography

**Display Font:** Barlow Condensed (500, 600, 700, 800 weights loaded)
**Body Font:** Barlow (400, 500, 600 weights loaded)
**Mono Font:** JetBrains Mono (400, 500, 600 weights loaded)

**Character:** Barlow Condensed is a workhorse condensed grotesque — efficient, direct, and slightly industrial. Paired with regular Barlow for body copy, it creates a clear hierarchy without resorting to a serif/sans contrast. JetBrains Mono grounds all numeric output in precision.

### Hierarchy
- **Display** (Barlow Condensed 700, clamp 1.75–2.5rem, lh 1.1): Hero title, results headline. Tight tracking (-0.01em). Appears once per view.
- **Headline** (Barlow Condensed 600, 1.25rem, lh 1.2): Step headings ("Who are you?", "What size deck?"). The primary wayfinding text.
- **Title** (Barlow 600, 1rem, lh 1.3): Card titles, section labels, option names. The workhorse heading level.
- **Body** (Barlow 400, 0.875rem, lh 1.5): Descriptions, helper text, card copy. Max 65ch line length.
- **Label** (Barlow Condensed 500, 0.75rem, lh 1.2, tracking 0.06em): Uppercase category labels ("2026 PRICING DATA", step badges, audience badge). All caps, tracked out.
- **Mono** (JetBrains Mono 500, 0.875rem, lh 1.4): All cost figures ($22.7K – $50.5K), measurements (640 sq ft, 104 LF), and numeric outputs in the ShapeBuilder summary bar.

## 4. Elevation

The system uses **tonal layering** exclusively. No drop shadows on cards or panels. Depth is expressed through background lightness steps:

- Layer 0 (page): `oklch(0.10 0.025 250)` — Deep Navy
- Layer 1 (cards, panels): `oklch(0.14 0.025 250)` — Navy Surface
- Layer 2 (elevated/hover): `oklch(0.18 0.02 250)` — Navy Elevated
- Layer 3 (header, sticky): `oklch(0.10 0.025 250)` at 80% opacity + `backdrop-blur-sm`

Exceptions: the save drawer and mobile ShapeBuilder overlay use `shadow-2xl` to reinforce their modal nature. The live estimate header uses a subtle glow (`shadow-[0_0_24px_rgba(X,X,X,0.08)]`) keyed to the audience accent color.

## 5. Components

### Buttons
- **Primary (Continue)**: Amber fill, deep navy text, 8px radius, 10px/20px padding. On hover: lightness +0.05. Never use gradient fills.
- **Ghost**: 4% white background, slate text, 8px radius. On hover: 8% white background. Used for secondary actions (Back, Clear, Edit).
- **Destructive**: `oklch(0.577 0.245 27.325)` fill. Used only for delete/remove actions.

### Cards (Selection)
- **Default**: Navy Surface background, 8% white border, 12px radius. Subtle hover: border lifts to 20% white opacity.
- **Selected**: Audience-accent-tinted background (10% opacity), audience-accent border (full opacity left edge + inset shadow). The left-edge border treatment is the one exception to the "no side-stripe borders" rule — it is structural, not decorative, and communicates selection state.
- **Note on left-edge borders**: The 4px left border on selected cards is intentional and functional. It is not a decorative accent stripe. It signals selection state in a dense list where background tint alone is insufficient.

### Progress Bar
- Track: 8% white opacity, 4px height, full-radius pill
- Fill: audience accent color, animated width transition
- Step dot: 14px circle, audience accent ring on active step

### ShapeBuilder Summary Bar
- Two-row layout: stats row (Area / Perimeter / Railing / Boards) + framing row (Rim / Joists / Beams / Posts)
- Stats row uses amber accent text; framing row uses steel blue text
- All values in JetBrains Mono
- Toolbar buttons (Edit / 2ft / Clear) use ghost button style

### Inputs
- Background: 6% white opacity
- Border: 10% white opacity, lifts to 20% on focus
- Text: Slate Text
- Placeholder: Slate Muted
- Radius: 6px

### Live Estimate Header (sticky top bar)
- Background: Deep Navy at 80% opacity + backdrop blur
- Cost range in JetBrains Mono, amber color
- Save button: ghost style with bookmark icon

## 6. Do's and Don'ts

**Do:**
- Use Barlow Condensed for all headings and uppercase labels
- Use JetBrains Mono for every cost figure, measurement, and numeric output
- Use the audience accent color consistently throughout a session (amber/emerald/blue)
- Use tonal layering (background lightness steps) to express depth
- Use 8% white opacity borders as structural dividers
- Keep body copy under 65ch line length
- Use progressive disclosure — show contractor-level complexity only on the contractor path

**Don't:**
- Use gradient text (`background-clip: text`) anywhere
- Use glassmorphism decoratively (blur + transparency as aesthetic, not functional)
- Use drop shadows on cards or panels (use tonal layering instead)
- Use the same accent color across multiple audience paths simultaneously
- Use Inter or any generic sans-serif — Barlow is the system font
- Use purple, teal, or any color not in the defined palette
- Add decorative borders (side stripes, colored left borders) to non-selection-state elements
- Use identical card grids (same size, same icon, same text structure repeated)
- Show contractor-level data (markup, crew, material takeoff) to homeowner or DIYer paths
