# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## User Preferences

- **Always ask for confirmation before running destructive commands** (e.g., `rm`, `git reset`, `git clean`)
- User wants to review all bash commands before execution

## Commands

```bash
cd astro-blog
npm run dev      # Start dev server at localhost:4321
npm run build    # Build for production
npm run preview  # Preview production build
```

## Architecture Overview

Distill-style knowledge blog built with **Astro** (static site generator). All source lives under `astro-blog/`.

### Routing & Pages
- `src/pages/index.astro` — Homepage (bio/portfolio). Avatar, career timeline, education.
- `src/pages/blog.astro` — Three-column listing (ML | Dev | Business & Industry), fetched via `getCollection('posts')`.
- `src/pages/posts/[...slug].astro` — Dynamic post pages; renders each `.md` file through `Article.astro`.

### Content Collection
Posts live in `src/content/posts/*.md`. The Zod schema (`src/content/config.ts`) requires these frontmatter fields:

```yaml
title: string
subtitle: string
authors: string[]
affiliations: string[]
published: string        # display date string
abstract: string
category: ml | dev | business   # controls which column on blog.astro
tags: string[]           # default: ['explainer']
thumbnail: string        # optional, path from /public (e.g. /img/post/thumb.png)
doi: string              # optional
doiUrl: string           # optional
```

### Layouts & Components
- `src/layouts/Article.astro` — Full article shell. Loads KaTeX (CDN), `styles.css`, and `script.js`. Auto-generates a TOC from h2/h3 headings in the post.
- `src/layouts/Base.astro` — Bare HTML shell used by non-article pages. Loads Inter + JetBrains Mono fonts and `styles.css`.
- `src/components/Header.astro` — Logo + site name. Accepts `logoText` prop (default: "Michael Wan Interactive Insights"). Homepage passes `logoText="Michael Wan"`.
- `src/components/PostPreview.astro` — Card used on blog.astro. Shows thumbnail, date, tags, title, authors (truncated at 3 + "et al."), and abstract excerpt.
- `src/components/TimelineEntry.astro` — Used on the homepage timeline.

### Styles
Single stylesheet: `public/styles.css`. Organized by labeled comment sections:
- `CSS Variables` — colors, fonts, layout widths (`--l-page: 900px`, `--content-width: 648px`)
- `DISTILL HEADER` — `.d-title`, `.d-subtitle`, `.d-byline` (article title area)
- `SITE HEADER` — `.site-header`, `.logo`
- `HOMEPAGE - POSTS LIST` — `.index-columns` (3-col grid), `.post-preview` cards
- `BIO / PORTFOLIO PAGE` — `.bio-hero`, timeline, education, skills
- `COMPENSATION CHARTS & INTERACTIVE` — styles for the tech-comp post
- `WORKFLOW LOOP DIAGRAM` — styles for the claude-code post interactive
- Positional encoding interactive styles

### Style Guide
- `DISTILL_STYLE_GUIDE.md` is the design and writing reference for this site.
- Use it for narrative pacing, article structure, math presentation, and visual choices.
- Core direction: calm grayscale-first pages, 2â3 semantic accent colors, clear signposting, short declarative prose, and TOC-driven two-column articles.

### Scripts
- `public/script.js` — Global client-side JS loaded by `Article.astro` on every post. Contains interactives for attention computation and positional encoding.
- `public/js/<post>.js` — Post-specific scripts loaded via `<script>` tags inside the post markdown. Example: `public/js/sp500-charts.js` uses Chart.js loaded from CDN within the post itself.

## Adding a New Blog Post

1. Create `src/content/posts/<slug>.md` with required frontmatter (see schema above).
2. Add images to `public/img/<slug>/`.
3. If using Chart.js or other heavy libraries, load them via CDN `<script>` tags inside the markdown (not in `script.js`). Put post-specific JS in `public/js/<slug>.js`.
4. Post automatically appears in the correct column on blog.astro based on `category`.

## Images & Interactives

- Selectively add images — only where content is genuinely complex enough to warrant them.
- Reserve interactive modules for **core mechanics** that benefit from hands-on exploration.
- Tall/portrait figures need an explicit `max-width` + `margin: 0 auto; display: block;` to avoid dominating the page.
- Side-by-side images in flexbox require `min-width: 0` on each `<img>` and `overflow: hidden` on the container, or they overflow.

## Math Formulas

- Use LaTeX (`$...$` inline, `$$...$$` display) — KaTeX is loaded on all article pages.
- Inside HTML `<div>` containers, escape underscores as `\_` to prevent markdown interpreting them as italics before KaTeX renders (e.g. `$S\_{ij}$`).

## Codex Working Notes

- Treat `astro-blog/` as the actual app root for source, build, and runtime changes.
- `src/content/posts/*.md` is the source of truth for article content and homepage/blog listings.
- `src/pages/blog.astro` and `src/pages/posts/[...slug].astro` are the main data-driven routing surfaces.
- `src/layouts/Article.astro` is the common article shell; it handles KaTeX, the TOC, and the shared client script.
- `public/script.js` is shared runtime for article interactives; `public/js/*.js` is per-post interactive logic.
- `public/styles.css` is the single global stylesheet, including dark-mode and post-specific sections.
- `DISTILL_STYLE_GUIDE.md` should be consulted before changing article narrative, visuals, or interaction patterns.
- `src/components/Header.astro` owns the theme toggle and `localStorage` persistence.
- When making changes, prefer understanding the existing structure before editing, and keep posts/content-driven behavior aligned with the current schema.
