# Attribution verification pass - health-evidence.json

Scope: all 320 edges, 148 behaviour nodes, 64 markers, 14 goals in
`astro-blog/public/data/health-evidence.json`. Every row was read field by field
(behavior_id + node name + dose_or_intensity + marker_id + marker name/desirable +
effect + population + conditional_on + verbatim + paper title). Existing `valence`,
`direction`, `usefulness` and `cut` flags were ignored as evidence and used only as
things to check. Scripts live in the session scratchpad; no repo file was modified
other than this report.

Findings are ordered by how badly a reader would be misled.

---

## 0. Highest-severity class: sign inversions (a benefit rendered as harm)

These nine rows have `direction` AND `valence` both wrong in the same way, so every
internal consistency check passes while the explorer paints a favourable result as an
adverse mark. This is the same failure mode as the smoking/quitting row, one layer down.
All nine sit in the ginseng/NMN block, which suggests a single bad ingest pass.

| # | behaviour -> marker | stored | what the paper says |
|---|---|---|---|
| 302 | american_ginseng -> hba1c_fasting_glucose | dir `+`, valence `bad`, normalized `-0.71` | "AG significantly reduced HbA1c (-0.29%) and fasting blood glucose (-0.71 mmol/L)" |
| 303 | american_ginseng -> blood_pressure | dir `+`, `bad`, `-5.6` | "AG lowered systolic blood pressure (-5.6 +/- 2.7 mmHg; p < 0.001)" |
| 304 | american_ginseng -> resting_hr_arterial_stiffness | dir `+`, `bad`, `-5.3` | "3g of AG significantly lowered radial AI by 5.3%" |
| 305 | american_ginseng -> blood_pressure | dir `+`, `bad`, `-11.7` | "... and systolic BP by 11.7% (P<0.001)" |
| 307 | panax_genus_pooled -> hba1c_fasting_glucose | dir `+`, `bad`, `-0.31` | "Ginseng significantly reduced fasting blood glucose (MD = -0.31 mmol/L)" |
| 311 | american_ginseng -> infection_duration | dir `+`, `bad`, `-6.2` | "ginseng significantly shortened the duration of colds or ARIs by 6.2 days" |
| 313 | american_ginseng -> arti_incidence | dir `+`, `bad` | "Jackson-confirmed URIs were significantly lower in the treated groups" |
| 318 | panax_ginseng_hrg80 -> perceived_stress | dir `+`, `bad` | "HRG80 treatment was significantly superior compared to PGS and placebo regarding ... PS scores" |
| 283 | nmn_supplementation -> insulin_sensitivity_homa_ir | dir `+`, `bad` | "Insulin-stimulated glucose disposal ... increased after NMN supplementation" - sensitivity improved; on a HOMA-IR marker whose `desirable` is `-`, that is dir `-`, valence `good` |

Fix: flip `direction` to `-` and `valence` to `good` on all nine, and make
`effect_normalized` sign agree with the convention used elsewhere.

Separate and milder: five rows on `sustained_attention_rt` (marker `desirable: -`) store
dir `+` with valence `good`, contradicting the convention the same marker uses for sleep
deprivation (edge 106: dir `+`, valence `bad`). Valence is right, direction is wrong:
edges 103 (caffeine), 104 (l_theanine_caffeine), 107 (nicotine),
108 (creatine_sleep_deprivation), 317 (panax_ginseng_hrg80).

---

## A. Behaviour misattribution

Confirmed wrong - the row does not belong to the node it sits on:

- **229 `weight_loss` -> `bmd`.** Node is named and dosed as "Weight loss (bariatric
  surgery vs conventional therapy) ... in adults with type 2 diabetes". The paper is
  32 RCTs of *calorie-restriction and/or exercise* weight loss; bariatric surgery is not
  in it, and the row's own conditional_on states exercise-induced weight loss did NOT
  decrease hip BMD. Belongs on `weight_loss_fatloss` or a diet-weight-loss node.
- **230 `weight_loss` -> `oa_pain`.** Paper is a network meta-analysis of diet, exercise,
  diet+exercise and psychological weight-loss interventions in knee OA; the quoted -2.2
  points is the diet+exercise arm. Nothing bariatric. Same fix as 229. With 229 and 230
  moved, `weight_loss` holds only the bariatric-vs-conventional row it is named for.
