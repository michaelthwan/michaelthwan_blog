---
title: "Vision Transformers Need Registers"
subtitle: "Why large ViTs develop mysterious high-norm tokens in background regions, and how adding simple register tokens fixes everything."
authors:
  - "Timothée Darcet"
  - "Maxime Oquab"
  - "Julien Mairal"
  - "Piotr Bojanowski"
affiliations:
  - "Meta AI Research"
  - "Inria"
published: "2023-09-28"
doi: "arXiv:2309.16588"
doiUrl: "https://arxiv.org/abs/2309.16588"
abstract: "Large Vision Transformers develop artifacts—high-norm tokens in low-information areas used for internal computation. Adding learnable register tokens eliminates these artifacts and improves dense prediction tasks."
tags:
  - "explainer"
category: "ml"
thumbnail: "/img/vit-registers/fig1-attention-comparison.png"
---

<p class="d-note">
    This article explains the ICLR 2024 paper
    <a href="https://arxiv.org/abs/2309.16588">Vision Transformers Need Registers</a>
    by Darcet et al., which discovered a surprising phenomenon in large ViT models
    and proposed an elegantly simple fix.
</p>

## The Mystery: Artifacts in Vision Transformers

Something strange happens in large Vision Transformers. When you visualize their attention maps or feature norms, you see scattered "spikes"—patches with abnormally high values appearing in seemingly random locations, mostly in uniform background regions.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/vit-registers/fig1-attention-comparison.png" alt="Attention maps with and without registers" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 1 from the paper:</strong> Attention maps from DeiT-III, OpenCLIP, and DINOv2 models. Left column shows artifacts as bright spots scattered across images. Right column shows clean attention maps after adding registers.
    </figcaption>
</figure>

These aren't random glitches. They appear consistently across different training paradigms:

- **DeiT-III** (supervised on labels)
- **OpenCLIP** (supervised on text-image pairs)
- **DINOv2** (self-supervised)

The only model that *doesn't* show these artifacts? The original DINO. Understanding why reveals something fundamental about how Vision Transformers process information.

## Characterizing the Artifacts

### They Have Extremely High Norms

The artifacts correspond to tokens whose output feature vectors have roughly **10x higher norm** than normal patches. When you plot the distribution of token norms across many images, you see a clear bimodal pattern:

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/vit-registers/fig7-before-after.png" alt="Bimodal distribution of token norms" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 7 from the paper:</strong> Distribution of token norms across DINOv2, CLIP, and DeiT-III models. Without registers (left of each pair), a clear bimodal distribution shows ~2-3% of tokens with anomalously high norms. With registers (right), the distribution becomes unimodal.
    </figcaption>
</figure>

<div class="d-callout">
    <strong>Key observation:</strong> About 2-3% of tokens become "outliers" with norms exceeding 150, while normal tokens stay below 100.
</div>

### They Appear in Low-Information Regions

Where do these high-norm tokens appear? Not randomly—they concentrate in **patches that look similar to their neighbors**. Areas of uniform color, texture, or background.

<figure class="d-figure">
    <div class="d-figure-content">
        <div class="artifact-location-viz">
            <div class="location-row">
                <div class="location-item">
                    <div class="location-icon high-similarity"></div>
                    <span>High neighbor similarity</span>
                </div>
                <span class="location-arrow">→</span>
                <div class="location-item">
                    <div class="location-icon high-norm"></div>
                    <span>High-norm token likely</span>
                </div>
            </div>
            <div class="location-row">
                <div class="location-item">
                    <div class="location-icon low-similarity"></div>
                    <span>Low neighbor similarity</span>
                </div>
                <span class="location-arrow">→</span>
                <div class="location-item">
                    <div class="location-icon normal"></div>
                    <span>Normal token</span>
                </div>
            </div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        Outlier tokens appear where patches are redundant—conveying little unique information.
    </figcaption>
</figure>

### They Emerge Mid-Network, Mid-Training, in Large Models

The artifacts don't exist from the start. They develop under specific conditions:

