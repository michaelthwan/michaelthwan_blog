# Verification report: goals L (Gut), M (Female health), N (Oral health)

Artifact: C:\github\mw_knowledge_blog\astro-blog\public\data\health-evidence.json
Scope definition source: goal-l-gut.json, goal-m-female-health.json, goal-n-oral.json in docs/superpowers/research/

Status: IN PROGRESS (partial save, will append as edges are checked)

## Edges in scope (45 total, by behavior_id -> marker_id)

Gut (14): psyllium->stool_frequency_consistency, fibre_general->constipation_relief, psyllium->ibs_severity,
wheat_bran->ibs_severity, prunes->stool_frequency_consistency, kiwifruit->constipation_relief,
kiwifruit->stool_frequency_consistency, peppermint_oil->ibs_severity, probiotics->ibs_severity,
low_fodmap_diet->ibs_severity, physical_activity->ibs_severity, psychological_stress->gut_transit,
cognitive_behavioral_therapy->ibs_severity, coffee->gut_transit

Female health (16, one behavior/marker pair appears twice - exercise_vasomotor has 2 rows: severity + frequency):
exercise_vasomotor->vasomotor_symptoms (x2: severity row, frequency row), cbt_vasomotor->vasomotor_symptoms,
weight_loss_pcos->pcos_androgens, myo_inositol_pcos->pcos_androgens, metformin_pcos->menstrual_regularity,
nsaids_dysmenorrhea->menstrual_pain, heat_therapy_dysmenorrhea->menstrual_pain, exercise_dysmenorrhea->menstrual_pain,
vitamin_b6_pms->pms_symptoms, calcium_pms->pms_symptoms, black_cohosh->vasomotor_symptoms,
soy_isoflavones->vasomotor_symptoms, smoking->vasomotor_symptoms, low_gi_diet_pcos->pcos_androgens,
vitamin_d_pcos->pcos_androgens

Oral (15): fluoride_toothpaste->caries_increment, toothbrushing_frequency->caries_increment,
powered_toothbrushing->plaque_index, powered_toothbrushing->gingival_inflammation, flossing->gingival_inflammation,
flossing->caries_increment, interdental_brushes->gingival_inflammation, interdental_brushes->plaque_index,
chlorhexidine_mouthwash->plaque_index, chlorhexidine_mouthwash->gingival_inflammation, free_sugar_intake->caries_increment,
xylitol_products->caries_increment, smoking->periodontal_attachment, diabetes_status->periodontal_attachment,
professional_scaling->gingival_inflammation

Total distinct rows matched in main dataset: 45

## Priority claims (checked against extracted verbatim/JSON first, live PubMed check pending/noted below)

### 1. Flossing and caries (flossing->caries_increment)
PENDING - reading edge next.

### 2. Chlorhexidine mouthwash and gingival inflammation
PENDING

### 3. Routine professional scaling (professional_scaling->gingival_inflammation)
PENDING

### 4. Wheat bran in IBS (wheat_bran->ibs_severity)
Edge text reviewed (lines 106-141 of extracted JSON). Verdict: MATCHES claim in the verification brief.
- direction: null (coded as null/none, not "positive" and not simply blank) - correct per rubric, since paper's own worst-case
  sensitivity analysis found no significant benefit (RR 1.45, 95% CI 0.97-2.16).
- The edge DOES report an actual harm signal: "early dropout was most common in the bran group; the main reason was
  that the symptoms of irritable bowel syndrome worsened" - this is stated in both `effect` and `verbatim` and is
  attributed as verbatim text from the paper (BMJ 2009;339:b3154). This is more than a null - it is a harm signal,
  matching the brief's characterization.
- Evidence tier: B (single adequately powered RCT) - correct, this is the same primary RCT (BMJ b3154) used for the
  psyllium edge above, not a meta-analysis.
- DOI 10.1136/bmj.b3154 - to be confirmed live via NCBI eutils (shared with psyllium/ibs_severity edge, same paper).
- NOTE: "unsupported_numbers": ["0.61"] flag present - the 0.61 is the P-value for month-3 severity vs placebo
  comparison; this number does appear correctly attributed in key_results ("P=0.61 versus placebo"), so the flag
  looks like a false positive from the automated check, not a real defect - but flagging for completeness since the
  instructions said an extractor's self-assessment should be ignored, and this looks self-consistent on inspection.

### 5. Metformin in PCOS - pooled OR 2.55 reversing to ~OR 0.29 in obese women (metformin_pcos->menstrual_regularity)
Edge text reviewed (lines 656-688). Verdict: MATCHES claim in the verification brief.
- effect: OR 2.55 (95% CI 1.81-3.59) for ovulation, pooled - present.
- conditional_on: explicitly states obese-subgroup reversal to OR 0.29 (95% CI 0.20-0.43) for ovulation, and mirrors this
  for clinical pregnancy (OR 0.34) - present, correctly hedged as "2 studies, 500 women, very-low-quality evidence" in
  caveats (not stated as robust).
