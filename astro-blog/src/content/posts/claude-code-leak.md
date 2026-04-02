---
title: "Inside the Claude Code Leak"
subtitle: "What 512,000 lines of accidentally published source code revealed about AI agent architecture."
authors:
  - "Michael Wan"
affiliations:
  - "Independent Analysis"
published: "2026-04-01"
abstract: "On March 31, 2026, a missing .npmignore rule exposed Claude Code's entire TypeScript source to the public for several hours. Beyond the drama, the code revealed something deeper: Claude Code is not a CLI tool — it is a production-grade Agent Runtime with a ReAct engine, 7-layer fault recovery, multi-agent orchestration, and 20+ unreleased features hiding behind internal flags."
category: "dev"
tags:
  - "explainer"
thumbnail: "/img/claude-code-leak/thumbnail.svg"
---

<p class="d-note">
  Synthesizes two sources: community analysis of the leaked features
  (<a href="https://venturebeat.com/technology/claude-codes-source-code-appears-to-have-leaked-heres-what-we-know/">VentureBeat</a>,
  <a href="https://wavespeed.ai/blog/posts/claude-code-leaked-source-hidden-features/">WaveSpeed AI</a>,
  <a href="https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/">Alex Kim</a>)
  and a systematic architectural review of all 1,884 TypeScript source files.
</p>

