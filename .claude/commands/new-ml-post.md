---
name: new-ml-post
description: Guide for creating a Machine Learning blog post for the MW Knowledge Blog. Use when writing a new ML post — typically based on a research paper or ML concept. Ensures essential paper figures are included and an interactive module is designed to make the core mechanic hands-on.
---

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
- [ ] Thumbnail image exists at the path in frontmatter
- [ ] Post appears in the correct column on `/blog` (category: ml)
