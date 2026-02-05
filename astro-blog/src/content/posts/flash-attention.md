---
title: "FlashAttention"
subtitle: "How IO-awareness and tiling make exact attention fast and memory-efficient."
authors:
  - "Tri Dao"
  - "Daniel Y. Fu"
  - "Stefano Ermon"
  - "Atri Rudra"
  - "Christopher Ré"
affiliations:
  - "Stanford University"
  - "University at Buffalo"
published: "2022-05-27"
doi: "arXiv:2205.14135"
doiUrl: "https://arxiv.org/abs/2205.14135"
abstract: "Understanding how FlashAttention achieves 2-4x speedups by respecting GPU memory hierarchy, using tiling to minimize HBM access, and leveraging online softmax for numerical stability."
tags:
  - "explainer"
category: "ml"
thumbnail: "/img/flash-attention/flash_recap_diagram.png"
---

<p class="d-note">
    This article explains the paper
    <a href="https://arxiv.org/abs/2205.14135">FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness</a>
    by Dao et al. (2022), which introduced an algorithm that makes transformer attention 2-4x faster
    without any approximation.
</p>

## The Problem: Attention is Memory-Bound

Standard self-attention in transformers has a well-known issue: it scales **quadratically** with sequence length. For a sequence of length $N$, we need to compute and store an $N \times N$ attention matrix.

<div class="d-math-block">
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right) V$$
</div>

But here's the insight that changes everything: **the bottleneck isn't computation—it's memory access**.

Modern GPUs are incredibly fast at arithmetic. The NVIDIA A100 can perform 312 TFLOPS of compute. But moving data between memory types? That's the real bottleneck.

<div class="d-callout">
    <strong>Key insight:</strong> Standard attention implementations are <em>IO-bound</em>, not compute-bound.
    We spend more time moving data than doing math.
</div>

## GPU Memory Hierarchy

To understand FlashAttention, we need to understand how GPU memory works.

<figure class="d-figure">
    <div class="d-figure-content">
        <div class="mem-hierarchy-diagram">
            <div class="mem-hierarchy-row">
                <div class="mem-box sram">
                    <div class="mem-box-label">SRAM</div>
                    <div class="mem-box-size">~20 MB</div>
                </div>
                <div class="mem-arrow">
                    <span class="arrow-label">19 TB/s</span>
                    <span class="arrow-icon">⟷</span>
                </div>
                <div class="mem-box compute">
                    <div class="mem-box-label">Compute</div>
                    <div class="mem-box-size">312 TFLOPS</div>
                </div>
            </div>
            <div class="mem-hierarchy-connector">
                <span class="connector-bandwidth">1.5 TB/s</span>
                <span class="connector-label">(~10× slower)</span>
            </div>
            <div class="mem-hierarchy-row">
                <div class="mem-box hbm">
                    <div class="mem-box-label">HBM</div>
                    <div class="mem-box-size">40-80 GB</div>
                    <div class="mem-box-note">Q, K, V, Output</div>
                </div>
            </div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        GPU memory hierarchy on A100. SRAM is ~10× faster but ~1000× smaller than HBM.
        The bottleneck is moving data between HBM and SRAM, not computation.
    </figcaption>
</figure>

GPUs have two main memory types:

### HBM (High Bandwidth Memory)
- **Size:** 40-80 GB on A100
- **Bandwidth:** 1.5-2.0 TB/s
- **Role:** Main GPU memory where model weights and activations live

### SRAM (On-chip Cache)
- **Size:** ~20 MB total (192 KB per streaming multiprocessor × 108 SMs)
- **Bandwidth:** ~19 TB/s
- **Role:** Fast scratch space for active computation

The key numbers: SRAM is **~10x faster** but **~1000x smaller** than HBM.

## Standard Attention: The Memory Problem

Let's trace what standard attention does:

<div class="algo-steps">
    <div class="algo-step">
        <span class="step-num">1</span>
        <div class="step-content">
            <strong>Load Q, K from HBM</strong>
            <span class="mem-tag hbm">HBM → SRAM</span>
        </div>
    </div>
    <div class="algo-step">
        <span class="step-num">2</span>
        <div class="step-content">
            <strong>Compute S = QK<sup>T</sup></strong>
            <span class="mem-tag compute">Compute</span>
        </div>
    </div>
    <div class="algo-step bad">
        <span class="step-num">3</span>
        <div class="step-content">
            <strong>Write S to HBM</strong> (N×N matrix!)
            <span class="mem-tag hbm">SRAM → HBM</span>
        </div>
    </div>
    <div class="algo-step bad">
        <span class="step-num">4</span>
        <div class="step-content">
            <strong>Read S from HBM</strong>
            <span class="mem-tag hbm">HBM → SRAM</span>
        </div>
    </div>
    <div class="algo-step">
        <span class="step-num">5</span>
        <div class="step-content">
            <strong>Compute P = softmax(S)</strong>
            <span class="mem-tag compute">Compute</span>
        </div>
    </div>
    <div class="algo-step bad">
        <span class="step-num">6</span>
        <div class="step-content">
            <strong>Write P to HBM</strong> (N×N matrix!)
            <span class="mem-tag hbm">SRAM → HBM</span>
        </div>
    </div>
    <div class="algo-step bad">
        <span class="step-num">7</span>
        <div class="step-content">
            <strong>Read P, V from HBM</strong>
            <span class="mem-tag hbm">HBM → SRAM</span>
        </div>
    </div>
    <div class="algo-step">
        <span class="step-num">8</span>
        <div class="step-content">
            <strong>Compute O = PV</strong>
            <span class="mem-tag compute">Compute</span>
        </div>
    </div>
</div>

The problem: we read/write the $N \times N$ attention matrix **multiple times**. For long sequences, this dominates runtime.

<div class="d-math-block">
$$\text{HBM accesses} = \Theta(Nd + N^2)$$
</div>

## FlashAttention: The Solution

FlashAttention's key idea: **never materialize the full attention matrix**. Instead, compute attention in tiles that fit in SRAM.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/flash-attention/flash_recap_diagram.png" alt="FlashAttention tiling diagram" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>FlashAttention tiling and softmax rescaling.</strong> By operating on blocks and using online softmax to rescale partial results, we avoid writing the large N×N attention matrix to HBM.
        <em>Image credit: <a href="https://crfm.stanford.edu/2023/07/17/flash2.html">Stanford CRFM</a></em>
    </figcaption>
</figure>

<figure class="d-figure">
    <div class="d-figure-content">
        <div id="tiling-interactive"></div>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Interactive:</strong> Standard attention materializes the full N×N matrix in HBM (red).
        FlashAttention processes blocks in SRAM (green), discarding each after use.
    </figcaption>
</figure>

### The Tiling Strategy

Instead of computing the full attention matrix at once:

1. **Divide** Q, K, V into blocks that fit in SRAM
2. **Compute** attention for each block pair
3. **Accumulate** results with proper normalization

But there's a catch: **softmax isn't block-decomposable**. You need the full row to compute the denominator.

## The Online Softmax Trick

This is the algorithmic insight that makes FlashAttention possible.

Standard softmax requires two passes over the data:
1. Find the maximum (for numerical stability)
2. Compute exp and sum

**Online softmax** does it in one pass by maintaining running statistics and rescaling on the fly.

