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

More precisely: page $i$ distributes its PageRank equally among all $d\_i$ pages it
links to. Each outgoing link from page $i$ carries $r\_i / d\_i$ units of rank.

The PageRank of page $j$ is the sum of all the fractional votes it receives:

$$r\_j = \sum_{i \to j} \frac{r\_i}{d\_i}$$

where the sum is over all pages $i$ that have a directed link to $j$, and $d\_i$ is the
number of outgoing links from page $i$.

This is a recursive definition: $r\_j$ depends on $r\_i$, which itself depends on other
PageRanks. To solve it we need a different way of thinking.

<figure class="d-figure">
<div class="d-figure-content">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 210" width="520" height="210" style="display:block;width:100%;height:auto;max-width:520px">
  <defs>
    <marker id="va" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
      <polygon points="0,0 0,8 8,4" fill="#888"/>
    </marker>
    <marker id="va-faint" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
      <polygon points="0,0 0,8 8,4" fill="#ccc"/>
    </marker>
  </defs>

  <!-- B → A -->
  <line x1="118" y1="62" x2="355" y2="103" stroke="#888" stroke-width="1.8" marker-end="url(#va)"/>
  <!-- B → … (dashed, d=2) -->
  <line x1="116" y1="55" x2="195" y2="22" stroke="#ccc" stroke-width="1.4" stroke-dasharray="4 3" marker-end="url(#va-faint)"/>
  <!-- C → A -->
  <line x1="113" y1="112" x2="355" y2="115" stroke="#888" stroke-width="1.8" marker-end="url(#va)"/>
  <!-- D → A -->
  <line x1="108" y1="164" x2="355" y2="127" stroke="#888" stroke-width="1.8" marker-end="url(#va)"/>

  <!-- Arrow vote labels -->
  <text x="226" y="74" font-family="Inter,system-ui,sans-serif" font-size="11" fill="#555" text-anchor="middle">0.30 ÷ 2 = <tspan font-weight="700" fill="#333">0.15</tspan></text>
  <text x="234" y="108" font-family="Inter,system-ui,sans-serif" font-size="11" fill="#555" text-anchor="middle">0.20 ÷ 1 = <tspan font-weight="700" fill="#333">0.20</tspan></text>
  <text x="226" y="157" font-family="Inter,system-ui,sans-serif" font-size="11" fill="#555" text-anchor="middle">0.10 ÷ 1 = <tspan font-weight="700" fill="#333">0.10</tspan></text>
  <text x="210" y="16" font-family="Inter,system-ui,sans-serif" font-size="10" fill="#bbb" text-anchor="middle">other page</text>

  <!-- Nodes: B, C, D (sources) -->
  <circle cx="95" cy="58"  r="22" fill="#555"/>
  <text x="95" y="54"  font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" fill="white" text-anchor="middle">B</text>
  <text x="95" y="67"  font-family="Inter,system-ui,sans-serif" font-size="9"  fill="#ddd" text-anchor="middle">0.30, d=2</text>

  <circle cx="95" cy="112" r="18" fill="#777"/>
  <text x="95" y="108" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" fill="white" text-anchor="middle">C</text>
  <text x="95" y="121" font-family="Inter,system-ui,sans-serif" font-size="9"  fill="#ddd" text-anchor="middle">0.20, d=1</text>

  <circle cx="95" cy="162" r="14" fill="#999"/>
  <text x="95" y="158" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" fill="white" text-anchor="middle">D</text>
  <text x="95" y="171" font-family="Inter,system-ui,sans-serif" font-size="9"  fill="#ddd" text-anchor="middle">0.10, d=1</text>

  <!-- Node A (destination, biggest) -->
  <circle cx="390" cy="115" r="34" fill="#1a1a1a"/>
  <text x="390" y="111" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="700" fill="white" text-anchor="middle">A</text>
  <text x="390" y="126" font-family="Inter,system-ui,sans-serif" font-size="10" fill="#aaa" text-anchor="middle">PR = 0.45</text>

  <!-- Sum annotation -->
  <text x="448" y="107" font-family="Inter,system-ui,sans-serif" font-size="10" fill="#888">0.15</text>
  <text x="448" y="119" font-family="Inter,system-ui,sans-serif" font-size="10" fill="#888">+ 0.20</text>
  <text x="448" y="131" font-family="Inter,system-ui,sans-serif" font-size="10" fill="#888">+ 0.10</text>
  <line x1="444" y1="134" x2="480" y2="134" stroke="#bbb" stroke-width="0.8"/>
  <text x="448" y="144" font-family="Inter,system-ui,sans-serif" font-size="10" font-weight="700" fill="#333">= 0.45</text>
