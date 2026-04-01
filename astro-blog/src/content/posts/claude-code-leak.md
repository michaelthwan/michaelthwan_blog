---
title: "Inside the Claude Code Leak"
subtitle: "What 512,000 lines of accidentally published source code revealed about AI agent architecture."
authors:
  - "Michael Wan"
affiliations:
  - "Independent Analysis"
published: "2026-04-01"
abstract: "On March 31, 2026, a missing .npmignore rule exposed Claude Code's entire source code to the public for several hours. The leak revealed KAIROS (a proactive background agent), Daemon mode, multi-instance UDS Inbox, anti-distillation traps, Undercover Mode, a virtual pet system, and more — painting the clearest picture yet of where AI agents are heading."
category: "dev"
tags:
  - "explainer"
thumbnail: "/img/claude-code-leak/thumbnail.svg"
---

<p class="d-note">
  This article synthesizes the Claude Code source code leak of March 31, 2026. Primary sources:
  a <a href="https://venturebeat.com/technology/claude-codes-source-code-appears-to-have-leaked-heres-what-we-know/">VentureBeat breakdown</a>,
  <a href="https://wavespeed.ai/blog/posts/claude-code-leaked-source-hidden-features/">WaveSpeed AI's feature analysis</a>,
  <a href="https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/">Alex Kim's technical deep-dive</a>,
  and <a href="https://read.engineerscodex.com/p/diving-into-claude-codes-source-code">Engineers Codex</a>.
  All code-level details are sourced from those analyses.
</p>

## The Accident

It started with a missing line in a config file.

On March 31, 2026, Anthropic pushed Claude Code **v2.1.88** to the public npm registry as part of a routine release. A build engineer had forgotten to add a `.npmignore` exclusion rule for source map files. The result: a **59.8 MB `.map` file** was bundled into the published package. That file contained a pointer to a Cloudflare R2 object storage bucket — which held the complete, unobfuscated TypeScript source code of Claude Code.

**512,000 lines. 1,900 files. Exposed for several hours.**

Security researcher and Berkeley CS PhD **Chaofan Shou** spotted it first. He posted the download link publicly on X. Within hours, Korean developer **Sigrid Jin** — a power user who had consumed millions of Claude Code tokens over the prior year — was awake at 4 AM rewriting the core logic in Python. His `cloncode` project hit GitHub and accumulated **70,000 stars** before the morning was out, reportedly the fastest-growing repository in GitHub history.

Anthropic confirmed the incident, pulled the package, and issued DMCA takedowns. But the code had spread. And with it: an unprecedented view inside the best coding agent in the industry.

