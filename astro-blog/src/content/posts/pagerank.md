---
title: "PageRank: How Google Brought Order to the Web"
subtitle: "The recursive, link-based algorithm that turned hyperlinks into votes — and built the world's most powerful search engine."
authors:
  - "Sergey Brin"
  - "Lawrence Page"
affiliations:
  - "Stanford University"
published: "1998-01-29"
doi: "Stanford:1999-66"
doiUrl: "http://ilpubs.stanford.edu:8090/422/1/1999-66.pdf"
abstract: "PageRank measures a page's importance by counting not just how many pages link to it, but how important those linking pages are — a recursive definition solved by treating the web as a Markov chain and finding its stationary distribution via power iteration."
tags:
  - "explainer"
category: "ml"
thumbnail: "/img/pagerank/thumbnail.svg"
---

<p class="d-note">
  This article explains the landmark 1998 Stanford paper
  <a href="http://ilpubs.stanford.edu:8090/422/1/1999-66.pdf">The PageRank Citation Ranking: Bringing Order to the Web</a>
  by Sergey Brin and Lawrence Page, the algorithm at the heart of Google Search.
</p>

<style>
  .prk-callout {
    border-left: 3px solid; border-radius: 0 6px 6px 0;
    padding: 11px 14px; margin: 20px 0; font-size: 0.92rem; line-height: 1.55;
  }
  .prk-callout-tip  { border-color: #10b981; background: #f0fdf4; color: #065f46; }
  .prk-callout-warn { border-color: #f59e0b; background: #fffbeb; color: #92400e; }
  .prk-callout-note { border-color: #6366f1; background: #eef2ff; color: #3730a3; }
  .prk-badge { display: inline-block; font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
  .prk-badge-green  { background: #d1fae5; color: #065f46; }
  .prk-badge-yellow { background: #fef3c7; color: #92400e; }
  .prk-badge-red    { background: #fee2e2; color: #b91c1c; }
  .prk-iter { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin: 16px 0; }
  .prk-iter th { background: #f9fafb; padding: 7px 10px; text-align: right; font-weight: 700; font-size: 0.75rem; color: #374151; border-bottom: 2px solid #e5e7eb; }
  .prk-iter th:first-child { text-align: left; }
  .prk-iter td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; color: #374151; text-align: right; font-variant-numeric: tabular-nums; }
  .prk-iter td:first-child { text-align: left; font-weight: 700; }
  .prk-iter tr:last-child td { border-bottom: none; background: #f9fafb; }
  /* ── Figure system: one visual language for every diagram ── */
  .prk-fig-edge { stroke: #9ca3af; stroke-width: 1.6; fill: none; }
  .prk-fig-edge-faint { stroke: #d1d5db; stroke-width: 1.4; fill: none; }
  .prk-fig-edge-accent { stroke: #4f46e5; stroke-width: 2; fill: none; }
  .prk-fig-edge-bad { stroke: #d97706; stroke-width: 2; fill: none; }
  .prk-fig-node { fill: #ffffff; stroke: #6b7280; stroke-width: 1.6; }
  .prk-fig-node-bad { fill: #fffbeb; stroke: #d97706; stroke-width: 2; }
  .prk-fig-letter { font: 700 14px Inter,system-ui,sans-serif; fill: #111827; text-anchor: middle; }
  .prk-fig-letter-bad { fill: #b45309; }
  .prk-fig-value { font: 600 10.5px Inter,system-ui,sans-serif; fill: #6b7280; text-anchor: middle; font-variant-numeric: tabular-nums; }
  .prk-fig-label { font: 11px Inter,system-ui,sans-serif; fill: #6b7280; }
  .prk-fig-label-accent { font: 600 11px Inter,system-ui,sans-serif; fill: #4f46e5; }
  .prk-fig-label-bad { font: 600 11px Inter,system-ui,sans-serif; fill: #b45309; }
  .prk-arr { fill: #9ca3af; }
  .prk-arr-faint { fill: #d1d5db; }
  .prk-arr-accent { fill: #4f46e5; }
  .prk-arr-bad { fill: #d97706; }
  .prk-fig-bar { fill: #d1d5db; }
  .prk-trapbox { fill: #fffbeb; stroke: #f59e0b; stroke-width: 1.3; stroke-dasharray: 5 4; }
  [data-theme="dark"] .prk-fig-node { fill: #1f2937; stroke: #9ca3af; }
  [data-theme="dark"] .prk-fig-node-bad { fill: #422006; }
  [data-theme="dark"] .prk-fig-letter { fill: #f3f4f6; }
  [data-theme="dark"] .prk-fig-letter-bad { fill: #fbbf24; }
  [data-theme="dark"] .prk-fig-value { fill: #9ca3af; }
  [data-theme="dark"] .prk-fig-label { fill: #9ca3af; }
  [data-theme="dark"] .prk-fig-label-accent { fill: #a5b4fc; }
  [data-theme="dark"] .prk-fig-label-bad { fill: #fbbf24; }
  [data-theme="dark"] .prk-fig-edge-accent { stroke: #818cf8; }
  [data-theme="dark"] .prk-arr-accent { fill: #818cf8; }
  [data-theme="dark"] .prk-trapbox { fill: rgba(120, 53, 15, 0.25); }
</style>

Two mental images carry this entire article: **a link is a vote, and a random surfer casts those votes by wandering the web.** Every equation below is one of these two pictures written in matrix form. When the algebra gets dense, return to the surfer clicking links at random — the math is just bookkeeping for where they end up.

## Introduction

Before Google, search engines ranked pages by counting keywords. The more times a page
said "jaguar", the higher it ranked for that query. This was easy to game: stuff your page
with keywords and you could outrank pages that were genuinely more useful.

Brin and Page had a different idea. When a webpage links to another, it is implicitly
endorsing it. The editorial judgement of thousands of human authors is baked into the
link graph of the web — all you need is an algorithm to read it.

The intellectual precedent was academic citation analysis. Eugene Garfield, who invented
the journal impact factor in the 1950s, had long argued that citation counts measure
scholarly influence. A paper cited by many important papers is itself important. The same
logic applies to web pages: **a page linked to by important pages is itself important**.

This recursive definition is the core of PageRank.

## The Link as a Vote

Think of each hyperlink as a vote. When page $B$ links to page $A$, $B$ is casting a
vote for $A$. But not all votes are equal:

- A link from a widely-cited page carries more weight than a link from an obscure page.
- A page that links to many others distributes its vote across all of them, so each
  individual vote is worth less.

To make this concrete, here is the **running example** we will use for the whole
article — a tiny web of three pages and four links. $A$ links to $B$ and $C$; $B$ links
to $C$; $C$ links back to $A$. Every figure below is this same graph with at most one
link changed.

<figure class="d-figure">
<div class="d-figure-content">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 258" width="560" height="258" style="display:block;width:100%;height:auto;max-width:560px">
  <defs>
    <marker id="pk1-g" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0,0 0,7 7,3.5" class="prk-arr"/></marker>
    <marker id="pk1-i" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0,0 0,7 7,3.5" class="prk-arr-accent"/></marker>
  </defs>
  <!-- edges -->
  <line x1="143" y1="118" x2="313" y2="68" class="prk-fig-edge" marker-end="url(#pk1-g)"/>
  <line x1="143" y1="132" x2="313" y2="182" class="prk-fig-edge-accent" marker-end="url(#pk1-i)"/>
  <line x1="340" y1="87" x2="340" y2="160" class="prk-fig-edge-accent" marker-end="url(#pk1-i)"/>
  <path d="M 318 206 Q 200 262 133 148" class="prk-fig-edge" marker-end="url(#pk1-g)"/>
  <!-- edge labels: rank carried by each link -->
  <text x="222" y="82" text-anchor="middle" class="prk-fig-label">0.40 ÷ 2 = 0.20</text>
  <text x="204" y="168" text-anchor="middle" class="prk-fig-label-accent">0.40 ÷ 2 = 0.20</text>
  <text x="332" y="128" text-anchor="end" class="prk-fig-label-accent">0.20 ÷ 1 = 0.20</text>
  <text x="196" y="242" text-anchor="middle" class="prk-fig-label">0.40 ÷ 1 = 0.40</text>
  <!-- nodes -->
  <circle cx="118" cy="125" r="24" class="prk-fig-node"/>
  <text x="118" y="130" class="prk-fig-letter">A</text>
  <text x="86" y="129" text-anchor="end" class="prk-fig-value">r = 0.40</text>
  <circle cx="340" cy="60" r="24" class="prk-fig-node"/>
  <text x="340" y="65" class="prk-fig-letter">B</text>
  <text x="340" y="26" text-anchor="middle" class="prk-fig-value">r = 0.20</text>
  <circle cx="340" cy="190" r="24" class="prk-fig-node"/>
  <text x="340" y="195" class="prk-fig-letter">C</text>
  <!-- C's inbox -->
  <text x="390" y="178" class="prk-fig-label-accent">C's inbox:</text>
  <text x="390" y="194" class="prk-fig-label-accent">0.20 + 0.20</text>
  <text x="390" y="210" class="prk-fig-label-accent">= 0.40 = r</text>
</svg>
</div>
<figcaption class="d-figure-caption">
  The running example. Each page splits its rank evenly across its outgoing links —
  the label on each arrow is the rank that link carries. The two highlighted votes land in
  C's inbox and sum to its PageRank, 0.40. (These are the final converged values; by the
  end of the article you will be able to compute them yourself.)
</figcaption>
</figure>

More precisely: page $i$ distributes its PageRank equally among all $d\_i$ pages it
links to. Each outgoing link from page $i$ carries $r\_i / d\_i$ units of rank.

The PageRank of page $j$ is the sum of all the fractional votes it receives:

$$r\_j = \sum_{i \to j} \frac{r\_i}{d\_i}$$

where the sum is over all pages $i$ that have a directed link to $j$, and $d\_i$ is the
number of outgoing links from page $i$. In the figure: $C$ receives $0.40/2$ from $A$
(which splits between two links) and $0.20/1$ from $B$ (which has only one), so
$r\_C = 0.40$.

But notice the circularity. $C$'s rank depends on $A$'s — and $A$'s rank *is exactly
what $C$ sends back to it*. $r\_j$ depends on $r\_i$, which depends on other PageRanks,
including $r\_j$ itself. To solve this we need a different way of thinking.

## The Random Surfer Model

Here is the intuition that makes PageRank tractable. Imagine a **random surfer** who
browses the web by:

1. Starting on a random page.
2. At each step, clicking a uniformly random link on the current page.
3. Repeating forever.

After a very long time, the fraction of time the surfer spends on each page converges to
a stable probability distribution. **That distribution is PageRank.** Pages visited more
often are more important.

This reframes PageRank as a **stationary distribution** problem. The web graph is a
Markov chain — each page is a state, each link is a transition — and we want the
long-run visit frequency of each state.

## The Matrix Formulation

Let the web have $N$ pages. Define the **transition matrix** $\mathbf{M}$, an
$N \times N$ matrix where:

<div class="d-math-block">
$$M_{ij} = \begin{cases} \dfrac{1}{d_j} & \text{if page } j \text{ links to page } i \\ 0 & \text{otherwise} \end{cases}$$
</div>

Each column of $\mathbf{M}$ is a probability distribution: the surfer on page $j$
moves to one of its outgoing neighbours uniformly at random, so column $j$ distributes
$1/d\_j$ to each neighbour.

The PageRank vector $\mathbf{r}$ satisfies:

<div class="d-math-block">
$$\mathbf{r} = \mathbf{M}\,\mathbf{r}$$
</div>

This is an **eigenvector equation**. $\mathbf{r}$ is the eigenvector of $\mathbf{M}$
corresponding to eigenvalue 1 — the stationary distribution of the random walk.

### Power Iteration

Finding this eigenvector is simple: start from any distribution and repeatedly multiply
by $\mathbf{M}$. The iterations converge to the stationary distribution:

<div class="d-math-block">
$$\mathbf{r}^{(t+1)} = \mathbf{M}\,\mathbf{r}^{(t)}$$
</div>

Initialize $\mathbf{r}^{(0)} = \mathbf{1}/N$ (uniform). After enough iterations,
$\mathbf{r}^{(t)}$ stops changing. In practice, 50–100 iterations suffice for web-scale
graphs.

Read the update literally: **each page hands its current rank to its neighbours, split evenly, and every page's new rank is whatever landed in its inbox.** Do that repeatedly and the ranks settle.

#### One iteration, by hand

Take the running example: $A$ links to $B$ and $C$; $B$ links to $C$; $C$ links back to $A$. So $d\_A = 2$, $d\_B = 1$, $d\_C = 1$. Start everyone at $1/3 \approx 0.333$.

For the first step, each page ships its rank along its outlinks:

- $A$ sends $0.333 / 2 = 0.167$ to $B$, and $0.167$ to $C$.
- $B$ sends its full $0.333$ to $C$.
- $C$ sends its full $0.333$ to $A$.

Collect the inboxes: $A$ gets $0.333$ (from $C$); $B$ gets $0.167$ (from $A$); $C$ gets $0.167 + 0.333 = 0.500$ (from $A$ and $B$). That is $\mathbf{r}^{(1)}$. Repeat:

<table class="prk-iter">
  <thead>
    <tr><th>Iteration</th><th>$r\_A$</th><th>$r\_B$</th><th>$r\_C$</th></tr>
  </thead>
  <tbody>
    <tr><td>0</td><td>0.333</td><td>0.333</td><td>0.333</td></tr>
    <tr><td>1</td><td>0.333</td><td>0.167</td><td>0.500</td></tr>
    <tr><td>2</td><td>0.500</td><td>0.167</td><td>0.333</td></tr>
    <tr><td>3</td><td>0.333</td><td>0.250</td><td>0.417</td></tr>
    <tr><td>4</td><td>0.417</td><td>0.167</td><td>0.417</td></tr>
    <tr><td>→ ∞</td><td>0.400</td><td>0.200</td><td>0.400</td></tr>
  </tbody>
</table>

The early values overshoot and wobble, but the swing shrinks every pass and the vector settles at $[0.4, 0.2, 0.4]$ — **exactly the numbers drawn in the first figure**. $A$ and $C$ tie for the lead; $B$, whose only endorsement is half of $A$'s vote, is the clear loser at every step. That is PageRank: importance flows toward pages that sit on many well-fed paths.

But the naive $\mathbf{M}$ has two pathological problems that must be fixed first.

## Problems: Dead Ends and Spider Traps

### Dead Ends (Dangling Nodes)

A **dead end** is a page with no outgoing links. In matrix terms, the corresponding
column of $\mathbf{M}$ is all zeros — it doesn't define a probability distribution.

When the random surfer reaches a dead end, there is nowhere to go. In the power
iteration, rank "leaks out" of the system: the total sum $\sum\_j r\_j$ shrinks each
iteration and eventually collapses to zero.

Watch it happen in the running example. **Delete C's one outgoing link** and $C$
becomes a dead end. Rank still flows $A \to B \to C$, but nothing ever comes back out:

<figure class="d-figure">
<div class="d-figure-content">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 258" width="560" height="258" style="display:block;width:100%;height:auto;max-width:560px">
  <defs>
    <marker id="pk2-g" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0,0 0,7 7,3.5" class="prk-arr"/></marker>
  </defs>
  <!-- edges (C's outlink deleted) -->
  <line x1="143" y1="118" x2="313" y2="68" class="prk-fig-edge" marker-end="url(#pk2-g)"/>
  <line x1="143" y1="132" x2="313" y2="182" class="prk-fig-edge" marker-end="url(#pk2-g)"/>
  <line x1="340" y1="87" x2="340" y2="160" class="prk-fig-edge" marker-end="url(#pk2-g)"/>
  <!-- deleted link: ghost of C → A -->
  <path d="M 318 206 Q 200 262 133 148" class="prk-fig-edge-faint" stroke-dasharray="4 4"/>
  <text x="196" y="242" text-anchor="middle" class="prk-fig-label-bad">link deleted</text>
  <!-- dead-end T-bar -->
  <line x1="368" y1="190" x2="398" y2="190" class="prk-fig-edge-bad"/>
  <line x1="398" y1="177" x2="398" y2="203" class="prk-fig-edge-bad"/>
  <!-- nodes -->
  <circle cx="118" cy="125" r="24" class="prk-fig-node"/>
  <text x="118" y="130" class="prk-fig-letter">A</text>
  <circle cx="340" cy="60" r="24" class="prk-fig-node"/>
  <text x="340" y="65" class="prk-fig-letter">B</text>
  <circle cx="340" cy="190" r="24" class="prk-fig-node prk-fig-node-bad"/>
  <text x="340" y="195" class="prk-fig-letter prk-fig-letter-bad">C</text>
  <text x="340" y="232" class="prk-fig-value prk-fig-label-bad" text-anchor="middle">no outlinks</text>
  <!-- total-rank strip -->
  <text x="490" y="52" text-anchor="middle" class="prk-fig-label">total rank in system</text>
  <rect x="432" y="80" width="20" height="90" class="prk-fig-bar"/>
  <rect x="466" y="110" width="20" height="60" class="prk-fig-bar"/>
  <rect x="500" y="155" width="20" height="15" class="prk-fig-bar"/>
  <rect x="534" y="168" width="20" height="2" class="prk-fig-bar"/>
  <text x="442" y="74" text-anchor="middle" class="prk-fig-value">1.00</text>
  <text x="476" y="104" text-anchor="middle" class="prk-fig-value">0.67</text>
  <text x="510" y="149" text-anchor="middle" class="prk-fig-value">0.17</text>
  <text x="544" y="162" text-anchor="middle" class="prk-fig-value">0.00</text>
  <text x="442" y="186" text-anchor="middle" class="prk-fig-label">t=0</text>
  <text x="476" y="186" text-anchor="middle" class="prk-fig-label">t=1</text>
  <text x="510" y="186" text-anchor="middle" class="prk-fig-label">t=2</text>
  <text x="544" y="186" text-anchor="middle" class="prk-fig-label">t=3</text>
</svg>
</div>
<figcaption class="d-figure-caption">
  The running example with C's outlink deleted. C still receives rank but passes none on,
  so rank vanishes from the system each step. Running the power iteration by hand:
  the total falls 1.00 → 0.67 → 0.17 → 0.00 in just three steps.
</figcaption>
</figure>

### Spider Traps

A **spider trap** is a set of pages with links among themselves but no outgoing links
to the rest of the web. The random surfer who wanders in never escapes.

Unlike dead ends, rank doesn't disappear here — it accumulates. Over many iterations,
the pages inside the trap absorb all the PageRank in the graph, giving them
artificially inflated scores.

One link change again. Instead of deleting C's outlink, **redirect it to $B$**. Now
$B$ and $C$ link only to each other — a closed loop that rank can enter but never leave:

<figure class="d-figure">
<div class="d-figure-content">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 258" width="560" height="258" style="display:block;width:100%;height:auto;max-width:560px">
  <defs>
    <marker id="pk3-g" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0,0 0,7 7,3.5" class="prk-arr"/></marker>
    <marker id="pk3-b" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0,0 0,7 7,3.5" class="prk-arr-bad"/></marker>
  </defs>
  <!-- trap region (behind nodes) -->
  <rect x="298" y="18" width="120" height="216" rx="12" class="prk-trapbox"/>
  <text x="358" y="250" text-anchor="middle" class="prk-fig-label-bad">the trap: rank enters, never leaves</text>
  <!-- edges into the trap (gray) -->
  <line x1="143" y1="118" x2="313" y2="68" class="prk-fig-edge" marker-end="url(#pk3-g)"/>
  <line x1="143" y1="132" x2="313" y2="182" class="prk-fig-edge" marker-end="url(#pk3-g)"/>
  <!-- the loop: B → C and C → B (amber) -->
  <line x1="340" y1="87" x2="340" y2="160" class="prk-fig-edge-bad" marker-end="url(#pk3-b)"/>
  <path d="M 358 170 Q 392 125 361 82" class="prk-fig-edge-bad" marker-end="url(#pk3-b)"/>
  <text x="402" y="129" class="prk-fig-label-bad">redirected</text>
  <!-- ghost of old C → A link -->
  <path d="M 318 206 Q 200 262 133 148" class="prk-fig-edge-faint" stroke-dasharray="4 4"/>
  <!-- nodes -->
  <circle cx="118" cy="125" r="24" class="prk-fig-node"/>
  <text x="118" y="130" class="prk-fig-letter">A</text>
  <text x="86" y="129" text-anchor="end" class="prk-fig-value">r → 0</text>
  <circle cx="340" cy="60" r="24" class="prk-fig-node prk-fig-node-bad"/>
  <text x="340" y="65" class="prk-fig-letter prk-fig-letter-bad">B</text>
  <text x="340" y="34" text-anchor="middle" class="prk-fig-value">r → 0.50</text>
  <circle cx="340" cy="190" r="24" class="prk-fig-node prk-fig-node-bad"/>
  <text x="340" y="195" class="prk-fig-letter prk-fig-letter-bad">C</text>
  <text x="340" y="228" text-anchor="middle" class="prk-fig-value">r → 0.50</text>
</svg>
</div>
<figcaption class="d-figure-caption">
  The running example with C's link redirected from A to B. The pair {B, C} becomes a
  spider trap: A keeps feeding rank in, nothing flows back, and the iteration converges
  to A = 0, B = 0.50, C = 0.50. A is starved even though its page didn't change at all —
  its only endorsement came from inside the trap.
</figcaption>
</figure>

<div class="prk-callout prk-callout-warn">
  <strong>Two failure modes, one root cause.</strong> Dead ends leak rank out of the system; spider traps hoard it. Both happen because the raw link graph is not a well-behaved Markov chain — some states have no exit, others form closed rooms. Both share the same fix: give the surfer an escape route that does not depend on links. That fix is teleportation.
</div>

## The Google Matrix

Brin and Page added a **damping factor** $\beta$ (typically 0.85). With probability
$\beta$, the surfer follows a link as before. With probability $1 - \beta$, the surfer
ignores the current page entirely and **teleports** to a uniformly random page.

This models real user behaviour: people don't follow links forever — they open new
tabs, use bookmarks, type URLs directly.

<figure class="d-figure">
<div class="d-figure-content">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 258" width="560" height="258" style="display:block;width:100%;height:auto;max-width:560px">
  <defs>
    <marker id="pk4-f" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0,0 0,7 7,3.5" class="prk-arr-faint"/></marker>
    <marker id="pk4-i" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0,0 0,7 7,3.5" class="prk-arr-accent"/></marker>
  </defs>
  <!-- other pages' links, faint background -->
  <line x1="143" y1="118" x2="313" y2="68" class="prk-fig-edge-faint" marker-end="url(#pk4-f)"/>
  <line x1="143" y1="132" x2="313" y2="182" class="prk-fig-edge-faint" marker-end="url(#pk4-f)"/>
  <line x1="340" y1="87" x2="340" y2="160" class="prk-fig-edge-faint" marker-end="url(#pk4-f)"/>
  <!-- the surfer sits on C. Option 1: follow C's link (solid) -->
  <path d="M 318 206 Q 200 262 133 148" class="prk-fig-edge-accent" marker-end="url(#pk4-i)"/>
  <text x="186" y="246" text-anchor="middle" class="prk-fig-label-accent">β = 0.85: follow a link</text>
  <!-- Option 2: teleport (dashed) -->
  <path d="M 358 170 Q 392 125 361 82" class="prk-fig-edge-accent" stroke-dasharray="5 4" marker-end="url(#pk4-i)"/>
  <path d="M 326 211 C 312 238 368 238 354 211" class="prk-fig-edge-accent" stroke-dasharray="5 4" marker-end="url(#pk4-i)"/>
  <text x="402" y="129" class="prk-fig-label-accent">1 − β = 0.15:</text>
  <text x="402" y="145" class="prk-fig-label-accent">teleport to a</text>
  <text x="402" y="161" class="prk-fig-label-accent">random page</text>
  <!-- nodes -->
  <circle cx="118" cy="125" r="24" class="prk-fig-node"/>
  <text x="118" y="130" class="prk-fig-letter">A</text>
  <circle cx="340" cy="60" r="24" class="prk-fig-node"/>
  <text x="340" y="65" class="prk-fig-letter">B</text>
  <circle cx="340" cy="190" r="24" class="prk-fig-node"/>
  <text x="340" y="195" class="prk-fig-letter">C</text>
  <text x="288" y="170" class="prk-fig-value" text-anchor="middle">surfer is here</text>
</svg>
</div>
<figcaption class="d-figure-caption">
  The damped surfer's move, seen from page C. With probability β it follows one of C's
  links as before (solid). With probability 1 − β it teleports to a page chosen uniformly
  at random — any page, including B, A, or C itself (dashed). Teleportation is what
  rescues the surfer from dead ends and spider traps.
</figcaption>
</figure>

The resulting **Google Matrix** is:

<div class="d-math-block">
$$\mathbf{G} = \beta\,\mathbf{M} + (1-\beta)\,\frac{\mathbf{e}\mathbf{e}^T}{N}$$
</div>

where $\mathbf{e}$ is the all-ones vector, so $\mathbf{e}\mathbf{e}^T / N$ is a
matrix with every entry equal to $1/N$ — the uniform teleportation target.

The full per-node formula becomes:

<div class="d-math-block">
$$\boxed{r_j = \sum_{i \to j} \beta\,\frac{r_i}{d_i} + \frac{1-\beta}{N}}$$
</div>

In words: a page's rank is **85% votes, 15% universal basic income**. The first term is the familiar vote-passing, discounted by $\beta$; the second is a small constant floor every page receives from teleporting surfers, links or no links. With $\beta = 0.85$ and a billion pages, that floor is $0.15/10^9$ — tiny, but strictly positive, and that positivity is what makes everything work.

Teleportation fixes both problems at once:

- **Dead ends**: a surfer at a dead end teleports, so rank is redistributed rather
  than lost.
- **Spider traps**: a surfer inside a trap has a $(1 - \beta)$ chance of escaping to
  any page on the web, breaking the cycle.

### Convergence Guarantee

The **Perron-Frobenius theorem** guarantees that any column-stochastic matrix with
all positive entries has a unique stationary distribution, and the power method
converges to it from any starting point.

$\mathbf{G}$ satisfies this because the teleportation term $(1-\beta)/N > 0$ fills
every entry. The convergence rate is $\beta^k$ after $k$ iterations — with $\beta = 0.85$,
after 50 steps the error is at most $0.85^{50} \approx 0.0003$.

### Why β = 0.85?

Brin and Page proposed 0.85 in the original paper, and empirical studies have
confirmed it produces the best balance between:

- **Differentiation**: higher $\beta$ gives more weight to the link structure,
  making high-PR pages stand out more.
- **Convergence speed**: lower $\beta$ converges faster (the second eigenvalue of
  $\mathbf{G}$ is bounded by $\beta$).
- **Trap resistance**: lower $\beta$ resists spider traps more strongly.

<div class="prk-callout prk-callout-tip">
  <strong>You can feel this trade-off in the interactive below.</strong> Load the Spider Trap preset and slide β. At β = 0.95 the trap nodes swallow nearly everything; at β = 0.50 teleportation flattens the scores toward uniform and the link structure barely matters. 0.85 sits where the graph still speaks loudly but pathologies cannot dominate.
</div>

## Interactive: See PageRank in Action

The five-node graph below is fully editable. **Click a node** to select it (it turns
blue), then **click another node** to toggle a directed link between them. PageRank
updates instantly.

Try the presets to see the pathological cases:

- **Default** — a balanced graph with varied PR scores.
- **Spider Trap** — nodes 0–1 and nodes 2–3 each form a closed loop. Watch all the
  rank drain into the traps.
- **Dangling Node** — node A has no outgoing links. Without teleportation it would
  absorb all rank; here the $(1-\beta)/N$ floor keeps everyone nonzero.
- **Hub & Spoke** — a single hub receives all inlinks. See how dramatically it
  dominates.

Adjust the β slider to see how the damping factor shapes the distribution.

<div id="pr-interactive"></div>
<script src="/js/pagerank.js"></script>

## Variants

### Personalized PageRank

Standard PageRank measures global, query-independent importance. **Personalized
PageRank** replaces the uniform teleportation target with a user-specific set $S$:

<div class="d-math-block">
$$r_j = \sum_{i \to j} \beta\,\frac{r_i}{d_i} + (1-\beta)\,\frac{\mathbf{1}[j \in S]}{|S|}$$
</div>

Instead of teleporting to any page on the web, the surfer restarts only on pages in
$S$ (the user's interests, history, or social connections). Twitter's "Who to Follow"
recommender uses exactly this: $S$ is the set of accounts a user already follows.

### TrustRank

Link spam — fake sites created solely to boost a target's PageRank — is the main
vulnerability of the algorithm. **TrustRank** fights back by treating trust like rank:
start from a small set of manually verified seed pages (e.g., `.edu` and `.gov`
domains), then propagate trust through the graph with the same power iteration.

Each page gets a TrustRank score $t(p)$ alongside its standard PageRank $r(p)$. The
**spam mass** of a page is the fraction of its PageRank that doesn't come from trusted
sources:

$$\text{SpamMass}(p) = \frac{r(p) - t(p)}{r(p)}$$

A spam mass near 1 means the page owes its visibility almost entirely to artificial
links, not genuine endorsements.

### HITS: Hubs and Authorities

Jon Kleinberg independently developed **HITS** (Hyperlink-Induced Topic Search) at
Cornell in 1998–99. Where PageRank assigns a single score, HITS assigns two:

- **Authority score** $a\_j$: how valuable is this page's content?
- **Hub score** $h\_j$: how good is this page at pointing to authoritative content?

The two scores reinforce each other:

$$a\_j = \sum_{i \to j} h\_i \qquad\quad h\_j = \sum_{j \to k} a\_k$$

A page is a good authority if it is linked to by good hubs; a page is a good hub if
it links to good authorities. Iterating these updates converges to the principal
eigenvectors of $\mathbf{A}^T\mathbf{A}$ (authorities) and $\mathbf{A}\mathbf{A}^T$
(hubs), where $\mathbf{A}$ is the adjacency matrix.

The key practical difference: PageRank is computed once globally at indexing time,
while HITS runs at query time on a small topic-focused subgraph.

<table class="prk-iter">
  <thead>
    <tr><th>Property</th><th>PageRank</th><th>HITS</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>Scores per page</td>
      <td>One (importance)</td>
      <td>Two (hub + authority)</td>
    </tr>
    <tr>
      <td>When computed</td>
      <td><span class="prk-badge prk-badge-green">Indexing time, once</span></td>
      <td><span class="prk-badge prk-badge-red">Query time, every query</span></td>
    </tr>
    <tr>
      <td>Query awareness</td>
      <td><span class="prk-badge prk-badge-yellow">None (global)</span></td>
      <td><span class="prk-badge prk-badge-green">Topic-focused subgraph</span></td>
    </tr>
    <tr>
      <td>Web-scale serving</td>
      <td><span class="prk-badge prk-badge-green">Cheap lookup</span></td>
      <td><span class="prk-badge prk-badge-red">Too slow in practice</span></td>
    </tr>
  </tbody>
</table>

Google's bet on precomputation won the engineering argument: a query must return in milliseconds, and PageRank reduces ranking to a table lookup.

## Applications Beyond Web Search

The same idea — "you are as important as the important things that point to you" —
applies anywhere a directed network carries endorsements:

**Citation analysis.** The **Eigenfactor** and **SCImago Journal Rank** replace the
traditional impact factor with PageRank-based journal scoring. A citation from
*Nature* counts more than one from an obscure proceedings.

**Biology.** **GeneRank** applies PageRank to gene interaction networks to identify
which genes are most functionally central. In cancer research, PR-based analysis of
protein interaction networks has pinpointed genes that predict patient survival.

**Social networks.** Twitter's follow-recommendation engine, LinkedIn's "People You
May Know", and Facebook's friend suggestions all rely on graph-based centrality
measures derived from PageRank.

**Ecology.** PageRank on food webs identifies keystone species — those whose removal
would most disrupt the ecosystem.

**Software engineering.** Ranking API functions by how many other functions call them,
or ranking kernel modules by their dependency centrality.

## Limitations

**Link spam.** If importance is measured by links, creating fake links inflates it.
Google's Penguin algorithm (2012) and the later SpamBrain AI-based system are direct
responses. The arms race continues.

**Query independence.** Standard PageRank doesn't know what the user is searching for.
A page about Python programming and a page about Python snakes can have identical rank.
Topic-sensitive and personalized variants address this at significant computational
cost.

**The new-page problem.** A freshly published page has no inlinks and thus near-zero
PageRank, regardless of its quality. High-quality content can remain buried until it
accumulates links over months or years.

**Static snapshot.** PageRank is computed on a crawl snapshot. The web changes
continuously, and incremental recomputation on a billion-node graph is an active
research area.

## Legacy

PageRank was never the only signal in Google's ranking — from the beginning it was
combined with text matching, anchor text analysis, and dozens of other features. Today
Google reportedly uses hundreds of signals. In 2016 Google removed the public
PageRank toolbar score, and the algorithm has evolved substantially from its 1998 form.

Yet the conceptual contribution endures. The insight that **network structure encodes
quality**, and that a simple eigenvector computation can extract it, rippled far beyond
web search. Power-iteration-based centrality measures are now standard tools in
computational biology, economics, social science, and graph machine learning.

<div class="prk-callout prk-callout-note">
  <strong>PageRank lives on inside modern graph learning.</strong> A graph neural network layer and a power-iteration step are the same move: pull information from your neighbours, mix, repeat. The connection is explicit in APPNP (Gasteiger et al., 2019), which propagates GNN predictions using personalized PageRank instead of stacked message-passing layers — the teleport term keeps each node anchored to its own features, curing the oversmoothing that plagues deep GNNs. PPR also drives scalable training (PPRGo selects each node's most relevant neighbours by PPR score) and graph sampling in systems like GraphSAGE-style pipelines. The 1998 random surfer is still walking, just under new names.
</div>

Larry Page once described the goal: to build "a search engine that was as good as
having a reference librarian with complete knowledge of the internet who could
understand exactly what you wanted." PageRank was the first algorithm that came close.

## References

1. Brin, S. & Page, L. (1998). *The PageRank Citation Ranking: Bringing Order to the Web.* Stanford InfoLab Technical Report 1999-66. [PDF](http://ilpubs.stanford.edu:8090/422/1/1999-66.pdf)
2. Page, L., Brin, S., Motwani, R. & Winograd, T. (1999). *The PageRank Citation Ranking: Bringing Order to the Web.* WWW 1998.
3. Kleinberg, J. (1999). Authoritative sources in a hyperlinked environment. *Journal of the ACM*, 46(5), 604–632.
4. Gleich, D. F. (2015). PageRank Beyond the Web. *SIAM Review*, 57(3), 321–363. [Link](https://epubs.siam.org/doi/10.1137/140976649)
5. Leskovec, J., Rajaraman, A. & Ullman, J. D. *Mining of Massive Datasets*, Ch. 5: Link Analysis. [Stanford](http://infolab.stanford.edu/~ullman/mmds/ch5.pdf)
6. Gyöngyi, Z., Garcia-Molina, H. & Pedersen, J. (2004). Combating Web Spam with TrustRank. *VLDB 2004*.
7. Gasteiger, J., Bojchevski, A. & Günnemann, S. (2019). [Predict then Propagate: Graph Neural Networks meet Personalized PageRank](https://arxiv.org/abs/1810.05997). *ICLR 2019*.
