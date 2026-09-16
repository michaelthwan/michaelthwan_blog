# Adversarial review: verbatim-contiguity check, scoring changes, pass-2 overrides

Reviewer: independent session, 2026-09-15. Nothing was edited. Every number below was
produced by re-running the scripts in this repo or by a throwaway script that re-implements
the scoring from the shipped data file; no figure is taken from the producer's report.

Commands re-run (all succeeded):

- `python scripts/merge_health_evidence.py` - 320 edges, 253 scored, 67 NULL,
  17 verification overrides applied, 0 duplicate edge ids, no integrity problems.
- `python scripts/audit_health_evidence.py` - "audited 320 edges ... no problems found",
  2 informational notes (family spans medical group).
- `python scripts/check_verbatim.py` - fast (227 of 229 abstracts cached, 2 live fetches).
  Reproduced exactly: exact 251 / partial 6 / spliced 50 / absent 10 / no_abstract 3;
  kinds spliced 54, beyond_abstract 8, unmatched 4.

---

## Verdicts

### A. `normalise()` additions are encoding fixes, not a loosening - **FAIL**

Three sub-claims. One is false as code, one is false as reasoning, one holds.

**A1. "strips thousands-separator commas" - the rule never executes.**
`scripts/check_verbatim.py:59` contains a literal backspace byte (0x08) inside the regex,
immediately before the closing paren of the lookahead, so the pattern is effectively
`(?<=[0-9]),(?=[0-9]{3}<BS>)`. Verified at the byte level: `check_verbatim.py` holds exactly
one 0x08 byte, at offset 2837, on line 59. The lookahead therefore requires three digits
followed by a backspace character, which never occurs in any abstract. Live proof through the
real module: `normalise("5,870 participants")` returns `'5 870 participants'`, not
`'5870 participants'`. The docstring on lines 56-57 describes a behaviour the code does not have.

Impact is small but non-zero: re-scoring all 66 flagged rows with a corrected comma rule
raises coverage on exactly one row (`l_arginine -> nitric_oxide_blood_flow`, 0.484 -> 0.517)
and promotes none to exact. The defect is in the claim, not mainly in the output.

**A2. The substitutions do loosen matching. Counterexample constructed and confirmed.**
`html.unescape` is one of the three named changes. It collapses `&ge;` and `&le;` to glyphs
that the later `[^a-z0-9.\-]+` strip deletes:

    normalise("P &ge; 0.05")  ->  'p 0.05'
    normalise("P &le; 0.05")  ->  'p 0.05'     MATCH

Without the unescape those two strings normalise to `p ge 0.05` and `p le 0.05` and do not
match. So the decode step specifically destroys a distinction that would otherwise have
survived, and it is the distinction between "significant" and "not significant".

**A3. The checker is entirely blind to sign, demonstrated on a live row.**
`normalise` line 54 folds every dash variant to a hyphen, and line 61 deletes any hyphen not
preceded by a digit - which is every leading minus. Taking the real
`sodium_reduction -> blood_pressure` quote and its cached abstract:

    as shipped            longest_run = 1.0   ("exact quotation")
    every minus flipped   longest_run = 1.0   ("exact quotation")

A quote that reports a 5.75 mmHg *rise* where the paper reported a 5.75 mmHg *fall* scores a
perfect 1.0 and is never flagged. The same stripping happens before `categorise()` extracts
numbers, so sign errors are invisible to both halves of the tool.

The middle-dot rule (the third substitution) is sound in the digit-flanked form it uses;
`normalise("5*10 units")` with a middle dot equals `normalise("5.10 units")`, a theoretical
conflation of a multiplication dot with a decimal point, but no realistic corpus case was found.

### B. The spliced / beyond_abstract split is sound and unconfusable - **FAIL**

Three separate routing faults, all confirmed against the shipped data.

