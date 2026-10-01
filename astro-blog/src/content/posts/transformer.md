---
title: "Understanding the Transformer"
subtitle: "Understanding the building blocks and design choices of the Transformer architecture."
authors:
  - "Ashish Vaswani"
  - "Noam Shazeer"
  - "Niki Parmar"
  - "et al."
affiliations:
  - "Google Brain"
  - "Google Research"
published: "2017-06-12"
written: "2026-02-03"
doi: "arXiv:1706.03762"
doiUrl: "https://arxiv.org/abs/1706.03762"
abstract: "Understanding the building blocks and design choices of the Transformer architecture that powers GPT, BERT, and modern language models."
tags:
  - "explainer"
category: "ml"
thumbnail: "/img/transformer/thumbnail.svg"
---

<p class="d-note">
    This article explains the landmark paper
    <a href="https://arxiv.org/abs/1706.03762">Attention Is All You Need</a>
    by Vaswani et al. (2017), which introduced the Transformer architecture
    that powers GPT, BERT, and nearly every modern language model.
    All interactive numbers below are small toy values chosen for illustration,
    not weights from a trained model.
</p>

<style>
  /* ---- Transformer post (tf- prefix). Interactives: public/js/transformer.js ---- */
  .tf-fig, .tf-static { --tf-blue: #2a78d6; --tf-orange: #eb6834; --tf-aqua: #1baf7a; --tf-track: rgba(128,136,148,0.16);
    width: 100%; min-width: 0; font-family: var(--font-heading); font-size: 14px; color: var(--color-text); }
  /* Figures are a light island in dark mode (styles.css restores light variables inside
     .d-figure-content), so the light accent values are kept in both themes. */
  @media (max-width: 560px) { .tf-figure .d-figure-content { padding: 14px 10px; } }
  /* Legend dots in the equation panels: query orange, key blue, value aqua (matches the interactives). */
  .d-legend-dot.query { background: #eb6834; }
  .d-legend-dot.key { background: #2a78d6; }
  .d-legend-dot.value { background: #1baf7a; }

  .d-equation-main .katex-display { overflow-x: auto; overflow-y: hidden; padding: 2px 0; }
  .tf-callout { border-left: 2px solid var(--color-border); padding: 2px 0 2px 16px; margin: 24px 0; color: var(--color-gray); font-size: 0.95rem; line-height: 1.6; }
  .tf-callout strong { color: var(--color-text); }

  /* controls */
  .tf-controls { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .tf-hint { font-size: 13px; color: var(--color-gray); }
  .tf-seg { display: flex; flex-wrap: wrap; gap: 4px; }
  .tf-seg-btn { font: inherit; font-size: 12.5px; padding: 4px 10px; border: 1px solid var(--color-border); border-radius: 5px; background: var(--color-bg); color: var(--color-gray); cursor: pointer; }
  .tf-seg-btn[aria-pressed="true"] { background: var(--color-text); border-color: var(--color-text); color: var(--color-bg); }
  .tf-status { font-size: 13px; color: var(--color-gray); margin: 10px 0 0; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }

  /* bars */
  .tf-bar { height: 12px; background: var(--tf-track); border-radius: 3px; overflow: hidden; }
  .tf-bar-fill { height: 100%; background: var(--tf-blue); transition: width 0.15s; }
  .tf-bar-fill.orange { background: var(--tf-orange); }
  .tf-bar-fill.aqua { background: var(--tf-aqua); }
  .tf-wlist { display: grid; gap: 3px; }
  .tf-wrow { display: grid; grid-template-columns: minmax(0, 76px) minmax(0, 1fr) 46px; gap: 10px; align-items: center; font-size: 13px; cursor: pointer; }
  .tf-wlist-compact .tf-wrow { grid-template-columns: 46px minmax(0, 1fr) 46px; cursor: default; }
  .tf-wlabel { text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tf-wrow.is-query .tf-wlabel { color: var(--tf-orange); font-weight: 700; }
  .tf-wval { text-align: right; font-size: 12px; color: var(--color-gray); font-variant-numeric: tabular-nums; }

  /* A: sentence chips */
  .tf-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 16px; }
  .tf-chip { font: inherit; font-size: 15px; padding: 3px 8px; border: 1px solid transparent; border-radius: 4px; cursor: pointer;
    color: var(--color-text); background: color-mix(in srgb, var(--tf-blue) calc(var(--w, 0) * 85%), transparent); }
  .tf-chip.is-query { border-color: var(--tf-orange); box-shadow: inset 0 -3px 0 var(--tf-orange); font-weight: 700; }

  /* B: planes */
  .tf-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  @media (max-width: 560px) { .tf-two { grid-template-columns: minmax(0, 1fr); } }
  .tf-panel { min-width: 0; }
  .tf-panel-title { font-size: 12.5px; font-weight: 600; color: var(--color-gray); margin-bottom: 6px; }
  .tf-plane { display: block; width: 100%; max-width: 300px; height: auto; margin: 0 auto; background: var(--color-bg); border: 1px solid var(--color-border); }
  .tf-plane-drag { touch-action: none; cursor: crosshair; }
  .tf-grid line { stroke: var(--color-border); stroke-width: 0.6; }
  .tf-grid line.tf-axis { stroke: var(--color-gray-light); stroke-width: 1; }
  .tf-vec { stroke-width: 2.5; }
  .tf-vec-q { stroke-width: 3; }
  .tf-stroke-blue { stroke: var(--tf-blue); }
  .tf-stroke-orange { stroke: var(--tf-orange); }
  .tf-fill-blue { fill: var(--tf-blue); }
  .tf-fill-orange { fill: var(--tf-orange); }
  .tf-fill-aqua { fill: var(--tf-aqua); }
  .tf-plabel { font-size: 11px; font-weight: 600; }
  .tf-text-blue { fill: var(--tf-blue); }
  .tf-text-orange { fill: var(--tf-orange); }
  .tf-text-aqua { fill: var(--tf-aqua); }
  .tf-text-strong { fill: var(--color-text); }
  .tf-handle { fill: var(--tf-orange); stroke: var(--color-bg); stroke-width: 2; cursor: grab; }
  .tf-hull { fill: color-mix(in srgb, var(--tf-aqua) 8%, transparent); stroke: var(--tf-aqua); stroke-width: 1; stroke-dasharray: 3 3; }
  .tf-spoke { stroke: var(--tf-aqua); stroke-width: 1.5; }
  .tf-outdot { fill: var(--color-bg); stroke: var(--color-text); stroke-width: 2.5; }
  .tf-live { width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 14px; font-size: 13px; font-variant-numeric: tabular-nums; }
  .tf-live th, .tf-live td { padding: 4px 6px; border-bottom: 1px solid var(--color-border); text-align: right; }
  .tf-live th { font-size: 11px; font-weight: 600; color: var(--color-gray); }
  .tf-live th:first-child, .tf-live td:first-child { text-align: left; width: 20%; }
  .tf-live th:last-child { width: 40%; }
  .tf-live .tf-bar { display: inline-block; vertical-align: middle; width: calc(100% - 48px); }
  .tf-live .tf-wval { display: inline-block; width: 44px; }

  /* C: slider + stats */
  .tf-slider { display: flex; align-items: center; gap: 10px; }
  .tf-slider input { width: 170px; max-width: 50vw; }
  .tf-dk { min-width: 72px; font-variant-numeric: tabular-nums; }
  .tf-stats { margin-top: 10px; padding-top: 6px; border-top: 1px solid var(--color-border); font-size: 12.5px; }
  .tf-stat { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; color: var(--color-gray); }
  .tf-stat b { color: var(--color-text); font-variant-numeric: tabular-nums; }

  /* D: heatmaps */
  .tf-heat { display: block; width: 100%; max-width: 340px; height: auto; margin: 6px auto; }
  .tf-hbg { fill: var(--color-bg); }
  .tf-hcell { fill: var(--tf-blue); }
  .tf-hlabel { font-size: 10.5px; fill: var(--color-text); }
  .tf-hrow { cursor: pointer; transition: opacity 0.12s; }
  .tf-hrow.is-dim { opacity: 0.28; }
  .tf-axis-note, .tf-head-cap { font-size: 13px; color: var(--color-gray); margin: 4px 0; }
  .tf-minis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; max-width: 360px; margin: 8px auto; }
  .tf-mini-cap { text-align: center; font-size: 12px; color: var(--color-gray); }
  .tf-flow { margin: 14px 0 6px; }
  .tf-flow-k { font-size: 12px; color: var(--color-gray); }
  .tf-concat { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 2px; margin-top: 4px; }
  .tf-concat-seg { text-align: center; font-size: 11px; padding: 5px 0; background: color-mix(in srgb, var(--tf-blue) 22%, transparent); }
  .tf-concat-seg.c0, .tf-concat-seg.c1, .tf-concat-seg.c2 { background: color-mix(in srgb, var(--tf-blue) 55%, transparent); }
  .tf-flow-arrow { margin-top: 8px; font-family: var(--font-mono); font-size: 12.5px; overflow-wrap: anywhere; }

  /* E: mask grid */
  .tf-mgrid { display: grid; gap: 3px; max-width: 440px; margin: 0 auto; font-size: 12px; }
  .tf-mcorner { font-size: 10px; color: var(--color-gray-light); align-self: end; padding-bottom: 2px; }
  .tf-mhead { text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--color-gray); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; align-self: end; }
  .tf-mlabel { font: inherit; font-family: var(--font-mono); font-size: 11.5px; text-align: right; padding: 0 6px 0 0; border: 0; background: none; color: var(--color-text); cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .tf-mlabel.is-sel { color: var(--tf-orange); font-weight: 700; }
  .tf-mcell { font: inherit; font-size: 11px; min-width: 0; min-height: 30px; padding: 0; border: 1px solid var(--color-border); border-radius: 3px; cursor: pointer;
    color: var(--color-text); font-variant-numeric: tabular-nums; background: color-mix(in srgb, var(--tf-blue) calc(var(--w, 0) * 100%), var(--color-bg)); transition: opacity 0.12s; }
  .tf-mcell.is-other { opacity: 0.4; }
  .tf-mcell.is-sel { border-color: var(--tf-orange); }
  .tf-mcell.is-blocked { color: var(--color-gray); background: repeating-linear-gradient(45deg, var(--color-canvas-subtle) 0 4px, var(--color-border) 4px 5px); }

  /* static figures */
  .tf-embed { display: grid; gap: 8px; max-width: 460px; margin: 0 auto; }
  .tf-erow { display: grid; grid-template-columns: minmax(0, 64px) 54px minmax(0, 1fr); gap: 10px; align-items: center; }
  .tf-ehead { font-size: 11px; color: var(--color-gray); text-transform: uppercase; letter-spacing: 0.05em; }
  .tf-eword { text-align: right; font-weight: 600; }
  .tf-eid { font-family: var(--font-mono); font-size: 12px; color: var(--color-gray); }
  .tf-vecrow { display: flex; gap: 2px; align-items: center; min-width: 0; }
  .tf-cell { flex: 1 1 0; min-width: 0; height: 18px; border-radius: 2px; background: color-mix(in srgb, var(--tf-blue) calc(var(--v, 0) * 85%), var(--color-bg)); border: 1px solid var(--color-border); }
  .tf-cell.neg { background: color-mix(in srgb, var(--tf-orange) calc(var(--v, 0) * 85%), var(--color-bg)); }
  .tf-cell.q { background: color-mix(in srgb, var(--tf-orange) calc(var(--v, 0) * 85%), var(--color-bg)); }
  .tf-cell.k { background: color-mix(in srgb, var(--tf-blue) calc(var(--v, 0) * 85%), var(--color-bg)); }
  .tf-cell.v { background: color-mix(in srgb, var(--tf-aqua) calc(var(--v, 0) * 85%), var(--color-bg)); }
  .tf-more { flex: none; padding-left: 4px; color: var(--color-gray); font-size: 12px; }
  .tf-qkv { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 10px 12px; align-items: center; max-width: 480px; margin: 0 auto; }
  .tf-qkv-x { grid-row: 1 / span 3; }
  .tf-qkv-op { font-size: 13px; color: var(--color-gray); white-space: nowrap; }
  .tf-qkv-lab { font-size: 12px; font-weight: 600; margin-bottom: 3px; }
  .tf-qkv-lab.q { color: var(--tf-orange); }
  .tf-qkv-lab.k { color: var(--tf-blue); }
  .tf-qkv-lab.v { color: var(--tf-aqua); }
  .tf-block { display: block; width: 100%; max-width: 380px; height: auto; margin: 0 auto; }
  .tf-block .stream { stroke: var(--color-gray); stroke-width: 4; }
  .tf-block .branch { fill: none; stroke: var(--color-gray-light); stroke-width: 1.5; }
  .tf-block .box { fill: var(--color-bg); stroke: var(--color-text); stroke-width: 1.2; }
  .tf-block .box.attn { stroke: var(--tf-blue); stroke-width: 2; }
  .tf-block .box.ffn { stroke: var(--tf-aqua); stroke-width: 2; }
  .tf-block .norm { fill: var(--color-canvas-subtle); stroke: var(--color-gray-light); stroke-width: 1; }
  .tf-block .plus { fill: var(--color-bg); stroke: var(--color-text); stroke-width: 1.5; }
  .tf-block text { fill: var(--color-text); font-size: 12px; font-family: var(--font-heading); }
  .tf-block text.muted { fill: var(--color-gray); font-size: 11px; }
  .tf-block .arrowhead { fill: var(--color-gray-light); }
  .tf-steps { width: 100%; max-width: 460px; margin: 0 auto; border-collapse: collapse; font-size: 13px; }
  .tf-steps th, .tf-steps td { padding: 5px 8px; border-bottom: 1px solid var(--color-border); text-align: left; }
  .tf-steps th { font-size: 11px; color: var(--color-gray); font-weight: 600; }
  .tf-steps td.tok { font-family: var(--font-mono); font-size: 12px; overflow-wrap: anywhere; }
  .tf-steps td.next { font-family: var(--font-mono); font-size: 12px; color: var(--tf-orange); font-weight: 700; }

  /* Shared script.js positional-encoding interactive hard-codes light backgrounds
     in styles.css; override them here for dark mode. */
  [data-theme="dark"] .pe-interactive-wrapper { background: var(--color-canvas-subtle); border-color: var(--color-border); }
  [data-theme="dark"] .pe-grid { background: var(--color-border); }
  [data-theme="dark"] .pe-value-item { background: var(--color-surface); border-color: var(--color-border); }
  [data-theme="dark"] .pe-values { border-top-color: var(--color-border); }
</style>

## Key Takeaways

<div class="takeaways">
    <div class="takeaway">
        <span class="takeaway-num">1</span>
        <div class="takeaway-content">
            <strong>Every token reads from every other token in one step.</strong> There is no left-to-right chain, so training runs in parallel and distant words connect directly.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">2</span>
        <div class="takeaway-content">
            <strong>Attention is a soft lookup: compare, normalize, blend.</strong> A query is scored against every key, softmax turns scores into weights, and the output mixes the values.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">3</span>
        <div class="takeaway-content">
            <strong>Dividing scores by $\sqrt{d_k}$ keeps attention trainable.</strong> Unscaled scores grow with vector size until softmax picks one token and almost no learning signal flows back.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">4</span>
        <div class="takeaway-content">
            <strong>Eight small heads see more than one big head.</strong> Eight 64-number heads cost about the same as one 512-number head, and each can learn a different relationship.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">5</span>
        <div class="takeaway-content">
            <strong>A mask is what separates reading from writing.</strong> Hiding future positions lets a decoder train on whole sentences yet generate one token at a time, as GPT does.
        </div>
    </div>
</div>

## Introduction

How do you teach a model to relate any two words in a sentence, no matter how far apart
they sit? For years the answer was to walk the sentence left to right and hope the signal
survived the trip. The Transformer threw that assumption out.

Its single idea fits in one sentence: **every token looks at every other token and decides
how much to take from each.** That operation is called *attention*. Stack it with a small
per-token network, repeat a few times, and you have the Transformer.

The roadmap: why the old sequential models hurt, how text becomes vectors, attention as a
soft lookup, the scaled formula, where queries, keys and values come from, multiple heads,
masking, the full block, word order, and finally why it won.

## The Sequential Bottleneck

Before the Transformer, sequence tasks such as translation were dominated by **recurrent
neural networks (RNNs)**, especially LSTMs and GRUs. An RNN reads one token at a time and
carries a running summary, the *hidden state*:

<div class="d-math-block">
$$h_t = f(h_{t-1}, x_t)$$
</div>

In words: the state at position $t$ is computed from the previous state and the current
token. Position $t$ cannot start until position $t-1$ has finished.

<figure class="d-figure">
    <div class="d-figure-content">
        <div class="diagram-flow">
            <div class="flow-row">
                <span class="flow-label">Token:</span>
                <div class="flow-items">
                    <span class="flow-item">x₁</span>
                    <span class="flow-arrow">→</span>
                    <span class="flow-item">x₂</span>
                    <span class="flow-arrow">→</span>
                    <span class="flow-item">x₃</span>
                    <span class="flow-arrow">→</span>
                    <span class="flow-item">x₄</span>
                    <span class="flow-arrow">→</span>
                    <span class="flow-item">x₅</span>
                </div>
            </div>
            <div class="flow-row">
                <span class="flow-label">Hidden:</span>
                <div class="flow-items">
                    <span class="flow-item highlight">h₁</span>
                    <span class="flow-arrow">→</span>
                    <span class="flow-item highlight">h₂</span>
                    <span class="flow-arrow">→</span>
                    <span class="flow-item highlight">h₃</span>
                    <span class="flow-arrow">→</span>
                    <span class="flow-item highlight">h₄</span>
                    <span class="flow-arrow">→</span>
                    <span class="flow-item highlight">h₅</span>
                </div>
            </div>
            <div class="flow-annotation">↑ must wait for previous</div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        RNNs process tokens sequentially. Each hidden state depends on the previous one,
        preventing parallel computation.
    </figcaption>
</figure>

That chain causes two problems.

- **No parallelism.** Within one sentence the steps must run in order, so a GPU sits mostly
  idle on long inputs.
- **Long-range forgetting.** Information from word 1 must survive every step to reach word
  50. Training adjusts weights using the *gradient*, a measure of how much the error changes
  when a weight moves slightly, and that signal must also travel back through every step,
  shrinking as it goes.

<div class="tf-callout">
    <strong>Key question:</strong> can every position reach every other position directly,
    with no chain in between? The Transformer's answer is yes.
</div>

## From Words to Vectors

A network cannot read letters, so the first step turns text into numbers. The sentence is
split into **tokens**: whole words or common word pieces. Each token has an ID in a fixed
vocabulary (the paper used about 37,000 shared tokens for English-German). Each ID then
picks one row from a learned table, the **embedding**: a list of $d_{\text{model}} = 512$
numbers that the model is free to tune during training.

<figure class="d-figure tf-figure">
    <div class="d-figure-content">
        <div class="tf-static">
            <div class="tf-embed">
                <div class="tf-erow"><span class="tf-ehead" style="text-align:right">token</span><span class="tf-ehead">ID</span><span class="tf-ehead">embedding (first 8 of 512 numbers)</span></div>
                <div class="tf-erow"><span class="tf-eword">The</span><span class="tf-eid">464</span><div class="tf-vecrow"><span class="tf-cell" style="--v:.6"></span><span class="tf-cell neg" style="--v:.3"></span><span class="tf-cell" style="--v:.1"></span><span class="tf-cell neg" style="--v:.7"></span><span class="tf-cell" style="--v:.2"></span><span class="tf-cell" style="--v:.5"></span><span class="tf-cell neg" style="--v:.1"></span><span class="tf-cell" style="--v:.3"></span><span class="tf-more">…</span></div></div>
                <div class="tf-erow"><span class="tf-eword">animal</span><span class="tf-eid">5044</span><div class="tf-vecrow"><span class="tf-cell neg" style="--v:.5"></span><span class="tf-cell" style="--v:.9"></span><span class="tf-cell" style="--v:.4"></span><span class="tf-cell neg" style="--v:.2"></span><span class="tf-cell neg" style="--v:.6"></span><span class="tf-cell" style="--v:.1"></span><span class="tf-cell" style="--v:.7"></span><span class="tf-cell neg" style="--v:.3"></span><span class="tf-more">…</span></div></div>
                <div class="tf-erow"><span class="tf-eword">was</span><span class="tf-eid">373</span><div class="tf-vecrow"><span class="tf-cell" style="--v:.2"></span><span class="tf-cell neg" style="--v:.4"></span><span class="tf-cell neg" style="--v:.8"></span><span class="tf-cell" style="--v:.3"></span><span class="tf-cell" style="--v:.6"></span><span class="tf-cell neg" style="--v:.2"></span><span class="tf-cell" style="--v:.1"></span><span class="tf-cell" style="--v:.5"></span><span class="tf-more">…</span></div></div>
                <div class="tf-erow"><span class="tf-eword">tired</span><span class="tf-eid">10032</span><div class="tf-vecrow"><span class="tf-cell neg" style="--v:.2"></span><span class="tf-cell" style="--v:.7"></span><span class="tf-cell" style="--v:.3"></span><span class="tf-cell" style="--v:.8"></span><span class="tf-cell neg" style="--v:.4"></span><span class="tf-cell neg" style="--v:.1"></span><span class="tf-cell" style="--v:.5"></span><span class="tf-cell neg" style="--v:.6"></span><span class="tf-more">…</span></div></div>
            </div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        Text becomes a list of vectors: one row of 512 numbers per token. Blue cells are
        positive, orange negative, darker means larger. IDs and values are made up for illustration.
    </figcaption>
</figure>

From here on, "a token" means its vector. Everything the Transformer does is arithmetic on
this stack of vectors, one per position.

## Attention as a Soft Lookup

Attention lets each token ask a question of the whole sentence. It works like a fuzzy
dictionary lookup with three roles:

- the **query**: what the current token is looking for;
- a **key** for every token: what that token can offer, used for matching;
- a **value** for every token: the content handed over if it is chosen.

The query is compared with every key to give a score. Scores can be any real number, so
they pass through **softmax**: raise $e$ to each score, then divide by the total. The
results are positive and add up to 1, and a larger score always gets a larger share. These
shares are the **attention weights**. The output is the values mixed in those proportions.

Try it on a classic example from Google's 2017 announcement of the Transformer. Who does
"it" refer to?

<figure class="d-figure tf-figure">
    <div class="d-figure-content">
        <div class="tf-fig" id="tf-attn-sentence"></div>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Interactive A.</strong> Click any word to make it the query. Chip shading and the
        bars show how much weight it gives each word. Switch the last word to "wide" and "it"
        moves from "animal" to "street". Toy 6-number vectors chosen for illustration, not a
        trained model.
    </figcaption>
</figure>

Two things to notice. Every word gets *some* weight: attention is a soft blend, not a hard
pick. And "it" reaches "animal" six positions away in one step, with no chain of hidden
states in between.

## Scaled Dot-Product Attention

Now the precise version. Stack all queries into a matrix $Q$, all keys into $K$ and all
values into $V$, one row per token. The paper computes attention for every query at once:

<div class="d-equation-panel">
    <div class="d-equation-title">Scaled Dot-Product Attention</div>
    <div class="d-equation-main">
        $$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right) V$$
    </div>
    <div class="d-equation-legend">
        <div class="d-legend-item">
            <span class="d-legend-dot query"></span>
            <span><strong>Query</strong> $Q$: one row per token, what that token is looking for</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot key"></span>
            <span><strong>Key</strong> $K$: one row per token, what that token offers for matching</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot value"></span>
            <span><strong>Value</strong> $V$: one row per token, the content that gets mixed</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot param"></span>
            <span><strong>Scaling</strong> $\sqrt{d_k}$: square root of the key length; keeps scores in a workable range</span>
        </div>
    </div>
</div>

Read it right to left in four steps:

1. **Score.** $QK^T$ holds every dot product $q \cdot k$: multiply matching entries and
   add them up. A large dot product means the two vectors point the same way.
2. **Scale.** Divide every score by $\sqrt{d_k}$, where $d_k$ is the length of each key.
3. **Normalize.** Softmax each row, so each query's weights add up to 1.
4. **Blend.** Multiply by $V$: each output row is the weighted mix of the value rows.

The interactive below runs exactly these steps for one query, three tokens and $d_k = 2$,
small enough to draw on paper.

<figure class="d-figure tf-figure">
    <div class="d-figure-content">
        <div class="tf-fig" id="tf-drag-query"></div>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Interactive B.</strong> Drag the orange query arrow. Left: the query is compared
        with three fixed keys by dot product. Right: the output (ring) is the weighted mix of the
        three values; each value's dot grows with its weight. The output always lands inside the
        dashed triangle, because weights are positive and sum to 1. Toy numbers.
    </figcaption>
</figure>

Drag the query onto the key for "the", at $[1, 0]$. The scores are $1, 0.5, -1$; divided by
$\sqrt{2}$ they become $0.71, 0.35, -0.71$; softmax gives weights $0.51, 0.36, 0.12$; and the
output is $0.51 \cdot [3, 0.5] + 0.36 \cdot [1, 3] + 0.12 \cdot [0, 0] = [1.90, 1.34]$.
Point the query toward "cat" and the cat row takes over. That is the whole mechanism;
everything else in the Transformer repeats it at scale.

### Why scale the scores?

Suppose each entry of $q$ and $k$ is a random number with mean 0 and variance 1. A dot
product adds up $d_k$ such products, so its variance is $d_k$ and its typical size
(standard deviation) is $\sqrt{d_k}$. With $d_k = 512$ scores spread over roughly
$\pm 22$. Softmax of numbers that far apart gives almost all the weight to the largest one.

That is bad for learning. When one weight is nearly 1 and the rest nearly 0, nudging a
score barely changes any weight, so the gradient through softmax is close to zero and the
query and key matrices stop learning. Dividing by $\sqrt{d_k}$ brings the spread back to
about 1 at every size.

<figure class="d-figure tf-figure">
    <div class="d-figure-content">
        <div class="tf-fig" id="tf-scale-demo"></div>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Interactive C.</strong> Slide $d_k$ from 2 to 512. One query and eight keys with
        random unit-variance entries (fixed seed, so the numbers are repeatable). Left: softmax of
        raw scores collapses onto one key as $d_k$ grows. Right: scaled scores keep a usable spread.
        "Learning signal" is $\sum_i w_i(1-w_i)$, the sum of softmax's own slopes; near 0 means
        almost no gradient.
    </figcaption>
</figure>

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/transformer/fig2a-scaled-dotproduct-attn.png" alt="Scaled Dot-Product Attention" style="max-width: 300px; width: 100%; height: auto; margin: 0 auto; display: block;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 2 (left) from the paper:</strong> the same four steps as a diagram. MatMul
        scores queries against keys, Scale divides by $\sqrt{d_k}$, the optional Mask is covered
        below, SoftMax normalizes, and the last MatMul blends the values.
    </figcaption>
</figure>

## Where Queries, Keys and Values Come From

So far the queries, keys and values were given. In the Transformer they all come from the
same token vector $x$, multiplied by three learned matrices:

<div class="d-math-block">
$$q = x W^Q, \qquad k = x W^K, \qquad v = x W^V$$
</div>

In words: one vector, three different learned views of it. $W^Q$ learns what a token
should ask for, $W^K$ how it should advertise itself, and $W^V$ what it should hand over.
None of these roles is programmed; they emerge from training.

<figure class="d-figure tf-figure">
    <div class="d-figure-content">
        <div class="tf-static">
            <div class="tf-qkv">
                <div class="tf-qkv-x"><div class="tf-qkv-lab">token vector $x$ ("it")</div><div class="tf-vecrow"><span class="tf-cell" style="--v:.5"></span><span class="tf-cell neg" style="--v:.4"></span><span class="tf-cell" style="--v:.8"></span><span class="tf-cell" style="--v:.2"></span><span class="tf-cell neg" style="--v:.6"></span><span class="tf-cell" style="--v:.3"></span><span class="tf-more">…</span></div></div>
                <span class="tf-qkv-op">× $W^Q$ →</span>
                <div><div class="tf-qkv-lab q">query $q$</div><div class="tf-vecrow"><span class="tf-cell q" style="--v:.9"></span><span class="tf-cell q" style="--v:.2"></span><span class="tf-cell q" style="--v:.5"></span><span class="tf-cell q" style="--v:.1"></span><span class="tf-more">…</span></div></div>
                <span class="tf-qkv-op">× $W^K$ →</span>
                <div><div class="tf-qkv-lab k">key $k$</div><div class="tf-vecrow"><span class="tf-cell k" style="--v:.3"></span><span class="tf-cell k" style="--v:.7"></span><span class="tf-cell k" style="--v:.1"></span><span class="tf-cell k" style="--v:.6"></span><span class="tf-more">…</span></div></div>
                <span class="tf-qkv-op">× $W^V$ →</span>
                <div><div class="tf-qkv-lab v">value $v$</div><div class="tf-vecrow"><span class="tf-cell v" style="--v:.4"></span><span class="tf-cell v" style="--v:.8"></span><span class="tf-cell v" style="--v:.6"></span><span class="tf-cell v" style="--v:.2"></span><span class="tf-more">…</span></div></div>
            </div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        Every token is projected three ways. The same three matrices are shared by all positions,
        so the model learns one way to ask and one way to answer, applied everywhere.
        Cell values are illustrative.
    </figcaption>
</figure>

When queries, keys and values all come from the same sequence, it is **self-attention**:
the sentence reads itself. When the queries come from one sequence and the keys and values
from another, it is **cross-attention**; the decoder uses it to read the source sentence
during translation.

## Multi-Head Attention

One attention pattern can only blend in one way per token. But "it" needs to know who it
refers to, the verb needs its subject, and every word benefits from knowing its neighbour.
**Multi-head attention** runs several attentions side by side, each with its own $W^Q$,
$W^K$, $W^V$, so each can learn a different relationship.

<figure class="d-figure tf-figure">
    <div class="d-figure-content">
        <div class="tf-fig" id="tf-heads"></div>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Interactive D.</strong> Pick a head; hover or tap a row to read it. The three
        patterns are hand-drawn illustrations of the kinds of behaviour real heads show. For
        evidence from a trained model, see the paper's Figures 3 to 5 further down.
    </figcaption>
</figure>

<div class="d-equation-panel">
    <div class="d-equation-title">Multi-Head Attention</div>
    <div class="d-equation-main">
        $$\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, \ldots, \text{head}_h)\, W^O$$
        $$\text{head}_i = \text{Attention}(QW_i^Q,\; KW_i^K,\; VW_i^V)$$
    </div>
    <div class="d-equation-legend">
        <div class="d-legend-item">
            <span class="d-legend-dot param"></span>
            <span>$W_i^Q, W_i^K, W_i^V$ ($512 \times 64$ each): head $i$'s own learned projections</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot param"></span>
            <span>$W^O$ ($512 \times 512$): mixes the concatenated head outputs back into one vector</span>
        </div>
    </div>
</div>

In words: each head projects the tokens down to a small space, runs attention there, and
the head outputs are glued together and mixed by $W^O$.

The arithmetic is what makes this cheap. The paper uses $d_{\text{model}} = 512$ and
$h = 8$ heads, so each head works in $d_k = 512 / 8 =$ <strong class="hi">64 dimensions</strong>.
Eight heads of 64 cost about the same as one head of 512, so **the model gets eight views of
the sentence for the price of one.**

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/transformer/fig2b-multihead-attn.png" alt="Multi-Head Attention" style="max-width: 360px; width: 100%; height: auto; margin: 0 auto; display: block;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 2 (right) from the paper:</strong> $h$ parallel attention layers, each with
        its own linear projections of V, K and Q, then Concat and a final Linear ($W^O$).
    </figcaption>
</figure>

## Masking: No Peeking Ahead

The encoder reads a sentence that already exists, so every token may look at every other
token. The decoder *writes* a sentence, one token at a time. When it predicts word 3 it must
not see word 3 or anything after it, or training would teach it to copy the answer.

The fix is a **causal mask**. Before softmax, every score where the key comes after the
query is set to $-\infty$. Since $e^{-\infty} = 0$, those positions get exactly zero weight,
and softmax spreads the full weight over the positions that remain.

<figure class="d-figure tf-figure">
    <div class="d-figure-content">
        <div class="tf-fig" id="tf-mask"></div>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Interactive E.</strong> Rows are the token asking, columns the token being read.
        Switch to the decoder mask: everything above the diagonal is blocked, and each row's
        weights are re-shared over what it can still see. Toy scores.
    </figcaption>
</figure>

The mask also explains a phrase in the paper's Figure 1: **"outputs (shifted right)"**.
During training the decoder is fed the target sentence moved one place to the right, with a
start symbol in front. Position $i$ then sees the target up to word $i-1$ and is trained to
predict word $i$. Thanks to the mask, all positions train in parallel on one forward pass.

At inference time there is no target, so the decoder generates in a loop, feeding each
prediction back in:

<figure class="d-figure tf-figure">
    <div class="d-figure-content">
        <div class="tf-static">
            <table class="tf-steps">
                <thead><tr><th>Step</th><th>Decoder input so far</th><th>Predicts</th></tr></thead>
                <tbody>
                    <tr><td>1</td><td class="tok">&lt;start&gt;</td><td class="next">The</td></tr>
                    <tr><td>2</td><td class="tok">&lt;start&gt; The</td><td class="next">cat</td></tr>
                    <tr><td>3</td><td class="tok">&lt;start&gt; The cat</td><td class="next">sat</td></tr>
                    <tr><td>4</td><td class="tok">&lt;start&gt; The cat sat</td><td class="next">down</td></tr>
                    <tr><td>5</td><td class="tok">&lt;start&gt; The cat sat down</td><td class="next">&lt;end&gt;</td></tr>
                </tbody>
            </table>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        Generation, one token per step. Training sees all five rows at once; the causal mask
        guarantees each row only uses the tokens to its left.
    </figcaption>
</figure>

## The Transformer Block

Attention mixes information *across* positions. Each block pairs it with a second sub-layer
that works on each position *on its own*, and wraps both in two pieces of plumbing.

- A **residual connection** adds a sub-layer's output back onto its input:
  $x + \text{Sublayer}(x)$. The sub-layer only has to learn a *change* to the vector, and
  the gradient has a direct path back through the addition, which keeps deep stacks
  trainable.
- **Layer normalization** (LayerNorm) rescales each token's vector to mean 0 and variance
  1, then applies a learned scale and shift. It keeps numbers in a steady range from layer
  to layer.

A useful picture is a **residual stream**: each token's vector flows straight up through
the stack, and each sub-layer reads from it and adds its result back.

<figure class="d-figure tf-figure">
    <div class="d-figure-content">
        <div class="tf-static">
            <svg class="tf-block" viewBox="0 0 380 340" role="img" aria-label="One encoder block: the residual stream with attention and feed-forward sub-layers adding back into it">
                <defs><marker id="tf-blk-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="arrowhead" d="M0,0 L10,5 L0,10 z"/></marker></defs>
                <line class="stream" x1="80" y1="330" x2="80" y2="14"/>
                <path class="branch" d="M80 292 H250 V272" marker-end="url(#tf-blk-arrow)"/>
                <rect class="box attn" x="160" y="226" width="180" height="44" rx="5"/>
                <text x="250" y="244" text-anchor="middle">Multi-head</text>
                <text x="250" y="260" text-anchor="middle">self-attention</text>
                <path class="branch" d="M250 226 V206 H94" marker-end="url(#tf-blk-arrow)"/>
                <circle class="plus" cx="80" cy="206" r="11"/>
                <text x="80" y="210.5" text-anchor="middle">+</text>
                <rect class="norm" x="35" y="166" width="90" height="22" rx="4"/>
                <text x="80" y="181" text-anchor="middle">LayerNorm</text>
                <path class="branch" d="M80 150 H250 V130" marker-end="url(#tf-blk-arrow)"/>
                <rect class="box ffn" x="160" y="84" width="180" height="44" rx="5"/>
                <text x="250" y="102" text-anchor="middle">Feed-forward</text>
                <text x="250" y="118" text-anchor="middle">(each token alone)</text>
                <path class="branch" d="M250 84 V64 H94" marker-end="url(#tf-blk-arrow)"/>
                <circle class="plus" cx="80" cy="64" r="11"/>
                <text x="80" y="68.5" text-anchor="middle">+</text>
                <rect class="norm" x="35" y="26" width="90" height="22" rx="4"/>
                <text x="80" y="41" text-anchor="middle">LayerNorm</text>
                <text class="muted" x="92" y="12">to the next block</text>
                <text class="muted" x="92" y="336">token vectors in</text>
                <text class="muted" x="168" y="287">read</text>
                <text class="muted" x="168" y="201">add back</text>
                <text class="muted" x="168" y="145">read</text>
                <text class="muted" x="168" y="59">add back</text>
                <text class="muted" x="20" y="110" transform="rotate(-90 20 110)" text-anchor="middle">residual stream</text>
            </svg>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        One encoder block, as in the paper: each sub-layer reads the stream, its output is added
        back, and the sum is normalized, $\text{LayerNorm}(x + \text{Sublayer}(x))$. Many later
        models move LayerNorm inside the branch, before the sub-layer ("pre-norm"), which trains
        more stably when stacks get deep.
    </figcaption>
</figure>

The second sub-layer is a small two-layer network applied to every position separately:

<div class="d-math-block">
$$\text{FFN}(x) = \max(0,\; xW_1 + b_1)\,W_2 + b_2$$
</div>

In words: widen each token's vector from 512 to 2,048 numbers, zero out the negatives (the
ReLU, $\max(0, \cdot)$), and project back to 512. **Attention moves information between
tokens; the feed-forward network processes what each token has gathered.**