<div class="d-equation-panel">
    <div class="d-equation-title">Online Softmax Update Rule</div>
    <div class="d-equation-main">
        $$m^{(new)} = \max(m^{(old)}, \tilde{m})$$
        $$\ell^{(new)} = e^{m^{(old)} - m^{(new)}} \ell^{(old)} + e^{\tilde{m} - m^{(new)}} \tilde{\ell}$$
        $$O^{(new)} = \frac{\ell^{(old)} e^{m^{(old)} - m^{(new)}} O^{(old)} + e^{\tilde{m} - m^{(new)}} \tilde{P}V}{\ell^{(new)}}$$
    </div>
    <div class="d-equation-legend">
        <div class="d-legend-item">
            <span class="d-legend-dot query"></span>
            <span>$m$: running maximum for numerical stability</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot key"></span>
            <span>$\ell$: running sum of exponentials (softmax denominator)</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot value"></span>
            <span>$O$: running output, rescaled as we see more blocks</span>
        </div>
    </div>
</div>

The key insight: when we see a new block with a larger maximum, we can **rescale** our previous partial results. This makes softmax associative—we can compute it block by block.

## The Algorithm

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/flash-attention/flash_algorithm_schematic.png" alt="FlashAttention algorithm loop structure" style="max-width: 580px; width: 100%; height: auto; margin: 0 auto; display: block;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>FlashAttention loop structure.</strong> The outer loop iterates over K,V blocks (copying to SRAM). The inner loop iterates over Q blocks, computing attention on SRAM and writing output to HBM. The N×N attention matrix QK<sup>T</sup> is never fully materialized.
    </figcaption>
</figure>

Here's the FlashAttention forward pass:

<div class="algo-box">
<div class="algo-title">FlashAttention Forward Pass</div>

**Input:** Q, K, V in HBM, block sizes $B_r$, $B_c$

**Output:** O (attention output)

1. Divide Q into $T_r = \lceil N/B_r \rceil$ blocks, K,V into $T_c = \lceil N/B_c \rceil$ blocks
2. Initialize O = 0, ℓ = 0, m = -∞ in HBM

3. **For** each K,V block j = 1, ..., $T_c$:
   - Load $K_j$, $V_j$ from HBM to SRAM

4. &nbsp;&nbsp;&nbsp;&nbsp;**For** each Q block i = 1, ..., $T_r$:
   - Load $Q_i$, $O_i$, $\ell_i$, $m_i$ from HBM to SRAM
   - Compute $S_{ij} = Q_i K_j^T$ (in SRAM)
   - Compute $\tilde{m}_{ij} = \text{rowmax}(S_{ij})$, $\tilde{P}_{ij} = \exp(S_{ij} - \tilde{m}_{ij})$, $\tilde{\ell}_{ij} = \text{rowsum}(\tilde{P}_{ij})$
   - Update $m_i^{new}$, $\ell_i^{new}$, $O_i$ using online softmax rules
   - Write $O_i$, $\ell_i$, $m_i$ to HBM

5. Return O
</div>

The critical property: the $N \times N$ attention matrix $S$ is **never fully materialized** in HBM. Each block $S_{ij}$ exists only briefly in SRAM.

<div class="d-math-block">
$$\text{HBM accesses} = O\left(\frac{N^2 d^2}{M}\right)$$
</div>

Where $M$ is SRAM size. For typical values ($d = 64$, $M = 100$KB), this is **5-20x fewer** HBM accesses.

## Why It Works: Arithmetic Intensity

**Arithmetic intensity** = FLOPs / bytes moved

Standard attention has low arithmetic intensity: we move lots of data for relatively little compute. FlashAttention increases arithmetic intensity by reusing data in SRAM.

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Method</th>
                <th>HBM Reads/Writes</th>
                <th>Arithmetic Intensity</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Standard Attention</td>
                <td class="bad">$\Theta(Nd + N^2)$</td>
                <td class="bad">Low</td>
            </tr>
            <tr class="highlight-row">
                <td><strong>FlashAttention</strong></td>
                <td class="good">$O(N^2d^2/M)$</td>
                <td class="good">High</td>
            </tr>
        </tbody>
    </table>
</div>

## Results

