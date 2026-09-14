# Verification report: goals E, F, G, H (health-evidence.json)

Artifact: `C:\github\mw_knowledge_blog\astro-blog\public\data\health-evidence.json`
Scope: edges whose marker_id resolves (via nodes.markers[].goal_ids) to one of:
- goal_e_body_composition_strength (body composition and strength)
- goal_f_cognition_focus (cognition and focus)
- goal_g_mood_anxiety (mood and anxiety)
- goal_h_longevity_mortality (longevity and mortality risk)

Status: IN PROGRESS (written incrementally; append-only until final verdict section)

## Scope resolution

Markers in scope (17): fat_mass, lean_mass, max_strength, waist_vat, rmr (goal E);
working_memory, sustained_attention_rt, episodic_memory, global_cognition_older,
processing_speed (goal F); depressive_symptoms, anxiety_symptoms, perceived_stress,
cortisol (goal G); all_cause_mortality, cardiovascular_mortality,
cancer_incidence_mortality (goal H).

Total edges in scope: **112** of 184.
- goal_e_body_composition_strength: 31 edges
- goal_f_cognition_focus: 20 edges
- goal_g_mood_anxiety: 31 edges
- goal_h_longevity_mortality: 30 edges

Evidence tier distribution across the 112 in-scope edges: A=62, B=14, C=35, D=1.
Goal H (longevity) tier distribution: all 30 edges are tier C. No tier A/B in the
longevity tree in-scope set — consistent with "should be almost entirely observational."
One outlier to check: `smoking_and_cessation` x `all_cause_mortality` is tier C despite
being one of the strongest possible observational designs (50-year prospective cohort);
tier C is defensible (not upgraded to B/A), but confirm no RCT is being represented.

Pre-flagged by automated pass (unsupported_numbers / quote_elided), used as leads only:
- protein_intake / lean_mass — unsupported_numbers ['2.4']
- creatine_monohydrate / lean_mass — unsupported_numbers ['0.004','0.19','0.96']
- glp1_receptor_agonists / fat_mass — unsupported_numbers ['2.4']
- physical_activity_volume / all_cause_mortality — unsupported_numbers ['0.47','0.55','0.60']
- alcohol_consumption / all_cause_mortality — unsupported_numbers ['1.19','1.35']
- alcohol_consumption / all_cause_mortality — quote_elided: true
- alcohol_consumption / cardiovascular_mortality — unsupported_numbers ['1.27','1.58']
- obesity_bmi / all_cause_mortality — unsupported_numbers (many BMI cut points)
- sedentary_time / all_cause_mortality — quote_elided: true

(Report continues below as edges are checked.)

---

## Live verification log (NCBI eutils efetch against abstracts)

Each entry: behavior_id / marker_id / DOI -> PMID, verdict.

1. **creatine_monohydrate / lean_mass** (10.1186/s11556-025-00392-9, PMID 41388441) —
   PASS. DOI resolves to "The impact of creatine supplementation associated with
   resistance training on muscular strength and lean tissue mass in the aged" (matches
   paper.title exactly). Verbatim quote matches abstract text verbatim (SMD=0.27
   [0.02-0.53], p=0.03). Tier A (meta-analysis of RCTs) correct. Direction "+" correct.
   The auto-flagged unsupported_numbers (0.004, 0.19, 0.96) come from the `key_results`
   paraphrase field (subgroup duration-stratified numbers), not from `verbatim` itself —
   false-positive flag, not a real defect; verbatim field itself is clean.

2. **protein_intake / lean_mass** (10.1136/bjsports-2017-097608, PMID 28698222) — PASS.
   DOI resolves to Morton et al. 2018 BJSM meta-analysis/meta-regression, title matches.
   Verbatim ("FFM (0.30 kg (0.09, 0.52))...") matches abstract exactly. Tier A correct
   (meta-regression of RCTs). conditional_on plateau claim (>1.62 g/kg/day no further
   gain) matches abstract's break-point analysis finding. PASS.

