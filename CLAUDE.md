# Project Instructions for Claude

## User Preferences

- **Always ask for confirmation before running destructive commands** (e.g., `rm`, `git reset`, `git clean`, etc.)
- User wants to review all bash commands before execution

## Project Structure

This is a Distill-style knowledge blog built with Astro.

- Blog posts: `astro-blog/src/content/posts/*.md`
- Styles: `astro-blog/public/styles.css`
- Scripts: `astro-blog/public/script.js`

## Commands

```bash
cd astro-blog
npm run dev      # Start dev server at localhost:4321
npm run build    # Build for production
npm run preview  # Preview production build
```