<figure class="d-figure">
    <div class="d-figure-content" style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
        <img src="/img/vit-registers/fig4a-layers.png" alt="Norms by layer" style="flex: 1; min-width: 200px; max-width: 280px; height: auto;">
        <img src="/img/vit-registers/fig4b-training.png" alt="Norms by training iteration" style="flex: 1; min-width: 200px; max-width: 280px; height: auto;">
        <img src="/img/vit-registers/fig4c-model-size.png" alt="Norms by model size" style="flex: 1; min-width: 200px; max-width: 280px; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 4 from the paper:</strong> (a) Norms spike around layer 15 of 40. (b) Artifacts appear only after ~1/3 of training. (c) Only ViT-Large and bigger models exhibit them.
    </figcaption>
</figure>

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Condition</th>
                <th>Artifacts Present?</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Early layers (1-10)</td>
                <td class="neutral">No</td>
            </tr>
            <tr>
                <td>Middle layers (15+)</td>
                <td class="bad">Yes</td>
            </tr>
            <tr>
                <td>Early training (&lt;33%)</td>
                <td class="neutral">No</td>
            </tr>
            <tr>
                <td>Late training (&gt;33%)</td>
                <td class="bad">Yes</td>
            </tr>
            <tr>
                <td>Small models (ViT-S/B)</td>
                <td class="neutral">No</td>
            </tr>
            <tr>
                <td>Large models (ViT-L/H/g)</td>
                <td class="bad">Yes</td>
            </tr>
        </tbody>
    </table>
</div>

This pattern suggests the artifacts are an *emergent* behavior—something the model learns to do when it has enough capacity and training time.

## The Hypothesis: Recycled Tokens for Global Computation

Why would a model create these strange high-norm tokens? The paper proposes a compelling explanation:

<div class="d-callout">
    <strong>Hypothesis:</strong> Large, well-trained ViTs learn to identify low-information patches and repurpose them as internal "registers" for storing and computing global image information.
</div>

### Evidence: What Do Outlier Tokens Encode?

The authors probe what information these tokens contain:

**Local information (patch position, pixel reconstruction):**
- Normal tokens: 41.7% position accuracy, 18.38 reconstruction error
- Outlier tokens: 22.8% position accuracy, 25.23 reconstruction error

**Global information (image classification):**
- Normal tokens: 65.8% ImageNet accuracy
- Outlier tokens: 69.0% ImageNet accuracy
- [CLS] token: 86.0% ImageNet accuracy

<figure class="d-figure">
    <div class="d-figure-content">
        <div class="info-comparison">
            <div class="info-bar-group">
                <div class="info-label">Local Info (Position)</div>
                <div class="info-bars">
                    <div class="info-bar normal" style="width: 41.7%">
                        <span>Normal: 41.7%</span>
                    </div>
                    <div class="info-bar outlier" style="width: 22.8%">
                        <span>Outlier: 22.8%</span>
                    </div>
                </div>
            </div>
            <div class="info-bar-group">
                <div class="info-label">Global Info (Classification)</div>
                <div class="info-bars">
                    <div class="info-bar normal" style="width: 65.8%">
                        <span>Normal: 65.8%</span>
                    </div>
                    <div class="info-bar outlier" style="width: 69.0%">
                        <span>Outlier: 69.0%</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        Outlier tokens discard local spatial information but retain (and slightly improve) global image understanding.
    </figcaption>
</figure>

The outliers have *discarded* their local patch information and instead store *global* image features. They're functioning as informal registers—but they're doing it by hijacking patches that "shouldn't matter."

## The Problem: Why This Matters

If the model works, why care about these artifacts?

### 1. Corrupted Feature Maps

Dense prediction tasks (segmentation, depth estimation, object detection) rely on spatially coherent feature maps. Artifacts introduce noise:

<figure class="d-figure">
    <div class="d-figure-content" style="display: flex; gap: 16px; justify-content: center; align-items: center; flex-wrap: wrap;">
        <div style="text-align: center;">
            <img src="/img/vit-registers/sample-orig.png" alt="Original image" style="width: 120px; height: auto;">
            <div style="font-size: 11px; color: #666; margin-top: 4px;">Input</div>
        </div>
        <div style="text-align: center;">
            <img src="/img/vit-registers/dinov2-0reg-attn.png" alt="DINOv2 without registers" style="width: 120px; height: auto;">
            <div style="font-size: 11px; color: #666; margin-top: 4px;">DINOv2 (artifacts)</div>
        </div>
        <div style="text-align: center;">
            <img src="/img/vit-registers/dinov2-4reg-attn.png" alt="DINOv2 with registers" style="width: 120px; height: auto;">
            <div style="font-size: 11px; color: #666; margin-top: 4px;">DINOv2 + registers</div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        Attention maps showing artifacts (bright scattered pixels in background) that disappear when registers are added.
    </figcaption>
</figure>

### 2. Broken Object Discovery

Methods like LOST (Large-scale Object diScovery from self-supervised Transformers) use attention maps to find objects. Artifacts catastrophically break these methods for large models—which is why researchers were stuck using smaller, less capable models.

### 3. Uninterpretable Attention

Attention visualization is a key tool for understanding what models "see." Artifacts make attention maps nearly useless for interpretation.

## The Solution: Explicit Register Tokens

The fix is remarkably simple: **give the model dedicated tokens for internal computation**.

<div class="d-equation-panel">
    <div class="d-equation-title">Register Token Formulation</div>
    <div class="d-equation-main">
        $$\text{Input} = [\texttt{CLS}; \texttt{reg}_1; \ldots; \texttt{reg}_N; \texttt{patch}_1; \ldots; \texttt{patch}_M]$$
    </div>
    <div class="d-equation-legend">
        <div class="d-legend-item">
            <span class="d-legend-dot cls"></span>
            <span><strong>[CLS]</strong>: Classification token (as usual)</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot register"></span>
            <span><strong>[reg]</strong>: New learnable register tokens</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot patch"></span>
            <span><strong>[patch]</strong>: Image patch embeddings</span>
        </div>
    </div>
</div>

### How Registers Work

1. **Add N learnable tokens** to the input sequence (after [CLS], before patches)
2. **Train normally**—registers participate in all attention operations
3. **Discard registers at output**—only use [CLS] and patch tokens for downstream tasks

<figure class="d-figure">
    <div class="d-figure-content">
        <div class="register-diagram">
            <div class="register-stage">
                <div class="stage-label">Input</div>
                <div class="token-sequence">
                    <span class="token cls">[CLS]</span>
                    <span class="token reg">reg₁</span>
                    <span class="token reg">reg₂</span>
                    <span class="token reg">reg₃</span>
                    <span class="token reg">reg₄</span>
                    <span class="token patch">p₁</span>
                    <span class="token patch">p₂</span>
                    <span class="token patch">...</span>
                    <span class="token patch">pₘ</span>
                </div>
            </div>
            <div class="register-arrow">↓ Transformer Layers ↓</div>
            <div class="register-stage">
                <div class="stage-label">Output</div>
                <div class="token-sequence">
                    <span class="token cls used">[CLS]</span>
                    <span class="token reg discarded">reg₁</span>
                    <span class="token reg discarded">reg₂</span>
                    <span class="token reg discarded">reg₃</span>
                    <span class="token reg discarded">reg₄</span>
                    <span class="token patch used">p₁</span>
                    <span class="token patch used">p₂</span>
                    <span class="token patch used">...</span>
                    <span class="token patch used">pₘ</span>
                </div>
            </div>
            <div class="register-legend">
                <span class="legend-item"><span class="box used"></span> Used for downstream</span>
                <span class="legend-item"><span class="box discarded"></span> Discarded</span>
            </div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        Register tokens participate in attention but are discarded at output. They provide dedicated workspace for global computation.
    </figcaption>
</figure>

### How Many Registers?

<figure class="d-figure">
    <div class="d-figure-content" style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; align-items: flex-start;">
        <img src="/img/vit-registers/fig8-performance-ablation.png" alt="Performance vs number of registers" style="flex: 1; min-width: 280px; max-width: 400px; height: auto;">
        <img src="/img/vit-registers/fig8-ablation.png" alt="Overhead vs number of registers" style="flex: 0 0 auto; max-width: 200px; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 8 from the paper:</strong> Left: Performance on ImageNet, segmentation, and depth tasks vs. number of registers—4 registers is optimal. Right: Computational overhead is minimal (~2% FLOPs for 4 registers, negligible parameters).
    </figcaption>
