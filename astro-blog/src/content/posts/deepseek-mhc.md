---
title: "Manifold Constrained Hyperconnections"
subtitle: "How DeepSeek stabilized the next generation of residual connections by constraining weight matrices to live on the Birkhoff polytope."
authors:
  - "Michael Wan"
affiliations:
  - "Michael Wan Interactive Insights"
published: "2026-04-01"
doi: "arXiv:2512.24880"
doiUrl: "https://arxiv.org/abs/2512.24880"
abstract: "Skip connections are the backbone of deep learning — but naive extensions cause catastrophic instability. DeepSeek's mHC constrains Hyperconnection weight matrices to the Birkhoff polytope using the Sinkhorn-Knopp algorithm, achieving 1.8× convergence speedup while keeping gradients tamed."
category: "ml"
tags:
  - "explainer"
thumbnail: "/img/deepseek-mhc/thumbnail.svg"
---

<p class="d-note">
    This article explains <a href="https://arxiv.org/abs/2512.24880">mHC: Manifold-Constrained Hyper-Connections</a>
    by Zhenda Xie, Yixuan Wei, Huanqi Cao et al. at DeepSeek (arXiv:2512.24880, December 2024).
    It traces a path from the residual connection (2015) through the layer normalization debate
    to ByteDance's Hyperconnections, then shows how DeepSeek uses convex geometry to
    make those connections trainable at scale.
</p>

## Introduction

In January 2025, DeepSeek R1 briefly topped the App Store, beating ChatGPT and Gemini — trained at a fraction of the cost. When DeepSeek published mHC a month later, the question on everyone's mind was whether this was the same kind of moment.

It isn't a model release. It's something quieter and, arguably, more interesting: a principled architectural improvement to how information flows between layers in a deep network. The key insight is geometric — the weight matrix governing that flow should live on the **Birkhoff polytope**, a beautiful object from combinatorics that ensures routing is always balanced.

To understand why that matters, we need to start at the beginning.

## The Scaling Problem

The most natural way to make a neural network smarter is to make it deeper. More layers mean more computation, more abstraction, more capacity. But there's a catch that plagued the field for years: simply stacking more layers often makes the model *worse*.

The culprit is the **backpropagation chain rule**. When you train a network, gradient signals flow backward from the loss through each layer. At every layer, the gradient is multiplied by that layer's local Jacobian. For a network with $L$ layers:

$$\frac{\partial \mathcal{L}}{\partial h_0} = \prod_{l=1}^{L} \frac{\partial h_l}{\partial h_{l-1}}$$

This product of $L$ terms is the problem. If each term is slightly less than 1 — say, 0.9 — then after 50 layers the gradient is $0.9^{50} \approx 0.005$. After 100 layers: essentially zero. Gradients **vanish**, and early layers stop learning. Conversely, if each term is slightly greater than 1, gradients **explode**.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/deepseek-mhc/diagram-gradient-chain.svg" alt="Gradient arrows becoming thinner as they flow backward through layers, illustrating vanishing gradients" style="max-width:560px;width:100%;height:auto;display:block;margin:0 auto">
    </div>
    <figcaption class="d-figure-caption">
        Gradient signals flow backward through each layer. With no bypass, each multiplication
        step attenuates the signal — early layers receive near-zero gradients and stop learning.
    </figcaption>
</figure>

<div class="d-callout">
    <strong>The depth dilemma:</strong> More layers mean more capacity, but the gradient chain
    grows multiplicatively weaker with depth. A 100-layer network trained naively often performs
    worse than a 20-layer one.
</div>

## ResNet's Answer — The Skip Connection

In 2015, He et al. solved this with a disarmingly simple idea: instead of hoping the gradient survives the entire chain, give it a **shortcut**. Add the input directly back to the transformed output.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/deepseek-mhc/diagram-residual-block.svg" alt="Residual block: input forks into learned transformation F and identity shortcut, then recombines at addition node" style="max-width:340px;width:100%;height:auto;display:block;margin:0 auto">
    </div>
    <figcaption class="d-figure-caption">
        A residual block. The input takes two paths: through the learned transformation $F$,
        and directly to the addition node. Gradients can always flow through the identity path.
    </figcaption>
