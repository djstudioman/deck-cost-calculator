# Critique Observations — Visual Inspection

## Step 1: Audience selector
- Hero photo looks good — fire pit and curved bench visible, text readable
- "2026 PRICING DATA" label in amber — good use of accent
- Three audience cards: Homeowner selected (amber left-border + tinted bg), DIYer and Contractor unselected
- Emoji icons (🏡 🔨 📋) on cards — feels slightly informal for the "precision instrument" brand
- Cards are identical in structure — same size, same icon position, same text layout → identical card grid antipattern
- Dev button visible at bottom — must be removed before publish
- Large empty space below the cards and Continue button — wasted vertical space

## Step 2: Region selector
- 8-card 2-column grid — dense but scannable
- Labor multiplier badge (0.93×, 1.52×) in amber top-right of each card — good data-forward design
- "Frost: 0–18"" in muted text — useful but the unit is ambiguous (inches? depth?)
- No selected state visible — none pre-selected, user must pick
- Cards feel slightly cramped — text truncates on some labels

## Step 3: Deck size
- 5 options in 2-column grid (last one spans full width) — asymmetric, good
- Price range in amber mono — correct per DESIGN.md
- "PT installed est." label in muted text — slightly jargony for homeowners
- Cards feel well-spaced

## Step 4: Material tier
- 3 full-width stacked cards — good for comparison
- Price range right-aligned in amber — strong
- Brand pill badges (Trex Select, Fiberon Good Life) — useful detail
- Lifespan + maintenance icons (🏆 🔧) — emoji again, inconsistent with precision brand
- "Mid-Range Composite" selected with amber left-border — correct selection state

## Step 5: Complexity
- 4-card 2×2 grid — clean
- Labor % badge in amber right-aligned — good
- "Baseline" tag on Simple Rectangle — clear reference point
- "+30% labor", "+65% labor", "+110% labor" — useful but the percentages are relative to what? Not obvious

## Step 6: Railing & stairs
- Multi-section step — height selector + railing style + stairs toggle + step count slider
- Most complex step in the wizard — cognitive load is high
- Toggle switches for "Add railing anyway" and "Do you need stairs?" — good progressive disclosure
- Slider for step count — functional but visually basic
- "Most affordable" / "Most popular" / "Premium" badges — helpful but badge styling (amber pill) looks like a notification badge, not a label

## Step 7: Permit & Fees
- Emoji icons on permit cards (🚫 🏘️ 🏡 🏙️ ☀️) — inconsistent with precision brand
- "No permit needed" card is full-width, others are 2-column — good visual hierarchy
- "STRUCTURAL ENGINEER FEE" section with toggle — good progressive disclosure
- "SELECT YOUR PERMIT SITUATION" label in uppercase amber — correct per DESIGN.md

## Results page
- Large cost range in JetBrains Mono — excellent, this is the hero moment
- "$71–$158/sq ft · 320 sq ft" subtitle — good context
- Summary pills (Region, Size, Complexity, Railing) — good at-a-glance confirmation
- "Composite" badge top-right — slightly orphaned, unclear what it refers to
- Cost breakdown bar chart — bars are colored (amber, blue, green, purple, orange, red) — chart colors don't follow the audience accent system
- Line items below chart — good detail, JetBrains Mono for numbers ✓
- "WHAT CONTRACTORS CHARGE" section — three tiers with color-coded dots — good
- "Regional Factors" + "Material Profile" side-by-side panels — good information density
- "Tariff Note" with ⚠️ icon — useful but emoji again
- IMPORTANT DISCLAIMER section — good, but "IMPORTANT DISCLAIMER" label feels alarming
- Save/Download CTAs at bottom — good placement but the save section feels like an afterthought

## Automated scan findings
- side-tab: 1 (line 622 — the left-border selection state, intentional per DESIGN.md)
- gray-on-color: 5 (text-slate-500 on bg-red-500, text-slate-400 on bg-amber-500 ×3, text-slate-900 on bg-amber-500)
- pure-black-white: 4 (bg-black in shadcn overlay components — alert-dialog, dialog, drawer, sheet)
