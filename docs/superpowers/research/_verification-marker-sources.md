# Marker-attribution verification against primary sources

Nine rows suspected of pointing at the wrong marker. An earlier pass judged them from
internal consistency only. This pass settled each against the paper's own abstract.

Sources: all eight DOIs were already in `docs/superpowers/research/_abstract_cache.json`
(PubMed abstracts fetched via NCBI eutils, the route `scripts/check_verbatim.py` uses).
No network fetch was needed; no full texts were consulted, so every verdict below rests on
the abstract alone and says so where that is limiting.

Marker definitions quoted from `nodes.markers` in
`astro-blog/public/data/health-evidence.json` (`name` / `unit`).

---

## 1. psychological_stress -> subjective_libido  (10.1093/jsxmed/qdaf045)

**(a) What the paper measured.** "Erectile dysfunction severity was measured using the
International Index of Erectile Function-5 (IIEF-5) and the Nocturnal Penile Tumescence
and Rigidity (NPTR) tests." The beta = -0.604 is perceived stress (PSS-14) against
erectile function (IIEF-5). Desire was not measured. The IIEF-5 / SHIM is the abridged
five-item instrument covering erectile function and intercourse satisfaction; unlike the
full 15-item IIEF it contains **no sexual-desire domain at all**, so there is no subscale
in this study that could have carried a libido result.

**(b) Match to marker.** `subjective_libido` = "Subjective libido / sexual desire", unit
"validated scale score (IIEF **sexual-desire domain** or equivalent questionnaire) or
standardized regression coefficient". The unit names precisely the domain the paper did
not administer. The row's own `caveats` already concede this ("the marker measured is
erectile function specifically, used here as the closest available proxy").

**(c) VERDICT: wrong marker.** Confirmed against the abstract, not merely suspected.

**(d) Where it belongs.** `nitric_oxide_blood_flow` — name "Nitric oxide / vascular blood
flow (erectile function)", unit already admits "IIEF erectile-function domain". Construct
then matches. Two consequences to accept knowingly:

- the row's statistic is a standardized beta, while that marker's other rows are ORs/RRs
  and a %FMD mean difference, so it is still not rankable against its new peers;
- `subjective_libido` is left with a single row (maca), i.e. a marker with nothing to
  rank. That is honest, not a reason to keep a mis-filed row.

Cleaner alternative: a dedicated `erectile_function` marker (IIEF/IIEF-5 domain scores and
ED response rates), leaving `nitric_oxide_blood_flow` for genuine vascular measures. See §5.

---

## 2. physical_activity -> ibs_severity  (10.1055/s-2008-1038600)

Note: the row is keyed `physical_activity`, not `physical_activity_volume`.

**(a) What the paper measured.** "Outcomes included irritable bowel specific quality of
life, symptoms (total symptoms, constipation, diarrhoea and pain) and exercise
participation." Results: "Analyses revealed no differences in quality life scores between
groups at 12-week follow-up. The exercise group reported significantly improved symptoms
of **constipation** (mean difference=10.9, 95% CI= -20.1, -1.6)." The abstract reports no
significant result for total symptoms, diarrhoea or pain. The instrument is not named in
the abstract, and it is not IBS-SSS — IBS-SSS has no constipation subscale.

**(b) Match to marker.** `ibs_severity` = "IBS symptom severity", unit "IBS-SSS points
(0-500 scale); or adequate-relief / global-improvement responder rate (%)". The quoted
figure is neither: it is a mean difference on a constipation subscale of an unnamed
instrument, and the *total* symptom score — the thing the marker names — was null.

**(c) VERDICT: wrong marker.** The suspicion is confirmed exactly as stated.