</figure>

<div class="d-equation-panel">
    <div class="d-equation-title">Residual Connection</div>
    <div class="d-equation-main">
        $$h_l = F(h_{l-1}) + h_{l-1}$$
    </div>
    <div class="d-equation-legend">
        <div class="d-legend-item">
            <span class="d-legend-dot value"></span>
            <span><strong>$F(h_{l-1})$</strong> — the learned transformation (FFN, attention, conv, …)</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot query"></span>
            <span><strong>$h_{l-1}$</strong> — the identity shortcut: input passes through unchanged</span>
        </div>
    </div>
</div>

The gradient of the loss with respect to $h_{l-1}$ now has two terms: one through $F$ (which may vanish) and one that is simply **1** (the identity path). No matter how deep the network, the gradient never has to multiply through a long chain alone. This single change won the 2015 ImageNet competition and became the standard building block for nearly every deep network since.

## Where to Put Layer Norm

When the Transformer arrived in 2017, residual connections came along, but a new question emerged: where should you put **Layer Normalization** relative to the residual addition?

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/deepseek-mhc/diagram-post-pre-ln.svg" alt="Side-by-side comparison: Post-LN places LayerNorm after the addition, Pre-LN places it before the sublayer" style="max-width:460px;width:100%;height:auto;display:block;margin:0 auto">
    </div>
    <figcaption class="d-figure-caption">
        Two positions for Layer Normalization in a Transformer block. Each creates a different
        training pathology at scale.
    </figcaption>
</figure>

The original Transformer placed LayerNorm *after* the residual addition (**Post-LN**). This made gradients near the input unstable, requiring careful learning rate warmup and limiting how deep you could go.

GPT-2 moved LayerNorm *before* the sublayer (**Pre-LN**). Training became far more stable. But a new problem surfaced: in very deep Pre-LN networks, the residual stream accumulates scale. Each layer adds to it, and the pure residual path eventually dominates. Later layers contribute marginally — their outputs are tiny relative to the running sum. The representations in different layers start looking nearly identical. This is **representation collapse**.

<div class="d-callout">
    <strong>The tradeoff:</strong> Post-LN suffers gradient instability. Pre-LN suffers representation
    collapse. For a decade, every large language model had to pick a side.
</div>

## Hyperconnections

In late 2024, researchers at ByteDance proposed a different approach. Instead of asking where to put LayerNorm within a fixed residual structure, they asked: **what if you rethought the residual structure itself?**

Their idea, called **Hyperconnections (HC)**, replaces the single residual stream with $n$ parallel sub-streams. Each stream can receive contributions from all other streams, gated by a learned $n \times n$ weight matrix $W$:

<figure class="d-figure">
    <div class="d-figure-content" style="padding:0">
        <img src="/img/deepseek-mhc/fig1-architecture.png" alt="Figure 1 from the paper: three-panel comparison of (a) Residual Connection, (b) Hyper-Connections with orange Res/Pre/Post mapping boxes, (c) mHC with green manifold-projected mapping boxes" style="width:100%;height:auto;display:block">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 1 from the paper.</strong> (a) Standard residual connection. (b) Hyper-Connections
        wrap each layer with three learned linear mappings (Res, Pre, Post — orange), enabling $n$ parallel
        streams to mix. (c) mHC applies a manifold projection $\mathcal{P}_\mathcal{M}$ (green) to each
        mapping, enforcing the doubly stochastic constraint.
    </figcaption>
</figure>

The update for stream $i$ at layer $l$ is:

<div class="d-math-block">
$$h_l^{(i)} = \sum_{j=1}^{n} w_{ij} \cdot F_j\!\left(h_{l-1}^{(j)}\right) + h_{l-1}^{(i)}$$
</div>

This allows different parts of the representation to specialize independently — bypassing the seesaw between Post-LN and Pre-LN. The idea works.

But there's a fatal flaw.

<div class="d-callout" style="border-left-color: #e57373;">
    <strong>The instability problem:</strong> In HC, the weight matrix $W$ is unconstrained.
    As layers stack, matrix multiplications compound. The paper measures the <em>Amax Gain Magnitude</em>
    — the maximum amplification across streams — and finds it peaks at <strong>3,000</strong> by
    layer 60. Training becomes numerically catastrophic.
