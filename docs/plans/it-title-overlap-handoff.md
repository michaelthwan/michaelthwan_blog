# Handoff — IT job title overlap study

Last updated: 2026-10-04. Plan: `docs/plans/it-title-overlap-plan.md` (read it first).

## Goal

Blog post (category `business`, slug `title-overlap`, CSS prefix `tov-`) measuring, for
10 tech titles in the US and Canada using 2026 data only:

1. skill overlap between titles, from job descriptions (required vs preferred split);
2. pay by title and level, from in-posting pay disclosures, cross-checked with levels.fyi.

Titles: software_engineer, backend_engineer, data_engineer, data_scientist, ml_engineer,
ai_engineer, mlops_engineer, analytics_engineer, data_analyst, business_analyst.

## User decisions (all 2026-10-03/04)

- 10 titles including MLOps and Analytics Engineer.
- 2026 data only; recency enforced at collection.
- Conservative route first; if samples are too small, use LinkedIn or Indeed.
- Auto mode: proceed without asking; only stop for risky commands.
- Never git commit / push without explicit approval (standing rule).
- Replies in Traditional Chinese (zh-TW).

## Environment facts (measured, not assumed)

- Python urllib fails TLS (proxy cert expired); every fetch goes through curl
  (`scripts/jd/fetchlib.py`). Always open JSON with `encoding="utf-8"`.
- Reachable: boards-api.greenhouse.io, api.lever.co, api.smartrecruiters.com,
  www.linkedin.com (guest endpoints), www.levels.fyi.
- Blocked (connection 000): Workday, Ashby, Workable, Indeed, Glassdoor, Job Bank,
  Remotive, ZipRecruiter. The Muse returns 403 (needs key). api.levels.fyi is 402 (paid).
- Consequence: banks, telcos, insurers and most large non-tech employers (Workday users)
  are unreachable; the ATS sample skews to tech companies. Must be stated in the post.
- Container restarts kill background subagents; prefer inline scripts.

## Pipeline (`scripts/jd/`)

| File | Role |
|---|---|
| `fetchlib.py` | curl wrapper, `fetch` / `fetch_json` |
| `discover_boards.py`, `discover_wave2.py`, `discover_wave3.py` | probe candidate tokens against the 3 public ATS APIs, merge hits into `boards.json` |
| `boards.json` | 250 live boards with ats, group, n_jobs |
| `collect_jds.py` | fetch boards (cached in `data/jd/raw/`), country inference (location, then offices, then body signals), 2026 filter, title canonicalisation, seniority, required/preferred split, pay (Greenhouse `Pay Transparency Range` metadata first, text parse second) |
| `collect_linkedin.py` | LinkedIn guest-endpoint gap filler (see status) |

Output: `data/jd/records.json` — one record per posting with company, country, title,
seniority, posted_date, url, pay_low/high/currency/source, text_required, text_preferred.

## Sample after the conservative route (ATS only)

2,287 records from 250 boards. Wave 3 showed diminishing returns (402 probes, +51 boards,
+112 records), so more board-guessing will not fix Canada.

| title | US | CA |
|---|---|---|
| software_engineer | 1318 | 261 |
| ml_engineer | 132 | 16 |
| ai_engineer | 133 | 13 |
| backend_engineer | 104 | 19 |
| data_scientist | 98 | 21 |
| data_engineer | 50 | 9 |
| data_analyst | 35 | 6 |
| business_analyst | 23 | 0 |
| mlops_engineer | 20 | 7 |
| analytics_engineer | 20 | 2 |

574 of 2,287 (25%) carry a disclosed pay range.

## LinkedIn fallback (in progress)

- Search: `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=..&location=..&start=N`
  returns 10 cards per page with `data-entity-urn="urn:li:jobPosting:<id>"`.
- Detail: `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/<id>` returns an HTML
  fragment: title (`topcard__title`), company (`topcard__org-name-link`), location
  (`topcard__flavor--bullet`), relative posted time (`posted-time-ago__text`), description
  (`show-more-less-html__markup`). No JSON-LD. Relative dates up to ~9 months old still fall
  in 2026 (today is 2026-10-04); search also accepts `f_TPR=r7776000` (last 90 days).
