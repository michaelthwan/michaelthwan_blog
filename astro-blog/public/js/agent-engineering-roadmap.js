// ── Build roadmap HTML ──
// groups = [ [label, [ [key, cls, text], ... ]], ... ]
function cluster(groups) {
  return groups.map(([lbl, items]) =>
    `<div class="rm-lbl">${lbl}</div>` +
    items.map(([key, cls, text]) =>
      `<div class="rm-box${cls ? ' '+cls : ''}" data-key="${key}">${text}</div>`
    ).join('')
  ).join('');
}
function section(chapter, leftGroups, rightGroups) {
  return `<div class="rm-section"><div class="rm-chapter"><div class="rm-chapter-box">${chapter}</div></div><div class="rm-row"><div class="rm-left">${cluster(leftGroups)}</div><div class="rm-dot-col"><div class="rm-dot"></div></div><div class="rm-right">${cluster(rightGroups)}</div></div></div>`;
}

const s1 = section('1. Foundations',
  [['What is an Agent', [
    ['agent-loop','','LLM + Tool Calling loop'],
    ['humans-steer','','Humans steer · Agents execute'],
    ['agent-def','','Agent = while(incomplete) { tool() }'],
  ]]],
  [['The Problem', [
    ['nondeterminism','','Non-determinism across runs'],
    ['no-skill-retention','','Agents don\'t retain skills'],
    ['trust-gap','','Trust gap blocks adoption'],
  ]]]
);

const s2 = section('2. Determinism Strategies',
  [['Prompt &amp; Memory', [
    ['workflow-builders','','Workflow builders (n8n)'],
    ['context-engineering','','Context engineering / RAG'],
    ['learned-skills','','Learned skills (Cursor Memory)'],
  ]]],
  [['Code &amp; Caching', [
    ['code-gen','','Code generation (Cloudflare)'],
    ['script-fallback','','Script-agent fallback'],
    ['response-caching','','Response caching (Butter.dev)'],
  ]]]
);

const s3 = section('3. Claude Code Skills',
  [
    ['Authoring', [
      ['skill-md','','SKILL.md + YAML frontmatter'],
      ['arguments','','$ARGUMENTS substitution'],
      ['context-fork','','context: fork → isolated subagent'],
    ]],
    ['Bundled Skills', [
      ['simplify','b','/simplify — 3-agent parallel review'],
      ['batch','b','/batch — parallel codebase changes'],
      ['loop','b','/loop — scheduled recurring prompts'],
    ]]
  ],
  [
    ['Control', [
      ['disable-invoke','','disable-model-invocation: true'],
      ['user-invocable','','user-invocable: false'],
      ['allowed-tools','','allowed-tools restriction'],
    ]],
    ['Advanced', [
      ['dynamic-inject','','!`cmd` dynamic context injection'],
      ['skill-scope','','Personal / Project / Plugin scope'],
      ['open-standard','','agentskills.io open standard'],
    ]]
  ]
);

const s4 = section('4. Harness Engineering',
  [['Context Architecture', [
    ['agents-md','','AGENTS.md as table of contents'],
    ['docs-dir','','docs/ as versioned knowledge base'],
    ['in-repo','','All knowledge must live in-repo'],
  ]]],
  [['Quality Systems', [
    ['layered-arch','','Layered domain architecture'],
    ['custom-linters','','Custom linters enforce invariants'],
    ['doc-gardening','','Recurring doc-gardening agents'],
  ]]]
);

const s5 = section('5. Production Systems',
  [
    ['Everything-Claude-Code', [
      ['ecc-toolkit','','65 skills / 40 commands / 16 agents'],
      ['hooks','','Hooks: session, memory, auto-format'],
    ]],
    ['Token Optimization', [
      ['use-sonnet','b','Default to sonnet (60% cost reduction)'],
      ['thinking-tokens','b','MAX_THINKING_TOKENS=10000'],
      ['compact','b','Strategic /compact at milestones'],
    ]]
  ],
  [
    ['Continuous Learning', [
      ['learn','g','/learn — extract session patterns'],
      ['evolve','g','/evolve — cluster into skills'],
      ['instincts','g','Confidence-scored instinct system'],
    ]],
    ['Security', [
      ['agentshield','','npx ecc-agentshield scan'],
      ['redteam','','102 rules, red-team / blue-team pipeline'],
    ]]
  ]
);

