---
title: "DeepSeek V4"
subtitle: "How hybrid attention, million-token context, and agent post-training push an open model close to the frontier."
authors:
  - "Michael Wan"
affiliations:
  - "Michael Wan Interactive Insights"
published: "2026-04-24"
abstract: "DeepSeek V4 matters because it makes ultra-long-context reasoning much cheaper, then couples that with a stronger agent-training stack. This article walks through the official paper's architecture figures, explains CSA and HCA visually, and asks what V4 reveals about the secret sauce of closed frontier models."
category: "ml"
tags:
  - "explainer"
  - "llm"
  - "deepseek"
thumbnail: "/img/deepseek-v4/thumbnail.png?v=2"
---

<p class="d-note">
    This article is based on the official
    <a href="https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/resolve/main/DeepSeek_V4.pdf">DeepSeek-V4 technical report</a>
    and DeepSeek's
    <a href="https://api-docs.deepseek.com/news/news260424">preview release</a>.
    The paper figures shown below were extracted from the official PDF and stored locally in this site.
</p>

## Why V4 matters

The headline is easy to miss.

Yes, `DeepSeek-V4-Pro` is large at `1.6T` total parameters with `49B` active, and `DeepSeek-V4-Flash` is still huge at `284B` total with `13B` active. But the more important point is that both models support a `1M-token` context window, and the paper is explicit about why that matters: DeepSeek sees **test-time scaling** and **long-horizon agentic work** as the next frontier.

That changes the way we should read the release. V4 is not just a bigger open model. It is a model trying to make **very long context economically usable by default**.

<figure class="d-figure">
    <div class="d-figure-content" style="padding: 10px 10px 0;">
        <img src="/img/deepseek-v4/fig1-overview.png?v=2" alt="Overview figure from the DeepSeek V4 paper showing benchmark performance on the left and inference FLOPs plus KV cache savings on the right" style="max-width:100%;height:auto;display:block;margin:0 auto">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure from the DeepSeek-V4 paper.</strong> Left: V4-Pro-Max against recent frontier models on knowledge, reasoning, and agentic benchmarks. Right: why the paper is strategically interesting at all — much cheaper long-context inference and KV-cache usage than V3.2.
    </figcaption>
</figure>

The right half of that figure is the real story. DeepSeek reports that at `1M` context:

- `V4-Pro` needs only `27%` of the single-token inference FLOPs of `DeepSeek-V3.2`
- `V4-Pro` needs only `10%` of the KV cache
- `V4-Flash` goes even lower on both curves

If those gains hold in practice, the model can spend more of its budget on actual reasoning instead of just hauling around context.

## The architecture at a glance

Before we zoom into the long-context mechanism, it helps to see the whole block once.

<figure class="d-figure">
    <div class="d-figure-content" style="padding: 10px;">
        <img src="/img/deepseek-v4/fig2-architecture.png?v=2" alt="Overall DeepSeek V4 architecture with MTP modules, prediction head, residual mixing, pre-block and post-block mixing, CSA or HCA attention, and DeepSeekMoE" style="max-width:100%;height:auto;display:block;margin:0 auto">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Overall architecture from the paper.</strong> The block has three ideas that matter for the rest of this article: hybrid attention (`CSA / HCA`), stronger residual routing (`mHC` via the residual mixing path), and a large MoE feed-forward stack (`DeepSeekMoE`).
    </figcaption>
</figure>

There are three moving parts worth tracking:

1. `CSA / HCA`: the long-context attention mechanism
2. `Residual mixing`: where mHC strengthens the residual path
3. `DeepSeekMoE`: the expert-based feed-forward stack

The easiest mistake here is to focus only on the MoE size. The paper's real novelty is the **attention stack**.

## What problem V4 is actually solving

DeepSeek V3.2 had already pushed agent training and reasoning much further than the older V3 line. It introduced "thinking in tool-use" and a large synthetic agent-training corpus spanning `1,800+ environments` and `85k+ complex instructions`. But V3.2 still lived with the old long-context cost curve.

That matters because many tasks that feel "frontier" are really context problems:

- searching across many documents
- carrying forward long tool traces
- browsing large codebases
- keeping intermediate reasoning alive instead of compressing it away