- Scope: gap filling only — all 10 titles in Canada, plus US analytics_engineer,
  mlops_engineer, business_analyst, data_analyst. Records reuse the same canonicalisation
  and extraction code and carry `source: "linkedin"`.
- LinkedIn's terms do not permit automated collection; the user authorised it as the
  fallback. The methods section must name the source and its limits. Polite rate limits,
  backoff on 429/999.

## Session 2026-10-03 (resumed)

- `scripts/jd/collect_linkedin.py` written (it did not exist before). Search cards carry an
  absolute `<time datetime="YYYY-MM-DD">`, used as `posted_date` (not the relative text).
  Card title must canonicalise to the target title before the detail page is fetched.
  Cache: `data/jd/linkedin/` (search_*.html, job_*.html), resumable. Log:
  `data/jd/linkedin_run.log`. Output: `data/jd/records_linkedin.json`, deduped against
  `records.json` by normalised company + raw title + country.
- Taxonomy samples: `data/jd/taxonomy/train_sample.txt` (120 JDs, 12/title, seed
  20261003) and `holdout_sample.txt` (20 JDs, reserved for the gate). Indices in
  `sample_index.json`. Taxonomy build delegated (opus) to `scripts/skill_taxonomy.json`.
- levels.fyi coverage audit delegated (sonnet) to `data/jd/levels_audit.json` +
  `data/jd/levels_raw/`.
- levels.fyi audit DONE: all 20 cells have data (4 family pages, 6 title pages under
  Software Engineer). No per-level breakdown on free pages, so the pay ladder by level
  must come from JD pay disclosures; levels.fyi gives title-level P25/P50/P75 only, window
  "trailing/unspecified". Thin: MLOps US n=39, CA n=10; Analytics Eng CA n=13. Fetch needs a
  full Chrome UA + Accept-Language + --compressed; CA percentile blobs are USD, use the
  JSON-LD CAD values.
- `scripts/extract_skills.py` written: taxonomy regex over ATS + LinkedIn records to
  `data/jd/skill_matrix.json` (preferred list excludes skills already in required).
  `rid` is `<source>:<index>` and shifts if the records files are regenerated.

- Gate round 1 (fresh opus reviewer, `data/jd/taxonomy/gate_report.md`): BOTH FAILED.
  Coverage 27% unmapped (target < 10%); precision < 0.85 in ml_modelling 0.63, llm_genai
  0.71, product_analytics 0.59, soft_skills 0.83.
- Root causes found and fixed upstream:
  1. Greenhouse bodies are HTML-escaped; `to_text` stripped tags before unescaping, so
     2,064/2,287 records kept raw HTML and had no line breaks (req/pref split was dead
     for them). Fixed in `collect_jds.py`; records regenerated from cache (same order).
     Preferred section now found in 702 records.
  2. Pay: text parser now works on clean text, so disclosed pay rose 25% -> 67%
     (8/8 spot-checked contexts are genuine disclosures). Bare `$` takes the posting
     country's currency; a range in the other country's currency is skipped (multi-country
     postings quote the US range first). Known bias left: a US posting with several
     regional ranges gives the first one (often SF/NY, the highest).
  3. `strip_boilerplate()` in `extract_skills.py` removes intro + benefits/EEO/privacy/
     recruiting-AI tails, line-level. Median 59% of required text kept.
- Regex fixes sent back to the taxonomy author (version 2026-10-03b). Round-2 gates
  must use FRESH samples (round-1 samples informed the fixes) and a fresh reviewer.

- LinkedIn run DONE: 840 records (1,800 cards, 999 detail pages, 78 dropped as ATS dups,
  59 as LinkedIn dups). Combined 3,127 records. Cells: all 20 have n >= 20; 18 full,
  mlops CA 23 and analytics CA 29 are low_n. Pay rule for LinkedIn structured salary:
  currency must match the posting country.
