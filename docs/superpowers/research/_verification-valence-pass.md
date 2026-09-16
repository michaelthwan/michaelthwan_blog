# Valence verification pass — health-evidence.json

Scope: all 320 edges in `astro-blog/public/data/health-evidence.json`, plus the
`MARKER_DESIRABLE` map (64 markers) in `scripts/merge_health_evidence.py:340-414`.
Method: sign recomputed independently from `direction` + marker `desirable` + row
`up_is_good`, then compared against what the row's own `effect`/`verbatim` sentence says
happened to the person. Every row was read; no sampling. Nothing in the repo was edited.

Rows checked: 320. Non-null `direction`: 253 (178 good, 63 bad, 12 unclear). Null: 67.

---

## A. Rows whose displayed sign contradicts their own sentence

All nine render a red "minus" (unfavourable) on a sentence describing a benefit.

### A1. The ginseng cluster — 8 rows, one systematic cause (SEVERITY: high)

Every ginseng-family row landing on a *lower-is-better* marker recorded `direction: "+"`
to mean "the finding was positive", not "the marker's number rose". Identical in kind to
the already-fixed `nmn_supplementation -> m_psqi` defect. Ginseng rows on higher-is-better
markers (`korean_red_ginseng -> nitric_oxide_blood_flow`, `ginseng_species_unspecified ->
episodic_memory` / `global_cognition_older`) are correct, which is why the error clusters.

| behavior_id -> marker_id | direction | evidence (verbatim/effect) |
|---|---|---|
| `american_ginseng -> blood_pressure` | `+` | "3g of AG significantly lowered radial AI by 5.3% and systolic BP by 11.7%" |
| `american_ginseng -> blood_pressure` | `+` | "AG lowered systolic blood pressure (- 5.6 +/- 2.7 mmHg; p < 0.001)" |
| `american_ginseng -> hba1c_fasting_glucose` | `+` | "AG significantly reduced HbA1c (- 0.29%; p = 0.041) and fasting blood glucose (- 0.71 mmol/L)" |
| `american_ginseng -> infection_duration` | `+` | "ginseng significantly shortened the duration of colds or ARIs by 6.2 days" |
| `american_ginseng -> arti_incidence` | `+` | "Jackson-confirmed URIs were significantly lower in the treated groups (P < 0.04)" |
| `american_ginseng -> resting_hr_arterial_stiffness` | `+` | "significantly lowered radial AI by 5.3% (P=0.041)" |
| `panax_genus_pooled -> hba1c_fasting_glucose` | `+` | "Ginseng significantly reduced fasting blood glucose (MD = -0.31 mmol/L, P = 0.03)" |
| `panax_ginseng_hrg80 -> perceived_stress` | `+` | "HRG80 treatment was significantly superior ... regarding attention, memory, and PS scores" |

