# Plan — IT job title overlap: skills and pay (US / Canada)

Status: draft plan, not started. Written 2026-10-03.
Target post slug: `title-overlap` (category: `business`, class prefix `tov-`, JS `public/js/title-overlap.js`).

## 0. Thesis

Job titles in tech are a weak function of the work. If two titles share most of their
required-skill vector but differ materially in pay, the title is a pricing label, not a
job description. The post measures both sides of that sentence:

- skill overlap, from job descriptions;
- pay separation, from levels.fyi per-title / per-level data;

and reports where the two disagree.

## 1. Scope

Ten titles (confirmed by user 2026-10-03):

1. Software Engineer (generalist)
2. Backend / Platform Engineer
3. Data Engineer
4. Data Scientist
5. Machine Learning Engineer
6. AI / LLM Engineer
7. MLOps Engineer
8. Analytics Engineer
9. Data Analyst
10. Business Analyst

Geography: United States and Canada only. Seniority normalised to Junior / Mid / Senior / Staff+.
Audience framing: job-seeker-first ("I have these skills, which title pays me best"),
with the industry-observation angle as the closing section.

Titles 7 and 8 are the two most interesting cells and the two thinnest. MLOps sits
between Backend and MLE; Analytics Engineer sits between Data Engineer and Data
Analyst. Both are recent titles, so they test the thesis directly: if a new title
appears with no distinct skill signature but its own pay band, that is the clearest
evidence that titles price work rather than describe it. Both also carry collection
risk (see Phase 2) and pay-source risk (see Phase 5).

### Recency rule (user requirement 2026-10-03)

Everything in this post is 2026 data, and the rule is enforced at collection, not
asserted afterwards:

- JD records are only kept if the posting was published in 2026 (or, where no date is
  shown, the posting is live at collection time and the page carries a 2026 copyright
  or requisition year). `posted_date` is a required field; a record without one is
  dropped, not guessed.
- Pay cells record the exact levels.fyi filter window used, per cell. Where levels.fyi
  does not expose a date filter for a view, the cell is tagged `window: trailing`
  rather than being claimed as 2026.
- Canada Job Bank and DOL LCA backfills use their 2026 release; if only 2025 is
  published for a given series, that series is labelled 2025 in the figure itself,
  never silently blended into a "2026" chart.
- The post states its data cut-off date in the byline area and in the methods section.

## 2. Phases

### Phase 1 — Skill taxonomy (gate before any bulk collection)

- Read ~120 JDs spread across the 10 titles, propose a candidate skill list.
- Collapse to 130-160 canonical skills in 7 groups: languages, data engineering,
  ML / modelling, LLM / GenAI, cloud & infra, product / analytics, soft skills.
- The taxonomy must resolve the skills the two new titles hinge on, or they will
  collapse into their neighbours for lack of vocabulary rather than for real overlap:
  dbt, semantic / metrics layer, data modelling (star schema), data contracts and
  testing (Great Expectations, dbt tests), orchestration (Airflow, Dagster, Prefect),
  model serving (KServe, BentoML, Triton), experiment tracking and registry (MLflow,
  W&B), feature stores, Kubernetes, CI/CD for models, drift and model monitoring,
  GPU scheduling, inference cost optimisation.
- Each canonical skill gets an alias regex (`PyTorch|torch|pytorch`), stored in
  `scripts/skill_taxonomy.json`.
- Gate: taxonomy reviewed by a fresh agent against 20 held-out JDs — every skill
  phrase in those 20 must map to a canonical skill or be deliberately listed as
  out-of-taxonomy. Unmapped rate must be under 10%.

Deliverable: `scripts/skill_taxonomy.json`.

### Phase 2 — JD collection

- Source: company career pages directly (no LinkedIn/Indeed scraping — ToS), plus
  one public posting dataset as a cross-check on representativeness.
- Target: 10 titles x 50 JDs x 2 countries = 1,000 JDs, all 2026 postings. Hard floor
  40 per cell; any cell below 40 is reported as a gap, not padded.
- Thin-cell risk, known in advance: MLOps Engineer and Analytics Engineer in Canada are
  the two cells most likely to miss the floor, because posting volume is lower and
  Canadian employers more often fold both into "Data Engineer". If a cell lands between
  20 and 39, it is shown with a visible low-n marker and excluded from the similarity
  matrix; below 20 it is dropped from the quantitative figures and discussed in prose
  only. Deciding this before seeing the data is the point.
- Title canonicalisation needs an explicit rule sheet, written before collection:
  "Analytics Engineer (dbt)" maps to Analytics Engineer; "Data Engineer - Analytics"
  maps by JD content, not by title string; "Machine Learning Operations Engineer" and
  "ML Platform Engineer" map to MLOps only when the JD's primary duty is running
  models in production rather than building them. Ambiguous cases are logged with the
  rule applied, so the mapping is auditable.
- Company mix fixed in advance so the sample is not all big tech: ~40% large tech,
  ~30% mid-size product companies, ~30% non-tech employers hiring tech (banks,
  retail, healthcare, telco). Canada needs its own list (Shopify, RBC, TD, Telus,
  Wealthsimple, Loblaw Digital, CGI, government).
- Each JD stored as one JSON record: title_raw, title_canonical, seniority, company,
  company_class, country, city, url, posted_date, retrieved_date, text_required,
  text_preferred.
- `required` vs `preferred / nice-to-have` sections are split at collection time.
  This split is load-bearing for the whole analysis.

Deliverable: `data/jd/*.json` (gitignored raw text if licensing is unclear; the
derived matrix is what ships).

### Phase 3 — Extraction and matrix

- `scripts/extract_skills.py`: deterministic regex matching of the taxonomy over each
  JD, producing a `jd x skill` 0/1 matrix, separately for required and preferred.
