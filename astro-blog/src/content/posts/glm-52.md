---
title: "GLM-5.2: The Open-Weight Model That Beats GPT-5.5"
subtitle: "How Zhipu AI's IndexShare mechanism makes 1M-token inference practical — and why the open-source community is paying attention."
authors:
  - "Michael Wan"
affiliations:
  - "Michael Wan Interactive Insights"
published: "2026-06-25"
abstract: "GLM-5.2 is an MIT-licensed open-weight model that extends its context window to 1M tokens and ranks as the highest open-source model on Z.ai's evaluations, beating GPT-5.5 on long-horizon coding. Its headline trick, IndexShare, reuses sparse-attention indices across groups of layers to cut per-token FLOPs by 2.9× at 1M context. This article explains the architecture, the core mechanic, the real benchmarks, and the community's reaction."
tags:
  - "explainer"
category: "ml"
thumbnail: "/img/glm-52/thumbnail.svg"
---

<p class="d-note">
    This article covers <a href="https://z.ai/blog/glm-5.2">GLM-5.2</a>, released by Zhipu AI (Z.ai) under a
    permissive MIT license. Figures are from the <a href="https://z.ai/blog/glm-5.2">official Z.ai announcement</a>;
    a few conceptual diagrams are original illustrations built to reinforce the mechanics, and are labelled as such.
</p>

## Introduction

For most of the last two years, the story of frontier AI was a story of closed labs. The best models lived behind APIs, their weights guarded, their architectures described only in vague blog posts. Open-weight models were the plucky underdogs — good enough for hobbyists, never quite good enough to threaten the leaders.

GLM-5.2 is the model that makes that framing feel out of date.

Released by the Chinese lab Zhipu AI under a permissive **MIT license** — no regional limits, no usage restrictions — GLM-5.2 is, by Z.ai's evaluations, **the highest-ranked open-source model**. It quadruples its predecessor's context window from 200K to **1M tokens**, and on long-horizon coding tasks it slots in **between Claude Opus 4.7 and 4.8** while beating GPT-5.5. You can download the weights, run them on your own hardware, and use them commercially.

The most direct way to see what changed is to look at agentic coding performance as a function of how much the model is allowed to "think":

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/glm-52/fig-agentic-effort.png" alt="Agentic coding performance by effort level — GLM-5.2 vs GLM-5.1 vs Claude Opus 4.7/4.8" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 1 (Z.ai).</strong> Agentic coding score versus average output tokens per task. GLM-5.2's
        three effort levels (Non-Thinking → High → Max) trace a curve sitting between Claude Opus 4.7 and 4.8, and
        a large jump over GLM-5.1. Spending more tokens (Max effort) buys higher scores.
    </figcaption>
</figure>

<div class="glm-stat-row">
    <div class="glm-stat">
        <div class="glm-stat-num">1M</div>
        <div class="glm-stat-label">token context window<br>(up from 200K)</div>
    </div>
    <div class="glm-stat">
        <div class="glm-stat-num">2.9×</div>
        <div class="glm-stat-label">lower per-token FLOPs<br>at 1M context (IndexShare)</div>
    </div>
    <div class="glm-stat">
        <div class="glm-stat-num">MIT</div>
        <div class="glm-stat-label">open-source license<br>no regional limits</div>
    </div>
</div>

The interesting question is not *that* GLM-5.2 is good — plenty of models are good. It's *how* a model with a million-token context window can be served cheaply and quickly enough to be practical. The answer is a cluster of efficiency tricks built on top of sparse attention — **IndexShare**, **KVShare**, and a sharpened **Multi-Token Prediction** head. This article walks through the architecture, builds intuition for IndexShare with a hands-on visualizer, looks at the real benchmarks, and ends with what the community actually said.

## Architecture for 1M Context

When GLM-5.2 extends the maximum context from 200K to 1M tokens, the primary inference bottleneck shifts away from raw computation toward **KV-cache capacity** and **long-context kernel overhead**. The architecture is a redesign aimed squarely at that shift. Z.ai's own diagram captures the three moving parts:

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/glm-52/fig-architecture.png" alt="Architecture changes in GLM-5.2: DSA blocks with and without indexer, IndexShare, shared KV cache, MTP modules, lower FLOPs, higher MTP acceptance length" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 2 (Z.ai).</strong> The GLM-5.2 architecture. The main model is a stack of DSA (sparse-attention)
        blocks; only some blocks compute the indexer — the rest <em>reuse top-k indices</em> (IndexShare). A shared
        KV cache (KVShare) feeds the Multi-Token Prediction (MTP) heads. The result: 2.9× lower single-token FLOPs and
        a 20% higher MTP acceptance length.
    </figcaption>