The model is not only limited by its weights. It is limited by how much context and scratch space it can afford to use.

<div class="d-callout">
    <strong>The central V4 bet:</strong> if you make million-token context cheap enough, you unlock better test-time scaling, more reliable agents, and a wider range of long-horizon tasks without needing a completely different base architecture.
</div>

## Build the attention mechanism together

The paper introduces two complementary attention modules:

- `CSA`: Compressed Sparse Attention
- `HCA`: Heavily Compressed Attention

They are interleaved across layers. One preserves more detail and retrieves selectively. The other is cheaper and coarser.

### CSA: keep detail where it matters

CSA compresses the KV cache first, then uses a sparse selection step to choose which compressed regions deserve attention. It also keeps a local sliding window so nearby detail is never lost.

<figure class="d-figure">
    <div class="d-figure-content" style="padding: 10px;">
        <img src="/img/deepseek-v4/fig3-csa.png?v=2" alt="CSA diagram from the DeepSeek V4 paper showing token-level compression, Lightning Indexer, top-k selector, and sliding window KV entries" style="max-width:100%;height:auto;display:block;margin:0 auto">
    </div>
    <figcaption class="d-figure-caption">
        <strong>CSA from the paper.</strong> The key pieces are the token-level compressor, the Lightning Indexer, the top-<em>k</em> selector, and the local sliding window. V4 does not pay full attention cost everywhere. It compresses first, then spends detail selectively.
    </figcaption>
</figure>

The flow is:

1. compress many KV tokens into fewer entries
2. score which compressed regions matter
3. retrieve only the top relevant compressed entries
4. combine that with a local window of raw nearby tokens

This is a nice design because it preserves two kinds of structure at once:

- **local precision** for nearby dependencies
- **cheap global reach** for faraway dependencies

### HCA: go much cheaper on long-range memory

HCA makes a different trade. It compresses the KV cache much more aggressively and uses that compressed memory as a cheap global scaffold.

<figure class="d-figure">
    <div class="d-figure-content" style="padding: 10px;">
        <img src="/img/deepseek-v4/fig4-hca.png?v=2" alt="HCA diagram from the DeepSeek V4 paper showing heavier KV compression plus a local sliding window" style="max-width:100%;height:auto;display:block;margin:0 auto">
    </div>
    <figcaption class="d-figure-caption">
        <strong>HCA from the paper.</strong> Same high-level idea as CSA, but the compression is much stronger and the global memory is much coarser. This is where V4 gets a large part of its million-token efficiency.
    </figcaption>
</figure>

Where CSA says "compress, then retrieve precisely," HCA says "compress harder, then use the compressed stream itself as the global memory."

That is why the two belong together. CSA is the higher-detail mode. HCA is the cheaper long-range mode.

### An intuition builder

The paper's actual FLOP curves depend on more than one knob. But we can still build the right intuition: compression lowers storage cost, sparse or compressed retrieval lowers per-query fan-out, and a local window preserves nearby detail.

<div id="v4-attention-explorer"></div>

<div class="d-note">
    The explorer above is an approximation for understanding the mechanism. DeepSeek's exact implementation also depends on grouped projections, indexer paths, MoE kernels, and runtime optimizations described elsewhere in the paper.
</div>

## Why this is better than V3.2

Now the upgrade story becomes clear.

`DeepSeek-V3.2-Exp` introduced `DSA`, which already made long-context attention more efficient than dense attention. But V4 pushes the idea further by turning long-context handling into a **hybrid system**:

- CSA for selective, more detailed long-range retrieval
- HCA for even cheaper coarse global memory
- layer interleaving so the model does not pay one uniform attention cost everywhere

<div class="d-equation-panel">
    <div class="d-equation-title">The V4 Trade</div>
    <div class="d-equation-main">
        $$\text{dense attention everywhere} \;\longrightarrow\; \text{compressed memory + selective retrieval + local detail}$$
    </div>
    <div class="d-equation-legend">
        <div class="d-legend-item">
            <span class="d-legend-dot query"></span>
            <span><strong>Compressed memory:</strong> shrink the KV footprint before retrieval</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot key"></span>
            <span><strong>Selective retrieval:</strong> spend detailed attention only where relevance is high</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot value"></span>
            <span><strong>Local detail:</strong> preserve fine-grained nearby token interactions</span>
        </div>
    </div>
