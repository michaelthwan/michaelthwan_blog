---
title: "AI Agent-First Engineering"
subtitle: "From agent non-determinism to production harness systems — a synthesized roadmap."
authors:
  - "Michael Wan"
affiliations:
  - "Independent Analysis"
published: "2026-03-07"
abstract: "A structured learning path synthesizing four key resources: Claude Code Skills docs, Butter's taxonomy of deterministic agent approaches, OpenAI's harness engineering post, and the Everything-Claude-Code toolkit. Five chapters covering foundations, determinism strategies, skills, harness design, and production systems."
tags:
  - "explainer"
category: "dev"
thumbnail: "/img/agent-engineering-roadmap/thumbnail.svg"
---

<p class="d-note">
  Synthesizes four sources from late 2025–early 2026:
  <a href="https://code.claude.com/docs/en/skills">Claude Code Skills docs</a>,
  Butter's <a href="https://blog.butter.dev/the-messy-world-of-deterministic-agents">Messy World of Deterministic Agents</a>,
  OpenAI's <a href="https://openai.com/index/harness-engineering/">Harness Engineering post</a>,
  and <a href="https://github.com/affaan-m/everything-claude-code">Everything-Claude-Code</a>.
  Click any node to learn more.
</p>

## Overview

The mental model shift for agent-first engineering is simple to state and hard to internalize: **stop writing code, start building environments**. The agent writes the code. Your job is to give it the tools, context, and constraints to do that reliably.

Why is that hard? Because an agent is not a program you run — it is a model that decides, step by step, what to do next. That freedom is the whole point, and also the whole problem. The same request can produce a clean fix on Monday and a sprawling refactor on Tuesday. Every technique in this roadmap is one answer to a single question: **how much of the model's freedom do you trade away to buy back predictability?**

The five chapters below trace the full arc — from why agents are unreliable, through the landscape of solutions, into Claude Code's skill system, harness design lessons from OpenAI's production experience, and finally the community tooling that ties it together. Use the interactive map to browse; the chapter notes underneath it fill in the detail.