</figure>

Underneath, GLM-5.2 is a **Mixture-of-Experts (MoE)** model: rather than running every parameter on every token, it routes each token through a small subset of "expert" feed-forward networks — you get the knowledge capacity of a huge model at the inference cost of a much smaller one. (Independent analyses put it at roughly 744B total parameters with ~40B active per token.) Conceptually:

<figure class="d-figure">
    <div class="d-figure-content">
        <svg viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; font-family: var(--font-heading);">
            <!-- input -->
            <rect x="20" y="130" width="90" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-border)"/>
            <text x="65" y="155" text-anchor="middle" font-size="13" fill="var(--color-text)">token</text>
            <!-- router -->
            <rect x="160" y="120" width="110" height="60" rx="6" fill="var(--color-accent)" opacity="0.12" stroke="var(--color-accent)"/>
            <text x="215" y="145" text-anchor="middle" font-size="13" font-weight="600" fill="var(--color-accent)">router</text>
            <text x="215" y="163" text-anchor="middle" font-size="10" fill="var(--color-gray)">top-k experts</text>
            <line x1="110" y1="150" x2="160" y2="150" stroke="var(--color-gray)" stroke-width="1.5" marker-end="url(#arr)"/>
            <!-- experts -->
            <g font-size="11">
                <rect x="330" y="20"  width="120" height="34" rx="5" fill="var(--color-accent)" opacity="0.85"/>
                <text x="390" y="42" text-anchor="middle" fill="#fff">Expert 1 (active)</text>
                <rect x="330" y="64" width="120" height="34" rx="5" fill="var(--color-surface)" stroke="var(--color-border)"/>
                <text x="390" y="86" text-anchor="middle" fill="var(--color-gray-light)">Expert 2</text>
                <rect x="330" y="108" width="120" height="34" rx="5" fill="var(--color-accent)" opacity="0.85"/>
                <text x="390" y="130" text-anchor="middle" fill="#fff">Expert 3 (active)</text>
                <rect x="330" y="152" width="120" height="34" rx="5" fill="var(--color-surface)" stroke="var(--color-border)"/>
                <text x="390" y="174" text-anchor="middle" fill="var(--color-gray-light)">Expert 4</text>
                <rect x="330" y="196" width="120" height="34" rx="5" fill="var(--color-surface)" stroke="var(--color-border)"/>
                <text x="390" y="218" text-anchor="middle" fill="var(--color-gray-light)">… 100s more</text>
            </g>
            <line x1="270" y1="140" x2="330" y2="40"  stroke="var(--color-accent)" stroke-width="1.5"/>
            <line x1="270" y1="155" x2="330" y2="125" stroke="var(--color-accent)" stroke-width="1.5"/>
            <line x1="270" y1="160" x2="330" y2="81"  stroke="var(--color-gray-light)" stroke-width="1" stroke-dasharray="3 3"/>
            <line x1="270" y1="165" x2="330" y2="169" stroke="var(--color-gray-light)" stroke-width="1" stroke-dasharray="3 3"/>
            <!-- output -->
            <rect x="520" y="110" width="100" height="80" rx="6" fill="var(--color-surface)" stroke="var(--color-border)"/>
            <text x="570" y="145" text-anchor="middle" font-size="12" fill="var(--color-text)">weighted</text>
            <text x="570" y="162" text-anchor="middle" font-size="12" fill="var(--color-text)">sum</text>
            <line x1="450" y1="37"  x2="520" y2="135" stroke="var(--color-accent)" stroke-width="1.5"/>
            <line x1="450" y1="125" x2="520" y2="150" stroke="var(--color-accent)" stroke-width="1.5"/>
            <defs>
                <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-gray)"/>
                </marker>
            </defs>
        </svg>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 3 (illustration).</strong> Mixture-of-Experts routing. A lightweight router selects a small
        number of experts per token (highlighted), so only a fraction of the total parameters fire on any token.
    </figcaption>