**B1. The third category is silently folded into the harmless bucket.**
`categorise()` returns three values - `beyond_abstract`, `spliced`, `unmatched`
(`check_verbatim.py:132-134`) - but `apply_verbatim_status` (`merge_health_evidence.py:739-744`)
tests only `== "spliced"` and sends *everything else* down the `else` branch that sets
`quote_beyond_abstract`. `unmatched` means "every number in the quote is in the abstract, and
the words still do not match at all" - a paraphrase, the most suspicious state the tool can
detect. Four rows are in it and all four are badged "full text" and exempted from the -0.5:

| row | coverage |
|---|---|
| mindfulness_based_interventions -> perceived_stress | 0.275 |
| vitamin_c_supplementation -> arti_incidence | 0.091 |
| vitamin_c_supplementation -> arti_incidence | 0.222 |
| vitamin_c_supplementation -> infection_duration | 0.118 |

A row whose quote shares 9% of its words with the abstract is telling the reader the sentence
"was taken from the full paper" (the `quoteBeyond` tooltip, explorer JS line 104). The two
branches are not just confusable - they are already confused in the shipped file.

**B2. `band` is ignored, so "mostly contiguous" rows are badged as splices.**
`check_verbatim.main()` deliberately separates `partial` (>= 0.8, "mostly contiguous") from
`spliced` (>= 0.35), but `apply_verbatim_status` reads only `kind`. Six of the 32 rows carrying
`quote_spliced` have coverage >= 0.8:

omega3_supplementation/hs_crp_il6 0.833, low_gi_diet/sebum_acne 0.852,
oat_beta_glucan/ldl_cholesterol 0.804, heavy_exercise_load/arti_incidence 0.933,
exercise_dysmenorrhea/menstrual_pain 0.897, powered_toothbrushing/gingival_inflammation 0.929.

Diagnosing two of them by hand: the omega-3 row breaks on a 3-word tail out of 18; the low-GI
row breaks at word 3 because the dataset's quote writes "12 weeks" where the abstract writes
"12 wk" and drops the "(+/-SEM)". These are transcription slips, not sentences assembled out of
parts, and the badge text ("it reads as two separate sentences joined without an ellipsis")
asserts something the evidence does not support.

**B3. A quote with no numbers falls through to "spliced".**
`if qn and (qn - an)` is false when `qn` is empty, so a numberless quote is routed to
`spliced`/`unmatched` on zero numeric evidence - the exact test the docstring says separates
the two cases. Five flagged rows have no digit at all in the quote; three are shielded by an
existing `quote_elided` flag, and two are not: both `heavy_exercise_load -> arti_incidence`
rows carry `quote_spliced` (0.609 and 0.933) with nothing numeric behind the verdict.

On the specific question asked - can a splice that drops a number escape into the harmless
bucket? Dropping a number cannot, since the remaining numbers stay a subset of the abstract's.
But a *formatting variant* can: `categorise` compares exact strings, so
`categorise("effect was 0.5 units", "effect was 0.50 units and other words", 0.5)` returns
`beyond_abstract`. Any genuine splice containing one trailing-zero or sign difference is
routed to the benign badge.

### C. Overrides run before the automated verbatim check - **PASS, with a misleading comment and a live gap**

The ordering claim is factually correct. `merge()` runs `apply_verification_overrides` at
`merge_health_evidence.py:877` and `apply_verbatim_status` at `:879`. The `quote_elided` guard
works in the shipped data: `sedentary_time -> cancer_incidence_mortality` is present in
`_verbatim_status.json` with `kind: "spliced"`, carries the override-set `quote_elided: true`,
and has no `quote_spliced` on the merged row. `metformin_pcos -> menstrual_regularity` likewise
keeps only the override's flag. Both docstring claims hold.

The reasoning attached to it does not.

- The inline comment at `:872-873` reads "Overrides run last: the automated checks clear
  flags they cannot confirm". Overrides do **not** run last - `apply_verbatim_status` runs
  after them. The comment is stale and contradicts the code two lines below it.
- `apply_verbatim_status` pops `quote_spliced` and `quote_beyond_abstract` unconditionally
  at `:735-736`, *before* the `quote_elided` guard. An override that set either of those
  through its `flags` block would be erased without warning. No current override does, so
  this is latent, but the protection is incidental to one flag name rather than structural.