### Encoder and decoder

The paper stacks six blocks on each side.

- **Encoder block:** self-attention (no mask) + feed-forward. It turns the source sentence
  into one context-rich vector per source token.
- **Decoder block:** masked self-attention over the output so far, then **cross-attention**,
  then feed-forward. In cross-attention the *queries* come from the decoder and the *keys
  and values* come from the encoder's final output. It is how the word being written looks
  up the relevant words in the source sentence.

A final linear layer and softmax turn each decoder output vector into a probability for
every token in the vocabulary.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/transformer/fig1-architecture.png" alt="Transformer Architecture — original paper figure" style="max-width: 440px; width: 100%; height: auto; margin: 0 auto; display: block;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 1 from the paper:</strong> the full Transformer. Left, the encoder block
        (×N, N = 6). Right, the decoder block with masked self-attention, cross-attention whose
        keys and values arrow in from the encoder, and feed-forward. Every sub-layer is followed
        by "Add & Norm", the residual plus LayerNorm above.
    </figcaption>
</figure>

## Positional Encoding

Attention treats its input as a *set*: shuffle the tokens and each output just moves with
its token, unchanged. That is a problem, since "dog bites man" and "man bites dog" would
look identical. So before the first block, the Transformer adds a **positional encoding**
to each embedding, giving every position a distinct fingerprint.