const legend = `<div class="rm-legend"><div class="rm-leg"><div class="rm-sw ch"></div><span>Chapter</span></div><div class="rm-leg"><div class="rm-sw"></div><span>Concept</span></div><div class="rm-leg"><div class="rm-sw b"></div><span>Tool / Command</span></div><div class="rm-leg"><div class="rm-sw g"></div><span>Learning / Automation</span></div><div class="rm-leg"><span style="font-size:0.72rem;color:#9CA3AF">Click any node for details</span></div></div>`;

document.getElementById('rm-root').innerHTML =
  `<div class="rm-outer"><div class="rm-wrap"><div class="rm-inner"><div class="rm-spine"></div><div class="rm-title"><span>AI Agent-First Engineering</span></div>${s1}${s2}${s3}${s4}${s5}${legend}</div></div></div>`;

// ── Descriptions ──
const DESCRIPTIONS = {
  // ── 1. Foundations ──
  "agent-loop": {
    title: "The Agent Loop",
    body: "An LLM agent calls a tool, observes the result, and decides what to do next — repeating until the task is complete. The model owns the control flow; there's no hardcoded sequence of steps. This is what makes agents powerful: they can handle tasks they were never explicitly programmed for."
  },
  "humans-steer": {
    title: "Humans Steer · Agents Execute",
    body: "The fundamental shift in agent-first development. Engineers define goals, environments, and constraints. Agents produce the code, tests, and documentation. Human time becomes the scarce resource — spent on judgment and direction, not on writing individual lines of code."
  },
  "agent-def": {
    title: "Simon Willison's Definition",
    body: "The minimal definition of an agent: an LLM calling tools in a loop until a goal is achieved. In pseudocode: while task_incomplete: tool_choice = llm(); do(tool_choice). Everything else — memory, context, skills, harnesses — is built on top of this loop."
  },
  "nondeterminism": {
    title: "Non-Determinism Across Runs",
    body: "The same task, run twice, can produce completely different tool-call trajectories. The model samples from probability distributions at each step, so small context differences can cascade into wildly divergent paths. This is the primary barrier to trust and production deployment."
  },
  "no-skill-retention": {
    title: "No Skill Retention",
    body: "Human employees learn from experience and build skills over time. Vanilla agents start fresh every run — no memory of what worked before, unless you explicitly build that in. This is why agents can nail a task once and fumble the same task the next day."
  },
  "trust-gap": {
    title: "The Trust Gap",
    body: "Before teams delegate work to agents, they need to trust that outcomes are reproducible. Non-determinism prevents this trust from forming. Employees learn skills; agents, without explicit skill systems, do not. Closing this gap is what the entire determinism landscape is about."
  },

  // ── 2. Determinism Strategies ──
  "workflow-builders": {
    title: "Workflow Builders",
    body: "Fixed DAG-based tools like n8n where control flow is hardcoded, not model-driven. Technically not 'agents' by the strict definition, but the most widely adopted path to reliability. Best for well-understood, repeatable processes where every step can be specified in advance."
  },
  "context-engineering": {
    title: "Context Engineering / RAG",
    body: "Inject examples of prior successful runs, SOPs, or domain knowledge into the model's context at inference time. The model still decides each step, but with better guidance. Traces back to few-shot prompting and RAG. mem0 and Supermemory are notable memory layers in this space."
  },
  "learned-skills": {
    title: "Learned Skills",
    body: "The agent itself detects when a behavior would be useful in future runs and saves it. Cursor's Memory feature uses a special tool the model can invoke. Letta's Sleep-Time Agents use async agents to continuously compress and overwrite prior context with summaries, allowing agents to resume from history."
  },
  "code-gen": {
    title: "Code Generation",
    body: "Use the LLM as a compiler: generate a script once, run it deterministically many times. A single LLM call produces code that invokes tools directly — bypassing the indirection of the agent loop entirely. Cloudflare's Code Mode and Browser Use's Code Use both implement this pattern."
  },
  "script-fallback": {
    title: "Script-Agent Fallback",
    body: "Default operating mode is a static script; fall back to an agent loop only for initial discovery and self-healing when the script breaks. Best of both worlds: deterministic by default, adaptive when needed. Used by Browserbase Director and Browser Use's Workflow Use."
  },
  "response-caching": {
    title: "Response Caching (Butter.dev)",
    body: "An HTTP proxy in front of the LLM provider that caches and replays responses. The agent loop is completely unaware — it 'thinks' it's calling the model. Achieving meaningful cache hit rates requires smart prompt grouping, dynamic data stripping, and handling complex conditional flows. This is what Butter.dev is building."
  },

  // ── 3. Claude Code Skills ──
  "skill-md": {
    title: "SKILL.md + YAML Frontmatter",
    body: "Every skill is a directory with a SKILL.md file. YAML frontmatter (between --- markers) defines the name (which becomes the /slash-command), description (used for auto-matching), and behavior settings. The markdown body contains the instructions Claude follows when the skill runs."
  },
  "arguments": {
    title: "$ARGUMENTS Substitution",
    body: "Pass arguments at invocation time. $ARGUMENTS gets the full input string; $ARGUMENTS[N] or shorthand $N accesses individual positional args. Running /fix-issue 123 substitutes '123' wherever $ARGUMENTS appears. If the skill has no $ARGUMENTS placeholder, the input is appended automatically."
  },
  "context-fork": {
    title: "context: fork → Isolated Subagent",
    body: "Set context: fork in frontmatter to run the skill in a completely isolated context — no access to conversation history. The skill content becomes the prompt for a new subagent. Use the agent field to pick which agent type drives it: Explore, Plan, or general-purpose."
  },
  "simplify": {
    title: "/simplify",
    body: "Spawns three review agents in parallel — one for code reuse, one for quality, one for efficiency. Aggregates findings and applies fixes. Run after implementing a feature to clean up your work. Pass optional text to focus: /simplify focus on memory efficiency."
  },
  "batch": {
    title: "/batch",
    body: "Describe a large-scale change; /batch decomposes it into 5–30 independent units and presents a plan for your approval. Once approved, spawns one background agent per unit in an isolated git worktree. Each agent implements, runs tests, and opens a PR. Example: /batch migrate src/ from Solid to React."
  },
  "loop": {
    title: "/loop",
    body: "Runs a prompt repeatedly on a timed interval while the session stays open. Claude parses natural language intervals — /loop 5m check if the deploy finished. Useful for polling a deployment, babysitting a PR, or periodically re-running a skill."
  },
  "disable-invoke": {
    title: "disable-model-invocation: true",
    body: "Prevents Claude from automatically triggering this skill based on conversation context. The skill only runs when you explicitly type /skill-name. Use for anything with side effects — deploys, commits, messages sent to others — where you want to control the timing."
  },
  "user-invocable": {
    title: "user-invocable: false",
    body: "Hides the skill from the / slash-command menu. Claude can still load it automatically when relevant, but you can't invoke it directly. Use for background knowledge or context-injection skills that aren't meant to be actionable commands — like a legacy-system-context skill."
  },
  "allowed-tools": {
    title: "allowed-tools Restriction",
    body: "Limit which tools Claude can use while a skill is active, without requiring per-use approval prompts. A safe-reader skill might allow only Read, Grep, Glob — preventing any writes or bash execution. Useful for building sandboxed, read-only skill modes."
  },
  "dynamic-inject": {
    title: "!`cmd` Dynamic Context Injection",
    body: "Shell commands prefixed with ! execute before the skill prompt is sent to Claude. Their output replaces the placeholder — Claude sees real data, not the command. Inject PR diffs (!`gh pr diff`), log tails, schema dumps, or any live system state automatically before Claude starts working."
  },
  "skill-scope": {
    title: "Personal / Project / Plugin Scope",
    body: "Skills in ~/.claude/skills/ apply across all your projects. In .claude/skills/ they're project-only. Via a plugin they ship with the package. When names conflict, higher-priority locations win: enterprise > personal > project > plugin. Plugin skills use a plugin-name:skill-name namespace."
  },
  "open-standard": {
    title: "agentskills.io Open Standard",
    body: "Claude Code skills follow the Agent Skills open standard designed to work across multiple AI tools. The same SKILL.md format works in Codex, OpenCode, and other compatible harnesses — skills you write for Claude Code are portable to the broader agent ecosystem."
  },

  // ── 4. Harness Engineering ──
  "agents-md": {
    title: "AGENTS.md as Table of Contents",
    body: "OpenAI kept their AGENTS.md to ~100 lines — a map with pointers to deeper docs, not an encyclopedia. A monolithic instruction file crowds out task context, rots instantly, and causes agents to pattern-match locally rather than navigate intentionally. Short AGENTS.md + structured docs/ is the proven pattern."
  },
  "docs-dir": {
    title: "docs/ as Versioned Knowledge Base",
    body: "A structured docs/ directory is the system of record: design docs, product specs, execution plans, architecture decisions — all versioned alongside the code. CI jobs validate that docs stay cross-linked and up to date. Execution plans for complex work are checked in and updated as progress is made."
  },
  "in-repo": {
    title: "All Knowledge Must Live In-Repo",
    body: "The key insight from OpenAI's zero-manually-written-code experiment: anything not in the repository effectively doesn't exist for the agent. Slack threads, Google Docs, tribal knowledge — from the agent's point of view, if it can't access it in-context while running, it doesn't exist."
  },
  "layered-arch": {
    title: "Layered Domain Architecture",
    body: "Each business domain is divided into fixed layers (Types → Config → Repo → Service → Runtime → UI) with mechanically validated dependency directions. Strict architectural constraints are what allow high throughput without drift — the kind of structure you'd usually postpone until you have hundreds of engineers."
  },
  "custom-linters": {
    title: "Custom Linters Enforce Invariants",
    body: "Architecture rules, naming conventions, file size limits, and reliability requirements are encoded as custom linters — themselves agent-generated. Critically, error messages are written to inject remediation instructions directly into agent context, so the agent knows how to fix what it broke."
  },
  "doc-gardening": {
    title: "Recurring Doc-Gardening Agents",
    body: "Background agents run on a schedule, scanning for documentation that no longer matches actual code behavior, updating quality grades per domain, and opening targeted fix-up PRs. Most can be reviewed in under a minute. Technical debt is paid in small continuous increments rather than painful bursts."
  },

  // ── 5. Production Systems ──
  "ecc-toolkit": {
    title: "Everything-Claude-Code",
    body: "A community-maintained Claude Code plugin with 63k+ stars, built from 10+ months of daily production use. Ships 65 skills, 40 commands, and 16 agents covering TDD, security, frontend, backend, Django, Spring Boot, Go, and more. Install via: /plugin marketplace add affaan-m/everything-claude-code."
  },
  "hooks": {
    title: "Hook Library",
    body: "Hooks fire on tool events (file edit, bash, session start/end) and execute shell scripts. ECC's library saves and restores session context, suggests compaction at logical breakpoints, and auto-formats + type-checks on every file edit via PostToolUse hooks. All scripts are cross-platform Node.js."
  },
  "use-sonnet": {
    title: "Default to Sonnet",
    body: "Sonnet handles ~80% of coding tasks at ~60% of Opus cost. Set model: sonnet in ~/.claude/settings.json as your baseline. Reserve /model opus for complex architectural reasoning or deep debugging. Set CLAUDE_CODE_SUBAGENT_MODEL=haiku to route background subagents to the cheapest capable model."
  },
  "thinking-tokens": {
    title: "MAX_THINKING_TOKENS=10000",
    body: "Extended thinking is powerful but expensive — the default cap is 31,999 tokens. Setting MAX_THINKING_TOKENS=10000 reduces per-request thinking cost by ~70% with minimal quality impact for most coding tasks. Set it in the env section of ~/.claude/settings.json."
  },
  "compact": {
    title: "Strategic /compact",
    body: "Don't wait for auto-compaction at 95% context. Run /compact at logical task boundaries: after research is done, after completing a milestone, after debugging a hard problem. Critically, never compact mid-implementation — you'll lose variable names, file paths, and partial state the agent needs."
  },
  "learn": {
    title: "/learn",
    body: "Analyzes your current session and extracts reusable patterns as instincts — stored with confidence scores. Run after solving a tricky problem to capture the approach before the session ends. Instincts are saved and can be queried with /instinct-status, exported with /instinct-export."
  },
  "evolve": {
    title: "/evolve",
    body: "Takes your accumulated instincts and clusters related ones into formal SKILL.md files. Promotes high-confidence patterns into the skill library. Bridges the gap between ephemeral learned behaviors and shareable, reusable skills. This is the 'learned skills' approach from Chapter 2, implemented."
  },
  "instincts": {
    title: "Confidence-Scored Instinct System",
    body: "Instincts are stored with confidence scores that increase each time they're successfully applied. Low-confidence instincts are flagged for review before promotion. You can /instinct-import and /instinct-export to share patterns across projects or team members — team-level skill convergence."
  },
  "agentshield": {
    title: "AgentShield Security Scanner",
    body: "Scans your entire Claude Code configuration — CLAUDE.md, settings.json, MCP configs, hooks, agent definitions, skills — for vulnerabilities across 5 categories: secrets detection (14 patterns), permission auditing, hook injection analysis, MCP server risk profiling, and agent config review. 102 static analysis rules, 98% test coverage."
  },
  "redteam": {
    title: "Red-Team / Blue-Team Pipeline",
    body: "The --opus flag spawns three Opus 4.6 agents in parallel: an attacker finds exploit chains in your config, a defender evaluates existing protections, and an auditor synthesizes both into a prioritized risk report. Adversarial reasoning, not just pattern matching. Run: npx ecc-agentshield scan --opus --stream."
  }
};

