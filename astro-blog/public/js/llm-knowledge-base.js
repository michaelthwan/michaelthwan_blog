(function () {
  const stages = [
    {
      id: 'ingest',
      label: '① Data Ingest',
      color: '#1d4ed8',
      bg: '#dbeafe',
      border: '#93c5fd',
      summary: 'Collect raw source documents into a structured <code>raw/</code> directory — articles, papers, images, repos, datasets.',
      tools: [
        { name: 'Obsidian Web Clipper', desc: 'Browser extension that converts any web page to clean Markdown. Strips ads, nav, footers. Downloads inline images automatically.' },
        { name: 'jina.ai Reader (r.jina.ai)', desc: 'Prefix any URL with <code>r.jina.ai/</code> to get a clean Markdown version. Ideal for CLI-driven ingestion in scripts.' },
        { name: 'markitdown', desc: 'Microsoft CLI tool that converts PDFs, Office docs, HTML, images, audio, and more into Markdown. Runs locally.' },
        { name: 'yt-dlp + Whisper', desc: 'Download video/audio then transcribe to text. Extend your knowledge base to video content and podcasts.' },
        { name: 'GitHub repo snapshots', desc: 'Clone a repo, run <code>git log --oneline</code>, grab README and key files. LLM can reason over code without running it.' },
      ],
      prompt: `# Prompt: Ingest new source
You are adding a new source to your knowledge base.

File: raw/articles/new-article.md
Task: Just save it. No edits. Keep originals pristine.

Naming convention:
  - raw/articles/<slug>.md
  - raw/papers/<slug>.md
  - raw/images/<slug>/<fig>.png

Note: If downloading images from a web clip,
use a hotkey or script to pull all <img> srcs
to local paths so the LLM can reference them.`,
      pitfalls: [
        'Never let the LLM edit raw/ files — treat them as immutable source of truth.',
        'Use consistent slugs (kebab-case) so summaries map 1:1 to raw docs.',
        'Store images locally; LLMs cannot reliably fetch external URLs mid-conversation.',
      ],
    },
    {
      id: 'compile',
      label: '② Wiki Compilation',
      color: '#065f46',
      bg: '#d1fae5',
      border: '#6ee7b7',
      summary: 'An LLM incrementally reads raw sources and "compiles" them into a structured wiki: summaries, concept articles, a master index, and backlinks.',
      tools: [
        { name: 'Incremental compilation', desc: 'Only compile new or changed raw docs. Maintain a <code>compiled.log</code> of processed files to avoid re-doing work.' },
        { name: 'Two-pass approach', desc: 'Pass 1: summarize each raw doc independently. Pass 2: synthesize summaries into concept articles and update the index.' },
        { name: 'Master index.md', desc: 'Single file listing every concept article with a 1-2 sentence description and its source docs. The LLM reads this first for any Q&A task.' },
        { name: 'Backlinks', desc: 'At the bottom of each concept article, list all other articles that reference it. LLM maintains these on each compilation pass.' },
        { name: 'Concept extraction', desc: 'Prompt the LLM: "Given this new summary, what existing concepts does it belong to? What new concepts emerge?" Then update accordingly.' },
      ],
      prompt: `# Prompt: Incremental compilation pass

You are the wiki compiler. Today's new sources:
- raw/articles/new-paper.md (NEW)
- raw/articles/existing-article.md (UNCHANGED, skip)

Step 1 — Summarize new sources:
  Read raw/articles/new-paper.md
  Write wiki/summaries/new-paper.md
  Format: ## Summary\\n<3-5 sentences>\\n## Key Concepts\\n- list\\n## Sources\\n[[raw/articles/new-paper.md]]

Step 2 — Update concept articles:
  Read wiki/index.md to find relevant concepts.
  Update wiki/concepts/<relevant>.md with new info.
  Create new concept articles if novel topics emerge.

Step 3 — Update index.md:
  Add new summary to the index.
  Update concept article descriptions if changed.
  Ensure all backlinks are current.`,
      pitfalls: [
        'Don\'t summarize everything at once — incremental passes keep context windows manageable.',
        'The index.md is critical: if it drifts out of sync, Q&A quality degrades fast.',
        'Concept granularity matters: too fine = fragmented wiki; too coarse = unhelpful articles.',
      ],
    },
    {
      id: 'wiki',
      label: '③ The Wiki',
      color: '#5b21b6',
      bg: '#ede9fe',
      border: '#c4b5fd',
      summary: 'The compiled output: a directory of Markdown files organized into summaries, concept articles, an index, and filed query outputs.',
      tools: [
        { name: 'concepts/*.md', desc: 'One file per concept. Synthesizes info from multiple sources. Includes: definition, key details, comparisons, open questions, backlinks.' },
        { name: 'summaries/*.md', desc: 'One file per raw source. Brief (300-500 words). Lists key concepts extracted. Links back to raw file.' },
        { name: 'index.md', desc: 'Master table of contents. Lists every concept article (1-liner description) and every summary. The LLM reads this first for routing.' },
        { name: '[[Wikilinks]]', desc: 'Use Obsidian-style [[backlinks]] between articles. The LLM writes these as part of compilation; Obsidian renders them as clickable links and builds a graph.' },
        { name: 'outputs/*.md', desc: 'Filed answers to previous queries. These accumulate over time and themselves become searchable knowledge.' },
      ],
      prompt: `# Concept article format

---
concept: Topic Alpha
sources: [raw/articles/paper-a.md, raw/articles/blog-b.md]
updated: 2024-03-15
---

## Definition
<Clear 2-3 sentence definition>

## Key Details
- Detail 1 (source: [[summaries/paper-a]])
- Detail 2 (source: [[summaries/blog-b]])

## Relationships
- Related to [[concepts/topic-beta]]
- Contrast with [[concepts/topic-gamma]]

## Open Questions
- What is still unknown or debated?

## Backlinks
Articles that reference this concept:
- [[concepts/topic-delta]]
- [[outputs/query-2024-01]]`,
      pitfalls: [
        'Avoid deeply nested directories — flat concepts/ and summaries/ folders are easier for LLM navigation.',
        'Keep concept articles focused: one concept per file. Cross-link rather than combining.',
        'index.md should be scannable in one pass — brief descriptions, not full summaries.',
      ],
    },
    {
      id: 'qa',
      label: '④ Q&A & Linting',
      color: '#92400e',
      bg: '#fef3c7',
      border: '#fde68a',
      summary: 'With the wiki compiled, an LLM agent reads the index, selects relevant articles, and answers complex multi-document questions — no RAG required at moderate scale.',
      tools: [
        { name: 'Index-first routing', desc: 'The LLM reads index.md first to identify relevant concept articles, then reads those articles in full. Fast and accurate at ~100 articles.' },
        { name: 'Health check prompts', desc: 'Ask the LLM to scan all summaries for inconsistencies, missing data, or contradictions. It outputs a prioritized fix list.' },
        { name: 'Gap finder', desc: 'Prompt: "Given the concepts in index.md, what important related topics are missing? Suggest new article candidates and their potential sources."' },
        { name: 'Search tool CLI', desc: 'A small naive search engine (inverted index over wiki/*.md) exposed as a CLI tool. The LLM calls it during queries to narrow context.' },
        { name: 'Web augmentation', desc: 'For gaps, the LLM can web-search to impute missing data and propose new raw/ documents to ingest.' },
      ],
      prompt: `# Prompt: Complex Q&A query

You have access to a knowledge base wiki.
Start by reading wiki/index.md.

Question: "How do techniques A and B compare
in terms of efficiency and practical deployment?"

Step 1: Read wiki/index.md
Step 2: Identify concept articles relevant to
        "technique A", "technique B", "efficiency",
        "deployment"
Step 3: Read those concept articles in full
Step 4: Read relevant summaries if needed
Step 5: Synthesize a detailed comparison

Output as: wiki/outputs/compare-a-vs-b.md
Format: ## Summary\\n## Detailed Comparison\\n
        ## Practical Takeaways\\n## Sources`,
      pitfalls: [
        'At >500 articles, pure index-routing degrades — consider a lightweight BM25 search index.',
        'Health checks work best with structured output: ask for JSON {issue, severity, file, suggested_fix}.',
        'Don\'t query and compile simultaneously — the wiki can get into inconsistent state.',
      ],
    },
    {
      id: 'output',
      label: '⑤ Outputs',
      color: '#b91c1c',
      bg: '#fee2e2',
      border: '#fca5a5',
      summary: 'Query answers are rendered as Markdown, Marp slideshows, matplotlib charts, or HTML dashboards — all viewable in Obsidian. Outputs are then filed back into the wiki.',
      tools: [
        { name: 'Markdown reports', desc: 'Default output format. Rendered natively in Obsidian with full support for tables, code blocks, math (KaTeX plugin), and wiki links.' },
        { name: 'Marp slideshows', desc: 'Add YAML frontmatter <code>marp: true</code> to a Markdown file. The Marp Obsidian plugin renders it as a slide deck in-editor. Ideal for summarizing a research area.' },
        { name: 'matplotlib charts', desc: 'LLM writes a Python script, runs it, saves .png to wiki/visualizations/. View in Obsidian. Great for timelines, comparison plots, distribution charts.' },
        { name: 'HTML dashboards', desc: 'For more complex interactives, LLM can generate self-contained HTML files with embedded JS. Open via Obsidian\'s HTML Preview plugin.' },
        { name: 'File back into wiki', desc: 'Every output gets filed to wiki/outputs/<query-slug>.md. Future queries can reference past outputs, compounding knowledge over time.' },
      ],
      prompt: `# Marp slideshow output example

---
marp: true
theme: default
paginate: true
---

# Topic Alpha: Key Findings
## Knowledge Base Query — March 2024

---

## What is Topic Alpha?
<Definition from wiki/concepts/topic-alpha.md>

---

## Technique A vs Technique B
| Dimension    | Technique A | Technique B |
|-------------|-------------|-------------|
| Efficiency  | O(n log n)  | O(n²)       |
| Accuracy    | 94.2%       | 91.8%       |

---

## Open Questions
- ...

---
*Generated from knowledge base — March 2024*`,
      pitfalls: [
        'File every output back into the wiki immediately — the compounding effect is the whole point.',
        'matplotlib scripts should save to a deterministic path so Obsidian can find the image.',
        'For Marp, keep slides text-light — the wiki articles have the full detail.',
      ],
    },
  ];

  let activeStage = 0;

  function render() {
    const container = document.getElementById('kb-interactive');
    if (!container) return;

    const stage = stages[activeStage];

    container.innerHTML = `
      <div class="kb-tabs" role="tablist">
        ${stages.map((s, i) => `
          <button
            class="kb-tab ${i === activeStage ? 'kb-tab--active' : ''}"
            style="${i === activeStage ? `background:${s.bg};color:${s.color};border-color:${s.border};` : ''}"
            data-idx="${i}"
            role="tab"
            aria-selected="${i === activeStage}"
          >${s.label}</button>
        `).join('')}
      </div>

      <div class="kb-panel" style="border-color:${stage.border}">
        <p class="kb-summary">${stage.summary}</p>

        <div class="kb-cols">
          <div class="kb-col">
            <h4 class="kb-col-title" style="color:${stage.color}">Key Tools &amp; Techniques</h4>
            <div class="kb-tools">
              ${stage.tools.map(t => `
                <div class="kb-tool">
                  <div class="kb-tool-name" style="color:${stage.color}">${t.name}</div>
                  <div class="kb-tool-desc">${t.desc}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="kb-col">
            <h4 class="kb-col-title" style="color:${stage.color}">Example Prompt Template</h4>
            <pre class="kb-prompt">${stage.prompt}</pre>
            <h4 class="kb-col-title" style="color:${stage.color};margin-top:16px">Common Pitfalls</h4>
            <ul class="kb-pitfalls">
              ${stage.pitfalls.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.kb-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeStage = parseInt(btn.dataset.idx, 10);
        render();
      });
    });
  }

  // Init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