- A human verdict **is** currently being ignored, through a different path.
  `check_number_support` runs at `:870`, before overrides, and the `wheat_bran -> ibs_severity`
  override states the 0.61 flag is a confirmed false positive. The merged row still carries
  `unsupported_numbers: ["0.61"]`, so `unsupportedBadge` (explorer JS 530-531) still prints
  "check quote / These figures are not in the quoted sentence: 0.61" next to the reviewer's
  retraction of it. The override format has no way to clear a flag - `flags` can only assign.

### D. The two scoring changes - **PASS (both halves)**

**D1. conditional_on removal plus a uniform +0.5 on every boundary is tier-neutral. Confirmed.**

Measured on the shipped file: 253 of 253 scored rows have a truthy `conditional_on` (and so do
all 67 NULL rows, which are not scored). The old penalty was therefore a constant on every
scored row, so `score_new = score_old + 0.5` identically, and each new threshold is
`old + 0.5`; `s + 0.5 >= b + 0.5` iff `s >= b`, for every boundary including the implicit
bottom one - the old `else "E"` fired below 0.5, the new one below 1.0, and the minimum
attainable score moved from -1.5 to -1.0 in step. All arithmetic is on exact binary halves,
so no float edge exists.

Re-implemented both schemes from the merged data and diffed: **0 tier changes** across all
253 scored rows from this half of the change. The claim of tier-neutrality is true as stated.

For completeness, the other changes are not neutral, and the diff's comments do not say so:
the magnitude shrink alone moves **35** rows (e.g. `resistance_training -> lean_mass_strength`
S->A, `b_caffeine_timing -> m_sol` S->A), and adding `quote_spliced` to the quote-integrity
penalty - a third scoring change, not mentioned in the claim or in the comment block - moves
a further **18** rows (e.g. `cbt -> anxiety_symptoms` S->A, `smoking -> all_cause_mortality`
D->E). Net old-to-new: **52** rows change tier. 18 of those demotions are driven by the
`quote_spliced` flag whose routing is defective under B1/B2.

**D2. The magnitude shrink behaves and cannot leave 0..2. Confirmed.**

`trust = min(1, (peers-1)/4)`, `pts = round(1 + (raw-1)*trust, 2)` with `raw` in {0,1,2}:

| peers | trust | pts for raw 0 / 1 / 2 |
|---|---|---|
| 2 | 0.25 | 0.75 / 1.0 / 1.25 |
| 3 | 0.50 | 0.50 / 1.0 / 1.50 |
| 4 | 0.75 | 0.25 / 1.0 / 1.75 |
| 5+ | 1.00 | 0.00 / 1.0 / 2.00 |

Since `raw` is in [0,2] and `trust` in [0,1], `1+(raw-1)*trust` is in [0,2] by construction; the
observed set of values across the corpus is exactly
{0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0}. No `round(..., 2)` boundary artefact: tested
every (peers 2..11) x (raw 0/1/2) combination and `round(x, 2) == x` in all of them - all values
are exact quarters, which are exact in binary floating point. 142 rows sit exactly on a tier
threshold, and since the rounding is a no-op and the comparisons are `>=`, none of them is
resolved the wrong way. My independent re-implementation reproduces the shipped tier for all
253 rows (0 mismatches).

Minor pre-existing quirk, unchanged by this diff and not a claim under review: `rank >= 0.667`
misses a genuine two-thirds rank, since 2/3 = 0.6666... < 0.667.

### E. The five new overrides faithfully represent `_verification-abcd-pass2.md` - **PASS, with two follow-through gaps**

Read the report in full and checked each override against it. No wrong number, no wrong
direction, no claim the report did not make:

| override | report says | verdict |
|---|---|---|
| smoking_cessation/triglycerides -> tier C | defect 1 [HIGH], "likely should be Tier C (or D)" | faithful; `tier_corrected_from: "B"` set correctly |
| curcumin_plain n -> 5,870 participants | defect 2 [HIGH], abstract gives "ten studies with 5,870 participants" | faithful |
| weight_loss_fatloss n -> 33 studies | defect 4 [MEDIUM], "33 included studies", unit mislabelled | faithful |
| b_cbti n -> 462 participants | defect 5 [MEDIUM], PSQI from 5 of 31 studies, n=462 | faithful |
| tribulus_terrestris conditional_on rewrite | defect 3 [MEDIUM], 2 of 10 studies enrolled hypogonadal men, small significant rise 60-70 ng/dL | faithful, including the magnitude |