</div>

## The Birkhoff Polytope

DeepSeek's mHC keeps everything that makes Hyperconnections powerful, but adds one constraint: **$W$ must be a doubly stochastic matrix**.

### Doubly Stochastic Matrices

A matrix $W \in \mathbb{R}^{n \times n}$ is doubly stochastic if all entries are non-negative and every row and every column sums to exactly 1:

<div class="d-equation-panel">
    <div class="d-equation-title">Doubly Stochastic Constraint</div>
    <div class="d-equation-main">
        $$W_{ij} \geq 0, \quad \sum_{j=1}^{n} W_{ij} = 1 \;\forall i, \quad \sum_{i=1}^{n} W_{ij} = 1 \;\forall j$$
    </div>
    <div class="d-equation-legend">
        <div class="d-legend-item">
            <span class="d-legend-dot query"></span>
            <span><strong>Row sum = 1:</strong> stream $i$ distributes its total weight across all outputs — no signal amplification</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot key"></span>
            <span><strong>Column sum = 1:</strong> each output stream receives exactly one unit of total input — no signal accumulation</span>
        </div>
    </div>
</div>

Here's a concrete $3 \times 3$ example:

<div class="d-table-wrapper" style="max-width:300px;margin:1.2em auto">
<table class="d-table" style="text-align:center">
<thead><tr><th></th><th>out 1</th><th>out 2</th><th>out 3</th><th style="color:#27ae60">&#x3A3; row</th></tr></thead>
<tbody>
<tr><td><strong>in 1</strong></td><td>0.75</td><td>0.14</td><td>0.11</td><td class="good">1.00</td></tr>
<tr><td><strong>in 2</strong></td><td>0.10</td><td>0.72</td><td>0.18</td><td class="good">1.00</td></tr>
<tr><td><strong>in 3</strong></td><td>0.15</td><td>0.14</td><td>0.71</td><td class="good">1.00</td></tr>
<tr style="color:#27ae60"><td><strong>&#x3A3; col</strong></td><td class="good">1.00</td><td class="good">1.00</td><td class="good">1.00</td><td>—</td></tr>
</tbody>
</table>
</div>

Intuitively, a doubly stochastic matrix is a **conservative router**: no stream receives more total weight than it sends, and vice versa. Information is redistributed, not amplified.

### The Birkhoff Polytope

The set of all doubly stochastic matrices forms a convex polytope, called the **Birkhoff polytope** $\mathcal{B}_n$. Its vertices are exactly the $n!$ permutation matrices — the "pure routes" where each stream maps one-to-one to exactly one other stream. Everything inside is a convex mixture of these pure routes.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/deepseek-mhc/diagram-birkhoff.svg" alt="Hexagon representing the Birkhoff polytope B3, with six permutation-matrix vertices labeled P1 through P6 and a point W inside" style="max-width:260px;width:100%;height:auto;display:block;margin:0 auto">
    </div>
    <figcaption class="d-figure-caption">
        The Birkhoff polytope $\mathcal{B}_3$: a hexagon whose six vertices are the six
        $3 \times 3$ permutation matrices. Any doubly stochastic matrix $W$ lies somewhere
        inside — a convex combination of the vertices.
    </figcaption>
</figure>

<div class="d-note">
    <strong>Birkhoff-von Neumann theorem (1946):</strong> Every doubly stochastic matrix is
    a convex combination of permutation matrices. Equivalently, the vertices of $\mathcal{B}_n$
    are exactly the $n!$ permutation matrices. This is a foundational result in combinatorial
    optimization, and it gives the polytope a clean geometric interpretation.
</div>

### Why This Stabilizes Training

The key property is the **spectral norm**. For any $W \in \mathcal{B}_n$, its spectral norm (largest singular value) satisfies:

$$\|W\|_2 \leq 1$$

This follows from the Perron-Frobenius theorem: doubly stochastic matrices have leading eigenvalue exactly 1, and no eigenvalue exceeds 1 in magnitude. When you multiply by $W$ at every layer, the signal cannot grow. The 3,000× amplitude spike that broke vanilla Hyperconnections cannot happen inside $\mathcal{B}_n$.