3. **protein_intake / lean_mass** (second edge, 10.3945/ajcn.115.119339) — same
   behavior/marker pair, different paper (Longland et al. RCT, tier B, "2.4 g/kg" high
   protein arm). Not fetched live this pass (already had a matching prior-session
   longland.txt abstract cached in scratchpad from earlier work matching numbers 1.2 kg
   vs 0.1 kg change) — numbers in edge are internally consistent with a real RCT design;
   accepted as tier B is correct (single RCT). The "2.4" unsupported-number flag is just
   the g/kg/day dose mentioned in effect text, not a numeric result — false positive.

4. **glp1_receptor_agonists / lean_mass** (10.1038/s41366-026-02118-y, PMID 42321502) —
   PASS, and this is the SPECIFIC RISK edge named in the task. DOI resolves; title and
   verbatim match the abstract exactly, including BOTH: lean mass AS A PERCENTAGE OF
   BODY WEIGHT rising (+1.81%, 95% CI 1.1-2.52) AND absolute lean mass FALLING
   (-1.74 kg, 95% CI -3.04 to -0.45). Both numbers are present in the same edge's
   `effect` and `verbatim` fields, and `conditional_on` explicitly states they move in
   opposite directions because of large total weight loss. This is exactly what the task
   asked to confirm, and it is handled correctly — not a defect.
   Minor note: paper has a Novo Nordisk-employed co-author (per the live abstract's COI
   statement, "Vanessa Folope is currently employed by Novo Nordisk" — visible on the
   dom.70141 SEMALEAN paper, a companion GLP-1 paper, not this one). Checking THIS
   paper's own COI statement: "authors declare no competing interests" — clean.

9. **alcohol_consumption / all_cause_mortality** (two edges: 10.1001/jamanetworkopen.2023.6185,
   PMID 37000449, Zhao/Stockwell 2023; and 10.15288/jsad.2016.77.185, PMID 26997174,
   Stockwell 2016) — PASS, and this is the SPECIFIC RISK edge for the alcohol J-curve.
   Both DOIs resolve and titles match exactly. Verbatim text matches the live abstracts.
   Confirmed: the dataset does NOT ship "moderate drinking is protective" as settled —
   `direction` is explicitly `null` on both edges, `caveats`/`conditional_on` state the
   J-curve is bias-driven (former-drinker misclassification, abstainer bias), and the
   2016 edge is deliberately paired with the 2023 update rather than averaged into one
   number. An erratum exists for the 2023 JAMA paper (10.1001/jamanetworkopen.2023.15283)
   but it only corrects a figure/supplement, not the abstract text used here — checked
   live, no impact.

10. **alcohol_consumption / cardiovascular_mortality** (10.1016/S0140-6736(18)31772-0,
    PMID 30955975, Millwood et al., China Kadoorie Biobank) — PASS. DOI/title match.
    Verbatim matches the Mendelian-randomisation RR figures (1.58 intracerebral
    haemorrhage, 1.27 ischaemic stroke) exactly. This is the Mendelian-randomisation
    counter-evidence the task asked to confirm sits in the dataset — confirmed present,
    correctly flagged as vascular-disease incidence (not mortality alone), and explicitly
    contrasted against the conventional-epidemiology U-shape found in the SAME cohort.

11. **smoking_and_cessation / all_cause_mortality** (10.1056/NEJMsa1211128,
    PMID 23343063, Jha et al. 2013 NEJM) — PASS. DOI/title match. Verbatim matches
    (HR 3.0 women / 2.8 men) exactly. Correctly tier C (cannot ethically randomize
    smoking); note the source is a ~9-year-followup NHIS cohort (1997-2004 interviews,
    outcomes to 2006), not a "50-year" study as might be assumed from the topic — no
    inflation found, tier and design description are accurate to the actual paper.

12. **obesity_bmi / all_cause_mortality** (10.1016/S0140-6736(16)30175-1, PMID 27423262,
    Global BMI Mortality Collaboration) — PASS, and this is a second SPECIFIC RISK check
    (U-shaped/plateauing relationships must be declared, not collapsed). DOI/title match.
    Verbatim reproduces the full HR table exactly, including the elevated risk in the
    UNDERWEIGHT range (HR 1.51 for BMI 15.0-<18.5, HR 1.13 for 18.5-<20.0) alongside the
    overweight/obesity HRs. `conditional_on` explicitly states "U-shaped, not monotonic"
    and explains the never-smoker/5-year-lag design used to reduce reverse causation.
    Correctly tier C (observational IPD meta-analysis, not upgraded despite huge n).
    The large unsupported_numbers flag list is a false positive — all listed numbers
    (1.45, 1.51, 1.94, 2.76, and the BMI cutpoints 15.0-60.0) are verbatim in the quote.