</figure>

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Registers</th>
                <th>Artifacts</th>
                <th>Performance</th>
                <th>Overhead</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>0</td>
                <td class="bad">Present</td>
                <td>Baseline</td>
                <td>0%</td>
            </tr>
            <tr>
                <td>1</td>
                <td class="good">Eliminated</td>
                <td>Slight drop</td>
                <td>~0.5%</td>
            </tr>
            <tr class="highlight-row">
                <td><strong>4</strong></td>
                <td class="good"><strong>Eliminated</strong></td>
                <td class="good"><strong>Optimal</strong></td>
                <td><strong>&lt;2%</strong></td>
            </tr>
            <tr>
                <td>16</td>
                <td class="good">Eliminated</td>
                <td>Saturated</td>
                <td>~6%</td>
            </tr>
        </tbody>
    </table>
</div>

**The sweet spot is 4 registers**: artifacts completely gone, optimal downstream performance, and less than 2% computational overhead.

## Results: Registers Fix Everything

### Artifact Elimination

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/vit-registers/fig7-before-after.png" alt="Norm distribution before and after registers" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 7 from the paper:</strong> Distribution of output norms across all three training methods. With registers, the bimodal distribution becomes unimodal—artifacts are completely eliminated.
    </figcaption>
</figure>

### Dense Prediction Tasks

Performance on semantic segmentation (ADE20k) and depth estimation (NYUd):

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Model</th>
                <th>ImageNet</th>
                <th>ADE20k (mIoU)</th>
                <th>NYUd (RMSE↓)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>DeiT-III</td>
                <td>84.7 → 84.7</td>
                <td>38.9 → <span class="good">39.1</span></td>
                <td>0.511 → <span class="good">0.512</span></td>
            </tr>
            <tr>
                <td>OpenCLIP</td>
                <td>78.2 → 78.1</td>
                <td>26.6 → <span class="good">26.7</span></td>
                <td>0.702 → <span class="good">0.661</span></td>
            </tr>
            <tr class="highlight-row">
                <td><strong>DINOv2</strong></td>
                <td>84.3 → <span class="good">84.8</span></td>
                <td>46.6 → <span class="good">47.9</span></td>
                <td>0.378 → <span class="good">0.366</span></td>
            </tr>
        </tbody>
    </table>
</div>

Registers maintain or improve performance across the board. DINOv2 sees the largest gains.

### Object Discovery Unlocked

The most dramatic improvement comes from object discovery methods like LOST:

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Model</th>
                <th>VOC 2007</th>
                <th>VOC 2012</th>
                <th>COCO 20k</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>DeiT-III</td>
                <td>11.7 → <span class="good">27.1</span></td>
                <td>13.1 → <span class="good">32.7</span></td>
                <td>10.7 → <span class="good">25.1</span></td>
            </tr>
            <tr class="highlight-row">
                <td><strong>DINOv2</strong></td>
                <td>35.3 → <span class="good"><strong>55.4</strong></span></td>
                <td>40.2 → <span class="good"><strong>60.0</strong></span></td>
                <td>26.9 → <span class="good"><strong>42.0</strong></span></td>
            </tr>
        </tbody>
    </table>
</div>

<div class="d-callout">
    <strong>+20 points on VOC 2007!</strong> Registers enable large models to work with object discovery methods that previously only worked with smaller models.
</div>

## What Do Registers Learn?

Without any explicit supervision, registers spontaneously specialize:

<figure class="d-figure">
    <div class="d-figure-content" style="display: flex; gap: 8px; justify-content: center; align-items: flex-end; flex-wrap: wrap;">
        <div style="text-align: center;">
            <img src="/img/vit-registers/fig9-reg-attn-mug.png" alt="Input image" style="width: 100px; height: auto;">
            <div style="font-size: 10px; color: #666; margin-top: 4px;">Input</div>
        </div>
        <div style="text-align: center;">
            <img src="/img/vit-registers/fig9-reg-attn-cls.png" alt="CLS attention" style="width: 100px; height: auto;">
            <div style="font-size: 10px; color: #666; margin-top: 4px;">[CLS]</div>
        </div>
        <div style="text-align: center;">
            <img src="/img/vit-registers/fig9-reg-attn-reg0.png" alt="Register 0 attention" style="width: 100px; height: auto;">
            <div style="font-size: 10px; color: #666; margin-top: 4px;">Reg 0</div>
        </div>
        <div style="text-align: center;">
            <img src="/img/vit-registers/fig9-reg-attn-reg6.png" alt="Register 6 attention" style="width: 100px; height: auto;">
            <div style="font-size: 10px; color: #666; margin-top: 4px;">Reg 6</div>
        </div>
        <div style="text-align: center;">
            <img src="/img/vit-registers/fig9-reg-attn-reg8.png" alt="Register 8 attention" style="width: 100px; height: auto;">
            <div style="font-size: 10px; color: #666; margin-top: 4px;">Reg 8</div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 9 from the paper:</strong> Different registers develop distinct attention patterns. Each register spontaneously specializes—some focus on the object, others on edges or background regions.
    </figcaption>
</figure>

Each register develops its own "role" in processing the image—some attend to central objects, others to boundaries, others to textures. The model figures out how to use this extra computational workspace on its own.

## Interactive: Norm Distribution Explorer

Explore how token norms distribute across a ViT's output. Adjust the threshold to see how many tokens would be classified as "outliers."

<figure class="d-figure">
    <div class="d-figure-content norm-explorer-wrapper">
        <div id="norm-distribution-interactive"></div>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Interactive:</strong> The bimodal distribution of token norms. Most tokens cluster around norm ~50, but ~2-3% have norms exceeding 150. Drag the threshold to classify outliers.
    </figcaption>
</figure>

## Why This Matters Beyond ViTs

This paper reveals something fundamental about how Transformers process information:

1. **Emergence of internal structure**: Given enough capacity and training, models develop their own computational primitives—even without being told to.

2. **The cost of implicit computation**: When models repurpose input tokens for computation, it corrupts the representational space. Explicit workspace is better.

3. **Simple fixes for complex problems**: The solution isn't architectural surgery—it's just adding 4 tokens. Sometimes the best interventions are minimal.

<div class="d-callout warning">
    <strong>Connection to LLMs:</strong> Similar phenomena have been observed in language models, where certain tokens become "sink" tokens for attention. The register concept may generalize beyond vision.
</div>

## Takeaways

1. **Large Vision Transformers develop artifacts**—high-norm tokens in low-information regions that serve as informal registers for global computation.

2. **Adding explicit register tokens eliminates these artifacts** with negligible overhead (<2% FLOPs, ~0.1% parameters).

3. **Registers improve dense prediction tasks** and unlock object discovery methods for large models.

4. **4 registers is the sweet spot**—enough to eliminate artifacts and optimize performance.

5. **Registers spontaneously specialize** into different functional roles without supervision.

The paper demonstrates that understanding *why* neural networks develop certain behaviors—even strange ones—can lead to simple, principled improvements.

<section class="d-bibliography">

## References

1. Darcet, T., Oquab, M., Mairal, J., & Bojanowski, P. (2024).
   [Vision Transformers Need Registers](https://arxiv.org/abs/2309.16588).
   ICLR 2024.

2. Oquab, M., et al. (2023). DINOv2: Learning Robust Visual Features without Supervision.

3. Touvron, H., et al. (2022). DeiT III: Revenge of the ViT.

4. Radford, A., et al. (2021). Learning Transferable Visual Models From Natural Language Supervision (CLIP).

5. Siméoni, O., et al. (2021). Localizing Objects with Self-Supervised Transformers and no Labels (LOST).

</section>

<footer class="d-appendix">

This article is a Distill-style explanation of the Vision Transformers Need Registers paper.
[Read the original paper →](https://arxiv.org/abs/2309.16588)

</footer>