<div class="d-callout">
    <strong>The geometric fix:</strong> Constraining $W$ to the Birkhoff polytope makes it
    a spectral contraction ($\|W\|_2 \leq 1$). Stack as many layers as you want — the routing
    matrix can never amplify signals. Stability is a mathematical guarantee, not a tuning choice.
</div>

The contrast in practice is striking. Figure 8 from the paper shows the actual learned weight matrices at individual layers and their cumulative product across 60 layers:

<figure class="d-figure">
    <div class="d-figure-content" style="padding:0">
        <img src="/img/deepseek-mhc/fig8-mappings.png" alt="Figure 8: HC weight matrices contain large unbounded values (row sums ±18 at layer 1, reaching ±265 in the 60-layer composite), while mHC matrices are doubly stochastic (all sums ≈ 1) and converge to a near-uniform distribution" style="width:100%;height:auto;display:block">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 8 from the paper.</strong> Each matrix is averaged over all tokens in a selected sequence.
        Row labels (y-axis) show forward signal gain (row sum); column labels (x-axis) show backward gradient
        gain (column sum). HC's residual mapping has row sums reaching ±18 at layer 1 — and after 60 layers
        the cumulative product explodes to ±265. mHC's projected mapping is doubly stochastic at every layer
        (all sums ≈ 1.00), and the 60-layer composite converges to a stable, near-uniform distribution.
    </figcaption>
</figure>

## The Sinkhorn-Knopp Algorithm

The constraint $W \in \mathcal{B}_n$ is elegant, but how do you enforce it during gradient descent? You can't simply clamp entries — that breaks the row and column sums simultaneously.

The answer is the **Sinkhorn-Knopp algorithm** (1967). After each gradient step updates $W$, you project it back onto the Birkhoff polytope by alternating two normalizations:

<div class="d-equation-panel">
    <div class="d-equation-title">Sinkhorn-Knopp: Row Step</div>
    <div class="d-equation-main">
        $$A_{ij} \leftarrow \frac{A_{ij}}{\displaystyle\sum_{k=1}^{n} A_{ik}}$$
    </div>
    <div class="d-equation-legend">
        <div class="d-legend-item">
            <span class="d-legend-dot query"></span>
            <span>Divide each entry by its row sum — all rows now sum to 1</span>
        </div>
    </div>
</div>

<div class="d-equation-panel">
    <div class="d-equation-title">Sinkhorn-Knopp: Column Step</div>
    <div class="d-equation-main">
        $$A_{ij} \leftarrow \frac{A_{ij}}{\displaystyle\sum_{k=1}^{n} A_{kj}}$$
    </div>
    <div class="d-equation-legend">
        <div class="d-legend-item">
            <span class="d-legend-dot key"></span>
            <span>Divide each entry by its column sum — all columns now sum to 1</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot param"></span>
            <span><strong>Repeat</strong> alternating row → column until convergence (typically 3–10 iterations)</span>
        </div>
    </div>
</div>

Each step is a single element-wise division. The algorithm converges to the unique doubly stochastic matrix closest to the input in KL divergence. In practice, 3–10 alternations suffice to reduce the maximum row/column deviation from 1 to below $10^{-3}$.

### Interactive: Sinkhorn-Knopp Visualizer

Edit any cell in the matrix below, then step through the algorithm to watch it converge. Row sums and column sums turn green when they reach 1.

