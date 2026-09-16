---
title: "Every Health Claim, Tied to the Marker It Moves"
subtitle: "316 rows across 14 goals, each carrying the paper it came from, the population it was measured in, and what the finding is conditional on."
authors:
  - "Michael Wan"
affiliations:
  - "Independent Analysis"
published: "2026-09-13"
thumbnail: "/img/health-evidence/thumbnail.svg"
abstract: "Health advice arrives as a flat list: eat this, take that, sleep more. A flat list hides the three things that decide whether a claim is worth acting on - which endpoint actually moved, how strong the evidence behind it is, and whether two pieces of advice are really the same lever pulled twice. This is that literature rebuilt as a graph: behavior to biomarker to goal, walkable from either end. Effect sizes are compared only within a marker, and only against rows reported on the same scale. Null results are recorded as findings. Nothing is ever summed, and every row carries the paper's own result sentence. The dataset behind it currently holds 316 rows across 14 goals, drawn from 225 papers, including 65 results that were measured and came back null."
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

  .hx-diagram { margin: 26px 0 30px; }
  .hx-diagram svg { width: 100%; height: auto; display: block; }
  .hx-diagram figcaption {
    margin-top: 12px; font-size: 0.85rem; line-height: 1.6; color: var(--color-gray);
  }
  .hxd-head text {
    font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    fill: var(--color-gray-light); text-anchor: middle;
  }
  .hxd-node rect { fill: var(--color-bg); stroke: var(--color-border); stroke-width: 1.5; }
  .hxd-node rect.hxd-goal { fill: var(--color-canvas-subtle); stroke: var(--color-gray); }
  .hxd-node text { font-size: 14px; font-weight: 600; fill: var(--color-text); }
  .hxd-node text.hxd-sub { font-size: 11.5px; font-weight: 400; fill: var(--color-gray-light); }
  .hxd-node text.hxd-val {
    font-family: var(--font-mono); font-size: 11px; font-weight: 400; fill: var(--color-gray);
  }
  .hxd-link path { fill: none; stroke: var(--color-border); stroke-width: 2; }
  .hxd-link path.hxd-null { stroke-dasharray: 5 5; }
  .hxd-mark circle.hxd-good { fill: #2da44e; }
  .hxd-mark circle.hxd-none { fill: #b9bfc6; }
  .hxd-mark circle.hxd-bad { fill: #e5534b; }
  .hxd-mark text {
    font-family: var(--font-mono); font-size: 12px; font-weight: 800;
    fill: #fff; text-anchor: middle;
  }
  .hxd-mark circle.hxd-none + text { fill: #1f2328; }
  text.hxd-note {
    font-size: 11.5px; font-style: italic; fill: var(--color-gray-light);
  }

  .hx-shell {
    display: flex; flex-direction: column;
    border: 1px solid var(--color-border); border-radius: 10px;
    background: var(--color-bg); margin: 26px 0 10px; overflow: hidden;
    max-height: calc(100vh - 48px);
  }
  .hx-shell-scroll {
    flex: 1 1 auto; min-height: 0; overflow: auto;
  }
  .hx-shell-head {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 16px;
    background: var(--color-canvas-subtle); border-bottom: 1px solid var(--color-border);
  }
  #hx-shell-title {
    font-family: var(--font-display); font-size: 1.2rem; font-weight: 700;
    letter-spacing: 0.01em; color: var(--color-text);
  }
  .hx-shell-head .hx-langs { flex-shrink: 0; }
  .hx-legend-body[hidden] { display: none; }
  /* Not hidden: an overflow value other than visible makes this element the scroll
     container for any sticky descendant, so the sticky head and section titles would
     anchor to a 50,000px-tall box that never scrolls instead of to .hx-shell-scroll,
     which is the thing the reader actually scrolls. The shell above already clips. */
  .hx-explorer { min-width: 0; }

  .hx-shell .hx-legendbox,
  .hx-shell #hx-glossary .hx-cutbox,
  .hx-shell .hx-leverage {
    border: 0; border-radius: 0; border-top: 1px solid var(--color-border);
  }
  .hx-legend-body { padding: 12px 16px 14px; }
  .hx-legend-body .hx-legend { margin-bottom: 10px; }
  .hx-legend-body .hx-legend:last-child { margin-bottom: 0; }
  #hx-glossary { margin: 0; }

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

  .hx-langs { display: inline-flex; border: 1px solid var(--color-border); border-radius: 6px; overflow: hidden; }
  .hx-lang {
    padding: 6px 11px; border: 0; background: var(--color-bg); cursor: pointer;
    font: inherit; font-size: 0.8rem; color: var(--color-gray);
  }
  .hx-lang + .hx-lang { border-left: 1px solid var(--color-border); }
  .hx-lang:hover { color: var(--color-text); }
  .hx-lang.is-active { background: var(--color-accent); color: #fff; font-weight: 600; }

  /* Quotes stay in the language the paper was written in, so the note explaining that
     only needs to appear when the surrounding interface is not English. */
  .hx-quotenote { margin: 0 0 6px; font-size: 0.78rem; color: var(--color-gray-light); }

  /* The tabs and the filter used to scroll away, so a reader deep in a long list had no
     way to switch view or search without scrolling back up. They stay put now, and so does
     the heading of whatever section is being read - the list is long enough that losing
     track of which group you are in is easy.

     Sticky offsets are measured rather than guessed: the head wraps onto two lines on a
     narrow screen, and a hard-coded top would hide a row behind it. JS writes the measured
     height into --hx-headh. */
  .hx-stickyhead {
    position: sticky; top: 0; z-index: 4;
    background: var(--color-bg);
  }
  .hx-group {
    position: sticky; top: var(--hx-headh, 96px); z-index: 3;
    background: var(--color-bg);
  }
  /* In goal mode nothing sits between the head and the goal rows; in behaviour mode the
     group heading does, so the row below it has to clear that too. */
  #hx-explorer[data-mode="goal"] .hx-goalbar { top: var(--hx-headh, 96px); }
  #hx-explorer[data-mode="behavior"] .hx-goalbar { top: calc(var(--hx-headh, 96px) + 30px); }
  .hx-goalbar {
    position: sticky; z-index: 2; background: var(--color-bg);
  }

  .hx-body { display: block; }
  .hx-tree { padding: 6px 16px 20px; min-width: 0; }

  /* The study detail was a permanent 380px sidebar. It cost that width even when nothing
     was selected, and squeezed forest plots down to something unreadable. A native
     <dialog> gives the tree the full container and the study a real canvas, and brings
     Escape, backdrop dismissal and focus trapping with it. */
  .hx-modal {
    width: min(760px, calc(100vw - 32px)); max-height: 88vh; padding: 0;
    border: 1px solid var(--color-border); border-radius: 12px;
    background: var(--color-bg); color: var(--color-text);
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
  }
  .hx-modal::backdrop { background: rgba(0, 0, 0, 0.45); }
  .hx-modal .hx-panel {
    padding: 22px 26px 26px; font-size: 0.92rem; line-height: 1.6;
    max-height: 88vh; overflow-y: auto;
  }
  .hx-close {
    position: absolute; top: 8px; right: 10px; z-index: 1;
    width: 30px; height: 30px; border: 0; border-radius: 50%;
    background: var(--color-canvas-subtle); color: var(--color-gray);
    font-size: 1.15rem; line-height: 1; cursor: pointer;
  }
  .hx-close:hover { color: var(--color-text); }

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
    display: grid; gap: 14px 22px;
    grid-template-columns: repeat(auto-fill, minmax(min(560px, 100%), 1fr));
    align-items: start;
  }
  .hx-branch {
    margin: 0; border: 1px solid var(--color-border); border-radius: 9px;
    background: var(--color-bg); overflow: hidden;
  }
  .hx-marker {
    display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px;
    padding: 10px 13px; background: var(--color-canvas-subtle);
    border-bottom: 1px solid var(--color-border);
  }
  .hx-marker-name { font-weight: 600; font-size: 1rem; }
  .hx-unit { font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-gray-light); }
  .hx-count {
    font-family: var(--font-mono); font-size: 0.68rem; color: var(--color-gray-light);
    border: 1px solid var(--color-border); border-radius: 8px; padding: 0 5px;
  }

  .hx-leaves { padding: 0; }
  .hx-leaves > li + li .hx-leaf { border-top: 1px solid var(--color-border); }
  .hx-leaf {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px; width: 100%;
    padding: 9px 13px; border: 0; background: transparent; cursor: pointer;
    text-align: left; font: inherit; font-size: 0.95rem; color: var(--color-text);
  }
  .hx-leaf:hover { background: var(--color-neutral-muted); }
  .hx-leaf.is-selected { background: var(--color-blue-bg); }
  .hx-leaf-name { font-weight: 600; margin-right: auto; }

  /* Direction, not verdict: a green plus means the marker went up, which on a row like
     smoking and all-cause mortality is the harm. The legend states this explicitly. */
  .hx-dir {
    display: inline-flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
    font-family: var(--font-mono); font-size: 0.88rem; font-weight: 800; line-height: 1;
    color: #fff; box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.18);
  }
  .hx-dir-good { background: #2da44e; }
  .hx-dir-bad { background: #e5534b; }
  .hx-dir-unclear { background: #8250df; }
  .hx-dir-none { background: #b9bfc6; color: #1f2328; box-shadow: none; }

  .hx-effect { font-family: var(--font-mono); font-size: 0.83rem; color: var(--color-text); }
  .hx-effect-null { font-style: italic; font-family: var(--font-body); }

  .hx-tier {
    font-family: var(--font-mono); font-size: 0.69rem; font-weight: 700;
    letter-spacing: 0.02em; padding: 2px 6px; border-radius: 3px; white-space: nowrap;
  }

  /* Usefulness tier. A derived sort key, so it is the boldest thing on the row - but the
     effect size and the evidence tag sit right beside it and remain the real content. */
  .hx-use {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 23px; height: 21px; padding: 0 6px; border-radius: 4px;
    font-family: var(--font-mono); font-size: 0.8rem; font-weight: 800;
    color: #fff; flex-shrink: 0;
  }
  /* Distribution of the usefulness tiers. Horizontal bars, because seven labelled
     categories read better down the side than squeezed under an x-axis, and because the
     counts run from 10 to 96 - a long bar next to a short one is the whole point. */
  .hx-tierchart { display: flex; flex-direction: column; gap: 3px; margin: 2px 0 0; }
  .hx-tierrow {
    display: grid; grid-template-columns: 30px 1fr 44px; align-items: center; gap: 9px;
    width: 100%; padding: 3px 4px; background: none; border: 0; border-radius: 4px;
    cursor: pointer; font: inherit; text-align: left;
  }
  .hx-tierrow:hover { background: var(--color-canvas-subtle); }
  .hx-tierrow.is-open { background: var(--color-canvas-subtle); }
  .hx-tierrow:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 1px; }
  .hx-tierbar { height: 17px; border-radius: 3px; min-width: 2px; transition: opacity 0.12s; }
  .hx-tierrow:hover .hx-tierbar { opacity: 0.82; }
  .hx-tiern { font-size: 0.78rem; color: var(--color-gray); text-align: right; font-variant-numeric: tabular-nums; }
  .hx-tierlist {
    margin: 2px 0 6px; padding: 0; list-style: none;
    max-height: 340px; overflow-y: auto;
    border-left: 2px solid var(--color-border); padding-left: 8px;
  }
  .hx-tierlist .hx-leaf { width: 100%; }
  .hx-tiernote { margin: 8px 0 0; font-size: 0.78rem; color: var(--color-gray); line-height: 1.5; }
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

  .hx-n {
    font-family: var(--font-mono); font-size: 0.72rem; color: var(--color-gray);
    border: 1px solid var(--color-border); border-radius: 3px; padding: 1px 5px;
    white-space: nowrap;
  }
  .hx-n-unknown { color: var(--color-gray-light); border-style: dashed; }

  .hx-cross {
    font-size: 0.72rem; font-weight: 700; color: var(--color-purple);
    border: 1px solid var(--color-purple); border-radius: 3px; padding: 1px 5px;
  }
  .hx-cond { flex-basis: 100%; font-size: 0.83rem; line-height: 1.45; color: var(--color-orange); font-style: italic; }
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
    width: 100%; max-height: 62vh; object-fit: contain; height: auto; display: block; border: 1px solid var(--color-border);
    border-radius: 6px; background: #fff;
  }
  .hx-fig figcaption { margin-top: 5px; font-size: 0.74rem; line-height: 1.5; color: var(--color-gray); }
  .hx-fig figcaption strong { color: var(--color-text); }
  .hx-figcap { display: block; margin-top: 3px; color: var(--color-gray-light); }

  .hx-warn {
    font-size: 0.72rem; font-weight: 700; color: var(--color-orange);
    background: var(--color-orange-bg); border-radius: 3px; padding: 2px 6px;
  }
  /* Not a warning. A quote taken from the full text is ordinary; this only tells the
     reader the free abstract will not settle it, so it stays grey. */
  /* An evidence gap, not a measured null. Distinct from the grey "=" so the page
     never claims a thing was tested when nobody has tested it. */
  .hx-dir-gap { color: var(--color-purple); }
  /* The source wording, kept under its translation. Small and set back, because it is
     there for a reader checking a figure against the paper, not for reading twice. */
  .hx-orig {
    display: block; margin-top: 4px; font-size: 0.82em; color: var(--color-gray);
    border-left: 2px solid var(--color-border); padding-left: 8px;
  }
  .hx-srcflag {
    font-size: 0.72rem; font-weight: 600; color: var(--color-gray);
    background: var(--color-surface); border-radius: 3px; padding: 2px 6px;
  }
  .hx-warn-hot { color: #fff; background: var(--color-red); }
  .hx-warnbox-hot { border-left-color: var(--color-red); }

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

  .hx-leverage .hx-cutbox { border: 0; border-radius: 0; }
  .hx-lev-top {
    font-size: 0.78rem; font-weight: 400; color: var(--color-gray); margin-right: auto;
  }
  .hx-lev-head {
    font-size: 0.67rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--color-gray-light); margin-bottom: 7px;
  }
  .hx-scatterwrap { padding: 6px 16px 14px; }
  .hx-axisbar {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px 18px;
    padding: 4px 0 10px; font-size: 0.79rem; color: var(--color-gray);
  }
  .hx-axisbar label { display: inline-flex; align-items: center; gap: 6px; }
  .hx-axisbar select {
    font: inherit; font-size: 0.79rem; padding: 3px 6px; color: var(--color-text);
    background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 5px;
    max-width: 240px;
  }
  .hx-axisrange input[type="range"] { width: 92px; accent-color: var(--color-accent); }
  .hx-axisn { font-family: var(--font-mono); font-size: 0.75rem; min-width: 32px; }
  .hx-zoomreset { padding: 4px 10px; font-size: 0.75rem; }
  .hx-zoomreset[disabled] { opacity: 0.4; cursor: default; }
  .hx-scatter .hx-offscale { font-size: 10px; fill: var(--color-gray-light); text-anchor: end; }
  .hx-scatter { width: 100%; height: auto; display: block; }
  .hx-scatter .hx-ax { stroke: var(--color-border); stroke-width: 1; }
  .hx-scatter .hx-tick {
    font-family: var(--font-mono); font-size: 10px; fill: var(--color-gray-light);
    text-anchor: middle;
  }
  .hx-scatter .hx-anchor-end { text-anchor: end; }
  .hx-scatter .hx-axlabel {
    font-size: 11px; fill: var(--color-gray); text-anchor: middle;
  }
  .hx-scatter .hx-pt { opacity: 0.88; }
  .hx-scatter .hx-pt-good { fill: #2da44e; }
  .hx-scatter .hx-pt-bad { fill: #e5534b; }
  .hx-scatter .hx-pt-flat { fill: #8b949e; }
  .hx-scatter .hx-quad { opacity: 0.45; }
  .hx-scatter .hx-quad-good { fill: var(--color-green-bg); }
  .hx-scatter .hx-quad-bad { fill: var(--color-red-light); opacity: 0.09; }
  .hx-scatter .hx-gridline { stroke: var(--color-border); stroke-width: 1; opacity: 0.5; }
  .hx-scatter .hx-quadlabel {
    font-size: 10px; letter-spacing: 0.04em; text-transform: uppercase;
    fill: var(--color-gray-light); text-anchor: end;
  }
  .hx-scatter .hx-anchor-start { text-anchor: start; }

  .hx-scatter .hx-leader { fill: none; stroke: var(--color-border); stroke-width: 1; opacity: 0.7; }
  .hx-scatter .hx-gutlabel { font-size: 11px; fill: var(--color-text); }

  .hx-scatter .hx-ptlabel {
    font-size: 10px; fill: var(--color-text); paint-order: stroke;
    stroke: var(--color-bg); stroke-width: 3px; stroke-linejoin: round;
  }
  .hx-jump {
    display: flex; flex-wrap: wrap; align-items: center; gap: 7px;
    margin: 16px 0 0; padding-top: 13px; border-top: 1px solid var(--color-border);
  }
  .hx-jump-label {
    font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em;
    color: var(--color-gray-light); flex-basis: 100%;
  }
  .hx-jumpbtn {
    padding: 5px 11px; border: 1px solid var(--color-border); border-radius: 14px;
    background: var(--color-bg); color: var(--color-accent); cursor: pointer;
    font: inherit; font-size: 0.8rem;
  }
  .hx-jumpbtn:hover { background: var(--color-blue-bg); border-color: var(--color-accent); }

  .hx-scatternote {
    margin: 4px 0 0; font-size: 0.8rem; line-height: 1.55; color: var(--color-gray);
  }
  .hx-leverage .hx-cutbox { border: 0; border-radius: 0; }
  .hx-lev-top {
    font-size: 0.78rem; font-weight: 400; color: var(--color-gray); margin-right: auto;
  }

  .hx-counts {
    display: flex; flex-wrap: wrap; gap: 16px; padding: 10px 16px;
    border-top: 1px solid var(--color-border); background: var(--color-canvas-subtle);
    font-size: 0.77rem; color: var(--color-gray);
    flex: 0 0 auto; order: 100;
  }
  .hx-legend-note { flex-basis: 100%; color: var(--color-gray-light); font-style: italic; }
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
  .hx-cutrule {
    margin: 4px 0 12px; padding: 9px 12px; font-size: 0.82rem; line-height: 1.6;
    color: var(--color-gray); background: var(--color-canvas-subtle);
    border-left: 3px solid var(--color-border); border-radius: 0 4px 4px 0;
  }
  .hx-cut-what { display: block; font-weight: 600; }
  .hx-cut-why { display: block; margin-top: 2px; color: var(--color-gray); line-height: 1.5; }

  /* Tighter leverage rows: sixteen families should not need half a screen. */
  .hx-levlist li { font-size: 0.77rem; }

  @media (max-width: 900px) {
    .hx-wide { width: 100%; margin-left: 0; }
    .hx-modal { width: calc(100vw - 20px); max-height: 92vh; }
    .hx-modal .hx-panel { padding: 20px 18px 22px; max-height: 92vh; }
  }
</style>

Health advice arrives as a flat list. Eat oily fish. Take magnesium. Lift weights. Get morning light. Every item looks the same size on the page, and that flatness hides the three things that decide whether any of it is worth doing.

**Which endpoint actually moved?** "Good for you" is not a measurement. A trial measures something specific — serum testosterone in nmol/L, hs-CRP in mg/L, sleep onset in minutes, LDL in mmol/L — and a claim is only as good as the endpoint behind it. Some popular supplements move a subjective questionnaire and nothing else. That is not nothing, but it is not what most people think they are buying.

**How strong is the evidence?** A pooled analysis of thirty randomised trials and one cross-sectional survey both produce a percentage. Printed side by side at the same indent, they look equally true.

**Are two claims really one lever?** Advice stacks badly. If three things all work by lowering the same biomarker, doing all three does not give you three times the benefit — but a list can't show you that, so people add up effects that overlap.

So nothing here points at a goal directly. A behavior points at something measurable, and that marker belongs to a goal:

<figure class="hx-diagram">
<svg viewBox="0 0 764 400" role="img" aria-labelledby="hxdTitle hxdDesc" xmlns="http://www.w3.org/2000/svg">
<title id="hxdTitle">One behaviour, sleep loss, and the six different goals it reaches through six different markers</title>
<desc id="hxdDesc">Sleep restriction lowers serum testosterone, raises CRP and IL-6, increases lapses in
sustained attention, raises anxiety scores, and is associated with higher all-cause mortality. Its effect on
depressive symptoms was measured and came back mixed. Each of those is a different marker under a different
goal, which is why advice about sleep cannot be compared with advice about any single one of them.</desc>
<g class="hxd-head"><text x="96" y="20">BEHAVIOUR</text><text x="375" y="20">MARKER</text><text x="654" y="20">GOAL</text></g>
<g class="hxd-link">
<path d="M180 206 C 214 206, 216 56, 250 56"/>
<path d="M180 206 C 214 206, 216 116, 250 116"/>
<path d="M180 206 C 214 206, 216 176, 250 176"/>
<path d="M180 206 C 214 206, 216 236, 250 236"/>
<path d="M180 206 C 214 206, 216 296, 250 296" class="hxd-null"/>
<path d="M180 206 C 214 206, 216 356, 250 356"/>
<path d="M500 56 C 530 56, 532 56, 560 56"/>
<path d="M500 116 C 530 116, 532 116, 560 116"/>
<path d="M500 176 C 530 176, 532 176, 560 176"/>
<path d="M500 236 C 530 236, 532 266, 560 266"/>
<path d="M500 296 C 530 296, 532 266, 560 266" class="hxd-null"/>
<path d="M500 356 C 530 356, 532 356, 560 356"/>
</g>
<g class="hxd-node">
<rect x="12" y="178" width="168" height="56" rx="8"/><text x="26" y="203">Sleep loss</text><text x="26" y="221" class="hxd-sub">restriction or deprivation</text>
<rect x="250" y="36" width="250" height="40" rx="8"/><text x="264" y="61">Serum testosterone</text>
<rect x="250" y="96" width="250" height="40" rx="8"/><text x="264" y="121">hs-CRP and IL-6</text>
<rect x="250" y="156" width="250" height="40" rx="8"/><text x="264" y="181">Lapses in sustained attention</text>
<rect x="250" y="216" width="250" height="40" rx="8"/><text x="264" y="241">Anxiety score</text>
<rect x="250" y="276" width="250" height="40" rx="8"/><text x="264" y="301">Depressive symptoms</text>
<rect x="250" y="336" width="250" height="40" rx="8"/><text x="264" y="361">All-cause mortality</text>
<rect x="560" y="36" width="192" height="40" rx="8" class="hxd-goal"/><text x="574" y="61">Male vitality</text>
<rect x="560" y="96" width="192" height="40" rx="8" class="hxd-goal"/><text x="574" y="121">Inflammation and skin</text>
<rect x="560" y="156" width="192" height="40" rx="8" class="hxd-goal"/><text x="574" y="181">Cognition and focus</text>
<rect x="560" y="236" width="192" height="60" rx="8" class="hxd-goal"/><text x="574" y="271">Mood and anxiety</text>
<rect x="560" y="336" width="192" height="40" rx="8" class="hxd-goal"/><text x="574" y="361">Longevity</text>
</g>
<g class="hxd-mark">
<circle cx="232" cy="53" r="10" class="hxd-bad"/><text x="232" y="57">&minus;</text>
<circle cx="232" cy="113" r="10" class="hxd-bad"/><text x="232" y="117">&minus;</text>
<circle cx="232" cy="173" r="10" class="hxd-bad"/><text x="232" y="177">&minus;</text>
<circle cx="232" cy="233" r="10" class="hxd-bad"/><text x="232" y="237">&minus;</text>
<circle cx="232" cy="293" r="10" class="hxd-none"/><text x="232" y="297">=</text>
<circle cx="232" cy="353" r="10" class="hxd-bad"/><text x="232" y="357">&minus;</text>
</g>
<text class="hxd-note" x="250" y="330">measured, and the findings came back mixed</text>
</svg>
<figcaption>One behaviour, six goals, six different markers &mdash; and the sixth was tested and came back
mixed, which is a result rather than a gap. This is why the middle layer exists: without it, "sleep more"
sits in a list next to "take magnesium" at the same indent, and nothing on the page can tell you that one of
them reaches six goals and the other reaches one.</figcaption>
</figure>

The middle layer is what makes the other two problems visible. Where several behaviors land on the same marker, you can see them converge and know they don't add. Effect sizes are compared only inside a marker AND only against rows reported the same way. Inside a marker is not enough on its own: LDL arrives in this corpus as both mmol/L and mg/dL, and ranking 18.73 of one against 0.33 of the other put two similar findings 57-fold apart. Convertible units are converted; a standardised mean difference and an odds ratio are not convertible and are never ranked against each other. Where that leaves a row with nothing comparable, it scores the neutral middle rather than a rank it has not earned. Nothing is summed anywhere. Click any row for the study: the result sentence quoted verbatim, the population it was measured in, what the finding is conditional on, and the paper's own figures.

<div class="hx-wide">

<div class="hx-shell">
<div class="hx-shell-head">
  <span id="hx-shell-title">Health Explorer</span>
  <span class="hx-langs">
    <button class="hx-lang is-active" data-lang="en">EN</button>
    <button class="hx-lang" data-lang="zh-TW">中文</button>
  </span>
</div>

<div class="hx-shell-scroll">
<div class="hx-explorer" id="hx-explorer">
  <div class="hx-stickyhead" id="hx-stickyhead">
  <div class="hx-modebar">
    <button class="hx-mode is-active" data-mode="goal">By goal &mdash; what moves this?</button>
    <button class="hx-mode" data-mode="behavior">By behavior &mdash; what does this do?</button>
  </div>
  <div class="hx-toolbar">
    <input id="hx-filter" class="hx-filter" type="search" placeholder="Filter goals, markers, behaviors…" autocomplete="off">
    <button class="hx-toggle" data-open="true">Expand all</button>
    <button class="hx-toggle" data-open="false">Collapse all</button>
  </div>
  </div>
  <div class="hx-body">
    <div class="hx-tree" id="hx-tree"></div>
  </div>
</div>

<details class="hx-cutbox hx-legendbox" open>
  <summary class="hx-cutsum">
    <span class="hx-cutsum-label" id="hx-legend-label">Legend</span>
  </summary>
  <div class="hx-legend-body" data-lang="en">
    <div class="hx-legend">
      <span><span class="hx-use hx-use-S">S</span><span class="hx-use hx-use-A">A</span><span class="hx-use hx-use-B">B</span><span class="hx-use hx-use-C">C</span><span class="hx-use hx-use-D">D</span><span class="hx-use hx-use-E">E</span> usefulness &mdash; hover any badge for the arithmetic</span>
      <span><span class="hx-use hx-use-NULL">&ndash;</span> not ranked: studied, no effect found</span>
      <span class="hx-legend-note">Usefulness is derived, not measured: evidence strength, plus where the effect ranks <em>among rows on the same marker</em> (pulled toward the middle where that marker has too few rows to rank fairly), plus how many people it was measured in, minus penalties for open quote flags and author conflicts. The two inputs stay on the row so you can overrule it.</span>
    </div>
    <div class="hx-legend">
      <span><span class="hx-tier hx-tier-A">META-RCT</span> meta-analysis of randomised trials</span>
      <span><span class="hx-tier hx-tier-B">RCT</span> single randomised trial</span>
      <span><span class="hx-tier hx-tier-C">COHORT</span> prospective cohort</span>
      <span><span class="hx-tier hx-tier-D">CROSS-SEC</span> cross-sectional / animal / mechanistic</span>
      <span><span class="hx-n">n=421</span> participants in the study; <span class="hx-n">k=24</span> pooled studies; <span class="hx-n hx-n-unknown">n=?</span> not recorded</span>
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
  </div>
  <div class="hx-legend-body" data-lang="zh-TW" hidden>
    <div class="hx-legend">
      <span><span class="hx-use hx-use-S">S</span><span class="hx-use hx-use-A">A</span><span class="hx-use hx-use-B">B</span><span class="hx-use hx-use-C">C</span><span class="hx-use hx-use-D">D</span><span class="hx-use hx-use-E">E</span> 實用度 — 游標停在任一徽章上可看計算方式</span>
      <span><span class="hx-use hx-use-NULL">&ndash;</span> 不參與排名：研究過，未發現效果</span>
      <span class="hx-legend-note">實用度是推導出來的，不是測量值：證據強度，加上效應量在<em>同一指標各列</em>中的排名、再加上樣本規模，（該指標列數太少、不足以公平排名時會向中間收斂），再扣掉未結案的引句標記與作者利益衝突。這兩項輸入仍印在列上，所以你可以不採納這個排序。</span>
    </div>
    <div class="hx-legend">
      <span><span class="hx-tier hx-tier-A">META-RCT</span> 隨機對照試驗的統合分析</span>
      <span><span class="hx-tier hx-tier-B">RCT</span> 單一樣本充足的隨機對照試驗</span>
      <span><span class="hx-tier hx-tier-C">COHORT</span> 前瞻性世代研究</span>
      <span><span class="hx-tier hx-tier-D">CROSS-SEC</span> 橫斷面、動物或機轉推論</span>
      <span><span class="hx-cond">僅限：</span> 該發現有適用條件</span>
      <span><span class="hx-warn">引句不完整</span> 所列數字未出現在引句中</span>
      <span><span class="hx-warn">核對引句</span> 引句不是完整的逐字抄錄</span>
      <span><span class="hx-warn">利益衝突</span> 作者受僱於與此結果有利害關係的一方</span>
      <span><span class="hx-tier hx-tier-C hx-tier-fixed">COHORT*</span> 經獨立審核後更正的證據標籤</span>
    </div>
    <div class="hx-legend">
      <span><span class="hx-dir hx-dir-good">+</span> 有利：研究發現了受歡迎的效果</span>
      <span><span class="hx-dir hx-dir-bad">&minus;</span> 不利：發現了不受歡迎的效果</span>
      <span><span class="hx-dir hx-dir-unclear">?</span> 此指標本身沒有好壞方向</span>
      <span><span class="hx-dir hx-dir-none">=</span> 研究過，未發現效果</span>
      <span class="hx-legend-note">正負號是判斷，不是算術。有氧運動使血壓下降，那是綠色加號，因為在這裡下降才是好的方向。數字實際往哪邊走，仍寫在列上，點開研究也會說明。有四個指標維持紫色——褪黑激素相位偏移或皮質醇斜率本身沒有好壞——而 <strong>=</strong> 絕不代表「未知」：那些列有測量，結果是無效。</span>
    </div>
  </div>
</details>

<div id="hx-glossary"></div>
<div class="hx-leverage" id="hx-leverage"></div>
<div class="hx-leverage" id="hx-tiers"></div>
</div>
<div class="hx-counts" id="hx-counts"></div>
</div>

<dialog class="hx-modal" id="hx-modal">
  <button class="hx-close" id="hx-close" aria-label="Close">&times;</button>
  <div class="hx-panel" id="hx-panel"></div>
</dialog>

<div class="hx-langbody" data-lang="en">
<h2>What got cut</h2>
<p class="hx-note">
A row marked <em>studied, no effect</em> means somebody ran the trial and the effect was not
there. An entry below means no usable study was found at all. Evidence of absence and
absence of evidence are different, and collapsing them is how "nobody has checked" becomes
"it's fine".
</p>
</div>
<div class="hx-langbody" data-lang="zh-TW" hidden>
<h2>未能收錄的候選條目</h2>
<p class="hx-note">
標示為<em>研究過，無效果</em>的條目，是指有人真的做過試驗而效果不存在。下面這份清單則是完全找不到可用研究。
「證據顯示沒有效果」和「根本沒有人研究過」是兩回事，把兩者混為一談，正是「沒有人查證過」被讀成
「那應該沒問題」的過程。
</p>
</div>

<div id="hx-cut"></div>

</div>

## Notes on method

Rows sort by the usefulness tier, which is a derived sort key rather than a measurement. It adds up evidence strength, where the effect ranks among rows on the same marker, and how many people the finding was measured in, then subtracts penalties for rows with an open quote-integrity flag and studies whose authors have a stake in the result. Hovering a badge shows that arithmetic for that row.

Four things keep it honest. The magnitude term is ranked only *within a marker*, and within one scale inside it. A hormone percentage and a mortality hazard ratio are not comparable quantities, and neither are 18.73 mg/dL and 0.33 mmol/L until one of them is converted. That ranking is also discounted where the marker has few rows to rank: being the larger of two studies is not a percentile, and it used to be worth the same two points as leading a field of fifteen. The sample-size term is centred on a thousand participants rather than on the middle of its own range, because the typical row here has about nine hundred — anchored anywhere else it would have been measuring "is this enormous" while pretending to measure "is this well powered". A paper that never states a participant count takes that same midpoint, since not knowing is not the same as being small. And both inputs stay printed on the row, so a reader who weighs conditionality differently can ignore the tier and read the effect and the evidence tag directly. The tier is there to put the strongest rows first, not to tell you a number the studies never produced.

Where two behaviors land on the same marker, the tree shows them converging. That is the whole point of the middle layer: you can see that they do not add, without being told.

**Markers are not outcomes.** Moving serum testosterone inside the normal range is not the same as feeling better; lowering CRP is not the same as avoiding disease. The middle layer buys mechanistic clarity and pays for it with a surrogate-endpoint gap.

**Publication bias sits upstream of all of this.** A null result nobody published cannot appear here.

**Nothing was pooled.** Where trials disagree, the strongest single source is shown rather than a pooled estimate, and the disagreement is recorded in the row's caveats rather than averaged away.

**This describes literature, not what you should do.** Every row says what a study found in a specific population. If a row looks wrong, the quoted sentence and the DOI are right there — check it.

<script src="/js/health-evidence-explorer.js?v=70"></script>
