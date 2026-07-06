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
doi: "arXiv:1706.03762"
doiUrl: "https://arxiv.org/abs/1706.03762"
abstract: "Understanding the building blocks and design choices of the Transformer architecture that powers GPT, BERT, and modern language models."
tags:
  - "explainer"
category: "ml"
thumbnail: "/img/transformer/fig1-architecture.png"
---

<p class="d-note">
    This article explains the landmark paper
    <a href="https://arxiv.org/abs/1706.03762">Attention Is All You Need</a>
    by Vaswani et al. (2017), which introduced the Transformer architecture
    that powers GPT, BERT, and nearly every modern language model.
</p>

<style>
  .tf-callout {
    border-left: 3px solid; border-radius: 0 6px 6px 0;
    padding: 11px 14px; margin: 20px 0; font-size: 0.92rem; line-height: 1.55;
  }
  .tf-callout-tip  { border-color: #10b981; background: #f0fdf4; color: #065f46; }
  .tf-callout-warn { border-color: #f59e0b; background: #fffbeb; color: #92400e; }
  .tf-callout-note { border-color: #6366f1; background: #eef2ff; color: #3730a3; }
  .tf-badge { display: inline-block; font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.02em; }
  .tf-badge-green  { background: #d1fae5; color: #065f46; }
  .tf-badge-yellow { background: #fef3c7; color: #92400e; }
  .tf-badge-red    { background: #fee2e2; color: #b91c1c; }
  .tf-worked { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 18px; margin: 22px 0; background: #fafafa; font-size: 0.9rem; }
  .tf-worked h4 { margin: 0 0 10px; font-size: 0.95rem; }
  .tf-worked table { width: 100%; border-collapse: collapse; margin: 8px 0; font-variant-numeric: tabular-nums; }
  .tf-worked td, .tf-worked th { padding: 4px 8px; text-align: center; border-bottom: 1px solid #eee; }
  .tf-worked th:first-child, .tf-worked td:first-child { text-align: left; }
  @media (prefers-color-scheme: dark) {
    .tf-callout-tip  { background: #052e21; color: #6ee7b7; }
    .tf-callout-warn { background: #2e2205; color: #fcd34d; }
    .tf-callout-note { background: #1e1b4b; color: #c7d2fe; }
    .tf-worked { background: #18181b; border-color: #333; }
    .tf-worked td, .tf-worked th { border-color: #2a2a2a; }
  }
</style>

## Introduction

How do you teach a model to relate any two words in a sentence, no matter how far
apart they sit? For years the answer was to walk the sentence left to right and hope
the signal survived the trip. The Transformer threw that assumption out.

Earlier sequence models—for translation, language modeling, generation—were built on
recurrent or convolutional networks, usually with an encoder, a decoder, and an
attention link between them. **The Transformer keeps the attention link and discards
everything else: no recurrence, no convolution.** The result is a model that trains
faster, parallelizes cleanly, and reaches higher quality.

The rest of this article builds the architecture one constraint at a time: first *why*
sequential models hurt, then attention as the fix, then the full encoder-decoder stack.

## The Sequential Bottleneck

Before the Transformer, the dominant approach to sequence tasks—machine translation,
language modeling, text generation—was the **recurrent neural network (RNN)**,
particularly LSTMs and GRUs.

RNNs process sequences one token at a time. To compute the hidden state at position
$t$, you need the hidden state at position $t-1$:

<div class="d-math-block">
$$h_t = f(h_{t-1}, x_t)$$
</div>

Read it plainly: the state at position $t$ is a function of the *previous* state and
the current token. Position $t$ cannot start until position $t-1$ finishes. This creates
two fundamental problems:

### Lack of Parallelization

Because each step depends on the previous step, you cannot parallelize computation
within a single sequence. Training is inherently sequential in time. For long
sequences, this becomes a severe bottleneck.

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

### Long-Range Dependencies

Information from early tokens must survive many sequential steps to influence later
processing. Gradients must flow backward through all those steps. In practice, this
makes learning long-range dependencies difficult, even with gating mechanisms like LSTM.

<div class="d-callout">
    <strong>Key question:</strong> Can we design an architecture where every position can
    directly attend to every other position—without sequential dependencies?
</div>

The answer is the **Transformer**.

## Attention as a Lookup

The core idea of attention is surprisingly simple: it's a **soft lookup**
into a set of values, where the lookup key determines how much weight to give each value.

Think of it like a database query:

- You have a **query** (what you're looking for)
- You have a set of **keys** (labels for stored items)
- You have a set of **values** (the stored items themselves)

The attention mechanism compares your query to each key, computes a relevance score,
and returns a weighted combination of the values.

<figure class="d-figure">
    <div class="d-figure-content">
        <div class="attn-viz">
            <div class="attn-row">
                <span class="attn-label c-query">Query:</span>
                <span class="attn-desc">"What information is relevant here?"</span>
            </div>
            <div class="attn-row">
                <span class="attn-label c-key">Keys:</span>
                <div class="attn-items">
                    <span class="attn-item">k₁</span>
                    <span class="attn-item">k₂</span>
                    <span class="attn-item">k₃</span>
                    <span class="attn-item">k₄</span>
                    <span class="attn-item">k₅</span>
                </div>
            </div>
            <div class="attn-row">
                <span class="attn-label c-value">Values:</span>
                <div class="attn-items">
                    <span class="attn-item">v₁</span>
                    <span class="attn-item highlight">v₂</span>
                    <span class="attn-item">v₃</span>
                    <span class="attn-item">v₄</span>
                    <span class="attn-item">v₅</span>
                </div>
            </div>
            <div class="attn-row">
                <span class="attn-label">Scores:</span>
                <div class="attn-scores">
                    <span class="attn-score low">0.1</span>
                    <span class="attn-score high">0.7</span>
                    <span class="attn-score low">0.05</span>
                    <span class="attn-score low">0.1</span>
                    <span class="attn-score low">0.05</span>
                </div>
            </div>
            <div class="attn-output">
                <span class="attn-label">Output:</span>
                <span class="attn-output-eq">0.1·v₁ + <strong>0.7·v₂</strong> + 0.05·v₃ + 0.1·v₄ + 0.05·v₅</span>
            </div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        Attention computes a weighted sum of values, where weights come from comparing
        a query to keys. Here, key k₂ matches the query best, so v₂ dominates the output.
    </figcaption>
</figure>

<div class="d-callout">
    <strong>Key insight:</strong> Attention connects any two positions in constant time.
    There's no sequential path that information must traverse.
</div>

## Scaled Dot-Product Attention

The Transformer uses a specific form of attention called
**Scaled Dot-Product Attention**.

Given:
- **Queries** $Q \in \mathbb{R}^{n \times d_k}$ — what we're looking for
- **Keys** $K \in \mathbb{R}^{m \times d_k}$ — what we're looking in
- **Values** $V \in \mathbb{R}^{m \times d_v}$ — what we retrieve

The attention output is:

<div class="d-equation-panel">
    <div class="d-equation-title">Scaled Dot-Product Attention</div>
    <div class="d-equation-main">
        $$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right) V$$
    </div>
    <div class="d-equation-legend">
        <div class="d-legend-item">
            <span class="d-legend-dot query"></span>
            <span><strong>Query</strong> $Q$: what information does this position need?</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot key"></span>
            <span><strong>Key</strong> $K$: what information does this position offer?</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot value"></span>
            <span><strong>Value</strong> $V$: the actual content to retrieve</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot param"></span>
            <span><strong>Scaling</strong> $\sqrt{d_k}$: prevents dot products from growing too large</span>
        </div>
    </div>
</div>

### Step by step

1. **Compute compatibility scores:** $QK^T$ gives an $n \times m$ matrix
   of dot products. Entry $(i, j)$ measures how much query $i$ matches key $j$.

2. **Scale:** Divide by $\sqrt{d_k}$. Without scaling, large $d_k$ values
   push dot products into regions where softmax has very small gradients.

3. **Normalize:** Apply softmax row-wise. Each query now has a probability
   distribution over keys.

4. **Retrieve:** Multiply by $V$. Each output is a weighted combination
   of values.

### Why scale?

For large $d_k$, the dot products $q \cdot k$ tend to have large magnitude (variance
roughly $d_k$). This pushes softmax into saturated regions where gradients vanish.
Scaling by $\sqrt{d_k}$ keeps the variance at 1.

### A worked example with real numbers

Abstractions land cold, so let one query attend over three tokens with $d_k = 2$.
The query is $q = [1,\ 0]$, and the three keys and values are:

<div class="tf-worked">
<h4>One attention step, three tokens</h4>
<table>
<thead><tr><th>Token</th><th>Key $k\_j$</th><th>$q\cdot k\_j$</th><th>÷ $\sqrt{2}$</th><th>softmax</th><th>Value $v\_j$</th></tr></thead>
<tbody>
<tr><td>the</td><td>[1, 0]</td><td>1.00</td><td>0.71</td><td><strong>0.51</strong></td><td>[2, 0]</td></tr>
<tr><td>cat</td><td>[0.5, 1]</td><td>0.50</td><td>0.35</td><td>0.36</td><td>[0, 3]</td></tr>
<tr><td>sat</td><td>[-1, 0.5]</td><td>-1.00</td><td>-0.71</td><td>0.13</td><td>[1, 1]</td></tr>
</tbody>
</table>
<p style="margin:8px 0 0;">Weighted sum of values:
$0.51\,[2,0] + 0.36\,[0,3] + 0.13\,[1,1] = [1.15,\ 1.21]$.</p>
</div>

The query matched "the" most strongly, so its value dominates the output—but every
token still contributes. **Attention is a soft blend, not a hard pick.** Swap in a
query that points toward "cat" and the second row would dominate instead. That is the
entire mechanism; multi-head attention and the full stack just repeat it at scale.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/transformer/fig2a-scaled-dotproduct-attn.png" alt="Scaled Dot-Product Attention" style="max-width: 340px; width: 100%; height: auto; margin: 0 auto; display: block;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 2 (left) from the paper:</strong> The Scaled Dot-Product Attention computation. Queries and Keys are dot-product scored, optionally masked, softmax-normalized, and used to weight the Values.
    </figcaption>
</figure>

## Multi-Head Attention

A single attention function can only focus on one type of relationship at a time.
**Multi-Head Attention** runs multiple attention functions in parallel,
each with its own learned projections.

<div class="d-equation-panel">
    <div class="d-equation-title">Multi-Head Attention</div>
    <div class="d-equation-main">
        $$\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, \ldots, \text{head}_h) W^O$$
        <br><br>
        $$\text{where } \text{head}_i = \text{Attention}(QW_i^Q, KW_i^K, VW_i^V)$$
    </div>
    <div class="d-equation-legend">
        <div class="d-legend-item">
            <span class="d-legend-dot param"></span>
            <span>$W_i^Q, W_i^K, W_i^V \in \mathbb{R}^{d_{\text{model}} \times d_k}$: learned projections</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot param"></span>
            <span>$W^O \in \mathbb{R}^{hd_v \times d_{\text{model}}}$: output projection</span>
        </div>
    </div>
</div>

Each head can learn to attend to different things:

- One head might focus on the **previous word**
- Another might focus on the **subject of the sentence**
- Another might focus on **semantically similar words**

The paper uses $h = 8$ heads with $d_k = d_v = 64$ (for $d_{\text{model}} = 512$).
Each head works in a smaller 64-dimensional subspace, so eight heads cost about the
same as one full-width head—**the model gets several views of the sequence for the
price of one.**

<div class="tf-callout tf-callout-note">
    <strong>Heads are not assigned roles; they discover them.</strong> Nothing tells head 3
    to track syntax or head 7 to resolve pronouns. The projections $W\_i^Q, W\_i^K, W\_i^V$ are
    learned, and the division of labor emerges from training—shown in the attention maps later.
</div>

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/transformer/fig2b-multihead-attn.png" alt="Multi-Head Attention" style="max-width: 420px; width: 100%; height: auto; margin: 0 auto; display: block;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 2 (right) from the paper:</strong> Multi-Head Attention runs multiple single-head attentions in parallel, each with its own learned projections, then concatenates and linearly projects the outputs.
    </figcaption>
</figure>

## The Transformer Architecture

The Transformer follows the encoder-decoder structure, but built entirely from
attention and feed-forward layers.

<figure class="d-figure">
<div class="d-figure-content">
<div class="arch-diagram">
<div class="arch-column">
<div class="arch-title">Encoder</div>
<div class="arch-stack">
<div class="arch-layer">
<div class="arch-component attn">Multi-Head<br/>Self-Attention</div>
<div class="arch-norm">Add & Norm</div>
<div class="arch-component ffn">Feed Forward</div>
<div class="arch-norm">Add & Norm</div>
</div>
<span class="arch-repeat">×6</span>
</div>
<div class="arch-embed">
<div class="arch-embed-box">Input Embedding</div>
<span>+</span>
<div class="arch-embed-box pos">Positional Encoding</div>
</div>
<div class="arch-input-label">Inputs</div>
</div>
<div class="arch-arrow">
<svg viewBox="0 0 50 20"><defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#666"/></marker></defs><line x1="0" y1="10" x2="40" y2="10" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/></svg>
<span class="arch-arrow-label">K, V</span>
</div>
<div class="arch-column">
<div class="arch-title">Decoder</div>
<div class="arch-stack">
<div class="arch-layer">
<div class="arch-component attn-masked">Masked Multi-Head<br/>Self-Attention</div>
<div class="arch-norm">Add & Norm</div>
<div class="arch-component attn-cross">Multi-Head<br/>Cross-Attention</div>
<div class="arch-norm">Add & Norm</div>
<div class="arch-component ffn">Feed Forward</div>
<div class="arch-norm">Add & Norm</div>
</div>
<span class="arch-repeat">×6</span>
</div>
<div class="arch-embed">
<div class="arch-embed-box">Output Embedding</div>
<span>+</span>
<div class="arch-embed-box pos">Positional Encoding</div>
</div>
<div class="arch-input-label">Outputs (shifted right)</div>
</div>
</div>
</div>
<figcaption class="d-figure-caption">
The Transformer architecture (simplified). The encoder (left) processes the input sequence.
The decoder (right) generates the output, attending to both itself and the encoder output.
</figcaption>
</figure>

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/transformer/fig1-architecture.png" alt="Transformer Architecture — original paper figure" style="max-width: 520px; width: 100%; height: auto; margin: 0 auto; display: block;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 1 from the paper:</strong> The full Transformer architecture as presented in Vaswani et al. The left side is the encoder stack; the right side is the decoder, which includes both masked self-attention and cross-attention to the encoder output.
    </figcaption>
</figure>

### Encoder

Each encoder layer has two sub-layers:

1. **Multi-head self-attention:** Every position attends to every position
2. **Feed-forward network:** Applied independently to each position

<div class="d-math-block">
$$\text{FFN}(x) = \max(0, xW_1 + b_1)W_2 + b_2$$
</div>

In words: project each position up to a wider hidden size, apply a ReLU, project back
down. Attention mixes information *across* positions; the feed-forward network then
transforms each position *on its own*. **The two sub-layers split the work: attention
routes, the FFN thinks.**

Residual connections and layer normalization wrap each sub-layer, which keeps gradients
flowing through the deep stack.

### Decoder

Each decoder layer has three sub-layers:

1. **Masked self-attention:** Each position attends only to earlier positions
2. **Cross-attention:** Queries from decoder; keys/values from encoder
3. **Feed-forward network:** Same as encoder

## Positional Encoding

Attention treats its input as a *set*: shuffle the tokens and the output shuffles with
them, unchanged. That is a problem—"dog bites man" and "man bites dog" would look
identical. So before the first layer, the Transformer adds **positional encodings** to
the input embeddings, giving each position a distinct fingerprint.

<div class="d-math-block">
$$PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)$$
$$PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)$$
</div>

Each dimension $i$ is a sine or cosine wave of a different wavelength. Low dimensions
oscillate slowly (they encode coarse position); high dimensions oscillate quickly (fine
position). Together the waves form a unique code for every position—like the digits of a
binary clock, but continuous.

<figure class="d-figure">
    <div class="d-figure-content pe-interactive-wrapper">
        <div id="pos-encoding-interactive"></div>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Interactive:</strong> Drag the slider or click on the grid to explore how positional encodings change.
        Each row is a position, each column is a dimension. Orange = sin (even dims), blue = cos (odd dims).
        Lower dimensions vary slowly; higher dimensions vary quickly.
    </figcaption>
</figure>

For any fixed offset $k$, $PE_{pos+k}$ can be written as a linear function of
$PE_{pos}$. This allows the model to learn to attend by relative position.

## Why Self-Attention?

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Layer Type</th>
                <th>Complexity</th>
                <th>Sequential Ops</th>
                <th>Max Path Length</th>
            </tr>
        </thead>
        <tbody>
            <tr class="highlight-row">
                <td>Self-Attention</td>
                <td>$O(n^2 \cdot d)$</td>
                <td><span class="tf-badge tf-badge-green">$O(1)$</span></td>
                <td><span class="tf-badge tf-badge-green">$O(1)$</span></td>
            </tr>
            <tr>
                <td>Recurrent</td>
                <td>$O(n \cdot d^2)$</td>
                <td><span class="tf-badge tf-badge-red">$O(n)$</span></td>
                <td><span class="tf-badge tf-badge-red">$O(n)$</span></td>
            </tr>
            <tr>
                <td>Convolutional</td>
                <td>$O(k \cdot n \cdot d^2)$</td>
                <td><span class="tf-badge tf-badge-green">$O(1)$</span></td>
                <td><span class="tf-badge tf-badge-yellow">$O(\log_k n)$</span></td>
            </tr>
        </tbody>
    </table>
</div>

Self-attention connects all positions in $O(1)$ sequential operations, enabling
full parallelization. It also provides a direct path between any two positions,
making long-range dependencies easier to learn.

<div class="d-callout warning">
    <strong>Trade-off:</strong> Self-attention has $O(n^2)$ memory complexity. For
    very long sequences, this can become prohibitive.
</div>

## What Attention Heads Learn

The paper visualizes what individual attention heads learn in a trained Transformer. Different heads spontaneously specialize for different linguistic patterns—none of this structure is hard-coded.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/transformer/fig3-long-range-attn.png" alt="Long-range attention dependency" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 3 from the paper:</strong> Self-attention following a long-distance dependency in encoder layer 5. The word "it" attends strongly to "The animal," resolving the coreference across the sentence.
    </figcaption>
</figure>

<figure class="d-figure">
    <div class="d-figure-content" style="display: flex; gap: 1rem; width: 100%; overflow: hidden;">
        <img src="/img/transformer/fig4-anaphora-1.png" alt="Anaphora resolution head 1" style="flex: 1; min-width: 0; width: 100%; height: auto;">
        <img src="/img/transformer/fig4-anaphora-2.png" alt="Anaphora resolution head 2" style="flex: 1; min-width: 0; width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 4 from the paper:</strong> Two attention heads in layer 5 that appear to perform anaphora resolution—linking pronouns back to the nouns they refer to.
    </figcaption>
</figure>

<figure class="d-figure">
    <div class="d-figure-content" style="display: flex; gap: 1rem; width: 100%; overflow: hidden;">
        <img src="/img/transformer/fig5-sentence-structure-1.png" alt="Sentence structure attention 1" style="flex: 1; min-width: 0; width: 100%; height: auto;">
        <img src="/img/transformer/fig5-sentence-structure-2.png" alt="Sentence structure attention 2" style="flex: 1; min-width: 0; width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 5 from the paper:</strong> Attention heads exhibiting behaviour related to sentence structure. Different heads learn to attend to different syntactic roles and positional patterns.
    </figcaption>
</figure>

## Training and Results

**Setup:**
- Data: WMT 2014 English-German (4.5M pairs) and English-French (36M pairs)
- Hardware: 8 NVIDIA P100 GPUs
- Time: Base model 12 hours; Big model 3.5 days

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Model</th>
                <th>EN-DE BLEU</th>
                <th>EN-FR BLEU</th>
                <th>Training Cost</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Previous SOTA</td>
                <td>26.36</td>
                <td>41.29</td>
                <td>$7.7 \times 10^{19}$ FLOPs</td>
            </tr>
            <tr class="highlight-row">
                <td><strong>Transformer (big)</strong></td>
                <td class="good"><strong>28.4</strong></td>
                <td class="good"><strong>41.8</strong></td>
                <td class="good">$2.3 \times 10^{19}$ FLOPs</td>
            </tr>
        </tbody>
    </table>
</div>

The Transformer achieves state-of-the-art results at a fraction of the training cost.

## The Lineage: One Block, Three Descendants

The paper shipped a full encoder-decoder for translation. What followed took the stack
apart. The single self-attention block turned out to be reusable on its own, and the
field split along the seam between encoder and decoder.

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Family</th>
                <th>Uses</th>
                <th>Attention</th>
                <th>Best at</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Encoder-only</strong> (BERT)</td>
                <td>Encoder stack</td>
                <td><span class="tf-badge tf-badge-green">Bidirectional</span></td>
                <td>Understanding: embeddings, retrieval, rerankers, classification</td>
            </tr>
            <tr>
                <td><strong>Decoder-only</strong> (GPT)</td>
                <td>Decoder stack</td>
                <td><span class="tf-badge tf-badge-yellow">Causal (masked)</span></td>
                <td>Generation: chat, code, autocompletion</td>
            </tr>
            <tr>
                <td><strong>Encoder-decoder</strong> (T5, original)</td>
                <td>Both</td>
                <td><span class="tf-badge tf-badge-green">Bi + causal</span></td>
                <td>Sequence-to-sequence: translation, summarization</td>
            </tr>
        </tbody>
    </table>
</div>

**The masking rule is the whole difference.** Remove the causal mask and every position
sees the full sentence—that is BERT, tuned for understanding. Keep the mask so each
position sees only its past, and you can generate one token at a time—that is GPT. Same
block, one flag flipped.

<div class="tf-callout tf-callout-tip">
    <strong>Encoders never went away.</strong> Even in the age of large decoder-only chat
    models, encoder-style Transformers remain the workhorse for producing text embeddings
    and for reranking search results—jobs that need one strong bidirectional read, not
    token-by-token generation.
</div>

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