<div class="d-math-block">
$$PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)$$
$$PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)$$
</div>

Think of each pair of dimensions as a clock hand turning at its own speed. Fast hands
change from one position to the next and pin down fine position; slow hands barely move
and give coarse position. Reading all the hands together tells you exactly where you are,
the way hours, minutes and seconds together give the time.

<figure class="d-figure">
    <div class="d-figure-content pe-interactive-wrapper">
        <div id="pos-encoding-interactive"></div>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Interactive:</strong> Drag the slider or click on the grid to explore how positional encodings change.
        Each row is a position, each column is a dimension. Orange = sin (even dims), blue = cos (odd dims).
        Lower dimensions vary quickly; higher dimensions vary slowly.
    </figcaption>
</figure>

For any fixed offset $k$, $PE_{pos+k}$ is a rotation of $PE_{pos}$, a linear function of
it. The authors chose sinusoids hoping this would make relative positions easy to attend to.

## Why It Won

The paper compares one layer of each type on three costs, for a sequence of $n$ tokens
with vectors of size $d$.

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Layer type</th>
                <th>Work per layer</th>
                <th>Steps that must run in order</th>
                <th>Longest path between two tokens</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Self-attention</strong></td>
                <td>$O(n^2 \cdot d)$</td>
                <td class="heat" style="--v:0">$O(1)$</td>
                <td class="heat" style="--v:0">$O(1)$</td>
            </tr>
            <tr>
                <td>Recurrent</td>
                <td>$O(n \cdot d^2)$</td>
                <td class="heat hot" style="--v:1">$O(n)$</td>
                <td class="heat hot" style="--v:1">$O(n)$</td>
            </tr>
            <tr>
                <td>Convolutional</td>
                <td>$O(k \cdot n \cdot d^2)$</td>
                <td class="heat" style="--v:0">$O(1)$</td>
                <td class="heat" style="--v:0.4">$O(\log_k n)$</td>
            </tr>
        </tbody>
    </table>
