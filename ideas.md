# Deck Cost Calculator — Design Brainstorm

## Response A
<response>
<text>
**Design Movement:** Industrial Craftsman — the aesthetic of a skilled tradesperson's workshop: raw materials, honest construction, purposeful tools.

**Core Principles:**
- Warm neutrals and wood-grain textures ground the interface in the physical world of deck building
- Asymmetric two-column layout: a persistent "configurator" panel on the left, a live estimate panel on the right
- Typography is functional and bold — no decorative flourishes, just clear hierarchy
- Every UI element feels like a physical control: toggles, sliders, and selectors that feel tangible

**Color Philosophy:** Deep walnut brown (#3D2B1F) as the primary surface, warm off-white (#F5EFE6) for text, amber (#D97706) as the accent. The palette evokes raw lumber, sawdust, and the warmth of a well-built outdoor space.

**Layout Paradigm:** Split-panel. Left: a scrollable step-by-step configurator (audience → region → size → materials). Right: a sticky live estimate card that updates in real time with an animated cost breakdown bar chart.

**Signature Elements:**
- Wood-grain CSS texture on section headers
- Amber "cost pill" badges on material options showing $/sq ft
- A horizontal "budget spectrum" bar showing where the user's estimate lands between low/mid/high

**Interaction Philosophy:** Each selection immediately updates the estimate — no "calculate" button. The estimate panel animates smoothly on every change.

**Animation:** Slide-in entrance for the configurator steps; number-count animation on the estimate total; subtle fade on cost breakdown bars.

**Typography System:** `Playfair Display` (bold, display) for headings + `IBM Plex Mono` for cost figures + `Inter` for body labels.
</text>
<probability>0.07</probability>
</response>

## Response B
<response>
<text>
**Design Movement:** Precision Engineering — the aesthetic of a technical instrument or a high-end SaaS dashboard. Clean, data-forward, authoritative.

**Core Principles:**
- Dark slate background (#0F172A) with sharp white typography creates authority and focus
- The calculator is a single-page wizard: audience selector → project inputs → material tier → region → instant results
- Data is the hero: cost tables, bar charts, and itemized breakdowns are visually prominent
- Generous whitespace between sections prevents cognitive overload

**Color Philosophy:** Deep navy (#0F172A) base, electric amber (#F59E0B) as the primary accent for CTAs and highlights, cool slate (#64748B) for secondary text. The palette reads as "professional tool" not "consumer website."

**Layout Paradigm:** Vertical wizard with a sticky progress indicator at the top. Each step slides in from the right. Results appear in a full-width panel below the wizard with a recharts bar chart breaking down costs by category.

**Signature Elements:**
- Amber-bordered "active selection" cards for material tiers
- A "Regional Cost Multiplier" badge that updates live (e.g., "1.42× — Northeast")
- A three-column comparison table at the bottom showing Budget PT / Mid Composite / Premium PVC side by side

**Interaction Philosophy:** Wizard-style with instant feedback. A persistent "Your Estimate" ticker in the top-right corner updates on every input change.

**Animation:** Step transitions use framer-motion slide + fade; the estimate ticker counts up/down on change; the cost breakdown bars animate in on reveal.

**Typography System:** `Space Grotesk` (bold, geometric) for headings + `JetBrains Mono` for cost figures + `Inter` for body.
</text>
<probability>0.08</probability>
</response>

## Response C
<response>
<text>
**Design Movement:** Warm Modernism — the visual language of a premium home improvement brand: clean structure, warm materials, human scale.

**Core Principles:**
- Light cream (#FAFAF7) background with warm stone accents creates an inviting, trustworthy feel
- The layout is a single scrolling page with distinct "zones": hero → audience selector → configurator → results → disclaimer
- Generous use of illustrated icons and material swatches makes abstract pricing tangible
- The tone is educational, not transactional — the tool teaches as it calculates

**Color Philosophy:** Warm cream (#FAFAF7) base, deep forest green (#1A3C34) as the primary brand color, terracotta (#C4622D) as the accent. Evokes outdoor living, natural materials, and craftsmanship.

**Layout Paradigm:** Horizontal card-grid configurator. Each configuration step is a horizontal row of selectable cards (audience type, region, size, material tier). Selected cards flip to show a detail view. Results appear in a sticky sidebar on desktop, a bottom sheet on mobile.

**Signature Elements:**
- Material tier cards with texture swatches (wood grain, composite pattern, PVC gloss)
- A "Tariff Alert" banner explaining the 2025 lumber price increase in plain language
- A "What's Included" accordion that maps each cost line to the report section it came from

**Interaction Philosophy:** Card-based selection feels like browsing a product catalog. No form fields — pure click/tap selection. The estimate updates live in the sidebar.

**Animation:** Card flip on selection; sidebar estimate slides in from right; cost bars animate in sequence on results reveal.

**Typography System:** `Fraunces` (serif, warm) for headings + `DM Mono` for cost figures + `DM Sans` for body.
</text>
<probability>0.06</probability>
</response>

---

## Selected Design: Response B — Precision Engineering

**Rationale:** The audience for this tool includes contractors and serious DIYers who want authoritative, data-dense output. A dark, precision-instrument aesthetic signals credibility and expertise. The wizard flow maps naturally to the sequential decision process (audience → region → size → materials → results), and the recharts breakdown makes the data visual and scannable. The amber accent on navy creates strong contrast and a distinctive identity without feeling generic.