Gaps in follow-through (not misrepresentations):

- **The curcumin contradiction is only half fixed.** Report defect 2 names the `population`
  field as part of the defect. The merged row still reads "umbrella meta-analysis of 7
  meta-analyses / 3,271 participants for CRP; 6 meta-analyses / 2,972 for IL-6". The page will
  now show a corrected badge of 5,870 beside prose asserting the very numbers the override
  says appear nowhere in the paper.
- **`paper.n_value` is stale after any sample override.** `assign_sample_sizes` runs at
  `:874`, before overrides at `:877`, and the override's `sample` block supplies `n`,
  `n_kind` and `n_label` but not `n_value`, which `paper.update()` leaves untouched. Shipped
  result: `curcumin_plain` n=5870 / n_label "5,870" / **n_value 3271**; `b_cbti` n_label
  "462" / **n_value 2449**. The explorer does not currently read `n_value`, so this is a
  data-file inconsistency rather than a visible bug - but it is the uncorrected number
  sitting in the published JSON under a field named for the corrected one.
- Minor wording: the weight_loss override's note says the relabel "understates nothing",
  while the report said the badge "understates the real evidence base by orders of magnitude".
  Relabelling the unit makes it honest; it does not stop it understating. Overclaims the fix.

The report's four LOW findings (d_aspartic_acid n, dairy_intake tier, aerobic_exercise/vo2max
tier, the b_caffeine_timing "10pm" addition) were not carried into overrides. That is within
scope of the report's own severity ranking, not a defect in the five entries checked.

---

## Ranked defects

1. **[HIGH] `merge_health_evidence.py:739-744`** - `apply_verbatim_status` routes `categorise`'s
   third value, `unmatched`, into the benign `quote_beyond_abstract` branch. The four
   least-contiguous quotes in the corpus (coverage 0.091-0.275) are badged "full text" and
   exempt from the -0.5, while the badge tells the reader they came from the full paper.
2. **[HIGH] `check_verbatim.py:59`** - literal 0x08 byte inside the regex lookahead; the
   thousands-separator rule the docstring documents has never executed.
3. **[MEDIUM] `merge_health_evidence.py:739`** - `band` is discarded; six rows at >= 0.8
   contiguity are badged and penalised as splices for word-level transcription slips.
4. **[MEDIUM] `check_verbatim.py:53-61`** - sign is destroyed before comparison and before
   number extraction; a sign-flipped quote scores 1.0 (demonstrated on
   `sodium_reduction -> blood_pressure`). `html.unescape` additionally collapses the
   greater-than-or-equal and less-than-or-equal entities onto each other.
5. **[MEDIUM] `merge_health_evidence.py:870` vs `:877`** - `check_number_support` runs before
   overrides and no override can clear a flag, so `wheat_bran -> ibs_severity` still shows the
   0.61 "check quote" badge that the reviewer recorded as a false positive.
6. **[MEDIUM] `merge_health_evidence.py:874` vs `:680-683`** - `paper.n_value` is not updated
   by a sample override; the published JSON carries 3271 and 2449 under corrected badges.
7. **[MEDIUM] `_verification_overrides.json` curcumin_plain entry** - fixes the badge but
   leaves the `population` prose asserting the disproved 3,271 / 2,972 split.
8. **[LOW] `check_verbatim.py:132`** - `categorise` is silent when the quote has no numbers;
   two rows carry `quote_spliced` on zero numeric evidence.
9. **[LOW] `merge_health_evidence.py:872-873`** - the comment says "Overrides run last"; they
   do not. It contradicts the code two lines below it.