</div>

Darker cells mean more sequential work or a longer path. Self-attention wins both: no chain
of steps, and any two tokens are one hop apart. The work column is a trade-off. When the
sentence is shorter than the vector size ($n < d$, true for most 2017 translation
sentences with $d = 512$), $n^2 d$ is smaller than $n d^2$.

<div class="tf-callout">
    <strong>The cost:</strong> the attention matrix has $n^2$ entries, so memory and compute
    grow with the square of the length. Doubling the context quadruples it. Much later work
    (FlashAttention, sparse and linear attention) targets exactly this term.
</div>

The paper trained on WMT 2014 English-German (4.5M sentence pairs) and English-French (36M
pairs) using 8 NVIDIA P100 GPUs. The base model trained in 12 hours, the big model in
<strong class="hi">3.5 days</strong>.

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Model (paper Table 2)</th>
                <th>EN-DE BLEU</th>
                <th>EN-FR BLEU</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>ConvS2S ensemble (previous best)</td>
                <td class="heat" style="--v:0">26.36</td>
                <td class="heat hot" style="--v:0.94">41.29</td>
            </tr>
            <tr>
                <td>Transformer (base)</td>
                <td class="heat" style="--v:0.46">27.3</td>
                <td class="heat" style="--v:0">38.1</td>
            </tr>
            <tr>
                <td><strong>Transformer (big)</strong></td>
                <td class="heat hot" style="--v:1"><strong class="hi">28.4</strong></td>
                <td class="heat hot" style="--v:1">41.8</td>
            </tr>
        </tbody>
    </table>