- **246 `probiotics` -> `ibs_severity`.** The `probiotics` node is defined entirely by the
  respiratory trial set ("23 RCTs and 1 cluster-RCT ... taken prophylactically"). This row
  comes from a separate 20-study IBS meta-analysis with a different dose/strain profile.
  Either re-dose the node generically or move the row to `probiotics_psychobiotics`.
- **54 `saturated_fat_reduction` -> `ldl_cholesterol`.** The verbatim is a *composite*
  claim: "foods high in unsaturated and low in saturated and trans fatty acids ..., with
  added plant sterols/stanols, and high in soluble fiber (e.g. oats, barley, and
  psyllium) caused at least moderate ... reductions in LDL". The 0.20-0.40 mmol/L figure
  cannot be attributed to saturated-fat reduction alone, and the other two components of
  that sentence are already separate nodes (`plant_sterols`, `oat_beta_glucan`) - so the
  same effect is counted up to three times.
- **0 `resistance_training` -> `serum_testosterone`.** Paper pools aerobic, resistance and
  combined training, and the row's own conditional_on says the null holds "regardless of
  training modality". A modality-pooled result used to mark one modality - structurally
  the same error as the smoking one.
- **265 `smoking` -> `vasomotor_symptoms`.** The quoted RRs are a *joint* BMI x smoking
  contrast (obese smokers vs normal-weight never-smokers, RR 3.02). Smoking's independent
  effect is not the number shown; the comparator carries the obesity effect.
- **313 `american_ginseng` -> `arti_incidence`** (also in section 0). The positive row uses
  a looser Jackson-criteria, completers-only analysis, while edge 312 carries the same
  trial's pre-specified lab-confirmed ITT null. A secondary analysis set presented
  alongside the primary one as if both were findings.

Node-definition mismatches - right substance, but the node's `dose_or_intensity` does not
describe the study that produced the row:

