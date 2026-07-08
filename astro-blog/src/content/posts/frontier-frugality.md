---
title: "Frontier Frugality"
subtitle: "The best model costs 10x the cheap one, and agentic workflows re-bill your entire context every turn. How to spend frontier tokens only where the intelligence actually lives."
authors:
  - "Michael Wan"
affiliations:
  - "Michael Wan Interactive Insights"
published: "2026-07-07"
abstract: "Frontier-tier models like Claude Fable 5 cost $10/$50 per million tokens — 10x the price of Haiku 4.5 — and an agentic coding session re-sends its whole history on every turn, so the bill grows roughly quadratically with session length. This post works through the levers that tame that bill: prompt caching, delegating bulk reading to cheap subagents, difficulty-based routing, verification asymmetry, and — the lever with the longest half-life — distilling the expensive model's judgment into rules files that cheap models can execute after your frontier access ends."
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
  .ff-scenario-bar { height: 100%; border-radius: 4px; background: #9ca3af; transition: width 0.25s ease; }
  .ff-scenario-bar-best { background: #2563eb; }
  .ff-scenario-cost { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; color: #111827; }
  .ff-factor-line { font-size: 0.88rem; color: #374151; margin-top: 12px; }
  .ff-factor-line strong { color: #2563eb; }

  /* Dark mode */
  :root[data-theme="dark"] .ff-calc { background: #1f2430; border-color: #3a4150; }
  :root[data-theme="dark"] .ff-calc-desc { color: #9aa3b2; }
  :root[data-theme="dark"] .ff-control label, :root[data-theme="dark"] .ff-scenarios-title { color: #c7cdd8; }
  :root[data-theme="dark"] .ff-stat { background: #262c3a; border-color: #3a4150; }
  :root[data-theme="dark"] .ff-stat-value, :root[data-theme="dark"] .ff-scenario-cost { color: #eceff4; }
  :root[data-theme="dark"] .ff-scenario-label { color: #aab2c0; }
  :root[data-theme="dark"] .ff-scenario-track { background: #3a4150; }
  :root[data-theme="dark"] .ff-control select { background: #262c3a; border-color: #3a4150; color: #eceff4; }

  @media (max-width: 560px) {
    .ff-scenario-row { grid-template-columns: 104px 1fr 72px; }
  }
</style>

<p class="d-note">
    All prices are nominal USD list prices per million tokens from Anthropic's official pricing
    documentation, retrieved July 2026. Savings percentages from routing and orchestration papers
    and vendor write-ups depend heavily on workload mix — treat them as commonly cited ranges,
    not guarantees. Several practitioner figures are flagged as such where they appear.
</p>

## The Price of Thinking at the Frontier

Every model family now ships as a ladder of tiers, and the rungs are far apart. Here is Anthropic's ladder as of July 2026:

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
      <td><strong>Claude Fable 5</strong></td>
      <td class="ff-num">$10.00</td>
      <td class="ff-num">$50.00</td>
      <td class="ff-num">$1.00</td>
      <td class="ff-num">10x</td>
    </tr>
    <tr>
      <td>Claude Opus 4.8</td>
      <td class="ff-num">$5.00</td>
      <td class="ff-num">$25.00</td>
      <td class="ff-num">$0.50</td>
      <td class="ff-num">5x</td>
    </tr>
    <tr>
      <td>Claude Sonnet 5</td>
      <td class="ff-num">$3.00</td>
      <td class="ff-num">$15.00</td>
      <td class="ff-num">$0.30</td>
      <td class="ff-num">3x</td>
    </tr>
    <tr>
      <td>Claude Haiku 4.5</td>
      <td class="ff-num">$1.00</td>
      <td class="ff-num">$5.00</td>
      <td class="ff-num">$0.10</td>
      <td class="ff-num">1x</td>
    </tr>
  </tbody>
</table>
</div>

<p class="d-caption">Anthropic list prices, July 2026. Sonnet 5 shows its standard rate; an introductory rate of $2/$10 applies through August 2026. Cache reads are 10% of base input price on every tier.</p>

A 10x price gap invites a simple mental model: **treat the frontier model as a senior consultant billing $800 an hour, and the cheap tiers as capable staff billing $80.** Nobody asks the consultant to photocopy documents. Yet that is exactly what most agentic setups do — the most expensive model in the building reads every file, scrolls every log, and pastes every test output into its own working memory.

This post is about not doing that. The question is not "how do I use the frontier model less?" It is "how do I make sure every frontier token I buy is spent on a decision only the frontier model can make?" The distinction matters because the frontier tier really is better at the things that are hard: architecture calls, ambiguous requirements, debugging that requires holding five constraints at once. Frugality that avoids those tokens is false economy. Frugality that protects them is the whole game.

There is also a deadline flavor to this for many users: frontier access is often the first thing to be restricted — rate-limited, pulled from subagent use, or gated to top-priced plans. The last section covers the lever that survives losing access entirely.

## Where the Money Actually Goes

The unit prices above understate the problem, because agentic workloads do not pay per message. They pay per *turn times context*, and the two multiply.

The API is stateless: every turn re-sends the full conversation history as input tokens. An agentic coding session is a loop — read a file, run a test, read the output, edit, repeat — and each iteration appends its results to the context. So the input bill for a session of $T$ turns, starting from a base context $C_0$ (system prompt, instructions, tool definitions) and adding $\Delta$ tokens of new material per turn, is:

<div class="d-math-block">

$$
\text{Input tokens billed} = \sum_{t=1}^{T} \big( C_0 + (t-1)\Delta \big) = T C_0 + \Delta \frac{T(T-1)}{2}
$$

</div>

The second term is the one that hurts: it grows with the *square* of session length. Read a 5,700-token file into context on turn 10 of a 60-turn session, and you do not pay for it once — you pay for it 50 more times, on every subsequent turn. At Fable's $10/MTok input price, a session that runs 60 turns while accumulating 3,000 tokens per turn bills about 6.2 million input tokens — roughly **$62 of input alone, before a single output token** — for what feels like "one coding task."

<div class="ff-callout ff-callout-note">
  <strong>The core mechanic: context is a recurring cost, not a one-time cost.</strong> Every token that enters the conversation is re-billed on every later turn. This single fact explains why the levers below work — they all either shrink what gets re-billed (delegation, compaction), discount the re-billing (caching), or move the re-billing to a cheaper meter (routing).
</div>

Two smaller line items compound the squeeze. Extended thinking is billed as *output* tokens at output rates — on Fable, $50/MTok — so a reasoning-heavy turn can cost several times its visible answer; practitioner rules of thumb budget 2–5x the visible output for thinking-heavy tasks (unverified but directionally consistent with billing mechanics). And tool-use system prompts add a few hundred tokens of fixed overhead per request, which is trivial once but not across a 60-turn loop.

With the cost structure clear, the levers follow almost mechanically. We will take them in order of effort: the one you enable, the two you architect, and the one you write down.

## Lever 1: Caching — the Discount You Must Not Fumble

<span class="ff-badge ff-badge-mech">Mechanism</span> Prompt caching attacks the re-billing directly. A cached prefix is read back at **0.1x** the base input price; writing to the cache costs 1.25x (or 2x for the 1-hour TTL option). The break-even is almost instant — a 5-minute cache write pays for itself after a single hit — and in a tight agentic loop, where turns arrive seconds apart, effectively all of the quadratic term gets the 90% discount. Our $62-of-input session drops to roughly $8.

Three rules keep the discount alive:

1. **The cache is a prefix match.** Change one byte early in the context — a timestamp in the system prompt, a reordered tool definition — and everything after it is invalidated. Stable content goes first; volatile content goes last.
2. **The default TTL is 5 minutes.** Pause longer than that between turns and the next request re-writes the cache at 1.25x instead of reading it at 0.1x. Workflows with human-in-the-loop gaps may justify the 1-hour TTL at 2x write cost; it breaks even after two hits.
3. **Do not assume the defaults are stable.** In March 2026, Anthropic quietly changed the default cache TTL from 1 hour to 5 minutes. Community trackers attributed effective cost increases of 20–60% on production workloads to the change; Anthropic disputed that the cache tweak caused the quota complaints. Whichever side is right about attribution, the lesson stands: if your unit economics depend on a caching default, monitor it like a dependency.

<div class="ff-callout ff-callout-warn">
  <strong>Caching discounts the waste; it does not remove it.</strong> A bloated context read at 0.1x is still bloat — it degrades quality separately from cost, because models reason worse when the window fills with stale tool output. Practitioners consistently report better results stopping well short of context saturation than pushing to the window limit. Caching is necessary, not sufficient.
</div>

## Lever 2: Don't Let the Expensive Model Read

<span class="ff-badge ff-badge-arch">Architecture</span> The quadratic term exists because bulk material enters the frontier model's context. The structural fix is to keep it out: **the frontier model orchestrates; cheap models read.**

In this commander/worker pattern, the expensive model never opens a large file, greps a repository, or tails a build log itself. It dispatches a subagent — running a cheap model in its *own, isolated context window* — to do the reading and return only conclusions. Anthropic's write-up of its multi-agent research system describes exactly this shape: a lead agent plans and spawns workers that each explore in a private window and send back condensed results. In one worked example circulating from Anthropic material, a subagent read 6,100 tokens of file content and returned a 420-token summary. The 5,700-token difference never touched the orchestrator's context — which means it was never re-billed on any subsequent turn, and never diluted the orchestrator's attention.

The billing arithmetic is lopsided in the pattern's favor twice over. The bulk tokens are paid *once* instead of on every remaining turn, and they are paid at the worker's meter instead of the commander's — Haiku's $1/MTok rather than Fable's $10. Practitioner write-ups claim 40% savings swapping four of five agents in a team from Opus to Sonnet, and 5–10x swapping subagents to Haiku-class models (vendor figures, not audited benchmarks — but the direction follows from the price table).

The hard part is triage, and it is the commander's judgment that pays for itself here. A useful rule of thumb from the practitioner literature: *if you could hand the task to a junior developer with a clear, unambiguous spec and expect a reliable result, a cheap subagent can handle it. If it needs judgment, cross-cutting context, or architectural taste, it stays with the orchestrator.* Delegation with a sloppy spec produces sloppy work that the expensive model then spends expensive tokens repairing — every dispatch needs a goal, explicit acceptance criteria, and a report format ("conclusions and file:line references only, no dumps").

<div class="ff-callout ff-callout-tip">
  <strong>The 2,000-token test.</strong> Before any step, ask: will this pull more than ~2,000 tokens of raw material into the expensive context when I only need a summary of it? If yes, delegate it. The threshold is arbitrary; the habit is not.
</div>

## Lever 3: Route by Difficulty, Escalate on Failure

<span class="ff-badge ff-badge-arch">Architecture</span> Delegation splits work *within* a task. Routing splits work *across* tasks: most queries never needed the frontier model at all.

The foundational result is FrugalGPT (Stanford, 2023), which chained models as a cascade — try the cheapest model first, score the answer, escalate only if the score fails — and reported matching GPT-4-level accuracy at **up to 98% lower cost** on its benchmark tasks. Later systems like RouteLLM replaced the sequential cascade with a learned router that predicts the needed tier up front from preference data, saving the wasted cheap-model call. Production router products in 2026 commonly cite 40–70% savings at under 2% quality loss (vendor figures; your mileage depends entirely on what fraction of your traffic is genuinely easy).

For interactive work, the cascade collapses into a simple discipline you can run by hand:

1. **Default down.** Start every subtask at the cheapest tier that has ever handled that kind of subtask well.
2. **Escalate on evidence, not vibes.** One failure at Haiku-class → retry at Sonnet-class. Two failures at Sonnet-class on the *same* subtask → hand to the frontier model, with the full failure trail attached so it does not re-discover what already failed.
3. **De-escalate after the breakthrough.** Once the frontier model has cracked the hard instance, the fix is usually a pattern — batch-apply the remaining instances with a cheap model, giving the proven diff as an example.

Step 2's fine print matters: escalation is for judgment failures, not missing facts. A build that fails with a module-not-found error does not need a smarter model; it needs someone to read the error. Escalating fact-fetch problems is the most common way routing discipline leaks money.

One more routing option is easy to overlook because it is boring: **take the tier upgrade.** Anthropic launched Sonnet 5 in June 2026 explicitly positioned as "a cheaper way to run agents," reporting 63.2% on its agentic-coding benchmark against Opus 4.8's 69.2% at less than half the price (Anthropic's own numbers). The cheap rungs of the ladder keep rising; a routing policy tuned six months ago probably over-escalates today.

## Lever 4: Generate Cheap, Verify Smart

<span class="ff-badge ff-badge-arch">Architecture</span> There is a genuine asymmetry between producing work and checking it. Recent theory makes it precise: verifying a long chain of reasoning sits in a low complexity class feasible for constant-depth transformer computation, while generating that chain is substantially harder. In practice, models often verify above their generation ability — which suggests an economical division of labor: **let a cheap model generate, and spend smarter tokens on review.**

The pattern that falls out is plan–execute–review:

- The frontier model writes the *plan*: the spec, the interfaces, the acceptance criteria. This is short — hundreds of output tokens — and it is where its judgment concentrates.
- A cheap model *executes* the plan. This is where most tokens burn: file reads, diffs, test loops. All of it at the $1–3/MTok meter.
- A reviewer *checks* the result against the acceptance criteria. Review reads a diff and a test log — far fewer tokens than the execution consumed.

One research caveat keeps the pattern honest: self-verification does not come for free. Training a model to generate better does not automatically make it better at checking its own work, and a producer grading itself inherits its own blind spots. The verifier should be an *independent pass* — a fresh context, ideally a model at least as strong as the producer, given the acceptance criteria and the artifacts but not the producer's reasoning (which would anchor it). "The producer never verifies its own work" costs one extra dispatch and catches the failure mode that costs the most: confident, unverified wrong answers that you build on for ten more turns.

## Smaller Knobs That Stack

<span class="ff-badge ff-badge-knob">Configuration</span> Three settings compound with everything above, because pricing multipliers are multiplicative:

- **Batch API: flat −50%** on input and output for anything asynchronous — evaluation sweeps, bulk classification, overnight report generation. Most batches complete within an hour. Stacked with cache reads, a cached-corpus pipeline approaches ~5% of the uncached rate card (0.1 cache x 0.5 batch).
- **Effort control.** Current models expose an `effort` parameter (`low` through `max`) that directly governs thinking-token spend and tool-call verbosity. Since thinking bills at output rates — the most expensive meter on the sheet — defaulting subagents and mechanical tasks to `low` effort is one of the highest-leverage single lines of configuration available.
- **Output discipline.** Report formats that say "conclusions only, no file dumps, long artifacts go to files" are not just context hygiene for the reader — output tokens cost 5x input tokens on every tier.

## Interactive: The Agentic Session Bill

The levers are easier to feel than to read about. The calculator below models a single agentic session: $T$ turns, each appending $\Delta$ tokens of tool results and file contents to a 15,000-token base context, with 400 output tokens per turn. It prices four configurations of the same session — naive, caching only, delegation only, and both — using July 2026 list prices, with delegated reading done by Haiku 4.5 subagents that return 10%-length summaries (subagent costs included, with a 2x overhead allowance for their own loops). Set the sliders to 60 turns on Fable to reproduce the $62-of-input example from earlier — the naive figure will read slightly higher because it also includes output tokens.

<div class="ff-calc" id="ff-calculator">
  <h4>Agentic session cost calculator</h4>
  <p class="ff-calc-desc">Input bill per turn = full history re-sent (cache reads at 0.1x where enabled). Delegation keeps (share)% of each turn's bulk material out of the orchestrator's context, replacing it with a 10% summary; subagent reading and output are billed at Haiku 4.5 rates with a 2x overhead factor.</p>

  <div class="ff-control">
    <label>Orchestrator model</label>
    <select id="ff-model-select">
      <option value="fable" selected>Claude Fable 5 — $10 / $50</option>
      <option value="opus">Claude Opus 4.8 — $5 / $25</option>
      <option value="sonnet">Claude Sonnet 5 — $3 / $15</option>
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

Two behaviors are worth hunting for with the sliders. Drag session length upward with everything else fixed: the naive bar pulls away from the others *faster than linearly* — that is the quadratic term made visible, and it is why long naive sessions feel disproportionately expensive. Then max out the delegation share on a long session: delegation beats caching alone precisely when sessions are long and bulky, because it removes tokens from the re-billing loop entirely instead of discounting them. The levers stack — and note that the naive column at Fable prices versus the both column at Sonnet prices frequently differ by more than an order of magnitude for the identical workload.

## Into the Weeds: Distill the Playbook Before the Access Ends

Every lever so far assumes you still have frontier access. The most durable lever assumes you are about to lose it — to a plan change, a rate limit, or a provider pulling the top tier from subagent use. The question becomes: **what can one expensive session buy that keeps paying after the meter stops?**

The research literature has a name for the answer: *Concept Distillation* — prompt-level distillation from a strong model to a weak one. The procedure: collect the mistakes a weak model makes on your tasks; have the strong model analyze those mistakes and induce general rules from them; validate the rules against held-out cases; fold the survivors into the weak model's standing instructions. No fine-tuning, no weights — judgment, exported as text. The paper's authors pitch exactly the migration story: develop the concepts once, then carry them across every cheaper or newer model you switch to later, "drastically reducing rework."

I can report a first-person version of this. On the last day of my own Fable 5 access this month, I pointed the session not at a coding task but at itself: audit how this machine's sessions actually fail, and write the operating rules that prevent it. The output was a small institution of plain-text files that cheaper models now execute mechanically — and its table of contents is essentially this post:

- **A dispatch rulebook** — when the orchestrator must delegate (the 2,000-token test from Lever 2), which model tier handles which job class, and an escalation ladder with hard retry caps (Lever 3's cascade, written down).
- **Judgment rubrics** — externalized decisions: what counts as "done" (verification output shown, not claimed), when the *direction* is wrong versus the execution, when to stop and ask. Each written as trigger → check → action, with one positive and one negative example, so a weaker model can apply them without possessing the judgment that produced them.
- **Delegation templates** — fill-in-the-blank dispatch prompts that force every subagent call to carry a goal, acceptance criteria, and a report format ("conclusions and file:line only; long artifacts go to files").
- **An honesty clause** — the part most distillations skip. Rules recover execution discipline; they do not recover taste. For design calls and ambiguous product decisions, the weak model's instruction is to say so, offer two or three alternatives with tradeoffs, and let the human judge — because faking confidence is the one unrecoverable failure mode.

Whether this transfers fully is an open empirical question — the academic result says prompt-distilled rules recover a meaningful slice of the gap on tasks similar to those that generated the rules, not that they make Haiku into Fable. What is not in question is the asymmetry of the trade: the rules cost one session at frontier prices and are executed for free forever after, by every future model, including ones that do not exist yet. The cheapest frontier token is the one you spent writing instructions for the model that replaced it.

<div class="ff-callout ff-callout-tip">
  <strong>Make corrections compound.</strong> The highest-value moment to invoke the frontier model is right after any model gets something wrong in a way you had to correct. One frontier call — "here is the mistake and the correction; write the general rule, with a trigger and a counterexample" — converts a one-time fix into a permanent standing instruction. Judgment is expensive to rent and cheap to store.
</div>

## Key Takeaways

<div class="takeaways">
    <div class="takeaway">
        <span class="takeaway-num">1</span>
        <div class="takeaway-content">
            <strong>Context is a recurring cost.</strong> The API re-sends the full history every turn, so a session's input bill grows with the square of its length. Every other lever works by shrinking, discounting, or re-metering that re-billing.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">2</span>
        <div class="takeaway-content">
            <strong>Caching is mandatory but fragile.</strong> Cache reads cost 0.1x and break even after one hit — but the cache is a prefix match, the default TTL is 5 minutes, and the March 2026 TTL change showed that defaults can move under you. Structure prompts stable-first and monitor the assumptions.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">3</span>
        <div class="takeaway-content">
            <strong>The frontier model should never read in bulk.</strong> Delegate reading to cheap subagents in isolated contexts that return conclusions only; route tasks cheap-first and escalate on evidence with the failure trail attached; let cheap models generate and independent passes verify. Commander judgment, worker tokens.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">4</span>
        <div class="takeaway-content">
            <strong>Multipliers stack.</strong> Batch (0.5x) times cache reads (0.1x) approaches 5% of list price; low effort settings cut thinking tokens billed at the expensive output meter; and the tier below the frontier keeps improving — re-tune your routing every time the ladder moves.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">5</span>
        <div class="takeaway-content">
            <strong>The most durable spend is distillation.</strong> Use frontier sessions to write the rules, rubrics, and templates that cheaper models execute mechanically — judgment exported as text survives losing access, and one corrected mistake turned into a standing rule keeps paying forever.
        </div>
    </div>
</div>

## References

<div class="d-bibliography">
<ol>
    <li>Anthropic. "Pricing." Official per-MTok rates, prompt caching multipliers (1.25x / 2x write, 0.1x read), and Batch API discount. <a href="https://platform.claude.com/docs/en/about-claude/pricing">platform.claude.com</a>. Retrieved July 2026.</li>
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