</div>

BLEU measures overlap with human reference translations; higher is better. Shading is
relative within each column. A single big Transformer beat the best previous *ensemble*
(several models averaged) on both language pairs, and did it with far less compute:

<div class="dv">
    <div class="dv-title">Training cost, English-German (FLOPs, paper Table 2)</div>
    <div class="dv-row"><span class="dv-label">ConvS2S ensemble</span><div class="dv-bar"><div class="dv-track"><div class="dv-fill muted" style="width:100%"></div></div><span class="dv-val"><b>7.7</b> × 10¹⁹</span></div></div>
    <div class="dv-row"><span class="dv-label">Transformer (big)</span><div class="dv-bar"><div class="dv-track"><div class="dv-fill blue" style="width:29.9%"></div></div><span class="dv-val"><b>2.3</b> × 10¹⁹</span></div></div>
    <div class="dv-row"><span class="dv-label">Transformer (base)</span><div class="dv-bar"><div class="dv-track"><div class="dv-fill blue" style="width:4.3%"></div></div><span class="dv-val"><b>0.33</b> × 10¹⁹</span></div></div>
    <div class="dv-note">The base model beat the previous best ensemble using about 1/23 of its training compute.</div>
</div>

## What Attention Heads Learn

Interactive D drew head patterns by hand. The paper shows real ones from its trained model.
None of this structure is programmed; it emerges from training on translation.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/transformer/fig3-long-range-attn.png" alt="Long-range attention dependency" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 3 from the paper:</strong> encoder self-attention in layer 5 following a
        long-distance dependency. Many heads link "making" to the distant words that complete the
        phrase "making ... more difficult". Colors are different heads.
    </figcaption>
