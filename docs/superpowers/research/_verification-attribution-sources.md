# Attribution verification against the actual sources

Six suspected-misattributed rows in `astro-blog/public/data/health-evidence.json`, re-judged
against the PubMed abstract of each cited paper. All eight abstracts needed were already in
`docs/superpowers/research/_abstract_cache.json`; no new eutils fetches were required.

Method: abstract-level only. Where an abstract cannot settle a question, that is stated.
Nothing in the data file was edited.

---

## Row 1 - `saturated_fat_reduction -> ldl_cholesterol`
DOI 10.1016/j.numecd.2020.12.032 (Nutr Metab Cardiovasc Dis 2021)

**What the paper is.** A review-of-reviews: 37 guidelines, 108 systematic reviews and 20 RCTs
(RCTs for coffee only), searched to June 2019, GRADE-rated. It ranks *individual foods* by their
effect on LDL. Closing line: "Several foods distinctly modify LDL cholesterol levels."

**The suspicion (composite portfolio) is NOT supported.** The quoted sentence reads
"foods high in unsaturated and low in saturated and trans fatty acids (e.g. rapeseed/canola oil),
with added plant sterols/stanols, and high in soluble fiber (e.g. oats, barley, and psyllium)
caused at least moderate ... reductions". Each clause carries its own exemplar food, and no single
food is simultaneously canola oil, sterol-enriched and psyllium-rich. This is a **list of three
separate food categories sharing one GRADE band**, not a Portfolio-diet composite. Nothing in the
abstract mentions a portfolio, a combined intervention, or an additive total.

**But the row still over-claims.** 0.20-0.40 mmol/L is the review's own *category boundary* for
"moderate" (the row `caveats` field already admits this), not a pooled estimate for saturated-fat
substitution. The `effect` field paraphrases only clause one, which is legitimate; the `verbatim`
quoted underneath carries all three clauses, so a reader sees sterol and fibre evidence marshalled
behind a saturated-fat number.

**VERDICT: correctly attributed in kind, but not evidentially independent** of the plant_sterols
and oat_beta_glucan rows, and its number is not saturated-fat-specific.

### Double-counting answer
**Not literally the same effect three times, but not three independent counts either.**

| row | paper | LDL effect |
|---|---|---|
| `plant_sterols` | 10.1016/j.atherosclerosis.2013.08.012 (41 studies, n=2084) | -0.33 mmol/L |
| `oat_beta_glucan` | 10.1017/S000711451600341X (58 RCTs, n=3974) | -0.19 mmol/L |
| `saturated_fat_reduction` | 10.1016/j.numecd.2020.12.032 (umbrella of 108 SRs) | -0.20 (band floor) |

There is no fibre node on `ldl_cholesterol` other than `oat_beta_glucan` - `fibre_general` exists
but has no LDL edge. So the three rows are three different papers with three different numbers,
and a naive "one finding counted three times" claim is false.

The real problem is **hierarchical overlap**. The 2021 row is an umbrella synthesis of 108
systematic reviews, a pool that by construction includes the kind of sterol and oat meta-analyses
the other two rows cite directly. The row's own `key_results` says so outright: "The same synthesis
independently corroborates the plant-sterol and oat-beta-glucan edges above". Since the scatter
plot **sums** edges on a marker, this row contributes a third, non-independent value derived partly
from the other two. The fix is de-duplication by evidence level (drop or de-weight the umbrella row
on this marker), not a behaviour reassignment.

---

## Row 2 - `weight_loss -> bmd`
DOI 10.1007/s00198-016-3617-4 (Osteoporos Int 2016)

**What the paper studied.** 32 RCTs in adults. Interventions: **calorie restriction and/or
exercise training**, versus control. The abstract's own summary line: "Both calorie restriction and
a combination of calorie restriction and exercise result in a decrease in hip bone density, whereas
weight loss response to exercise training without dietary restriction leads to increased hip BMD."
**The words bariatric, surgery, gastric and diabetes do not appear anywhere in the abstract.**

**Faithfulness.** The `effect` and `verbatim` are accurate transcriptions of the paper. They are
attached to the wrong node.