</div>

That is the architectural side. On the training side, V4 also switches to a more serious **specialist-then-distill** pipeline:

- specialist models are trained for math, code, agent work, and instruction following
- those specialists are merged back into a general model with **On-Policy Distillation**

This is just as revealing as the attention change. The capability gap is no longer explained by pretraining alone.

## Two other upgrades that matter

### mHC: stronger residual routing

V4 also uses **Manifold-Constrained Hyper-Connections (mHC)**. If you read the separate mHC paper, the idea is to make richer residual routing trainable by constraining the routing matrix to the Birkhoff polytope.

The short version is:

- richer routing than a plain residual stream
- better stability than unconstrained hyper-connections
- a cleaner path to deeper, more expressive information flow

This is not the headline of V4, but it matters. It is another example of a frontier pattern: add expressivity, then add the mathematical constraint that keeps it trainable.

### Muon: optimization is part of the capability stack

The paper also highlights the **Muon optimizer**. That may sound like a footnote, but it should not.

At this scale, optimizer choice changes:

- how quickly capabilities appear during training
- how stable a large MoE run remains
- which architectural ideas are practical instead of merely elegant

In frontier systems, optimization and kernels are no longer "implementation details." They are part of the model story.

## Reasoning effort is now a first-class knob

One more figure from the paper is useful because it shows the new shape of model quality.

<figure class="d-figure">
    <div class="d-figure-content" style="padding: 10px;">
        <img src="/img/deepseek-v4/fig10-reasoning-effort.png?v=2" alt="Figure comparing HLE and TerminalBench 2.0 performance versus token usage across different reasoning effort settings" style="max-width:100%;height:auto;display:block;margin:0 auto">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Reasoning effort from the paper.</strong> V4 is not a single point on a benchmark chart. The model is explicitly designed to trade more tokens for better outcomes. That is exactly the test-time scaling story the paper frames as the next frontier.
    </figcaption>
</figure>

This figure is a quiet but important clue.

The frontier is shifting from "who has the best static base model?" to "who can turn extra context and extra reasoning budget into useful work at acceptable cost?"

V4 is engineered for that regime.

## What V4 suggests about closed frontier models

This is why the paper matters beyond DeepSeek itself.

If an open model can get this close, what is the remaining moat for the best closed models?

V4 suggests a fairly concrete answer:

1. **Long-context efficiency is part of intelligence.** A model that can cheaply search and retain huge context can look smarter in practice even if the base weights are only somewhat better.
2. **Post-training matters enormously.** Specialist training, tool-use trajectories, RL infrastructure, and distillation appear to explain a large fraction of the real-world gap.
3. **Inference systems are part of the product.** KV-cache design, sparse retrieval, batching, and context management now shape user-visible capability.
4. **The secret sauce is probably a stack, not a trick.** Better data, better evals, better optimizers, better tooling, better test-time scaling, and better agents combine into the frontier.

That is why V4 is such a useful paper to read. It makes the closed-source recipe feel less mystical.

## Final thoughts

DeepSeek V4 is important because it changes the center of gravity.

The old scaling story was mostly about more parameters and more data. The V4 story is about making **very long context cheap enough to use routinely**, then layering on better post-training for specialists, tools, and agents.

That does not mean V4 has fully matched the strongest closed models. The paper itself is more careful than that. But it does mean the path to getting close is increasingly visible.

And right now, that path looks like this:

- compress context before paying full attention cost
- preserve detail selectively instead of uniformly
- treat optimization and inference as part of the architecture
- push much harder on agent training and post-training consolidation

That is what makes V4 more than a leaderboard event. It is a map of where the frontier is actually being built.

## Sources

- [DeepSeek V4 Preview Release](https://api-docs.deepseek.com/news/news260424)
- [DeepSeek-V4 technical report](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/resolve/main/DeepSeek_V4.pdf)
- [DeepSeek-V3.2 Release](https://api-docs.deepseek.com/news/news251201)
- [DeepSeek-V3.2-Exp Release](https://api-docs.deepseek.com/news/news250929)

<script src="/js/deepseek-v4.js"></script>