</figure>

<figure class="d-figure">
    <div class="d-figure-content" style="display: flex; gap: 1rem; width: 100%; overflow: hidden;">
        <img src="/img/transformer/fig4-anaphora-1.png" alt="Anaphora resolution head 1" style="flex: 1; min-width: 0; width: 100%; height: auto;">
        <img src="/img/transformer/fig4-anaphora-2.png" alt="Anaphora resolution head 2" style="flex: 1; min-width: 0; width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 4 from the paper:</strong> two heads in layer 5 that appear to do anaphora
        resolution, linking the pronoun "its" back to the noun it refers to. This is the real
        counterpart of head 2 in Interactive D.
    </figcaption>
</figure>

<figure class="d-figure">
    <div class="d-figure-content" style="display: flex; gap: 1rem; width: 100%; overflow: hidden;">
        <img src="/img/transformer/fig5-sentence-structure-1.png" alt="Sentence structure attention 1" style="flex: 1; min-width: 0; width: 100%; height: auto;">
        <img src="/img/transformer/fig5-sentence-structure-2.png" alt="Sentence structure attention 2" style="flex: 1; min-width: 0; width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 5 from the paper:</strong> two heads whose behaviour tracks sentence
        structure. Different heads clearly learned different jobs.
    </figcaption>