10. **[LOW] `health-evidence-explorer.js:807-815`** - the study modal has correction-notice
    blocks for `quote_note`, `quote_elided`, `coi_note`, `review_note`, `paper_notices`,
    `tier_corrected_from`, `n_corrected_from` and `unsupported_numbers`, but **none for
    `quote_spliced`**. 32 rows carry the "check quote" badge with a tooltip and then say
    nothing about it when opened.
11. **[LOW] `health-evidence-explorer.js:808, 812, 833, 850`** - these four correction notices
    are hard-coded English ("Quote provenance.", "This quote is not a full sentence.",
    "Evidence tier corrected:", "Quote does not carry every figure.") while every neighbouring
    string goes through `t()`. They will render in English in the zh-TW view.
12. **[LOW] `merge_health_evidence.py:507-510`** - adding `quote_spliced` to the
    quote-integrity penalty is a third scoring change that demotes 18 rows and is documented
    nowhere in the comment block that explains the other two.

## Single most important fix

**Route on `kind` and `band` explicitly in `apply_verbatim_status`
(`merge_health_evidence.py:739-744`).** One `else` is inverting the tool's purpose in both
directions at once: the four quotes that match their abstract least are given the innocent
"full text" badge and no penalty, and six quotes that match at 80-93% are accused of being
sentences spliced together. A quote at 9% contiguity whose every figure is in the abstract is
the single most suspicious state this checker can detect, and it is currently the one state
that produces reassuring copy.

## What I did NOT check

- The correctness of the underlying science, tier assignments, or any paper's actual content.
  I verified overrides against `_verification-abcd-pass2.md` only; I did not re-fetch a single
  abstract from PubMed to confirm the report itself is right.
- Whether `_verification-abcd-pass2.md`'s own findings are accurate - it was treated as the
  authority for claim E by construction.
- Any override sourced from `_verification-abcd.md`, `_verification-lmn.md`,
  `_verification-efgh-pass2.md` or `_verification-ijk.md` beyond the wheat_bran entry that
  surfaced while testing the flag-clearing gap.
- The explorer rendered in a browser. All JS findings are from reading
  `health-evidence-explorer.js`; no page was loaded, no DOM inspected, no screenshot taken.
  The zh-TW rendering claim (defect 11) is inferred from the absence of `t()` calls, not observed.
- `astro-blog/public/data/health-evidence.zh-TW.json`, the i18n batch files, and
  `scripts/audit_translations.py` - re-running the merge rewrote `health-evidence.json` and
  may have de-synced the zh-TW copy; I did not investigate.
- The other ~980 lines of the `merge_health_evidence.py` diff (goal ordering, behavior merging,
  group rules, family rules, figure enrichment) - outside the four artifacts named.
- Performance, and the 63 rows whose sample size is "not recorded".

---

# Re-verification (same session, after the coordinator's fixes)

Re-ran, in this order: `merge_health_evidence.py` (320 edges, 17 overrides, no integrity
problems), `audit_health_evidence.py` ("no problems found", same 2 family notes),
`check_verbatim.py` (exact 246 / near 5 / spliced 50 / unmatched 5 / no_numbers 4 /
beyond_abstract 7), then `merge_health_evidence.py` again to confirm the pipeline is a fixed
point (identical counts both runs).

## Item 1 - `normalise()` rewrite - **FAIL**

What works, verified:

- **The 0x08 byte is gone.** Byte scan of `check_verbatim.py`: zero control bytes of any kind.
  `normalise("5,870 participants")` gives `'5870 participants'`; `"1,234,567"` gives `'1234567'`;
  the `(?![0-9])` tail correctly leaves `"3, 456"` alone as two numbers.
- **Operators survive.** `"P &ge; 0.05"` gives `'p gte 0.05'`, `"P &le; 0.05"` gives
  `'p lte 0.05'`, `p>0.05` gives `'p gt 0.05'`, `p<0.05` gives `'p lt 0.05'`. My A2
  counterexample is dead.
- **Sign-flip test, re-run on `sodium_reduction -> blood_pressure`:** as shipped **1.0**;
  with every minus flipped **0.327**, `categorise` returns `unmatched`. My A3 counterexample
  is dead.

Why it still fails: **all five lost exact quotations are new false positives, not genuine
sign or operator mismatches.** Two new root causes, both created by this change.