FlashAttention achieves significant speedups across different models and sequence lengths:

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/flash-attention/flash2_a100_benchmark.png" alt="FlashAttention-2 A100 benchmark" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>FlashAttention-2 benchmark on A100 GPU.</strong> Forward and backward pass speedup compared to baseline attention across different sequence lengths and head dimensions.
        <em>Image credit: <a href="https://crfm.stanford.edu/2023/07/17/flash2.html">Stanford CRFM</a></em>
    </figcaption>
</figure>

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Model</th>
                <th>Sequence Length</th>
                <th>Speedup</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>BERT-large</td>
                <td>512</td>
                <td class="good">15% faster end-to-end</td>
            </tr>
            <tr>
                <td>GPT-2</td>
                <td>1K</td>
                <td class="good">3× faster</td>
            </tr>
            <tr>
                <td>Long-range arena</td>
                <td>1K-4K</td>
                <td class="good">2.4× faster</td>
            </tr>
        </tbody>
    </table>
</div>

More importantly, FlashAttention enables **much longer sequences**. The paper shows the first Transformer to achieve better-than-random performance on Path-X (16K tokens) and Path-256 (64K tokens).

<div class="d-callout">
    <strong>Memory savings:</strong> For a 2K sequence with 16 heads and head dimension 64,
    standard attention needs ~1GB for the attention matrix. FlashAttention needs only the
    block size (~MB), a reduction of ~1000×.
</div>

## Extensions: FlashAttention-2 and 3

The original FlashAttention has been followed by improved versions:

**FlashAttention-2** (2023) improves parallelism:
- Better work partitioning across GPU thread blocks
- Reduced non-matmul FLOPs
- 2× faster than FlashAttention-1

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/flash-attention/flash_partitioning.png" alt="FlashAttention-2 work partitioning" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Work partitioning improvement in FlashAttention-2.</strong> The original "sliced-K" approach (left) requires synchronization between warps. FlashAttention-2 (right) partitions work to reduce synchronization overhead.
        <em>Image credit: <a href="https://crfm.stanford.edu/2023/07/17/flash2.html">Stanford CRFM</a></em>
    </figcaption>
</figure>

**FlashAttention-3** (2024) leverages new hardware features:
- Asynchronous execution (overlap compute and memory access)
- FP8 low-precision support
- Further speedups on H100 GPUs

## Key Takeaways

<div class="takeaways">
    <div class="takeaway">
        <span class="takeaway-num">1</span>
        <div class="takeaway-content">
            <strong>IO-awareness matters.</strong> Modern GPUs are compute-rich but memory-bandwidth-limited.
            Algorithm design must account for the memory hierarchy.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">2</span>
        <div class="takeaway-content">
            <strong>Tiling enables efficiency.</strong> By processing data in blocks that fit in fast cache,
            we can dramatically reduce slow memory access.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">3</span>
        <div class="takeaway-content">
            <strong>Online algorithms unlock parallelism.</strong> The online softmax trick makes
            softmax block-decomposable, enabling the tiled computation.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">4</span>
        <div class="takeaway-content">
            <strong>Exact beats approximate.</strong> FlashAttention is faster than approximate attention
            methods while computing the exact same result.
        </div>
    </div>
</div>

<section class="d-bibliography">

## References

1. Dao, T., Fu, D. Y., Ermon, S., Rudra, A., & Ré, C. (2022).
   [FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135).
   NeurIPS 2022.

2. Dao, T. (2023).
   [FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691).

3. Shah, J., Bikshandi, G., Zhang, Y., Thakkar, V., Ramani, P., & Dao, T. (2024).
   [FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision](https://arxiv.org/abs/2407.08608).

4. Milakov, M., & Gimelshein, N. (2018).
   Online Normalizer Calculation for Softmax. arXiv:1805.02867.

</section>

<footer class="d-appendix">

This article is a Distill-style explanation of the FlashAttention paper.
[Read the original paper →](https://arxiv.org/abs/2205.14135)

</footer>