</figure>

## The Lineage: One Block, Three Descendants

The paper shipped a full encoder-decoder for translation. What followed took the stack
apart. The block turned out to be reusable on its own, and the field split along the seam
between encoder and decoder.

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Family</th>
                <th>Uses</th>
                <th>Self-attention mask</th>
                <th>Best at</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Encoder-only</strong> (BERT)</td>
                <td>Encoder stack</td>
                <td>None: bidirectional</td>
                <td>Understanding: embeddings, retrieval, rerankers, classification</td>
            </tr>
            <tr>
                <td><strong>Decoder-only</strong> (GPT)</td>
                <td>Decoder stack, no cross-attention</td>
                <td>Causal</td>
                <td>Generation: chat, code, autocompletion</td>
            </tr>
            <tr>
                <td><strong>Encoder-decoder</strong> (T5, original)</td>
                <td>Both</td>
                <td>Encoder none, decoder causal</td>
                <td>Sequence-to-sequence: translation, summarization</td>
            </tr>
        </tbody>
    </table>
</div>

**The mask is the main difference.** Remove the causal mask and every position sees the
full sentence: that is BERT, built for understanding. Keep the mask so each position sees
only its past, and the model can generate one token at a time: that is GPT. Same block,
one switch flipped, the same switch as in Interactive E.

<div class="tf-callout">
    <strong>Encoders never went away.</strong> Even in the age of large decoder-only chat
    models, encoder-style Transformers remain the workhorse for text embeddings and for
    reranking search results, jobs that need one strong bidirectional read rather than
    token-by-token generation.
</div>

<script src="/js/transformer.js" defer></script>

<section class="d-bibliography">

## References

1. Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N.,
   Kaiser, Ł., & Polosukhin, I. (2017).
   [Attention Is All You Need](https://arxiv.org/abs/1706.03762).
   NeurIPS 2017.

2. Bahdanau, D., Cho, K., & Bengio, Y. (2014).
   Neural Machine Translation by Jointly Learning to Align and Translate. ICLR 2015.

3. Ba, J. L., Kiros, J. R., & Hinton, G. E. (2016). Layer Normalization.

</section>

<footer class="d-appendix">

This article is a Distill-style explanation of the Transformer paper.
[Read the original paper →](https://arxiv.org/abs/1706.03762)

</footer>