Fix: `direction` should be `"-"` on all eight (the marker's number fell). Do not reach for
`up_is_good` here — the marker polarity is right, the row's recorded direction is wrong.

### A2. `nmn_supplementation -> insulin_sensitivity_homa_ir` (SEVERITY: high)

`direction: "+"`, marker desirable `"-"` -> renders red. But: "Insulin-stimulated glucose
disposal, assessed by using the hyperinsulinemic-euglycemic clamp, and skeletal muscle
insulin signaling ... increased after NMN supplementation but did not change after
placebo." The number that rose is a *sensitivity* index (up = better), not HOMA-IR.
Fix: add `up_is_good: true` to this row (the marker default must stay `"-"` for the
HOMA-IR rows). This is the `sustained_attention_rt` pattern recurring on a second
marker — see B1.

---

## B. Marker-level structural problems in `MARKER_DESIRABLE`

### B1. `insulin_sensitivity_homa_ir: "-"` — genuine two-scale conflation (SEVERITY: high)

The comment already admits it ("reported as HOMA-IR, where lower is better"), but only 2 of
its 4 rows use HOMA-IR. `sleep_restriction` reports clamp glucose-infusion rate *falling*
(harm) yet is recorded `+`; `nmn_supplementation` reports the same measure *rising*
(benefit) and is also recorded `+`. Two rows, opposite physiology, same direction value —
one of them renders correctly only by accident. This is the identical defect class to
`sustained_attention_rt` and needs the same per-row `up_is_good` treatment.

### B2. Latent "improved" -> direction convention leaks (SEVERITY: medium; render green today)

Three markers hold rows where `direction` encodes "improved" rather than the number's
movement. They happen to display the right colour today, but any new row using the literal
convention will flip red:

- `gait_speed_walking_function: "+"` — the `nmn_supplementation` row measures 4-metre
  walking **time**, which *fell*; recorded `+`. Speed-up-good and time-down-good coexist
  on one marker.
- `oa_function: "-"` — `land_based_exercise` reports function "improved by 10 points/100"
  on a higher-is-better scale; recorded `-`. The map comment assumes WOMAC difficulty only.
- `vasomotor_symptoms: "-"` — `exercise_vasomotor` reports SMD **+0.25** meaning
  improvement; recorded `-`.

Recommendation: these three should carry explicit per-row `up_is_good`, or the extraction
convention should be stated in the marker comment as `m_psqi` and `oa_pain` already do.

### B3. Remaining 58 markers: checked, no defect found

Desirable directions for mortality/morbidity markers (`all_cause_mortality`,
`cancer_incidence_mortality`, `cardiovascular_mortality`, `fracture_incidence`,
`arti_incidence`, `experimental_infection_susceptibility`, `caries_increment`,
`periodontal_attachment`), symptom scores (`anxiety_symptoms`, `depressive_symptoms`,
`oa_pain`, `ibs_severity`, `pms_symptoms`, `menstrual_pain`, `statin_muscle_symptoms`,
`m_psqi`, `m_sol`), lab values (`ldl_cholesterol`, `triglycerides`,
`hba1c_fasting_glucose`, `hs_crp_il6`, `alt_ast`, `liver_fat_steatosis`,
`liver_stiffness_fibrosis`, `insulin_igf1`, `pcos_androgens`) and capacity markers
(`vo2max`, `max_strength`, `lean_mass`, `lean_mass_strength`, `bmd`, `working_memory`,
`episodic_memory`, `global_cognition_older`, `m_sws_rem`, `nitric_oxide_blood_flow`,
`serum_testosterone`, `subjective_libido`, `sperm_parameters`, `menstrual_regularity`,
`vaccine_antibody_response`, `constipation_relief`, `stool_frequency_consistency`,
`gingival_inflammation`, `plaque_index`, `sebum_acne`, `fat_mass`, `waist_vat`,
`blood_pressure`, `resting_hr_arterial_stiffness`, `infection_duration`,
`perceived_stress`) were each checked against every row that uses them and are correct
as recorded.

Note (not a defect): `alcohol -> bmd` renders green because light drinking associates with
higher BMD. The row is honest and observational, but it is the only green sign on alcohol
in the dataset and a reader scanning colours will read it as an endorsement.

---

## C. `valence: "unclear"` rows (12) — is "no inherent direction" right?

| marker (rows) | verdict |
|---|---|
| `processing_speed` (3) | **Gap, not directionless (SEVERITY: medium).** All three rows state their own polarity and all three describe a *benefit*: creatine "significantly improving processing speed time (SMD = -0.51)"; creatine under sleep deprivation "mitigating effect on ... language-related processing speed"; acute aerobic exercise "g = .35 for time-dependent measures" in executive-function tasks. Three favourable findings are shown as a purple "?". Fixable per-row with `up_is_good`. |
| `cortisol` (1) | **Borderline (SEVERITY: low).** The marker is genuinely two-scaled (diurnal slope vs awakening response), but this single row states outright that it is "reported in a benefit-positive convention where a positive g indicates lower cortisol" — the row is not ambiguous even though the marker is. |
| `m_dlmo` (2) | Correct as unclear for `b_morning_light` (a phase advance is context-dependent). Borderline for `b_evening_blue_light`, whose sentence reads as a harm ("Overnight melatonin secretion was significantly higher after using the blue-light shield" plus better sleep latency) — but the row's own caveat cites a contradicting RCT, so "?" is defensible. |
| `gut_transit` (2) | Correct. Stress accelerates colonic transit (harm in IBS), coffee accelerates it (benefit in constipation) — the two rows genuinely run opposite ways. |
| `rmr` (2) | Correct. A higher resting metabolic rate is not self-evidently good. |
| `blood_nad_plus` (2) | Correct, and the map's stated reasoning is the right one: marking a surrogate rise "favourable" would assert the conclusion the rows underneath cannot support. |

---

## D. `valence: "none"` rows (67) — genuine nulls?

Four rows are not clean nulls:

1. **`xylitol_products -> caries_increment` (SEVERITY: medium)** — tagged null, but the
   effect reads "may reduce caries by 13% ... (PF -0.13, 95% CI -0.18 to -0.08)". The
   confidence interval excludes zero: a statistically significant benefit displayed as the
   grey studied-and-null mark. Low GRADE certainty and a single author group are caveats,
   not a null result.
2. **`glucosamine_chondroitin -> oa_pain` (SEVERITY: medium)** — tagged null, but
   "glucosamine and chondroitin were found to significantly reduce pain in VAS (WMD
   -7.41 mm, p = 0.04 and WMD -8.35 mm, p < 0.00001)". Only the *combination* was null.
   Two significant single-agent benefits sit behind one grey mark.