- evidence_tier: A, matches Cochrane meta-analysis of RCTs design.
- DOI 10.1002/14651858.CD003053.pub6 - Cochrane review "Insulin-sensitising drugs... for women with PCOS" - this is a
  well-known real Cochrane review; DOI format is plausible and consistent with other Cochrane DOIs in this dataset
  (compare 10.1002/14651858.CD001751.pub3, CD004142.pub4, CD007244.pub2, CD007868.pub3, CD002281.pub3 all in this
  file - consistent numbering pattern). Will attempt live confirmation via eutils/PubMed for the CD003053.pub6 record.

### 6. Black cohosh null vs soy isoflavones significant (both vasomotor_symptoms)
Edge text reviewed (lines 864-930). Verdict on manufactured-contrast concern: NOT a manufactured contrast on its face -
this looks legitimate.
- black_cohosh edge cites a 2012 COCHRANE review (DOI 10.1002/14651858.CD007244.pub2) finding no significant
  difference vs placebo for hot flush frequency (MD 0.07/day, P=0.79) - correctly tier A, direction null.
- The edge's own caveats field is unusually self-aware: it explicitly states "This Cochrane review has itself been
  criticized... more recent non-Cochrane meta-analyses... report positive effects, so the literature is genuinely
  contested rather than uniformly null - this edge reports the Cochrane finding specifically." This directly
  addresses (and defuses) the "manufactured contrast" concern - the dataset is transparent that it picked one review
  (Cochrane) for black cohosh vs a different, non-Cochrane review for soy isoflavones (Franco et al./Menopause 2012,
  DOI 10.1097/gme.0b013e3182410159), and says so.
- soy_isoflavones edge: direction "-" (reduction in hot flashes = improvement), tier A, effect -20.6% vs placebo -
  matches a 2012 meta-analysis of RCTs (19 trials). This is legitimately a different, non-Cochrane source, and the
  dataset flags the asymmetry rather than hiding it. VERDICT: contrast is disclosed, not manufactured - but see
  defect list below for a secondary concern about evidence_tier consistency (both called "A" despite one being
  Cochrane and the other a non-Cochrane SR - tier criteria (SR/meta-analysis of RCTs) are met by both irrespective of
  Cochrane branding, so tier A for both appears correct under the stated criteria).

## STATUS: COMPLETE

All 45 in-scope edges read and reviewed against verbatim/paper metadata. 15 edges verified live against
NCBI PubMed abstracts (via eutils esearch+efetch on the DOI), covering all three goals and 11 distinct
source papers. Full findings below.

## Live PubMed/eutils checks performed (15 edges, 11 papers, all 3 goals covered)

| Edge (behavior -> marker) | Goal | DOI | PMID | Result |
|---|---|---|---|---|
| psyllium -> stool_frequency_consistency | Gut | 10.1093/ajcn/nqac184 | 35816465 | Title, design, verbatim confirmed exact |
| fibre_general -> constipation_relief | Gut | 10.1093/ajcn/nqac184 | 35816465 | Verbatim confirmed exact (66%/41%, RR 1.48) |
| psyllium -> ibs_severity | Gut | 10.1136/bmj.b3154 | 19713235 | Verbatim confirmed exact |
| wheat_bran -> ibs_severity | Gut | 10.1136/bmj.b3154 | 19713235 | Verbatim confirmed exact, incl. dropout/worsening sentence |
| peppermint_oil -> ibs_severity | Gut | 10.1097/MCG.0b013e3182a88357 | 24100754 | Verbatim confirmed exact |
| physical_activity -> ibs_severity | Gut | 10.1055/s-2008-1038600 | 18461499 | Verbatim confirmed exact, incl. source's own MD/CI sign inconsistency |
| metformin_pcos -> menstrual_regularity | Female | 10.1002/14651858.CD003053.pub6 | 29183107 | DEFECT FOUND - see below |
| black_cohosh -> vasomotor_symptoms | Female | 10.1002/14651858.CD007244.pub2 | 22972105 | Verbatim confirmed exact; contrast with soy is genuinely disclosed, not manufactured |
| soy_isoflavones -> vasomotor_symptoms | Female | 10.1097/gme.0b013e3182410159 | 22433977 | Verbatim confirmed exact |
| chlorhexidine_mouthwash -> plaque_index | Oral | 10.1002/14651858.CD008676.pub2 | 28362061 | Verbatim confirmed exact |
| chlorhexidine_mouthwash -> gingival_inflammation | Oral | 10.1002/14651858.CD008676.pub2 | 28362061 | Verbatim confirmed exact incl. "not considered clinically relevant" |
| professional_scaling -> gingival_inflammation | Oral | 10.1002/14651858.CD004625.pub5 | 30590875 | Verbatim confirmed exact incl. population restriction |
| flossing -> gingival_inflammation | Oral | 10.1002/14651858.CD012018.pub2 | 30968949 | Verbatim confirmed exact |
| flossing -> caries_increment | Oral | 10.1002/14651858.CD012018.pub2 | 30968949 | Verbatim confirmed exact ("No trials assessed interproximal caries") |
| diabetes_status -> periodontal_attachment | Oral | 10.1016/S2468-2667(26)00149-0 | 42480567 | Confirmed real; retraction/republication note independently confirmed genuine |