</figure>

On top of the MoE backbone, GLM-5.2 builds on two ideas from the **DeepSeek** sparse-attention lineage:

- **Multi-head Latent Attention (MLA)** — compresses the key/value cache into a low-rank latent space, shrinking the memory footprint that normally explodes at long context.
- **DeepSeek Sparse Attention (DSA)** — instead of letting every token attend to every other token (which costs $O(n^2)$), a lightweight *indexer* scores all candidate tokens and keeps only the **top-k** most relevant ones for each query. Attention is then computed over that small selected set.

DSA is what makes long context affordable in principle. But it has a hidden cost, and closing that cost is exactly what GLM-5.2's headline contribution does.

## The IndexShare Trick

Here is the subtle problem with sparse attention. The expensive part of dense attention — comparing every query against every key — doesn't fully disappear. To *decide* which top-k tokens to keep, the indexer still has to score the query against **all** previous tokens. That scoring step is itself an $O(n)$-per-token operation, and crucially, standard DSA **recomputes it in every single layer**.

At a 1M-token context with ~90 layers, that indexer becomes the dominant cost. You are paying to re-rank a million tokens, ninety times over, for every token you generate.

GLM-5.2's insight is almost embarrassingly simple: **the set of relevant tokens doesn't change much from one layer to the next.** So why recompute it every layer?

<div class="d-callout">
    <strong>IndexShare in one sentence:</strong> run the full top-k indexer only once every <em>four</em> layers,
    and let the next three layers reuse the same selected token indices.
</div>

Concretely, layers are grouped in fours. The first layer of each group computes the indexer and picks the top-k tokens; the remaining three layers skip the indexer entirely and attend over the indices their group-leader already chose. That eliminates the indexer's dot-product and top-k computation in **three out of every four layers**.

<figure class="d-figure">
    <div class="d-figure-content">
        <svg viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; font-family: var(--font-heading);">
            <text x="20" y="24" font-size="12" font-weight="600" fill="var(--color-gray)">Standard DSA — indexer every layer</text>
            <g>
                <rect x="20"  y="36" width="90" height="36" rx="5" fill="var(--color-accent)" opacity="0.85"/>
                <rect x="120" y="36" width="90" height="36" rx="5" fill="var(--color-accent)" opacity="0.85"/>
                <rect x="220" y="36" width="90" height="36" rx="5" fill="var(--color-accent)" opacity="0.85"/>
                <rect x="320" y="36" width="90" height="36" rx="5" fill="var(--color-accent)" opacity="0.85"/>
                <text x="65"  y="59" text-anchor="middle" font-size="11" fill="#fff">L1 ⌕</text>
                <text x="165" y="59" text-anchor="middle" font-size="11" fill="#fff">L2 ⌕</text>
                <text x="265" y="59" text-anchor="middle" font-size="11" fill="#fff">L3 ⌕</text>
                <text x="365" y="59" text-anchor="middle" font-size="11" fill="#fff">L4 ⌕</text>
                <text x="430" y="59" font-size="20" fill="var(--color-gray-light)">…</text>
            </g>
            <text x="20" y="126" font-size="12" font-weight="600" fill="var(--color-gray)">IndexShare — indexer once per group of 4</text>
            <g>
                <rect x="20"  y="138" width="90" height="36" rx="5" fill="var(--color-accent)" opacity="0.85"/>
                <rect x="120" y="138" width="90" height="36" rx="5" fill="var(--color-surface)" stroke="var(--color-border)"/>
                <rect x="220" y="138" width="90" height="36" rx="5" fill="var(--color-surface)" stroke="var(--color-border)"/>
                <rect x="320" y="138" width="90" height="36" rx="5" fill="var(--color-surface)" stroke="var(--color-border)"/>
                <text x="65"  y="161" text-anchor="middle" font-size="11" fill="#fff">L1 ⌕</text>
                <text x="165" y="161" text-anchor="middle" font-size="11" fill="var(--color-gray)">L2 ↺</text>
                <text x="265" y="161" text-anchor="middle" font-size="11" fill="var(--color-gray)">L3 ↺</text>
                <text x="365" y="161" text-anchor="middle" font-size="11" fill="var(--color-gray)">L4 ↺</text>
                <text x="430" y="161" font-size="20" fill="var(--color-gray-light)">…</text>
            </g>
            <text x="20" y="206" font-size="11" fill="var(--color-gray)">⌕ = compute indexer (expensive)&nbsp;&nbsp;&nbsp;↺ = reuse indices (free)</text>
        </svg>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 4 (illustration).</strong> IndexShare. Filled blocks recompute the top-k indexer; outlined
        blocks reuse the indices chosen by their group leader. Three of every four layers skip the most expensive step.
    </figcaption>
