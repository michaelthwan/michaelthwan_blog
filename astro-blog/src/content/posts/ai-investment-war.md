---
title: "The AI Investment War"
subtitle: "An interactive map of who owns whom, who pays whom, and why a trillion dollars is going in circles."
authors:
  - "Michael Wan"
affiliations:
  - "Independent Analysis"
published: "2026-07-01"
abstract: "By mid-2026, the AI industry has organized itself into four layers — applications, models, compute, and silicon — stitched together by a dense web of equity stakes and hundred-billion-dollar supply contracts. This interactive map lets you trace every major deal: click a company to see its full position in the war, or click an arrow for the terms of a specific deal."
tags:
  - "explainer"
  - "interactive"
category: "business"
thumbnail: "/img/ai-war/thumbnail.svg"
---

Money in AI no longer flows in one direction. Chipmakers invest in the labs that buy their chips. Clouds invest in the labs that rent their servers. Labs pay their own shareholders hundreds of billions for compute — and sometimes get paid in their supplier's stock. The result is a web of dependencies unlike anything in tech history.

The map below reconstructs that web as of July 2026. It follows the structure of the industry itself: four horizontal layers, from consumer applications at the top down to the silicon everything runs on.

## The map

<div class="aiw-wrap">
  <div class="aiw-controls" id="aiw-controls"></div>
  <div class="aiw-scroll"><div class="aiw-diagram" id="aiw-diagram"></div></div>
  <div class="aiw-panel" id="aiw-panel"></div>
</div>

**How to read it.** <span class="aiw-inline-eq">Purple arrows</span> are equity: the arrow points from the shareholder to the company it owns a piece of. <span class="aiw-inline-co">Green arrows</span> are commercial contracts: the arrow points from the customer to the supplier it pays. In both cases, arrows follow the money.

The four layers:

- **Application** — where users meet AI: ChatGPT, Claude, Gemini, Llama-powered products, Grok.
- **Model** — the frontier labs training foundation models.
- **Compute** — hyperscaler clouds and dedicated data-center projects (Azure, AWS, Google Cloud, Oracle, Stargate, Colossus).
- **Silicon** — the chips underneath: Nvidia and AMD GPUs, Broadcom-built custom accelerators, Google's TPU, Amazon's Trainium.

## The model layer: two capital vortexes

Nearly every dollar on the map is ultimately pulled toward one of two labs.

**OpenAI** converted its Microsoft partnership into a formal 27% stake during its October 2025 restructuring, then went on a spending spree that dwarfs the money it raised: **$300B** to Oracle, **$250B** to Azure, 10 GW of custom chips from Broadcom, and 6 GW of GPUs from AMD. Nvidia committed up to **$100B** in return for 10 GW of its own systems. The most unusual deal runs backwards: AMD granted OpenAI warrants for roughly 10% of *AMD itself*, vesting as OpenAI deploys AMD hardware — a supplier paying its customer in equity to win the order.

**Anthropic** built the opposite structure: instead of one anchor partner, it took money from three rival hyperscalers. Amazon invested **$13B** with **$20B** more pledged; Google committed up to **$40B**; and in January 2026, Microsoft and Nvidia added roughly **$15B** at a **$350B** valuation. Each investment came bundled with a spending commitment flowing back — over **$100B** to AWS, **$200B** to Google Cloud, and about **$30B** to Azure. By mid-2026 Anthropic had raised again at a **$965B** valuation, with memory-chip makers Samsung, Micron, and SK Hynix joining the cap table.

## The compute layer: everyone builds, everyone rents

The compute layer is where the biggest absolute numbers live. Stargate — the **$500B** venture owned by SoftBank, OpenAI, Oracle, and MGX — plans roughly 7 GW of capacity across the US, UAE, Norway, and Argentina. Oracle, a founding equity partner, is also its lead builder, and OpenAI's **$300B** contract transformed Oracle's cloud business overnight.

The strangest compute story is Colossus. After SpaceX absorbed xAI in February 2026, it began renting out its Memphis supercomputer like real estate: the entire 300 MW, 220,000-GPU Colossus 1 site went to *Anthropic* — a direct competitor of xAI's Grok — for **$1.25B** a month, while Google signed up for **$920M** per month of capacity through 2029. Even the fiercest rivals in the model layer are customers of each other one layer down.

## The silicon layer: Nvidia's money boomerang

Nvidia sits at the bottom of the map and touches nearly every arrow above it. Its investment portfolio — up to **$100B** in OpenAI, ~**$10B** in Anthropic, **$2B** in xAI, **$5B** in Intel — reads like a list of its own largest customers. Money leaves Nvidia as equity and returns as GPU purchase orders.

The counterweight is Broadcom, the quiet winner of the war. It co-designs Google's TPUs (a long-term agreement running through 2031), builds Meta's custom accelerators through 2029, and is producing 10 GW of custom chips for OpenAI. Its overall AI revenue is projected near **$46B** for 2026. Every hyperscaler's plan to *reduce* Nvidia dependence runs through Broadcom.

## The circularity problem

Follow the purple and green arrows in a loop and the concern becomes visible:

1. Nvidia invests up to $100B in OpenAI.
2. OpenAI pays Oracle $300B for compute.
3. Oracle spends much of that on Nvidia GPUs.

Revenue is real at every step, but a meaningful share of the industry's growth is the same capital circulating between a handful of balance sheets. Cloud providers book record AI revenue partly funded by their own investments; investors mark up stakes in labs whose spending commitments they underwrite. If end-user demand — the money entering at the *top* of the map — grows into these commitments, the flywheel compounds. If it doesn't, the same interconnections that accelerated the boom become the channels through which losses propagate.

## Key numbers

| Deal | Type | Scale |
|---|---|---|
| Microsoft → OpenAI | Equity | 27% stake (≈$135B) |
| Nvidia → OpenAI | Equity | up to $100B |
| OpenAI → Oracle | Compute | $300B / 5 years |
| OpenAI → Microsoft Azure | Compute | $250B |
| Stargate (SoftBank, OpenAI, Oracle, MGX) | Infrastructure | $500B target |
| Google → Anthropic | Equity | up to $40B |
| Amazon → Anthropic | Equity | **$13B** + **$20B** pledged |
| Anthropic → Google Cloud | Compute | $200B / 5 years |
| Anthropic → AWS | Compute | $100B+ / decade |
| Microsoft + Nvidia → Anthropic | Equity | ≈$15B |
| OpenAI ↔ AMD | Supply + equity | 6 GW; warrants ≈10% of AMD |
| Anthropic → SpaceX (Colossus 1) | Compute | $1.25B / month |
| Google → SpaceX (Colossus) | Compute | $920M / month |
| Meta capex 2026 | Infrastructure | $125–145B |

*Figures reflect public reporting as of July 2026. Committed amounts are multi-year and often milestone-contingent — treat them as order-of-magnitude, not booked revenue.*

<script src="/js/ai-war-map.js"></script>
