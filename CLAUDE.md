# Project Instructions for Claude

## User Preferences

- **Always ask for confirmation before running destructive commands** (e.g., `rm`, `git reset`, `git clean`, etc.)
- User wants to review all bash commands before execution

## Project Structure

This is a Distill-style knowledge blog built with Astro.

- Blog posts: `astro-blog/src/content/posts/*.md`
- Styles: `astro-blog/public/styles.css`
- Scripts: `astro-blog/public/script.js`

## Images & Interactives

- Images go in `astro-blog/public/img/<post-name>/` (e.g. `public/img/transformer/`)
- When adding a new blog post, selectively pick images for parts that are genuinely complex enough to warrant them — don't illustrate everything
- Reserve interactive modules for the **core mechanics** that benefit from hands-on exploration (e.g. attention computation, positional encoding)
- Static paper figures are best used as **supporting context**, not as a replacement for interactivity
- Tall/portrait paper figures need an explicit `max-width` + `margin: 0 auto; display: block;` to avoid dominating the page
- Side-by-side image pairs in flexbox require `min-width: 0` on each `<img>` and `overflow: hidden` on the flex container, or they overflow

## Commands

```bash
cd astro-blog
npm run dev      # Start dev server at localhost:4321
npm run build    # Build for production
npm run preview  # Preview production build
```