</figure>

How much does this save? Let $D$ be the per-layer compute that is roughly independent of context length (the MLA projections and the MoE feed-forward), and let the indexer cost scale with context length $n$. For a model of $L$ layers with index groups of size $g$, the per-token compute is:

$$
\text{Standard} = L\,(D + \alpha n), \qquad
\text{IndexShare} = L\,D + \frac{L}{g}\,\alpha n
$$

The reduction factor is therefore $\dfrac{D + \alpha n}{D + \alpha n / g}$. When the context $n$ is small, the indexer is negligible and the two are basically equal. But as $n$ grows, the $\alpha n$ term dominates and the ratio approaches $g$. At a 1M-token context with $g = 4$, GLM-5.2 reports a **2.9× reduction in per-token FLOPs** — most of the way to the theoretical 4× ceiling.

The trade-off is *staleness*: a layer reusing indices from three layers back might miss a token that just became relevant. GLM-5.2's answer is empirical — it trains with IndexShare from mid-training (at a 128K sequence length) so the model *learns* to work within the constraint, and the result actually **outperforms** the previous version on long-context benchmarks while using less compute.

## Interactive: The IndexShare FLOPs Visualizer

The interactive below lets you feel the scaling. Drag the **context length** to see how the indexer's cost takes over at long context, and drag the **group size** to trade compute savings against index freshness. Group size 1 is plain DSA (no sharing); group size 4 is GLM-5.2's choice.

<div id="indexshare-interactive" class="glm-interactive">
    <div class="glm-controls">
        <div class="glm-slider-group">
            <label for="glm-ctx">Context length: <span id="glm-ctx-val">1M</span> tokens</label>
            <input type="range" id="glm-ctx" min="0" max="8" step="1" value="8">
        </div>
        <div class="glm-slider-group">
            <label for="glm-group">Layers per index group: <span id="glm-group-val">4</span></label>
            <input type="range" id="glm-group" min="1" max="8" step="1" value="4">
        </div>
    </div>
    <div class="glm-bars">
        <div class="glm-bar-row">
            <div class="glm-bar-label">Standard DSA</div>
            <div class="glm-bar-track"><div class="glm-bar-fill glm-bar-standard" id="glm-bar-standard"></div></div>
            <div class="glm-bar-num" id="glm-num-standard"></div>
        </div>
        <div class="glm-bar-row">
            <div class="glm-bar-label">IndexShare</div>
            <div class="glm-bar-track"><div class="glm-bar-fill glm-bar-share" id="glm-bar-share"></div></div>
            <div class="glm-bar-num" id="glm-num-share"></div>
        </div>
    </div>
    <div class="glm-readout">
        <div class="glm-readout-big"><span id="glm-reduction">2.9</span>×</div>
        <div class="glm-readout-sub">fewer per-token FLOPs — <span id="glm-saved">66%</span> saved · <span id="glm-stale" class="glm-stale"></span></div>
    </div>
    <p class="glm-fineprint">Relative per-token compute in a simplified model (L = 92 layers). The 2.9× figure at 1M tokens with group size 4 is anchored to Z.ai's reported number; the curve illustrates the scaling, not exact hardware FLOPs.</p>
</div>
<script src="/js/glm-52.js"></script>

Notice two things. First, at short context the two bars are nearly identical — IndexShare buys you almost nothing on a 4K prompt. Its entire value is unlocked at long context, which is precisely the regime GLM-5.2 targets. Second, pushing the group size past 4 keeps shrinking the bar, but Z.ai stopped at 4: beyond that, index staleness starts to hurt quality more than the compute saving is worth. Z.ai's own measurement of single-token FLOPs versus position confirms the scaling — the gap between GLM-5.1 and GLM-5.2 widens with context length, reaching the headline **2.9×** at 1M tokens (the right-hand panel of Figure 2).

## KVShare and Multi-Token Prediction