- **175, 176 `sleep_duration`.** Node dose is an experimental protocol ("<5 h/night for
  1 week vs ~8-10 h/night"); both mortality rows are habitual-sleep U-curves from
  prospective cohorts. The dataset already has `short_sleep_duration` for habitual sleep.
- **114, 120 `creatine_monohydrate`.** Node dose says "combined with resistance training,
  8-104 weeks"; the cognition meta-analysis is creatine without a training
  co-intervention.
- **222 `protein_intake`** (node named "Protein intake (with resistance training)") ->
  `bmd`: the National Osteoporosis Foundation review is dietary protein intake with no
  resistance-training context.
- **160, 161 `alcohol`.** Both rows are about occasional and low-volume drinkers, which is
  exactly what the separate `alcohol_intake` ("low-to-moderate") node exists for.
- **227 `alcohol` -> `bmd`, valence `good`.** Attribution is defensible but this is an
  observational healthy-drinker association rendered as a green mark on alcohol; the
  conditional_on admits as much. Worth downgrading rather than displaying as a benefit.

---

## C. Marker misattribution (quoted statistic is for a different outcome)

- **12 `psychological_stress` -> `subjective_libido`.** beta = -0.604 is the correlation
  with **erectile function** (IIEF), not with sexual desire. The correct marker is
  `nitric_oxide_blood_flow` ("... (erectile function)"). This matters because the dataset
  elsewhere (edge 11, maca) deliberately separates desire from the vascular/hormonal axis.
- **248 `physical_activity` -> `ibs_severity`.** The quoted MD = 10.9 is the
  **constipation subscale**; the trial found no significant between-group difference for
  total symptoms, pain, diarrhoea or IBS-QoL. As filed, a null trial reads as an IBS
  benefit. Marker should be `constipation_relief` / `stool_frequency_consistency`, or the
  row should be marked null. The stored number also disagrees with its own CI
  (`10.9` with CI `-20.1 to -1.6`, normalized `-10.9`).
- **162 `alcohol` -> `cardiovascular_mortality`.** The Mendelian-randomisation RRs are for
  **incident** intracerebral haemorrhage and ischaemic stroke, ascertained from morbidity
  *and* mortality registries. Not a mortality outcome.
- **119 `blood_pressure_control` -> `global_cognition_older`.** HR 0.81 is incident
  **mild cognitive impairment**, a secondary outcome; the trial's primary probable-dementia
  outcome was non-significant. Neither is an MMSE/ADAS-cog score, which is what the marker
  names.
- **148 `loneliness_social_isolation` -> `depressive_symptoms`.** OR 2.33 is **new-onset
  diagnosed depression**, not a PHQ-9/BDI/HAM-D symptom score.
- **8 `aerobic_exercise` -> `nitric_oxide_blood_flow` ("erectile function").** The
  statistic is brachial-artery flow-mediated dilation in mixed-sex healthy adults. No
  erectile outcome was measured; the row inherits the marker's erectile label.
- **Handgrip filed as 1RM** on the marker "Maximal strength (1RM)": edges 97 (glp1,
  +4.5 kg handgrip), 88 (caloric_deficit_magnitude, handgrip), 102 (bcaa, handgrip and
  knee extension). Edge 88's conditional_on admits it. Either broaden the marker name or
  split grip strength from 1RM.
- **98 `glp1_receptor_agonists` -> `rmr`.** Outcome is REE *normalised to lean mass*,
  measured as a within-arm change from month 7 to month 12 in a single-arm cohort - not
  RMR in kcal/day and not against a comparator.
- **187, 188 `weight_loss_bariatric` -> `liver_fat_steatosis`.** "NASH resolution" is a
  composite histologic endpoint (steatosis + lobular inflammation + ballooning), not a
  steatosis measure. The row's conditional_on states this.
- **219 `smoking` -> `vaccine_antibody_response`.** The verbatim gives "weighted mean
  difference between smokers and non-smokers equal to 0.65 (95% CI 0.10-1.19)" with no
  stated direction; the row asserts dir `-` / valence `bad` on the strength of the paper's
  narrative conclusion. The number as quoted does not support the sign.

---

## B. Duplicate / overlapping behaviour nodes

### B1. Real duplicates - same behaviour split only by which paper was used

| cluster | nodes | why they are the same |
|---|---|---|
| Marine omega-3 | `omega3_supplementation`, `omega3_marine`, `omega_3` | all "marine EPA/DHA supplement" with overlapping dose ranges (1-4 g/d; <1000 to >2000 mg/d; 1-4 g/d). The split tracks which meta-analysis was cited (inflammation / metabolic syndrome / osteoarthritis), not the substance. Merge; keep dose in `conditional_on`. |
| GLP-1 | `glp1_receptor_agonists`, `glp1_ra` | identical drug and dose (semaglutide 2.4 mg/week), both `group: medical`. Split only by outcome domain (body composition vs liver). Straight duplicate. |
| Free sugar | `added_sugar`, `free_sugar_intake` | same exposure ("higher vs lower free-sugar intake" / "free sugars as % energy"); split only because one feeds cardiometabolic and liver rows and the other the caries row. |
| Mindfulness | `mindfulness_meditation`, `mindfulness_based_interventions` | both "structured mindfulness-based interventions, RCTs"; no dose or protocol distinction stated. |
| Probiotics | `probiotics`, `probiotics_psychobiotics` | same substance class; the only difference is outcome domain, and edge 246 already crosses the line. |
| Diet-induced weight loss | `fat_loss`, `weight_loss_fatloss` (+ `weight_loss_pcos`, `low_gi_diet_pcos`) | `fat_loss` = "hypocaloric diet, weeks 0-12"; `weight_loss_fatloss` = "lifestyle, dietary, exercise or surgical weight loss, per kg" - the second subsumes the first. `weight_loss_pcos` and `low_gi_diet_pcos` are `weight_loss` / `low_gi_diet` with a population restriction that belongs in the `population` field. |
| Bariatric weight loss | `weight_loss`, `weight_loss_bariatric` | both bariatric surgery; split by patient population (T2D vs NASH) and outcome, not by behaviour. |
| Chronic aerobic training | `aerobic_exercise`, `exercise_longterm`, `aerobic_exercise_chronic`, `exercise_training` | "aerobic training, varies across pooled RCTs" / "moderate-intensity >12 weeks in healthy subjects" / "multi-week aerobic in adults >=55" / "randomised exercise training in NAFLD". No non-overlapping dose definition; the distinctions are population and indication. |
| Unstratified ginseng buckets | `panax_genus_pooled`, `ginseng_species_unspecified` | both mean "species not resolvable from the source"; the only difference is whether the abstract used the word "Panax". One bucket would do. |
| Calcium | `calcium_supplementation`, `calcium_pms` | same supplement; PMS is a population and outcome, not a formulation. |
| Habitual short sleep | `sleep_duration`, `short_sleep_duration` | once the dose-text problem above is fixed, these are the same exposure (habitual sleep under 7 h). |

### B2. Look alike, genuinely distinct - keep separate

- `curcumin_plain` vs `curcumin_piperine` - bioavailability formulation; effect sizes and
  significance genuinely differ (edges 17-19).
- `omega3_marine` vs `omega3_ala` - marine EPA/DHA vs plant ALA; ALA raises LDL while
  lowering triglycerides (edges 56, 59), the opposite pattern to marine.
- `omega3_epa` vs `omega3_dha` - the EPA/DHA split is the entire finding of edges 136-137.
- `korean_red_ginseng` vs `american_ginseng` vs `panax_ginseng_hrg80` vs
  `eleutherococcus_senticosus` - two Panax species, one cultivation/processing variant of
  P. ginseng, and a different genus entirely. All load-bearing.
- `smoking` vs `smoking_cessation` vs `nicotine` - chronic exposure, cessation, and acute
  nicotine pharmacology; the corrected mortality row depends on this separation.
- `alcohol` vs `b_alcohol` vs `alcohol_reduction` vs `alcohol_use_disorder` - habitual
  exposure, acute pre-bed dose-response, reduction as an intervention, clinical diagnosis.
  (`alcohol_intake` is the one that genuinely overlaps `alcohol`; see B1.)
- `creatine_monohydrate` vs `creatine_sleep_deprivation` - chronic 3-5 g/day with training
  vs a single 0.2-0.35 g/kg dose under 21 h sleep deprivation.
- `coffee` vs `coffee_unfiltered` - diterpene filtration is the whole LDL story (edge 57).
- `sleep_deprivation` (3+ nights at ~4.3 h) vs `sleep_restriction` (single night, 4 h) vs
  `sleep_restriction_during_diet` - protocol differences the sources themselves turn on
  (edge 21: a single night showed no inflammatory effect).
- `psyllium` vs `wheat_bran` vs `oat_beta_glucan` vs `fibre_general` - soluble vs insoluble
  vs pooled; edges 240/241 are a head-to-head within one trial.
- `vitamin_d_alone` vs `vitamin_d_calcium_combined` - the alone-vs-with-calcium contrast is
  the finding (edges 224/225).
- `b_cbti` vs `cbt` - insomnia-specific manualised protocol vs general CBT.
- `hiit` vs `aerobic_exercise` - compared head-to-head in the same paper (edges 69/70).
- `acute_aerobic_exercise` vs the chronic aerobic nodes - single bout vs programme.
- `moderate_exercise` vs `heavy_exercise_load` - the two arms of the J-curve.

---

## D. Grouping

### D1. Nodes in a group that misdescribes them

- **Eight nodes sit in `group: mind` that have nothing to do with mind.** Of the 14 "mind"
  nodes, seven are oral hygiene - `fluoride_toothpaste`, `toothbrushing_frequency`,
  `powered_toothbrushing`, `flossing`, `interdental_brushes`, `chlorhexidine_mouthwash`,
  `professional_scaling` - plus `hand_hygiene`. That covers edges 218, 268-277, 279, 282.
  A reader filtering on "mind" gets toothpaste.
- **`diabetes_status` is `group: mind`** and is not a behaviour at all - it is a disease
  state used as an exposure (edge 281). Should be `medical`, or moved out of the behaviour
  layer entirely.
- **`glp1_receptor_agonists.dose_or_intensity` claims** it is "categorized as 'supplement'
  only because the schema has no drug category" - but its `group` is already `medical`.
  Stale text contradicting the data.
- **`panax_ginseng_hrg80.family` is `"omega3"`.** Copy-paste bug; should be a ginseng or
  botanical family, or null like its sibling ginseng nodes.
- **`cbt_vasomotor` is `mind` while `cbt`, `cognitive_behavioral_therapy` and `b_cbti` are
  `medical`** - the same intervention class in two groups.
- **State/trait nodes inside behaviour groups**: `cardiorespiratory_fitness`, `obesity_bmi`,
  `sedentary_time`, `short_sleep_duration` are measured states, not actions.
  `cardiorespiratory_fitness` (group `exercise`) is the clearest case - its row (159)
  explicitly says fitness reflects "genetics, training status, and current activity", not
  an exercise prescription.
- **Two prescription drugs sit in `supplement`**: `metformin_pcos`, `nsaids_dysmenorrhea`.

### D2. Proposed sub-division of `supplement` (54 nodes)

Rationale: a reader in the supplement aisle needs to know first whether a thing is a
nutrient they might be deficient in, a plant extract, a sports compound, or a drug.

| proposed group | n | nodes |
|---|---|---|
| `micronutrient` (vitamins, minerals, multis) | 13 | zinc, zinc_acetate_lozenges, vitamin_d, vitamin_d_alone, vitamin_d_calcium_combined, vitamin_d_pcos, calcium_supplementation, calcium_pms, vitamin_e, vitamin_c_supplementation, vitamin_b6_pms, b_magnesium, multivitamin_older_adults |
| `fatty_acid` | 6 | omega3_supplementation, omega3_marine, omega3_ala, omega3_epa, omega3_dha, omega_3 |
| `amino_acid_and_metabolite` (ergogenic / structural) | 11 | l_arginine, l_citrulline, d_aspartic_acid, hmb, bcaa, creatine_monohydrate, creatine_sleep_deprivation, l_theanine_caffeine, myo_inositol_pcos, collagen_peptides, glucosamine_chondroitin |
| `botanical` | 17 | maca, tribulus_terrestris, curcumin_plain, curcumin_piperine, ginkgo_biloba, st_johns_wort, saffron, elderberry_supplementation, peppermint_oil, black_cohosh, soy_isoflavones, korean_red_ginseng, american_ginseng, panax_genus_pooled, ginseng_species_unspecified, panax_ginseng_hrg80, eleutherococcus_senticosus |
| `live_biotic` | 2 | probiotics, probiotics_psychobiotics |
| `hormone_and_cofactor` | 3 | b_exogenous_melatonin (a hormone), nmn_supplementation, coq10_supplementation |
| `drug` (move out of supplement) | 2 | metformin_pcos, nsaids_dysmenorrhea |

Totals to 54. If `drug` is created, `glp1_receptor_agonists`, `glp1_ra` and
`blood_pressure_control` (currently `medical`) belong there too, leaving `medical` for
procedures and therapies (bariatric surgery, CBT, light therapy, brain training).

Secondary proposal: add a `hygiene` group for the eight oral- and hand-hygiene nodes now
in `mind`, leaving `mind` as psychological_stress, the two mindfulness nodes, loneliness,
and cbt_vasomotor.

---

## What was NOT checked

- **No source papers were opened.** Every judgement above is internal: node name and dose
  versus the row's own `effect`, `population`, `conditional_on` and `verbatim`. Where a
  row's verbatim is faithful to the abstract but the paper says something else, this pass
  cannot see it.
- **No arithmetic re-derivation** of `effect_normalized` beyond sign agreement; the
  normalization method per row was not validated.
- **DOIs, figure URLs, `n_value`, `evidence_tier` / `evidence_tag`, `usefulness` scores and
  the `cut` array** were not audited.
- **Goal assignment** (`marker.goal_ids`) was read but not systematically challenged.
- **Cross-edge duplicate findings** (the same paper result entered twice under different
  nodes) were caught by eye during the read, not by exhaustive DOI clustering; the
  plant-sterol / soluble-fibre / saturated-fat triple-count at edge 54 was found that way
  and others may exist.
- Nothing in the repository was modified.
