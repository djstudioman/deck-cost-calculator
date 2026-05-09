# Contractor Pathway Restructure

## Current contractor step order (steps 0-9, 10 total):
- Step 0: Audience (shared)
- Step 1: Region (shared)
- Step 2: Size (shared)
- Step 3: Material (shared)
- Step 4: Complexity (shared)
- Step 5: Framing System (contractor-only) — has: framing material, joist spacing, beam span warning
- Step 6: Railing & Extras (shared step 6 for contractor, step 7 for DIY) — has: deck height, railing system, railing LF, CONTRACTOR RAILING SPEC (post mount, post spacing, railing height), stairs
- Step 7: Markup & Crew (contractor-only) — has: markup tier, crew size
- Step 8: Permit & Fees (contractor-only) — has: permit, engineer fee
- Step 9: Extras & Subcontracting (contractor-only) — has: footing spec (helical piers, footing diameter), sub-footings toggle, demo/removal, 3D rendering, bid preview

## Target contractor step order (steps 0-8, 9 total):
- Step 0: Audience (shared) — unchanged
- Step 1: Region + Labor Market Tier (shared) — fix discoverability
- Step 2: Size (shared) — unchanged
- Step 3: Material (shared) — unchanged
- Step 4: Complexity (shared) — unchanged
- Step 5: Framing + Sub-footings + Footing spec — MOVE footing spec & sub-footings FROM step 9
- Step 6: Railing (already has post mount, post spacing, railing height — they're already there!)
- Step 7: Markup & Crew + Demo/removal — MOVE demo/removal FROM step 9
- Step 8: Permit & Fees + 3D rendering — MOVE 3D rendering FROM step 9, REMOVE step 9

## Changes needed:
- [x] Railing spec (post mount, post spacing, railing height) — ALREADY on Railing step! No move needed.
- [ ] Move footing spec (helical piers + footing diameter) from step 9 → step 5 (Framing)
- [ ] Move sub-footings toggle from step 9 → step 5 (Framing)
- [ ] Move demo/removal from step 9 → step 7 (Markup & Crew)
- [ ] Move 3D rendering from step 9 → step 8 (Permit & Fees)
- [ ] Remove step 9 entirely, update step count from 10 to 9
- [ ] Update step labels array (remove "Extras")
- [ ] Fix Region step: add scroll indicator for Labor Market Tier
- [ ] Update goNext/goBack navigation for contractor (was 10 steps, now 9)
- [ ] Update any "See My Estimate" button label (was on step 9, now on step 8)
- [ ] TypeScript check after each move

---

# Impeccable Improvement Passes

## Pass 1: /impeccable typeset — Emoji → Lucide icons + visual vocabulary
- [ ] Replace audience card emoji (🏡 🔨 📋) with Lucide icons (Home, Wrench, ClipboardList)
- [ ] Replace permit card emoji (🚫 🏘️ 🏡 🏙️ ☀️) with Lucide icons (Ban, MapPin, Home, Building2, Sun)
- [ ] Replace material card emoji (🏆 🔧) with Lucide icons (Award, Wrench)
- [ ] Replace tariff note emoji (⚠️) with Lucide AlertTriangle icon
- [ ] Check for any other stray emoji in Home.tsx, MaterialTakeoff.tsx, ShapeBuilder.tsx

## Pass 2: /impeccable layout — Fix wasted space + wizard container
- [ ] Remove excess bottom padding on Step 1 audience selector
- [ ] Add contextual "Why this matters" note below each step's cards
- [ ] Fix gray-on-color contrast issues in MaterialTakeoff.tsx (text-slate-400 on bg-amber-500)
- [ ] Fix gray-on-color in ShapeBuilder.tsx (text-slate-900 on bg-amber-500)
- [ ] Replace bg-black in shadcn overlays with navy surface color

## Pass 3: /impeccable clarify — Plain-language tooltips for homeowner jargon
- [ ] Add tooltip for "frost depth" on homeowner path
- [ ] Add tooltip for "labor multiplier" on results page
- [ ] Add tooltip for "climate premium" on results page
- [ ] Simplify "PT installed est." label on deck size cards for homeowners
- [ ] Rename "IMPORTANT DISCLAIMER" → "About This Estimate"
- [ ] Remove/hide "Dev: jump to contractor estimate" button

## Pass 4: /impeccable adapt — Clickable progress bar dots
- [ ] Make completed step dots clickable (navigate back to that step)
- [ ] Add visual affordance (cursor-pointer, hover state) to completed dots

## Pass 5: /impeccable colorize — Remap chart colors to audience-accent scale
- [ ] Remap cost breakdown bar chart colors to monochromatic amber scale for homeowners
- [ ] Remap for emerald (DIYer) and blue (contractor) paths
