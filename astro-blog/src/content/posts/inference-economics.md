---
title: "The Collapsing Price of Intelligence"
subtitle: "LLM inference prices have fallen orders of magnitude in three years. Understanding why — and what it does to business models — matters more than any single benchmark."
authors:
  - "Michael Wan"
affiliations:
  - "Michael Wan Interactive Insights"
published: "2026-07-04"
abstract: "In March 2023, GPT-4 cost about $36 per million tokens. By 2025, models of comparable capability sold for under $0.50 — a decline of roughly 100x in under three years. This post decomposes the drivers behind the collapse, examines what serving actually costs, and explores why cheaper tokens paradoxically produce bigger AI bills."
tags:
  - "explainer"
category: "business"
thumbnail: "/img/inference-economics/thumbnail.svg"
---

<style>
  .ie-callout {
    border-left: 3px solid; border-radius: 0 6px 6px 0;
    padding: 11px 14px; margin: 20px 0; font-size: 0.92rem; line-height: 1.55;
  }
  .ie-callout-tip  { border-color: #10b981; background: #f0fdf4; color: #065f46; }
  .ie-callout-warn { border-color: #f59e0b; background: #fffbeb; color: #92400e; }
  .ie-callout-note { border-color: #6366f1; background: #eef2ff; color: #3730a3; }

  .ie-badge { display: inline-block; font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; white-space: nowrap; }
  .ie-badge-hw     { background: #dbeafe; color: #1e40af; }
  .ie-badge-algo   { background: #d1fae5; color: #065f46; }
  .ie-badge-market { background: #fef3c7; color: #92400e; }

  .ie-chart-wrap {
    position: relative; height: 380px; background: #ffffff;
    border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;
  }

  .ie-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; margin: 16px 0; }
  .ie-table th { text-align: left; padding: 8px 10px; border-bottom: 2px solid #d1d5db; font-weight: 600; }
  .ie-table td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }

  /* Calculator */
  .ie-calc {
    border: 1px solid #d1d5db; border-radius: 10px; padding: 20px 22px;
    margin: 24px 0; background: #fafafa;
  }
  .ie-calc h4 { margin: 0 0 4px 0; font-size: 1.02rem; }
  .ie-calc-desc { font-size: 0.85rem; color: #6b7280; margin: 0 0 16px 0; }
  .ie-control { margin: 12px 0; }
  .ie-control label { display: block; font-size: 0.82rem; font-weight: 600; color: #374151; margin-bottom: 4px; }
  .ie-control input[type="range"] { width: 100%; accent-color: #2563eb; }
  .ie-control select {
    width: 100%; padding: 7px 9px; font-size: 0.88rem; border: 1px solid #d1d5db;
    border-radius: 6px; background: #ffffff; color: #111827; font-family: inherit;
  }
  .ie-control-val { font-weight: 700; color: #2563eb; font-variant-numeric: tabular-nums; }
  .ie-tier-note { font-size: 0.78rem; color: #6b7280; margin-top: 4px; }

  .ie-results { display: flex; gap: 14px; flex-wrap: wrap; margin: 18px 0 6px 0; }
  .ie-stat {
    flex: 1; min-width: 140px; background: #ffffff; border: 1px solid #e5e7eb;
    border-radius: 8px; padding: 12px 14px; text-align: center;
  }
  .ie-stat-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; margin-bottom: 3px; }
  .ie-stat-value { font-size: 1.45rem; font-weight: 700; color: #111827; font-variant-numeric: tabular-nums; }

  .ie-eras { margin-top: 18px; }
  .ie-eras-title { font-size: 0.82rem; font-weight: 600; color: #374151; margin-bottom: 8px; }
  .ie-era-row { display: grid; grid-template-columns: 130px 1fr 84px; align-items: center; gap: 10px; margin: 7px 0; font-size: 0.85rem; }
  .ie-era-label { color: #4b5563; }
  .ie-era-track { background: #e5e7eb; border-radius: 4px; height: 16px; overflow: hidden; }
  .ie-era-bar { height: 100%; border-radius: 4px; background: #9ca3af; transition: width 0.25s ease; }
  .ie-era-bar-now { background: #2563eb; }
  .ie-era-cost { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; color: #111827; }
  .ie-factor-line { font-size: 0.88rem; color: #374151; margin-top: 12px; }
  .ie-factor-line strong { color: #2563eb; }

  /* Dark mode: keep calculator readable */
  :root[data-theme="dark"] .ie-calc { background: #1f2430; border-color: #3a4150; }
  :root[data-theme="dark"] .ie-calc-desc, :root[data-theme="dark"] .ie-tier-note { color: #9aa3b2; }
  :root[data-theme="dark"] .ie-control label, :root[data-theme="dark"] .ie-eras-title { color: #c7cdd8; }
  :root[data-theme="dark"] .ie-stat { background: #262c3a; border-color: #3a4150; }
  :root[data-theme="dark"] .ie-stat-value, :root[data-theme="dark"] .ie-era-cost { color: #eceff4; }
  :root[data-theme="dark"] .ie-era-label { color: #aab2c0; }
  :root[data-theme="dark"] .ie-era-track { background: #3a4150; }
  :root[data-theme="dark"] .ie-control select { background: #262c3a; border-color: #3a4150; color: #eceff4; }

  @media (max-width: 560px) {
    .ie-era-row { grid-template-columns: 96px 1fr 72px; }
  }
</style>

<p class="d-note">
    All prices in this post are nominal USD list prices per million tokens, as published by the providers
    or collected by third-party trackers. "Comparable capability" claims are approximate — benchmarks
    disagree, and a 2025 model that matches GPT-4 on one task may not match it on another.
    Figures for 2026 model pricing come from aggregator sites and should be treated as indicative.
</p>

## The Headline Fact

In March 2023, OpenAI launched GPT-4 at **$30 per million input tokens and $60 per million output tokens**. Using the common 80/20 input-output blend, that is roughly $36 per million tokens — the going rate for state-of-the-art machine intelligence at the time.

By early 2025, Google's Gemini 2.0 Flash sold for **$0.10 input / $0.40 output** — and on most public benchmarks it matched or beat the original GPT-4. Blended, that is a price decline of roughly **200x in under two years** for a fixed level of capability. Even if you distrust benchmark equivalence and haircut the comparison aggressively, the decline is still two orders of magnitude.

This is not one company's pricing strategy. Epoch AI tracked the price of reaching fixed performance thresholds across many benchmarks and found declines of **9x to 900x per year** depending on the task, with a median around 50x per year — and the pace accelerated after January 2024. For the specific milestone of matching GPT-4 on PhD-level science questions, prices fell about 40x per year.

**No mainstream input has ever gotten cheaper this fast.** Transistors under Moore's law doubled per dollar every two years or so — about 1.4x per year. Solar panels fell about 20% per doubling of capacity. LLM inference at fixed capability is falling 10x to 100x per year. If you are building a business on top of this input, the price you pay today is trivia; the trajectory is the whole game.

<div class="ie-callout ie-callout-note">
  <strong>Capability-adjusted price is the number that matters.</strong> Frontier prices (the newest, best model) have stayed roughly flat — $30–$60 blended per million tokens buys the best available model in 2023 and in 2026. What collapses is the price of <em>yesterday's</em> frontier. The frontier is a price umbrella; everything under it is in free fall.
</div>

## Why Prices Collapse

The collapse is over-determined — several independent forces each contribute a multiple, and they compound. Here are the main drivers, with rough magnitudes. The magnitudes are approximate and overlapping; they do not multiply cleanly.

<div class="d-table-wrapper">
<table class="ie-table">
  <thead>
    <tr>
      <th>Driver</th>
      <th>Type</th>
      <th>Rough contribution</th>
      <th>What it does</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>New GPU generations</strong></td>
      <td><span class="ie-badge ie-badge-hw">Hardware</span></td>
      <td>~2–4x per generation</td>
      <td>Hopper → Blackwell-class parts deliver several times more inference throughput per dollar, especially at low precision (FP8/FP4).</td>
    </tr>
    <tr>
      <td><strong>Quantization</strong></td>
      <td><span class="ie-badge ie-badge-algo">Algorithms</span></td>
      <td>~2–4x</td>
      <td>Serving weights at 8-bit or 4-bit instead of 16-bit cuts memory and compute per token with small accuracy loss.</td>
    </tr>
    <tr>
      <td><strong>Distillation &amp; smaller models</strong></td>
      <td><span class="ie-badge ie-badge-algo">Algorithms</span></td>
      <td>~5–10x</td>
      <td>Training compact models on the outputs and data recipes of larger ones. A 2025 "flash"-class model matches a 2023 giant at a fraction of the parameters.</td>
    </tr>
    <tr>
      <td><strong>Mixture-of-experts sparsity</strong></td>
      <td><span class="ie-badge ie-badge-algo">Algorithms</span></td>
      <td>~3–10x</td>
      <td>Only a small fraction of parameters activate per token. DeepSeek V3 has 671B total parameters but activates ~37B per token.</td>
    </tr>
    <tr>
      <td><strong>Serving-stack engineering</strong></td>
      <td><span class="ie-badge ie-badge-algo">Algorithms</span></td>
      <td>~2–5x</td>
      <td>Continuous batching, paged KV caches, prompt caching, and speculative decoding raise GPU utilization from "embarrassing" to "respectable".</td>
    </tr>
    <tr>
      <td><strong>Competition</strong></td>
      <td><span class="ie-badge ie-badge-market">Market</span></td>
      <td>Compresses margins to the floor</td>
      <td>Open-weight models (Llama, DeepSeek, Qwen) let anyone with GPUs serve near-frontier capability. Undifferentiated tokens get priced near marginal cost.</td>
    </tr>
  </tbody>
</table>
</div>

A few of these deserve a sentence more.

**Hardware compounds slowly; algorithms compound fast.** GPU price-performance improves at Moore's-law-like rates — meaningful, but it explains maybe one of the ten-fold declines per two years. The rest is software: model architectures that need fewer FLOPs per unit of capability, and serving stacks that waste fewer of the FLOPs they have.

**Sparsity changed the pricing equation structurally.** A dense model pays for every parameter on every token. A mixture-of-experts model stores a large brain but consults only a sliver of it each step. This is why DeepSeek could serve a GPT-4-class model at roughly $0.27/$1.10 per million tokens in late 2024 — around a hundredth of GPT-4's launch price — and, by its own (disputed but directionally plausible) accounting, still run inference at a profit.

**Competition converts cost declines into price declines.** Falling cost alone does not force a price cut; competition does. Every provider knows that a customer's switching cost between "OpenAI-compatible API endpoints" is an afternoon of engineering. When an open-weight model reaches a capability tier, the price of that tier collapses to near the marginal cost of serving it, because dozens of hosting providers race each other down.

<div class="ie-callout ie-callout-tip">
  <strong>Rule of thumb: capability tiers, not models, are the unit of pricing.</strong> Within about 12–18 months of any capability level debuting at the frontier, an open-weight or "flash"-class model reaches it, and the price of that level drops by 10x or more. Plan procurement around the tier you need, not the model name.
</div>

## The Chart: Watching a Price Collapse

The chart below plots the blended (80% input / 20% output) list price for models at roughly GPT-4 capability, from GPT-4's launch to early 2025. The Y-axis is logarithmic — each gridline is a fixed multiple, so a straight line means a constant *rate* of collapse.

<div class="d-figure">
    <div class="d-figure-content ie-chart-wrap">
        <canvas id="ie-price-chart"></canvas>
    </div>
    <div class="d-figure-caption">
        <strong>Figure 1.</strong> Blended list price (80/20 input/output) per million tokens for GPT-4-class capability, 2023–2025, log scale. Points: GPT-4 launch ($30/$60, Mar 2023), GPT-4 Turbo ($10/$30, Nov 2023), GPT-4o launch ($5/$15, May 2024), GPT-4o after the October 2024 cut ($2.50/$10), DeepSeek V3 (~$0.27/$1.10, late 2024), Gemini 2.0 Flash ($0.10/$0.40, early 2025). Capability equivalence across vendors is approximate. <em>Hover any point for details.</em>
    </div>
</div>

Two things stand out. First, the line is close to straight on a log scale: the decline is exponential, not a one-off correction. Second, **the steepest segment comes from entrants, not incumbents** — the DeepSeek and Gemini Flash points are where the curve falls off a cliff. Incumbents cut prices along a schedule; competitors reset the schedule.

Where does it stand in 2026? Aggregator data (indicative, not official) puts the current frontier tier at $5/$25 (Claude Opus class) down to $1.75/$14 (GPT-5.2), mid-tier at around $3/$15, and economy tiers at $0.50/$3.00 (Gemini 3 Flash) down to $0.14/$0.28 (DeepSeek V4 Flash). The umbrella holds at the top; the floor keeps dropping.

## Price Is Not Cost: The Margin Debate

A price chart tells you what buyers pay. It does not tell you what serving costs — and that gap is one of the most consequential unknowns in the AI economy.

**What does a serving node actually cost?** Rough public numbers: an 8x H100 server costs roughly $200k–$400k to buy, or $2–$7 per GPU-hour to rent depending on provider and commitment; each H100 draws up to 700W under load, and cooling, facilities, and maintenance add materially on top. Against that cost, throughput is the whole story. A well-batched node serving a mid-size model can emit on the order of tens of thousands of tokens per second across concurrent requests; a badly utilized one, a hundredth of that.

That makes **utilization the hidden variable in every margin claim**. The same hardware serving the same model can imply a cost per million tokens that differs by 50x between a full batch at peak and an idle node at 3 a.m. This is why self-hosting analyses find you need thousands of conversations per day before running your own GPUs beats API prices: the APIs are pooling everyone's demand to keep batches full.

So are the labs selling below cost? Both narratives circulate, and honest observers admit the public evidence cannot settle it:

- **The bull case (prices are above marginal cost):** batched inference on modern hardware is genuinely cheap; DeepSeek published (contested) figures implying healthy margins at prices far below Western labs'; and the relentless price cuts look like cost pass-through, not deepening subsidy — you do not repeatedly cut prices on a product you lose money on unless costs fell first.
- **The bear case (prices are subsidized):** the labs are in a land-grab for developers and data, funded by tens of billions in venture and hyperscaler capital; free consumer tiers and flat-rate subscriptions are almost certainly served below cost for heavy users; and marginal cost excludes the training runs and datacenter buildouts, which someone eventually has to recoup.

The likely resolution is boring: **paid API tokens are probably gross-margin positive at the margin, while the businesses as a whole burn cash** on training, free tiers, and capacity built ahead of demand. But nobody outside the labs' finance teams knows, and every margin figure you read — including the ones above — is an estimate built on estimates.

<div class="ie-callout ie-callout-warn">
  <strong>Do not build a business plan on someone else's subsidy.</strong> If your unit economics only work at today's promotional pricing from a cash-burning provider, you have borrowed your margin from a venture fund. The safer bet is the trend: assume the <em>capability tier</em> you use keeps getting cheaper, but stress-test against your specific provider repricing, deprecating, or rate-limiting the model you depend on.
</div>

## Interactive: The Inference Cost Time Machine

Numbers per million tokens are abstract. What matters is your workload's monthly bill — and how violently that bill has changed across three years of pricing. Set up a workload below, pick a 2026 price tier, and see what the identical workload would have cost at 2023 and 2024 prices.

<div class="ie-calc" id="ie-calculator">
  <h4>Inference cost calculator</h4>
  <p class="ie-calc-desc">Monthly cost = requests/day × 30.4 × (input tokens × input price + output tokens × output price). List prices, no caching or volume discounts.</p>

  <div class="ie-control">
    <label>Requests per day: <span class="ie-control-val" id="ie-req-val">5,000</span></label>
    <input type="range" id="ie-req-slider" min="100" max="100000" step="100" value="5000">
  </div>

  <div class="ie-control">
    <label>Input tokens per request: <span class="ie-control-val" id="ie-in-val">2,000</span></label>
    <input type="range" id="ie-in-slider" min="100" max="20000" step="100" value="2000">
  </div>

  <div class="ie-control">
    <label>Output tokens per request: <span class="ie-control-val" id="ie-out-val">500</span></label>
    <input type="range" id="ie-out-slider" min="50" max="5000" step="50" value="500">
  </div>

  <div class="ie-control">
    <label>2026 model tier</label>
    <select id="ie-tier-select">
      <option value="frontier">Frontier (Opus / GPT-5.5 class) — $5 / $25</option>
      <option value="mid" selected>Mid-tier (Sonnet / Gemini 3 Pro class) — $3 / $15</option>
      <option value="economy">Economy (Gemini 3 Flash / Haiku class) — $0.50 / $3</option>
      <option value="ultra">Ultra-economy (DeepSeek Flash class) — $0.14 / $0.28</option>
    </select>
    <div class="ie-tier-note" id="ie-tier-note"></div>
  </div>

  <div class="ie-results">
    <div class="ie-stat">
      <div class="ie-stat-label">Tokens / month</div>
      <div class="ie-stat-value" id="ie-tokens-month">—</div>
    </div>
    <div class="ie-stat">
      <div class="ie-stat-label">Monthly cost (selected tier)</div>
      <div class="ie-stat-value" id="ie-cost-month">—</div>
    </div>
  </div>

  <div class="ie-eras">
    <div class="ie-eras-title">Same workload at GPT-4-class list prices, by era</div>
    <div class="ie-era-row">
      <span class="ie-era-label">2023 · GPT-4</span>
      <div class="ie-era-track"><div class="ie-era-bar" id="ie-bar-2023"></div></div>
      <span class="ie-era-cost" id="ie-cost-2023">—</span>
    </div>
    <div class="ie-era-row">
      <span class="ie-era-label">2024 · GPT-4o</span>
      <div class="ie-era-track"><div class="ie-era-bar" id="ie-bar-2024"></div></div>
      <span class="ie-era-cost" id="ie-cost-2024">—</span>
    </div>
    <div class="ie-era-row">
      <span class="ie-era-label">2026 · Economy</span>
      <div class="ie-era-track"><div class="ie-era-bar ie-era-bar-now" id="ie-bar-2026"></div></div>
      <span class="ie-era-cost" id="ie-cost-2026">—</span>
    </div>
    <p class="ie-factor-line">This workload is <strong id="ie-factor">—</strong> cheaper at 2026 economy-tier prices than at GPT-4's 2023 launch prices.</p>
  </div>
</div>

Try the default workload — 5,000 requests a day, a 2,000-token prompt, a 500-token answer. At GPT-4's 2023 prices it was a **five-figure monthly line item** that needed a director's sign-off. At 2026 economy-tier prices it costs less than a team lunch. Entire categories of product — summarize every support ticket, screen every resume, caption every image — crossed from "not economically viable" to "rounding error" without the products changing at all. The price moved; the use cases followed.

## Jevons' Paradox: Cheaper Tokens, Bigger Bills

In 1865, the economist William Stanley Jevons observed that more efficient steam engines did not reduce Britain's coal consumption — they exploded it, because efficiency made coal-powered everything economically viable. **Token prices are the coal of this cycle.**

The aggregate numbers are stark. Per-token prices fell more than 90% from 2023 levels, yet enterprise spending on generative AI grew from roughly **$1.7B in 2023 to $11.5B in 2024 to $37B in 2025** — a 22x increase in two years, during the steepest price collapse in the technology's history. Falling unit prices did not shrink the market. They were the *mechanism* by which the market grew.

Agents turbocharge the effect. A chat interaction is one prompt, one reply. An agent loops: it plans, retrieves, calls tools, reads the results, self-checks, retries, and escalates — dozens or hundreds of model calls per task, each carrying accumulated context. Microsoft Research measured agentic workloads consuming on the order of **1,000x more tokens than a chat interaction for an equivalent task**. Cheaper tokens are precisely what makes those architectures affordable to attempt, so each 10x price decline unlocks workloads that consume 100x the tokens.

For any individual company, the budget experience is therefore paradoxical:

1. **Per-unit cost falls** — the finance team expects the AI line item to shrink.
2. **Viable use cases multiply** — every team finds a workload that now pencils out.
3. **Architectures get hungrier** — a wrapper becomes a RAG pipeline becomes a multi-agent system.
4. **The bill goes up** — by 2026 the FinOps community had a name for the collective realization: the "Great Token Panic."

<div class="ie-callout ie-callout-note">
  <strong>Falling prices are a demand forecast, not a savings forecast.</strong> Budget AI the way early-2000s companies should have budgeted bandwidth: assume unit prices fall 10x and usage rises faster. The planning question is not "how much will tokens cost?" but "what will we do when they are nearly free — and what does our consumption curve look like on the way there?"
</div>

## What It Means

### For app builders: the moat question

If your product is a thin wrapper — a prompt, a model call, a UI — then your cost of goods is collapsing, which sounds great until you notice **your competitors' costs collapse identically, and your customers' cost of self-serving collapses too**. Thin margins on top of a deflating commodity are not a business; they are a countdown.

The defensible positions sit where cheap tokens are an *input*, not the product: proprietary data and feedback loops the model consumes, workflow integration deep enough that switching hurts, distribution, and accountability (compliance, evaluation, uptime guarantees) that enterprises pay for regardless of the token price. Cheaper inference makes those moats *more* valuable, because it lets you spend lavishly — verification passes, multi-model ensembles, agentic retries — on quality your wrapper competitors cannot match at the same retail price.

### For the capex debate: deflation as the bull and the bear case

Hyperscalers and labs are committing hundreds of billions of dollars to AI datacenters. Token deflation cuts both ways through that math. The bear reading: how do you earn a return on capacity whose output price falls 10x a year? Revenue per GPU-hour is a melting ice cube. The bull reading: Jevons. Demand has so far grown faster than prices fell — total spending rose 22x while unit prices dropped 90% — so aggregate inference revenue can rise even as each token gets cheaper, and the cheapest capacity keeps winning the marginal workload.

Which reading wins is *the* open question of the AI investment cycle, and it likely resolves differently for different players: owners of scarce power, land, and interconnects capture deflation-resistant rent; owners of rapidly depreciating mid-tier GPUs may not. What is already clear is that **betting on token prices staying high is the one position with no historical support.**

### For users: intelligence too cheap to meter, almost

For individuals, the practical consequence is that yesterday's frontier keeps arriving in free tiers and $20 subscriptions. The capability you paid API rates for in 2023 is bundled into your email client by 2026. The scarce resources shift from access to intelligence toward the things intelligence cannot substitute for: your data, your attention, your judgment about when the model is wrong.

## Key Takeaways

<div class="takeaways">
    <div class="takeaway">
        <span class="takeaway-num">1</span>
        <div class="takeaway-content">
            <strong>Capability-adjusted inference prices fell roughly 100x in under three years.</strong> GPT-4-class capability went from ~$36 blended per million tokens in March 2023 to under $0.50 by 2025. Tracked across benchmarks, declines run 9x–900x per year with a median around 50x. Nothing in industrial history has deflated this fast.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">2</span>
        <div class="takeaway-content">
            <strong>The collapse is over-determined.</strong> New GPU generations, quantization, distillation, MoE sparsity, and serving-stack engineering each contribute a multiple — and open-weight competition converts those cost declines into price declines. No single bottleneck can stop the trend.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">3</span>
        <div class="takeaway-content">
            <strong>Price is not cost, and nobody outside the labs knows true margins.</strong> Utilization dominates serving economics; paid API tokens are plausibly margin-positive while the businesses burn cash overall. Do not anchor a business plan to pricing that may be someone else's customer-acquisition spend.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">4</span>
        <div class="takeaway-content">
            <strong>Cheaper tokens mean bigger bills.</strong> Jevons' paradox is operating at full force: unit prices fell over 90% while enterprise AI spend grew 22x in two years, and agentic workloads consume orders of magnitude more tokens than chat. Budget for consumption growth, not unit savings.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">5</span>
        <div class="takeaway-content">
            <strong>Build where deflation helps you, not where it erases you.</strong> Thin wrappers deflate with their input. Moats built on data, workflow depth, and accountability get stronger as tokens get cheaper — because cheap intelligence lets you spend more of it on quality.
        </div>
    </div>
</div>

## References

<div class="d-bibliography">
<ol>
    <li>OpenAI. "API Pricing." GPT-4 launch pricing ($30/$60 per 1M tokens, March 2023) and subsequent GPT-4 Turbo / GPT-4o pricing. <a href="https://openai.com/business/pricing/">openai.com</a>.</li>
    <li>Ng, Andrew. Post on X comparing GPT-4 launch pricing ($36/1M blended, March 2023) with GPT-4o pricing ($4/1M blended, August 2024). <a href="https://x.com/AndrewYNg/status/1829190549842321758">x.com</a>.</li>
    <li>Epoch AI. "LLM inference prices have fallen rapidly but unequally across tasks." Price declines of 9x–900x/year across benchmarks; 40x/year for GPT-4-level performance on PhD-level science questions. <a href="https://epoch.ai/data-insights/llm-inference-price-trends">epoch.ai</a>. Retrieved July 2026.</li>
    <li>DeepSeek. "Models &amp; Pricing." DeepSeek API documentation. <a href="https://api-docs.deepseek.com/quick_start/pricing">api-docs.deepseek.com</a>.</li>
    <li>Google. "Gemini Developer API Pricing." <a href="https://ai.google.dev/gemini-api/docs/pricing">ai.google.dev</a>.</li>
    <li>Introl. "Inference Unit Economics: The True Cost Per Million Tokens." GPU node costs, rental rates, utilization break-evens. <a href="https://introl.com/blog/inference-unit-economics-true-cost-per-million-tokens-guide">introl.com</a>. Retrieved July 2026.</li>
    <li>Fortune. "Tokens are getting cheaper, but companies are spending even more on AI as a result." June 2026. <a href="https://fortune.com/2026/06/17/why-is-ai-spending-increasing-as-tokens-get-cheaper-jevons-paradox/">fortune.com</a>.</li>
    <li>IntuitionLabs. "AI API Pricing Comparison (2026)" — 2026 tier pricing for GPT-5.x, Claude 4.x, Gemini 3.x (indicative aggregator data). <a href="https://intuitionlabs.ai/articles/ai-api-pricing-comparison-grok-gemini-openai-claude">intuitionlabs.ai</a>. Retrieved July 2026.</li>
    <li>Jevons, W. Stanley. <em>The Coal Question</em>. Macmillan, 1865.</li>
</ol>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
<script src="/js/inference-economics.js"></script>