</svg>
</div>
<figcaption class="d-figure-caption">
  Each page distributes its PageRank equally among its outgoing links. B has two links so
  it contributes 0.30÷2 = 0.15 to A (the other half goes to a different page, shown dashed).
  C and D each link only to A, so they contribute their full rank.
  Node A's PageRank is the sum of all incoming fractional votes.
</figcaption>
</figure>

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

$$M\_{ij} = \begin{cases} \dfrac{1}{d\_j} & \text{if page } j \text{ links to page } i \\ 0 & \text{otherwise} \end{cases}$$

Each column of $\mathbf{M}$ is a probability distribution: the surfer on page $j$
moves to one of its outgoing neighbours uniformly at random, so column $j$ distributes
$1/d\_j$ to each neighbour.

The PageRank vector $\mathbf{r}$ satisfies:

$$\mathbf{r} = \mathbf{M}\,\mathbf{r}$$

This is an **eigenvector equation**. $\mathbf{r}$ is the eigenvector of $\mathbf{M}$
corresponding to eigenvalue 1 — the stationary distribution of the random walk.

### Power Iteration

Finding this eigenvector is simple: start from any distribution and repeatedly multiply
by $\mathbf{M}$. The iterations converge to the stationary distribution:

$$\mathbf{r}^{(t+1)} = \mathbf{M}\,\mathbf{r}^{(t)}$$

Initialize $\mathbf{r}^{(0)} = \mathbf{1}/N$ (uniform). After enough iterations,
$\mathbf{r}^{(t)}$ stops changing. In practice, 50–100 iterations suffice for web-scale
graphs.

But the naive $\mathbf{M}$ has two pathological problems that must be fixed first.

## Problems: Dead Ends and Spider Traps

### Dead Ends (Dangling Nodes)

A **dead end** is a page with no outgoing links. In matrix terms, the corresponding
column of $\mathbf{M}$ is all zeros — it doesn't define a probability distribution.

When the random surfer reaches a dead end, there is nowhere to go. In the power
iteration, rank "leaks out" of the system: the total sum $\sum\_j r\_j$ shrinks each
iteration and eventually collapses to zero.

<figure class="d-figure">
<div class="d-figure-content">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 165" width="480" height="165" style="display:block;width:100%;height:auto;max-width:480px">
  <defs>
    <marker id="de-arr" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
      <polygon points="0,0 0,8 8,4" fill="#888"/>
    </marker>
  </defs>
  <!-- A → B -->
  <line x1="113" y1="82"  x2="218" y2="82"  stroke="#888" stroke-width="1.8" marker-end="url(#de-arr)"/>
  <!-- B → C -->
  <line x1="273" y1="82"  x2="348" y2="82"  stroke="#888" stroke-width="1.8" marker-end="url(#de-arr)"/>

  <!-- Nodes A, B (normal) -->
  <circle cx="90"  cy="82" r="22" fill="#555"/>
  <text x="90"  y="87" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="700" fill="white" text-anchor="middle">A</text>
  <circle cx="245" cy="82" r="26" fill="#444"/>
  <text x="245" y="87" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="700" fill="white" text-anchor="middle">B</text>

  <!-- Node C — dead end (orange border) -->
  <circle cx="378" cy="82" r="28" fill="#fff4e5" stroke="#d97706" stroke-width="2.5"/>
  <text x="378" y="78"  font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="700" fill="#b45309" text-anchor="middle">C</text>
  <text x="378" y="92"  font-family="Inter,system-ui,sans-serif" font-size="9"  fill="#b45309" text-anchor="middle">no outlinks</text>

  <!-- Dead-end marker: downward T-bar -->
  <line x1="413" y1="82"  x2="438" y2="82"  stroke="#d97706" stroke-width="2"/>
  <line x1="438" y1="70"  x2="438" y2="94"  stroke="#d97706" stroke-width="2"/>

  <!-- Annotation -->
  <text x="378" y="128" font-family="Inter,system-ui,sans-serif" font-size="11" fill="#b45309" text-anchor="middle" font-style="italic">rank absorbed — no exit</text>

  <!-- Rank drain arrows from C downward (faint) -->
  <line x1="370" y1="111" x2="358" y2="148" stroke="#fbbf24" stroke-width="1" stroke-dasharray="3 2"/>
  <line x1="378" y1="111" x2="378" y2="148" stroke="#fbbf24" stroke-width="1" stroke-dasharray="3 2"/>
  <line x1="386" y1="111" x2="398" y2="148" stroke="#fbbf24" stroke-width="1" stroke-dasharray="3 2"/>
</svg>
</div>
<figcaption class="d-figure-caption">
  A dead end has no outgoing links. Rank flows in from A and B but has nowhere to go. During
  power iteration, the total rank in the system shrinks each step — eventually collapsing to zero.
</figcaption>
</figure>

### Spider Traps