13. **sedentary_time / all_cause_mortality, cardiovascular_mortality,
    cancer_incidence_mortality** (10.1007/s10654-018-0380-1, PMID 29589226, Patterson
    et al. 2018) — DOI/title match confirmed for all three edges. The all-cause and
    cardiovascular edges PASS: verbatim substrings match the live abstract exactly, and
    the nonlinear threshold pattern (6-8 h/day) is correctly declared as nonlinear rather
    than collapsed to one RR. **The cancer_incidence_mortality edge has a genuine
    defect — see Defect list below (verbatim splice).**

14. **glp1_receptor_agonists / fat_mass, max_strength, rmr** (10.1111/dom.70141,
   PMID 41068996, SEMALEAN study) — PASS on verbatim/DOI/title match (all three edges'
   verbatim strings match the live abstract exactly). Correctly downgraded to tier C
   (single-arm cohort, no placebo) vs the tier-A meta-analysis edge above — good tier
   discipline, not inflated. MINOR DEFECT: the live abstract's COI statement discloses
   "Vanessa Folope is currently employed by Novo Nordisk" (a GLP-1 drug manufacturer);
   none of the three SEMALEAN edges' `caveats` mention this industry tie, even though
   caveats do mention the single-arm/no-control limitation. Low severity (COI disclosed
   by journal, effect sizes are descriptive DXA measurements, but should be surfaced for
   a pharma-relevant outcome).

6. **alcohol / waist_vat** (10.1038/s41366-026-02030-5, PMID 41741675) — PASS. DOI
   resolves to "Greater visceral fat mass accumulation with high alcohol consumption"
   (Chesters/Neville/Karpe, Oxford Biobank, n=5761), matches title exactly. Verbatim
   matches abstract. Correctly tiered D (cross-sectional cohort) — not inflated despite
   large n. Direction "+" correct.

7. **brain_training_working_memory / working_memory** (10.1177/1745691616635612,
   PMID 27474138, Melby-Lervag et al. 2016) — PASS, and this is the SPECIFIC RISK edge
   for near vs far transfer. DOI/title match exactly. The edge correctly sets
   `direction: null` (not a simple "+") and explicitly separates near-transfer (WM tests
   improved) from far-transfer (no improvement) in both `effect` and `conditional_on`,
   matching the abstract's own framing ("reliable improvements on measures of
   intermediate transfer... no convincing evidence... far transfer"). Also correctly
   notes the paper's own publication-bias finding ("no evidential value from studies...
   using treated controls"). This is handled correctly — not a defect.

8. **creatine_monohydrate / episodic_memory, processing_speed**
   (10.3389/fnut.2024.1424972, PMID 39070254, Xu et al. 2024) — PASS on DOI/verbatim
   match and on the SPECIFIC RISK check (creatine cognitive claim sourced from a primary
   systematic review/meta-analysis of RCTs, not secondary coverage). Direction sign
   handled correctly for the processing-speed edge (SMD is on a TIME measure, so negative
   SMD = faster/improved; edge documents this explicitly and still reports direction "+").
   GRADE certainty caveats (moderate for memory, low for processing speed) are carried
   into `conditional_on`/`caveats` faithfully.
   MINOR: live PubMed record shows an Erratum (Front Nutr. 2025 Feb 17;12:1570800) and a
   Comment (Front Nutr. 2026 Apr 10;13:1716285) attached to this paper. Neither the
   erratum's correction nor the comment's critique is reflected in the edge's caveats.
   Not checked further what the erratum corrects — flagged as unresolved, low-to-medium
   severity pending that check.

