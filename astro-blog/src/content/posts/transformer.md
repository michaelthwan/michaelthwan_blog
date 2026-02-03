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
---

<p class="d-note">
    This article explains the landmark paper
    <a href="https://arxiv.org/abs/1706.03762">Attention Is All You Need</a>
    by Vaswani et al. (2017), which introduced the Transformer architecture
    that powers GPT, BERT, and nearly every modern language model.
</p>

## Introduction

The dominant sequence transduction models are based on complex recurrent or
convolutional neural networks that include an encoder and a decoder. The best
performing models also connect the encoder and decoder through an attention mechanism.

The Transformer is a new architecture based solely on attention mechanisms,
dispensing with recurrence and convolutions entirely. Experiments show these
models to be superior in quality while being more parallelizable and requiring
significantly less time to train.

## The Sequential Bottleneck

Before the Transformer, the dominant approach to sequence tasks—machine translation,
language modeling, text generation—was the **recurrent neural network (RNN)**,
particularly LSTMs and GRUs.

RNNs process sequences one token at a time. To compute the hidden state at position
$t$, you need the hidden state at position $t-1$:

<div class="d-math-block">
$$h_t = f(h_{t-1}, x_t)$$
</div>

This creates two fundamental problems:

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
The Transformer architecture. The encoder (left) processes the input sequence.
The decoder (right) generates the output, attending to both itself and the encoder output.
</figcaption>
</figure>

### Encoder

Each encoder layer has two sub-layers:

1. **Multi-head self-attention:** Every position attends to every position
2. **Feed-forward network:** Applied independently to each position

<div class="d-math-block">
$$\text{FFN}(x) = \max(0, xW_1 + b_1)W_2 + b_2$$
</div>

Residual connections and layer normalization wrap each sub-layer.

### Decoder

Each decoder layer has three sub-layers:

1. **Masked self-attention:** Each position attends only to earlier positions
2. **Cross-attention:** Queries from decoder; keys/values from encoder
3. **Feed-forward network:** Same as encoder

## Positional Encoding

Self-attention is permutation-equivariant—it has no notion of position.
The Transformer adds **positional encodings** to the input embeddings.

<div class="d-math-block">
$$PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)$$
$$PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)$$
</div>

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
                <td class="good">$O(1)$</td>
                <td class="good">$O(1)$</td>
            </tr>
            <tr>
                <td>Recurrent</td>
                <td>$O(n \cdot d^2)$</td>
                <td class="bad">$O(n)$</td>
                <td class="bad">$O(n)$</td>
            </tr>
            <tr>
                <td>Convolutional</td>
                <td>$O(k \cdot n \cdot d^2)$</td>
                <td class="good">$O(1)$</td>
                <td>$O(\log_k n)$</td>
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