<div id="sinkhorn-interactive" class="interactive-container" style="max-width:580px;margin:2em auto">
    <h3 style="margin-top:0">Sinkhorn-Knopp in Action</h3>
    <p class="interactive-desc" style="color:#555;font-size:0.93em;margin-bottom:1.2em">
        Start with any non-negative matrix. Each step alternates between row-normalizing
        and column-normalizing. Watch the sums (shown beside each row and column) converge to 1.
    </p>
    <div id="sk-grid-area" style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap"></div>
    <div id="sk-controls" style="margin-top:1.2em;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <button id="sk-step-btn" style="padding:6px 18px;font-size:0.9em;cursor:pointer;border:1px solid #1565c0;background:#1565c0;color:#fff;border-radius:4px">Step</button>
        <button id="sk-play-btn" style="padding:6px 18px;font-size:0.9em;cursor:pointer;border:1px solid #1565c0;background:#fff;color:#1565c0;border-radius:4px">Play</button>
        <button id="sk-reset-btn" style="padding:6px 18px;font-size:0.9em;cursor:pointer;border:1px solid #aaa;background:#fff;color:#555;border-radius:4px">Reset</button>
        <label style="font-size:0.85em;color:#555;margin-left:4px">Speed:
            <input type="range" id="sk-speed" min="100" max="1500" value="600" style="vertical-align:middle;margin-left:4px">
        </label>
    </div>
    <div id="sk-status" style="margin-top:0.8em;font-size:0.88em;color:#555;min-height:1.4em"></div>
    <div id="sk-conv-bar-wrap" style="margin-top:0.5em;display:flex;align-items:center;gap:10px">
        <span style="font-size:0.82em;color:#888;white-space:nowrap">Max deviation:</span>
        <div style="flex:1;background:#e8e8e8;border-radius:4px;height:8px;max-width:240px">
            <div id="sk-conv-bar" style="height:8px;border-radius:4px;background:#1565c0;transition:width 0.3s;width:100%"></div>
        </div>
        <span id="sk-conv-val" style="font-size:0.82em;color:#555;min-width:42px"></span>
    </div>
</div>

<script src="/js/deepseek-mhc.js"></script>

## The mHC Formula

Putting it all together, the mHC forward pass is:

<div class="d-equation-panel">
    <div class="d-equation-title">mHC Forward Pass</div>
    <div class="d-equation-main">
        $$\tilde{h}_l^{(i)} = \sum_{j=1}^{n} W_{ij} \cdot h_{l-1}^{(j)}, \qquad W \in \mathcal{B}_n$$
        $$h_l^{(i)} = F_i\!\left(\tilde{h}_l^{(i)}\right) + \tilde{h}_l^{(i)}$$
    </div>
    <div class="d-equation-legend">
        <div class="d-legend-item">
            <span class="d-legend-dot query"></span>
            <span><strong>$W \in \mathcal{B}_n$</strong> — the manifold constraint: enforced after each optimizer step via Sinkhorn-Knopp</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot key"></span>
            <span><strong>$\tilde{h}_l^{(i)}$</strong> — the mixed input to stream $i$: a doubly stochastic blend of all streams from the previous layer</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot value"></span>
            <span><strong>$F_i$</strong> — the learned transformation for stream $i$ (attention, FFN, etc.)</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot param"></span>
            <span><strong>Residual</strong> — the standard skip connection is preserved within each stream</span>
        </div>
    </div>
</div>

The difference from vanilla Hyperconnections is exactly one word: **$W \in \mathcal{B}_n$**. The forward computation is identical. The only extra work is running Sinkhorn-Knopp after each gradient step — a handful of element-wise divisions on an $n \times n$ matrix, negligible compared to the FFN or attention compute.

## Training Dynamics and Results

DeepSeek evaluated mHC at 3B, 9B, and 27B parameter scales using a MoE architecture based on DeepSeek-V3, with expansion rate $n = 4$ and Sinkhorn-Knopp iterations capped at $t_\text{max} = 20$.

**Training stability (27B model).** Figure 5 from the paper shows loss gap and gradient norm over 50K training steps:

<figure class="d-figure">
    <div class="d-figure-content" style="padding:0">
        <img src="/img/deepseek-mhc/fig5-training.png" alt="Figure 5: left plot shows mHC achieving 0.021 lower loss than baseline; right plot shows HC gradient norm spiking erratically while mHC tracks the stable baseline" style="width:100%;height:auto;display:block">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 5 from the paper.</strong> Training stability of the 27B model. (Left) Absolute training
        loss gap relative to the Pre-LN baseline: mHC achieves a final loss reduction of <strong>0.021</strong>.
        (Right) Gradient norm over training: HC exhibits large erratic spikes throughout; mHC maintains a stable
        profile comparable to the baseline.
    </figcaption>
