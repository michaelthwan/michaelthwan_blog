---
title: "The AI Investment War"
subtitle: "An interactive map of who owns whom, who pays whom, and why a trillion dollars keeps going in circles."
authors:
  - "Michael Wan"
affiliations:
  - "Independent Analysis"
published: "2026-07-01"
abstract: "By mid-2026, the AI industry has organized itself into four layers — applications, models, compute, and silicon — stitched together by a dense web of equity stakes and hundred-billion-dollar supply contracts. The striking feature is not the size of any one deal but the circularity: a chipmaker invests in a lab, the lab pays a cloud, the cloud buys the chips. This interactive map lets you trace every major deal — click a company to see its full position in the war, or click an arrow for the terms — and the essay decodes the deal structures and asks what would tell the bulls from the bears."
tags:
  - "explainer"
  - "interactive"
category: "business"
thumbnail: "/img/ai-war/thumbnail.svg"
---

<style>
  /* ── AI-war essay accents (scoped, prefix aw-) ── */
  .aw-callout {
    border-left: 3px solid; border-radius: 0 6px 6px 0;
    padding: 12px 15px; margin: 22px 0; font-size: 0.92rem; line-height: 1.6;
  }
  .aw-callout-eq   { border-color: #7e57c2; background: #f4f0fb; color: #4527a0; }
  .aw-callout-co   { border-color: #3d9970; background: #eefaf3; color: #1b5e3f; }
  .aw-callout-note { border-color: #6366f1; background: #eef2ff; color: #3730a3; }
  .aw-callout-bull { border-color: #3d9970; background: #eefaf3; color: #1b5e3f; }
  .aw-callout-bear { border-color: #c0392b; background: #fdeeec; color: #922b21; }

  /* Deal-type badge pills */
  .aw-badge { display: inline-block; font-size: 0.66rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.02em; white-space: nowrap; }
  .aw-badge-eq    { background: #ece3f8; color: #4527a0; }
  .aw-badge-co    { background: #d9f2e4; color: #1b5e3f; }
  .aw-badge-infra { background: #dceafe; color: #1e40af; }
  .aw-badge-mix   { background: #fdecd2; color: #92400e; }

  /* Stat row */
  .aw-stats { display: flex; gap: 12px; flex-wrap: wrap; margin: 24px 0; }
  .aw-stat { flex: 1; min-width: 120px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; text-align: center; background: #f9fafb; }
  .aw-stat-val { font-size: 1.5rem; font-weight: 800; color: #111827; line-height: 1.05; }
  .aw-stat-label { font-size: 0.68rem; color: #9ca3af; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.3; }

  /* Circular-loop flow */
  .aw-loop { display: flex; flex-wrap: wrap; align-items: stretch; gap: 8px; margin: 22px 0; }
  .aw-loop-step { flex: 1; min-width: 150px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; background: #fff; }
  .aw-loop-step .aw-loop-n { font-size: 0.68rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
  .aw-loop-step .aw-loop-t { font-size: 0.9rem; font-weight: 700; color: #111827; margin: 3px 0; }
  .aw-loop-step .aw-loop-d { font-size: 0.82rem; color: #6b7280; line-height: 1.45; }
  .aw-loop-arrow { align-self: center; color: #b7a4dd; font-weight: 700; font-size: 1.1rem; }

  /* Deal-structure definition cards */
  .aw-defs { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 22px 0; }
  @media (max-width: 640px) { .aw-defs { grid-template-columns: 1fr; } .aw-loop-arrow { display: none; } }
  .aw-def { border: 1px solid #e5e7eb; border-radius: 8px; padding: 13px 15px; background: #f9fafb; }
  .aw-def-name { font-size: 0.86rem; font-weight: 700; color: #111827; margin-bottom: 4px; }
  .aw-def-desc { font-size: 0.83rem; color: #4b5563; line-height: 1.5; }
</style>

Money in AI no longer flows in one direction. Chipmakers invest in the labs that buy their chips. Clouds invest in the labs that rent their servers. Labs pay their own shareholders hundreds of billions for compute — and are sometimes paid back in their supplier's stock. The result is a web of dependencies unlike anything in tech history, and one property runs through all of it: **the same capital keeps changing hands**.

That circularity is the through-line of this piece. Follow any large arrow far enough and it tends to loop back to where it started. Whether that loop is a flywheel or a trap depends on one number — real end-user demand — that no contract can manufacture.

The map below reconstructs the web as of July 2026. It follows the structure of the industry itself: four horizontal layers, from consumer applications at the top down to the silicon everything runs on.

## The four layers

The industry stacks into four tiers, and almost every deal on the map is a wire between two of them.

- **Application** — where users meet AI: ChatGPT, Claude, Gemini, Llama-powered products, Grok.
- **Model** — the frontier labs training foundation models. This is where capital pools.
- **Compute** — hyperscaler clouds and dedicated data-center projects: Azure, AWS, Google Cloud, Oracle, Stargate, Colossus.
- **Silicon** — the chips underneath: Nvidia and AMD GPUs, Broadcom-built custom accelerators, Google's TPU, Amazon's Trainium.

<div class="aw-stats">
  <div class="aw-stat"><div class="aw-stat-val">4</div><div class="aw-stat-label">Industry layers</div></div>
  <div class="aw-stat"><div class="aw-stat-val">2</div><div class="aw-stat-label">Capital vortexes (OpenAI, Anthropic)</div></div>
  <div class="aw-stat"><div class="aw-stat-val">$500B</div><div class="aw-stat-label">Largest single project (Stargate)</div></div>
  <div class="aw-stat"><div class="aw-stat-val">$5.2T</div><div class="aw-stat-label">Nvidia market cap, the hub</div></div>
</div>

## The map

<div class="aiw-wrap">
  <div class="aiw-controls" id="aiw-controls"></div>
  <div class="aiw-scroll"><div class="aiw-diagram" id="aiw-diagram"></div></div>
  <div class="aiw-panel" id="aiw-panel"></div>
</div>

**How to read it.** <span class="aiw-inline-eq">Purple arrows</span> are equity: the arrow points from the shareholder to the company it owns a piece of. <span class="aiw-inline-co">Green arrows</span> are commercial contracts: the arrow points from the customer to the supplier it pays. In both cases, **arrows follow the money**. Click a company to isolate every deal it touches; click an arrow for the terms; use the toggles to show equity or contracts alone.

<div class="aw-callout aw-callout-note">
  <strong>Read the map twice.</strong> First follow only the purple arrows — that is the ownership graph, who is exposed to whom. Then follow only the green — that is the revenue graph, who is paying whom. The circularity this essay is about is what you see when the two graphs point at the same pairs of companies.
</div>

## The model layer: two capital vortexes

Nearly every dollar on the map is ultimately pulled toward one of two labs. They raised the most, and they committed the most — often to the very investors who funded them.

**OpenAI** converted its Microsoft partnership into a formal 27% stake during its October 2025 restructuring, then went on a spending spree that dwarfs the money it raised: **$300B** to Oracle, **$250B** to Azure, 10 GW of custom chips from Broadcom, and 6 GW of GPUs from AMD. Nvidia committed up to **$100B** in return for 10 GW of its own systems. The most unusual deal runs backwards: AMD granted OpenAI warrants for roughly 10% of *AMD itself*, vesting as OpenAI deploys AMD hardware — a supplier paying its customer in equity to win the order.

**Anthropic** built the opposite structure: instead of one anchor partner, it took money from three rival hyperscalers. Amazon invested **$13B** with **$20B** more pledged; Google committed up to **$40B**; and in January 2026, Microsoft and Nvidia added roughly **$15B** at a **$350B** valuation. Each investment came bundled with a spending commitment flowing back — over **$100B** to AWS, **$200B** to Google Cloud, and about **$30B** to Azure. By mid-2026 Anthropic had raised again at a **$965B** valuation, with memory-chip makers Samsung, Micron, and SK Hynix joining the cap table.

The shapes differ, but the mechanic is the same: **money arrives as investment and leaves as a compute bill, often to the same counterparty**. That is the pattern worth decoding before reading the rest of the map.

## The deal structures, decoded

The headline numbers hide four repeating financial structures. Naming them makes the whole map legible.

<div class="aw-defs">
  <div class="aw-def">
    <div class="aw-def-name">Equity stake</div>
    <div class="aw-def-desc">An investor buys shares in a lab. Cash in now; a claim on future value. Microsoft's 27% of OpenAI and Google's up-to-$40B of Anthropic are the anchors. Most of this equity is <em>private</em> — its value is whatever the last round said it was.</div>
  </div>
  <div class="aw-def">
    <div class="aw-def-name">Compute commitment</div>
    <div class="aw-def-desc">A lab promises to spend a fixed sum on a cloud over years — OpenAI's $300B to Oracle, Anthropic's $200B to Google Cloud. These are the largest arrows on the map, and they are contracts, not booked revenue: multi-year and milestone-gated.</div>
  </div>
  <div class="aw-def">
    <div class="aw-def-name">Vendor financing (equity for orders)</div>
    <div class="aw-def-desc">The supplier funds the customer that will buy its product. Nvidia's up-to-$100B into OpenAI is the clearest case: the cash returns as GPU purchase orders. It grows revenue, but the revenue is partly the vendor's own capital cycled forward.</div>
  </div>
  <div class="aw-def">
    <div class="aw-def-name">Warrants (customer paid in supplier stock)</div>
    <div class="aw-def-desc">The rarest and strangest: AMD gave OpenAI warrants for ~10% of AMD, vesting as OpenAI deploys AMD chips. The buyer is paid in the seller's equity to choose that seller — a bid to break Nvidia's lock, priced in ownership.</div>
  </div>
</div>

Why do deals take these shapes rather than plain cash-for-goods? Because compute is scarce and trust is expensive. A lab that commits $200B of future spend gets priority access to capacity that would otherwise be rationed. A cloud that pre-sells that capacity can borrow against the backlog to build the data centers. A chipmaker that takes equity in its customers locks in demand and shares the upside if the bet pays off. **Every structure trades cash flexibility today for a binding claim on the AI build-out tomorrow** — which is exactly why they interlock into loops.

## The compute layer: everyone builds, everyone rents

The compute layer is where the biggest absolute numbers live. Stargate — the **$500B** venture owned by SoftBank, OpenAI, Oracle, and MGX — plans roughly 7 GW of capacity across the US, UAE, Norway, and Argentina. Oracle, a founding equity partner, is also its lead builder, and OpenAI's **$300B** contract transformed Oracle's cloud business overnight — while forcing Oracle to borrow heavily to pour the concrete.

The strangest compute story is Colossus. After SpaceX absorbed xAI in February 2026, it began renting out its Memphis supercomputer like real estate: the entire 300 MW, 220,000-GPU Colossus 1 site went to *Anthropic* — a direct competitor of xAI's Grok — for **$1.25B** a month, while Google signed up for **$920M** per month of capacity through 2029. **Even the fiercest rivals in the model layer are customers of each other one layer down.** Compute is fungible; brand loyalty stops at the rack.

## The silicon layer: Nvidia's money boomerang

Nvidia sits at the bottom of the map and touches nearly every arrow above it. Its investment portfolio — up to **$100B** in OpenAI, ~**$10B** in Anthropic, **$2B** in xAI, **$5B** in Intel — reads like a list of its own largest customers. **Money leaves Nvidia as equity and returns as GPU purchase orders.** That round trip is the single most-discussed loop on the map.

The counterweight is Broadcom, the quiet winner of the war. It co-designs Google's TPUs (a long-term agreement running through 2031), builds Meta's custom accelerators through 2029, and is producing 10 GW of custom chips for OpenAI. Its overall AI revenue is projected near **$46B** for 2026. Every hyperscaler's plan to *reduce* Nvidia dependence runs through Broadcom — which is why Broadcom wins no matter who wins the model layer.

## The circularity problem

Follow the purple and green arrows in a loop and the concern becomes concrete. Here is the canonical example, one step at a time:

<div class="aw-loop">
  <div class="aw-loop-step">
    <div class="aw-loop-n">Step 1 · equity</div>
    <div class="aw-loop-t">Nvidia → OpenAI</div>
    <div class="aw-loop-d">Nvidia invests up to $100B as OpenAI deploys Nvidia systems.</div>
  </div>
  <div class="aw-loop-arrow">→</div>
  <div class="aw-loop-step">
    <div class="aw-loop-n">Step 2 · compute</div>
    <div class="aw-loop-t">OpenAI → Oracle</div>
    <div class="aw-loop-d">OpenAI pays Oracle $300B over five years for cloud capacity.</div>
  </div>
  <div class="aw-loop-arrow">→</div>
  <div class="aw-loop-step">
    <div class="aw-loop-n">Step 3 · hardware</div>
    <div class="aw-loop-t">Oracle → Nvidia</div>
    <div class="aw-loop-d">Oracle spends much of that building data centers full of Nvidia GPUs.</div>
  </div>
</div>

Revenue is real at every step, and each company can book it honestly. But a meaningful share of the industry's growth is **the same capital circulating between a handful of balance sheets**. Cloud providers report record AI revenue partly funded by their own investments; investors mark up stakes in labs whose spending commitments they underwrite. The loop is not fraud — it is leverage. It amplifies whatever is happening underneath it.

<div class="aw-callout aw-callout-note">
  <strong>The loop amplifies the truth, it does not create it.</strong> If real end-user demand — the money entering at the <em>top</em> of the map — grows into these commitments, the flywheel compounds and every markup is justified. If it doesn't, the same interconnections that accelerated the boom become the channels through which losses propagate. The map is neutral; the demand is the verdict.
</div>

## Bull and bear: two readings of the same map

The same web supports opposite conclusions. What separates them is not the deals — everyone sees the same arrows — but a bet on demand and on how binding the commitments really are.

<div class="aw-callout aw-callout-bull">
  <strong>The bull reading: this is a coordinated build-out, not a bubble.</strong> Compute is a genuine bottleneck, and pre-committing capital is how you get scarce capacity built at all. Vendor financing pulls forward data centers that would otherwise take years to fund. The labs' revenue is growing fast enough to grow into the contracts. The loops are just vertical integration expressed through contracts instead of mergers — rational, and reversible if demand softens because most spend is milestone-gated.
</div>

<div class="aw-callout aw-callout-bear">
  <strong>The bear reading: circular capital is inflating everyone's numbers at once.</strong> A vendor that funds its customers manufactures its own demand; a cloud that pre-sells capacity to a startup it partly owns is booking revenue against its own balance sheet. Private valuations are marked to the last round, not to cash flow. If end-user demand disappoints, milestone-gated commitments get cut in unison, and the markups reverse across the whole cluster at the same time — because the same dollars backed all of them.
</div>

**What would tell them apart?** Each reading makes falsifiable predictions worth watching:

- **Watch the top of the map.** If application-layer revenue (subscriptions, API usage, ads on AI products) keeps compounding, the bull wins by default. If it stalls while compute commitments keep growing, the gap is the bubble.
- **Watch whether commitments convert to cash.** These are multi-year, milestone-contingent numbers. If reported cloud revenue tracks the headline contracts, the deals are real; if the contracts quietly shrink or slip, they were optionality dressed as demand.
- **Watch the private marks.** A down-round at OpenAI or Anthropic would ripple through every investor that holds them — the clearest single signal that the loop has started running in reverse.
- **Watch Nvidia's concentration.** The more of Nvidia's growth traces back to companies Nvidia funded, the more the boomerang, not new buyers, is driving the number.

## Key numbers

<div class="d-table-wrapper">

| Deal | Type | Scale |
|---|---|---|
| Microsoft → OpenAI | <span class="aw-badge aw-badge-eq">Equity</span> | 27% stake (≈$135B) |
| Nvidia → OpenAI | <span class="aw-badge aw-badge-eq">Equity</span> | up to $100B (vendor-financed) |
| OpenAI → Oracle | <span class="aw-badge aw-badge-co">Compute</span> | $300B / 5 years |
| OpenAI → Microsoft Azure | <span class="aw-badge aw-badge-co">Compute</span> | $250B |
| Stargate (SoftBank, OpenAI, Oracle, MGX) | <span class="aw-badge aw-badge-infra">Infrastructure</span> | $500B target |
| Google → Anthropic | <span class="aw-badge aw-badge-eq">Equity</span> | up to $40B |
| Amazon → Anthropic | <span class="aw-badge aw-badge-eq">Equity</span> | $13B + $20B pledged |
| Anthropic → Google Cloud | <span class="aw-badge aw-badge-co">Compute</span> | $200B / 5 years |
| Anthropic → AWS | <span class="aw-badge aw-badge-co">Compute</span> | $100B+ / decade |
| Microsoft + Nvidia → Anthropic | <span class="aw-badge aw-badge-eq">Equity</span> | ≈$15B |
| OpenAI ↔ AMD | <span class="aw-badge aw-badge-mix">Supply + equity</span> | 6 GW; warrants ≈10% of AMD |
| Anthropic → SpaceX (Colossus 1) | <span class="aw-badge aw-badge-co">Compute</span> | $1.25B / month |
| Google → SpaceX (Colossus) | <span class="aw-badge aw-badge-co">Compute</span> | $920M / month |
| Meta capex 2026 | <span class="aw-badge aw-badge-infra">Infrastructure</span> | $125–145B |

</div>

*Figures reflect public reporting as of July 2026. Committed amounts are multi-year and often milestone-contingent — treat them as order-of-magnitude, not booked revenue. Private valuations are last-round marks, not cash-flow-based. The map is a snapshot; deals of this size change monthly.*

<script src="/js/ai-war-map.js"></script>