IndexShare cuts the indexing cost, but two more changes do the heavy lifting for real serving.

**KVShare** lets the Multi-Token Prediction module reuse the main model's KV cache instead of maintaining its own — important because, past 200K tokens, the bottleneck is no longer compute but **KV-cache capacity**.

**Multi-Token Prediction (MTP)** is GLM-5.2's speculative-decoding engine. A small MTP head drafts several future tokens at once, which the main model then verifies in a single pass — accepted drafts are free speed. GLM-5.2 retrains this head with two goals: minimize the draft loss and maximize the acceptance rate. With the number of MTP steps set to 7, the **acceptance length rises ~20% over the baseline** (from 4.56 to 5.47 accepted tokens per step in coding scenarios — see the right panel of Figure 2). IndexShare is applied to the MTP layer too: the indexer runs on the first speculative step and the rest reuse its indices.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/glm-52/fig-mtp.png" alt="Multi-Token Prediction: an MTP layer drafts future tokens from embeddings and hidden states across two steps" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 5 (Z.ai).</strong> How the MTP head drafts ahead. Each step feeds token embeddings plus hidden
        states (from the target model and earlier MTP steps) into a shared MTP layer to predict the next token, which
        the main model later verifies in bulk via speculative decoding.
    </figcaption>
</figure>

### The payoff: throughput at long context

These tricks compound. Because GLM-5.1 simply runs out of context past 200K, the only fair comparison at extreme length is GLM-5.2 against itself at shorter lengths — and the throughput advantage grows steadily as sequences get longer.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/glm-52/fig-throughput.png" alt="Normalized engine throughput across sequence lengths: GLM-5.2 reaches 6.97x at 1024k tokens" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 6 (Z.ai).</strong> Normalized engine throughput by sequence length (relative to GLM-5.1 at 32K).
        GLM-5.2's advantage climbs from 1.03× at 32K to <strong>6.97× at 1024K</strong> tokens; GLM-5.1 is out of
        context (OOC) beyond 200K. Long-context inference is exactly where the architecture pays off.
    </figcaption>
</figure>

## Benchmark Results

Across eight standard LLM benchmarks evaluated at maximum thinking effort, GLM-5.2 improves on GLM-5.1 by a wide margin and closes much of the gap to the closed-source frontier. The clearest single jump is on **Terminal-Bench 2.1 (81.0 vs. 63.5)**, landing within a few points of Claude Opus 4.8 (85.0). On **SWE-bench Pro** it scores 62.1 (vs. 58.4 for GLM-5.1), and it leads the comparison set on **MCP-Atlas (77.0)**.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/glm-52/fig-llm-benchmarks.png" alt="LLM performance across 8 benchmarks: GLM-5.2 vs GLM-5.1, Claude Opus 4.8, GPT-5.5, Gemini 3.1 Pro" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 7 (Z.ai).</strong> Eight benchmarks (SWE-bench Pro, Terminal-Bench 2.1, NL2Repo, DeepSWE,
        ProgramBench, MCP-Atlas, Tool-Decathlon, Humanity's Last Exam), all at maximum thinking effort. GLM-5.2 (blue)
        consistently clears GLM-5.1 (green) and competes with Claude Opus 4.8, GPT-5.5, and Gemini 3.1 Pro.
    </figcaption>
</figure>

The more telling test is **long-horizon coding** — multi-step tasks, run over many hours, where the model must plan, write, run, and revise across very long sequences. This is the regime the 1M context and IndexShare were built for, and it's where GLM-5.2 separates itself from the open field and **beats GPT-5.5**.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/glm-52/fig-long-horizon.png" alt="Long-horizon task evaluation: FrontierSWE, PostTrainBench, SWE-Marathon results" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 8 (Z.ai).</strong> Long-horizon evaluations. On <strong>FrontierSWE</strong> (max 20 hrs) GLM-5.2
        scores 74.4% — ahead of GPT-5.5 (72.6%) and Opus 4.7 (63.0%), just behind Opus 4.8 (75.1%). It similarly leads
        GPT-5.5 on <strong>PostTrainBench</strong> (34.3% vs. 25.0%) and edges it on <strong>SWE-Marathon</strong>
        (13.0% vs. 12.0%). Claude Opus 4.8 remains the overall leader.
    </figcaption>
</figure>

