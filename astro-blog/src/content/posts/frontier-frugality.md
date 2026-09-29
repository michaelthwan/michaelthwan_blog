---
title: "Frontier Frugality"
subtitle: "The best model costs 10x the cheap one, and agentic workflows re-bill your entire context every turn. How to spend frontier tokens only where the intelligence actually lives."
authors:
  - "Michael Wan"
affiliations:
  - "Michael Wan Interactive Insights"
published: "2026-09-29"
abstract: "Frontier models like Claude Fable 5.1 cost 10x Haiku 4.5, and an agentic session re-sends its whole history every turn, so the bill grows with the square of session length. This post covers the levers that tame it: prompt caching, delegating bulk reading to cheap subagents, difficulty-based routing, independent verification, and distilling frontier judgment into rules that cheaper models can execute. It includes a calculator to test them, priced at September 2026 list rates."
tags:
  - "explainer"
category: "dev"
thumbnail: "/img/frontier-frugality/thumbnail.svg"
---

<style>
  .ff-callout {
    border-left: 3px solid; border-radius: 0 6px 6px 0;
    padding: 11px 14px; margin: 20px 0; font-size: 0.92rem; line-height: 1.55;
  }
  .ff-callout-tip  { border-color: #10b981; background: #f0fdf4; color: #065f46; }
  .ff-callout-warn { border-color: #f59e0b; background: #fffbeb; color: #92400e; }
  .ff-callout-note { border-color: #6366f1; background: #eef2ff; color: #3730a3; }

  .ff-badge { display: inline-block; font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; white-space: nowrap; }
  .ff-badge-mech  { background: #dbeafe; color: #1e40af; }
  .ff-badge-arch  { background: #d1fae5; color: #065f46; }
  .ff-badge-knob  { background: #fef3c7; color: #92400e; }

  .ff-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; margin: 16px 0; }
  .ff-table th { text-align: left; padding: 8px 10px; border-bottom: 2px solid #d1d5db; font-weight: 600; }
  .ff-table td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  .ff-table td.ff-num { font-variant-numeric: tabular-nums; white-space: nowrap; }

  /* Calculator */
  .ff-calc {
    border: 1px solid #d1d5db; border-radius: 10px; padding: 20px 22px;
    margin: 24px 0; background: #fafafa;
  }
  .ff-calc h4 { margin: 0 0 4px 0; font-size: 1.02rem; }
  .ff-calc-desc { font-size: 0.85rem; color: #6b7280; margin: 0 0 16px 0; }
  .ff-control { margin: 12px 0; }
  .ff-control label { display: block; font-size: 0.82rem; font-weight: 600; color: #374151; margin-bottom: 4px; }
  .ff-control input[type="range"] { width: 100%; accent-color: #2563eb; }
  .ff-control select {
    width: 100%; padding: 7px 9px; font-size: 0.88rem; border: 1px solid #d1d5db;
    border-radius: 6px; background: #ffffff; color: #111827; font-family: inherit;
  }
  .ff-control-val { font-weight: 700; color: #2563eb; font-variant-numeric: tabular-nums; }

  .ff-results { display: flex; gap: 14px; flex-wrap: wrap; margin: 18px 0 6px 0; }
  .ff-stat {
    flex: 1; min-width: 140px; background: #ffffff; border: 1px solid #e5e7eb;
    border-radius: 8px; padding: 12px 14px; text-align: center;
  }
  .ff-stat-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; margin-bottom: 3px; }
  .ff-stat-value { font-size: 1.45rem; font-weight: 700; color: #111827; font-variant-numeric: tabular-nums; }

  .ff-scenarios { margin-top: 18px; }
  .ff-scenarios-title { font-size: 0.82rem; font-weight: 600; color: #374151; margin-bottom: 8px; }
  .ff-scenario-row { display: grid; grid-template-columns: 150px 1fr 84px; align-items: center; gap: 10px; margin: 7px 0; font-size: 0.85rem; }
  .ff-scenario-label { color: #4b5563; }
  .ff-scenario-track { background: #e5e7eb; border-radius: 4px; height: 16px; overflow: hidden; }
  .ff-scenario-bar { height: 100%; border-radius: 0 4px 4px 0; background: #6da7ec; transition: width 0.25s ease; }
  #ff-bar-naive { background: #eb6834; }
  .ff-scenario-bar-best { background: #184f95; }
  :root[data-theme="dark"] .ff-scenario-bar { background: #3987e5; }
  :root[data-theme="dark"] #ff-bar-naive { background: #d95926; }
  :root[data-theme="dark"] .ff-scenario-bar-best { background: #86b6ef; }
  .ff-scenario-cost { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; color: #111827; }
  .ff-factor-line { font-size: 0.88rem; color: #374151; margin-top: 12px; }
  .ff-factor-line strong { color: #2563eb; }

  /* Charts */
  .ff-viz {
    --c-orange: #eb6834; --c-blue: #2a78d6; --c-blue-deep: #184f95; --c-muted: #b6bcc6;
    --c-track: rgba(128, 136, 148, 0.16);
    margin: 22px 0; font-size: 0.85rem;
  }
  :root[data-theme="dark"] .ff-viz { --c-orange: #d95926; --c-blue: #3987e5; --c-blue-deep: #6da7ec; --c-muted: #4a5260; }
  .ff-viz-title { font-size: 0.82rem; font-weight: 600; margin-bottom: 8px; }
  .ff-legend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 0 0 8px 0; color: var(--color-gray); font-size: 0.78rem; }
  .ff-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: -1px; }
  .ff-viz-note { color: var(--color-gray); font-size: 0.8rem; margin-top: 8px; }

  .ff-growth { display: flex; align-items: flex-end; gap: 2px; height: 170px; border-bottom: 1px solid var(--color-border); }
  .ff-growth-bar { flex: 1; min-width: 0; display: flex; flex-direction: column-reverse; border-radius: 3px 3px 0 0; overflow: hidden; }
  .ff-growth-base { background: var(--c-muted); }
  .ff-growth-hist { background: var(--c-blue); margin-bottom: 1px; }
  .ff-axis { display: flex; justify-content: space-between; color: var(--color-gray); font-size: 0.74rem; margin-top: 4px; }

  .ff-hbar-row { display: grid; grid-template-columns: 112px 1fr; gap: 4px 12px; align-items: center; margin: 10px 0; }
  .ff-hbar-label { font-weight: 600; }
  .ff-hbar-pair { display: flex; flex-direction: column; gap: 4px; }
  .ff-hbar { display: flex; align-items: center; gap: 8px; }
  .ff-hbar-track { flex: 1; height: 14px; background: var(--c-track); border-radius: 4px; overflow: hidden; }
  .ff-hbar-fill { height: 100%; border-radius: 0 4px 4px 0; min-width: 3px; }
  .ff-hbar-val { width: 128px; flex: none; color: var(--color-gray); font-variant-numeric: tabular-nums; font-size: 0.78rem; }
  .ff-hbar-val b { color: var(--color-text); }
  .ff-fill-orange { background: var(--c-orange); }
  .ff-fill-blue { background: var(--c-blue); }
  .ff-fill-muted { background: var(--c-muted); }
  .ff-tag { font-size: 0.72rem; font-weight: 700; color: var(--c-blue-deep); white-space: nowrap; }

  .ff-hi { background: color-mix(in srgb, var(--color-accent) 16%, transparent); padding: 0 4px; border-radius: 4px; font-weight: 700; }
  .ff-table td.heat, .ff-table td.dbar { border-radius: 0; }
  .ff-table .ff-sub { display: block; font-size: 0.7rem; font-weight: 400; opacity: 0.8; }

  /* Dark mode */
  :root[data-theme="dark"] .ff-calc { background: #1f2430; border-color: #3a4150; }
  :root[data-theme="dark"] .ff-calc-desc { color: #9aa3b2; }
  :root[data-theme="dark"] .ff-control label, :root[data-theme="dark"] .ff-scenarios-title { color: #c7cdd8; }
  :root[data-theme="dark"] .ff-stat { background: #262c3a; border-color: #3a4150; }
  :root[data-theme="dark"] .ff-stat-value, :root[data-theme="dark"] .ff-scenario-cost { color: #eceff4; }
  :root[data-theme="dark"] .ff-scenario-label { color: #aab2c0; }
  :root[data-theme="dark"] .ff-factor-line { color: #c7cdd8; }
  :root[data-theme="dark"] .ff-factor-line strong { color: #6ea8ff; }
  :root[data-theme="dark"] .ff-stat-label { color: #9aa3b2; }
  :root[data-theme="dark"] .ff-scenario-track { background: #3a4150; }
  :root[data-theme="dark"] .ff-control select { background: #262c3a; border-color: #3a4150; color: #eceff4; }

  :root[data-theme="dark"] .ff-callout-tip  { background: rgba(16,185,129,0.10); color: #6ee7b7; }
  :root[data-theme="dark"] .ff-callout-warn { background: rgba(245,158,11,0.10); color: #fcd34d; }
  :root[data-theme="dark"] .ff-callout-note { background: rgba(99,102,241,0.12); color: #a5b4fc; }

  :root[data-theme="dark"] .ff-badge-mech { background: rgba(59,130,246,0.20); color: #93c5fd; }
  :root[data-theme="dark"] .ff-badge-arch { background: rgba(16,185,129,0.18); color: #6ee7b7; }
  :root[data-theme="dark"] .ff-badge-knob { background: rgba(245,158,11,0.18); color: #fcd34d; }

  :root[data-theme="dark"] .ff-table th { border-bottom-color: var(--color-border); }
  :root[data-theme="dark"] .ff-table td { border-bottom-color: var(--color-surface); }

  @media (max-width: 560px) {
    .ff-scenario-row { grid-template-columns: 104px 1fr 72px; }
    .ff-hbar-row { grid-template-columns: 1fr; margin: 14px 0; }
    .ff-hbar-val { width: 112px; }
  }
</style>

<p class="d-note">
    All prices are nominal USD list prices per million tokens from Anthropic's pricing
    documentation, retrieved September 2026. Savings percentages from papers and vendor
    write-ups depend on workload mix: treat them as commonly cited ranges, not guarantees.
</p>

## Executive Summary

An agentic coding session re-sends its whole history on every turn, so its input bill grows with the square of its length. In the calculator below, at its defaults (Claude Fable 5.1, 40 turns), the same session costs about <strong class="ff-hi">$30</strong> done naively and about <strong class="ff-hi">$2.30</strong> with the levers in this post: <strong class="ff-hi">13x cheaper</strong>.

<div class="takeaways">
    <div class="takeaway">
        <span class="takeaway-num">1</span>
        <div class="takeaway-content">
            <strong>Context is a recurring cost.</strong> Every token is re-billed on every later turn; each lever below shrinks, discounts, or re-meters that.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">2</span>
        <div class="takeaway-content">
            <strong>Caching is the biggest dollar lever, and fragile.</strong> Reads cost 0.1x, down to 0.025x on Fable 5.1, but a miss there now costs 40x a hit.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">3</span>
        <div class="takeaway-content">
            <strong>Never let the frontier model read in bulk.</strong> Delegate reading to cheap subagents, route cheap-first, and verify independently.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">4</span>
        <div class="takeaway-content">
            <strong>Multipliers stack.</strong> Batch plus cache reads reaches 5% of list price, 1.25% on Fable 5.1; re-tune routing as the ladder moves.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">5</span>
        <div class="takeaway-content">
            <strong>Distill judgment.</strong> Write rules that cheaper models execute mechanically; they survive losing frontier access.
        </div>
    </div>
</div>

## The Price of Thinking at the Frontier

Every model family ships as a ladder of tiers, and the rungs are far apart. Here is Anthropic's ladder as of September 2026:

<div class="d-table-wrapper">
<table class="ff-table">
  <thead>
    <tr>
      <th>Model</th>
      <th>Input / MTok</th>
      <th>Output / MTok</th>
      <th>Cache read / MTok</th>
      <th>vs. Haiku (output)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Claude Fable 5.1</strong></td>
      <td class="ff-num heat hot" style="--v:1.00">$10.00</td>
      <td class="ff-num heat hot" style="--v:1.00">$50.00</td>
      <td class="ff-num heat" style="--v:0.06">$0.25</td>
      <td class="ff-num dbar" style="--v:1.00">10x</td>
    </tr>
    <tr>
      <td>Claude Opus 5.5</td>
      <td class="ff-num heat" style="--v:0.40">$4.00</td>
      <td class="ff-num heat" style="--v:0.40">$20.00</td>
      <td class="ff-num heat" style="--v:0.06">$0.20</td>
      <td class="ff-num dbar" style="--v:0.40">4x</td>
    </tr>
    <tr>
      <td>Claude Sonnet 5.5</td>
      <td class="ff-num heat" style="--v:0.20">$2.00</td>
      <td class="ff-num heat" style="--v:0.20">$10.00</td>
      <td class="ff-num heat" style="--v:0.06">$0.20</td>
      <td class="ff-num dbar" style="--v:0.20">2x</td>
    </tr>
    <tr>
      <td>Claude Haiku 4.5</td>
      <td class="ff-num heat" style="--v:0.10">$1.00</td>
      <td class="ff-num heat" style="--v:0.10">$5.00</td>
      <td class="ff-num heat" style="--v:0.06">$0.10</td>
      <td class="ff-num dbar" style="--v:0.10">1x</td>
    </tr>
  </tbody>
</table>
</div>

<p class="d-caption">Anthropic list prices, September 2026. Cache reads are no longer a flat 10% of input: 2.5% on Fable 5.1, 5% on Opus 5.5, and 10% on Sonnet 5.5 and Haiku 4.5. Sonnet 5's launch price of $2/$10, originally introductory, is now the standard rate; the scheduled rise to $3/$15 on September 1 was cancelled. Darker cells cost more; the cache-read column uses the same scale as the input column.</p>

Think of the frontier model as a senior consultant billing $800 an hour and the cheap tiers as capable staff billing $80. Nobody asks the consultant to photocopy documents, yet most agentic setups have the most expensive model read every file and log. The goal is not to use the frontier model less; it is to spend every frontier token on a decision only it can make.

Per-token prices also understate the gap: Claude 4.7 and later models (Fable 5.1, Opus 5.5, Sonnet 5.5) use a newer tokenizer that produces roughly 30% more tokens for the same text than Haiku 4.5's, so 10x per token is closer to 13x per page of text.

## Where the Money Actually Goes

The API is stateless: every turn re-sends the full conversation history as input. An agentic session is a loop (read a file, run a test, read the output, edit) and each iteration appends to the context. For $T$ turns, a base context $C_0$ (system prompt, instructions, tool definitions), and $\Delta$ new tokens per turn:

<div class="d-math-block">

$$
\text{Input tokens billed} = \sum_{t=1}^{T} \big( C_0 + (t-1)\Delta \big) = T C_0 + \Delta \frac{T(T-1)}{2}
$$

</div>

The second term grows with the *square* of session length. A 5,700-token file read on turn 10 of a 60-turn session is paid for 50 more times. At Fable 5.1's $10/MTok, 60 turns at 3,000 tokens per turn bills about 6.2 million input tokens, roughly <strong class="ff-hi">$62 of input alone</strong>, for what feels like one coding task. Extended thinking adds to this: it is billed as output ($50/MTok on Fable 5.1), and practitioners budget 2-5x the visible output for thinking-heavy turns (an unverified rule of thumb).

<div class="ff-viz" id="ff-growth-chart">
  <div class="ff-viz-title">Input tokens billed on each turn of a 60-turn session</div>
  <div class="ff-legend">
    <span><i style="background:var(--c-muted)"></i>Base context (system prompt, tools)</span>
    <span><i style="background:var(--c-blue)"></i>Accumulated history, re-sent every turn</span>
  </div>
  <div class="ff-growth" id="ff-growth"></div>
  <div class="ff-axis"><span>Turn 1</span><span id="ff-growth-mid"></span><span>Turn 60</span></div>
  <div class="ff-viz-note" id="ff-growth-note"></div>
</div>

<div class="ff-callout ff-callout-note">
  <strong>The core mechanic: context is a recurring cost, not a one-time cost.</strong> The levers below either shrink what gets re-billed (delegation), discount the re-billing (caching), or move it to a cheaper meter (routing).
</div>

## Lever 1: Caching, the Discount You Must Not Fumble

<span class="ff-badge ff-badge-mech">Mechanism</span> Prompt caching reads a repeated prefix back at a fraction of the input price: **0.1x** on Sonnet 5.5 and Haiku 4.5, **0.05x** on Opus 5.5, **0.025x** on Fable 5.1. Writes cost 1.25x (2x for the 1-hour TTL). A 5-minute write pays for itself after one hit, so in a tight loop nearly all of the quadratic term gets the discount. On Fable 5.1 the $62 session drops to about <strong class="ff-hi">$3.9</strong> (about $8 under the old flat 0.1x).

<div class="ff-viz">
  <div class="ff-viz-title">Re-sending one million tokens of history: full price versus a cache hit</div>
  <div class="ff-hbar-row">
    <div class="ff-hbar-label">Fable 5.1</div>
    <div class="ff-hbar-pair">
      <div class="ff-hbar"><div class="ff-hbar-track"><div class="ff-hbar-fill ff-fill-orange" style="width:100%" title="Uncached: $10.00/MTok"></div></div><span class="ff-hbar-val">Full price <b>$10.00</b></span></div>
      <div class="ff-hbar"><div class="ff-hbar-track"><div class="ff-hbar-fill ff-fill-blue" style="width:2.5%" title="Cache hit: $0.25/MTok"></div></div><span class="ff-hbar-val">Cache hit <b>$0.25</b> <span class="ff-tag">40x cheaper</span></span></div>
    </div>
  </div>
  <div class="ff-hbar-row">
    <div class="ff-hbar-label">Opus 5.5</div>
    <div class="ff-hbar-pair">
      <div class="ff-hbar"><div class="ff-hbar-track"><div class="ff-hbar-fill ff-fill-orange" style="width:100%" title="Uncached: $4.00/MTok"></div></div><span class="ff-hbar-val">Full price <b>$4.00</b></span></div>
      <div class="ff-hbar"><div class="ff-hbar-track"><div class="ff-hbar-fill ff-fill-blue" style="width:5%" title="Cache hit: $0.20/MTok"></div></div><span class="ff-hbar-val">Cache hit <b>$0.20</b> <span class="ff-tag">20x cheaper</span></span></div>
    </div>
  </div>
  <div class="ff-hbar-row">
    <div class="ff-hbar-label">Sonnet 5.5</div>
    <div class="ff-hbar-pair">
      <div class="ff-hbar"><div class="ff-hbar-track"><div class="ff-hbar-fill ff-fill-orange" style="width:100%" title="Uncached: $2.00/MTok"></div></div><span class="ff-hbar-val">Full price <b>$2.00</b></span></div>
      <div class="ff-hbar"><div class="ff-hbar-track"><div class="ff-hbar-fill ff-fill-blue" style="width:10%" title="Cache hit: $0.20/MTok"></div></div><span class="ff-hbar-val">Cache hit <b>$0.20</b> <span class="ff-tag">10x cheaper</span></span></div>
    </div>
  </div>
  <div class="ff-hbar-row">
    <div class="ff-hbar-label">Haiku 4.5</div>
    <div class="ff-hbar-pair">
      <div class="ff-hbar"><div class="ff-hbar-track"><div class="ff-hbar-fill ff-fill-orange" style="width:100%" title="Uncached: $1.00/MTok"></div></div><span class="ff-hbar-val">Full price <b>$1.00</b></span></div>
      <div class="ff-hbar"><div class="ff-hbar-track"><div class="ff-hbar-fill ff-fill-blue" style="width:10%" title="Cache hit: $0.10/MTok"></div></div><span class="ff-hbar-val">Cache hit <b>$0.10</b> <span class="ff-tag">10x cheaper</span></span></div>
    </div>
  </div>
  <div class="ff-viz-note">Each row is scaled to its own model's full price, so the blue bar is the size of the discount.</div>
</div>

The deeper discount has two consequences. **The frontier premium shrinks once caching works:** the same cached session on Sonnet 5.5 has an input bill of about $1.7, so Fable 5.1 costs about 2.3x that, not the 5x list ratio. And **a broken cache hurts more:** a full miss on Fable 5.1 costs <strong class="ff-hi">40x</strong> a hit (10x before).

Three rules keep the discount alive:

1. **The cache is a prefix match.** One changed byte early (a timestamp in the system prompt, a reordered tool definition) invalidates everything after it. Stable content first, volatile last.
2. **The default TTL is 5 minutes.** Pause longer and the next request re-writes the cache. Human-in-the-loop workflows may justify the 1-hour TTL at 2x write cost, which breaks even after two hits.
3. **Defaults move.** In March 2026 Anthropic changed the default TTL from 1 hour to 5 minutes, and community trackers attributed 20-60% cost increases to it (Anthropic disputed the attribution). Monitor caching defaults like a dependency.

Caching discounts the waste; it does not remove it. Models also reason worse when the window fills with stale tool output, so a bloated context is a quality problem even when it is a cheap one.

## Lever 2: Don't Let the Expensive Model Read

<span class="ff-badge ff-badge-arch">Architecture</span> The quadratic term exists because bulk material enters the frontier model's context. Keep it out: **the frontier model orchestrates; cheap models read.** It dispatches a subagent on a cheap model, in its own isolated context, to do the reading and return only conclusions. Anthropic's multi-agent research system has this shape; in one circulating example, a subagent read 6,100 tokens and returned a 420-token summary. The 5,700-token difference was never re-billed and never diluted the orchestrator's attention.

<div class="ff-viz">
  <div class="ff-viz-title">One delegated file read</div>
  <div class="ff-hbar-row">
    <div class="ff-hbar-label">Subagent reads</div>
    <div class="ff-hbar"><div class="ff-hbar-track"><div class="ff-hbar-fill ff-fill-muted" style="width:100%"></div></div><span class="ff-hbar-val"><b>6,100</b> tokens</span></div>
  </div>
  <div class="ff-hbar-row">
    <div class="ff-hbar-label">Orchestrator receives</div>
    <div class="ff-hbar"><div class="ff-hbar-track"><div class="ff-hbar-fill ff-fill-blue" style="width:6.9%"></div></div><span class="ff-hbar-val"><b>420</b> tokens <span class="ff-tag">93% stays out</span></span></div>
  </div>
</div>

The arithmetic is lopsided twice: the bulk is paid once instead of on every remaining turn, and at the worker's meter (Haiku's $1/MTok, on a tokenizer that yields about 30% fewer tokens for the same file). Practitioners claim 5-10x savings for Haiku-class subagents (vendor figures, not audited).

Triage is the hard part. If you could hand the task to a junior developer with a clear spec, a cheap subagent can do it; if it needs judgment or taste, it stays with the orchestrator. Every dispatch needs a goal, acceptance criteria, and a report format ("conclusions and file:line only"), because a sloppy spec produces work the expensive model then repairs at expensive rates.

<div class="ff-callout ff-callout-tip">
  <strong>The 2,000-token test.</strong> Before any step, ask: will this pull more than ~2,000 tokens of raw material into the expensive context when I only need a summary? If yes, delegate it. The threshold is arbitrary; the habit is not.
</div>

## Lever 3: Route by Difficulty, Verify Independently

<span class="ff-badge ff-badge-arch">Architecture</span> Delegation splits work within a task; routing splits it across tasks, because most queries never needed the frontier model. FrugalGPT (Stanford, 2023) cascaded models, cheapest first, escalating on a failed score, and matched GPT-4 accuracy at up to 98% lower cost on its benchmarks; production routers commonly cite 40-70% savings at under 2% quality loss (vendor figures). By hand, the discipline is:

1. **Default down.** Start at the cheapest tier that has handled this kind of subtask well.
2. **Escalate on evidence.** One Haiku-class failure goes to Sonnet-class; two Sonnet-class failures on the same subtask go to the frontier model with the full failure trail. Escalate judgment failures, not missing facts: a module-not-found error needs someone to read it, not a smarter model.
3. **De-escalate after the breakthrough.** Once the frontier model cracks the hard instance, batch-apply the pattern with a cheap model.

Also **take the tier upgrade.** Sonnet 5 launched in June 2026 scoring 63.2% on Anthropic's agentic-coding benchmark against Opus 4.8's 69.2% at less than half the price (Anthropic's numbers). Its $2/$10 price has since become permanent and Opus 5.5 arrived at $4/$20, so a routing policy tuned six months ago probably over-escalates today.

**Verify independently.** Checking work is cheaper than producing it, which suggests plan-execute-review: the frontier model writes a short plan with acceptance criteria, a cheap model executes it (where most tokens burn), and a reviewer checks the diff and test log. Self-verification does not come free, though: use a fresh context, ideally a model at least as strong as the producer, given the criteria and artifacts but not the producer's reasoning, which would anchor it.

## Smaller Knobs That Stack

<span class="ff-badge ff-badge-knob">Configuration</span> Pricing multipliers are multiplicative, so these compound with everything above:

- **Batch API: flat -50%** on input and output for asynchronous work such as evaluation sweeps and bulk classification. Stacked with cache reads, a cached-corpus pipeline drops to about 5% of the uncached input rate on Sonnet and Haiku (0.1 x 0.5), 2.5% on Opus 5.5, and 1.25% on Fable 5.1 (0.025 x 0.5).
- **Effort control.** The `effort` parameter (`low` through `max`) governs thinking-token spend, which bills at output rates. Defaulting subagents and mechanical tasks to `low` is one of the highest-leverage single lines of configuration.
- **Output discipline.** Output costs 5x input on every tier, so report formats like "conclusions only, long artifacts go to files" save money as well as context.

<div class="d-table-wrapper">
<table class="ff-table">
  <thead>
    <tr>
      <th>Cost as % of list input price</th>
      <th>Cache read</th>
      <th>Batch</th>
      <th>Batch + cache read</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Fable 5.1</td>
      <td class="ff-num heat" style="--v:0.05">2.5%</td>
      <td class="ff-num heat hot" style="--v:1.00">50%</td>
      <td class="ff-num heat" style="--v:0.04">1.25%</td>
    </tr>
    <tr>
      <td>Opus 5.5</td>
      <td class="ff-num heat" style="--v:0.10">5%</td>
      <td class="ff-num heat hot" style="--v:1.00">50%</td>
      <td class="ff-num heat" style="--v:0.05">2.5%</td>
    </tr>
    <tr>
      <td>Sonnet 5.5 / Haiku 4.5</td>
      <td class="ff-num heat" style="--v:0.20">10%</td>
      <td class="ff-num heat hot" style="--v:1.00">50%</td>
      <td class="ff-num heat" style="--v:0.10">5%</td>
    </tr>
  </tbody>
</table>
</div>

<p class="d-caption">Multipliers stack: the last column is the cache-read share times the 50% batch discount. Darker cells cost more.</p>

## Interactive: The Agentic Session Bill

The calculator prices one agentic session ($T$ turns, each appending $\Delta$ tokens to a 15,000-token base context, 400 output tokens per turn) in four configurations, using September 2026 list prices and each tier's own cache-read rate. Delegated reading is done by Haiku 4.5 subagents returning 10%-length summaries, with a 2x allowance for their own loops. At 60 turns and 3,000 tokens per turn on Fable 5.1 the naive figure reads about $63: the $62 of input plus output.

<div class="ff-calc" id="ff-calculator">
  <h4>Agentic session cost calculator</h4>
  <p class="ff-calc-desc">Input bill per turn = full history re-sent (cache reads at the model's own rate where enabled: 0.025x on Fable 5.1, 0.05x on Opus 5.5, 0.1x on Sonnet 5.5). Delegation keeps (share)% of each turn's bulk material out of the orchestrator's context, replacing it with a 10% summary; subagent reading and output are billed at Haiku 4.5 rates with a 2x overhead factor.</p>

  <div class="ff-control">
    <label>Orchestrator model</label>
    <select id="ff-model-select">
      <option value="fable" selected>Claude Fable 5.1 — $10 / $50</option>
      <option value="opus">Claude Opus 5.5 — $4 / $20</option>
      <option value="sonnet">Claude Sonnet 5.5 — $2 / $10</option>
    </select>
  </div>

  <div class="ff-control">
    <label>Session length: <span class="ff-control-val" id="ff-turns-val">40 turns</span></label>
    <input type="range" id="ff-turns-slider" min="10" max="120" step="5" value="40">
  </div>

  <div class="ff-control">
    <label>New context per turn (tool results, file reads): <span class="ff-control-val" id="ff-delta-val">3,000 tokens</span></label>
    <input type="range" id="ff-delta-slider" min="500" max="10000" step="250" value="3000">
  </div>

  <div class="ff-control">
    <label>Share of bulk reading delegated to Haiku subagents: <span class="ff-control-val" id="ff-share-val">60%</span></label>
    <input type="range" id="ff-share-slider" min="0" max="90" step="5" value="60">
  </div>

  <div class="ff-results">
    <div class="ff-stat">
      <div class="ff-stat-label">Naive session cost</div>
      <div class="ff-stat-value" id="ff-cost-naive">—</div>
    </div>
    <div class="ff-stat">
      <div class="ff-stat-label">With both levers</div>
      <div class="ff-stat-value" id="ff-cost-both">—</div>
    </div>
    <div class="ff-stat">
      <div class="ff-stat-label">20 sessions / month</div>
      <div class="ff-stat-value" id="ff-cost-month">—</div>
    </div>
  </div>

  <div class="ff-scenarios">
    <div class="ff-scenarios-title">Same session, four configurations</div>
    <div class="ff-scenario-row">
      <span class="ff-scenario-label">Naive</span>
      <div class="ff-scenario-track"><div class="ff-scenario-bar" id="ff-bar-naive"></div></div>
      <span class="ff-scenario-cost" id="ff-val-naive">—</span>
    </div>
    <div class="ff-scenario-row">
      <span class="ff-scenario-label">+ Caching</span>
      <div class="ff-scenario-track"><div class="ff-scenario-bar" id="ff-bar-cache"></div></div>
      <span class="ff-scenario-cost" id="ff-val-cache">—</span>
    </div>
    <div class="ff-scenario-row">
      <span class="ff-scenario-label">+ Delegation</span>
      <div class="ff-scenario-track"><div class="ff-scenario-bar" id="ff-bar-deleg"></div></div>
      <span class="ff-scenario-cost" id="ff-val-deleg">—</span>
    </div>
    <div class="ff-scenario-row">
      <span class="ff-scenario-label">+ Both</span>
      <div class="ff-scenario-track"><div class="ff-scenario-bar ff-scenario-bar-best" id="ff-bar-both"></div></div>
      <span class="ff-scenario-cost" id="ff-val-both">—</span>
    </div>
    <p class="ff-factor-line">Caching plus delegation makes this session <strong id="ff-factor">—</strong> cheaper than the naive configuration.</p>
  </div>
</div>

Three things to try. Drag session length upward: the naive bar pulls away *faster than linearly*, the quadratic term made visible. Compare caching alone with delegation alone on Fable 5.1: caching cuts $30 to $3.2, delegation alone only to $18, so caching is the bigger dollar lever. Delegation still trims another ~28% on top of a healthy cache (to $2.30), and its bar is roughly what you pay when the cache is not working. And naive at Fable prices versus both levers at Sonnet prices differs by more than 30x for the identical workload.

## Into the Weeds: Distill the Playbook Before the Access Ends

Every lever so far assumes you still have frontier access. The most durable one assumes you are about to lose it, to a plan change, a rate limit, or a provider pulling the top tier from subagent use. The research name is *Concept Distillation*: collect the mistakes a weak model makes on your tasks, have the strong model induce general rules from them, validate the rules on held-out cases, and fold the survivors into the weak model's standing instructions. No fine-tuning: judgment exported as text, carried to every cheaper or newer model.

I can report a first-person version. On the last day of my own Fable 5 access in July, I pointed the session at itself: audit how this machine's sessions fail, and write the rules that prevent it. The result is a few plain-text files that cheaper models now execute mechanically, and its table of contents is essentially this post:

- **A dispatch rulebook:** the 2,000-token test, which tier handles which job, and an escalation ladder with hard retry caps.
- **Judgment rubrics:** what counts as "done" (verification output shown, not claimed), when the *direction* is wrong versus the execution, when to stop and ask, each as trigger, check, action.
- **Delegation templates:** fill-in-the-blank prompts that force a goal, acceptance criteria, and a report format on every subagent call.
- **An honesty clause:** rules recover execution discipline, not taste. On design calls and ambiguous product decisions, the weak model should say so, offer alternatives with tradeoffs, and let the human judge.

Whether this transfers fully is open: the research shows rules recovering a meaningful slice of the gap on tasks similar to those that generated them, not Haiku becoming Fable. The asymmetry is the point. The rules cost one session at frontier prices and run for free forever after, on every future model. The cheapest frontier token is the one you spent writing instructions for the model that replaced it.

<div class="ff-callout ff-callout-tip">
  <strong>Make corrections compound.</strong> Call the frontier model right after any model gets something wrong that you had to correct: "here is the mistake and the correction; write the general rule, with a trigger and a counterexample." A one-time fix becomes a standing instruction.
</div>

## References

<div class="d-bibliography">
<ol>
    <li>Anthropic. "Pricing." Per-MTok rates, caching multipliers (1.25x / 2x write; read 0.1x, 0.05x on Opus 5.5, 0.025x on Fable 5.1), Batch API discount, Sonnet 5 standard-price note, tokenizer note. <a href="https://platform.claude.com/docs/en/about-claude/pricing">platform.claude.com</a>. Retrieved September 2026.</li>
    <li>Chen, L., Zaharia, M., Zou, J. "FrugalGPT: How to Use Large Language Models While Reducing Cost and Improving Performance." arXiv:2305.05176, 2023. <a href="https://arxiv.org/abs/2305.05176">arxiv.org</a>.</li>
    <li>Anthropic Engineering. "How we built our multi-agent research system." Lead-agent / parallel-subagent architecture with isolated context windows. <a href="https://www.anthropic.com/engineering/multi-agent-research-system">anthropic.com</a>. Retrieved July 2026.</li>
    <li>Claude Code Documentation. "Create custom subagents." Per-subagent model selection and tool permissions. <a href="https://code.claude.com/docs/en/sub-agents">code.claude.com</a>. Retrieved July 2026.</li>
    <li>"Trust but Verify! A Survey on Verification Design for Test-time Scaling." Complexity asymmetry between verification and generation. arXiv:2508.16665. <a href="https://arxiv.org/pdf/2508.16665">arxiv.org</a>.</li>
    <li>"Learning to Self-Verify Makes Language Models Better Reasoners." Generation ability does not transfer to self-verification for free. arXiv:2602.07594. <a href="https://arxiv.org/pdf/2602.07594">arxiv.org</a>.</li>
    <li>"Concept Distillation from Strong to Weak Models via Hypotheses-to-Theories Prompting." Prompt-level rule distillation from teacher to student models. arXiv:2408.09365. <a href="https://arxiv.org/pdf/2408.09365">arxiv.org</a>.</li>
    <li>Anthropic. "Introducing Claude Sonnet 5." June 2026 launch positioning and agentic-coding benchmark figures. <a href="https://www.anthropic.com/news/claude-sonnet-5">anthropic.com</a>; TechCrunch coverage: <a href="https://techcrunch.com/2026/06/30/anthropic-launches-claude-sonnet-5-as-a-cheaper-way-to-run-agents/">techcrunch.com</a>.</li>
    <li>DEV Community. "Claude Prompt Caching in 2026: The 5-Minute TTL Change That's Costing You Money." <a href="https://dev.to/whoffagents/claude-prompt-caching-in-2026-the-5-minute-ttl-change-thats-costing-you-money-4363">dev.to</a>; Anthropic's disputed attribution via The Register: <a href="https://www.theregister.com/2026/04/13/claude_code_cache_confusion/">theregister.com</a>. Retrieved July 2026.</li>
    <li>MindStudio. "Smart Orchestrator + Cheaper Sub-Agent Models in Claude Code" and "Sub-Agents in Claude Code to Manage Context." Practitioner cost multiples and the 6,100-to-420-token delegation example (vendor blog; figures illustrative). <a href="https://www.mindstudio.ai/blog/smart-orchestrator-cheaper-sub-agent-models-claude-code">mindstudio.ai</a>. Retrieved July 2026.</li>
    <li>Digital Applied. "LLM Model Routing 2026: Cost-Quality Optimization." Production router savings ranges (vendor blog; figures illustrative). <a href="https://www.digitalapplied.com/blog/llm-model-routing-2026-cost-quality-optimization-engineering-guide">digitalapplied.com</a>. Retrieved July 2026.</li>
</ol>
</div>

<script src="/js/frontier-frugality.js"></script>