A **spider trap** is a set of pages with links among themselves but no outgoing links
to the rest of the web. The random surfer who wanders in never escapes.

Unlike dead ends, rank doesn't disappear here — it accumulates. Over many iterations,
the pages inside the trap absorb all the PageRank in the graph, giving them
artificially inflated scores.

<figure class="d-figure">
<div class="d-figure-content">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200" width="480" height="200" style="display:block;width:100%;height:auto;max-width:480px">
  <defs>
    <marker id="st-arr" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
      <polygon points="0,0 0,8 8,4" fill="#888"/>
    </marker>
    <marker id="st-trap" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
      <polygon points="0,0 0,8 8,4" fill="#1565c0"/>
    </marker>
  </defs>

  <!-- External node D → A (rank enters trap) -->
  <line x1="93" y1="100" x2="185" y2="100" stroke="#888" stroke-width="1.8" marker-end="url(#st-arr)"/>
  <text x="139" y="93" font-family="Inter,system-ui,sans-serif" font-size="10" fill="#888" text-anchor="middle">rank in</text>

  <!-- Trap: A → B (straight) -->
  <line x1="258" y1="78"  x2="330" y2="78"  stroke="#1565c0" stroke-width="2" marker-end="url(#st-trap)"/>
  <!-- Trap: B → A (curved arc back) -->
  <path d="M 338 118 Q 294 172 230 118" fill="none" stroke="#1565c0" stroke-width="2" marker-end="url(#st-trap)"/>

  <!-- Node D (external, neutral) -->
  <circle cx="68"  cy="100" r="20" fill="#999"/>
  <text x="68"  y="105" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="700" fill="white" text-anchor="middle">D</text>

  <!-- Trap nodes A, B (blue tint) -->
  <circle cx="212" cy="98" r="26" fill="#e3f0ff" stroke="#1565c0" stroke-width="2"/>
  <text x="212" y="94"  font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="700" fill="#1565c0" text-anchor="middle">A</text>
  <text x="212" y="107" font-family="Inter,system-ui,sans-serif" font-size="9"  fill="#1565c0" text-anchor="middle">trap</text>

  <circle cx="358" cy="98" r="26" fill="#e3f0ff" stroke="#1565c0" stroke-width="2"/>
  <text x="358" y="94"  font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="700" fill="#1565c0" text-anchor="middle">B</text>
  <text x="358" y="107" font-family="Inter,system-ui,sans-serif" font-size="9"  fill="#1565c0" text-anchor="middle">trap</text>

  <!-- "no exit" barrier on right -->
  <line x1="398" y1="88" x2="420" y2="88" stroke="#1565c0" stroke-width="1.5" stroke-dasharray="3 2"/>
  <line x1="420" y1="78" x2="420" y2="98" stroke="#1565c0" stroke-width="2"/>

  <!-- Annotations -->
  <text x="285" y="170" font-family="Inter,system-ui,sans-serif" font-size="11" fill="#1565c0" text-anchor="middle" font-style="italic">rank circulates forever — no exit</text>
  <text x="285" y="57"  font-family="Inter,system-ui,sans-serif" font-size="10" fill="#1565c0" text-anchor="middle">A → B → A → B → …</text>
</svg>
</div>
<figcaption class="d-figure-caption">
  A spider trap: pages A and B link only to each other. External page D's rank flows in
  through A, but none of it ever escapes. After many iterations, all rank in the system
  accumulates inside the {A, B} loop.
</figcaption>
</figure>

<div class="d-callout">
  <strong>Both problems share the same fix: teleportation.</strong>
</div>

## The Google Matrix

Brin and Page added a **damping factor** $\beta$ (typically 0.85). With probability
$\beta$, the surfer follows a link as before. With probability $1 - \beta$, the surfer
ignores the current page entirely and **teleports** to a uniformly random page.

This models real user behaviour: people don't follow links forever — they open new
tabs, use bookmarks, type URLs directly.

The resulting **Google Matrix** is:

$$\mathbf{G} = \beta\,\mathbf{M} + (1-\beta)\,\frac{\mathbf{e}\mathbf{e}^T}{N}$$

where $\mathbf{e}$ is the all-ones vector, so $\mathbf{e}\mathbf{e}^T / N$ is a
matrix with every entry equal to $1/N$ — the uniform teleportation target.

The full per-node formula becomes:

$$\boxed{r\_j = \sum_{i \to j} \beta\,\frac{r\_i}{d\_i} + \frac{1-\beta}{N}}$$

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

$$r\_j = \sum_{i \to j} \beta\,\frac{r\_i}{d\_i} + (1-\beta)\,\frac{\mathbf{1}[j \in S]}{|S|}$$

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
while HITS runs at query time on a small topic-focused subgraph. This makes HITS
more query-aware but much slower and harder to scale.

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