<style>
  /* ── Timeline ── */
  .leak-timeline {
    position: relative;
    margin: 40px 0;
    padding-left: 28px;
  }
  .leak-timeline::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 4px;
    bottom: 4px;
    width: 2px;
    background: linear-gradient(to bottom, #ef4444, #f97316, #3b82f6);
    border-radius: 2px;
  }
  .lt-entry {
    position: relative;
    margin-bottom: 24px;
  }
  .lt-entry::before {
    content: '';
    position: absolute;
    left: -24px;
    top: 6px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #f97316;
    border: 2px solid #fff;
    box-shadow: 0 0 0 2px #f97316;
  }
  .lt-time {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #f97316;
    margin-bottom: 2px;
  }
  .lt-desc {
    font-size: 0.9rem;
    color: #374151;
    line-height: 1.5;
  }

  /* ── Feature cards grid ── */
  .lk-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin: 32px 0;
  }
  .lk-card {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 20px 22px;
    background: #fff;
    transition: box-shadow 0.15s;
  }
  .lk-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }
  .lk-tag {
    display: inline-block;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 2px 8px;
    border-radius: 4px;
    margin-bottom: 8px;
  }
  .lk-card h3 {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: #111827;
    line-height: 1.3;
  }
  .lk-card p {
    font-size: 0.85rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.55;
  }
  .tag-agent   { background: #dbeafe; color: #1d4ed8; }
  .tag-security{ background: #fee2e2; color: #b91c1c; }
  .tag-memory  { background: #d1fae5; color: #065f46; }
  .tag-ux      { background: #ede9fe; color: #5b21b6; }
  .tag-infra   { background: #fef3c7; color: #92400e; }
  .tag-arch    { background: #e0f2fe; color: #0369a1; }

  /* ── Stat row ── */
  .lk-stats {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin: 28px 0;
  }
  .lk-stat {
    flex: 1;
    min-width: 130px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px 18px;
    text-align: center;
    background: #f9fafb;
  }
  .lk-stat-val {
    font-size: 1.6rem;
    font-weight: 800;
    color: #111827;
    line-height: 1;
  }
  .lk-stat-label {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ── Flag table ── */
  .flag-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    margin: 20px 0;
  }
  .flag-table th {
    background: #f3f4f6;
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
  }
  .flag-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #f3f4f6;
    color: #6b7280;
    vertical-align: top;
  }
  .flag-table td:first-child {
    font-family: monospace;
    color: #1d4ed8;
    font-size: 0.8rem;
    white-space: nowrap;
  }
  .flag-table tr:last-child td { border-bottom: none; }

  /* ── Section divider ── */
  .lk-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 48px 0 32px;
  }
  .lk-divider-num {
    font-size: 2rem;
    font-weight: 900;
    color: #e5e7eb;
    line-height: 1;
    min-width: 32px;
  }
  .lk-divider-line {
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  /* Session type diagram */
  .session-diagram {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin: 24px 0;
  }
  .sd-box {
    border-radius: 8px;
    padding: 14px 16px;
    border: 1px solid;
  }
  .sd-box h4 {
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 4px 0;
  }
  .sd-box p {
    font-size: 0.78rem;
    margin: 0;
    opacity: 0.8;
    line-height: 1.45;
  }
  .sd-interactive { border-color: #3b82f6; background: #eff6ff; color: #1e40af; }
  .sd-bg          { border-color: #10b981; background: #ecfdf5; color: #064e3b; }
  .sd-daemon      { border-color: #8b5cf6; background: #f5f3ff; color: #3730a3; }
  .sd-walker      { border-color: #f59e0b; background: #fffbeb; color: #78350f; }

  @media (max-width: 600px) {
    .lk-grid { grid-template-columns: 1fr; }
    .session-diagram { grid-template-columns: 1fr; }
    .lk-stats { gap: 10px; }
  }
</style>

## The Numbers

<div class="lk-stats">
  <div class="lk-stat">
    <div class="lk-stat-val">512K</div>
    <div class="lk-stat-label">Lines of TypeScript</div>
  </div>
  <div class="lk-stat">
    <div class="lk-stat-val">1,900</div>
    <div class="lk-stat-label">Source files</div>
  </div>
  <div class="lk-stat">
    <div class="lk-stat-val">59.8 MB</div>
    <div class="lk-stat-label">Source map size</div>
  </div>
  <div class="lk-stat">
    <div class="lk-stat-val">70K ★</div>
    <div class="lk-stat-label">GitHub stars on clone</div>
  </div>
  <div class="lk-stat">
    <div class="lk-stat-val">44 + 79</div>
    <div class="lk-stat-label">Feature flags (visible + hidden)</div>
  </div>
</div>

## The Timeline

<div class="leak-timeline">
  <div class="lt-entry">
    <div class="lt-time">March 31 · Late night ET</div>
    <div class="lt-desc">Anthropic publishes Claude Code v2.1.88 to npm. A missing <code>.npmignore</code> rule includes a 59.8 MB source map pointing to a Cloudflare R2 bucket containing the full source.</div>
  </div>
  <div class="lt-entry">
    <div class="lt-time">Within hours</div>
    <div class="lt-desc">Security researcher <strong>Chaofan Shou</strong> (Star Labs / Fastland CTO, Berkeley CS PhD) discovers the exposed file and posts the download link publicly on X. The AI developer community erupts.</div>
  </div>
  <div class="lt-entry">
    <div class="lt-time">4 AM — Sigrid Jin wakes up</div>
    <div class="lt-desc">Korean developer and Claude Code power user Sigrid Jin — previously profiled by WSJ for consuming record-breaking Claude token counts — begins rewriting the core logic in Python.</div>
  </div>
  <div class="lt-entry">
    <div class="lt-time">By dawn</div>
    <div class="lt-desc"><strong>cloncode</strong> is live on GitHub. It accumulates 70,000 stars and 41,500 forks, reportedly the fastest-growing repo in GitHub history.</div>
  </div>
  <div class="lt-entry">
    <div class="lt-time">Same day — Anthropic responds</div>
    <div class="lt-desc">Anthropic publicly confirms the breach, describes it as a packaging error, issues DMCA takedowns, and commits to process improvements. The irony: Claude Code's own <em>Undercover Mode</em> — designed to prevent leaking internal info — could not guard against a misplaced build rule.</div>
  </div>
</div>

---

## Top 10 Findings from the Leak

The real story is not the leak itself — it's what was inside. Researchers spent days combing through the code and surfaced a detailed picture of Anthropic's engineering decisions, unreleased features, and competitive defenses. Here are the ten most significant findings.

<div class="lk-grid">

  <div class="lk-card">
    <span class="lk-tag tag-agent">Agent</span>
    <h3>1. KAIROS — The Always-On Background Agent</h3>
    <p>The single most-discussed module. KAIROS (from Greek "the right moment") transforms Claude Code from a reactive tool into a proactive background assistant. It receives periodic heartbeat signals and autonomously decides: <em>is there something useful I can do right now?</em> If yes, it acts. If no, it calls a <code>Sleep</code> tool and waits for the next pulse. Mentioned 150+ times in the codebase. Currently locked to Anthropic internal employees only, but fully implemented.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-agent">Agent</span>
    <h3>2. Daemon Mode — Headless, Always-Running Agent</h3>
    <p>The codebase defines four session types: <strong>Interactive</strong> (you're at the terminal), <strong>BG</strong> (background), <strong>Daemon</strong> (pure headless executor), and <strong>Daemon Walker</strong> (task-executing daemon). Daemon mode persists like a database service — it doesn't die when you close your terminal. It supports full cron scheduling (5-field expressions, local timezone), tasks that auto-expire after 30 days, and persistence to <code>.claude/skies/tasks.json</code> so it survives process restarts.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-agent">Agent</span>
    <h3>3. UDS Inbox — Multi-Instance Communication</h3>
    <p>Previously, running multiple Claude Code windows meant running N fully isolated agents. UDS Inbox changes that: it creates a Unix Domain Socket channel between instances so they can exchange messages and coordinate tasks in real time — even with no terminal attached. Combined with Daemon mode, this enables a local multi-agent system that's persistent and collaborative, not just parallel.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-arch">Architecture</span>
    <h3>4. Super Plan (ULTRAPLAN) — Cloud-Powered Planning</h3>
    <p>For complex tasks, Super Plan offloads the <em>planning</em> step to a more powerful cloud model (Claude Opus) which can spend up to 30 minutes on deep exploration and task decomposition. The resulting plan is returned to the local terminal for execution. This end-cloud split is a deliberate architectural choice: use the cloud's superior reasoning for high-level planning, use local for fast, context-aware execution.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-memory">Memory</span>
    <h3>5. Auto Dream — Nightly Context Consolidation</h3>
    <p>Named intentionally: when you stop using Claude Code, it "dreams" — running a background process that merges fragmented observations, resolves logical contradictions between sessions, and converts vague notes into stable factual knowledge. It triggers after 75 minutes of idle + 100K tokens accumulated. A restricted sub-agent with process-level locking does the consolidation, writing clean memory back to disk for future sessions.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-security">Security</span>
    <h3>6. Anti-Distillation: Fake Tools + Encrypted Reasoning</h3>
    <p>A two-layer defense against competitors scraping API traffic to train competing models. <strong>Fake tool injection</strong>: when the flag <code>ANTI_DISTILLATION_CC</code> is active, the server silently adds decoy tool definitions that corrupt training data for anyone recording raw API responses. <strong>Thought chain encryption</strong>: the API returns only a signed summary of Claude's reasoning — Anthropic's official client can reconstruct the full chain, but third-party scrapers only get the summary, never the actual CoT steps.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-security">Security</span>
    <h3>7. Undercover Mode — Hiding AI Identity in Open Source</h3>
    <p>When an Anthropic employee uses Claude Code on a non-internal repository, the system enters "Undercover Mode." Code comments explicitly state: <em>do not reveal your AI identity, do not mention Anthropic, do not include internal model codenames (Capybara, Tengu), remove Co-Authored-By lines from commits.</em> The system prompt is injected to enforce this. The same tool that leaked through a packaging error had a fully built mechanism to hide AI authorship in public code.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-ux">UX</span>
    <h3>8. Buddy — The Virtual Pet System</h3>
    <p>One of the more surprising finds: a complete virtual companion system with 18 pet species, rarity tiers from Common to Legendary, RPG-style attributes (Debugging, Snark, Patience, Chaos, Wisdom), and low-probability Shiny variants. Each user account deterministically generates a unique pet — no rerolling. This isn't a gimmick; it's a deliberate product decision to build emotional attachment and long-term retention into a coding tool.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-infra">Infrastructure</span>
    <h3>9. Frustration Tracking — Regex-Based Emotion Detection</h3>
    <p>Rather than running expensive sentiment LLM calls, Claude Code uses regex pattern matching to detect user frustration: repeated <code>undo</code> commands, frequent error prompts, and profanity-containing input. When negative signals cross a threshold, interaction logs are automatically uploaded to Anthropic's backend for the engineering team. The insight: user frustration is the most valuable training signal — it pinpoints exactly where the tool breaks down.</p>
  </div>

  <div class="lk-card">
    <span class="lk-tag tag-infra">Infrastructure</span>
    <h3>10. 44 + 79 Hidden Feature Flags</h3>
    <p>Claude Code runs on a sprawling feature flag system: 44 visible flags and 79 internal <code>tengu_</code>-prefixed flags, for 123+ total. The system uses GrowthBook. Among the hidden gates: <code>tengu_kairos_assistant_mode</code>, <code>tengu_anti_distill_fake_tool_injection</code>, <code>tengu_harbor</code> (a plugin marketplace), <code>tengu_thinkback</code> (year-in-review), and the full BUDDY and ULTRAPLAN systems. All of it is built and waiting — only the flag needs to flip.</p>
  </div>

</div>

---

## Architecture Revealed: The Four Session Types

One of the clearest structural findings was the session type system in `cur-session.ts`. These four modes define how Claude Code runs:

<div class="session-diagram">
  <div class="sd-box sd-interactive">
    <h4>Interactive</h4>
    <p>Standard terminal session. User is present, Claude waits for input, responds, waits again. The mode everyone uses today.</p>
  </div>
  <div class="sd-box sd-bg">
    <h4>Background (BG)</h4>
    <p>Running without a focused terminal. Claude can still operate but de-prioritizes disrupting the user's current focus.</p>
  </div>
  <div class="sd-box sd-daemon">
    <h4>Daemon</h4>
    <p>Fully headless. Persists like a system service — independent of any terminal window. Supports cron scheduling and task persistence to disk.</p>
  </div>
  <div class="sd-box sd-walker">
    <h4>Daemon Walker</h4>
    <p>Daemon mode actively executing a task. The work-mode of the background system — KAIROS operates here when the heartbeat triggers an action.</p>
  </div>
</div>

The trajectory is clear: Claude Code is being designed to outlive any single terminal session, transforming from a command-line tool into a persistent local process — closer to a background service than a REPL.

---

## The Internal Feature Flags at a Glance

<table class="flag-table">
  <thead>
    <tr>
      <th>Flag</th>
      <th>What It Controls</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>tengu_kairos_assistant_mode</td>
      <td>KAIROS proactive background agent</td>
      <td>Internal only</td>
    </tr>
    <tr>
      <td>tengu_anti_distill_fake_tool_injection</td>
      <td>Poison-pill tool injection for API scrapers</td>
      <td>Gated</td>
    </tr>
    <tr>
      <td>tengu_harbor</td>
      <td>Plugin marketplace system</td>
      <td>Unreleased</td>
    </tr>
    <tr>
      <td>tengu_thinkback</td>
      <td>"Year in Review" feature</td>
      <td>Unreleased</td>
    </tr>
    <tr>
      <td>tengu_auto_mode_config</td>
      <td>Autonomous execution master config</td>
      <td>Gated</td>
    </tr>
    <tr>
      <td>ANTI_DISTILLATION_CC</td>
      <td>Thought chain encryption toggle</td>
      <td>Gated</td>
    </tr>
    <tr>
      <td>BUDDY (system)</td>
      <td>Virtual pet companion</td>
      <td>Built, unreleased</td>
    </tr>
    <tr>
      <td>ULTRAPLAN</td>
      <td>Cloud-powered 30-min deep planning via Opus</td>
      <td>Built, unreleased</td>
    </tr>
  </tbody>
</table>

---

## What This Tells Us About the Future of AI Agents

Every feature in the leaked code points in the same direction: **agents are becoming persistent infrastructure, not interactive tools.**

The pattern across KAIROS, Daemon mode, UDS Inbox, Auto Dream, and Super Plan is consistent:

- **From reactive to proactive** — KAIROS moves from "answer me when I ask" to "act when something is worth doing"
- **From session-bound to persistent** — Daemon mode decouples Claude from the terminal lifecycle
- **From isolated to collaborative** — UDS Inbox enables real-time multi-agent coordination on a single machine
- **From ephemeral to long-memory** — Auto Dream consolidates context across sessions into stable knowledge
- **From single-model to orchestrated** — Super Plan splits planning (cloud, powerful, slow) from execution (local, fast, context-rich)

The Buddy system reveals something different but equally important: Anthropic is thinking about **retention and emotional design**, not just capability. A coding tool with a virtual pet is betting that long-term engagement requires more than technical excellence.

<div class="d-callout">
  <strong>The competitive irony:</strong> Undercover Mode was built specifically to prevent Anthropic's internal information from leaking through Claude Code contributions to public repos. The leak that exposed it was caused by a missing config rule in a packaging script — a problem no amount of LLM-level sophistication can prevent.
</div>

The research community now has a detailed map of how the leading coding agent is engineered. That knowledge raises the floor for the entire industry. Competitors can skip years of architectural exploration. Independent developers can build with confidence that the patterns they're following have been validated at production scale. And Anthropic, having had its roadmap made public, now has every incentive to ship faster.

A low-level packaging mistake became the most informative AI architecture disclosure of 2026 — not intentionally, but thoroughly.

---

*Model codenames found in the leaked code include **Capybara**, **Earflap**, and **Nibbler** — internal designations for different Claude Code model variants at various research stages.*
