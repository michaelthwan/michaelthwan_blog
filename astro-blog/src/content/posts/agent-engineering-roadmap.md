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

The five chapters below trace the full arc — from understanding why agents are unreliable, through the landscape of solutions, into the specifics of Claude Code's skill system, harness design principles from OpenAI's production experience, and finally the community tooling that ties it together.

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

## Chapter Notes

### 1. Foundations

An agent is an LLM in a loop: call a tool, observe the result, decide what to do next. The control flow is owned by the model — not hard-coded — which is both the source of its power and the source of unreliability. The same task, run twice, can produce completely different trajectories.

### 2. Determinism Strategies

Butter's taxonomy covers nine approaches along a single axis: **abstraction vs. control**. Workflow builders give you full determinism but require specifying every step upfront. Response caching preserves the agent loop but is hardest to achieve at scale. Most practical systems land in the middle — explicit skill injection or code generation.

### 3. Claude Code Skills

Skills are prompt-based slash commands defined in `SKILL.md` files. The critical design decision is **invocation control**: who triggers the skill? Use `disable-model-invocation: true` for anything with side effects. Use `context: fork` to run a skill in an isolated subagent that doesn't see the conversation history.

```yaml
---
name: deploy
description: Deploy to production
disable-model-invocation: true
context: fork
---
Deploy $ARGUMENTS: run tests → build → push → verify.
```

### 4. Harness Engineering

OpenAI's key lesson: **treat `AGENTS.md` as a table of contents, not an encyclopedia.** Keep it to ~100 lines with pointers to a structured `docs/` directory. The deeper principle: anything not in the repository doesn't exist for the agent. Architecture decisions, code review feedback, team conventions — encode them or lose them.

### 5. Production Systems

The [Everything-Claude-Code](https://github.com/affaan-m/everything-claude-code) toolkit closes the feedback loop: `/learn` extracts patterns from your sessions into instincts, `/evolve` clusters instincts into formal skills. This directly implements the "learned skills" approach from Chapter 2.

Token cost is real at scale. Default to `sonnet`, cap thinking at 10k tokens, and `/compact` at logical task boundaries — after research, after a milestone, never mid-implementation.