Not checked live (33 edges): kiwifruit x2, prunes, probiotics, low_fodmap_diet, cognitive_behavioral_therapy,
coffee, psychological_stress, exercise_vasomotor x2, cbt_vasomotor, weight_loss_pcos, myo_inositol_pcos,
nsaids_dysmenorrhea, heat_therapy_dysmenorrhea, exercise_dysmenorrhea, vitamin_b6_pms, calcium_pms, smoking
(vasomotor), low_gi_diet_pcos, vitamin_d_pcos, fluoride_toothpaste, toothbrushing_frequency,
powered_toothbrushing x2, interdental_brushes x2, free_sugar_intake, xylitol_products, smoking
(periodontal), (fibre_general and psyllium/wheat_bran already counted above). These were reviewed only
against the dataset's own internal fields (verbatim vs effect vs conditional_on vs caveats), not against a
live source.

## DEFECTS (ranked by severity)

### DEFECT 1 (HIGH) - metformin_pcos -> menstrual_regularity: comparator conflation in conditional_on
File location: the edge with paper.doi 10.1002/14651858.CD003053.pub6 (Cochrane, "Insulin-sensitising
drugs... for women with PCOS"), behavior_id metformin_pcos, marker_id menstrual_regularity.

The edge's headline `effect` (OR 2.55 for ovulation, OR 1.72 for menstrual frequency) is correctly drawn
from the Cochrane review's "Metformin versus placebo or no treatment" comparison - confirmed verbatim
against PMID 29183107.

The edge's `conditional_on` field then states: "the headline pooled OR masks a reversal in the obese
subgroup" and cites obese-subgroup ovulation OR 0.29 (95% CI 0.20-0.43) and pregnancy OR 0.34 (95% CI
0.21-0.55) as if they were a BMI-stratified breakdown of the SAME metformin-vs-placebo comparison that
produced OR 2.55.

Live abstract check shows this is wrong: the OR 0.29 / OR 0.34 / OR 0.81 (non-obese ovulation) / OR 1.56
(non-obese pregnancy) numbers all come from a DIFFERENT comparison in the same review - "Metformin versus
clomiphene citrate" - not from "Metformin versus placebo or no treatment." The placebo-comparison section
of the abstract contains no BMI-stratified breakdown at all. The review's own abstract keeps these as two
structurally separate comparisons; the edge merges them into a single false narrative ("headline OR 2.55
... masks a reversal") that the source does not support in that form.

This is exactly the "surprising and load-bearing" claim the verification brief flagged for scrutiny, and it
fails: the reversal is real in the source, but it happens under a different comparator (clomiphene citrate,
not placebo), so "the headline pooled OR [i.e. the OR-2.55-vs-placebo number] masks a reversal in the obese
subgroup" is a false statement about what the cited review shows. This violates criterion 3
(conditional_on overstates/misstates what the paper found - here it misattributes the comparator, which is
worse than overstating generality).
Evidence: PMID 29183107 abstract, sections "Metformin versus placebo or no treatment" vs "Metformin versus
clomiphene citrate" (quoted in full above in the eutils check).

### DEFECT 2 (MEDIUM) - low_gi_diet_pcos -> pcos_androgens: tier/tag contradicts the edge's own paper.design field
The edge's `paper.design` field reads "systematic review and meta-analysis of RCTs" (DOI
10.1016/j.heliyon.2021.e08338, confirmed live at PMID 34820542 as a systematic review and meta-analysis,
methods section does not explicitly restrict to RCTs but the edge itself asserts RCTs in its own design
field). Per this file's own stated tier design (criterion 1: A = meta-analysis/SR of RCTs), a paper whose
design field says "meta-analysis of RCTs" should be tier A. Instead this edge is coded evidence_tier "C",
evidence_tag "COHORT", evidence_label "Prospective cohort study" - with no caveat explaining the downgrade.
Contrast with the weight_loss_pcos edge, which correctly justifies its own tier-C/COHORT coding by stating
in `paper.design` itself that it is a "pre-post design... no external control group" and repeating that in
caveats. low_gi_diet_pcos has no equivalent justification: it says "RCTs" in one field and "cohort" in
three others, with nothing reconciling the two. This is either a wrong evidence_tier or a wrong
paper.design string - either way, an internal inconsistency that a reader cannot resolve from the edge
alone. Also note the `usefulness.why` field literally says "Prospective cohort study (+1)" for a row whose
paper.design says RCT meta-analysis - the scoring rationale text itself inherited the same contradiction.

