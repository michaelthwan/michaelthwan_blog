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

<style>
  .fa-callout {
    border-left: 3px solid; border-radius: 0 6px 6px 0;
    padding: 11px 14px; margin: 20px 0; font-size: 0.92rem; line-height: 1.55;
  }
  .fa-callout-tip  { border-color: #10b981; background: #f0fdf4; color: #065f46; }
  .fa-callout-warn { border-color: #f59e0b; background: #fffbeb; color: #92400e; }
  .fa-callout-note { border-color: #6366f1; background: #eef2ff; color: #3730a3; }
  .fa-badge { display: inline-block; font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
  .fa-badge-green  { background: #d1fae5; color: #065f46; }
  .fa-badge-yellow { background: #fef3c7; color: #92400e; }
  .fa-badge-red    { background: #fee2e2; color: #b91c1c; }
</style>

One idea runs through this whole article: **on a modern GPU, the memory hierarchy _is_ the algorithm**. FlashAttention computes the exact same softmax attention as the textbook version. It is faster only because it moves less data. Keep that framing in mind and every design choice below follows from it.

## The Problem: Attention is Memory-Bound

Standard self-attention scales **quadratically** with sequence length. For a sequence of length $N$, we compute and store an $N \times N$ attention matrix.

<div class="d-math-block">
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right) V$$
</div>

Read this as: score every query against every key ($QK^T$), squash the scores into a probability distribution per row (softmax), then take a weighted average of the value vectors. The $N \times N$ score matrix in the middle is the expensive object — it grows with the square of the sequence.

Here is the twist. **The bottleneck is not the arithmetic — it is the memory access.** An NVIDIA A100 can do 312 TFLOPS of matrix math, but its main memory delivers data far slower than the tensor cores can consume it. So the chip spends most of its time waiting for numbers to arrive, not multiplying them.

<div class="fa-callout fa-callout-note">
    <strong>Standard attention is IO-bound, not compute-bound.</strong> We spend more wall-clock time shuttling the score matrix between memory tiers than doing the actual multiplications. Cutting data movement — not FLOPs — is what makes it fast.
</div>

## GPU Memory Hierarchy

To understand FlashAttention, we need to understand how GPU memory works.

<figure class="d-figure">
    <div class="d-figure-content">
        <div class="mem-flow-diagram">
            <div class="mem-flow-item">
                <div class="mem-flow-box hbm">
                    <div class="mem-flow-label">HBM</div>
                    <div class="mem-flow-spec">40-80 GB</div>
                </div>
                <div class="mem-flow-desc">Main memory<br/>(Q, K, V, O)</div>
            </div>
            <div class="mem-flow-arrow slow">
                <span class="mem-flow-bw">1.5 TB/s</span>
                <span class="mem-flow-icon">→</span>
                <span class="mem-flow-note">bottleneck</span>
            </div>
            <div class="mem-flow-item">
                <div class="mem-flow-box sram">
                    <div class="mem-flow-label">SRAM</div>
                    <div class="mem-flow-spec">~20 MB</div>
                </div>
                <div class="mem-flow-desc">On-chip cache</div>
            </div>
            <div class="mem-flow-arrow fast">
                <span class="mem-flow-bw">19 TB/s</span>
                <span class="mem-flow-icon">→</span>
                <span class="mem-flow-note">10× faster</span>
            </div>
            <div class="mem-flow-item">
                <div class="mem-flow-box compute">
                    <div class="mem-flow-label">Compute</div>
                    <div class="mem-flow-spec">312 TFLOPS</div>
                </div>
                <div class="mem-flow-desc">Tensor cores</div>
            </div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        GPU memory hierarchy on A100. Data must flow through SRAM to reach compute.
        The HBM→SRAM transfer is the bottleneck—not the computation itself.
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

<div class="fa-callout fa-callout-warn">
    <strong>The size-speed trade-off is the whole game.</strong> SRAM is fast enough to keep the tensor cores fed, but at ~20&nbsp;MB it cannot hold a large attention matrix. HBM is big enough for anything, but at 1.5&nbsp;TB/s it starves the cores. FlashAttention's job is to do as much work as possible while the data is still in SRAM, and touch HBM as rarely as possible.
</div>

To make the gap concrete: a 4K-token attention matrix in fp16 is $4096 \times 4096 \times 2 \approx 34$&nbsp;MB per head. Writing it to HBM and reading it back is ~68&nbsp;MB of traffic at 1.5&nbsp;TB/s ≈ **45 microseconds of pure data movement** — before a single useful multiply. Multiply that by many heads and layers and the copies, not the math, set the runtime.

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

The red steps are the waste: we write the $N \times N$ matrix to HBM and read it straight back, twice. **The score matrix never needed to leave the chip — the standard implementation evicts it only because it computes softmax in separate passes.** For long sequences, these round-trips dominate runtime.

<div class="d-math-block">
$$\text{HBM accesses} = \Theta(Nd + N^2)$$
</div>

The $N^2$ term is the killer. Loading $Q, K, V$ costs $\Theta(Nd)$, but materializing and re-reading the score matrix costs $\Theta(N^2)$ — and for long sequences $N^2 \gg Nd$. Every byte of that term is optional.

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

But there's a catch: **softmax isn't block-decomposable**. The denominator is a sum over the whole row, so you seem to need every key before you can normalize any of them. How do you normalize a row you've only seen part of?

## The Online Softmax Trick

This is the algorithmic insight that makes tiling possible.

Standard softmax needs two passes over each row:
1. Find the maximum (subtracted for numerical stability, so $e^{x}$ never overflows).
2. Compute every $e^{x_i - \max}$ and sum them into the denominator.

**Online softmax** fuses both into a single pass by carrying two running numbers per row — the max seen so far ($m$) and the running denominator ($\ell$) — and correcting them each time a new block arrives.

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

Line by line: the first equation just updates the running max. The second re-expresses the old denominator in terms of the new max (the $e^{m^{old}-m^{new}}$ factor shrinks the old sum to match the new, larger baseline) and adds the new block's contribution. The third does the same correction to the running output before folding in the new block's $\tilde{P}V$.

The trick is the correction factor $e^{m^{old}-m^{new}}$. **When a later block reveals a larger maximum, we retroactively rescale everything computed so far** — as if we had known the true max all along. Because the fix-up is exact, the block-by-block result equals the single-shot softmax to the last bit.

<div class="fa-callout fa-callout-tip">
    <strong>Concrete example.</strong> Suppose block 1 gives scores with max 2.0, and we accumulate a partial sum $\ell = 5.0$. Block 2 then shows a score of 4.0. Instead of restarting, we multiply the old sum by $e^{2.0 - 4.0} = e^{-2} \approx 0.135$, getting $0.68$, then add block 2's exponentials on the new baseline of 4.0. The running output is scaled by the same factor. No pass over block 1 is repeated.
</div>

## The Algorithm

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/flash-attention/flash_algorithm_schematic.png" alt="FlashAttention algorithm loop structure" style="max-width: 520px; width: 100%; height: auto; margin: 0 auto; display: block;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>FlashAttention loop structure.</strong> The outer loop (orange) iterates over K,V blocks, loading them to SRAM. The inner loop (blue) iterates over Q blocks, computing attention in SRAM and writing output to HBM.
    </figcaption>
</figure>

<figure class="d-figure">
    <div class="d-figure-content">
        <div id="flash-algorithm-interactive"></div>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Interactive:</strong> Step through the algorithm to see data flow between HBM and SRAM. Press Play or use Step to advance.
    </figcaption>
</figure>

Here's the FlashAttention forward pass:

<div class="algo-box">
<div class="algo-title">FlashAttention Forward Pass</div>

**Input:** Matrices $Q, K, V \in \mathbb{R}^{N \times d}$ in HBM, block sizes $B_r, B_c$

**Output:** $O \in \mathbb{R}^{N \times d}$

1. Divide $Q$ into $T\_r = \lceil N/B\_r \rceil$ blocks, $K, V$ into $T\_c = \lceil N/B\_c \rceil$ blocks

2. Initialize $O = 0$, $\ell = 0$, $m = -\infty$ in HBM

3. **For** $j = 1, \ldots, T\_c$ (outer loop over K, V):

   - Load $K\_j, V\_j$ from HBM to SRAM

4. **For** $i = 1, \ldots, T\_r$ (inner loop over Q):

   - Load $Q\_i, O\_i, \ell\_i, m\_i$ from HBM to SRAM
   - On chip, compute $S\_{ij} = Q\_i K\_j^T \in \mathbb{R}^{B\_r \times B\_c}$
   - On chip, compute:
     - $\tilde{m}\_{ij} = \text{rowmax}(S\_{ij}) \in \mathbb{R}^{B\_r}$
     - $\tilde{P}\_{ij} = \exp(S\_{ij} - \tilde{m}\_{ij}) \in \mathbb{R}^{B\_r \times B\_c}$
     - $\tilde{\ell}\_{ij} = \text{rowsum}(\tilde{P}\_{ij}) \in \mathbb{R}^{B\_r}$
   - Update $m\_i^{\text{new}}, \ell\_i^{\text{new}}, O\_i$ using online softmax
   - Write $O\_i, \ell\_i, m\_i$ to HBM

5. Return $O$

</div>

The critical property: the $N \times N$ attention matrix $S$ is **never fully materialized** in HBM. Each block $S_{ij}$ exists only briefly in SRAM.

<div class="d-math-block">
$$\text{HBM accesses} = O\left(\frac{N^2 d^2}{M}\right)$$
</div>

Where $M$ is SRAM size. The $N^2$ term from standard attention is gone — replaced by a term that _shrinks_ as SRAM grows. Bigger fast cache means bigger tiles, means fewer trips to HBM. For typical values ($d = 64$, $M = 100$KB), this is **5-20x fewer** HBM accesses, and the exact same output.

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
                <td><span class="fa-badge fa-badge-red">Low — cores starve</span></td>
            </tr>
            <tr class="highlight-row">
                <td><strong>FlashAttention</strong></td>
                <td class="good">$O(N^2d^2/M)$</td>
                <td><span class="fa-badge fa-badge-green">High — cores stay fed</span></td>
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
                <td><span class="fa-badge fa-badge-yellow">15% faster end-to-end</span></td>
            </tr>
            <tr>
                <td>GPT-2</td>
                <td>1K</td>
                <td><span class="fa-badge fa-badge-green">3× faster</span></td>
            </tr>
            <tr>
                <td>Long-range arena</td>
                <td>1K-4K</td>
                <td><span class="fa-badge fa-badge-green">2.4× faster</span></td>
            </tr>
        </tbody>
    </table>
</div>

More importantly, FlashAttention enables **much longer sequences**. Because memory now grows linearly with $N$ instead of quadratically, sequences that once ran out of memory become feasible. The paper shows the first Transformer to reach better-than-random accuracy on Path-X (16K tokens) and Path-256 (64K tokens). This is the through-line paying off: respecting the memory hierarchy did not just speed up attention — it changed what lengths are trainable at all.

<div class="fa-callout fa-callout-tip">
    <strong>Memory savings in concrete terms.</strong> For a 2K sequence with 16 heads and head dimension 64,
    standard attention needs ~1GB for the attention matrix. FlashAttention needs only the
    block currently in SRAM (~MB) — a reduction of ~1000×.
</div>

What does FlashAttention give up? **It trades extra FLOPs for fewer memory accesses.** The backward pass recomputes attention blocks on the fly rather than reading a stored matrix, so total arithmetic goes up — and it still wins, because on a memory-bound workload FLOPs are nearly free. The real costs are engineering ones: a hand-tuned fused kernel per hardware generation, and none of the composability of stock framework ops.

## Extensions: FlashAttention-2 and 3

The original algorithm fixed the memory problem. The follow-ups chase the remaining hardware inefficiencies — the same through-line, one hardware generation at a time.

**FlashAttention-2** (2023) improves parallelism:
- Better work partitioning across GPU thread blocks, so more of the GPU stays busy
- Fewer non-matmul FLOPs (rescaling and exp are slow relative to tensor-core matmuls)
- Roughly 2× faster than FlashAttention-1, reaching ~50-70% of the A100's theoretical peak

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
- Asynchronous execution — overlap the matmul on the tensor cores with the softmax rescaling, so neither waits for the other
- FP8 low-precision support for even higher throughput
- Reaches ~75% of the H100's peak FLOPs; up to ~1.2 PFLOPS in FP8

<div class="fa-callout fa-callout-note">
    <strong>Why the lineage matters for long context.</strong> Every modern long-context model — 128K tokens and beyond — depends on this family. Without IO-aware attention, a 128K-token attention matrix would need hundreds of gigabytes of HBM traffic per layer. FlashAttention is the reason "long context" is an engineering feature and not a research fantasy. It ships inside PyTorch (<code>scaled_dot_product_attention</code>), vLLM, and essentially every production serving stack.
</div>

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
