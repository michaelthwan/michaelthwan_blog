---
title: "Mastering Claude Code"
subtitle: "Workflow patterns and configuration practices from the team that built it."
authors:
  - "Boris Cherny"
affiliations:
  - "Anthropic"
published: "2026-02-03"
abstract: "How parallelism, plan-first thinking, and verification loops combine into a high-leverage workflow. Distilled from the practices of the team that built Claude Code."
tags:
  - "explainer"
category: "dev"
thumbnail: "/img/claude-code/plan-mode.png"
---

<p class="d-note">
    This article distills the workflow patterns shared by
    <a href="https://www.threads.com/@boris_cherny">Boris Cherny</a>—creator of Claude Code—
    and the broader Claude Code team in early 2026. These aren't theoretical best practices.
    They're the actual setup the team uses every day.
</p>

## The Mindset Shift

Claude Code is not a chatbot that happens to write code. It's an **agent**: it reads files, runs commands, writes tests, and iterates autonomously. The practices that make it powerful are fundamentally different from prompt engineering for a chat model.

The single biggest shift: **stop thinking sequentially.** The highest-leverage tips all cluster around three ideas—do more in parallel, plan before executing, and give Claude a way to verify its own work. Everything else is configuration and habit.

## Parallelism: The Biggest Unlock

The top tip from the team, unanimously: **run multiple Claude sessions at once.** 3–5 is the baseline. Boris himself runs 5 locally and 5–10 on the web simultaneously.

### Git worktrees

The preferred mechanism is git worktrees. Each worktree is an independent checkout of your repo with its own working directory, but sharing the same `.git`. Each one gets its own Claude session—no collisions, no stashing, no context switching.

```bash
# Set up parallel workstreams
git worktree add ../proj-auth   feature/auth
git worktree add ../proj-dash   feature/dashboard
git worktree add ../proj-fix    bugfix/login

# Each gets its own Claude session
cd ../proj-auth && claude
cd ../proj-dash && claude
cd ../proj-fix  && claude
```

Some engineers name their worktrees and set up shell aliases (`za`, `zb`, `zc`) to hop between them in one keystroke. Others keep a dedicated "analysis" worktree that's read-only: logs, queries, no code changes.

<div class="d-callout">
    <strong>Worktrees vs. branches:</strong> Branches share a working directory. Two Claude sessions editing the same file will collide. Worktrees give each session its own filesystem state—the reason the Claude Code team built native worktree support into Claude Desktop.
</div>

<figure class="d-figure">
    <img src="/img/claude-code/multi-instance.jpg" alt="Five parallel Claude Code terminal sessions" style="max-width: 100%;">
    <figcaption class="d-figure-caption">
        Five Claude Code sessions running in parallel via git worktrees—each working on an independent task.
    </figcaption>
</figure>

### Hybrid: terminal + web

Sessions aren't locked to one environment. Boris hands off local sessions to the web using `&` to background them, or starts sessions from mobile in the morning and checks in later. The `--teleport` flag moves a session between local and web.

<figure class="d-figure">
    <img src="/img/claude-code/web-sessions.jpg" alt="Claude Code web interface showing multiple sessions" style="max-width: 600px; display: block; margin: 0 auto;">
    <figcaption class="d-figure-caption">
        The claude.ai/code web interface—sessions can be started on mobile and resumed anywhere.
    </figcaption>
</figure>

## The Core Loop: Plan → Execute → Verify

Nearly every high-leverage pattern traces back to this three-phase loop. Plan and Verify are where you invest your energy. Execute is where Claude does the heavy lifting.

<figure class="d-figure">
    <div class="d-figure-content">
        <div class="wf-loop">
            <div class="wf-phase wf-plan">
                <div class="wf-phase-header">Plan</div>
                <div class="wf-phase-body">
                    <div class="wf-step">Define the goal clearly</div>
                    <div class="wf-step">Iterate on the plan</div>
                    <div class="wf-step">Second Claude reviews (optional)</div>
                </div>
            </div>
            <div class="wf-arrow">&#8594;</div>
            <div class="wf-phase wf-execute">
                <div class="wf-phase-header">Execute</div>
                <div class="wf-phase-body">
                    <div class="wf-step">Auto-accept edits on</div>
                    <div class="wf-step">Claude runs autonomously</div>
                    <div class="wf-step">Subagents handle subtasks</div>
                </div>
            </div>
            <div class="wf-arrow">&#8594;</div>
            <div class="wf-phase wf-verify">
                <div class="wf-phase-header">Verify</div>
                <div class="wf-phase-body">
                    <div class="wf-step">Tests + typecheck + lint</div>
                    <div class="wf-step">Browser or integration tests</div>
                    <div class="wf-step">If broken: back to Plan</div>
                </div>
            </div>
        </div>
        <div class="wf-feedback">&#8631; if something goes sideways, re-plan</div>
    </div>
    <figcaption class="d-figure-caption">
        The core Claude Code workflow. A good plan lets Claude 1-shot the implementation. Verification closes the feedback loop.
    </figcaption>