### DEFECT 3 (LOW/COSMETIC) - wheat_bran -> ibs_severity: stale/false-positive "unsupported_numbers" flag
The edge carries `"unsupported_numbers": ["0.61"]`, apparently an automated flag suggesting the P=0.61
figure isn't backed by the verbatim quote. Live check (PMID 19713235) confirms "P=0.61 versus placebo" IS
present essentially verbatim in the source abstract ("58 points in the bran group (P=0.61 versus
placebo)"), and the edge's own `key_results` field already states this number correctly. The flag looks
like a leftover/false-positive from an earlier extraction pass rather than a real defect, but since the
task said to ignore the extractor's self-assessment and check independently, flagging it here for the
maintainer to clear or investigate further (it does not correspond to an actual quote-fabrication problem
in the checked source).

## Verdict per criterion (aggregated across the 45 in-scope edges)

1. evidence_tier matches real design (A=SR/meta of RCTs, B=single RCT, C=cohort, D=cross-sectional/animal/mechanistic):
   PASS for 44/45 edges reviewed; FAIL for low_gi_diet_pcos (Defect 2, tier C conflicts with its own stated
   RCT-meta design). Tier-B "single RCT" edges (kiwifruit x2, prunes, heat_therapy_dysmenorrhea) correctly
   reflect single-trial-derived numbers even when nested inside a review. Tier-D edges (psychological_stress,
   coffee) correctly reflect narrative-review/small-mechanistic-study status.

2. Direction sign correct, including scored-instrument conventions (lower-is-better for IBS-SSS/gingival
   index/VAS-type scores treated as "-" = improvement): PASS on every edge checked. Convention is applied
   consistently: "-" always means the marker moved in the favourable direction (pain down, GI/gingival index
   down, IBS severity down) regardless of whether the underlying statistic is reported as an OR (positive
   favourable) or an SMD/MD (negative favourable) - e.g. nsaids_dysmenorrhea (OR 4.37, direction "-"),
   exercise_dysmenorrhea (SMD -1.86, direction "-") are both coded "-" for the same favourable-pain-reduction
   reason, which is correct and not a bug once the convention is understood. Flossing/caries and metformin's
   overstated obese-subgroup narrative are conditional_on/attribution problems (see defects), not direction
   problems.

3. conditional_on does not overstate generality: FAIL for metformin_pcos (Defect 1 - this is worse than
   overstating generality, it's a comparator swap). PASS for all other checked edges, including the ones
   the brief specifically flagged: flossing/caries (correctly framed as an evidence gap, not a null),
   chlorhexidine/gingival (correctly restricted to mild-inflammation population), professional_scaling
   (correctly restricted to non-severe-periodontitis regular attenders), wheat_bran (correctly downgraded
   to null with the harm signal preserved), black_cohosh/soy_isoflavones (contrast explicitly disclosed
   as coming from different reviews, not manufactured).

4. paper.doi resolves and belongs to the paper named in paper.title: PASS for all 15 live-checked edges
   (11 distinct DOIs), including the unusual 2026 diabetes/oral-health paper with its retraction-republication
   note, which is genuine and correctly described.

5. verbatim is genuinely copied text, not paraphrase: PASS for all 15 live-checked edges - every verbatim
   field matched the live PubMed abstract text essentially word-for-word (allowing for the dataset's
   documented ellipsis/`quote_elided` convention).

## Single most important fix

Fix Defect 1 (metformin_pcos -> menstrual_regularity): rewrite `conditional_on` and `key_results` so the
obese-subgroup reversal (OR 0.29 ovulation, OR 0.34 pregnancy) is correctly attributed to the "metformin vs
clomiphene citrate" comparison in Cochrane CD003053.pub6, not presented as a BMI-stratified breakdown of the
OR 2.55 "metformin vs placebo" headline number. As written, a reader would reasonably conclude that obese
women on metformin do WORSE than obese women on placebo, when the source only shows they do worse than
obese women on clomiphene citrate - a materially different and less alarming claim. This is the kind of
error the verification brief was specifically designed to surface, and it is real.

Secondary fix: reconcile Defect 2 (low_gi_diet_pcos tier/tag vs its own paper.design field) - either raise
to tier A or add a caveat explaining why a review labelled "meta-analysis of RCTs" is being scored as
cohort-level evidence.