3. **`flossing -> caries_increment` (SEVERITY: medium, error points the other way)** —
   "No trials assessed interproximal caries". The row's own text says it is "an evidence
   gap, not a demonstrated null", yet it renders as studied-and-null, asserting the
   opposite of the truth. There is no valence value for "never measured".
4. **`alcohol -> all_cause_mortality` (SEVERITY: low)** — the null ("no significantly
   reduced risk ... for low-volume drinkers") is real, but the same row carries a
   significant harm at higher doses (RR 1.19 at 45-64 g/day, RR 1.35 at 65+ g/day). One
   grey mark is doing the work of both a null and an unfavourable finding.

Also noted, not counted as defects: `ibs_severity -> wheat_bran` is null on the endpoint
but its own text reports dropouts "because the symptoms of irritable bowel syndrome
worsened"; `depressive_symptoms -> sleep_deprivation` is "mixed and depended on the type
of sleep loss", which is closer to indeterminate than to null. The other 61 null rows were
read and are genuine non-significant or non-superiority findings (vitamin D bolus dosing,
vitamin D alone on fractures, vitamin C in general populations, HMB, BCAA, TRE, black
cohosh, ginkgo, saffron clinician-rated scales, saturated-fat reduction on BP and
triglycerides, sauna on arterial stiffness, d-aspartic acid, tribulus, and others).

---

## What was NOT checked

- Whether each `effect`/`verbatim` faithfully reproduces its source paper. Verbatim text was
  taken as given; only its internal consistency with `direction` was assessed. A row whose
  verbatim was mis-transcribed at extraction time would pass this pass unflagged.
- `effect_normalized`, `normalization_method`, `evidence_tier`, `usefulness` tiers, DOIs,
  figure links, population strings, `caveats`.
- Whether a marker should exist at all, or whether a row is attached to the right marker
  (one observation only: `low_gi_diet_pcos -> pcos_androgens` reports a *hirsutism* /
  body-hair outcome, not an androgen level).
- The renderer itself. The sign was recomputed from `assign_valence`'s logic as written; it
  was assumed the page paints `good`/`bad`/`unclear`/`none` as green/red/purple/grey.
- No file in the repo was modified by this pass.
