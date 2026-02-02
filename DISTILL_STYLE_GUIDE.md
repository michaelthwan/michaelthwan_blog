# Distill-Inspired Blog Style Guide (Internal)

This document captures the writing + visual style we want to emulate from Distill’s *Understanding Convolutions on Graphs* article: `https://distill.pub/2021/understanding-gnns/`.

The goal is **elegant clarity**: a calm page, minimal ornamentation, and color used strictly as information.

---

## Core principles

- **Teach with constraints first**: start from what makes the problem hard (irregular structure, invariances, scale), then introduce solutions as responses to those constraints.
- **One through-line**: pick a single organizing metaphor (e.g., “convolution,” “message passing,” “diffusion”) and keep returning to it.
- **Layered depth**: keep the main narrative readable; push proofs and optional derivations into clearly marked “details” blocks.
- **Show → name → formalize → test**:
  - show an intuition/diagram
  - name the concept
  - introduce notation and equations
  - provide a visual/interactive check that matches the math
- **Trade-offs, not hype**: for every method, explicitly state what it buys you and what it costs.

---

## Page structure & navigation

- **Two-column layout**:
  - **Left**: persistent table of contents (anchors for every major section).
  - **Right**: main content column with comfortable line length.
- **Strong signposting**:
  - headings that announce the reader’s next mental step
  - frequent “we will now…” / “the key idea is…” transitions
- **Whitespace as structure**:
  - separate sections by spacing, not heavy rules
  - give figures and equation panels room to breathe

---

## Voice & pacing (writing style)

- **Short, declarative sentences** that build one claim at a time.
- **Question-led transitions**: “How do we…?”, “What if…?”, “Why this choice?”
- **No long preambles**: introduce notation only when the reader has a reason to care.
- **Concrete anchors**: map new abstractions to familiar ones (images-as-graphs, Laplacian filtering, neighborhood aggregation).
- **Repetition with intent**: reuse the same terms and variable names; avoid synonyms that dilute precision.

---

## Notation & math style

- **Notation discipline**:
  - define symbols once, reuse consistently (e.g., \(G=(V,E)\), adjacency \(A\), degree \(D\), Laplacian \(L\))
  - prefer a small stable vocabulary over many variants
- **Math as an annotated object**:
  - present the key equation
  - add short callouts explaining the role of each sub-expression
  - keep “for all \(v\in V\)” style conditions close to where they matter
- **Optional depth lanes**:
  - “Details for the Interested Reader” blocks for proofs, derivations, edge cases

---

## Visual language & color system

### Baseline

- Keep the **page mostly grayscale** (black/gray text, subtle borders, neutral backgrounds).
- Use **2–3 accent colors total**, and only when they carry meaning.

### Semantic color-coding (roles, not symbols)

Pick a small set of “roles” and color them consistently across the entire post:

- **Target (what we update/solve for)**: e.g., current node embedding \(h_v^{(k)}\)
- **Neighborhood/message (what we aggregate from)**: e.g., neighbors \(u \in \mathcal{N}(v)\), messages \(m_{u\to v}\)
- **Parameters (learned things)**: e.g., \(W\), \(B\), \(\epsilon\), attention weights

Rules:

- **Color must be learnable**: include a tiny legend near the first equation panel and reuse it everywhere.
- **Color is sparse**: highlight only the few tokens that carry the role, not entire equations.
- **Color is consistent across variants**: if you show multiple model “tabs,” keep role→color identical.

---

## “Equation panel” pattern (the signature)

Use an equation panel when introducing a method family or a key update rule.

### Required elements

- **Title**: e.g., “Embedding Computation”
- **Variant selector** (tabs or segmented control) if multiple models share a template:
  - Example: GCN / GAT / GraphSAGE / GIN
- **The equation**, centered, with semantic color highlights
- **Role callouts** (2–5 short labels) mapping sub-terms to meaning
- **Legend**: small “Color codes” key
- **One-sentence takeaway** under the panel (“Shared weights across nodes → parameter count not tied to graph size.”)