- Taxonomy 2026-10-03b (166 skills) from the author's fix round.
- Gate round 2 samples (fresh, no overlap with round 1): `holdout2_sample.txt` (20),
  `precision2_sample.txt` (40, 4/title), indices in `sample_index2.json`, text shown
  after boilerplate strip. Fresh opus reviewer -> `gate2_report.md`.
- `scripts/analyse_pay.py` -> `public/data/title-comp.json`: posting midpoints by
  title x country x seniority (+ ats/linkedin split) and levels.fyi cells, never blended.
  1,904 postings with pay. Findings that shape the post:
  - Junior is essentially absent (collection excludes new grad/intern/university), so the
    level ladder is mid / senior / staff+ only; only SWE has n >= 20 at every level.
  - US posting midpoints sit well above levels.fyi median BASE (SWE 220k vs 160k).
    Candidate causes: senior/tech skew, first-listed (priciest) regional range, upper
    range edges. Must be explained, not presented as one number.

- Gate round 2 (`gate2_report.md`): precision PASS 0.943 overall (product_analytics 0.866,
  marginal); coverage FAIL 20.8% (12.6% excluding borderline phrases). Misses are mostly
  regex word-form gaps (107 pairs) not missing skills (7). Ranked fix list in the report:
  machine_learning ai/ml alt, preferred-section tails not stripped, team names as skills
  (react_frontend, testing_qa), r_lang "Terran R", dashboards_reporting ops sense, U+2011
  hyphen in 59 JDs, llm_evaluation forms. Also a title error: ats:1570 (Relativity, civil
  launch-site engineer) canonicalised as backend_engineer.
- Retry cap reached on the regex-taxonomy approach (2 rounds). USER DECISION 2026-10-03:
  one more capped fix round; if gate round 3 still fails coverage, accept and state the
  miss rate as a limitation. No round 4.
- Round-3 prep done by main session: hyphen/NBSP normalisation before matching; more
  BOILER_PARA tails (AEDT, export control, benefits, compensation fairness); ATS dedup
  (same company + title + country + identical body, -100 rows, 2,180 ATS records);
  `reconcile()` drops "Infrastructure Engineer" titles that are civil/IT/physical/site or
  have < 3 software signals. records.json ORDER CHANGED: earlier sample indices are
  stale; `taxonomy/train_urls.json` and `taxonomy/used_sample_urls.json` (229 urls from
  rounds 1-2) identify samples by URL. Round-3 samples must exclude those URLs.
- Taxonomy author working on 2026-10-03c.

- Gate round 3 (`gate3_report.md`), final, accepted per user decision: coverage strict
  18.3% (8.0% excl. borderline) FAIL; precision 0.93 overall, llm_genai 0.78 FAIL (AI-tool
  use counted as LLM skill), other six groups pass. Stated in the post's Limits.
- Post drafted: `astro-blog/src/content/posts/title-overlap.md`, title (user choice)
  "Tech Job Titles: Same Job, Different Price". Figures are generated between
  `<!-- tov:fig X -->` markers by `scripts/build_title_overlap_figures.py` (idempotent).
  Interactive `public/js/title-overlap.js`; thumbnail `public/img/title-overlap/thumbnail.svg`
  (generated from the similarity matrix). Browser-checked at 1280 and 375 px: no console
  errors, no horizontal overflow, picker presets rank sensibly.
- Pipeline order: collect_jds.py -> collect_linkedin.py -> extract_skills.py ->
  analyse_titles.py -> analyse_pay.py -> build_title_overlap_figures.py.
- Not written (plan section "industry observation" closing); user said content is fine.

## Session 2026-10-04 (user changes)

- Backend Engineer dropped (`EXCLUDED_TITLES` in collect_jds.py; still matched so its
  postings do not fall into Software Engineer). FDE (Forward Deployed Engineer) added as a
  title: rule needs "forward deployed"/FDE AND "engineer" (excludes Databricks Deployment
  Strategists, forward-deployed data scientists). LinkedIn re-run added FDE US/CA and US
  AI Engineer. levels.fyi FDE cells added to levels_audit.json (US n=155, CA n=9).