**VERDICT: MISATTRIBUTED.** The node `weight_loss` is named "Weight loss (bariatric surgery vs
conventional therapy)" with `dose_or_intensity` "Bariatric surgery vs conventional medical/
lifestyle therapy in adults with type 2 diabetes, mean follow-up ~17 months". That text belongs to
a *different* edge on the same node - `weight_loss -> hba1c_fasting_glucose`,
DOI 10.1007/s11695-013-1160-3, which genuinely is a bariatric-vs-medical comparison. The node was
named after one of its three edges, and the other two inherited a description that contradicts
their sources.

**Where it belongs.** `weight_loss_fatloss` ("Weight loss / fat loss", dose "Lifestyle, dietary,
exercise, or bariatric-surgical weight loss") already exists and fits without modification.

---

## Row 3 - `weight_loss -> oa_pain`
DOI 10.1016/j.joca.2024.08.012 (Osteoarthr Cartil 2025)

**What the paper studied.** Network meta-analysis, 13 RCTs, 2800 overweight/obese adults with
knee OA. The seven networked interventions are enumerated in the abstract: diet; exercise; diet and
exercise; **pharmacological**; psychological; psychological+diet+exercise; Mediterranean diet.
**Bariatric surgery is not one of them.** The row's headline effect (-2.2 on a 0-20 pain scale) is
specifically the diet-plus-exercise arm.

**Faithfulness.** Effect and verbatim match the abstract word for word. Wrong node, again.

**VERDICT: MISATTRIBUTED**, same defect and same fix as Row 2 - move to `weight_loss_fatloss`, or
narrow further to a diet-plus-exercise weight-loss node if one is created. Unrelated but standing:
this row also carries an Expression of Concern flag, already recorded in the data.

---

## Row 4 - `probiotics -> ibs_severity`
DOI 10.1016/j.clnesp.2024.02.025 (Clin Nutr ESPEN 2024)

**What the paper studied.** 20 trials, 3011 IBS patients, searched 2000 to June 2023, probiotics
versus placebo; outcomes were global IBS symptom improvement rate, quality of life, abdominal pain,
distension and adverse events. This is unambiguously an IBS paper.

**Faithfulness.** RR 1.401 (1.182-1.662), SMD 0.286 (0.154-0.418), the non-significant global
symptom score at I2 = 91.9%, and the 10^10 CFU / multi-strain subgroups all appear verbatim in the
abstract. The row is a correct reading of its source.

**VERDICT: CORRECTLY ATTRIBUTED.** The suspicion misfires at the edge level but is right about a
real defect one level up: the *node* `probiotics` has `dose_or_intensity` = "Various probiotic
strains/doses across 23 RCTs and 1 cluster-RCT, mainly Lactobacillus/Bifidobacterium species,
**taken prophylactically**". That describes the Cochrane respiratory-infection review
(10.1002/14651858.CD006895.pub4), which supplies two other edges on this same node
(`arti_incidence`, `infection_duration`). Same failure pattern as `weight_loss`: a shared behaviour
node was given one edge's study description. The IBS row itself is fine; the node metadata is wrong
for it, and for the depression/anxiety edges too.

---

## Row 5 - `resistance_training -> serum_testosterone`
DOI 10.1519/JSC.0000000000004146 (Potter et al., J Strength Cond Res 2021)

**What the paper studied.** 11 RCTs, 421 insufficiently active, apparently healthy eugonadal men
aged 19-75, 16 intervention groups "who participated in **aerobic, resistance, or combined
training** lasting a median of 12 weeks". The inclusion criterion was "exercise training [**any
modality** at intensity of >=4 metabolic equivalents] lasting a minimum of 4 weeks".

**Faithfulness.** SMD 0.00 (-0.20 to 0.20) is the **pooled all-modality** estimate, not a
resistance-training subgroup. The abstract then states: "Subgroup analyses indicated that the effect
of exercise training was not significantly affected by **training mode**, age, body mass status, or
testosterone measure." Conclusion sentence: "**Exercise training** does not seem to affect resting
total or free testosterone concentration in insufficiently active, eugonadal men." The suspicion is
confirmed by the abstract on every point.

**VERDICT: MISATTRIBUTED.** It is an exercise-training-in-general null, not a resistance-training
finding. Two mitigations are worth recording: (a) the row's `conditional_on` already discloses this
in full ("regardless of training modality (aerobic, resistance, or combined)"), and (b) because mode
was tested and found non-moderating, the null *is* true of resistance training as a subset - so the
claim is not false, only mis-filed, and it inflates the resistance_training edge count.

**Where it belongs.** No clean home exists. The closest nodes are `b_exercise_general`
("Regular/acute exercise (general, not timing-specific)") and `exercise_longterm` ("Long-term
aerobic/mixed exercise training", moderate intensity, >12 weeks, healthy subjects). The latter is
the better fit on duration and population, but its "aerobic/mixed" label is narrower than "any
modality". A new any-modality exercise-training node, or a widened `b_exercise_general`, would be
the honest destination.

---

## Row 6 - `smoking -> vasomotor_symptoms`
DOI 10.1016/j.ajog.2019.10.103 (Am J Obstet Gynecol 2020, InterLACE pooled analysis)

**What the paper studied.** 21,460 midlife women pooled from 8 cohorts (cross-sectional), 11,986
prospective. Exposures: **BMI and smoking, and their joint effects**. The title itself is
"Obesity, smoking, and risk of vasomotor menopausal symptoms".

**The suspicion is confirmed, and is worse than stated.** Both quoted figures are BMI-stratified
joint categories measured against a single reference group, normal-weight never-smokers:

- RR 1.52 = **obese never-smokers**. This category contains *no smoking at all*; it is a pure
  obesity effect, yet it is the lead number in the row's `effect` field on a smoking edge.
- RR 3.02 = **obese smokers**, the joint obesity-by-smoking cell. This is the value stored in
  `effect_normalized`, and therefore the number the scatter plot places on the smoking axis.

The abstract does report genuine smoking main-effect *directions*: "smoking more cigarettes with
longer duration and earlier initiation were all associated with more frequent or severe vasomotor
symptoms", and "smokers who quit at <40 years of age were at similar levels of risk as never
smokers". So the edge's sign (+) and its existence are sound. What the abstract never reports is a
standalone smoking relative risk in normal-weight women.

**VERDICT: MISATTRIBUTED (in magnitude).** The direction belongs to `smoking`; the two numbers do
not. **The abstract cannot supply a replacement smoking main-effect RR - the full text, with its
dose-response estimates by cigarettes per day, duration and age at initiation, is needed.**

**Where the 1.52 belongs.** The node `obesity_bmi` ("Obesity / body mass index") already exists and
currently has no edge to `vasomotor_symptoms`. RR 1.52 in never-smokers is exactly an
`obesity_bmi -> vasomotor_symptoms` finding. One caution from the paper before creating it: higher
BMI raised risk pre- and perimenopausally but **reduced** it postmenopausally, so that edge is
menopausal-stage-conditional. The 3.02 interaction cell has no natural single-behaviour home and is
best left as `conditional_on` prose rather than carried as an effect size.

---

## Cross-cutting pattern

Three of the six defects (Rows 2, 3, 4) are the same structural bug, not six independent errors:
**a behaviour node's `name` and `dose_or_intensity` were written from a single one of its edges,
and the node's other edges then read as if they studied that intervention.** `weight_loss` was
named from its bariatric HbA1c edge; `probiotics` was described from its Cochrane respiratory-
prophylaxis edges. Any node carrying edges from more than one paper should be audited for this.

## What could NOT be settled from abstracts

1. **Row 6**: no smoking-only relative risk appears in the abstract; the dose-response estimates
   that would supply one are in the full text only.
2. **Row 1**: whether the 108 systematic reviews pooled by the umbrella actually include the
   specific 2013 plant-sterol and 2016 oat meta-analyses cited by the sibling rows cannot be
   confirmed from the abstract - the included-study list is full-text/supplementary. The overlap is
   near-certain by construction, and the row itself asserts it, but it is not literally verified.
3. **Rows 2 and 3**: whether any individual trial among the 32 BMD RCTs or the 13 knee-OA RCTs
   contained a surgical arm is not fully enumerable from the abstracts. Both abstracts do list their
   intervention taxonomies explicitly and neither taxonomy contains surgery, which is enough to
   settle the attribution question as posed but not to prove zero surgical participants.
