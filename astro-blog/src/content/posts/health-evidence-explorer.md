---
title: "Every Health Claim, Tied to the Marker It Moves"
subtitle: "184 claims across eight goals, each carrying the paper it came from, the population it was measured in, and what the finding is conditional on."
authors:
  - "Michael Wan"
affiliations:
  - "Independent Analysis"
published: "2026-09-13"
abstract: "Health advice arrives as a flat list: eat this, take that, sleep more. A flat list hides the three things that decide whether a claim is worth acting on - which endpoint actually moved, how strong the evidence behind it is, and whether two pieces of advice are really the same lever pulled twice. This is that literature rebuilt as a graph: behavior to biomarker to goal, walkable from either end. Effect sizes are compared only within a marker, where the units match. Null results are recorded as findings. Nothing is ever summed, and every row carries the paper's own result sentence."
tags:
  - "explainer"
  - "interactive"
category: "business"
---

<style>
  /* ── Health evidence explorer (scoped, prefix hx-) ── */
  .hx-note {
    border-left: 3px solid var(--color-border); padding-left: 14px;
    font-size: 0.9rem; color: var(--color-gray); line-height: 1.6; margin: 20px 0;
  }

  /* The explorer needs far more width than a prose column, so it breaks out of one.
     Measured geometry rather than guesswork: .d-toc is 180px including its gutter, and
     .d-article-container centres a (toc + article) row inside its own content box, which
     leaves an equal dead margin on each side. Pulling left by (toc + that dead margin)
     lands exactly on the container's content edge, so the explorer fills the container
     and stays centred at every width. 100vw includes the scrollbar, hence the extra 20px
     of slack; erring narrow costs nothing, erring wide overflows the page.
     Below 900px the table of contents is gone and the breakout is switched off. */
  .hx-wide {
    --hx-w: min(calc(var(--l-page) - 64px), calc(100vw - 84px));
    --hx-dead: max(0px, calc((var(--hx-w) - var(--toc-width) - var(--content-width)) / 2));
    width: var(--hx-w);
    margin-left: calc(-1 * (var(--toc-width) + var(--hx-dead)));
  }

  .hx-explorer {
    border: 1px solid var(--color-border); border-radius: 10px;
    background: var(--color-bg); margin: 26px 0 10px; overflow: hidden;
  }

  .hx-modebar { display: flex; border-bottom: 1px solid var(--color-border); background: var(--color-canvas-subtle); }
  .hx-mode {
    flex: 1; padding: 12px 14px; border: 0; background: transparent; cursor: pointer;
    font: inherit; font-size: 0.92rem; color: var(--color-gray); border-bottom: 2px solid transparent;
  }
  .hx-mode:hover { color: var(--color-text); }
  .hx-mode.is-active {
    color: var(--color-text); font-weight: 600; background: var(--color-bg);
    border-bottom-color: var(--color-accent);
  }

  .hx-toolbar {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    padding: 10px 16px; border-bottom: 1px solid var(--color-border);
  }
  .hx-filter {
    flex: 1; min-width: 180px; padding: 7px 10px; font: inherit; font-size: 0.9rem;
    color: var(--color-text); background: var(--color-bg);
    border: 1px solid var(--color-border); border-radius: 6px;
  }
  .hx-toggle {
    padding: 6px 11px; font: inherit; font-size: 0.8rem; cursor: pointer;
    color: var(--color-gray); background: var(--color-bg);
    border: 1px solid var(--color-border); border-radius: 6px;
  }
  .hx-toggle:hover { color: var(--color-text); }

  .hx-body { display: grid; grid-template-columns: minmax(0, 1fr) 380px; }
  .hx-tree { padding: 6px 16px 20px; min-width: 0; }
  .hx-panel {
    border-left: 1px solid var(--color-border); background: var(--color-canvas-subtle);
    padding: 16px; font-size: 0.85rem; line-height: 1.6; min-width: 0;
    align-self: start; position: sticky; top: 12px; max-height: 92vh; overflow-y: auto;
  }

  .hx-group {
    display: flex; align-items: center; gap: 9px;
    margin: 22px 0 2px; padding: 0 0 6px;
    font-family: var(--font-display); font-size: 0.78rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.07em; color: var(--color-gray);
    border-bottom: 2px solid var(--color-border);
  }
  .hx-group:first-child { margin-top: 6px; }

  .hx-section { border-top: 1px solid var(--color-border); }
  .hx-section:first-child { border-top: 0; }
  .hx-goalbar {
    display: flex; flex-wrap: wrap; align-items: baseline; gap: 9px;
    padding: 12px 2px 9px; cursor: pointer; list-style: none;
  }
  .hx-goalbar::-webkit-details-marker { display: none; }
  .hx-goalbar::before { content: '▾'; font-size: 0.7rem; color: var(--color-gray-light); }
  .hx-section:not([open]) .hx-goalbar::before { content: '▸'; }
  .hx-goalname { font-family: var(--font-display); font-weight: 600; font-size: 1.05rem; }
  .hx-tally {
    font-family: var(--font-mono); font-size: 0.71rem; color: var(--color-gray-light);
    border: 1px solid var(--color-border); border-radius: 9px; padding: 1px 7px;
  }
  .hx-goaldef { font-size: 0.8rem; color: var(--color-gray); flex: 1; min-width: 160px; }

  .hx-branches, .hx-leaves { list-style: none; margin: 0; padding: 0; }
  /* Markers sit side by side when there is room. One marker per row wastes the width
     the breakout just bought and turns eight goals into a very long scroll. */
  .hx-branches {
    display: grid; gap: 6px 26px;
    grid-template-columns: repeat(auto-fill, minmax(min(420px, 100%), 1fr));
    align-items: start;
  }
  .hx-branch { margin: 10px 0 0 6px; padding-left: 14px; border-left: 2px solid var(--color-border); }
  .hx-marker { display: flex; flex-wrap: wrap; align-items: baseline; gap: 7px; margin-bottom: 4px; }
  .hx-marker-name { font-weight: 600; font-size: 0.9rem; }
  .hx-unit { font-family: var(--font-mono); font-size: 0.71rem; color: var(--color-gray-light); }
  .hx-count {
    font-family: var(--font-mono); font-size: 0.68rem; color: var(--color-gray-light);
    border: 1px solid var(--color-border); border-radius: 8px; padding: 0 5px;
  }

  .hx-leaves { padding-left: 8px; }
  .hx-leaf {
    display: flex; flex-wrap: wrap; align-items: baseline; gap: 7px; width: 100%;
    padding: 5px 8px; margin: 1px 0; border: 0; border-radius: 6px;
    background: transparent; cursor: pointer; text-align: left;
    font: inherit; font-size: 0.87rem; color: var(--color-text);
  }
  .hx-leaf:hover { background: var(--color-neutral-muted); }
  .hx-leaf.is-selected { background: var(--color-blue-bg); }
  .hx-leaf-name { font-weight: 500; }

  /* Direction, not verdict: a green plus means the marker went up, which on a row like
     smoking and all-cause mortality is the harm. The legend states this explicitly. */
  .hx-dir {
    display: inline-flex; align-items: center; justify-content: center;
    width: 17px; height: 17px; border-radius: 50%; flex-shrink: 0;
    font-family: var(--font-mono); font-size: 0.78rem; font-weight: 800; line-height: 1;
    color: #fff; box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.18);
  }
  .hx-dir-good { background: #2da44e; }
  .hx-dir-bad { background: #e5534b; }
  .hx-dir-unclear { background: #8250df; }
  .hx-dir-none { background: #b9bfc6; color: #1f2328; box-shadow: none; }

  .hx-effect { font-family: var(--font-mono); font-size: 0.74rem; color: var(--color-gray); }
  .hx-effect-null { font-style: italic; font-family: var(--font-body); }

  .hx-tier {
    font-family: var(--font-mono); font-size: 0.63rem; font-weight: 700;
    letter-spacing: 0.02em; padding: 1px 5px; border-radius: 3px; white-space: nowrap;
  }

  /* Usefulness tier. A derived sort key, so it is the boldest thing on the row - but the
     effect size and the evidence tag sit right beside it and remain the real content. */
  .hx-use {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 20px; height: 18px; padding: 0 5px; border-radius: 4px;
    font-family: var(--font-mono); font-size: 0.72rem; font-weight: 800;
    color: #fff; flex-shrink: 0;
  }
  .hx-use-S { background: #7b2ff7; }
  .hx-use-A { background: #1a7f37; }
  .hx-use-B { background: #0969da; }
  .hx-use-C { background: #bc4c00; }
  .hx-use-D { background: #6e7781; }
  .hx-use-E { background: #b9bfc6; color: #1f2328; }
  .hx-use-NULL { background: transparent; color: var(--color-gray-light);
                 border: 1px dashed var(--color-border); font-weight: 600; }

  .hx-why { margin: 6px 0 0; padding-left: 16px; font-size: 0.76rem; color: var(--color-gray); }
  .hx-why li { margin: 2px 0; }
  .hx-tier-A { color: var(--color-green);  background: var(--color-green-bg); }
  .hx-tier-B { color: var(--color-blue);   background: var(--color-blue-bg); }
  .hx-tier-C { color: var(--color-orange); background: var(--color-orange-bg); }
  .hx-tier-D { color: var(--color-gray);   background: var(--color-neutral-muted); }

  .hx-cross {
    font-size: 0.67rem; font-weight: 700; color: var(--color-purple);
    border: 1px solid var(--color-purple); border-radius: 3px; padding: 0 4px;
  }
  .hx-cond { flex-basis: 100%; font-size: 0.75rem; color: var(--color-orange); font-style: italic; }
  .hx-cond-strong { color: var(--color-orange); font-weight: 600; }

  .hx-panel-empty { color: var(--color-gray); }
  .hx-panel-head { padding-bottom: 8px; margin-bottom: 10px; border-bottom: 1px solid var(--color-border); }
  .hx-panel-edge { font-weight: 600; font-size: 0.89rem; }
  .hx-facts { margin: 0 0 12px; }
  .hx-facts dt {
    font-size: 0.67rem; text-transform: uppercase; letter-spacing: 0.05em;
    color: var(--color-gray-light); margin-top: 9px;
  }
  .hx-facts dd { margin: 2px 0 0; }
  .hx-muted { color: var(--color-gray-light); }
  .hx-verbatim {
    margin: 12px 0; padding: 9px 12px; border-left: 3px solid var(--color-accent);
    background: var(--color-bg); font-size: 0.81rem; line-height: 1.55;
  }
  .hx-subhead {
    margin: 14px 0 5px; font-size: 0.67rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--color-gray-light);
  }
  .hx-passage { margin: 0; font-size: 0.82rem; line-height: 1.6; color: var(--color-text); }
  .hx-fig { margin: 10px 0 14px; }
  .hx-fig img {
    width: 100%; height: auto; display: block; border: 1px solid var(--color-border);
    border-radius: 6px; background: #fff;
  }
  .hx-fig figcaption { margin-top: 5px; font-size: 0.74rem; line-height: 1.5; color: var(--color-gray); }
  .hx-fig figcaption strong { color: var(--color-text); }
  .hx-figcap { display: block; margin-top: 3px; color: var(--color-gray-light); }

  .hx-warn {
    font-size: 0.67rem; font-weight: 700; color: var(--color-orange);
    background: var(--color-orange-bg); border-radius: 3px; padding: 1px 5px;
  }
  .hx-warnbox {
    margin: 10px 0 0; padding: 8px 11px; font-size: 0.79rem; line-height: 1.5;
    color: var(--color-orange-dark); background: var(--color-orange-bg);
    border-left: 3px solid var(--color-orange); border-radius: 0 5px 5px 0;
  }

  .hx-tier-fixed { outline: 1px dashed var(--color-purple); outline-offset: 1px; }
  .hx-fixbox {
    margin: 10px 0 0; padding: 8px 11px; font-size: 0.79rem; line-height: 1.5;
    color: var(--color-text); background: var(--color-neutral-muted);
    border-left: 3px solid var(--color-purple); border-radius: 0 5px 5px 0;
  }

  .hx-cite { margin: 8px 0 0; font-size: 0.79rem; }
  .hx-caveat { margin: 10px 0 0; font-size: 0.79rem; color: var(--color-gray); }
  .hx-empty { color: var(--color-gray-light); font-size: 0.85rem; font-style: italic; padding: 8px 0; }

  .hx-leverage {
    padding: 12px 16px; border-bottom: 1px solid var(--color-border);
    background: var(--color-canvas-subtle);
  }
  .hx-lev-head {
    font-size: 0.67rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--color-gray-light); margin-bottom: 7px;
  }
  /* Sixteen families in one column ate a third of the collapsed page; two columns when
     there is room keeps the whole leverage picture on one screen. */
  .hx-levlist {
    list-style: none; margin: 0; padding: 0; display: grid; gap: 1px 30px;
    grid-template-columns: repeat(auto-fill, minmax(min(380px, 100%), 1fr));
  }
  .hx-levlist li {
    display: grid; grid-template-columns: 150px 1fr 62px 62px; align-items: center; gap: 9px;
    font-size: 0.79rem;
  }
  .hx-lev-name { font-weight: 600; }
  .hx-lev-bar { background: var(--color-neutral-muted); border-radius: 3px; height: 7px; }
  .hx-lev-bar i { display: block; height: 100%; border-radius: 3px; background: var(--color-purple); }
  .hx-lev-n { color: var(--color-text); font-family: var(--font-mono); font-size: 0.72rem; }
  .hx-lev-e { color: var(--color-gray-light); font-family: var(--font-mono); font-size: 0.72rem; }

  @media (max-width: 560px) {
    .hx-levlist li { grid-template-columns: 1fr 56px; }
    .hx-lev-bar, .hx-lev-e { display: none; }
  }

  .hx-counts {
    display: flex; flex-wrap: wrap; gap: 16px; padding: 10px 16px;
    border-top: 1px solid var(--color-border); background: var(--color-canvas-subtle);
    font-size: 0.77rem; color: var(--color-gray);
  }
  .hx-legend-note { flex-basis: 100%; color: var(--color-gray-light); font-style: italic; }
  #hx-glossary { margin: 0 0 10px; }
  .hx-cut-what code { font-family: var(--font-mono); font-size: 0.85em; }

  .hx-legend {
    display: flex; flex-wrap: wrap; gap: 14px; margin: 0 0 8px;
    font-size: 0.75rem; color: var(--color-gray);
  }

  .hx-cutbox { border: 1px solid var(--color-border); border-radius: 10px; }
  .hx-cutsum {
    display: flex; align-items: center; gap: 9px; padding: 12px 16px; cursor: pointer;
    list-style: none; font-size: 0.9rem; font-weight: 600;
  }
  .hx-cutsum::-webkit-details-marker { display: none; }
  .hx-cutsum::before { content: '▸'; font-size: 0.7rem; color: var(--color-gray-light); }
  .hx-cutbox[open] .hx-cutsum { border-bottom: 1px solid var(--color-border); }
  .hx-cutbox[open] .hx-cutsum::before { content: '▾'; }

  /* Two columns of short entries rather than one column of tall wrapped ones. */
  .hx-cutlist {
    list-style: none; margin: 0; padding: 12px 16px; font-size: 0.82rem;
    display: grid; gap: 10px 26px;
    grid-template-columns: repeat(auto-fill, minmax(min(420px, 100%), 1fr));
  }
  .hx-cutlist li { padding: 0 0 9px; border-bottom: 1px solid var(--color-border); }
  .hx-cut-what { display: block; font-weight: 600; }
  .hx-cut-why { display: block; margin-top: 2px; color: var(--color-gray); line-height: 1.5; }

  /* Tighter leverage rows: sixteen families should not need half a screen. */
  .hx-levlist li { font-size: 0.77rem; }

  @media (max-width: 900px) {
    .hx-wide { width: 100%; margin-left: 0; }
    .hx-body { grid-template-columns: 1fr; }
    .hx-panel { position: static; max-height: none; border-left: 0; border-top: 1px solid var(--color-border); }
  }
</style>

Health advice arrives as a flat list. Eat oily fish. Take magnesium. Lift weights. Get morning light. Every item looks the same size on the page, and that flatness hides the three things that decide whether any of it is worth doing.

**Which endpoint actually moved?** "Good for you" is not a measurement. A trial measures something specific — serum testosterone in nmol/L, hs-CRP in mg/L, sleep onset in minutes, LDL in mmol/L — and a claim is only as good as the endpoint behind it. Some popular supplements move a subjective questionnaire and nothing else. That is not nothing, but it is not what most people think they are buying.

**How strong is the evidence?** A pooled analysis of thirty randomised trials and one cross-sectional survey both produce a percentage. Printed side by side at the same indent, they look equally true.

**Are two claims really one lever?** Advice stacks badly. If three things all work by lowering the same biomarker, doing all three does not give you three times the benefit — but a list can't show you that, so people add up effects that overlap.

So nothing here points at a goal directly. A behavior points at something measurable, and that marker belongs to a goal:

```
Behavior  →  Marker (biomarker / mechanism)  →  Goal
```

The middle layer is what makes the other two problems visible. Where several behaviors land on the same marker, you can see them converge and know they don't add. Effect sizes are compared only inside a marker, where the units match — comparing a mortality percentage to a hormone percentage is meaningless, so the tool never offers it. Nothing is summed anywhere. Click any row for the study: the result sentence quoted verbatim, the population it was measured in, what the finding is conditional on, and the paper's own figures.

<div class="hx-wide">

<div class="hx-legend">
  <span><span class="hx-use hx-use-S">S</span><span class="hx-use hx-use-A">A</span><span class="hx-use hx-use-B">B</span><span class="hx-use hx-use-C">C</span><span class="hx-use hx-use-D">D</span><span class="hx-use hx-use-E">E</span> usefulness &mdash; hover any badge for the arithmetic</span>
  <span><span class="hx-use hx-use-NULL">&ndash;</span> not ranked: studied, no effect found</span>
  <span class="hx-legend-note">Usefulness is derived, not measured: evidence strength, plus where the effect ranks <em>among rows on the same marker</em>, minus penalties for conditional findings, open quote flags and author conflicts. The two inputs stay on the row so you can overrule it.</span>
</div>

<div class="hx-legend">
  <span><span class="hx-tier hx-tier-A">META-RCT</span> meta-analysis of randomised trials</span>
  <span><span class="hx-tier hx-tier-B">RCT</span> single randomised trial</span>
  <span><span class="hx-tier hx-tier-C">COHORT</span> prospective cohort</span>
  <span><span class="hx-tier hx-tier-D">CROSS-SEC</span> cross-sectional / animal / mechanistic</span>
  <span><span class="hx-cross">&times;N</span> also moves markers under N goals</span>
  <span><span class="hx-cond">only:</span> the finding is conditional</span>
  <span><span class="hx-warn">quote incomplete</span> a stated figure is missing from the quoted sentence</span>
  <span><span class="hx-warn">check quote</span> the quoted sentence is not a clean verbatim copy</span>
  <span><span class="hx-warn">conflict of interest</span> an author is employed by a party with a stake in the result</span>
  <span><span class="hx-tier hx-tier-C hx-tier-fixed">COHORT*</span> evidence tag corrected on independent review</span>
</div>

<div class="hx-legend">
  <span><span class="hx-dir hx-dir-good">+</span> good: the study found a welcome effect</span>
  <span><span class="hx-dir hx-dir-bad">&minus;</span> bad: it found an unwelcome one</span>
  <span><span class="hx-dir hx-dir-unclear">?</span> this marker has no inherently good or bad direction</span>
  <span><span class="hx-dir hx-dir-none">=</span> studied, and no effect was found</span>
  <span class="hx-legend-note">The sign is the verdict, not the arithmetic. Aerobic exercise <em>lowers</em> blood pressure and that is a green plus, because lower is the good direction here. Which way the number actually moved is on the row next to it, and spelled out when you open the study. Four markers stay purple &mdash; a melatonin phase shift or a cortisol slope is not good or bad on its own &mdash; and <strong>=</strong> never means "unknown": those rows were measured and came back null.</span>
</div>

<div id="hx-glossary"></div>

<div class="hx-explorer" id="hx-explorer">
  <div class="hx-modebar">
    <button class="hx-mode is-active" data-mode="goal">By goal &mdash; what moves this?</button>
    <button class="hx-mode" data-mode="behavior">By behavior &mdash; what does this do?</button>
  </div>
  <div class="hx-toolbar">
    <input id="hx-filter" class="hx-filter" type="search" placeholder="Filter goals, markers, behaviors…" autocomplete="off">
    <button class="hx-toggle" data-open="true">Expand all</button>
    <button class="hx-toggle" data-open="false">Collapse all</button>
  </div>
  <div class="hx-leverage" id="hx-leverage"></div>
  <div class="hx-body">
    <div class="hx-tree" id="hx-tree"></div>
    <aside class="hx-panel" id="hx-panel"></aside>
  </div>
  <div class="hx-counts" id="hx-counts"></div>
</div>

<h2>What got cut</h2>

<p class="hx-note">
A row marked <em>studied, no effect</em> means somebody ran the trial and the effect was not
there. An entry below means no usable study was found at all. Evidence of absence and
absence of evidence are different, and collapsing them is how "nobody has checked" becomes
"it's fine".
</p>

<div id="hx-cut"></div>

</div>

## Notes on method

Rows sort by the usefulness tier, which is a derived sort key rather than a measurement. It adds up evidence strength and where the effect ranks among rows on the same marker, then subtracts penalties for findings restricted to one population, rows with an open quote-integrity flag, and studies whose authors have a stake in the result. Hovering a badge shows that arithmetic for that row.

Two things keep it honest. The magnitude term is ranked only *within a marker*, because a hormone percentage and a mortality hazard ratio are not comparable quantities. And both inputs stay printed on the row, so a reader who weighs conditionality differently can ignore the tier and read the effect and the evidence tag directly. The tier is there to put the strongest rows first, not to tell you a number the studies never produced.

Where two behaviors land on the same marker, the tree shows them converging. That is the whole point of the middle layer: you can see that they do not add, without being told.

**Markers are not outcomes.** Moving serum testosterone inside the normal range is not the same as feeling better; lowering CRP is not the same as avoiding disease. The middle layer buys mechanistic clarity and pays for it with a surrogate-endpoint gap.

**Publication bias sits upstream of all of this.** A null result nobody published cannot appear here.

**Nothing was pooled.** Where trials disagree, the strongest single source is shown rather than a pooled estimate, and the disagreement is recorded in the row's caveats rather than averaged away.

**This describes literature, not what you should do.** Every row says what a study found in a specific population. If a row looks wrong, the quoted sentence and the DOI are right there — check it.

<script src="/js/health-evidence-explorer.js?v=22"></script>