- FDE-specific review (`taxonomy/gate_fde_report.md`) found customer_facing matched the
  words "forward deployed" in the title itself; fixed in taxonomy 2026-10-03d (also POC).
- Product icons: Simple Icons 16.34.0 SVGs in `public/img/title-overlap/icons/`, rendered
  via CSS mask (theme-aware) in heatmap, signatures and skill picker; list written to
  `public/data/title-icons.json`. Brands removed from Simple Icons (AWS, Azure, Tableau,
  Power BI, Salesforce, OpenAI, dbt...) have no icon. ci_cd/observability icons moved to
  `data/jd/icons_unused/` (a single vendor logo misrepresents a generic category).
- Pay section is now an explorer (country, level, title chips) in title-overlap.js; shows
  cells from n >= 7 (user request), 7-19 "very low n" faded. analyse_pay SHOW_N = 7.
- Thumbnail generated by build_title_overlap_figures.py.
- Final state: 3,060 postings; verification round 2 (`post_verification2.md`) fixes
  applied; reproducibility PASS; `npm run build` clean; browser-checked.

## Session 2026-10-04, pay by base / TC and by level

- Every pay figure is labelled base or TC (user requirement). Explorer shows three box
  plots per title: posted base, levels.fyi base, levels.fyi TC (P10/P25/median/P75/P90,
  read from the saved title pages by `levels_distributions()` in analyse_pay.py).
  `disclosure_wording` in title-comp.json backs the "mostly base" claim (45/16/39%).
- levels.fyi per-level facts (measured): title pages have no level split; job-family pages
  accept `/levels/entry-level/` and `/levels/senior/` only; company pages
  (`/companies/<co>/salaries/<family>/locations/<country>`) have `faqLevels` (complete
  count + TC median per company level) and `averages[].samples` (a ~20-30 per level
  subset of individual submissions with base/stock/bonus/TC/focusTag/YOE). The
  `/title/<sub-title>/` path on company pages is ignored (returns family data).
- User decisions: tiers are Junior/Mid, Senior, Staff+ (junior merged into mid); per-level
  levels.fyi from company pages of the posting-sample employers, split by family (SWE,
  DS, DA, BA) plus focus tag (ML Eng, Data Eng); FDE/AI/MLOps/AE show posted base only
  when a level is selected. Collection delegated -> `scripts/jd/collect_levels_tiers.py`,
  `data/jd/levels_tiers.json`, `levels_tier_map.csv`. Not yet integrated.
- Levels.fyi attribution line added to Limits (required by its data license text).

- Integrated (2026-10-04): analyse_pay `levels_by_tier()` (offers 2025-2026, uuid-deduped,
  top_company_share), `gap_decomposition()` (title page 160k -> same-employer samples 200k
  = employer mix -> reweighted to posting tier mix 222k = level mix -> posted 220k), CA
  postings reusing the company's US range dropped (26). Explorer shows per-tier levels.fyi
  base/TC when a level is chosen; titles without data (FDE, AI, MLOps, AE) hidden.
- Audits: `tier_audit.md` found CA company-page values are USD (fixed: x locationExchangeRate,
  `fx` field) and 16/45 mis-tiered levels (fixed: anchor rule + borrow_swe);
  `pay_verification3.md` -> TIER_OVERRIDES table (8 companies, 33 entries, reasons inline).
  Process lesson recorded in ~/.claude/rules/20-judgment-rubrics.md (circular check).

## Not started
2. Commit decision with user (gitignore `data/jd/raw/`, `data/jd/linkedin/`?).
3. Analysis (prevalence, log-odds signature skills, 10x10 similarity, clustering).
4. levels.fyi coverage audit and pay cross-check.
5. Writing, visuals (`.heat`, `.dv`, `.takeaways`), interactive in `public/js/title-overlap.js`.
6. Fresh-agent verification and `npm run build`.

## Uncommitted

Everything above is uncommitted. `data/jd/raw/` and `records.json` are large; decide with
the user whether raw data is gitignored before any commit.
