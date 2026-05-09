# Product

## Register

product

## Users

Three co-equal audiences, each with their own workflow branch:

- **Homeowners** hiring a contractor. Context: researching costs before getting quotes, often on mobile, want a number they can trust and show to a contractor. Primary job: get a credible ballpark fast.
- **DIYers** doing the work themselves. Context: planning a project, want materials + permit cost. Primary job: understand what they'll spend before committing.
- **Contractors** bidding a project. Context: desktop or tablet, want full markup, crew, margin analysis, and a material takeoff they can hand to a supplier. Primary job: build an accurate bid quickly.

All three audiences are equally important. Design decisions must not privilege one at the expense of another. The tool already branches by audience — lean into that.

## Product Purpose

DeckCost 2026 is a standalone public estimating tool that calculates localized deck building costs using real 2026 pricing data (materials, labor, regional rates, tariff impacts). It serves homeowners, DIYers, and contractors from a single URL. Success means: a user completes the wizard, trusts the number they see, and either shares it, saves it, or acts on it.

## Brand Personality

Precise, trustworthy, user-friendly.

Voice: direct and informative, never salesy. Tone: confident without being cold. The tool should feel like it was built by someone who actually builds decks — not a generic SaaS product, not a lead-gen form, not a home improvement blog.

Anti-pattern: "vibe-coded" — no generic AI aesthetics, no purple gradients, no glassmorphism, no hero-metric templates, no identical card grids. The interface should feel deliberate and hand-crafted, like it has its own identity.

## Anti-references

- Generic home improvement lead-gen sites (HomeAdvisor, Angi) — feel cheap and untrustworthy
- Generic SaaS purple/blue gradient tools — feel like every other AI product
- Consumer-warm "lifestyle" home brands — too soft for the contractor audience
- Anything that looks like it was assembled from a template without thought

## Design Principles

1. **Data earns trust.** Every number shown should feel sourced and defensible. Show the reasoning (regional multiplier, tariff note, material tier) so users understand where the estimate comes from.
2. **The tool adapts to the user, not the other way around.** The three audience branches exist so each user sees only what's relevant to them. Never show contractor-level complexity to a homeowner.
3. **Density without overwhelm.** Contractors need data-dense output. Homeowners need clarity. The design must handle both — use progressive disclosure, not simplification.
4. **Own its identity.** The interface should not look like any recognizable category of tool. It is a precision instrument for a specific trade, and it should feel that way.
5. **Finish what you start.** Every state — loading, empty, error, saved, shared — should be designed, not left as a fallback.

## Accessibility & Inclusion

- WCAG AA minimum. High contrast text on dark backgrounds is already the baseline.
- Reduced motion: respect `prefers-reduced-motion` for all count-up animations and step transitions.
- Touch-first on mobile: the ShapeBuilder and all interactive controls must be usable with a finger, not just a mouse.
- No color-only information: all status indicators must have a label or icon alongside the color.