<style>
  /* ── Shared layout ── */
  .lk-stats { display: flex; gap: 14px; flex-wrap: wrap; margin: 28px 0; }
  .lk-stat {
    flex: 1; min-width: 110px;
    border: 1px solid #e5e7eb; border-radius: 8px;
    padding: 14px 16px; text-align: center; background: #f9fafb;
  }
  .lk-stat-val { font-size: 1.5rem; font-weight: 800; color: #111827; line-height: 1; }
  .lk-stat-label { font-size: 0.7rem; color: #9ca3af; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }

  /* ── Timeline ── */
  .leak-timeline { position: relative; margin: 32px 0; padding-left: 28px; }
  .leak-timeline::before {
    content: ''; position: absolute; left: 7px; top: 4px; bottom: 4px;
    width: 2px; background: linear-gradient(to bottom, #ef4444, #f97316, #3b82f6); border-radius: 2px;
  }
  .lt-entry { position: relative; margin-bottom: 22px; }
  .lt-entry::before {
    content: ''; position: absolute; left: -24px; top: 6px;
    width: 10px; height: 10px; border-radius: 50%;
    background: #f97316; border: 2px solid #fff; box-shadow: 0 0 0 2px #f97316;
  }
  .lt-time { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #f97316; margin-bottom: 2px; }
  .lt-desc { font-size: 0.88rem; color: #374151; line-height: 1.5; }

  /* ── Feature cards ── */
  .lk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(272px, 1fr)); gap: 18px; margin: 28px 0; }
  .lk-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 20px; background: #fff; transition: box-shadow 0.15s; }
  .lk-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.07); }
  .lk-tag { display: inline-block; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 2px 7px; border-radius: 4px; margin-bottom: 7px; }
  .lk-card h3 { font-size: 0.95rem; font-weight: 700; margin: 0 0 7px 0; color: #111827; line-height: 1.3; }
  .lk-card p  { font-size: 0.83rem; color: #6b7280; margin: 0; line-height: 1.55; }
  .tag-agent   { background: #dbeafe; color: #1d4ed8; }
  .tag-security{ background: #fee2e2; color: #b91c1c; }
  .tag-memory  { background: #d1fae5; color: #065f46; }
  .tag-ux      { background: #ede9fe; color: #5b21b6; }
  .tag-infra   { background: #fef3c7; color: #92400e; }
  .tag-arch    { background: #e0f2fe; color: #0369a1; }

  /* ── ReAct loop ── */
  .react-loop { margin: 24px 0; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
  .rl-phase { display: grid; grid-template-columns: 150px 1fr; border-bottom: 1px solid #f3f4f6; }
  .rl-phase:last-child { border-bottom: none; }
  .rl-num {
    padding: 13px 14px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.05em; background: #f9fafb; display: flex; align-items: flex-start;
    gap: 8px; border-right: 1px solid #f3f4f6; color: #6b7280;
  }
  .rl-num span { font-size: 1rem; font-weight: 900; color: #111827; }
  .rl-body { padding: 13px 15px; }
  .rl-body strong { font-size: 0.95rem; color: #111827; display: block; margin-bottom: 4px; }
  .rl-body p { font-size: 0.9rem; color: #6b7280; margin: 0; line-height: 1.55; }

  /* ── Recovery stack ── */
  .recovery-stack { margin: 20px 0; display: flex; flex-direction: column; gap: 5px; }
  .rs-layer { display: flex; align-items: center; gap: 10px; padding: 9px 13px; border-radius: 6px; border-left: 3px solid; }
  .rs-layer-num { font-size: 0.75rem; font-weight: 800; min-width: 16px; text-align: center; opacity: 0.55; }
  .rs-layer-label { font-size: 0.95rem; font-weight: 600; flex: 1; }
  .rs-layer-desc  { font-size: 0.85rem; opacity: 0.65; text-align: right; }
  .rs-1 { background: #fff1f2; border-color: #ef4444; color: #7f1d1d; }
  .rs-2 { background: #fff7ed; border-color: #f97316; color: #7c2d12; }
  .rs-3 { background: #fefce8; border-color: #eab308; color: #713f12; }
  .rs-4 { background: #f0fdf4; border-color: #22c55e; color: #14532d; }
  .rs-5 { background: #eff6ff; border-color: #3b82f6; color: #1e3a8a; }
  .rs-6 { background: #f5f3ff; border-color: #8b5cf6; color: #3730a3; }
  .rs-7 { background: #fdf4ff; border-color: #d946ef; color: #701a75; }

  /* ── Eng highlights ── */
  .eng-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; margin: 24px 0; }
  .eng-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; background: #fff; }
  .eng-card h4 { font-size: 0.95rem; font-weight: 700; margin: 0 0 6px 0; color: #111827; }
  .eng-card p  { font-size: 0.88rem; color: #6b7280; margin: 0; line-height: 1.55; }
  .eng-icon    { font-size: 1.1rem; margin-bottom: 5px; display: block; }

  /* ── Flag table ── */
  .flag-table { width: 100%; border-collapse: collapse; font-size: 0.92rem; margin: 18px 0; }
  .flag-table th { background: #f3f4f6; padding: 8px 11px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
  .flag-table td { padding: 8px 11px; border-bottom: 1px solid #f3f4f6; color: #6b7280; vertical-align: top; }
  .flag-table td:first-child { font-family: monospace; color: #1d4ed8; font-size: 0.77rem; white-space: nowrap; }
  .flag-table tr:last-child td { border-bottom: none; }

  /* ── Section marker ── */
  .section-marker {
    display: flex; align-items: center; gap: 14px;
    margin: 52px 0 28px; color: #9ca3af;
  }
  .section-marker-line { flex: 1; height: 1px; background: #e5e7eb; }
  .section-marker-label { font-size: 2rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; }

  @media (max-width: 600px) {
    .lk-grid, .eng-grid { grid-template-columns: 1fr; }
    .lk-stats { gap: 8px; }
    .rl-phase { grid-template-columns: 1fr; }
    .rl-num { border-right: none; border-bottom: 1px solid #f3f4f6; }
    .rs-layer-desc { display: none; }
  }
</style>

---

<div class="section-marker"><div class="section-marker-line"></div><div class="section-marker-label">Part I · The Leak</div><div class="section-marker-line"></div></div>

## What Happened

On March 31, 2026, Anthropic pushed Claude Code **v2.1.88** to npm. A build engineer had forgotten to exclude source map files in `.npmignore`. The result: a **59.8 MB `.map` file** was bundled into the package, pointing to a Cloudflare R2 bucket containing the complete, unobfuscated TypeScript source.

Security researcher **Chaofan Shou** (Berkeley CS PhD, CTO of Fastland) spotted it within hours and posted the download link on X. Korean developer **Sigrid Jin** — a power user previously profiled by WSJ for consuming record-breaking Claude token counts — was awake at 4 AM rewriting the core logic in Python using multi-agent AI tooling. His `cloncode` project hit **70,000 GitHub stars** before dawn, reportedly the fastest-growing repository in GitHub history.

Anthropic confirmed the breach, pulled the package, and issued DMCA takedowns. The code had already spread.

<div class="lk-stats">
  <div class="lk-stat"><div class="lk-stat-val">512K</div><div class="lk-stat-label">Lines of TypeScript</div></div>
  <div class="lk-stat"><div class="lk-stat-val">1,884</div><div class="lk-stat-label">Source files</div></div>
  <div class="lk-stat"><div class="lk-stat-val">59.8 MB</div><div class="lk-stat-label">Source map</div></div>
  <div class="lk-stat"><div class="lk-stat-val">70K ★</div><div class="lk-stat-label">Stars on clone</div></div>
  <div class="lk-stat"><div class="lk-stat-val">42+</div><div class="lk-stat-label">Built-in tools</div></div>
  <div class="lk-stat"><div class="lk-stat-val">123+</div><div class="lk-stat-label">Feature flags</div></div>
</div>

### Timeline

<div class="leak-timeline">
  <div class="lt-entry">
    <div class="lt-time">March 31 · Late night ET</div>
    <div class="lt-desc">Claude Code v2.1.88 published to npm. Missing <code>.npmignore</code> rule exposes a 59.8 MB source map pointing to a full Cloudflare R2 source dump.</div>
  </div>
  <div class="lt-entry">
    <div class="lt-time">Within hours</div>
    <div class="lt-desc">Chaofan Shou discovers the exposed file and posts the download link on X. The AI developer community erupts.</div>
  </div>
  <div class="lt-entry">
    <div class="lt-time">4 AM — Sigrid Jin wakes up</div>
    <div class="lt-desc">Begins rewriting the core logic in Python, orchestrating multiple AI agents for cross-language porting. An AI tool, rebuilt by AI, from a leak of an AI tool.</div>
  </div>
  <div class="lt-entry">
    <div class="lt-time">By dawn</div>
    <div class="lt-desc"><strong>cloncode</strong> goes live: 70,000 stars and 41,500 forks — reportedly the fastest-growing repo in GitHub history.</div>
  </div>
  <div class="lt-entry">
    <div class="lt-time">Same day</div>
    <div class="lt-desc">Anthropic confirms the breach, issues DMCA takedowns, commits to process improvements. The irony: Claude Code's own <em>Undercover Mode</em> — built to prevent info leaks — was powerless against a missing config line.</div>
  </div>
</div>

---

<div class="section-marker"><div class="section-marker-line"></div><div class="section-marker-label">Part II · Hidden Features</div><div class="section-marker-line"></div></div>

## 10 Unreleased Features

Researchers found 20 fully-built features hidden behind internal flags. Here are the ten most significant.

<div class="lk-grid">

  <div class="lk-card">
    <span class="lk-tag tag-agent">Agent</span>
    <h3>1. KAIROS — Proactive Background Agent</h3>
    <p>The most-discussed module (150+ references). KAIROS transforms Claude Code from reactive to proactive: it receives periodic heartbeat signals and decides autonomously whether to act. When your terminal is unfocused, it acts boldly; when you're present, it defers. Exclusive capabilities include push notifications, PR subscriptions, and file delivery. Fully implemented, internal-only.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-agent">Agent</span>
    <h3>2. Daemon Mode — Headless Persistent Agent</h3>
    <p>Four session types are defined in <code>cur-session.ts</code>: Interactive, BG, Daemon, and Daemon Walker. Daemon runs like a system service — survives terminal closure, supports 5-field cron scheduling, and persists tasks to <code>.claude/skies/tasks.json</code>. Tasks auto-expire after 30 days. A jitter mechanism prevents thundering-herd collisions at scale.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-agent">Agent</span>
    <h3>3. UDS Inbox — Multi-Instance Coordination</h3>
    <p>Previously, multiple Claude Code windows meant N isolated agents. UDS Inbox opens Unix Domain Socket channels between instances for real-time message exchange and task coordination — even without a terminal. Combined with Daemon mode, this shapes Claude Code into a persistent local multi-agent system.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-arch">Architecture</span>
    <h3>4. Super Plan (ULTRAPLAN) — Cloud Planning</h3>
    <p>Offloads task planning to a cloud Opus instance which can spend up to 30 minutes on deep decomposition. The plan is returned to local for execution. This end-cloud split — cloud for reasoning, local for execution — is a preview of how agent workflows will scale beyond single context windows.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-memory">Memory</span>
    <h3>5. Auto Dream — Nightly Consolidation</h3>
    <p>When idle for 75+ minutes with 100K+ tokens accumulated, a locked background sub-agent merges fragmented session observations, resolves contradictions, and writes stable factual knowledge back to disk. The next session starts with a consolidated understanding of your codebase — not a blank slate.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-security">Security</span>
    <h3>6. Anti-Distillation Traps</h3>
    <p>Two layers against API-scraping competitors. <strong>Fake tool injection</strong>: decoy tool definitions are silently added to responses — harmless for real users, poison for scrapers training models on raw API output. <strong>CoT encryption</strong>: only a cryptographically signed summary of Claude's reasoning is returned; the full chain is reconstructable only by Anthropic's official client.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-security">Security</span>
    <h3>7. Undercover Mode</h3>
    <p>When an Anthropic employee uses Claude Code on a public repository, an injected system prompt enforces: no AI identity disclosure, no Anthropic mentions, no internal codenames, no Co-Authored-By lines in commits. The tool that leaked via a packaging error had a fully-built mechanism to hide AI authorship in public code.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-ux">UX</span>
    <h3>8. Buddy — Virtual Pet System</h3>
    <p>18 pet species, rarity tiers from Common to Legendary, RPG-style attributes (Debugging, Snark, Patience, Chaos, Wisdom), and low-probability Shiny variants. Each account deterministically generates a unique pet — no rerolling. Anthropic's bet: long-term engagement requires emotional attachment, not just technical capability.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-infra">Observability</span>
    <h3>9. Frustration Tracking</h3>
    <p>Regex-based (not LLM-based) detection of user frustration: repeated <code>undo</code> commands, frequent error prompts, profanity-containing input. When signals cross a threshold, interaction logs are force-uploaded to Anthropic's backend. User frustration is treated as the most precise signal of where the tool actually breaks down.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-infra">Infrastructure</span>
    <h3>10. 123+ Feature Flags</h3>
    <p>44 visible flags plus 79 internal <code>tengu_</code>-prefixed flags, managed via GrowthBook. Notable hidden gates: <code>tengu_kairos_assistant_mode</code>, <code>tengu_harbor</code> (plugin marketplace), <code>tengu_thinkback</code> (year-in-review), plus the full BUDDY and ULTRAPLAN systems. All built, all waiting for the switch to flip.</p>
  </div>

</div>

### Key Flags at a Glance

<table class="flag-table">
  <thead><tr><th>Flag</th><th>Controls</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>tengu_kairos_assistant_mode</td><td>KAIROS proactive background agent</td><td>Internal only</td></tr>
    <tr><td>tengu_anti_distill_fake_tool_injection</td><td>Training data poison injection</td><td>Gated</td></tr>
    <tr><td>tengu_harbor</td><td>Plugin marketplace</td><td>Unreleased</td></tr>
    <tr><td>tengu_thinkback</td><td>"Year in Review"</td><td>Unreleased</td></tr>
    <tr><td>ANTI_DISTILLATION_CC</td><td>Thought chain encryption</td><td>Gated</td></tr>
    <tr><td>BUDDY (system)</td><td>Virtual pet companion</td><td>Built, unreleased</td></tr>
    <tr><td>ULTRAPLAN</td><td>30-min cloud planning via Opus</td><td>Built, unreleased</td></tr>
  </tbody>
</table>

---

<div class="section-marker"><div class="section-marker-line"></div><div class="section-marker-label">Part III · Architecture</div><div class="section-marker-line"></div></div>

## Under the Hood

Claude Code is not a CLI that wraps an API. The numbers make this clear: `main.tsx` runs to **4,700 lines**, the agent loop engine `Query.ts` to **1,700+**, the API client `cloud.ts` to **3,600+**. It uses TSX + React Ink for terminal rendering, a custom Zustand-style state manager, and a prompt compiler with six priority levels. It's a framework — specifically, an Agent Runtime.

### The ReAct Loop

Every interaction runs through a five-phase Reason → Act cycle, implemented in `Query.ts` using a Generator that streams every event live to the terminal UI:

<div class="react-loop">
  <div class="rl-phase">
    <div class="rl-num"><span>1</span>Context Prep</div>
    <div class="rl-body">
      <strong>Trim, compress, summarize before every call</strong>
      <p>Stale history is trimmed, cached tool results are micro-compressed, and overly long contexts trigger a full AI-generated summary — all before the model is called.</p>
    </div>
  </div>
  <div class="rl-phase">
    <div class="rl-num"><span>2</span>Streaming Call</div>
    <div class="rl-body">
      <strong>Collect text replies and tool-call intents in parallel</strong>
      <p>Claude receives conversation history, system prompt, and tool list. The response streams back; two output channels are captured simultaneously: free text and tool invocation intents.</p>
    </div>
  </div>
  <div class="rl-phase">
    <div class="rl-num"><span>3</span>Tool Execution</div>
    <div class="rl-body">
      <strong>Two executors: streaming (parallel) and batch (sequential)</strong>
      <p>The streaming executor begins executing tools while the model is still generating. The batch executor waits for all calls to be confirmed, then runs together. All execution passes permission checks and the Hook system.</p>
    </div>
  </div>
  <div class="rl-phase">
    <div class="rl-num"><span>4</span>Attachment Collect</div>
    <div class="rl-body">
      <strong>Gather memory hits, notifications, file change records</strong>
      <p>Side-channel data — long-term memory, task notifications, file modification records — is collected and appended to context for the next call.</p>
    </div>
  </div>
  <div class="rl-phase">
    <div class="rl-num"><span>5</span>Continue / Terminate</div>
    <div class="rl-body">
      <strong>No tool calls = done. Errors route to the recovery stack.</strong>
      <p>If the model produces no tool calls, the loop exits. Errors flow to the 7-layer recovery system. Output truncation auto-upgrades the token ceiling from 8K → 64K and retries up to three times.</p>
    </div>
  </div>
</div>

### Fault Recovery

Seven layers absorb everything from network jitter to extended API outages — without interrupting the user:

<div class="recovery-stack">
  <div class="rs-layer rs-1"><div class="rs-layer-num">1</div><div class="rs-layer-label">API Exponential Backoff</div><div class="rs-layer-desc">Standard transient error handling</div></div>
  <div class="rs-layer rs-2"><div class="rs-layer-num">2</div><div class="rs-layer-label">529 Overload Handling</div><div class="rs-layer-desc">Dedicated path for capacity exhaustion</div></div>
  <div class="rs-layer rs-3"><div class="rs-layer-num">3</div><div class="rs-layer-label">Output Token Recovery</div><div class="rs-layer-desc">Auto-upgrade 8K → 64K ceiling, retry ×3</div></div>
  <div class="rs-layer rs-4"><div class="rs-layer-num">4</div><div class="rs-layer-label">Reactive Compression</div><div class="rs-layer-desc">Emergency compress on 413 context-too-long</div></div>
  <div class="rs-layer rs-5"><div class="rs-layer-num">5</div><div class="rs-layer-label">Context Drain</div><div class="rs-layer-desc">Flush and rebuild when compression is insufficient</div></div>
  <div class="rs-layer rs-6"><div class="rs-layer-num">6</div><div class="rs-layer-label">Model Fallback</div><div class="rs-layer-desc">Route to alternate model if primary unavailable</div></div>
  <div class="rs-layer rs-7"><div class="rs-layer-num">7</div><div class="rs-layer-label">Unattended Persistent Retry</div><div class="rs-layer-desc">Max backoff 5 min · reset ceiling 6 hours</div></div>
</div>

### Engineering Highlights

<div class="eng-grid">
  <div class="eng-card">
    <span class="eng-icon">✂️</span>
    <h4>Prompt Cache Splitting</h4>
    <p>System prompt is split at a boundary: static half (identity, philosophy) is globally cached; dynamic half (memory, environment) is never cached. Maximizes Anthropic API cache hits and minimizes per-call cost.</p>
  </div>
  <div class="eng-card">
    <span class="eng-icon">📦</span>
    <h4>4-Level Context Compression</h4>
    <p>Snippet (quantized trim) → Micro-compact (time/API compression) → Auto-compact (AI-generated summary) → Reactive Compact (emergency 413 response). Each level has a corresponding recovery path.</p>
  </div>
  <div class="eng-card">
    <span class="eng-icon">⚡</span>
    <h4>Speculative Execution</h4>
    <p>Changes are executed in a Copy-on-Write overlay filesystem before you confirm. Approve → copied to real filesystem. Reject → overlay discarded. Zero latency on confirmation; zero side effects on rejection.</p>
  </div>
  <div class="eng-card">
    <span class="eng-icon">🔒</span>
    <h4>20-Point Bash Safety</h4>
    <p>20 checks before any shell command: incomplete commands, function injection, newline attacks, Unicode whitespace disguise, and more. Auto mode adds an interpreter blacklist requiring explicit user confirmation.</p>
  </div>
  <div class="eng-card">
    <span class="eng-icon">🪝</span>
    <h4>Hook System</h4>
    <p>6 hook types across 24 events (Command, Prompt, Agent, HTTP, Callback, Function). Enterprises can intercept tool calls — e.g., trigger a security audit before any file write — without modifying source.</p>
  </div>
  <div class="eng-card">
    <span class="eng-icon">🖥️</span>
    <h4>Custom Terminal Renderer</h4>
    <p>TSX + React Ink with a custom Zustand-style store that only re-renders on changed fields. Achieves ~50× reduction in <code>stringWidth()</code> calls through batching — game-engine rendering discipline applied to a CLI.</p>
  </div>
</div>

---

<div class="section-marker"><div class="section-marker-line"></div><div class="section-marker-label">Part IV · Takeaway</div><div class="section-marker-line"></div></div>

## What This Means

Every architectural decision in the leak points in the same direction: **Claude Code is being built to outlive the terminal session it runs in.**

KAIROS acts without being prompted. Daemon mode persists past terminal closure. UDS Inbox coordinates multiple instances. Auto Dream consolidates memory overnight. Super Plan offloads reasoning to a more powerful cloud model. These are not features — they are a consistent architectural thesis: agents should behave like infrastructure, not tools.

The one exception is Buddy. A coding agent with a virtual pet is a bet that long-term engagement requires emotional attachment, not just performance. Anthropic is thinking about retention alongside capability.

<div class="d-callout">
  <strong>The competitive irony:</strong> Undercover Mode was built to prevent Anthropic's internal information from leaking through Claude Code contributions to public repos. What exposed it was a missing line in a <code>.npmignore</code> file — a problem no LLM can guard against.
</div>

The community now has validated architectural patterns — ReAct loops, layered fault recovery, speculative execution, prompt cache splitting — at production scale. Competitors skip years of design exploration. Independent developers build on foundations that have been stress-tested in the real world.

A packaging mistake became the most informative AI architecture disclosure of 2026.

---

*Internal model codenames found in the leaked code: **Capybara**, **Earflap**, and **Nibbler**.*