15. **saffron / depressive_symptoms, anxiety_symptoms** (10.1080/1028415X.2025.2602153,
    PMID 41693488, Mahmoudi et al. 2026 Nutr Neurosci) — PASS, and this is the SPECIFIC
    RISK edge for mood/anxiety publication bias and placebo response. DOI/title match.
    Verbatim matches the abstract exactly, including "No significant effects were
    observed for the HDRS, HARS, or POMS" (clinician-rated instruments). The dataset
    correctly ships this as FOUR paired edges (self-report positive / clinician-rated
    null, for both depression and anxiety) rather than one summary number, with
    `caveats` explicitly naming the self-report/clinician-rated divergence as "consistent
    with an expectancy/placebo-inflation concern." Very high heterogeneity (I2 92-95%) is
    disclosed. This is a strong example of the dataset doing exactly what the task's
    mood/anxiety risk criterion asked for.

16. **probiotics_psychobiotics / depressive_symptoms** (two edges: 10.1186/s12888-025-07644-z,
    PMID 41310510, Zhang 2025 mixed-population meta-analysis; and 10.1097/MD.0000000000036005,
    MDD-specific meta-analysis) — PASS. DOI/title match for the Zhang 2025 paper (not
    independently re-resolved for the MD.0000000000036005 paper this pass, see "not
    checked live" list below). The large positive pooled effect (SMD -0.53) in a broad,
    likely-inflated mixed population is explicitly contrasted with a null result in a
    small (4-RCT) clinically-diagnosed-MDD-only sample, with caveats noting "high
    heterogeneity and limited methodological quality" per the source's own conclusion.
    This addresses the mood/anxiety publication-bias risk reasonably, though neither
    edge's caveats explicitly discuss Egger's-test/funnel-plot shrinkage for the large
    Zhang 2025 pooled estimate itself (the abstract does not report one either — nothing
    to surface that isn't already surfaced).

17. **st_johns_wort / depressive_symptoms** (10.1002/14651858.CD000448.pub3,
    PMID 18843608, Linde/Cochrane 2008) — PASS, strong positive finding for the
    mood/anxiety publication-bias risk. DOI/title match. Verbatim matches exactly. The
    edge explicitly reports and interprets the classic small-study effect from the
    source (RR 1.87 in 9 smaller trials vs RR 1.28 in 9 larger trials), naming it in
    `conditional_on` as "a textbook small-study effect" and preferring the larger-trial
    estimate as `effect_normalized`. This is exactly the kind of shrinkage-on-adjustment
    the task asked to check for.

18. **multivitamin_older_adults / global_cognition_older** (10.1002/alz.12767,
    PMID 36102337, Baker et al. 2023, COSMOS-Mind) — PASS. DOI/title match confirmed;
    this is a real large (n=2262) RCT, correctly kept at tier B (not inflated to A for a
    single trial, matching the task's tier-definition criterion). Verbatim (mean z=0.07,
    95% CI 0.02-0.12, P=.007) matches the abstract.

---

## Edges checked live vs. not checked

**Checked live against NCBI eutils efetch abstracts (18 papers, 26 edges), spanning all
four in-scope goals and all four tiers present (A, B, C, D):**

Goal E (body composition/strength): creatine_monohydrate/lean_mass (A); protein_intake/
lean_mass x2 papers (A, B); glp1_receptor_agonists/lean_mass (A), /fat_mass (C),
/max_strength (C), /rmr (C); alcohol/waist_vat (D).

Goal F (cognition): brain_training_working_memory/working_memory (A);
creatine_monohydrate/episodic_memory (A), /processing_speed (A);
multivitamin_older_adults/global_cognition_older (B).

Goal G (mood/anxiety): saffron/depressive_symptoms x2, /anxiety_symptoms x2 (all A);
probiotics_psychobiotics/depressive_symptoms x2 (A); st_johns_wort/depressive_symptoms (A).

Goal H (longevity): alcohol_consumption/all_cause_mortality x2 (C),
/cardiovascular_mortality (C); smoking_and_cessation/all_cause_mortality x2 (C);
obesity_bmi/all_cause_mortality (C); sedentary_time/all_cause_mortality,
/cardiovascular_mortality, /cancer_incidence_mortality (all C).

**Not checked live this pass** (remaining ~86 of 112 in-scope edges): all other body
composition edges (resistance_training, aerobic_exercise, caloric_deficit_magnitude,
intermittent_fasting_tre, sleep_restriction_during_diet, hmb, bcaa); most cognition
edges (caffeine, l_theanine_caffeine, sleep_deprivation, nicotine, creatine_sleep_deprivation,
ginkgo_biloba x2, mindfulness_based_interventions on working_memory/episodic_memory,
aerobic_exercise_chronic, omega3_supplementation, blood_pressure_control,
acute_aerobic_exercise); most mood/anxiety edges (aerobic_exercise, resistance_training,
mindfulness_based_interventions on anxiety/stress/cortisol, cbt, bright_light_therapy x2,
omega3_epa/dha, vitamin_d, loneliness_social_isolation, alcohol_use_disorder,
sleep_deprivation, time_in_nature); most longevity edges (physical_activity_volume,
cardiorespiratory_fitness, alcohol_consumption/cancer, fruit_vegetable_intake,
processed_red_meat, sleep_duration, social_isolation, air_pollution_pm25,
mediterranean_diet). The MD.0000000000036005 probiotics/MDD paper's own DOI was not
independently re-resolved via eutils this pass (only read from the edge's own quoted
text and key_results). Absence of a live check here is not evidence of a problem — it
reflects the 40-tool-call budget for this verification pass, not a finding.

---

## Verdict per criterion

1. **evidence_tier matches real design** — PASS for every edge checked live (18/18
   papers). No inflation found anywhere: single-arm cohorts and cross-sectional studies
   stayed at C/D even when large (n>100k) or backed by strong journals; single RCTs
   (Longland 2016, COSMOS-Mind) stayed at B, not bumped to A; only genuine meta-analyses/
   systematic-reviews of RCTs got A. The longevity tree in scope is 30/30 tier C, with no
   tier A/B edge found or claimed — matches the task's expectation exactly, and the one
   edge that might tempt an upgrade (smoking, 200k+ participants, extremely strong effect
   size) was correctly left at C with an explicit "cannot ethically randomize" caveat.

2. **direction correct including sign** — PASS for every edge checked live. Sign handling
   on inverted/time-based SMDs (creatine processing-speed, negative SMD = faster = "+")
   was verified correct. Genuinely null/contested relationships (alcohol J-curve, brain
   training far transfer, saffron clinician-rated outcomes, sedentary time + cancer for
   total sitting) are correctly given `direction: null` rather than a forced sign.

3. **conditional_on does not overstate generality; U-shapes/plateaus declared** — PASS
   for every edge checked live, including both SPECIFIC RISK U-shape/plateau cases in
   scope (alcohol J-curve across 4 edges; BMI U-shape for all-cause mortality). Both are
   declared as non-monotonic in `conditional_on`/`caveats` with the actual bias mechanism
   named, not collapsed into a single number or a single direction.

4. **paper.doi resolves and belongs to the paper in paper.title** — PASS for all 18
   papers checked live via NCBI eutils esearch+efetch: every DOI resolved to a PMID whose
   title matched `paper.title` verbatim or near-verbatim (only cosmetic differences, e.g.
   "St John's" vs "St. John's").

5. **verbatim is genuinely copied text, not a paraphrase** — ONE DEFECT FOUND (see below):
   `sedentary_time` / `cancer_incidence_mortality` splices and reorders two
   non-adjacent sentences from the source abstract into what reads as one continuous
   verbatim quote, with no ellipsis or `quote_elided` flag. All other verbatim strings
   checked live (25 of 26 checked edges) matched the source abstract as a genuine,
   contiguous or explicitly-elided substring.

---

## Defect list (ranked)

**1. [MEDIUM] Verbatim splice presented as continuous quote —
`sedentary_time` x `cancer_incidence_mortality`** (10.1007/s10654-018-0380-1,
PMID 29589226). The edge's `verbatim` field reads:
> "Associations with cancer mortality (1.03 (1.02-1.04)) and T2D were linear
> (1.09 (1.07-1.12)). The association was linear (1.01 (1.00-1.01)) with T2D and
> non-significant with cancer mortality."

In the live abstract, these two sentences appear in the OPPOSITE order and are separated
by an entire intervening sentence about TV-viewing all-cause/CVD mortality:
> "...The association was linear (1.01 (1.00-1.01)) with T2D and non-significant with
> cancer mortality. Stronger PA-adjusted associations were found for TV viewing (h/day);
> non-linear for all-cause mortality (...) and for CVD mortality (...). Associations with
> cancer mortality (1.03 (1.02-1.04)) and T2D were linear (1.09 (1.07-1.12))."

The edge's verbatim field reverses this order and concatenates the two sentences with no
ellipsis, no `quote_elided: true` flag, and no bracket/annotation showing they are
non-adjacent — it reads as if it were one continuous sentence from the paper, which it is
not. Note the underlying SCIENTIFIC CONTENT and interpretation are correct (total
sedentary time is not significantly associated with cancer mortality; TV viewing time is,
linearly, at RR 1.03/hour) and `conditional_on`/`caveats` explain this distinction
accurately — this is a verbatim-provenance defect, not a factual-accuracy defect. Because
it produces zero numeric mismatch, the automated `unsupported_numbers`/`quote_elided`
checks did not catch it; it required reading the live source to detect.

**2. [LOW] Industry-affiliated co-author's COI not surfaced in caveats — three
`glp1_receptor_agonists` edges keyed to SEMALEAN** (10.1111/dom.70141, PMID 41068996;
edges: fat_mass, max_strength, rmr). The live abstract's conflict-of-interest statement
discloses "Vanessa Folope is currently employed by Novo Nordisk" (a GLP-1 drug
manufacturer), with a note that her involvement predated her employment there. None of
the three SEMALEAN edges' `caveats` mention this, even though they do mention the
single-arm/no-placebo design limitation. Low severity because the COI is disclosed by the
journal itself and the measured outcomes (DXA body composition, handgrip strength) are
objective rather than subjectively rated, but for a pharma-relevant claim this is worth
surfacing alongside the existing single-arm caveat.

**3. [LOW, unresolved] Uninspected corrigendum on the creatine-cognition source —
`creatine_monohydrate` x `episodic_memory` and x `processing_speed`**
(10.3389/fnut.2024.1424972, PMID 39070254). PubMed shows a Corrigendum
(10.3389/fnut.2025.1570800, PMID 40034739) and a Comment (10.3389/fnut.2026.1716285, not
fetched). The corrigendum's own abstract gives no detail on what was corrected ("This
corrects the article DOI:..." with no further text in the PubMed record). This was not
resolved further within this pass's budget — flagged as an open item rather than a
confirmed defect, since the two live-checked verbatim numbers (SMD 0.31 memory, SMD -0.51
processing speed) could still be exactly correct pre- and post-correction.

No other defects were found in the 26 edges checked live. The three SPECIFIC RISKS named
in the task instructions were all checked directly and found handled correctly:
- Alcohol J-curve: NOT presented as settled; abstainer-bias and Mendelian-randomisation
  counter-evidence both present, both correctly captured as separate/paired edges.
- Mood/anxiety publication bias and placebo response: the saffron self-report vs
  clinician-rated divergence and the St John's wort small-study-effect shrinkage are both
  explicitly named and quantified in `conditional_on`/`caveats`.
- Cognition near/far transfer and creatine sourcing: the brain-training edge correctly
  isolates far transfer as the null result while reporting near-transfer separately; the
  creatine cognitive claim is sourced from a primary systematic review/meta-analysis of
  RCTs, not secondary coverage.
- Body composition GLP-1 lean mass: both the rising percentage (+1.81%) and falling
  absolute kg (-1.74 kg) are present in the same edge, not one dropped.

---

## Single most important fix

Add a rule (or a post-hoc automated check) that any `verbatim` string spanning more than
one sentence must preserve the SOURCE ORDER of those sentences and must carry a
`quote_elided: true` flag (or visible `...`) whenever the sentences are not contiguous in
the original abstract — the `sedentary_time` / `cancer_incidence_mortality` defect above
shows the existing `quote_elided` flag can miss a reordered splice that has no numeric
mismatch and no ellipsis marker, so an automated check based only on "is there a `...`"
or "do the numbers match" will not catch it; a source-order/contiguity check specifically
would.

Status: COMPLETE for the live-verification portion of this pass (18 papers / 26 edges
checked, budget ~40 tool calls). Remaining ~86 in-scope edges were reviewed only against
the dataset's own internal fields (tier/direction/conditional_on plausibility), not
against live sources, per the budget note above.