**(a) The plus-minus mapping is one-sided (4 of 5).** It maps U+00B1 to `plusminus`, but the
dataset's `verbatim` fields spell it ASCII `+/-`. The `+` is stripped and the `-` is now
*preserved as a sign*, so `"2.8+/-0.6"` becomes `'2.8 -0.6'` while the abstract's
`"2.8&#xb1;0.6"` becomes `'2.8 plusminus 0.6'`. Before the fix both sides lost the character
and matched. Affected, with what each row now carries:

| row | old | new | outcome | penalty |
|---|---|---|---|---|
| low_gi_diet -> insulin_igf1 | 1.0 | 0.688 | spliced | yes, tier C @ 2.5 |
| weight_loss -> hba1c_fasting_glucose | 1.0 | 0.792 | spliced | yes, tier C @ 2.5 |
| aerobic_exercise -> vo2max | 1.0 | 0.667 | spliced | yes, tier B @ 3.25 |
| resistance_training -> blood_pressure | 1.0 | 0.839 | near | no (absorbed by `near`) |

Three rows are now badged "check quote" and docked 0.5 for a transcription convention.
`aerobic_exercise -> vo2max` is the row `_verification-abcd-pass2.md` section 18 confirmed
matches its abstract *exactly*.

**(b) A minus separated from its figure survives as a lone token (1 of 5).**
`omega3_supplementation -> hs_crp_il6` (COVID edge, DOI 10.1186/s12967-022-03604-3): the cached
abstract reads `(MD)&#x2009;=-&#xa0;2.53`. The `&#xa0;` normalises to a space, and the dash rule
at line 75 strips a hyphen only when it follows a letter/digit or a non-space - so a hyphen
with a space on each side is kept. Abstract gives `'md - 2.53'`, quote gives `'md -2.53'`.
1.0 to 0.465, now badged spliced. `normalise("md = - 2.53 and x")` returns
`'md - 2.53 and x'`, reproducing it in isolation.

Net: the fix traded 2 theoretical false negatives for 4 demonstrated false positives, 3 of them
scored. **This half is worse than before.**

## Item 2 - five named outcomes in `categorise()` - **PASS**

`categorise(..., 0.85)` returns `near`; a numberless quote returns `no_numbers`, checked before
the number-subset test, so B3 is fixed. All five names appear in the status file
(near 5, spliced 50, unmatched 5, beyond_abstract 7, no_numbers 4).

## Item 3 - explicit `VERBATIM_ACTION` routing - **PASS, with one latent bug**

The four rows from my defect 1 now carry the penalty and the warning badge, not the benign note:

    mindfulness_based_interventions -> perceived_stress  0.275  quote_spliced, kind=unmatched, -0.5
    vitamin_c_supplementation -> arti_incidence          0.091  quote_spliced, kind=unmatched, NULL row
    vitamin_c_supplementation -> arti_incidence          0.222  quote_spliced, kind=unmatched, -0.5
    vitamin_c_supplementation -> infection_duration      0.118  quote_spliced, kind=unmatched, -0.5

`hiit -> vo2max` (0.253, unmatched) carries no `quote_spliced` - it is skipped by the
`quote_elided` guard, and its -0.5 comes from the pre-existing ellipsis flag. Correct
behaviour, but not evidence that the new routing reached it.

**On `band`: it is still never read.** The dict keys on `kind` only. The information is
nonetheless honoured, because `categorise`'s new `near` cut is the same 0.8 - verified: zero
rows where `band == "partial"` and `kind != "near"`, or the reverse. So the outcome is right
and B2 is closed, but the fix routes around `band` rather than using it; `band` is now dead
data in the status file.

**NEW (latent):** `e[field] = entry.get("coverage")` stores a float where the old code stored
`True`. `longest_run` can legitimately return `0.0`, and `0.0` is falsy - the merge's penalty
test, the row badge and the modal all gate on truthiness, so a zero-coverage row would be
flagged in the status file and silently unflagged on the page. No row is at 0.0 today (lowest
is 0.071), so this is latent, not live.