- No LLM in this step. Reproducibility matters more than recall here.
- Gate: hand-label 30 random JDs, compare against the script. Precision and recall
  per skill group reported; anything under 0.85 precision gets its regex fixed.

Deliverable: `astro-blog/public/data/title-skills.json` (aggregates only).

### Phase 4 — Analysis

Metrics, all computed in `scripts/analyse_titles.py`:

- `p(skill | title)` for required and for required-or-preferred.
- Signature skills: log-odds ratio of each skill in a title vs the pooled base rate,
  with a small-count prior. This is what separates titles; raw prevalence does not.
- Common core: skills above 60% prevalence in every title.
- Title similarity: cosine and Jaccard on prevalence vectors, 10x10 matrix, plus
  hierarchical clustering to show which titles are empirically the same job. Cells
  failing the low-n rule in Phase 2 are blanked, not estimated.
- Seniority drift: does the skill vector of "Senior Data Scientist" look more like
  "MLE" than the junior version does?

Deliverable: `astro-blog/public/data/title-analysis.json`.

### Phase 5 — Pay

**Gate first: levels.fyi coverage audit.** Before copying any number, check what
levels.fyi actually publishes in 2026 for each of the 10 titles: a dedicated title
page, a focus / specialisation filter under a broader title, or nothing. MLOps
Engineer and Analytics Engineer are the likely gaps. The fallback chain is fixed now,
before the data can tempt us:

1. Dedicated levels.fyi title page with usable n.
2. A focus / specialisation filter under a parent title, reported as such in the
   figure label, never relabelled as a standalone title.
3. No usable levels.fyi cell: the title appears in the skill half of the post and is
   shown as absent in the pay half, with Job Bank (CA) or LCA (US) as a clearly
   separate, differently-styled series.

Option 3 is an acceptable outcome. Inventing a pay band for a title levels.fyi does
not track would quietly break the post's central comparison.

- Primary: levels.fyi per-title pages, per-level medians and P25/P75, US and Canada
  filters, retrieved by hand into `scripts/title_comp.json`, with per-cell `n`,
  retrieval date and filter window. Same discipline as `generate_comp_data.py` already
  uses. Any cell with n below the threshold levels.fyi itself considers displayable is
  carried with its n shown.
- No synthetic record generation this time. Only real aggregates ship, so every number
  on the page traces to one levels.fyi cell.
- Canada coverage on levels.fyi is thin for several titles. Backfill with Canada Job
  Bank wage data (official, by NOC and province) and label it as a different source
  with a different methodology — never averaged together with levels.fyi.
- Optional US cross-check: DOL H-1B LCA disclosure CSVs (real base salaries, real
  titles). Base-only and sponsor-only, so it is a sanity check on base pay, not a
  headline source.
- Level to years-of-experience mapping uses levels.fyi's own median YOE per level, and
  is labelled as approximate everywhere it appears. The post must state once, plainly,
  that levels.fyi levels are company ladders, not years.

Deliverable: `astro-blog/public/data/title-comp.json`.

### Phase 6 — Writing and visuals

Structure:

1. Executive summary + 4 numbered takeaways (`.takeaways`).
2. How the data was built (short, honest, up front — it is the credibility of the post).
3. The common core: what every one of these jobs actually requires.
4. The skill x title heatmap — the cover figure.
5. Signature skills per title (`.dv` bars, log-odds).
6. Which titles are the same job (similarity matrix + dendrogram).
7. Pay: title x level ladder, US vs Canada, P25-P75 ranges.
8. Where skills and pay disagree — the payoff section.
9. Interactive: pick your skills, see title match scores and the pay band for each.
10. Limits.

Visual conventions already in the repo: `.heat` cells (`--v`, `hot` at >= 0.6),
`.dbar`, `.dv-row` / `.dv-fill`, `.takeaways`, `<strong class="hi">` for at most six
headline numbers. Categorical colours in fixed order (blue, orange, aqua, yellow,
magenta, green, violet, red). Reference implementation: `frontier-frugality.md`.

Interactive lives in `public/js/title-overlap.js`, loaded by a script tag in the
markdown, reading `public/data/title-skills.json` and `title-comp.json`. No new
global state in `public/script.js`.

### Phase 7 — Verification

- Fresh agent re-runs every script from the raw inputs and diffs the shipped JSONs.
- Every number appearing in prose is checked against the JSON it claims to come from.
- `npm run build` clean; interactive exercised in a browser, not just read.
- Adversarial review pass on the claims: is any causal language used where the data is
  only correlational?

## 3. Honest limits (must appear in the post)

- Career-page sampling over-represents employers with mature hiring pages.
- levels.fyi is self-reported, skews senior, large-company and US.
- Canada samples are thinner than US samples in every title.
- A JD describes what hiring wants to signal, not what the job does day to day.
- Everything is a snapshot at one retrieval date in 2026; the two newest titles are
  the ones most likely to have moved again by the time you read it.
- MLOps Engineer and Analytics Engineer have thinner samples than the other eight on
  both the JD side and the pay side; every figure says so where it applies.

## 4. Decisions

Settled 2026-10-03: 10 titles including MLOps Engineer and Analytics Engineer;
2026-only data with the recency rule in section 1.

Still open, proceeding on the assumption unless told otherwise:

1. Data route: career-page sampling + one public dataset + hand-copied levels.fyi.
   Assumed yes. No LinkedIn / Indeed scraping.
2. Framing weight: job-seeker-first, industry observation as the closing section.
   Assumed yes.

## 5. Effort shape

Phases 1-3 are roughly 70% of the work and are delegated to subagents in batches.
Main context keeps: taxonomy sign-off, analysis definitions, pay-source judgement,
writing, and the interactive design.