To make that capability usable, GLM-5.2 exposes selectable **thinking-effort levels** — Non-Thinking, High, and Max — that trade latency for depth (Figure 1). Z.ai recommends **Max** for complex multi-step coding where the model needs to plan and revise across long sequences, and lighter levels for everyday use.

<div class="d-callout">
    <strong>The cost story:</strong> with open MIT weights and (per independent listings) API pricing around
    <strong>$1.40 / $4.40</strong> per million input/output tokens, GLM-5.2 is priced to be run, not just admired.
    It is one of the first models where "self-host the frontier" is a genuinely realistic sentence.
</div>

## What the Community Said

The reception was warm but not uncritical. The lead thread on Hacker News drew **373 points and over 450 comments**, and the discussion is more revealing than any benchmark.

The dominant note was **gratitude to Chinese labs "for being open with their work"** — a recurring theme as Western frontier labs tighten access. For many developers, GLM-5.2 is less a single model than evidence that the open-weight ecosystem is keeping pace.

The sharpest *technical* discussion wasn't about IndexShare at all — it was about Z.ai's **`slime` asynchronous RL training framework**. One widely-upvoted comment argued that "the actual gap between frontier and non-frontier models right now is RL infrastructure, not pre-training compute." If that's true, an openly-described RL stack may matter more in the long run than any single architecture trick.

The criticism was honest too:

- **Running it locally is brutal.** 744B parameters do not fit on a laptop, or even most workstations. Quantized GGUF builds exist, but "open weights" and "runnable at home" are not the same sentence at this scale.
- **Top scores don't mean every output lands.** A "pelican on a bicycle" SVG generation impressed people; an opossum attempt was called "such a step down from GLM-5.1." A #1 index score is an average, not a guarantee.
- **Business-model tension.** Some users flagged pricing and packaging changes around the GLM-5 line, a reminder that sustaining open-weight releases is an unsolved economic problem.

## Key Takeaways

<div class="takeaways">
    <div class="takeaway">
        <span class="takeaway-num">1</span>
        <div class="takeaway-content"><strong>Open weights reached the frontier.</strong> GLM-5.2 is MIT-licensed, ranks as the highest open-source model on Z.ai's evaluations, and beats GPT-5.5 on long-horizon coding while sitting between Claude Opus 4.7 and 4.8.</div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">2</span>
        <div class="takeaway-content"><strong>IndexShare is the enabling trick.</strong> Reusing sparse-attention indices across groups of four layers cuts per-token FLOPs by ~2.9× at 1M context — the savings that make million-token inference affordable.</div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">3</span>
        <div class="takeaway-content"><strong>The savings are a long-context phenomenon.</strong> At short context IndexShare barely helps; its value scales with sequence length, which is exactly where GLM-5.2 competes.</div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">4</span>
        <div class="takeaway-content"><strong>It builds on DeepSeek's ideas.</strong> MLA and DSA come from the DeepSeek V3.2 lineage; GLM-5.2's contribution is the engineering that makes them cheap at extreme context.</div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">5</span>
        <div class="takeaway-content"><strong>The real moat may be RL infrastructure.</strong> The community's sharpest insight: with the `slime` framework, the gap between frontier and the rest looks increasingly like RL tooling, not pre-training compute.</div>
    </div>
</div>

## References

<div class="d-bibliography">
<ol>
    <li>Zhipu AI (Z.ai). "GLM-5.2." Official announcement (all figures sourced here). <a href="https://z.ai/blog/glm-5.2">z.ai/blog/glm-5.2</a>.</li>
    <li>GLM-5.2 model card. <a href="https://huggingface.co/zai-org/GLM-5.2">huggingface.co/zai-org/GLM-5.2</a>.</li>
    <li>Raschka, Sebastian. "GLM-5.2 and IndexShare for Long-Context Sparse Attention." <a href="https://sebastianraschka.com/blog/2026/glm-5-2-indexshare.html">sebastianraschka.com</a>.</li>
    <li>Artificial Analysis. "GLM-5.2 model overview." <a href="https://models.dev/models/zhipuai/glm-5.2/">models.dev</a>.</li>
    <li>"GLM 5.2 Is Out." Hacker News discussion. <a href="https://news.ycombinator.com/item?id=48518684">news.ycombinator.com</a>.</li>
</ol>
</div>