## Item 4 - order swapped, override clears an automated flag - **PASS**

Verified in source: `apply_verbatim_status` at `:904`, `apply_verification_overrides` at `:905`;
the "Overrides run last" comment is replaced by an accurate one at `:897`.
`wheat_bran -> ibs_severity` now carries `unsupported_numbers: []`. Both JS guards
(`unsupportedBadge` line 530, and the modal block) test `.length`, so the missing-figure
warning does not render; the scorer's `e.get("unsupported_numbers")` is falsy, so no -0.5 (the
row is NULL-tiered regardless). Corpus count fell 26 to 25, consistent with exactly this one
clearing.

## Item 5 - `population` corrections and `n_value` - **PASS**

Zero rows in the whole file where `paper.n` is numeric and `paper.n_value` disagrees with it.
Both previously stale rows are in step: curcumin_plain n=5870/n_value=5870,
b_cbti n=462/n_value=462. New population strings check out against
`_verification-abcd-pass2.md`: curcumin's "ten studies and 5,870 participants across CRP, IL-6
and TNF-alpha together, and gives no per-marker split" is defect 2 verbatim; b_cbti's "31 RCTs
were pooled overall (n=2,449; 1,107 / 1,342), but the sleep-quality figure on this row rests on
5 of them, n=462" is defect 5 verbatim, and correctly does not attribute the 462 to the
abstract. Neither asserts anything the report did not.

## Item 6 - prose - **PARTIAL FAIL (new defect)**

The subtitle is corrected ("320 rows across 14 goals"), the conditional penalty is gone from
both the legend and the body text, and the thin-marker discount is described accurately.

But the same diff **adds** a contradictory sentence to the frontmatter `abstract`: "currently
holds 283 rows across 14 goals, drawn from 207 papers, including 55 results that were measured
and came back null." Measured from the shipped data file: **320 rows, 229 papers, 67 null.**
All three figures are wrong, in a line that did not exist before this fix, sitting beside a
subtitle that was corrected to 320.

## New defects introduced, ranked

1. **[HIGH] `check_verbatim.py:67-69`** - plus-minus mapped only for U+00B1, while the corpus
   writes `+/-`; combined with the new sign-preserving rule this reads `+/-0.6` as *negative*
   0.6. Four exact quotations lost, three now penalised.
2. **[MEDIUM] `check_verbatim.py:75`** - a hyphen with whitespace on both sides survives as a
   token; `&#xa0;` between a minus and its figure breaks a previously exact match.
3. **[MEDIUM] `health-evidence-explorer.md` frontmatter `abstract`** - newly added 283 rows /
   207 papers / 55 null, against an actual 320 / 229 / 67.
4. **[LOW] `merge_health_evidence.py:763`** - flag value is a coverage float; a 0.0 coverage
   would silently disable the badge and the penalty.
5. **[LOW] `_verbatim_status.json` `band`** - now written and never read by anything.

## Still unaddressed from the original report

- **Defect 10** - the study modal still has no correction notice for `quote_spliced`. The row
  badge now has three distinct tooltips (`quoteSpliced`, `quoteUnmatched`, `quoteNoNumbers`,
  both locales), but opening the study still says nothing. 38 rows.
- **Defect 11** - "Quote provenance.", "This quote is not a full sentence.", "Evidence tier
  corrected:", "Quote does not carry every figure." are still hard-coded English in the modal.
- **Defect 12** - the `quote_spliced` term in the score is still undocumented in the comment
  block; the prose's "open quote flags" covers it only generically.
- The `rank >= 0.667` two-thirds quirk (noted as pre-existing, not a claim under review).

## What I did NOT check this round

The science, any PubMed abstract (cache only, plus 2 live resolutions the script did itself),
the rendered page, the zh-TW data file, the translation audit, and the ~980 lines of
`merge_health_evidence.py` outside the named artifacts. Claim D was not re-verified beyond
confirming the tier counts moved only as the new flags predict (S 13 to 12, A 65 to 67,
B 97 to 94, C 49 to 51); the arithmetic proof from the first pass is unaffected by these
changes.
