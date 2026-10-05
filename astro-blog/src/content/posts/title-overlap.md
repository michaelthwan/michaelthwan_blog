---
title: "Tech Job Titles: Same Job, Different Price"
subtitle: "We read 3,060 job postings from 2026 for ten tech titles in the US and Canada. Titles that ask for almost the same skills can still sit 35% to 60% apart in posted base salary."
authors:
  - "Michael Wan"
affiliations:
  - "Michael Wan Interactive Insights"
published: "2026-10-04"
abstract: "Ten tech titles, from Software Engineer and Forward Deployed Engineer to Business Analyst, measured two ways: the skills their 2026 job postings ask for, and the base salary those postings disclose, set against base and total compensation reported on levels.fyi. Analytics Engineer and Data Analyst, or ML and MLOps Engineer, share most of their skills yet differ by 35% to 60% in posted base salary. Forward Deployed Engineer turns out to be its own job, closest to AI Engineer. Includes a pay explorer and a skill picker that scores your profile against each title."
tags:
  - "data"
  - "careers"
category: "business"
thumbnail: "/img/title-overlap/thumbnail.svg"
---

<style>
  .tov-scroll { overflow-x: auto; margin: 18px 0; }
  .tov-heat { border-collapse: collapse; font-size: 0.78rem; font-variant-numeric: tabular-nums; }
  .tov-heat td { width: 46px; min-width: 40px; text-align: center; padding: 4px 2px; border-bottom: 1px solid var(--color-border, #e5e7eb); }
  .tov-heat th.tov-rowh { text-align: right; font-weight: 500; padding: 4px 10px 4px 0; white-space: nowrap; }
  .tov-heat th.tov-vh { height: 112px; vertical-align: bottom; padding: 0 0 6px; font-weight: 600; }
  .tov-heat th.tov-vh span { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; }
  .tov-heat tr.tov-n td { color: var(--color-gray); border-bottom: none; padding-top: 6px; }
  .tov-heat td.tov-diag { background: repeating-linear-gradient(45deg, transparent 0 3px, rgba(128,136,148,0.18) 3px 4px); }
  .tov-table { width: 100%; border-collapse: collapse; font-size: 0.86rem; margin: 18px 0; }
  .tov-table th, .tov-table td { text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--color-border, #e5e7eb); vertical-align: top; }
  .tov-table thead th { border-bottom: 2px solid var(--color-gray-light, #d1d5db); font-weight: 600; }
  .tov-table tbody th { font-weight: 600; white-space: nowrap; }
  .tov-pay td { white-space: nowrap; font-variant-numeric: tabular-nums; }
  .tov-num { font-variant-numeric: tabular-nums; }
  .tov-muted { color: var(--color-gray); font-size: 0.92em; }
  .tov-flag { font-size: 0.7rem; color: var(--color-gray); border-bottom: 1px dotted var(--color-gray); }
  .tov-range { position: relative; }
  .tov-ico { display: inline-block; width: 13px; height: 13px; margin-right: 6px; vertical-align: -1px;
    background-color: currentColor; opacity: 0.75;
    -webkit-mask: var(--ico) center / contain no-repeat; mask: var(--ico) center / contain no-repeat; }
  .tov-skill .tov-ico { margin-right: 0; }
  .tov-pay-explorer { margin: 20px 0 10px; }
  .tov-pe-controls { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 8px 16px; margin-bottom: 8px; }
  .tov-pe-controls .tov-pe-chips { margin: 0; }
  .tov-pe-select { display: flex; flex-direction: column; gap: 3px; font-size: 0.75rem; font-weight: 600; color: var(--color-gray); }
  .tov-pe-select select { font: inherit; font-size: 0.85rem; font-weight: 400; color: var(--color-text); background: transparent; border: 1px solid var(--color-border, #d1d5db); border-radius: 4px; padding: 4px 8px; }
  .tov-pe-select option { color: #111827; }
  .tov-pe-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
  .tov-pe-chip { font: inherit; font-size: 0.78rem; padding: 2px 10px; border-radius: 12px; border: 1px solid var(--color-border, #d1d5db); background: transparent; color: var(--color-gray); cursor: pointer; }
  .tov-pe-chip.on { border-color: #2a78d6; color: var(--color-text); background: color-mix(in srgb, #2a78d6 12%, transparent); }
  .tov-pe-s-post { --s: var(--dv-blue); }
  .tov-pe-s-lvbase { --s: var(--dv-orange); }
  .tov-pe-s-lvtc { --s: var(--dv-aqua); }
  .tov-pe-chip.tov-pe-s-post.on, .tov-pe-chip.tov-pe-s-lvbase.on, .tov-pe-chip.tov-pe-s-lvtc.on { border-color: var(--s); background: color-mix(in srgb, var(--s) 14%, transparent); }
  .tov-pe-group { display: grid; grid-template-columns: 104px 92px 1fr 172px; column-gap: 10px; row-gap: 0; align-items: center; padding: 2px 0; border-top: 1px solid var(--color-border, #e5e7eb); font-size: 0.72rem; line-height: 1.15; }
  .tov-pe-title { grid-column: 1; font-weight: 600; font-size: 0.82rem; align-self: center; }
  .tov-pe-row { display: contents; }
  .tov-pe-series { grid-column: 2; }
  .tov-pe-series { color: var(--s); font-weight: 600; white-space: nowrap; }
  .tov-pe-track { position: relative; height: 8px; background: var(--dv-track); border-radius: 3px; }
  .tov-pe-whisker { position: absolute; top: 50%; height: 2px; margin-top: -1px; background: var(--s); opacity: 0.6; }
  .tov-pe-box { position: absolute; top: 0; bottom: 0; background: var(--s); opacity: 0.55; border-radius: 2px; }
  .tov-pe-med { position: absolute; top: -1px; bottom: -1px; width: 2px; margin-left: -1px; background: var(--s); }
  .tov-pe-val { font-variant-numeric: tabular-nums; white-space: nowrap; }
  .tov-pe-faded .tov-pe-track, .tov-pe-thin .tov-pe-track { opacity: 0.4; }
  @media (max-width: 560px) {
    .tov-pe-group { grid-template-columns: 78px 1fr; }
    .tov-pe-title { grid-column: 1 / -1; grid-row: auto !important; }
    .tov-pe-series { grid-column: 1; }
    .tov-pe-val { grid-column: 2; margin-bottom: 3px; }
  }
  .tov-flag-strong { color: var(--dv-orange); border-bottom-color: var(--dv-orange); }
  .tov-math .katex-display { overflow-x: auto; overflow-y: hidden; padding: 4px 0; }
  .tov-figcap { color: var(--color-gray); font-size: 0.82rem; line-height: 1.5; margin: -6px 0 22px; }

  .tov-picker { margin: 22px 0; padding: 18px 0; border-top: 1px solid var(--color-border, #e5e7eb); border-bottom: 1px solid var(--color-border, #e5e7eb); }
  .tov-picker h4 { margin: 0 0 4px; font-size: 1rem; }
  .tov-picker-desc { color: var(--color-gray); font-size: 0.85rem; margin: 0 0 14px; }
  .tov-picker-tools { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; font-size: 0.8rem; }
  .tov-picker-tools button { font: inherit; padding: 3px 10px; border: 1px solid var(--color-border, #d1d5db); border-radius: 4px; background: transparent; color: var(--color-text); cursor: pointer; }
  .tov-picker-tools button:hover { border-color: var(--color-gray); }
  .tov-groups { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px 18px; max-height: 340px; overflow-y: auto; padding-right: 6px; }
  .tov-group-name { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-gray); margin: 2px 0 4px; }
  .tov-skill { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; line-height: 1.7; cursor: pointer; }
  .tov-skill input { accent-color: #2a78d6; margin: 0; }
  .tov-result-title { font-size: 0.82rem; font-weight: 600; margin: 18px 0 6px; }
  .tov-picker .dv-val { width: 150px; }
</style>

## Executive summary

A job title in tech is supposed to tell you what the work is. It also sets the pay band. This post checks whether those two things line up.

We collected 3,060 job postings published in 2026 for ten titles in the United States and Canada. For each title we measured which skills the postings ask for, then compared titles by how much those skill lists overlap. Separately, we took the base-salary ranges the postings disclose, and the base salary and total compensation (TC: base plus equity and bonus) that people report on levels.fyi. Every pay figure in this post says which of the two it is.

Key takeaways:

<div class="takeaways">
    <div class="takeaway">
        <span class="takeaway-num">1</span>
        <div class="takeaway-content">
            <strong>Similar skills do not mean similar pay.</strong> The three most similar pairs of titles all score 0.85, yet Analytics Engineer postings advertise a base salary <span class="hi">60%</span> above Data Analyst postings, and ML Engineer postings <span class="hi">35%</span> above MLOps Engineer postings.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">2</span>
        <div class="takeaway-content">
            <strong>Forward Deployed Engineer is more than a renamed Software Engineer.</strong> Customer-facing work appears in <span class="hi">73%</span> of FDE postings and 5% of all others, and its closest neighbour on skills is AI Engineer (0.84), ahead of Software Engineer (0.80).
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">3</span>
        <div class="takeaway-content">
            <strong>AI Engineer sits between FDE and ML Engineer, and is paid below both.</strong> It scores 0.84 with FDE and 0.83 with ML Engineer on skills, and its US postings advertise a median base of 173k, against 207k for FDE and 255k for ML Engineer.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">4</span>
        <div class="takeaway-content">
            <strong>The ten titles form two families.</strong> Builders (Software, FDE, AI, ML, MLOps) and data roles (Data Engineer, Analytics Engineer, Data Analyst, Data Scientist, Business Analyst). No technical skill appears in 60% of postings for every title; only cross-team collaboration does.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">5</span>
        <div class="takeaway-content">
            <strong>The newest titles have real signatures.</strong> Analytics Engineer is defined by dbt and the semantic layer, MLOps by CI/CD for models and experiment tracking, FDE by customer work and prototyping.
        </div>
    </div>
</div>

## How the data was built

This section comes first because every number later depends on it.

**Postings.** We read 2,073 postings from 157 employers through the public job-board APIs of Greenhouse, Lever and SmartRecruiters. We added 987 postings from LinkedIn's public job pages for the cells the boards left thin: all ten titles in Canada, and Analytics Engineer, MLOps Engineer, Data Analyst, Business Analyst, FDE and AI Engineer in the US. Every posting was published between 5 January and 3 October 2026. A posting without a date was dropped, not guessed. The same requisition posted to several cities counts once.

**Titles.** Raw titles were mapped to the ten titles by a fixed rule sheet. Managers, interns, new-grad programmes, sales engineers and contract roles were excluded. A title counts as FDE when it says "forward deployed" (or FDE) and "engineer"; field strategists and forward-deployed data scientists do not. Ambiguous titles were decided by the posting text. We also collected Backend Engineer, but dropped it: in an earlier run its skill profile was almost identical to Software Engineer, so it added a row without adding information.

**Skills.** A taxonomy of 167 skills in seven groups (languages, data engineering, ML, LLM and GenAI, cloud and infrastructure, product and analytics, soft skills) was built from 120 postings. Each skill is one regular expression, applied to every posting after the company introduction, benefits and legal notices are stripped. No language model is involved, so the same postings always give the same matrix.

**Checks.** The taxonomy went through three rounds of review by a reviewer who had not built it, each on postings it had never seen. The final round measured precision (when the extractor says a posting asks for a skill, is it right?) and coverage (of the skills a posting asks for, how many does the taxonomy catch?). It did not pass every target: coverage and the LLM skill group fell short. The numbers are in the [limits](#limits) section.

**Pay.** 1,852 postings disclose a salary range, mostly base salary; 26 Canadian ones that reuse the company's US range are set aside, leaving 1,826. We use each range's midpoint and call it posted base. Separately, levels.fyi publishes self-reported pay per title as distributions of base salary and of total compensation (TC), which adds equity and bonus. Posted base is compared with levels.fyi base; levels.fyi TC is shown as its own series. The sources are never averaged together.

Throughout, a title-country cell with fewer than 20 postings is not shown, and 20 to 39 is marked low n. The pay explorer is the exception: it draws cells from 7 postings, flagged very low n.

## The common core is collaboration

Start with what every one of these jobs asks for. We set the bar before looking at the data: a skill in the common core must appear in at least 60% of postings for every one of the ten titles.

One skill clears it: working across teams. No technical skill does. Python, the most widely requested language, is in 83% to 89% of data-engineering and data-science postings, but in 5% of Business Analyst postings.

<!-- tov:fig core -->
<div class="dv">
<div class="dv-title">Share of JDs asking for the skill: lowest title to highest title (required or preferred)</div>
<div class="dv-row"><div class="dv-label">Cross-functional collaboration</div><div class="dv-bar"><div class="dv-track tov-range"><div class="dv-fill blue" style="margin-left:71.5%;width:17.1%" title="Cross-functional collaboration: lowest title 72%, highest 89%"></div></div><span class="dv-val"><b>72%</b> to 89%</span></div></div>
<div class="dv-row"><div class="dv-label">Stakeholder communication</div><div class="dv-bar"><div class="dv-track tov-range"><div class="dv-fill blue" style="margin-left:38.4%;width:50.7%" title="Stakeholder communication: lowest title 38%, highest 89%"></div></div><span class="dv-val"><b>38%</b> to 89%</span></div></div>
<div class="dv-row"><div class="dv-label">Ownership / autonomy</div><div class="dv-bar"><div class="dv-track tov-range"><div class="dv-fill blue" style="margin-left:33.3%;width:25.6%" title="Ownership / autonomy: lowest title 33%, highest 59%"></div></div><span class="dv-val"><b>33%</b> to 59%</span></div></div>
<div class="dv-row"><div class="dv-label">Comfort with ambiguity / fast pace</div><div class="dv-bar"><div class="dv-track tov-range"><div class="dv-fill blue" style="margin-left:23.2%;width:33.3%" title="Comfort with ambiguity / fast pace: lowest title 23%, highest 56%"></div></div><span class="dv-val"><b>23%</b> to 56%</span></div></div>
<div class="dv-row"><div class="dv-label">Written documentation</div><div class="dv-bar"><div class="dv-track tov-range"><div class="dv-fill blue" style="margin-left:22.4%;width:62.0%" title="Written documentation: lowest title 22%, highest 84%"></div></div><span class="dv-val"><b>22%</b> to 84%</span></div></div>
<div class="dv-row"><div class="dv-label">Problem framing / trade-offs</div><div class="dv-bar"><div class="dv-track tov-range"><div class="dv-fill blue" style="margin-left:22.3%;width:23.6%" title="Problem framing / trade-offs: lowest title 22%, highest 46%"></div></div><span class="dv-val"><b>22%</b> to 46%</span></div></div>
<div class="dv-row"><div class="dv-label">Software testing (unit/integration)</div><div class="dv-bar"><div class="dv-track tov-range"><div class="dv-fill blue" style="margin-left:16.1%;width:42.9%" title="Software testing (unit/integration): lowest title 16%, highest 59%"></div></div><span class="dv-val"><b>16%</b> to 59%</span></div></div>
<div class="dv-row"><div class="dv-label">SQL</div><div class="dv-bar"><div class="dv-track tov-range"><div class="dv-fill blue" style="margin-left:13.3%;width:85.8%" title="SQL: lowest title 13%, highest 99%"></div></div><span class="dv-val"><b>13%</b> to 99%</span></div></div>
</div>
<!-- /tov:fig core -->
<p class="tov-figcap">Each bar spans from the title with the lowest share to the title with the highest. Collaboration is the only bar that starts above 60%.</p>

So the ten titles do not share a technical base. To see what separates them, look at the full map.

## The skill map

The table shows, for 28 skills, the share of postings for each title that ask for it. These are the 28 skills whose share varies most between titles. Titles are ordered so that similar ones sit next to each other; the order comes from the clustering further down.

<!-- tov:fig heatmap -->
<div class="tov-scroll"><table class="tov-heat">
<thead><tr><th></th><th class="tov-vh"><span>ML Eng</span></th><th class="tov-vh"><span>MLOps Eng</span></th><th class="tov-vh"><span>Software Eng</span></th><th class="tov-vh"><span>FDE</span></th><th class="tov-vh"><span>AI Eng</span></th><th class="tov-vh"><span>Business Analyst</span></th><th class="tov-vh"><span>Data Scientist</span></th><th class="tov-vh"><span>Data Eng</span></th><th class="tov-vh"><span>Analytics Eng</span></th><th class="tov-vh"><span>Data Analyst</span></th></tr></thead>
<tbody>
<tr><th class="tov-rowh">Machine learning (general)</th><td class="heat hot" style="--v:0.99">99</td><td class="heat hot" style="--v:0.91">91</td><td class="heat" style="--v:0.21">21</td><td class="heat" style="--v:0.30">30</td><td class="heat hot" style="--v:0.64">64</td><td class="heat" style="--v:0.03">3</td><td class="heat hot" style="--v:0.72">72</td><td class="heat" style="--v:0.34">34</td><td class="heat" style="--v:0.20">20</td><td class="heat" style="--v:0.14">14</td></tr>
<tr><th class="tov-rowh">MLOps / ML platform</th><td class="heat hot" style="--v:0.70">70</td><td class="heat hot" style="--v:0.88">88</td><td class="heat" style="--v:0.06">6</td><td class="heat" style="--v:0.20">20</td><td class="heat" style="--v:0.32">32</td><td class="heat" style="--v:0.01">1</td><td class="heat" style="--v:0.15">15</td><td class="heat" style="--v:0.06">6</td><td class="heat" style="--v:0.00">0</td><td class="heat" style="--v:0.00">0</td></tr>
<tr><th class="tov-rowh"><span class="tov-ico" style="--ico:url(/img/title-overlap/icons/kubernetes.svg)" aria-hidden="true"></span>Kubernetes</th><td class="heat" style="--v:0.19">19</td><td class="heat hot" style="--v:0.75">75</td><td class="heat" style="--v:0.30">30</td><td class="heat" style="--v:0.15">15</td><td class="heat" style="--v:0.25">25</td><td class="heat" style="--v:0.00">0</td><td class="heat" style="--v:0.03">3</td><td class="heat" style="--v:0.15">15</td><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.01">0</td></tr>
<tr><th class="tov-rowh">CI/CD</th><td class="heat" style="--v:0.19">19</td><td class="heat hot" style="--v:0.71">71</td><td class="heat" style="--v:0.27">27</td><td class="heat" style="--v:0.21">21</td><td class="heat" style="--v:0.32">32</td><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.07">7</td><td class="heat" style="--v:0.42">42</td><td class="heat" style="--v:0.29">29</td><td class="heat" style="--v:0.01">0</td></tr>
<tr><th class="tov-rowh">Observability / monitoring (Prometheus, Grafana, Datadog)</th><td class="heat" style="--v:0.26">26</td><td class="heat hot" style="--v:0.69">69</td><td class="heat" style="--v:0.40">40</td><td class="heat" style="--v:0.20">20</td><td class="heat" style="--v:0.39">39</td><td class="heat" style="--v:0.03">3</td><td class="heat" style="--v:0.09">9</td><td class="heat" style="--v:0.51">51</td><td class="heat" style="--v:0.28">28</td><td class="heat" style="--v:0.05">5</td></tr>
<tr><th class="tov-rowh"><span class="tov-ico" style="--ico:url(/img/title-overlap/icons/docker_containers.svg)" aria-hidden="true"></span>Docker / containers</th><td class="heat" style="--v:0.13">13</td><td class="heat hot" style="--v:0.67">67</td><td class="heat" style="--v:0.19">19</td><td class="heat" style="--v:0.14">14</td><td class="heat" style="--v:0.34">34</td><td class="heat" style="--v:0.00">0</td><td class="heat" style="--v:0.04">4</td><td class="heat" style="--v:0.13">13</td><td class="heat" style="--v:0.04">4</td><td class="heat" style="--v:0.00">0</td></tr>
<tr><th class="tov-rowh">AWS</th><td class="heat" style="--v:0.27">27</td><td class="heat hot" style="--v:0.63">63</td><td class="heat" style="--v:0.35">35</td><td class="heat" style="--v:0.31">31</td><td class="heat" style="--v:0.43">43</td><td class="heat" style="--v:0.01">1</td><td class="heat" style="--v:0.12">12</td><td class="heat" style="--v:0.55">55</td><td class="heat" style="--v:0.20">20</td><td class="heat" style="--v:0.07">7</td></tr>
<tr><th class="tov-rowh">Customer-facing / client work</th><td class="heat" style="--v:0.04">4</td><td class="heat" style="--v:0.00">0</td><td class="heat" style="--v:0.04">4</td><td class="heat hot" style="--v:0.73">73</td><td class="heat" style="--v:0.07">7</td><td class="heat" style="--v:0.07">7</td><td class="heat" style="--v:0.08">8</td><td class="heat" style="--v:0.05">5</td><td class="heat" style="--v:0.04">4</td><td class="heat" style="--v:0.04">4</td></tr>
<tr><th class="tov-rowh">LLMs (general)</th><td class="heat" style="--v:0.57">57</td><td class="heat" style="--v:0.42">42</td><td class="heat" style="--v:0.17">17</td><td class="heat" style="--v:0.49">49</td><td class="heat hot" style="--v:0.89">89</td><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.25">25</td><td class="heat" style="--v:0.13">13</td><td class="heat" style="--v:0.15">15</td><td class="heat" style="--v:0.06">6</td></tr>
<tr><th class="tov-rowh">AI agents / agentic systems</th><td class="heat" style="--v:0.40">40</td><td class="heat" style="--v:0.20">20</td><td class="heat" style="--v:0.23">23</td><td class="heat" style="--v:0.52">52</td><td class="heat hot" style="--v:0.80">80</td><td class="heat" style="--v:0.01">1</td><td class="heat" style="--v:0.14">14</td><td class="heat" style="--v:0.16">16</td><td class="heat" style="--v:0.13">13</td><td class="heat" style="--v:0.05">5</td></tr>
<tr><th class="tov-rowh">RAG / retrieval</th><td class="heat" style="--v:0.22">22</td><td class="heat" style="--v:0.15">15</td><td class="heat" style="--v:0.05">5</td><td class="heat" style="--v:0.24">24</td><td class="heat hot" style="--v:0.70">70</td><td class="heat" style="--v:0.00">0</td><td class="heat" style="--v:0.10">10</td><td class="heat" style="--v:0.06">6</td><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.00">0</td></tr>
<tr><th class="tov-rowh">API design (REST, gRPC, GraphQL)</th><td class="heat" style="--v:0.22">22</td><td class="heat" style="--v:0.40">40</td><td class="heat" style="--v:0.47">47</td><td class="heat" style="--v:0.59">59</td><td class="heat hot" style="--v:0.66">66</td><td class="heat" style="--v:0.15">15</td><td class="heat" style="--v:0.08">8</td><td class="heat" style="--v:0.29">29</td><td class="heat" style="--v:0.15">15</td><td class="heat" style="--v:0.05">5</td></tr>
<tr><th class="tov-rowh">Prompt / context engineering</th><td class="heat" style="--v:0.12">12</td><td class="heat" style="--v:0.05">5</td><td class="heat" style="--v:0.04">4</td><td class="heat" style="--v:0.21">21</td><td class="heat hot" style="--v:0.63">63</td><td class="heat" style="--v:0.01">1</td><td class="heat" style="--v:0.06">6</td><td class="heat" style="--v:0.01">1</td><td class="heat" style="--v:0.03">3</td><td class="heat" style="--v:0.01">0</td></tr>
<tr><th class="tov-rowh">Written documentation</th><td class="heat" style="--v:0.22">22</td><td class="heat" style="--v:0.28">28</td><td class="heat" style="--v:0.28">28</td><td class="heat" style="--v:0.40">40</td><td class="heat" style="--v:0.32">32</td><td class="heat hot" style="--v:0.84">84</td><td class="heat" style="--v:0.24">24</td><td class="heat" style="--v:0.39">39</td><td class="heat hot" style="--v:0.63">63</td><td class="heat" style="--v:0.43">43</td></tr>
<tr><th class="tov-rowh">Requirements gathering / analysis</th><td class="heat" style="--v:0.12">12</td><td class="heat" style="--v:0.09">9</td><td class="heat" style="--v:0.08">8</td><td class="heat" style="--v:0.18">18</td><td class="heat" style="--v:0.23">23</td><td class="heat hot" style="--v:0.82">82</td><td class="heat" style="--v:0.13">13</td><td class="heat" style="--v:0.19">19</td><td class="heat" style="--v:0.49">49</td><td class="heat" style="--v:0.32">32</td></tr>
<tr><th class="tov-rowh">Process mapping / improvement</th><td class="heat" style="--v:0.00">0</td><td class="heat" style="--v:0.05">5</td><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.04">4</td><td class="heat" style="--v:0.06">6</td><td class="heat hot" style="--v:0.78">78</td><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.06">6</td><td class="heat" style="--v:0.07">7</td><td class="heat" style="--v:0.15">15</td></tr>
<tr><th class="tov-rowh"><span class="tov-ico" style="--ico:url(/img/title-overlap/icons/agile_jira.svg)" aria-hidden="true"></span>Agile / Jira</th><td class="heat" style="--v:0.04">4</td><td class="heat" style="--v:0.12">12</td><td class="heat" style="--v:0.07">7</td><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.15">15</td><td class="heat hot" style="--v:0.65">65</td><td class="heat" style="--v:0.04">4</td><td class="heat" style="--v:0.09">9</td><td class="heat" style="--v:0.07">7</td><td class="heat" style="--v:0.09">9</td></tr>
<tr><th class="tov-rowh"><span class="tov-ico" style="--ico:url(/img/title-overlap/icons/python.svg)" aria-hidden="true"></span>Python</th><td class="heat hot" style="--v:0.73">73</td><td class="heat hot" style="--v:0.80">80</td><td class="heat" style="--v:0.45">45</td><td class="heat hot" style="--v:0.63">63</td><td class="heat hot" style="--v:0.77">77</td><td class="heat" style="--v:0.05">5</td><td class="heat hot" style="--v:0.89">89</td><td class="heat hot" style="--v:0.83">83</td><td class="heat hot" style="--v:0.74">74</td><td class="heat" style="--v:0.58">58</td></tr>
<tr><th class="tov-rowh">ETL / ELT pipelines</th><td class="heat" style="--v:0.31">31</td><td class="heat" style="--v:0.39">39</td><td class="heat" style="--v:0.15">15</td><td class="heat" style="--v:0.28">28</td><td class="heat" style="--v:0.26">26</td><td class="heat" style="--v:0.03">3</td><td class="heat" style="--v:0.23">23</td><td class="heat hot" style="--v:0.89">89</td><td class="heat hot" style="--v:0.61">61</td><td class="heat" style="--v:0.29">29</td></tr>
<tr><th class="tov-rowh">Data quality / contracts / testing</th><td class="heat" style="--v:0.09">9</td><td class="heat" style="--v:0.16">16</td><td class="heat" style="--v:0.07">7</td><td class="heat" style="--v:0.06">6</td><td class="heat" style="--v:0.08">8</td><td class="heat" style="--v:0.11">11</td><td class="heat" style="--v:0.14">14</td><td class="heat hot" style="--v:0.71">71</td><td class="heat hot" style="--v:0.69">69</td><td class="heat" style="--v:0.55">55</td></tr>
<tr><th class="tov-rowh">Data platform / data products</th><td class="heat" style="--v:0.07">7</td><td class="heat" style="--v:0.21">21</td><td class="heat" style="--v:0.11">11</td><td class="heat" style="--v:0.14">14</td><td class="heat" style="--v:0.07">7</td><td class="heat" style="--v:0.05">5</td><td class="heat" style="--v:0.19">19</td><td class="heat hot" style="--v:0.70">70</td><td class="heat" style="--v:0.57">57</td><td class="heat" style="--v:0.24">24</td></tr>
<tr><th class="tov-rowh">SQL</th><td class="heat" style="--v:0.19">19</td><td class="heat" style="--v:0.21">21</td><td class="heat" style="--v:0.13">13</td><td class="heat" style="--v:0.16">16</td><td class="heat" style="--v:0.15">15</td><td class="heat" style="--v:0.25">25</td><td class="heat hot" style="--v:0.78">78</td><td class="heat hot" style="--v:0.84">84</td><td class="heat hot" style="--v:0.99">99</td><td class="heat hot" style="--v:0.85">85</td></tr>
<tr><th class="tov-rowh">Data modelling (dimensional, star schema)</th><td class="heat" style="--v:0.01">1</td><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.11">11</td><td class="heat" style="--v:0.07">7</td><td class="heat" style="--v:0.09">9</td><td class="heat" style="--v:0.10">10</td><td class="heat" style="--v:0.14">14</td><td class="heat hot" style="--v:0.74">74</td><td class="heat hot" style="--v:0.88">88</td><td class="heat" style="--v:0.40">40</td></tr>
<tr><th class="tov-rowh">Business intelligence (general)</th><td class="heat" style="--v:0.03">3</td><td class="heat" style="--v:0.00">0</td><td class="heat" style="--v:0.01">1</td><td class="heat" style="--v:0.01">1</td><td class="heat" style="--v:0.01">1</td><td class="heat" style="--v:0.16">16</td><td class="heat" style="--v:0.12">12</td><td class="heat" style="--v:0.28">28</td><td class="heat hot" style="--v:0.77">77</td><td class="heat hot" style="--v:0.72">72</td></tr>
<tr><th class="tov-rowh">dbt</th><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.03">3</td><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.00">0</td><td class="heat" style="--v:0.08">8</td><td class="heat" style="--v:0.46">46</td><td class="heat hot" style="--v:0.75">75</td><td class="heat" style="--v:0.14">14</td></tr>
<tr><th class="tov-rowh">Dashboards / reporting</th><td class="heat" style="--v:0.05">5</td><td class="heat" style="--v:0.10">10</td><td class="heat" style="--v:0.10">10</td><td class="heat" style="--v:0.08">8</td><td class="heat" style="--v:0.13">13</td><td class="heat" style="--v:0.37">37</td><td class="heat" style="--v:0.33">33</td><td class="heat" style="--v:0.39">39</td><td class="heat hot" style="--v:0.81">81</td><td class="heat hot" style="--v:0.87">87</td></tr>
<tr><th class="tov-rowh">Data analysis (general)</th><td class="heat" style="--v:0.07">7</td><td class="heat" style="--v:0.01">1</td><td class="heat" style="--v:0.05">5</td><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.06">6</td><td class="heat" style="--v:0.37">37</td><td class="heat" style="--v:0.37">37</td><td class="heat" style="--v:0.09">9</td><td class="heat" style="--v:0.33">33</td><td class="heat hot" style="--v:0.78">78</td></tr>
<tr><th class="tov-rowh">Data visualisation / storytelling</th><td class="heat" style="--v:0.01">1</td><td class="heat" style="--v:0.04">4</td><td class="heat" style="--v:0.03">3</td><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.02">2</td><td class="heat" style="--v:0.09">9</td><td class="heat" style="--v:0.32">32</td><td class="heat" style="--v:0.07">7</td><td class="heat" style="--v:0.30">30</td><td class="heat hot" style="--v:0.67">67</td></tr>
<tr class="tov-n"><th class="tov-rowh">JDs (n)</th><td>205</td><td>112</td><td>1583</td><td>193</td><td>161</td><td>174</td><td>185</td><td>136</td><td>112</td><td>199</td></tr>
</tbody></table></div>
<!-- /tov:fig heatmap -->
<p class="tov-figcap">Percent of postings mentioning the skill as required or preferred. Darker means more common.</p>

Two blocks stand out. On the left, the builder titles share Python and cloud platforms, and ML, MLOps and AI Engineer add the ML stack. On the right, the data titles share SQL and data modelling. The boundary is sharp: SQL is in 99% of Analytics Engineer postings and 13% of Software Engineer postings.

## Signature skills

Raw prevalence mixes two things: what a title needs, and what every title needs. To isolate the first, we compare each title's rate for a skill with the rate in all other titles combined, using a smoothed log-odds ratio (details below). A signature skill is common in that title and rare elsewhere.

<!-- tov:fig signatures -->
<div class="tov-scroll"><table class="tov-table">
<thead><tr><th>Title</th><th>Signature skills <span class="tov-muted">(this title vs all others)</span></th></tr></thead>
<tbody>
<tr><th>ML Eng</th><td>Machine learning (general) <span class="tov-muted">98% vs 29%</span>; Graph ML / GNNs <span class="tov-muted">4% vs 0%</span>; JAX <span class="tov-muted">7% vs 0%</span>; <span class="tov-ico" style="--ico:url(/img/title-overlap/icons/pytorch.svg)" aria-hidden="true"></span>PyTorch <span class="tov-muted">53% vs 5%</span></td></tr>
<tr><th>MLOps Eng</th><td>CI/CD for ML / continuous training <span class="tov-muted">54% vs 2%</span>; <span class="tov-ico" style="--ico:url(/img/title-overlap/icons/experiment_tracking.svg)" aria-hidden="true"></span>Experiment tracking / model registry (MLflow, W&B) <span class="tov-muted">54% vs 3%</span>; MLOps / ML platform <span class="tov-muted">88% vs 12%</span>; Feature stores <span class="tov-muted">23% vs 2%</span></td></tr>
<tr><th>Software Eng</th><td><span class="tov-ico" style="--ico:url(/img/title-overlap/icons/kotlin.svg)" aria-hidden="true"></span>Kotlin <span class="tov-muted">9% vs 1%</span>; <span class="tov-ico" style="--ico:url(/img/title-overlap/icons/golang.svg)" aria-hidden="true"></span>Go <span class="tov-muted">29% vs 5%</span>; Mobile development (iOS, Android, Swift) <span class="tov-muted">8% vs 1%</span>; <span class="tov-ico" style="--ico:url(/img/title-overlap/icons/rust.svg)" aria-hidden="true"></span>Rust <span class="tov-muted">11% vs 2%</span></td></tr>
<tr><th>FDE</th><td>Customer-facing / client work <span class="tov-muted">72% vs 5%</span>; Enterprise integrations / iPaaS <span class="tov-muted">10% vs 2%</span>; Rapid prototyping / proof of concept <span class="tov-muted">38% vs 11%</span>; Product sense / product strategy <span class="tov-muted">27% vs 8%</span></td></tr>
<tr><th>AI Eng</th><td>Prompt / context engineering <span class="tov-muted">63% vs 5%</span>; RAG / retrieval <span class="tov-muted">70% vs 8%</span>; <span class="tov-ico" style="--ico:url(/img/title-overlap/icons/llm_frameworks.svg)" aria-hidden="true"></span>LLM frameworks (LangChain, LlamaIndex, HF) <span class="tov-muted">46% vs 3%</span>; LLMs (general) <span class="tov-muted">89% vs 21%</span></td></tr>
<tr><th>Business Analyst</th><td>Process mapping / improvement <span class="tov-muted">78% vs 3%</span>; UAT / acceptance testing <span class="tov-muted">44% vs 2%</span>; Requirements gathering / analysis <span class="tov-muted">82% vs 14%</span>; <span class="tov-ico" style="--ico:url(/img/title-overlap/icons/agile_jira.svg)" aria-hidden="true"></span>Agile / Jira <span class="tov-muted">65% vs 7%</span></td></tr>
<tr><th>Data Scientist</th><td>Causal inference <span class="tov-muted">35% vs 1%</span>; Statistics / statistical modelling <span class="tov-muted">61% vs 6%</span>; <span class="tov-ico" style="--ico:url(/img/title-overlap/icons/r_lang.svg)" aria-hidden="true"></span>R <span class="tov-muted">29% vs 2%</span>; Predictive modelling / classification <span class="tov-muted">32% vs 3%</span></td></tr>
<tr><th>Data Eng</th><td>Change data capture <span class="tov-muted">14% vs 1%</span>; ETL / ELT pipelines <span class="tov-muted">89% vs 21%</span>; Data modelling (dimensional, star schema) <span class="tov-muted">74% vs 15%</span>; Data quality / contracts / testing <span class="tov-muted">71% vs 14%</span></td></tr>
<tr><th>Analytics Eng</th><td>Semantic / metrics layer <span class="tov-muted">58% vs 3%</span>; SQL <span class="tov-muted">99% vs 27%</span>; dbt <span class="tov-muted">75% vs 6%</span>; Reverse ETL <span class="tov-muted">9% vs 0%</span></td></tr>
<tr><th>Data Analyst</th><td>Power BI <span class="tov-muted">51% vs 3%</span>; Tableau <span class="tov-muted">56% vs 3%</span>; Business intelligence (general) <span class="tov-muted">72% vs 7%</span>; Data analysis (general) <span class="tov-muted">78% vs 10%</span></td></tr>
</tbody></table></div>
<!-- /tov:fig signatures -->

The newest titles hold up. Analytics Engineer has a sharp signature: dbt in 75% of its postings against 6% elsewhere, and the semantic layer in 58% against 3%. MLOps Engineer has its own: CI/CD for models in 54% of its postings against 2% of the rest. FDE's marker is customer-facing work, at 73% against 5%.

<details>
<summary>Details: the log-odds score</summary>

For skill $s$ and title $t$, let $y\_t$ be the number of postings for $t$ that mention $s$, out of $n\_t$, and $y\_r$, $n\_r$ the same counts for all other titles. With pooled rate $p\_0$ and a prior worth $\alpha = 10$ postings,

<div class="tov-math">

$$\delta_{s,t} = \log\frac{y_t + \alpha p_0}{n_t - y_t + \alpha(1-p_0)} - \log\frac{y_r + \alpha p_0}{n_r - y_r + \alpha(1-p_0)}$$

</div>

A skill is listed only when $\delta$ is at least 1.96 standard errors above zero. The prior keeps a skill seen in 2 of 23 postings from outranking one seen in 400 of 1,000.

</details>

## Forward Deployed Engineer, the newest title

FDE needs an introduction. According to Pragmatic Engineer, Palantir created the role in the early 2010s and ran two engineering tracks: "Dev", one capability for many customers, and "Delta", one customer served with many capabilities ([Pragmatic Engineer, Aug 2025](https://newsletter.pragmaticengineer.com/p/forward-deployed-engineers)). An FDE is embedded with a customer and writes production code against that customer's problem, then feeds what it learns back into the product. That separates it from a sales or solutions engineer, who works before the sale, and from a consultant, who advises rather than ships.

The title spread with enterprise AI. OpenAI built an FDE team in 2025, and Tom Tunguz estimates that by mid-2026 the large AI labs and cloud providers had committed roughly $10B to FDE-style deployment groups ([Tom Tunguz, Jul 2026](https://tomtunguz.com/fde-arms-race/)). Some observers say the 2026 versions drift toward consulting, with about a quarter of the time spent coding ([Pragmatic Engineer, May 2026](https://blog.pragmaticengineer.com/the-pulse-forward-deployed-engineering-heats-up-again/)).

The postings agree that it is a different job. Besides customer work, FDE postings ask for prototyping (38% against 11% elsewhere) and, less sharply, product sense (27%, about the level of Data Scientist postings). They ask for stakeholder communication more often than Software Engineer postings (70% against 52%), though less often than Data Scientist, Analytics Engineer and analyst postings (85% to 89%). On skills, FDE is closest to AI Engineer (0.84), then Software Engineer (0.80).

## Which titles are the same job

If two titles ask for the same skills in the same proportions, they describe the same job. We measure this with the cosine similarity of their skill-prevalence vectors: 1.0 means identical proportions, 0 means no overlap.

<!-- tov:fig similarity -->
<div class="tov-scroll"><table class="tov-heat tov-sim">
<thead><tr><th></th><th class="tov-vh"><span>ML Eng</span></th><th class="tov-vh"><span>MLOps Eng</span></th><th class="tov-vh"><span>Software Eng</span></th><th class="tov-vh"><span>FDE</span></th><th class="tov-vh"><span>AI Eng</span></th><th class="tov-vh"><span>Business Analyst</span></th><th class="tov-vh"><span>Data Scientist</span></th><th class="tov-vh"><span>Data Eng</span></th><th class="tov-vh"><span>Analytics Eng</span></th><th class="tov-vh"><span>Data Analyst</span></th></tr></thead>
<tbody>
<tr><th class="tov-rowh">ML Eng</th><td class="tov-diag"></td><td class="heat hot" style="--v:0.75">0.85</td><td class="heat" style="--v:0.54">0.72</td><td class="heat" style="--v:0.53">0.72</td><td class="heat hot" style="--v:0.72">0.83</td><td class="heat" style="--v:0.00">0.38</td><td class="heat" style="--v:0.57">0.74</td><td class="heat" style="--v:0.34">0.60</td><td class="heat" style="--v:0.15">0.49</td><td class="heat" style="--v:0.05">0.43</td></tr>
<tr><th class="tov-rowh">MLOps Eng</th><td class="heat hot" style="--v:0.75">0.85</td><td class="tov-diag"></td><td class="heat" style="--v:0.56">0.74</td><td class="heat" style="--v:0.43">0.66</td><td class="heat" style="--v:0.59">0.76</td><td class="heat" style="--v:0.00">0.32</td><td class="heat" style="--v:0.31">0.59</td><td class="heat" style="--v:0.44">0.66</td><td class="heat" style="--v:0.11">0.47</td><td class="heat" style="--v:0.00">0.36</td></tr>
<tr><th class="tov-rowh">Software Eng</th><td class="heat" style="--v:0.54">0.72</td><td class="heat" style="--v:0.56">0.74</td><td class="tov-diag"></td><td class="heat hot" style="--v:0.67">0.80</td><td class="heat" style="--v:0.59">0.76</td><td class="heat" style="--v:0.21">0.53</td><td class="heat" style="--v:0.39">0.64</td><td class="heat" style="--v:0.53">0.72</td><td class="heat" style="--v:0.33">0.60</td><td class="heat" style="--v:0.16">0.50</td></tr>
<tr><th class="tov-rowh">FDE</th><td class="heat" style="--v:0.53">0.72</td><td class="heat" style="--v:0.43">0.66</td><td class="heat hot" style="--v:0.67">0.80</td><td class="tov-diag"></td><td class="heat hot" style="--v:0.74">0.84</td><td class="heat" style="--v:0.23">0.54</td><td class="heat" style="--v:0.47">0.68</td><td class="heat" style="--v:0.43">0.66</td><td class="heat" style="--v:0.31">0.59</td><td class="heat" style="--v:0.20">0.52</td></tr>
<tr><th class="tov-rowh">AI Eng</th><td class="heat hot" style="--v:0.72">0.83</td><td class="heat" style="--v:0.59">0.76</td><td class="heat" style="--v:0.59">0.76</td><td class="heat hot" style="--v:0.74">0.84</td><td class="tov-diag"></td><td class="heat" style="--v:0.07">0.44</td><td class="heat" style="--v:0.42">0.65</td><td class="heat" style="--v:0.35">0.61</td><td class="heat" style="--v:0.20">0.52</td><td class="heat" style="--v:0.06">0.43</td></tr>
<tr><th class="tov-rowh">Business Analyst</th><td class="heat" style="--v:0.00">0.38</td><td class="heat" style="--v:0.00">0.32</td><td class="heat" style="--v:0.21">0.53</td><td class="heat" style="--v:0.23">0.54</td><td class="heat" style="--v:0.07">0.44</td><td class="tov-diag"></td><td class="heat" style="--v:0.26">0.55</td><td class="heat" style="--v:0.12">0.47</td><td class="heat" style="--v:0.35">0.61</td><td class="heat" style="--v:0.44">0.66</td></tr>
<tr><th class="tov-rowh">Data Scientist</th><td class="heat" style="--v:0.57">0.74</td><td class="heat" style="--v:0.31">0.59</td><td class="heat" style="--v:0.39">0.64</td><td class="heat" style="--v:0.47">0.68</td><td class="heat" style="--v:0.42">0.65</td><td class="heat" style="--v:0.26">0.55</td><td class="tov-diag"></td><td class="heat" style="--v:0.45">0.67</td><td class="heat" style="--v:0.55">0.73</td><td class="heat hot" style="--v:0.64">0.78</td></tr>
<tr><th class="tov-rowh">Data Eng</th><td class="heat" style="--v:0.34">0.60</td><td class="heat" style="--v:0.44">0.66</td><td class="heat" style="--v:0.53">0.72</td><td class="heat" style="--v:0.43">0.66</td><td class="heat" style="--v:0.35">0.61</td><td class="heat" style="--v:0.12">0.47</td><td class="heat" style="--v:0.45">0.67</td><td class="tov-diag"></td><td class="heat hot" style="--v:0.75">0.85</td><td class="heat" style="--v:0.45">0.67</td></tr>
<tr><th class="tov-rowh">Analytics Eng</th><td class="heat" style="--v:0.15">0.49</td><td class="heat" style="--v:0.11">0.47</td><td class="heat" style="--v:0.33">0.60</td><td class="heat" style="--v:0.31">0.59</td><td class="heat" style="--v:0.20">0.52</td><td class="heat" style="--v:0.35">0.61</td><td class="heat" style="--v:0.55">0.73</td><td class="heat hot" style="--v:0.75">0.85</td><td class="tov-diag"></td><td class="heat hot" style="--v:0.76">0.85</td></tr>
<tr><th class="tov-rowh">Data Analyst</th><td class="heat" style="--v:0.05">0.43</td><td class="heat" style="--v:0.00">0.36</td><td class="heat" style="--v:0.16">0.50</td><td class="heat" style="--v:0.20">0.52</td><td class="heat" style="--v:0.06">0.43</td><td class="heat" style="--v:0.44">0.66</td><td class="heat hot" style="--v:0.64">0.78</td><td class="heat" style="--v:0.45">0.67</td><td class="heat hot" style="--v:0.76">0.85</td><td class="tov-diag"></td></tr>
</tbody></table></div>
<!-- /tov:fig similarity -->
<p class="tov-figcap">Cosine similarity of skill profiles. Shading starts at 0.40, the floor for these ten titles.</p>

No pair of the ten is a duplicate. The closest pairs, at about 0.85, are Analytics Engineer with Data Analyst, ML Engineer with MLOps Engineer, and Data Engineer with Analytics Engineer. Next come FDE with AI Engineer (0.84) and ML Engineer with AI Engineer (0.83). AI Engineer is further from Software Engineer, at 0.76.

Hierarchical clustering on the same numbers gives the two families. Analytics Engineer and Data Analyst merge first, then ML and MLOps, then AI Engineer and FDE. Software Engineer joins the AI and FDE pair, and that group then joins ML and MLOps. On the data side, Business Analyst is the last to join. The two families merge only at the final step.

**Seniority moves some titles toward a neighbour, not all.** Senior Data Analyst postings resemble Analytics Engineer postings more (similarity 0.88) than junior and mid-level ones do (0.82), and senior AI Engineer, MLOps and Business Analyst postings also sit slightly closer to their nearest title. For the other six titles the senior postings sit further from their nearest neighbour. Senior Data Engineer postings, for example, move toward Software Engineer (0.74 against 0.67) and away from Analytics Engineer (0.83 against 0.86).

## Pay by title

The explorer shows three distributions for each title, each labelled with what it measures. **Posted base** is the midpoint of the base-salary range in each posting. **levels.fyi base** is the base salary people report for the title. **levels.fyi TC** is their total compensation: base plus equity and bonus. Each bar is a box plot: the thin line runs from the 10th to the 90th percentile, the box covers the middle half, and the tick marks the median.

<div class="dv tov-pay-explorer" id="tov-pay-explorer"></div>
<p class="tov-figcap">Filter by country, level, series (posted base, levels.fyi base, levels.fyi TC) and title. Canada is in CAD, so compare within a country. levels.fyi has no dedicated page for six of these titles; we used the closest job-title page under Software Engineer, listed in the limits section.</p>

Three things to read carefully.

First, compare base with base, and level with level. Across all levels, US posted base sits well above the levels.fyi title page: Software Engineer postings have a median midpoint of 220k, while the title page reports a median base of 160k (and a median TC of 196k). Two things make up that 60k. About 40k is employer mix: submissions listed on the levels.fyi company pages of the posting-sample employers have a median base of 200k, so these employers pay more than levels.fyi's whole population (this step also absorbs the newer offer dates and which submissions the company pages list). About 22k is level mix: 82% of the postings are Senior or Staff+, against 56% of those submissions, and reweighted to the postings' level mix the same submissions come to 222k. Matched by level, within those employers, the two sources nearly agree: 175k against 160k at Junior/Mid, 212k against 219k at Senior, and 260k against 260k at Staff+. Data Scientists agree at Senior (202k against 200k), and so do Canadian Senior Software Engineers (178k against 173k CAD). When a US posting lists several regional ranges we take the first, usually San Francisco or New York, so posted base is still "what this sample of employers advertises".

Second, the gap between base and TC is mostly an engineering phenomenon. On levels.fyi, ML Engineer base is 200k and TC 283k; Data Analyst base is 107k and TC 110k. Equity is where the builder titles pull away, and postings never show it.

Third, levels.fyi does not publish a Junior/Mid, Senior and Staff+ breakdown per title. It publishes pay per company level (Amazon SDE II, Shopify L6). For the level filter we took those company pages for the employers in our posting sample and mapped each company's ladder to tiers: levels titled Senior are Senior, levels below them are Junior/Mid, and levels above them are Staff+. A ladder with no Senior title borrows the tier of the same level code from that company's Software Engineer ladder, or else uses the typical years of experience at that level. Only submissions with 2025-2026 offer dates are used. levels.fyi splits these by job family, so this works for Software Engineer, Data Scientist and Business Analyst, and through focus tags for ML Engineer and Data Engineer; Data Analyst has too few submissions to use. FDE, AI Engineer, MLOps and Analytics Engineer have no levels.fyi split, so with a level selected they show posted base only. Junior postings are almost absent (29 of 3,060), because new-grad programmes were excluded, so junior and mid-level are reported together as Junior/Mid.

## Where skills and pay disagree

If titles were pure descriptions of work, similar skill profiles would come with similar pay. The table lists the ten most similar pairs and the pay gap between them.

<!-- tov:fig disagree -->
<div class="tov-scroll"><table class="tov-table">
<thead><tr><th>Pair (higher posted base first)</th><th>Skill similarity</th><th>Posted base gap</th><th>levels.fyi base gap</th><th>levels.fyi TC gap</th></tr></thead>
<tbody>
<tr><th>Analytics Eng <span class="tov-muted">over</span> Data Analyst</th><td class="heat hot" style="--v:0.76">0.85</td><td class="dbar" style="--v:0.61">+60%</td><td class="tov-num">+41%</td><td class="tov-num">+55%</td></tr>
<tr><th>ML Eng <span class="tov-muted">over</span> MLOps Eng</th><td class="heat hot" style="--v:0.75">0.85</td><td class="dbar" style="--v:0.35">+35%</td><td class="tov-num">+43%</td><td class="tov-num">+89%</td></tr>
<tr><th>Data Eng <span class="tov-muted">over</span> Analytics Eng</th><td class="heat hot" style="--v:0.75">0.85</td><td class="dbar" style="--v:0.23">+23%</td><td class="tov-num">-5%</td><td class="tov-num">-8%</td></tr>
<tr><th>FDE <span class="tov-muted">over</span> AI Eng</th><td class="heat hot" style="--v:0.74">0.84</td><td class="dbar" style="--v:0.20">+19%</td><td class="tov-num">+18%</td><td class="tov-num">+35%</td></tr>
<tr><th>ML Eng <span class="tov-muted">over</span> AI Eng</th><td class="heat hot" style="--v:0.72">0.83</td><td class="dbar" style="--v:0.48">+47%</td><td class="tov-num">+35%</td><td class="tov-num">+77%</td></tr>
<tr><th>Software Eng <span class="tov-muted">over</span> FDE</th><td class="heat hot" style="--v:0.67">0.80</td><td class="dbar" style="--v:0.07">+7%</td><td class="tov-num">-9%</td><td class="tov-num">-9%</td></tr>
<tr><th>Data Scientist <span class="tov-muted">over</span> Data Analyst</th><td class="heat hot" style="--v:0.64">0.78</td><td class="dbar" style="--v:1.00">+98%</td><td class="tov-num">+50%</td><td class="tov-num">+65%</td></tr>
<tr><th>MLOps Eng <span class="tov-muted">over</span> AI Eng</th><td class="heat" style="--v:0.59">0.76</td><td class="dbar" style="--v:0.10">+9%</td><td class="tov-num">-6%</td><td class="tov-num">-6%</td></tr>
<tr><th>Software Eng <span class="tov-muted">over</span> AI Eng</th><td class="heat" style="--v:0.59">0.76</td><td class="dbar" style="--v:0.28">+27%</td><td class="tov-num">+8%</td><td class="tov-num">+23%</td></tr>
<tr><th>ML Eng <span class="tov-muted">over</span> Data Scientist</th><td class="heat" style="--v:0.57">0.74</td><td class="dbar" style="--v:0.19">+19%</td><td class="tov-num">+25%</td><td class="tov-num">+56%</td></tr>
</tbody></table></div>
<!-- /tov:fig disagree -->
<p class="tov-figcap">Each gap is the first title's median over the second's, US only. Posted base and levels.fyi base are salary only; levels.fyi TC adds equity and bonus.</p>

High overlap does not bring pay together:

- **Analytics Engineer over Data Analyst: +60% posted base, +41% levels.fyi base, +55% levels.fyi TC.** All three agree on the direction. The difference between the two profiles is the engineering layer in the signatures: dbt, data modelling and the semantic layer. Most of the profile, SQL, BI tools and stakeholder work, is shared.
- **ML Engineer over MLOps Engineer: +35% posted base, +43% levels.fyi base, +89% levels.fyi TC.** Most of the TC gap is equity. The levels.fyi MLOps cell has only 39 reports, so treat its figures as indicative.
- **ML Engineer over AI Engineer: +47% posted base, +35% levels.fyi base, +77% levels.fyi TC.** The two profiles differ in where the model comes from: ML Engineer postings ask for training and deep learning, AI Engineer postings for prompting, retrieval and LLM frameworks around a model someone else trained.
- **Data Engineer over Analytics Engineer: +23% posted base, but 5% the other way on levels.fyi base and 8% on TC.** The US Data Engineer cell has only 29 postings with pay, and the sources disagree, so this gap is not established.

Software Engineer and FDE are within 7% of each other on posted base, and on levels.fyi FDE is 9% higher on base and 10% higher on TC. FDE's posted base is 19% above AI Engineer's, its closest neighbour on skills (18% on levels.fyi base, 35% on TC). Lower in the table, Data Scientist and Data Analyst share less (0.78) but differ the most of any listed pair: 98% on posted base, 50% on levels.fyi base.

In this sample, a title that adds an engineering or modelling signature to a shared core is paid at the engineering title's level, and the gap widens once equity is counted. The data show the association, not the reason for it.

## Try it: which title fits your skills?

Pick the skills you have. For each title, the score is the share of that title's 15 most-requested skills you cover, weighted by how often postings ask for each one. The pay shown is the title's US posted base (median).

<div class="tov-picker" id="tov-picker">
  <h4>Skill picker</h4>
  <p class="tov-picker-desc">Loading skill data...</p>
</div>

<script src="/js/title-overlap.js"></script>

## Limits

- **Who is in the sample.** The job-board APIs reach employers that use Greenhouse, Lever or SmartRecruiters. Banks, telcos and most large non-tech employers use other systems that we could not reach, so the board sample leans toward tech companies. LinkedIn adds a broader mix but only for the thin cells.
- **LinkedIn.** 987 postings come from LinkedIn's public job pages. For the seven titles with at least 40 board postings, pairwise similarities from board postings alone correlate at 0.91 with the combined numbers, with the largest single shift 0.14. The other three titles (Analytics Engineer, MLOps Engineer, Business Analyst) depend on LinkedIn and could not be checked this way.
- **Canada.** 26 Canadian postings quoted exactly the same range as the same company's US posting (a US range, not a Canadian one); their pay is not used. MLOps Engineer (23 postings) and Analytics Engineer (29) in Canada are low n. Canadian posted base for AI Engineer (19 postings with pay), MLOps Engineer (8) and Analytics Engineer (18) appears only in the explorer, flagged very low n.
- **FDE.** One employer, Databricks, supplies 19 of the 193 FDE postings. levels.fyi has only 9 FDE reports for Canada, shown flagged very low n. FDE was reviewed separately on 16 postings after it became its own title; that check found the customer-facing rule was matching the words "forward deployed" in the job title itself, which we removed, and that product-sense and LLM-provider matches on FDE postings are noisy.
- **levels.fyi by level.** The per-level levels.fyi figures come from company pages of employers in the posting sample: 316 of 587 have a levels.fyi page, 145 publish a level ladder, and 112 contribute 2025-2026 submissions. Each company page lists only a subset of its submissions; in the 2025-2026 data used here, a company level has a median of 5. Mapping ladders to tiers is a judgement; an audit of 45 levels at large employers found 16 misplaced under the first mapping. The ladder rule fixed most of them, and a second audit's remaining cases (eBay, IBM, Scotiabank, Lyft, Pinterest, Stripe, RBC, Geotab) are set by hand in a documented override table, so the levels of other employers are rule-mapped and unaudited. The US Software Engineer figures barely moved through these corrections. Canadian submissions are stored by levels.fyi in USD and were converted at the page's own rate (1.41). Business Analyst cells are dominated by one employer (Amazon supplies over half of the US Junior/Mid and Senior cells, Scotiabank over half of the small Canadian Junior/Mid cell), and the explorer flags any cell where one company supplies half or more.
- **levels.fyi pages.** Software Engineer, Data Scientist, Data Analyst and Business Analyst have their own pages. The other six use a job-title page under Software Engineer: Forward Deployed Engineer, Machine Learning Engineer, AI Engineer, Machine Learning Ops Engineer, Analytics Engineer and Data Engineer.
- **Required vs preferred.** Only 31% of postings separate preferred qualifications under their own heading, so the analysis uses "required or preferred" throughout.
- **Taxonomy quality.** The final review, on 60 postings the taxonomy had never seen, found precision of 0.93 overall, above 0.85 in six of seven skill groups. The exception is LLM and GenAI at 0.78: a posting that says "you will use AI tools daily" can be counted as asking for LLM skills, so LLM shares in non-AI titles are overstated. Coverage is the weaker side: the taxonomy misses 18% of the skill phrases a human reader would list (8% if borderline phrases are excluded), mostly paraphrases of soft skills and ML lifecycle work. Read every share as a lower bound, and compare titles with each other rather than reading single numbers as exact. The final review was run before FDE became a separate title, so no FDE postings were in its sample. Collaboration appears in 72% to 89% of postings for every title, so it describes the whole field and does not separate any two titles.
- **Data source for levels.fyi figures:** Levels.fyi (https://www.levels.fyi), crowdsourced compensation data, used under its attribution requirement.
- **Pay.** Posted ranges are mostly base salary. A keyword check around each disclosed range finds the word "base" in 44% of them, total compensation or on-target earnings mentioned nearby in 17%, and neither in 39%; equity or bonus is mentioned nearby in 59%, never with an amount. levels.fyi is self-reported, skews senior and large-company, and states no time window; we label it trailing. The two are never blended.
- **A posting is a signal, not the job.** It describes what the hiring team wants to advertise. Everything here is a snapshot of 2026 postings, retrieved on 3 October 2026; the newest titles are the most likely to have moved again.