**(d) Where it belongs.** Construct match is `constipation_relief` ("Constipation
responder rate", unit "% meeting a trial's relief definition; CSBM per week") — but that
unit does not admit a subscale mean difference either, so moving it requires broadening
that marker's unit to "...or mean difference on a constipation symptom subscale".

**This row also carries a second, worse defect.** It currently ranks **1st of 6** on
`ibs_severity` ("effect size ranks 100th percentile among the 6 scored rows on this
marker (+2)", usefulness score 4.19 — the highest on the marker). That rank is produced by
`effect_normalized = -10.9`, a raw subscale point difference, ranked against RRs (1.40,
1.60, 2.23) and an SMD (-0.62) on the same marker. So the page presently tells the reader
that exercise is the single most effective intervention for IBS severity, on the strength
of a subscale figure from a 56-patient feasibility trial whose total-symptom result was
null. If the row stays anywhere, `effect_normalized` must not be -10.9.

An honest alternative to moving it: restate the row as the **total-symptom null** under
`ibs_severity` (which is what this marker is for), and file the constipation finding, if
wanted, as a separate row under `constipation_relief`.

---

## 3. alcohol -> cardiovascular_mortality  (10.1016/S0140-6736(18)31772-0)

**(a) What the paper measured.** Disease **incidence**: "monitoring cardiovascular disease
(including ischaemic stroke, intracerebral haemorrhage, and myocardial infarction) by
linkage with morbidity and mortality registries and electronic hospital records", and
"Adjusted Cox regression was used to obtain the relative risks associating **disease
incidence** with ... genotype-predicted mean male alcohol intake". The quoted RR 1.58 is for
intracerebral haemorrhage incidence; 1.27 for ischaemic stroke; MI was null (0.96). No
cause-specific mortality estimate appears anywhere in the abstract.

**(b) Match to marker.** `cardiovascular_mortality` = "Cardiovascular mortality", unit "HR
or RR". The metric type matches; the **outcome does not**. Deaths enter only as one of
several ascertainment sources for incident events. The row's `conditional_on` already
spells this out in full and files it anyway.

**(c) VERDICT: wrong marker.** Confirmed.

**(d) Where it belongs.** No suitable marker exists. `cardiovascular_mortality` is the
only cardiovascular-endpoint marker, and its seven other rows are genuine
cause-specific-mortality HRs — so the mis-file is not cosmetic: 1.58 is currently the
largest effect on a marker where every neighbour is a mortality hazard ratio.
**A new marker is needed**, e.g. `cvd_event_incidence` — "Stroke / cardiovascular event
incidence", unit "HR or RR for incident ischaemic stroke, intracerebral haemorrhage or
myocardial infarction". That marker would also be the right home for the `sleep_duration`
row currently on `cardiovascular_mortality`, whose quoted statistic reads "For total
cardiovascular **disease**, RR 1.06 per 1-hour reduction..." — flagged in passing, outside
this task's nine, and not verified against its own source here.

The same paper does legitimately support a blood-pressure claim ("Alcohol consumption
uniformly increases blood pressure"); that is a separate row, not checked here.

---

## 4. loneliness_social_isolation -> depressive_symptoms  (10.1007/s00127-022-02261-7)

**(a) What the paper measured.** "Our meta-analysis found a pooled adjusted odds ratio of
2.33 (95% CI 1.62-3.34) for risk of **new onset depression** in adults who were often
lonely compared with people who were not often lonely" — a meta-analysis of eight
longitudinal cohorts on *incidence of a depression diagnosis*. The abstract names no
symptom instrument and reports no continuous score.

**(b) Match to marker.** `depressive_symptoms` = "Depressive symptoms (PHQ-9, BDI, HAM-D)",
unit "instrument points (pre-post or between-group mean difference) or SMD/Hedges' g/WMD
as pooled by source". An adjusted odds ratio for incident diagnosis is neither an
instrument-point difference nor a standardised mean difference. The row's own
`conditional_on` concedes this.

**(c) VERDICT: wrong marker.** Confirmed.

**(d) Where it belongs.** No incident-diagnosis mood marker exists. **A new marker is
needed**, e.g. `depression_onset` — "New-onset depression (incident diagnosis)", unit
"OR/RR/HR for incident depression". This is the sharpest instance of the ranking problem:
`depressive_symptoms` holds **19** rows, overwhelmingly SMDs and instrument-point
differences, and an OR of 2.33 sitting among them is ranked on a scale it does not share.

---

## 5. aerobic_exercise -> nitric_oxide_blood_flow  (10.1186/s13102-025-01124-3)

**(a) What the paper measured.** Brachial artery endothelial function by flow-mediated
dilatation: "Meta-analysis revealed improvement in baFMD post-AT (small MD = 1.92%, 95% CI
0.90 to 2.94, p = 0.001)", 12 RCTs, 385 participants, "51% male". **Erectile function is
never mentioned** — the paper is about cardiovascular risk, and interprets the result as
"an average 19.2% reduction in CVD risk".

**(b) Match to marker.** `nitric_oxide_blood_flow` = "Nitric oxide / vascular blood flow
(erectile function)", unit "heterogeneous: **%FMD change (direct vascular marker)** or IIEF
erectile-function domain / pooled odds ratio (clinical surrogate)". The unit names %FMD
first and explicitly. The row matches the marker as defined.

**(c) VERDICT: correct.** Both halves of the suspicion are answered: the measure *is* FMD,
and that is what the marker admits; and the row does **not** concern erectile function —
if anything the mismatch runs the other way (see below).

**(d) The defect here is the marker, not the row.** `nitric_oxide_blood_flow` deliberately
fuses a direct vascular measurement with clinical ED response rates, and the page then
ranks them against each other: 1.92 (percentage points of FMD) against 3.37 and 2.40 and
2.05 (odds/risk ratios) and 41.7 (a percentage-point difference in responder proportions).
Four different quantities on one axis. Recommended fix, which also completes §1: split into
`endothelial_function_fmd` (%FMD; this row) and `erectile_function` (IIEF domain scores and
ED response ORs/RRs; l_arginine, l_citrulline, both korean_red_ginseng rows, plus the
psychological_stress row from §1). That is a larger change than the nine rows, and it is a
judgement call about the page's scope — flagging it, not prescribing it.

---

## 6-8. The three handgrip rows filed under `max_strength`

Marker: `max_strength` = **"Maximal strength (1RM)"**, unit "kg (1RM **or handgrip**), or
SMD as reported by source". The name and the unit already contradict each other — the unit
looks retro-fitted to accommodate rows the name excludes.

### 6. caloric_deficit_magnitude (10.1001/jamanetworkopen.2019.13733, TEMPO)

**(a)** Secondary outcomes were "body weight, thigh muscle area and muscle function
(strength) ... measured at 0, 4, 6, and 12 months"; the result is "there was no difference in
**muscle (handgrip) strength** between groups", and the conclusion repeats "no greater
adverse effect on relative whole-body lean mass or **handgrip strength**". Handgrip
dynamometry only. **No 1RM test appears anywhere in the abstract.**

**(b)** Not a 1RM; admitted only by the marker's retro-fitted unit clause, not by its name.
**(c) VERDICT: wrong marker** (as named). **(d)** → grip-strength marker, see below.

### 7. glp1_receptor_agonists (10.1111/dom.70141, SEMALEAN)

**(a)** "muscle function (**handgrip strength**) ... were assessed at baseline (M0), 7 months
(M7), and 12 months (M12)"; result "Handgrip strength improved significantly (+4.5 kg at
M12)". Handgrip is the study's sole muscle-function measure. **No 1RM.**
**(b)** Not a 1RM. **(c) VERDICT: wrong marker** (as named). **(d)** → grip-strength marker.

### 8. bcaa (10.1016/j.archger.2025.106063)

Note: keyed `bcaa`, not `bcaas`.

**(a)** A meta-analysis of 12 RCTs (n=459) in sarcopenic older adults reporting "**hand grip
strength** (SMD = 0.289, p = 0.080) ... **knee extension strength** (SMD = 0.332, p = 0.328)",
alongside 30-s chair stand, SPPB, gait speed, lean mass and fat mass. The row's
`effect_normalized` (0.289) is the handgrip figure. Knee-extension strength in sarcopenia
trials is conventionally isometric or isokinetic dynamometry; the abstract does not specify
the protocol, but nothing in it is described as a one-repetition maximum. **No 1RM.**
**(b)** Not a 1RM. **(c) VERDICT: wrong marker** (as named). **(d)** → grip-strength marker.

### Recommendation on the split

`max_strength` currently holds seven rows and two incommensurable constructs:

| Row | Statistic | Construct |
|---|---|---|
| resistance_training (10.1249/MSS.0000000000002585) | SMD 0.60-0.63 / 0.34-0.35 | trained strength (load-based RT meta) |
| protein_intake (10.1136/bjsports-2017-097608) | +2.49 kg 1RM | 1RM |
| creatine_monohydrate (10.1186/s11556-025-00392-9) | SMD 0.29 lower-limb | trained strength |
| hmb (10.3390/nu12051523) | null on total / bench / lower-body 1RM | 1RM |
| **caloric_deficit_magnitude** | null, handgrip | **handgrip** |
| **glp1_receptor_agonists** | +4.5 kg handgrip | **handgrip** |
| **bcaa** | SMD 0.289 handgrip | **handgrip** |

(The four 1RM-side DOIs were not re-verified in this pass; they are listed from the data
file to show the shape of the split, and their construct labels come from their own quoted
statistics, which name 1RM explicitly in two cases.)

**Split them.** Create `grip_strength` — "Handgrip strength", unit "kg or SMD (hand
dynamometry)", same goal `goal_e_body_composition_strength` — and move rows 6, 7, 8 into it.
Leave `max_strength` with the four resistance-training-context rows and **restore its unit
to "kg (1RM) or SMD as reported by source"**, deleting the "or handgrip" clause that was
added to paper over the conflict.

Why this matters beyond tidiness: grip strength and 1RM answer different questions. Grip is
a whole-body frailty/sarcopenia proxy, moves with health status, and is measured without
training; 1RM is a trained, task-specific capacity. A +4.5 kg grip gain in people losing
13% of body weight and a +2.49 kg 1RM gain from protein supplementation are not
comparable magnitudes, and the page ranks effect sizes *within* a marker — so today it
orders them against each other and reports a percentile. That percentile is meaningless.

Residual problem the split does **not** fix: even within each half, kg and SMD are still
ranked against one another. That is a separate, pre-existing issue on this marker.

---

## 9. glp1_receptor_agonists -> rmr  (10.1111/dom.70141)

**(a) What the paper measured.** "**REE normalised to lean mass** increased significantly
from M7 to M12." Resting energy expenditure, expressed per unit of lean mass. The abstract
gives no kcal/day figure, no CI, and no p-value for this outcome.

**(b) Match to marker.** `rmr` = "Resting metabolic rate", unit "kcal/day, **or REE
normalized to lean mass as reported by source**". The unit explicitly admits the
lean-mass-normalised form.

**(c) VERDICT: correct** — as filed against the marker *as currently defined*. The
suspicion is factually right (it is lean-mass-adjusted REE, not raw RMR) but does not make
the row wrong, because the marker's unit was written to accept it.

**(d) Two things worth recording anyway.**

- The marker's unit conflates two different quantities: the only other row
  (resistance_training) is +96.17 **kcal/day absolute**. Absolute RMR and REE-per-kg-lean
  can move in opposite directions during weight loss, which is exactly this row's
  situation. Ranking is not currently harmed only because this row's
  `effect_normalized` is `null` (the abstract gives no number), so it is unscored.
- The comparison is **M7 to M12**, i.e. within-treatment across the second half of
  follow-up — not baseline-to-12-months, and not against any comparator (single-arm
  study). So it does not establish that semaglutide raised REE relative to starting
  metabolic rate; it says REE-per-kg-lean recovered during the phase when lean mass had
  stabilised. The row's `effect` text ("increased significantly from 7 to 12 months of
  semaglutide treatment") is accurate; a reader skimming the marker page could still
  take it as "semaglutide raises metabolic rate". Worth a sharper `conditional_on`.

---

## Summary table

| # | Row | Verdict | Action |
|---|---|---|---|
| 1 | psychological_stress -> subjective_libido | **wrong marker** | → `nitric_oxide_blood_flow`, or new `erectile_function` |
| 2 | physical_activity -> ibs_severity | **wrong marker** | → `constipation_relief` (widen unit), or restate as the total-symptom null; and drop the -10.9 `effect_normalized` that gives it a false #1 rank |
| 3 | alcohol -> cardiovascular_mortality | **wrong marker** | **new marker** `cvd_event_incidence` |
| 4 | loneliness_social_isolation -> depressive_symptoms | **wrong marker** | **new marker** `depression_onset` (OR/RR/HR) |
| 5 | aerobic_exercise -> nitric_oxide_blood_flow | **correct** | row fine; marker fuses %FMD with ED response ratios — consider splitting |
| 6 | caloric_deficit_magnitude -> max_strength | **wrong marker** (as named) | **new marker** `grip_strength` |
| 7 | glp1_receptor_agonists -> max_strength | **wrong marker** (as named) | **new marker** `grip_strength` |
| 8 | bcaa -> max_strength | **wrong marker** (as named) | **new marker** `grip_strength` |
| 9 | glp1_receptor_agonists -> rmr | **correct** (marker unit admits it) | tighten `conditional_on` (M7→M12, single-arm) |

## What this pass could NOT settle

- **Row 2's instrument.** The abstract names the outcome domains (total symptoms,
  constipation, diarrhoea, pain) but not the questionnaire, so the constipation subscale's
  scale range and direction convention are unknown from the abstract. That the figure is a
  constipation subscale and that total symptoms were null are both settled; the scale is not.
  Settling it needs the full text (Int J Sports Med 2008).
- **Row 8's knee-extension protocol.** The abstract does not state whether the pooled trials
  used isometric, isokinetic or dynamic testing. It is not described as 1RM, which is enough
  for the verdict, but the exact instrument is unsettled from the abstract.
- **The four 1RM-side rows on `max_strength`** (resistance_training, protein_intake,
  creatine_monohydrate, hmb) were read from the data file only; their sources were not
  verified in this pass. The split recommendation assumes their quoted statistics are accurate.
- **Whether the page's owner wants new markers at all.** Rows 3, 4 and 6-8 need markers that
  do not exist. Creating them is a scope decision, not a factual one.
- No full texts were consulted for any row; every verdict rests on the PubMed abstract.
