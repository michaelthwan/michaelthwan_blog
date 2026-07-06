---
name: "source-command-new-ml-post"
description: "Guide for creating a Machine Learning blog post for the MW Knowledge Blog. Use when writing a new ML post — typically based on a research paper or ML concept. Ensures essential paper figures are included and an interactive module is designed to make the core mechanic hands-on."
---

# source-command-new-ml-post

Use this skill when the user asks to run the migrated source command `new-ml-post`.

## Command Template

# Creating an ML Blog Post

This blog is built on the premise that **interactive insights** make ML concepts stick. Every ML post must include:
1. Key figures from the source paper/article
2. At least one interactive module for the most important mechanic

## Checklist before writing

- [ ] Identify the 3–5 most essential figures from the paper (architecture diagrams, training curves, key results)
- [ ] Identify the single core mechanic that most benefits from hands-on exploration
- [ ] Plan the interactive module for that mechanic

## Post structure

```markdown
---
title: <paper title or concept name>
subtitle: <one-sentence framing>
authors: ["Michael Wan"]
affiliations: ["Michael Wan Interactive Insights"]
published: <display date, e.g. "April 2026">
abstract: <2–3 sentence plain-English summary>
category: ml
tags: ['explainer']
thumbnail: /img/<slug>/thumbnail.png
---
```

### Sections to include

1. **Introduction** — motivation and why this paper/concept matters
2. **Architecture / Key Idea** — include the main paper figure here (architecture diagram or central diagram)
3. **Core Mechanics** — explain key components; embed supporting paper figures inline
4. **Interactive: [Mechanic Name]** — the hands-on module (see below)
5. **Training & Results** — include training curves or benchmark tables from paper
6. **Key Takeaways** — 3–5 bullet summary

## Images

- Save paper figures to `public/img/<slug>/` — name them descriptively (e.g. `fig1-architecture.png`, `fig3-attention-heads.png`)
- Include images selectively: only where the visual genuinely clarifies the text
- Every post needs at least the main architecture/concept diagram

```html
<!-- Inline figure with caption -->
<figure>
  <img src="/img/<slug>/fig1-architecture.png" alt="Model architecture" style="max-width: 100%; margin: 0 auto; display: block;" />
  <figcaption>Figure 1: Architecture overview from [Author et al., Year].</figcaption>
</figure>
```

For tall/portrait figures, add explicit max-width:
```html
<img src="..." style="max-width: 420px; margin: 0 auto; display: block;" />
```

## Interactive module

Every ML post must have one interactive module targeting the **core mechanic** — the thing the reader most needs to internalize.

**Good examples:**
- Transformer post → positional encoding visualizer (drag to see how sine/cosine waves encode position)
- BERT post → masking + prediction demo
- Attention paper → attention weight heatmap over tokens

**Design principles:**
- Let the user *change inputs* and see the output update live — not just animate passively
- Keep scope tight: one mechanic, not the whole model
- Use vanilla JS (no frameworks) — put code in `public/js/<slug>.js`
- Load any heavy libs (Chart.js, D3) from CDN inside the markdown, not in `script.js`

**Interactive scaffold:**

```html
<!-- In the markdown, after the section explaining the mechanic -->
<div id="<mechanic>-interactive" class="interactive-container">
  <h3>Interactive: <Mechanic Name></h3>
  <p class="interactive-desc">Adjust the controls to see how <mechanic> works.</p>
  <!-- controls: sliders, dropdowns, text inputs -->
  <!-- output: canvas, table, or styled divs -->
</div>
<script src="/js/<slug>.js"></script>
```

Put all JS in `public/js/<slug>.js`. Keep it self-contained — query selectors on IDs defined in the markdown.

## Callouts, badges & emphasis

Plain walls of text are hard to scan. Use colorful, semantic elements to make key points pop — reference implementation: `src/content/posts/llm-knowledge-base.md`.

### Colored callout boxes

Use for tips, warnings, and design notes. Color carries meaning (green = tip/do-this, yellow = warning/trade-off, indigo = note/aside). Each callout starts with a **bold lead-in sentence** stating the point, followed by 1–3 sentences of explanation.

```html
<style>
  .kb-callout {
    border-left: 3px solid; border-radius: 0 6px 6px 0;
    padding: 11px 14px; margin: 20px 0; font-size: 0.92rem; line-height: 1.55;
  }
  .kb-callout-tip  { border-color: #10b981; background: #f0fdf4; color: #065f46; }
  .kb-callout-warn { border-color: #f59e0b; background: #fffbeb; color: #92400e; }
  .kb-callout-note { border-color: #6366f1; background: #eef2ff; color: #3730a3; }
</style>

<div class="kb-callout kb-callout-warn">
  <strong>Concept granularity is a real design decision.</strong> Too fine-grained and you get fragmentation; too coarse and articles bloat.
</div>
```

Rename the `kb-` prefix per post (e.g. `fa-` for flash-attention) to avoid collisions. Aim for 2–5 callouts per post — one per major section where there's a genuine trade-off or gotcha, not decoration.

### Colored badge pills in tables

When a table column expresses a status/tier/category, render it as a colored pill instead of plain text — readers can scan the color gradient (green → yellow → red) without reading:

```html
<style>
  .kb-badge { display: inline-block; font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
  .kb-badge-green  { background: #d1fae5; color: #065f46; }
  .kb-badge-yellow { background: #fef3c7; color: #92400e; }
  .kb-badge-red    { background: #fee2e2; color: #b91c1c; }
</style>

<td><span class="kb-badge kb-badge-green">Full context</span></td>
<td><span class="kb-badge kb-badge-yellow">Index + search tool</span></td>
<td><span class="kb-badge kb-badge-red">RAG required</span></td>
```

### Bold & highlight in body text

- **Bold the load-bearing phrase** of a paragraph — the claim a skimmer must not miss (`**interactive insights**`, `**one distinct idea**`). One bold phrase per paragraph max; bolding everything bolds nothing.
- Bold lead-in sentences inside callouts (see above) — the bold part alone should convey the message.
- Use `<code>` for file paths, identifiers, and commands inline — the gray chip visually separates them from prose.
- For inline highlight of a phrase (rare), use `<mark style="background:#fef3c7; padding:0 3px; border-radius:3px;">...</mark>` — same yellow family as the warn callout.
- Beyond these, keep the page grayscale-first per `DISTILL_STYLE_GUIDE.md`: 2–3 accent colors total, only where they carry meaning.

## Math

- Use LaTeX: `$...$` inline, `$$...$$` display — KaTeX is loaded on all article pages
- Inside HTML `<div>` containers, escape underscores: `$S\_{ij}$` not `$S_{ij}$`

## File locations

| What | Where |
|---|---|
| Post markdown | `src/content/posts/<slug>.md` |
| Post images | `public/img/<slug>/` |
| Post JS | `public/js/<slug>.js` |
| Thumbnail | `public/img/<slug>/thumbnail.png` (or `.svg`) |

## Quality bar

Before finishing, confirm:
- [ ] All major paper figures referenced in the text are included
- [ ] The interactive module actually runs and responds to user input
- [ ] Math is rendered correctly (check KaTeX escaping inside divs)
- [ ] Key trade-offs/gotchas are surfaced in colored callouts; status-like table columns use badge pills; each paragraph's key claim is bolded
- [ ] Thumbnail image exists at the path in frontmatter
- [ ] Post appears in the correct column on `/blog` (category: ml)