<style>
  /* ── Outer breakout container ── */
  .rm-outer {
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    width: min(860px, calc(100vw - 32px));
    margin-top: 40px;
    margin-bottom: 40px;
  }

  /* ── Roadmap scroll wrapper ── */
  .rm-wrap {
    position: relative;
    padding: 52px 0 40px;
    overflow-x: auto;
  }
  .rm-inner {
    min-width: 580px;
    position: relative;
  }

  /* ── Vertical spine ── */
  .rm-spine {
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #1D4ED8;
    transform: translateX(-50%);
    z-index: 0;
  }

  /* ── Top title node ── */
  .rm-title {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    margin-bottom: 48px;
  }
  .rm-title span {
    background: #fff;
    border: 2px solid #1D4ED8;
    color: #1D4ED8;
    font-weight: 700;
    font-size: 0.9rem;
    padding: 8px 22px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* ── Section ── */
  .rm-section {
    position: relative;
    z-index: 1;
    margin-bottom: 56px;
  }

  /* ── Chapter node ── */
  .rm-chapter {
    display: flex;
    justify-content: center;
    margin-bottom: 28px;
    position: relative;
    z-index: 2;
  }
  .rm-chapter-box {
    background: #FBBF24;
    border: 2px solid #78350F;
    padding: 9px 32px;
    font-weight: 700;
    font-size: 0.9rem;
    text-align: center;
    min-width: 210px;
    border-radius: 3px;
    color: #1C1917;
    letter-spacing: 0.01em;
  }

  /* ── Branch row ── */
  .rm-row {
    display: grid;
    grid-template-columns: 1fr 16px 1fr;
    align-items: start;
    position: relative;
  }
  /* Dotted horizontal connector across the spine */
  .rm-row::before {
    content: '';
    position: absolute;
    left: 22%;
    right: 22%;
    top: 15px;
    border-top: 2px dashed #93C5FD;
    z-index: 0;
  }

  /* ── Left / Right clusters ── */
  .rm-left {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 7px;
    padding-right: 30px;
  }
  .rm-right {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;
    padding-left: 30px;
  }

  /* ── Spine dot ── */
  .rm-dot-col {
    display: flex;
    justify-content: center;
    padding-top: 9px;
    position: relative;
    z-index: 3;
  }
  .rm-dot {
    width: 13px;
    height: 13px;
    background: #1D4ED8;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 2px #1D4ED8;
  }

  /* ── Cluster label ── */
  .rm-lbl {
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #9CA3AF;
    margin-bottom: 1px;
    margin-top: 10px;
    padding: 0 2px;
  }
  .rm-lbl:first-child { margin-top: 0; }

  /* ── Node boxes ── */
  .rm-box {
    background: #FFFBEB;
    border: 1.5px solid #D97706;
    padding: 7px 14px;
    font-size: 0.82rem;
    line-height: 1.45;
    width: 100%;
    max-width: 300px;
    border-radius: 3px;
    cursor: pointer;
    transition: background 0.12s, box-shadow 0.12s, transform 0.1s;
    user-select: none;
  }
  .rm-box:hover {
    background: #FEF3C7;
    box-shadow: 0 2px 8px rgba(0,0,0,0.10);
    transform: translateY(-1px);
  }
  .rm-box.active {
    background: #FEF3C7;
    border-color: #92400E;
    box-shadow: 0 0 0 2px #FCD34D;
  }

  /* Blue variant — tools/commands */
  .rm-box.b { background: #EFF6FF; border-color: #3B82F6; }
  .rm-box.b:hover { background: #DBEAFE; box-shadow: 0 2px 8px rgba(0,0,0,0.10); }
  .rm-box.b.active { background: #DBEAFE; border-color: #1D4ED8; box-shadow: 0 0 0 2px #93C5FD; }

  /* Green variant — learning */
  .rm-box.g { background: #F0FDF4; border-color: #16A34A; }
  .rm-box.g:hover { background: #DCFCE7; box-shadow: 0 2px 8px rgba(0,0,0,0.10); }
  .rm-box.g.active { background: #DCFCE7; border-color: #166534; box-shadow: 0 0 0 2px #86EFAC; }

  /* ── Legend ── */
  .rm-legend {
    display: flex;
    gap: 24px;
    justify-content: center;
    flex-wrap: wrap;
    padding-top: 24px;
    border-top: 1px solid #E5E7EB;
    margin-top: 4px;
  }
  .rm-leg { display: flex; align-items: center; gap: 7px; font-size: 0.76rem; color: #6B7280; }
  .rm-sw { width: 20px; height: 12px; border-radius: 2px; border: 1.5px solid #D97706; background: #FFFBEB; }
  .rm-sw.ch { background: #FBBF24; border-color: #78350F; border-width: 2px; }
  .rm-sw.b  { background: #EFF6FF; border-color: #3B82F6; }
  .rm-sw.g  { background: #F0FDF4; border-color: #16A34A; }
  .rm-sw.hint { background: transparent; border: none; font-size: 0.7rem; color: #9CA3AF; width: auto; }

  /* ── Description panel (fixed right) ── */
  .rm-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 320px;
    background: #0F172A;
    color: #E2E8F0;
    padding: 40px 24px 32px;
    z-index: 9999;
    border-left: 3px solid #1D4ED8;
    transform: translateX(100%);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .rm-panel.open { transform: translateX(0); }
  .rm-panel-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  .rm-panel-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #F1F5F9;
    line-height: 1.3;
  }
  .rm-panel-close {
    background: none;
    border: none;
    color: #475569;
    font-size: 1rem;
    cursor: pointer;
    padding: 2px 4px;
    line-height: 1;
    flex-shrink: 0;
    margin-left: 12px;
    margin-top: 2px;
  }
  .rm-panel-close:hover { color: #94A3B8; }
  .rm-panel-body {
    font-size: 0.875rem;
    line-height: 1.7;
    color: #94A3B8;
  }
</style>

<div id="rm-root"></div>
<div id="rm-panel" class="rm-panel"><div class="rm-panel-head"><div class="rm-panel-title" id="rm-panel-title"></div><button class="rm-panel-close" id="rm-panel-close">✕</button></div><div class="rm-panel-body" id="rm-panel-body"></div></div>

<script src="/js/agent-engineering-roadmap.js"></script>

---

<style>
  /* ── Scoped callouts + badges for this post (aer- prefix) ── */
  .aer-callout {
    border-left: 3px solid; border-radius: 0 6px 6px 0;
    padding: 11px 15px; margin: 22px 0;
    font-size: 0.9rem; line-height: 1.62;
  }
  .aer-callout strong { font-weight: 700; }
  .aer-callout-key  { border-color: #1D4ED8; background: #EFF6FF; color: #1E3A8A; }
  .aer-callout-warn { border-color: #D97706; background: #FFFBEB; color: #92400E; }
  .aer-callout-cost { border-color: #7C3AED; background: #F5F3FF; color: #5B21B6; }

  .aer-table { width: 100%; border-collapse: collapse; font-size: 0.86rem; margin: 20px 0; }
  .aer-table th { background: #F9FAFB; padding: 9px 12px; text-align: left; font-weight: 700; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.04em; color: #374151; border-bottom: 2px solid #E5E7EB; }
  .aer-table td { padding: 9px 12px; border-bottom: 1px solid #F3F4F6; color: #374151; vertical-align: top; line-height: 1.5; }
  .aer-table tr:last-child td { border-bottom: none; }
  .aer-badge { display: inline-block; font-size: 0.64rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.03em; }
  .aer-badge-high { background: #D1FAE5; color: #065F46; }
  .aer-badge-med  { background: #FEF3C7; color: #92400E; }
  .aer-badge-low  { background: #FEE2E2; color: #B91C1C; }
</style>

## Chapter Notes

The map above is the territory in miniature. The notes below walk each chapter in order, filling in the concrete detail the nodes only gesture at.

### 1. Foundations — why agents are unreliable

An agent is **an LLM in a loop**: it calls a tool, observes the result, and decides what to do next, repeating until the task is done. The control flow belongs to the model, not to hard-coded branches. That single fact is the source of both its power and its unreliability.

Make it concrete. Ask an agent to "add rate limiting to the API." One run edits the existing middleware and writes a matching test. The next run installs a third-party library, refactors the router around it, and skips the test entirely. Same prompt, same starting code, two completely different trajectories — because the model samples a fresh path at every step, and small context differences cascade.

<div class="aer-callout aer-callout-warn">
  <strong>This non-determinism is the root problem the rest of the roadmap addresses.</strong> A related failure compounds it: vanilla agents keep no memory between runs, so an agent can nail a task once and fumble the identical task the next day. Every strategy that follows trades away some of the model's freedom to buy back predictability.
</div>

### 2. Determinism Strategies — the abstraction/control spectrum

How do you make an agent reliable? Butter's taxonomy sorts the whole field along one axis: **how much freedom you take away from the model**. At one end, workflow builders hard-code every step — fully deterministic, but you have to specify the entire process up front. At the other end, response caching leaves the agent loop completely untouched and intercepts at the network layer — maximum flexibility, but reliable cache hits are hard to engineer.

The table reads top-down from most control to most freedom. There is no winner; there is only a position on the axis that matches your task.

<table class="aer-table">
  <thead>
    <tr><th>Approach</th><th>How it works</th><th>Determinism</th><th>The trade-off</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Workflow builders</strong><br/><span style="color:#9CA3AF">n8n, DAG tools</span></td>
      <td>Every step hard-coded; the model fills slots, not control flow.</td>
      <td><span class="aer-badge aer-badge-high">High</span></td>
      <td>You must specify the whole process. Breaks on anything unforeseen.</td>
    </tr>
    <tr>
      <td><strong>Code generation</strong><br/><span style="color:#9CA3AF">Cloudflare Code Mode</span></td>
      <td>LLM writes a script once; you run that script deterministically many times.</td>
      <td><span class="aer-badge aer-badge-high">High</span></td>
      <td>Only fits tasks that reduce to reusable code. Stale scripts silently rot.</td>
    </tr>
    <tr>
      <td><strong>Script-agent fallback</strong><br/><span style="color:#9CA3AF">Browser Use Workflow</span></td>
      <td>Run a fixed script by default; drop into an agent loop only to self-heal when it breaks.</td>
      <td><span class="aer-badge aer-badge-med">Medium</span></td>
      <td>Two code paths to maintain. The healing path is still non-deterministic.</td>
    </tr>
    <tr>
      <td><strong>Learned skills</strong><br/><span style="color:#9CA3AF">Cursor Memory</span></td>
      <td>The agent detects a useful behavior and saves it for reuse in later runs.</td>
      <td><span class="aer-badge aer-badge-med">Medium</span></td>
      <td>Skills can be learned wrong, then confidently repeated. Needs curation.</td>
    </tr>
    <tr>
      <td><strong>Context engineering</strong><br/><span style="color:#9CA3AF">RAG, mem0</span></td>
      <td>Inject examples, SOPs, and domain knowledge; the model still decides each step.</td>
      <td><span class="aer-badge aer-badge-low">Low</span></td>
      <td>Guidance, not a guarantee. The model can ignore the context you gave it.</td>
    </tr>
    <tr>
      <td><strong>Response caching</strong><br/><span style="color:#9CA3AF">Butter.dev</span></td>
      <td>A proxy in front of the model caches and replays responses; the loop never notices.</td>
      <td><span class="aer-badge aer-badge-med">Medium</span></td>
      <td>Only deterministic on cache hits. Getting hit rates up is the hard part.</td>
    </tr>
  </tbody>
</table>

Most production systems land in the middle: inject explicit skills, or generate code once and replay it. That is why the next chapter zooms in on skills.

### 3. Claude Code Skills — controlling invocation

Skills are prompt-based slash commands defined in `SKILL.md` files. The instructions live in Markdown; a YAML frontmatter block controls how and when the skill runs. The critical design decision is **invocation control**: who is allowed to trigger this skill, the model or only you?

The default lets the model auto-invoke a skill whenever the description matches. That is convenient for read-only helpers and dangerous for anything with side effects. Two settings tighten the leash: `disable-model-invocation: true` means the skill runs only when you type its name, and `context: fork` runs it in an isolated subagent that never sees — and never pollutes — the main conversation history.

```yaml
---
name: deploy
description: Deploy to production
disable-model-invocation: true
context: fork
---
Deploy $ARGUMENTS: run tests → build → push → verify.
```

<div class="aer-callout aer-callout-key">
  <strong>Rule of thumb: gate side effects, free the readers.</strong> Anything that deploys, commits, or sends a message should set <code>disable-model-invocation: true</code> so timing stays in human hands. Read-only skills — search, summarize, explain — can stay auto-invocable, because the worst case is a wasted call, not a broken production system.
</div>

### 4. Harness Engineering — the repository is the memory

OpenAI's headline lesson: **treat `AGENTS.md` as a table of contents, not an encyclopedia.** Keep it near ~100 lines — a map with pointers into a structured `docs/` directory — rather than one monolithic instruction file. A giant `AGENTS.md` crowds out the actual task context, rots the moment code changes, and pushes the agent to pattern-match locally instead of navigating on purpose.

Underneath that tactic sits a deeper principle: **anything not in the repository does not exist for the agent.** Architecture decisions in a Slack thread, review feedback in a closed PR, a convention everyone "just knows" — from the running agent's point of view, none of it is real unless it can read it in-context. The harness discipline is to encode that knowledge into versioned files, then let custom linters and scheduled doc-gardening agents keep it from drifting.

<div class="aer-callout aer-callout-cost">
  <strong>What it costs.</strong> This rigor is not free. Splitting instructions across <code>docs/</code>, writing custom linters, and running gardening agents is real upfront investment that only pays back at scale. For a weekend script, a single short prompt beats a full harness. Reach for this chapter when many agents run against one codebase over months, not for a one-off task.
</div>

### 5. Production Systems — closing the loop

The [Everything-Claude-Code](https://github.com/affaan-m/everything-claude-code) toolkit turns the ideas above into a running feedback loop. `/learn` extracts reusable patterns from a finished session and stores them as confidence-scored **instincts**; `/evolve` clusters mature instincts into formal `SKILL.md` files. That is the "learned skills" strategy from Chapter 2, implemented end to end: the system watches how you work, then hardens what works into reusable skills.

The other production reality is cost. Long-running agents burn tokens fast, and three levers keep the bill sane:

<table class="aer-table">
  <thead>
    <tr><th>Lever</th><th>What to do</th><th>Why</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Model choice</strong></td><td>Default to <code>sonnet</code>; reserve <code>opus</code> for hard reasoning.</td><td>Sonnet covers most coding at a fraction of the cost.</td></tr>
    <tr><td><strong>Thinking budget</strong></td><td>Cap extended thinking near 10k tokens.</td><td>Cuts per-request thinking cost with little quality loss on routine work.</td></tr>
    <tr><td><strong>Context hygiene</strong></td><td><code>/compact</code> at task boundaries — never mid-implementation.</td><td>Frees context, but compacting mid-task drops file paths and state the agent still needs.</td></tr>
  </tbody>
</table>

The through-line holds to the end: you are not writing the code, you are engineering the environment — the skills it can call, the docs it can read, and the budget it runs under — so the model does reliable work inside it.