(function () {
  const panel = document.getElementById('rm-panel');
  const panelTitle = document.getElementById('rm-panel-title');
  const panelBody = document.getElementById('rm-panel-body');
  const panelClose = document.getElementById('rm-panel-close');
  let activeBox = null;

  function openPanel(box) {
    const key = box.dataset.key;
    const info = DESCRIPTIONS[key];
    if (!info) return;

    // Deactivate previous
    if (activeBox && activeBox !== box) {
      activeBox.classList.remove('active');
    }
    activeBox = box;
    box.classList.add('active');

    panelTitle.textContent = info.title;
    panelBody.textContent = info.body;
    panel.classList.add('open');
  }

  function closePanel() {
    panel.classList.remove('open');
    if (activeBox) {
      activeBox.classList.remove('active');
      activeBox = null;
    }
  }

  // Click on boxes
  document.querySelectorAll('.rm-box[data-key]').forEach(box => {
    box.addEventListener('click', e => {
      e.stopPropagation();
      if (activeBox === box && panel.classList.contains('open')) {
        closePanel();
      } else {
        openPanel(box);
      }
    });
  });

  // Close button
  panelClose.addEventListener('click', closePanel);

  // Click outside roadmap → close
  document.addEventListener('click', e => {
    if (!e.target.closest('.rm-outer') && !e.target.closest('.rm-panel')) {
      closePanel();
    }
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanel();
  });
})();
