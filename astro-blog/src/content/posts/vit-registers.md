---
title: "Vision Transformers Need Registers"
subtitle: "Why large ViTs light up random specks of background, what those specks are secretly doing, and how four extra tokens make them go away."
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
abstract: "Large Vision Transformers show bright specks in their attention maps, on patches of plain background. The specks are patches the model has hijacked as scratch space for image-wide information, because it has nowhere else to put it. Adding a few empty 'register' tokens gives it that space: the specks disappear, attention maps become clean, and methods that read those maps work again."
tags:
  - "explainer"
category: "ml"
thumbnail: "/img/vit-registers/fig1-attention-comparison.png"
---

<p class="d-note">
    This article explains the ICLR 2024 paper
    <a href="https://arxiv.org/abs/2309.16588">Vision Transformers Need Registers</a>
    by Darcet et al. Figures marked "from the paper" are the authors' own; the probing chart and the interactive
    are drawn for this article from the paper's numbers and attention maps.
</p>

<style>
  .vr-callout {
    border-left: 3px solid; border-radius: 0 6px 6px 0;
    padding: 11px 14px; margin: 20px 0; font-size: 0.92rem; line-height: 1.55;
  }
  .vr-callout-tip  { border-color: #10b981; background: #f0fdf4; color: #065f46; }
  .vr-callout-warn { border-color: #f59e0b; background: #fffbeb; color: #92400e; }
  .vr-callout-note { border-color: #6366f1; background: #eef2ff; color: #3730a3; }
  :root[data-theme="dark"] .vr-callout-tip  { background: rgba(16,185,129,0.10); color: #6ee7b7; }
  :root[data-theme="dark"] .vr-callout-warn { background: rgba(245,158,11,0.10); color: #fcd34d; }
  :root[data-theme="dark"] .vr-callout-note { background: rgba(99,102,241,0.12); color: #a5b4fc; }

  /* Image rows (input / without / with) */
  .vr-row { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .vr-cellfig { text-align: center; }
  .vr-cellfig img { width: 150px; height: auto; display: block; border-radius: 3px; }
  .vr-cellfig span { display: block; font-size: 12px; color: #57606a; margin-top: 5px; }
  .vr-row-small .vr-cellfig img { width: 104px; }

  /* Probing chart */
  .vr-box {
    border: 1px solid var(--color-border); border-radius: 10px; padding: 18px 20px;
    margin: 24px 0; background: var(--color-surface);
  }
  .vr-box h3 { margin-top: 0; }
  .vr-desc { color: var(--color-gray); font-size: 0.9rem; margin: 0 0 14px 0; }
  .vr-probe { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; }
  .vr-probe-title { font-weight: 700; font-size: 0.95rem; }
  .vr-probe-sub { font-size: 0.8rem; color: var(--color-gray); margin-bottom: 10px; }
  .vr-probe-row { display: grid; grid-template-columns: 96px 1fr 48px; gap: 8px; align-items: center; margin: 7px 0; font-size: 0.85rem; }
  .vr-probe-track { height: 16px; background: var(--color-border); border-radius: 3px; position: relative; }
  .vr-probe-bar { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; }
  .vr-probe-bar.normal { background: var(--color-blue); }
  .vr-probe-bar.hijacked { background: var(--color-orange); }
  .vr-probe-bar.cls { background: var(--color-gray); }
  .vr-probe-val { font-variant-numeric: tabular-nums; font-weight: 600; text-align: right; }
  .vr-probe-axis { display: grid; grid-template-columns: 96px 1fr 48px; gap: 8px; font-size: 0.72rem; color: var(--color-gray); }
  .vr-probe-axis div { display: flex; justify-content: space-between; }
  .vr-probe-note { font-size: 0.85rem; color: var(--color-gray); margin-top: 14px; }

  /* Interactive */
  .vr-controls { display: flex; gap: 18px; flex-wrap: wrap; margin-bottom: 14px; font-size: 0.85rem; }
  .vr-seg { display: inline-flex; border: 1px solid var(--color-border); border-radius: 6px; overflow: hidden; }
  .vr-seg button {
    border: 0; padding: 5px 12px; font: inherit; font-size: 0.85rem; cursor: pointer;
    background: var(--color-bg); color: var(--color-text);
  }
  .vr-seg button + button { border-left: 1px solid var(--color-border); }
  .vr-seg button.vr-on { background: var(--color-accent-emphasis); color: #fff; font-weight: 600; }
  .vr-ctl-label { font-weight: 600; margin-right: 6px; }
  .vr-hijack-layout { display: grid; grid-template-columns: auto 1fr; gap: 22px; align-items: start; }
  .vr-maps { display: flex; gap: 10px; align-items: flex-start; }
  .vr-maps figure { margin: 0; text-align: center; font-size: 12px; color: var(--color-gray); }
  .vr-maps img { display: block; border-radius: 4px; }
  .vr-stage { position: relative; width: 260px; height: 260px; cursor: crosshair; }
  .vr-stage img { width: 260px; height: 260px; image-rendering: pixelated; }
  #vr-hijack-overlay { position: absolute; inset: 0; pointer-events: none; }
  .vr-ring {
    position: absolute; width: 22px; height: 22px; margin: -11px 0 0 -11px;
    border: 2px solid #ff8c1a; border-radius: 50%; box-shadow: 0 0 0 1px rgba(0,0,0,0.35);
  }
  .vr-slots { display: flex; gap: 6px; margin: 6px 0 12px; }
  .vr-slot {
    width: 44px; height: 30px; border: 1.5px dashed var(--color-border); border-radius: 5px;
    display: flex; align-items: center; justify-content: center; font-size: 0.72rem; color: var(--color-gray);
  }
  .vr-slot.vr-slot-on { border-style: solid; border-color: #d4a017; background: rgba(212,160,23,0.18); color: var(--color-text); font-weight: 600; }
  .vr-side h4 { margin: 0 0 2px; font-size: 0.85rem; }
  .vr-count { font-size: 0.9rem; margin: 10px 0; }
  .vr-hover { font-size: 0.85rem; color: var(--color-gray); min-height: 3.6em; border-left: 3px solid var(--color-border); padding-left: 10px; }
  .vr-takeaway { margin-top: 14px; font-size: 0.9rem; line-height: 1.55; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 6px; padding: 10px 12px; }

  @media (max-width: 680px) {
    .vr-probe { grid-template-columns: 1fr; }
    .vr-hijack-layout { grid-template-columns: 1fr; }
    .vr-maps { justify-content: center; }
    .vr-maps figure:first-child { display: none; }
  }
</style>

## A speck of sky that will not stay quiet

Ask a Vision Transformer where it is looking, and you expect its attention to settle on the object. The usual way to ask is to plot the attention of [CLS], the extra token whose output summarizes the image. For the original DINO model, that is what happens. For the big modern ViTs that everyone builds on, something else shows up too: a handful of bright specks scattered over plain background, far from anything interesting.

<figure class="d-figure">
    <div class="d-figure-content">
        <div class="vr-row">
            <div class="vr-cellfig"><img src="/img/vit-registers/sample-orig.png" alt="Input image: a moth on a flower head"><span>Input</span></div>
            <div class="vr-cellfig"><img src="/img/vit-registers/dinov2-0reg-attn.png" alt="DINOv2 attention map with bright specks in the background"><span>DINOv2</span></div>
            <div class="vr-cellfig"><img src="/img/vit-registers/dinov2-4reg-attn.png" alt="DINOv2 with registers: clean attention map focused on the moth and flower"><span>DINOv2 + registers</span></div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 1.</strong> Attention of the final layer's [CLS] token, from the paper. Without registers (middle), bright specks
        appear in the empty background. The same model trained with four register tokens (right) attends to the moth and the flower.
    </figcaption>
</figure>

This is not one model's quirk. The specks appear in DeiT-III (trained on labels), OpenCLIP (trained on image-text pairs) and DINOv2 (self-supervised). Three different training methods, the same symptom.

The paper's answer, and the idea that holds this whole post together: **the specks are the model making its own scratch space.** It needs somewhere to keep information about the whole image while it computes, it has no slot for that, so it takes over patches it thinks nobody will miss. The fix is to give it the slots.

## Three clues about the specks

Before the explanation, the evidence. The authors characterize the specks along three lines, and each one points the same way.

### Clue 1: they are loud

Each output token is a vector. Measure its length (its norm) for every patch across many images, and the patches split into two groups. Most sit in a tight band. A small group has norms many times larger. In DINOv2 ViT-g, about **2.4%** of patch tokens exceed a norm of 150; the bright specks in Figure 1 are exactly these high-norm tokens.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/vit-registers/fig7-before-after.png" alt="Token norm distributions for DINOv2, CLIP and DeiT-III, each without and with registers" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 2.</strong> Output token norms, from the paper. In each pair, the left column is the model as trained normally: a dense band
        plus a long tail of high-norm outliers. The right column is the same model trained with registers, which we return to later.
    </figcaption>
</figure>

A population that splits cleanly in two usually means two different jobs, not one noisy job.

### Clue 2: they sit on boring patches

Where do the high-norm tokens appear? The authors compare each patch with its neighbours in the input. The high-norm patches are almost identical to the patches around them: a stretch of sky, a smooth wall, an out-of-focus background.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/vit-registers/fig5-similarity.png" alt="Density of cosine similarity to neighbouring patches: artifact patches pile up near 1.0" style="max-width: 360px; width: 100%; height: auto; margin: 0 auto; display: block;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 3.</strong> Similarity between each patch and its neighbours, from the paper. Artifact patches (orange) pile up near 1.0:
        they are near-copies of what surrounds them, so they carry almost no information of their own.
    </figcaption>
</figure>

In other words, the model picks the patches that are **redundant**. Losing what they say costs almost nothing, because their neighbours say the same thing.

### Clue 3: they appear only when the model is big and well trained

The specks are not there from the start.

<figure class="d-figure">
    <div class="d-figure-content" style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
        <img src="/img/vit-registers/fig4a-layers.png" alt="Token norms by layer: a second high-norm band splits off around layer 15" style="flex: 1; min-width: 200px; max-width: 280px; height: auto;">
        <img src="/img/vit-registers/fig4b-training.png" alt="Token norms over training: outliers appear after about a third of training" style="flex: 1; min-width: 200px; max-width: 280px; height: auto;">
        <img src="/img/vit-registers/fig4c-model-size.png" alt="Token norms by model size: only large models have outliers" style="flex: 1; min-width: 200px; max-width: 280px; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 4.</strong> From the paper, for DINOv2. (a) A second, high-norm band splits off around layer 15 of 40.
        (b) It appears only after about a third of training. (c) Only the Large, Huge and Giant models show it.
    </figcaption>
</figure>

A behavior that needs depth, training time and capacity is not a bug in the data or the code. It is something the model **learns to do** once it is strong enough to benefit from it.

## What the specks are doing

So the model deliberately overwrites a few redundant patches. With what? The authors answer with **linear probes**: small linear classifiers trained on frozen token vectors, which test what information a token still holds. They probe normal patches and high-norm patches for two kinds of information.

<div class="vr-box">
  <h3>What a patch token still knows</h3>
  <p class="vr-desc">Linear-probe results from Table 1 of the paper, DINOv2 ViT-g. Longer bars mean the information is still in the token.</p>
  <div class="vr-probe">
    <div>
      <div class="vr-probe-title">Local: where is this patch?</div>
      <div class="vr-probe-sub">position prediction accuracy</div>
      <div class="vr-probe-row"><span>Normal patch</span><div class="vr-probe-track"><div class="vr-probe-bar normal" style="width: 41.7%"></div></div><span class="vr-probe-val">41.7%</span></div>
      <div class="vr-probe-row"><span>High-norm patch</span><div class="vr-probe-track"><div class="vr-probe-bar hijacked" style="width: 22.8%"></div></div><span class="vr-probe-val">22.8%</span></div>
      <div class="vr-probe-axis"><span></span><div><span>0</span><span>50</span><span>100%</span></div><span></span></div>
    </div>
    <div>
      <div class="vr-probe-title">Global: what is in the image?</div>
      <div class="vr-probe-sub">ImageNet classification accuracy</div>
      <div class="vr-probe-row"><span>Normal patch</span><div class="vr-probe-track"><div class="vr-probe-bar normal" style="width: 65.8%"></div></div><span class="vr-probe-val">65.8%</span></div>
      <div class="vr-probe-row"><span>High-norm patch</span><div class="vr-probe-track"><div class="vr-probe-bar hijacked" style="width: 69.0%"></div></div><span class="vr-probe-val">69.0%</span></div>
      <div class="vr-probe-row"><span>[CLS] token</span><div class="vr-probe-track"><div class="vr-probe-bar cls" style="width: 86.0%"></div></div><span class="vr-probe-val">86.0%</span></div>
      <div class="vr-probe-axis"><span></span><div><span>0</span><span>50</span><span>100%</span></div><span></span></div>
    </div>
  </div>
  <p class="vr-probe-note">A third probe agrees with the first: reconstructing the patch's own pixels is harder from a high-norm token (error 25.23) than from a normal one (18.38).</p>
</div>

Read the two panels as a trade. The high-norm tokens got **worse** at their own job: knowing where they are and what pixels they cover. They got **better** at a job that was never theirs: describing the whole image. The model has erased a local patch and written a global summary in its place.

<div class="vr-callout vr-callout-warn">
    <strong>Why would a model need to do this?</strong> A transformer's only memory is its tokens. The [CLS] token already has
    an output job, and every patch token is supposed to describe its own square of the image. There is no free slot for
    intermediate, image-wide computation. A large model that would benefit from one makes its own, by recycling the
    tokens whose content it can most afford to lose.
</div>

## Try it: find the hijacked patches

The maps below are the real attention maps from the paper, at patch resolution. The circles mark patches that are far brighter than their surroundings and that go dark in the model trained with registers, detected automatically from the two maps. Switch to the model trained with registers and watch where the global information goes.

<div id="vr-hijack" class="vr-box interactive-container">
  <h3>Where does the global summary go?</h3>
  <div class="vr-controls">
    <div><span class="vr-ctl-label">Model</span><span class="vr-seg"><button type="button" data-model="dinov2">DINOv2</button><button type="button" data-model="deit3">DeiT-III</button></span></div>
    <div><span class="vr-ctl-label">Registers</span><span class="vr-seg"><button type="button" data-reg="0">0</button><button type="button" data-reg="4">4</button></span></div>
  </div>
  <div class="vr-hijack-layout">
    <div class="vr-maps">
      <figure><img src="/img/vit-registers/sample-orig.png" alt="Input image" width="110" height="110"><figcaption>Input</figcaption></figure>
      <figure>
        <div class="vr-stage">
          <img id="vr-hijack-map" src="/img/vit-registers/dinov2-0reg-attn.png" alt="Attention map">
          <div id="vr-hijack-overlay"></div>
        </div>
        <figcaption>[CLS] attention</figcaption>
      </figure>
    </div>
    <div class="vr-side">
      <h4>Register tokens</h4>
      <div class="vr-slots"><div class="vr-slot">reg 1</div><div class="vr-slot">reg 2</div><div class="vr-slot">reg 3</div><div class="vr-slot">reg 4</div></div>
      <div id="vr-hijack-count" class="vr-count"></div>
      <div id="vr-hijack-hover" class="vr-hover"></div>
    </div>
  </div>
  <div id="vr-hijack-takeaway" class="vr-takeaway"></div>
</div>

DeiT-III shows the problem more strongly than DINOv2. Its specks are larger and there are more of them, which is also why methods that read its attention maps struggled most, as the results below show.

## The fix: give the model registers

If the model is improvising scratch space, hand it some. The paper adds a few extra learnable tokens, called **registers**, to the input sequence.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/vit-registers/register-architecture.png" alt="Architecture: register tokens are appended to the patch and CLS tokens at the input, and their outputs are thrown away" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 5.</strong> From the paper. Register tokens (yellow) enter the transformer next to the patches and [CLS].
        They take part in every attention layer, and their outputs are discarded.
    </figcaption>
</figure>

<div class="d-math-block">
$$
\text{input} = [\texttt{CLS};\ \texttt{reg}_1, \ldots, \texttt{reg}_N;\ \texttt{patch}_1, \ldots, \texttt{patch}_M]
$$
</div>

A register has no pixels behind it and no output job. It starts as a learned vector, is updated by attention like every other token, and is thrown away at the end. Its only purpose is to give attention heads a legitimate place to read and write image-wide information. The recipe is three steps:

1. **Append $N$ learnable tokens** to the input, next to [CLS].
2. **Train as usual.** Registers join every attention operation.
3. **Discard them at the output.** Downstream tasks use [CLS] and the patch tokens as before.

The cost is small: with 4 registers, compute grows by under 2%; with 16, by up to 6%. The real cost is elsewhere: the paper's models are **trained from scratch** with registers, because the hijacking habit is learned in pretraining.

### How many registers?

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/vit-registers/fig8-performance-ablation.png" alt="ImageNet accuracy, segmentation mIoU and depth error against the number of registers" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 6.</strong> From the paper: ImageNet accuracy, segmentation mIoU and depth error against the number of registers (0 to 16).
    </figcaption>
</figure>

A single register already removes the artifacts. Beyond that, the tasks disagree: segmentation peaks around 4 registers, depth around 8, and ImageNet keeps improving up to 16. The paper uses **4** as its default, a middle ground at under 2% extra compute.

## What changes with registers

### The loud tokens go quiet

Look back at Figure 2, right column of each pair. With registers, the high-norm tail shrinks sharply in all three models, and for DINOv2 and CLIP it vanishes into a single band. The specks in Figure 1 disappear with it.

### Dense tasks: small, mostly positive changes

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr><th>Model</th><th>ImageNet (acc)</th><th>ADE20k seg. (mIoU)</th><th>NYUd depth (RMSE, lower is better)</th></tr>
        </thead>
        <tbody>
            <tr><td>DeiT-III</td><td>84.7 → 84.7</td><td>38.9 → <span class="good">39.1</span></td><td>0.511 → 0.512</td></tr>
            <tr><td>OpenCLIP</td><td>78.2 → 78.1</td><td>26.6 → <span class="good">26.7</span></td><td>0.702 → <span class="good">0.661</span></td></tr>
            <tr class="highlight-row"><td><strong>DINOv2</strong></td><td>84.3 → <span class="good">84.8</span></td><td>46.6 → <span class="good">47.9</span></td><td>0.378 → <span class="good">0.366</span></td></tr>
        </tbody>
    </table>
</div>

Linear-probe results from the paper. mIoU is the overlap between predicted and true segmentation masks (higher is better); RMSE is the depth error (lower is better). The gains are modest, largest for DINOv2, and not universal: DeiT-III's depth error barely moves. Registers are mainly a fix for the feature maps, not a general accuracy boost.

### Object discovery: the big change

The clearest win is for methods that **read the attention and feature maps directly**. LOST finds the main object in an image without any labels, by starting from the least-connected patch and growing outward. A bright speck on the background can hijack that seed.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/vit-registers/fig1-attention-comparison.png" alt="LOST score, seed similarity and seed expansion maps for DeiT-III, CLIP and DINOv2, with and without registers" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 7.</strong> From the paper (Figure 13): the intermediate maps of LOST. Without registers, DeiT-III's maps are
        covered in speckle; with registers they outline the bird.
    </figcaption>
</figure>

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr><th>Model (corloc, %)</th><th>VOC 2007</th><th>VOC 2012</th><th>COCO 20k</th></tr>
        </thead>
        <tbody>
            <tr><td>DeiT-III</td><td>11.7 → <span class="good">27.1</span></td><td>13.1 → <span class="good">32.7</span></td><td>10.7 → <span class="good">25.1</span></td></tr>
            <tr><td>OpenCLIP</td><td>38.8 → 37.1</td><td>44.3 → 42.0</td><td>31.0 → 27.9</td></tr>
            <tr class="highlight-row"><td><strong>DINOv2</strong></td><td>35.3 → <span class="good"><strong>55.4</strong></span></td><td>40.2 → <span class="good"><strong>60.0</strong></span></td><td>26.9 → <span class="good"><strong>42.0</strong></span></td></tr>
        </tbody>
    </table>
</div>

The metric is corloc: the share of images where the predicted box overlaps a real object enough to count. For DINOv2, object discovery jumps by 15 to 20 points on every benchmark, and DeiT-III more than doubles. OpenCLIP is the exception and gets slightly worse, a reminder that registers fix one specific failure rather than everything.

<div class="vr-callout vr-callout-tip">
    <strong>The capability was already there.</strong> LOST was designed around the original DINO, which has no specks.
    The stronger models had better features all along; the specks were burying them.
</div>

### What the registers learn

Nobody tells the registers what to do. Still, their attention patterns come out different from each other, and some settle on particular objects in the scene.

<figure class="d-figure">
    <div class="d-figure-content">
        <div class="vr-row vr-row-small">
            <div class="vr-cellfig"><img src="/img/vit-registers/fig9-reg-attn-mug.png" alt="Input image"><span>Input</span></div>
            <div class="vr-cellfig"><img src="/img/vit-registers/fig9-reg-attn-cls.png" alt="CLS token attention"><span>[CLS]</span></div>
            <div class="vr-cellfig"><img src="/img/vit-registers/fig9-reg-attn-reg0.png" alt="Register 0 attention"><span>Register 0</span></div>
            <div class="vr-cellfig"><img src="/img/vit-registers/fig9-reg-attn-reg6.png" alt="Register 6 attention"><span>Register 6</span></div>
            <div class="vr-cellfig"><img src="/img/vit-registers/fig9-reg-attn-reg8.png" alt="Register 8 attention"><span>Register 8</span></div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 8.</strong> From the paper: attention maps of [CLS] and three registers on the same image. Registers sometimes settle on
        different parts of the scene, without any supervision telling them to.
    </figcaption>
</figure>

## The same story in language models

The pattern is not unique to vision.

<div class="vr-callout vr-callout-note">
    <strong>Attention sinks.</strong> Large language models put a big share of their attention on a few tokens, usually the
    first one, that carry little meaning. Xiao et al. (2023) showed these "sinks" are load-bearing: drop them from the cache
    and streaming generation falls apart. A softmax attention head must put its weight <em>somewhere</em> even when it has
    nothing to attend to, so the model designates a throwaway token for it. Their fix, a dedicated learnable sink token, is
    the language-model version of a register. Same disease, same cure: give the model explicit scratch space instead of
    letting it take some.
</div>

A 2025 follow-up, *Vision Transformers Don't Need Trained Registers* (Jiang et al.), removes the main cost. It traces the high-norm tokens to a small set of neurons and redirects their activity into an extra, untrained token at test time. That mimics registers on models already trained without them, with no retraining.

## Takeaways

**1. The specks are scratch space.** Large ViTs overwrite a few redundant background patches with image-wide information. Those tokens become high-norm outliers and show up as bright specks.

**2. Three clues point to it.** The tokens are loud (norms many times larger), they sit on patches that copy their neighbours, and they appear only in big models, mid-network, after a third of training.

**3. Probes confirm the trade.** High-norm tokens forget where they are (22.8% vs 41.7% position accuracy) and know more about the whole image (69.0% vs 65.8%).

**4. Registers are the fix.** A few learnable tokens that are discarded at the output give the model legitimate scratch space. One removes the artifacts; four is the default, at under 2% extra compute.

**5. The payoff is clean feature maps.** Dense-task gains are modest, but methods that read attention maps directly, like LOST, improve by 15 to 20 points on DINOv2.

<section class="d-bibliography">

## References

1. Darcet, T., Oquab, M., Mairal, J., & Bojanowski, P. (2024). [Vision Transformers Need Registers](https://arxiv.org/abs/2309.16588). ICLR 2024.

2. Oquab, M., et al. (2023). DINOv2: Learning Robust Visual Features without Supervision.

3. Touvron, H., et al. (2022). DeiT III: Revenge of the ViT.

4. Radford, A., et al. (2021). Learning Transferable Visual Models From Natural Language Supervision (CLIP).

5. Siméoni, O., et al. (2021). Localizing Objects with Self-Supervised Transformers and no Labels (LOST).

6. Xiao, G., Tian, Y., Chen, B., Han, S., & Lewis, M. (2023). [Efficient Streaming Language Models with Attention Sinks](https://arxiv.org/abs/2309.17453).

7. Jiang, N., Dravid, A., Efros, A., & Gandelsman, Y. (2025). [Vision Transformers Don't Need Trained Registers](https://arxiv.org/abs/2506.08010).

</section>

<footer class="d-appendix">

This article is a Distill-style explanation of the Vision Transformers Need Registers paper.
[Read the original paper →](https://arxiv.org/abs/2309.16588)

</footer>

<script src="/js/vit-registers.js"></script>
