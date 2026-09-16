# Health Evidence Explorer — session export, 2026-09-13 to 2026-09-14

Branch: `health-evidence-explorer` (cut from `main`, one commit `1453fc8`, work since then uncommitted)

What this is: an interactive page that ties every health claim to the biomarker it moves,
the population it was measured in, and the paper it came from. It started as an essay about
one flawed longevity guide and became a 283-row evidence graph with its own toolchain.

---

## 1. Where it lives

| Thing | Path |
|---|---|
| Article | `astro-blog/src/content/posts/health-evidence-explorer.md` |
| Explorer script | `astro-blog/public/js/health-evidence-explorer.js` (cache-busted `?v=41`) |
| Dataset | `astro-blog/public/data/health-evidence.json` |
| Chinese overlay | `astro-blog/public/data/health-evidence.zh-TW.json` |
| Figures | `astro-blog/public/img/health-evidence/` |
| Per-goal extractions | `docs/superpowers/research/goal-*.json` |
| Design spec | `docs/superpowers/specs/2026-09-13-health-evidence-explorer-design.md` |

Local: `cd astro-blog && npm run dev` then `/posts/health-evidence-explorer`.

---

## 2. Current state

```
14 goals · 60 markers · 140 behaviours · 283 rows · 207 papers
55 null results · 49 cut candidates · 44 figures over 63 rows

usefulness   S 29 · A 54 · B 81 · C 36 · D 18 · E 10 · unranked 55
valence      favourable 160 · unfavourable 58 · no good direction 10 · null 55
sample size  participants 220 · pooled-study counts 4 · not recorded 59
quality      quote flags 30 · unsupported numbers 25 · PubMed notices 25 · disputed 3 · COI 3
```

Goals, in page order: inflammation and skin, sleep quality, cardiometabolic, body
composition and strength, cognition and focus, mood and anxiety, longevity and mortality,
liver, immune function, bone and joint, gut and digestive, oral, male vitality, female
reproductive and hormonal health.

Behaviour families reaching the most goals: exercise 13, smoking 8, sleep loss 8, alcohol 8,
body fat 7, omega-3 6. No supplement family is near the top, and that contrast is the
page's central finding — it emerged from the data rather than being asserted.

---

## 3. The design decisions that matter

**A marker layer sits between behaviour and goal.** A behaviour never points at a goal
directly; it moves something measurable. This makes mechanism visible (maca moves a
questionnaire, not a hormone), makes convergence visible (two behaviours landing on one
marker do not add), and makes effect sizes comparable only within a marker, where units
match. Nothing is summed anywhere on the page.

**The sign is a verdict, not arithmetic.** Green `+` means the study found something
welcome, red `−` something unwelcome, grey `=` studied and null, purple `?` a marker with no
inherently good direction. Colouring by raw direction was tried and abandoned: aerobic
exercise lowers blood pressure, depressive symptoms and fat mass, and rendered entirely red.
Which way the number actually moved stays on the row and in the tooltip.

**Usefulness tiers S–E are a derived sort key, not a measurement.** Evidence strength plus
where the effect ranks *within its marker*, minus penalties for conditional findings, open
quote flags and author conflicts. Hovering shows the arithmetic. Both inputs stay printed so
a reader can overrule it. The page says so in Notes on method.

**Evidence of absence and absence of evidence are kept apart.** A row marked "studied, no
effect" is a finding and lives in the tree; a candidate with no usable study lives in the cut
list. Flossing and caries is the cleanest example: no trial has ever measured it.

**Three fields are never translated.** `verbatim` and `key_results` are the paper's own
words, which a reader checks against the source; `effect` is statistical notation. The
Chinese interface says so rather than leaving it looking unfinished.

**Findings from verification are applied through an audited channel.** Extraction files are
left exactly as the research agents wrote them. Corrections live in
`_verification_overrides.json` with the report they came from, and surface on the page as
badges rather than being silently patched away.

---

## 4. Toolchain

All four run from the repo root and are safe to re-run.