</figure>

**Benchmark results (27B model, same token budget):**

<div class="d-table-wrapper">
<table class="d-table">
<thead>
<tr>
    <th>Benchmark</th>
    <th>Baseline</th>
    <th>HC</th>
    <th>mHC</th>
</tr>
</thead>
<tbody>
<tr><td>BBH (EM)</td><td>43.8</td><td>48.9</td><td class="good highlight-row"><strong>51.0</strong></td></tr>
<tr><td>DROP (F1)</td><td>47.0</td><td>51.6</td><td class="good highlight-row"><strong>53.9</strong></td></tr>
<tr><td>GSM8K (EM)</td><td>46.7</td><td>53.2</td><td class="good highlight-row"><strong>53.8</strong></td></tr>
<tr><td>HellaSwag (Acc.)</td><td>73.7</td><td>74.3</td><td class="good highlight-row"><strong>74.7</strong></td></tr>
<tr><td>MATH (EM)</td><td>22.0</td><td>26.4</td><td class="good highlight-row"><strong>26.0</strong></td></tr>
<tr><td>MMLU (Acc.)</td><td>59.0</td><td>63.0</td><td class="good highlight-row"><strong>63.4</strong></td></tr>
<tr><td>PIQA (Acc.)</td><td>78.5</td><td>79.9</td><td class="good highlight-row"><strong>80.5</strong></td></tr>
<tr><td>TriviaQA (EM)</td><td>54.3</td><td>56.3</td><td class="good highlight-row"><strong>57.6</strong></td></tr>
</tbody>
</table>
</div>

<div class="d-callout">
    <strong>Same tokens, better results.</strong> mHC outperforms the Pre-LN baseline on every benchmark
    with no increase in model size or training compute. The Sinkhorn-Knopp projection adds only
    <strong>6.7% training time overhead</strong> at $n = 4$ — a small price for consistent gains.
</div>

## Key Takeaways

**1. Depth needs highways.** Residual connections are not an optional convenience — they're what makes deep networks trainable. Without a bypass path, gradients vanish and early layers stop learning.

**2. Hyperconnections generalize the residual.** Three learned mappings (Res, Pre, Post) around each layer allow $n$ parallel streams to mix information flexibly, escaping the Post-LN / Pre-LN tradeoff. The idea is sound.

**3. The Birkhoff polytope is the right constraint.** Doubly stochastic matrices conserve signal magnitude ($\|W\|_2 \leq 1$) by construction. This turns a beautiful object from combinatorics into a practical stability guarantee for deep learning.

**4. Sinkhorn-Knopp is the projector.** Two alternating normalizations — row then column — converge to the unique doubly stochastic matrix nearest to the unconstrained gradient update. The compute cost is negligible.

**5. mHC is a drop-in improvement.** The only change relative to a standard Pre-LN Transformer is replacing the single residual stream with $n$ mHC streams and projecting $W$ after each optimizer step. Architecture, training recipe, and inference code are otherwise identical.

<section class="d-bibliography">

## References

1. Zhenda Xie et al. [mHC: Manifold-Constrained Hyper-Connections](https://arxiv.org/abs/2512.24880). DeepSeek, 2024.
2. Kaiming He et al. [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385). CVPR 2016.
3. Ashish Vaswani et al. [Attention Is All You Need](https://arxiv.org/abs/1706.03762). NeurIPS 2017.
4. Ruibin Xiong et al. [On Layer Normalization in the Transformer Architecture](https://arxiv.org/abs/2002.04745). ICML 2020.
5. Dingkang Sun et al. [Hyper-Connections](https://arxiv.org/abs/2409.19606). arXiv 2024. (ByteDance)
6. Richard Sinkhorn & Paul Knopp. Concerning nonnegative matrices and doubly stochastic matrices. *Pacific Journal of Mathematics*, 1967.
7. Garrett Birkhoff. Tres observaciones sobre el álgebra lineal. *Universidad Nacional de Tucumán*, 1946.

</section>

<footer class="d-appendix">
    PDF: <a href="https://arxiv.org/pdf/2512.24880">arxiv.org/pdf/2512.24880</a>
</footer>