</figure>

### Plan mode

Enter plan mode with `shift+Tab` (twice from the default). Pour your energy into the plan before Claude touches a single file. A well-written plan is the difference between a 1-shot implementation and hours of back-and-forth.

Two patterns from the team:

- **Two-Claude review:** One Claude writes the plan. A second Claude reviews it—playing the role of a staff engineer. Only then does execution begin.
- **Re-plan on friction:** The moment something goes sideways, don't keep pushing. Switch back to plan mode and re-plan. Explicitly tell Claude to enter plan mode for verification steps, not just the build.

<figure class="d-figure">
    <img src="/img/claude-code/plan-mode.png" alt="Claude Code plan mode interface" style="max-width: 520px; display: block; margin: 0 auto;">
    <figcaption class="d-figure-caption">
        Plan mode in action—Claude iterates on the approach before touching any files.
    </figcaption>
</figure>

### Verification: the #1 lever

<div class="d-callout">
    <strong>Boris Cherny:</strong> "Probably the most important thing to get great results out of Claude Code—give Claude a way to verify its work. If Claude has that feedback loop, it will 2–3x the quality of the final result."
</div>

Verification looks different per domain:

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Domain</th>
                <th>How to verify</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Type safety</td>
                <td><code>bun run typecheck</code> — fast, run first</td>
            </tr>
            <tr>
                <td>Unit / integration</td>
                <td><code>bun run test</code> or target specific suites</td>
            </tr>
            <tr>
                <td>Style</td>
                <td><code>bun run lint</code> or a PostToolUse hook (see below)</td>
            </tr>
            <tr class="highlight-row">
                <td>Frontend</td>
                <td>Claude Chrome extension: opens a real browser, tests the UI, iterates</td>
            </tr>
            <tr>
                <td>Distributed systems</td>
                <td>Point Claude at docker logs</td>
            </tr>
        </tbody>
    </table>
</div>

Boris's team tests every change to claude.ai/code using the Claude Chrome extension. It opens a browser, tests the UI, and iterates until the code works and the UX feels right.

## CLAUDE.md: The Memory That Persists

`CLAUDE.md` is checked into git. It's the single file that teaches Claude the conventions, constraints, and quirks of your project. It's loaded at the start of every session. It's how you avoid repeating yourself across sessions.

### The self-improvement loop

After every correction you make to Claude's output, end with:

<div class="d-example-box">
"Update your CLAUDE.md so you don't make that mistake again."
</div>

Claude is surprisingly good at writing rules for itself. The cycle is tight: Claude makes a mistake, you correct it, you ask Claude to update CLAUDE.md. Next session, the mistake doesn't recur. Ruthlessly edit and trim over time—keep iterating until the mistake rate measurably drops.

<div class="d-callout">
    <strong>Two levels:</strong> <code>~/.claude/CLAUDE.md</code> holds your global preferences (~76 tokens). The repo-level <code>CLAUDE.md</code> is project-specific (~4k tokens). Both are loaded every session. The repo-level one is checked into git and shared with the team.
</div>

### What goes in it

A real example—the Claude Code team's own development workflow:

```sh
# Development Workflow

**Always use `bun`, not `npm`.**

# 1. Make changes

# 2. Typecheck (fast)
bun run typecheck

# 3. Run tests
bun run test -- -t "test name"     # Single suite
bun run test:file -- "glob"        # Specific files

# 4. Lint before committing
bun run lint:file -- "file1.ts"    # Specific files
bun run lint                       # All files

# 5. Before creating PR
bun run lint:claude && bun run test
```

One engineer goes further: Claude maintains a `notes/` directory for every task and project, updated after every PR. CLAUDE.md just points at it. The whole team contributes—anytime someone sees Claude do something wrong, they add a rule. Boris's team even uses the Claude Code GitHub action to have Claude update CLAUDE.md as part of code review: tag `@claude` on a PR with instructions like "add to CLAUDE.md to never use enums."

<figure class="d-figure">
    <img src="/img/claude-code/github-claude.jpg" alt="GitHub PR with @claude mention" style="max-width: 600px; display: block; margin: 0 auto;">
    <figcaption class="d-figure-caption">
        Tagging @claude on a GitHub PR—Claude responds with code review and can update CLAUDE.md.
    </figcaption>
</figure>

## Skills & Slash Commands

If you do something more than once a day, turn it into a skill or command. Skills and slash commands are versioned, checked into git, and shared across the team.

### Slash commands

Slash commands live in `.claude/commands/`. They're quick, scripted actions:

- `/commit-push-pr` — commits, pushes, and opens a PR. Uses inline bash to pre-compute `git status` so the command runs without back-and-forth. Used dozens of times daily.
- `/techdebt` — runs at the end of every session to find and kill duplicated code.