| Script | Does |
|---|---|
| `scripts/merge_health_evidence.py` | Merges the per-goal extractions into the dataset. Enforces referential integrity, assigns unique row ids, valence, usefulness tiers, behaviour families and groups, sample sizes; applies verification overrides and PubMed notices; holds back goals with no rows. Fails loudly rather than shipping a broken graph. |
| `scripts/audit_health_evidence.py` | Twelve checks the merge does not do: duplicate nodes, orphans, indistinguishable rows, family/group mismatches, DOI-title conflicts, missing figures. Exits non-zero. |
| `scripts/check_retractions.py` | Queries PubMed for every cited paper's correction record. Currently 205 of 207 resolve; 15 carry an erratum, 1 an Expression of Concern, none retracted. |
| `scripts/audit_translations.py` | Checks the Chinese overlay against the English for dropped numbers, simplified characters and coverage. |

`scripts/_fill_zh_remaining.py` was a one-off and should be deleted; it is not part of the
pipeline.

---

## 5. Defects found and fixed, worth not re-introducing

- **Row ids were not unique.** Behaviour + marker + DOI collided on eight pairs where one
  paper reported opposing findings, so clicking either row opened the other one's study —
  precisely where the distinction mattered most (vitamin D daily vs bolus, vitamin C general
  vs athletes, saffron self-rated vs clinician-rated). Rows now carry a hashed `edge_id`.
- **A metformin row misattributed its comparator.** The obese-subgroup reversal quoted
  against the headline OR came from the metformin-versus-clomiphene comparison, not
  metformin-versus-placebo. Flagged on the row, not deleted.
- **Family rules leaked.** A bare `"training"` rule put cognitive brain-training in the
  exercise family and gave it exercise's cross-goal badge; a `"sleep"` rule put creatine
  under Sleep. Supplement category now wins over name matching, with only drug and therapy
  rules overriding it.
- **Blank lines inside inline SVG truncate it.** Markdown ends a raw HTML block at the first
  blank line, which silently deleted two thirds of the diagram.
- **`node --check` passes on runtime ReferenceErrors.** Two whole-explorer outages came from
  functions deleted by a block replacement. Always load the page after editing the script.
- **A partially-applied patch is worse than none.** A script that asserts then writes at the
  end wrote nothing when a later assertion failed, leaving earlier edits unsaved and the
  file inconsistent with what the log claimed.

---

## 6. Not finished

| Item | State |
|---|---|
| Figures for goals I–N | ~79 papers never processed; two agent runs were killed by rate limits |
| Live abstract verification | roughly 85 of 283 rows checked against the source |
| Figure captions, `paper.design` | English only |
| `effect` short strings | English by design; translate only if asked |
| Commit | Everything since `1453fc8` is uncommitted |

Unrelated files in the working tree that are **not** part of this work and should not be
committed with it: `astro-blog/src/components/PostPreview.astro`, and the
`frontier-models-july-2026` post, image folder and script.

---

## 7. How to resume

1. `python scripts/merge_health_evidence.py && python scripts/audit_health_evidence.py && python scripts/audit_translations.py`
2. `cd astro-blog && npm run build`
3. Load the page and click a row — the script has twice been broken in ways only the browser
   catches.

For new goals: write a `goal-<letter>-<topic>.json` in `docs/superpowers/research/` matching
an existing one, keep marker ids stable (the merge script maps each to a desirable
direction by id), then re-run the pipeline. The merge will tell you if a new marker has no
direction assigned.

---

## 8. Things the data turned up that are worth reading

- Resistance training has a negligible effect on **resting** testosterone (SMD 0.00 across
  11 RCTs). The popular claim survives only as an acute post-workout spike.
- Vitamin D prevents respiratory infection on daily or weekly dosing (OR 0.81) and does
  nothing as a bolus (OR 0.97) — same trial pool, opposite verdicts, purely scheduling.
- Vitamin C is null for colds in the general population and roughly halves incidence under
  heavy exertion, from the same Cochrane review.
- Vitamin D **alone** did nothing for fractures in 25,871 people; with calcium it cuts risk
  15–30%.
- Glucosamine and chondroitin each help pain slightly; the combination people actually buy
  does not, and none improved the WOMAC index.
- Metformin's ovulation benefit in PCOS reverses in obese women.
- Alcohol before bed shortens sleep onset only at about five drinks while suppressing REM
  from about two.
- No randomised trial has ever measured flossing against caries.
- Chlorhexidine's gingivitis effect is high-certainty, statistically significant, and called
  not clinically relevant by the review authors themselves.