### Template (Markdown)

```md
### Embedding computation

> **Key idea:** Each node updates its representation by combining (a) a neighborhood aggregate and (b) its prior state.

**Color codes**
- Target: `h_v^{(k)}` (orange)
- Neighborhood aggregate: `Σ_{u∈N(v)} …` (purple)
- Parameters: `W, B, ε` (teal)

**Update rule**
\[
h_v^{(k)} = f^{(k)}\Big(W^{(k)} \cdot \text{AGG}_{u\in\mathcal{N}(v)}(h_u^{(k-1)}) + B^{(k)}\cdot h_v^{(k-1)}\Big)
\]

- Neighborhood aggregate: what information flows in.
- Skip/self term: preserves identity and stabilizes depth.
- Shared parameters: makes it scale with graph size.
```

---


## Interaction patterns (Interactive Traits)

Distill’s feel comes from treating visuals as part of the explanation, not decoration. A very important trait for a distill blog is the **interactive feature** which makes learning data science easier.

See examples:
- [Bayesian Optimization](https://distill.pub/2020/bayesian-optimization/)
- [Paths Perspective on Value Learning](https://distill.pub/2019/paths-perspective-on-value-learning/)

### Core Interaction Types

- **Hover to reveal structure**: highlight a node and its neighborhood; show the corresponding term(s) in the equation.
- **Sliders for coefficients**: let users change \(w_i\), attention temperature, or learning rates, and immediately see outputs.
- **Tabs for model variants**: keep the panel identical; only swap the differing term.
- **“Show me what changed” diffs**: when switching variants, visually emphasize the changed sub-expression.
- **Simulation Playgrounds**: Allow users to run a small simulation (e.g. gradient descent steps) directly in the browser to build intuition.

If interactivity is not available (plain Markdown), emulate it with:

- small multiples (same layout repeated)
- consistent color highlights
- “difference callouts” that only describe what changes

---

## Narrative patterns to reuse

- **Green check vs red question mark**:
  - show what works in a familiar domain
  - show why it fails here
  - motivate the generalization
- **Local → global progression**:
  - start with localized operations (neighborhood aggregation)
  - then discuss global/spectral views as contrast + trade-offs
- **Practical implications block**:
  - how it scales
  - what assumptions it encodes
  - what breaks (transfer, compute, data sparsity)

---

## Quality bar checklist (before publishing)

- **Structure**: TOC present; headings read like a story.
- **Through-line**: one metaphor repeated consistently.
- **Math**: every displayed equation has (a) a reason to exist and (b) a plain-language interpretation.
- **Color**: used only for semantic roles; legend included once; consistent everywhere.
- **Figures**: each figure answers a specific question posed in the text.
- **Trade-offs**: every method includes limitations and when to use it.

---

## Distill-like article skeleton (HTML / content structure)

From the saved pages in `sample_html/` (e.g. *A Gentle Introduction to Graph Neural Networks*, *Understanding Convolutions on Graphs*, *Understanding RL Vision*), we can infer a consistent article skeleton that we should mirror:

- **Metadata + preview**
  - HTML `<head>` includes title, description, canonical URL, social and citation meta tags.
  - A single **thumbnail image** for social previews.
  - A short **one-sentence description** (“what is this article about?”) used in meta tags and at the top of the page.
- **Hero + context**
  - Brief framing paragraph that connects this article to related work (e.g., “this is one of two Distill publications on X…”)
  - Optional link to a “companion” article.
- **Table of contents**
  - Left-hand TOC listing all major sections (top-level headings only).
  - Section names are descriptive (e.g., “Graphs and where to find them”, “The challenges of using graphs in machine learning”, “GNN playground”, “Into the weeds”).

When implementing our own pages (Markdown → HTML), ensure we can:

- surface `title`, `description`, and `thumbnail` in front-matter
- auto-generate a TOC from `##` headings and render it in a left sidebar

---

## “Build the model together” progression

Borrowed specifically from [*A Gentle Introduction to Graph Neural Networks*](https://distill.pub/2021/gnn-intro/):

- **Part 1 – Data & tasks**
  - Define the data type (graphs) and show **concrete examples** (images, text, molecules, social networks).
  - Enumerate typical tasks at different levels: graph-level, node-level, edge-level.
- **Part 2 – Challenges**
  - Representational issues (adjacency matrices vs adjacency lists, sparsity, permutation invariance).
  - Computational issues (scaling, batching).
- **Part 3 – Minimal model**
  - Introduce the simplest possible architecture that can operate on the data (e.g., “the simplest GNN” that ignores connectivity).
  - Use pooling only at the prediction head.
- **Part 4 – Capability upgrades**
  - Add **message passing** (node↔node).
  - Add **edge representations** (edge↔node).
  - Add **global / master node** (global↔nodes/edges).
  - For each upgrade:
    - explain the motivation
    - show a schematic (Graph Nets diagram)
    - state the new design choices exposed (aggregation function, update function, what attributes talk to which)
- **Part 5 – Playground / experiments**
  - Present a live or pseudo-live “playground” where the reader can:
    - vary architecture knobs (depth, dimensions, aggregation, message-passing style)
    - inspect embeddings / decision boundaries
  - Follow with “design lessons” that summarize empirical trends without overclaiming.
- **Part 6 – Into the weeds**
  - A clearly labeled appendix-style section (e.g., “Into the Weeds”) for:
    - advanced graph types (multigraphs, hypergraphs, hierarchical graphs)
    - sampling and batching details
    - inductive biases, aggregation comparisons
    - connections to other models (Transformers as GNNs, etc.)

When outlining new posts, try to fit them into this 6-part progression, even if some parts are short.

---

## Graph Nets–style schematic pattern

Inspired by [*A Gentle Introduction to Graph Neural Networks*](https://distill.pub/2021/gnn-intro/) and [*Relational Inductive Biases, Deep Learning, and Graph Networks*](https://distill.pub/2021/gnn-intro/#graph-neural-networks) as embedded there:

- **Entities**:
  - nodes \(V\) (often drawn as circles)
  - edges \(E\) (lines or arrows)
  - global/context \(U\) (a separate box or marker)
- **Attributes per entity**:
  - node embeddings
  - edge embeddings
  - global embedding
- **Layer diagram conventions**:
  - show **graph in** on the left and **graph out** on the right; connectivity remains unchanged.
  - depict **update functions** \(f\) as small MLP icons or boxes attached to each entity type.
  - depict **pooling functions** \(\rho\) with arrows that gather from one entity type to another (e.g., edges→nodes, nodes→global).

Guidelines:

- For each architecture change, update a **single base schematic** rather than inventing a new layout.
- Use the same labels \(V_n, E_n, U_n\) for layer \(n\); \(V_{n+1}, E_{n+1}, U_{n+1}\) for the next layer.
- Use the same color code as equations (e.g., target entity in orange, sources in purple/blue, parameters/MLPs in neutral gray).

---

## Section naming patterns

Common Distill-style section names we can reuse or adapt:

- **“Graphs and where to find them”** → domain examples and visualizations.
- **“What types of problems have [X]-structured data?”** → task taxonomy.
- **“The challenges of using [X] in machine learning”** → constraint framing.
- **“[Model family]” / “The simplest [model]”** → baseline architecture.
- **“[Model] playground”** → interactive experimentation section.
- **“Some empirical [model] design lessons”** → summarized experimental findings.
- **“Into the weeds”** → advanced/appendix content.

When writing, prefer these descriptive, slightly playful headings over generic ones (“Introduction”, “Conclusion”) where appropriate; but keep a short “Final thoughts” or “Conclusion” for closure.