### Subagents

Subagents are longer-running autonomous agents with their own instruction files, living in `.claude/agents/`:

```
.claude/
├── commands/
│   ├── commit-push-pr.md
│   └── techdebt.md
└── agents/
    ├── build-validator.md
    ├── code-architect.md
    ├── code-simplifier.md
    ├── oncall-guide.md
    └── verify-app.md
```

`code-simplifier` runs after Claude finishes working and cleans up the code. `verify-app` has detailed instructions for end-to-end testing. Think of subagents as automating the most common per-PR workflows.

<figure class="d-figure">
    <img src="/img/claude-code/subagents.png" alt="Five subagents running in parallel" style="max-width: 100%;">
    <figcaption class="d-figure-caption">
        Five subagents exploring the codebase in parallel—each handles a subtask autonomously.
    </figcaption>
</figure>

<div class="d-callout">
    <strong>Commands vs. subagents:</strong> Slash commands are quick, scripted actions (commit, push, lint). Subagents are longer autonomous tasks that need judgment (verify, simplify, review). Append <code>"use subagents"</code> to any request to let Claude spawn them automatically.
</div>

## Prompting Patterns

A few patterns that consistently produce better output from Claude Code:

### Challenge, don't just accept

Don't accept the first fix and move on. Push back:

<div class="d-example-box">
"Grill me on these changes and don't make a PR until I pass your test."
</div>

Make Claude be your reviewer. Or force a behavioral comparison:

<div class="d-example-box">
"Prove to me this works" — have Claude diff behavior between main and your feature branch.
</div>

### Ask for the elegant solution

After a mediocre fix:

<div class="d-example-box">
"Knowing everything you know now, scrap this and implement the elegant solution."
</div>

This resets Claude's approach entirely. Instead of patching on top of a bad foundation, it redesigns with full context of what went wrong.

### Specs over vibes

Write detailed specs and reduce ambiguity *before* handing work off. The more specific your input, the better the output. A well-written spec is worth more than 10 rounds of correction.

## The Plumbing: Hooks, Permissions, MCP

These are the configuration layer that makes everything run smoothly without constant manual intervention.

### PostToolUse hooks

Hooks fire automatically in response to tool events. The most common pattern: auto-format every file Claude writes.

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "bun run format || true"
        }
      ]
    }
  ]
}
```

This catches the last 10% of formatting Claude misses, preventing CI failures later. The `|| true` ensures a formatting hiccup doesn't block Claude mid-task.

### Permissions

Don't use `--dangerously-skip-permissions`. Instead, pre-allow commands you know are safe via `/permissions`:

```
Bash(bq query:*)
Bash(bun run build:*)
Bash(bun run lint:file:*)
Bash(bun run test:*)
Bash(bun run typecheck:*)
```

These live in `.claude/settings.json` and are shared with the team. Claude won't prompt for any allowed command pattern.

### MCP servers

MCP (Model Context Protocol) gives Claude access to external tools. The configuration is checked into `.mcp.json`:

```json
{
  "mcpServers": {
    "slack": {
      "type": "http",
      "url": "https://slack.mcp.anthropic.com/mcp"
    }
  }
}
```

With the Slack MCP enabled, the workflow collapses: paste a bug thread into Claude, say "fix." Claude reads the thread, finds the relevant code, and fixes it. Zero context switching.

<div class="d-callout warning">
    <strong>Security:</strong> Boris does not use <code>--dangerously-skip-permissions</code> in production. For long-running sandboxed tasks where you want zero interrupts, <code>--permission-mode=dontAsk</code> is the safer alternative.
</div>

## Bug Fixing: Get Out of the Way

A recurring theme across the tips: Claude fixes most bugs by itself, if you let it.

- Say "Go fix the failing CI tests." Don't prescribe how.
- Paste a Slack bug thread (with Slack MCP enabled) and say "fix."
- Point Claude at docker logs for distributed systems—it's surprisingly capable.

The key is not prescribing the solution. Give Claude the problem and the ability to verify. It will find the fix.

<section class="d-bibliography">

## References

1. Boris Cherny. [Tips for using Claude Code](https://www.threads.com/@boris_cherny/post/DUMZr4VElyb/im-boris-and-i-createdclaude-code-i-wanted-to-quickly-share-a-few-tips-for). Threads, Feb 2026.

2. Boris Cherny. [Claude Code hacks](https://x.com/bcherny/status/2007179832300581177). X, Jan 2026.

3. [Claude Code: Common Workflows](https://code.claude.com/docs/en/common-workflows). Anthropic.

4. [Claude Code: Skills](https://code.claude.com/docs/en/skills). Anthropic.

5. [Claude Code: Hooks Guide](https://code.claude.com/docs/en/hooks-guide). Anthropic.

</section>
