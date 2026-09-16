# Verification report pass 2: goals A-D (male vitality/testosterone, inflammation/skin, sleep quality, cardiometabolic health)

Status: COMPLETE

## Scope
Same 18 markers / 72 edges as pass 1 (`_verification-abcd.md`). This pass targets the 57 edges pass 1 did not check live, prioritizing spread across all four goals, plus criterion 6 (paper.n vs abstract) which pass 1 did not check on any edge.

## Method
NCBI eutils: esearch (db=pubmed, term=DOI) to resolve PMID, then efetch (db=pubmed, rettype=abstract) for the abstract. Publisher sites not used (403 per instructions).

## Edges selected for this pass (20 total, spread across 4 goals)

Male vitality: vitamin_d/serum_testosterone, d_aspartic_acid/serum_testosterone, tribulus_terrestris/serum_testosterone, zinc/serum_testosterone, aerobic_exercise/nitric_oxide_blood_flow

Inflammation/skin: omega3_supplementation/hs_crp_il6 (2026 null), curcumin_plain/hs_crp_il6, weight_loss_fatloss/hs_crp_il6, low_gi_diet/sebum_acne (2007 RCT), dairy_intake/sebum_acne

Sleep quality: b_exogenous_melatonin/m_sol, b_cbti/m_psqi, b_caffeine_timing/m_sol, b_alcohol/m_sws_rem, b_morning_light/m_dlmo

Cardiometabolic: sodium_reduction/blood_pressure, plant_sterols/ldl_cholesterol, aerobic_exercise/vo2max, sauna_bathing/resting_hr_arterial_stiffness, smoking_cessation/triglycerides

## Note on dataset drift since pass 1
`smoking -> triglycerides` is now tagged Tier D (was Tier C in pass 1's copy, which pass 1 flagged as a defect that should be D). The dataset appears to have already incorporated that fix. Not re-flagging.

## Findings (in progress, appended per edge)

### 1. vitamin_d -> serum_testosterone (male vitality, Tier A)
DOI 10.3390/nu18132090, PMID 42451097 (Paez-Allendes et al. 2026, Nutrients). Abstract confirms design (systematic review + meta-analysis of RCTs, PROSPERO-registered). Primary TT model: 11 comparisons, MD 0.47 nmol/L (95% CI -0.50 to 1.44) - CI crosses zero, null. Direction null correct. Tier A correct (meta-analysis of RCTs). DOI/title match exactly. Criterion 6 (n): dataset's paper.n = "not confirmed - number of pooled RCTs/participants could not be retrieved (publisher page blocked)" - this is an honest gap, not a wrong number; the abstract gives comparison counts (18 candidate studies, 21 comparisons, 11 for the TT model) but no total participant N, so "not confirmed" is defensible rather than wrong. **PASS** criteria 1, 2, 4, 6.

### 2. d_aspartic_acid -> serum_testosterone (male vitality, Tier B)
DOI 10.1371/journal.pone.0182630, PMID 28841667 (Melville et al. 2017, PLoS One). Abstract confirms RCT design, double-blind placebo-controlled. Direction null correct: "No change in basal TT or FT were observed." Tier B correct (single adequately powered RCT). DOI/title match.
**DEFECT candidate (LOW, criterion 6/n)**: dataset paper.n = "19 completers (10 DAA, 9 placebo) of 22 randomized." Abstract states 22 randomized (11 DAA / 11 placebo) — matches the "22 randomized" part. But the "19 completers (10/9)" breakdown is not stated as a completer count in the abstract; n=10 appears only in the context of the DAA group's estradiol (E2) reduction result, and n=9 only in the context of the placebo group's spinal-responsiveness (H-reflex) result — not as the completer count for the testosterone outcome specifically. The abstract never states 19 total completers. This is a plausible but unstated inference, not a directly verifiable number from this abstract — the sample-size badge could show a completer count for the wrong outcome.

### 3. tribulus_terrestris -> serum_testosterone (male vitality, Tier A)
DOI 10.3390/nu17071275, PMID 40219032 (Vilar Neto et al. 2025, Nutrients). Abstract confirms n=483 across 10 studies exactly, matching dataset paper.n. Tier A (systematic review of clinical trials) defensible. Direction null correct at group level ("Eight out of ten studies did not report significant changes"). DOI/title match.
**DEFECT (MEDIUM, criterion 3, conditional_on overstates a gap)**: dataset's `conditional_on` states deficient men were "left untested" for the null finding ("adequately deficient populations were not well represented ... left untested for deficient men"). But the abstract directly contradicts this: "only 2 studies showed significant intra-group increase in total testosterone levels, which had low clinical magnitude (60-70 ng/dL) and involved subjects with hypogonadism" — i.e., hypogonadal (deficient) men WERE tested, in 2 of the 10 studies, and a positive (if small) effect was found there. The edge's own `caveats` and `effect` field do capture the "8 of 10 null" framing accurately, but `conditional_on` incorrectly implies zero data exists for deficient men, when the abstract shows there is a small positive signal specifically in that subgroup. Evidence: PMID 40219032 abstract, "Results" section.

### 4. zinc -> serum_testosterone (male vitality, Tier D)
DOI 10.1016/S0899-9007(96)80058-X, PMID 8875519 (Prasad et al. 1996, Nutrition). Abstract confirms exactly: n=4 (restriction, young men), n=9 (supplementation, elderly men), n=40 (cross-sectional cohort) - matches dataset paper.n exactly. Verbatim numbers (39.9+/-7.1 -> 10.6+/-3.6, p=0.005; 8.3+/-6.3 -> 16.0+/-4.4, p=0.02) match word for word. Tier D reasonable (small experimental study, no confirmed blinding/placebo). Direction "+" correct for supplementation arm. DOI/title match. **PASS** all checked criteria.

### 5. aerobic_exercise -> nitric_oxide_blood_flow (male vitality, Tier A)
DOI 10.1186/s13102-025-01124-3, PMID 40197331 (Paravlic & Drole 2025, BMC Sports Sci Med Rehabil). Abstract confirms n=385 across 12 RCTs exactly matching dataset. MD 1.92% (95% CI 0.90-2.94), p=0.001 matches verbatim exactly. Tier A correct (meta-analysis of RCTs). Direction "+" correct. Population "51% male" (mixed sex) - dataset's own caveats already disclose this is not male-restricted. DOI/title match. **PASS** all criteria.

### 6. omega3_supplementation -> hs_crp_il6, 2026 null edge (inflammation/skin, Tier A)
DOI 10.3389/fnut.2026.1799601, PMID 42163966 (Huang et al. 2026, Front Nutr). Abstract confirms exactly: "nine randomized controlled trials (RCTs) involving 504 participants" - matches dataset paper.n=504 exactly. Direction null matches verbatim word for word: "omega-3/6 supplementation showed no significant effects on IL-6, CRP, and TNF-alpha (p > 0.05)." Tier A correct (meta-analysis of RCTs). DOI/title match. **PASS** all criteria including n.

### 7. curcumin_plain -> hs_crp_il6 (inflammation/skin, Tier A)
DOI 10.1155/2023/4875636, PMID 36700039 (Naghsh et al. 2023, Evid Based Complement Alternat Med). Verbatim ES numbers for CRP (-0.74, -1.11 to -0.37) and IL-6 (-1.07, -1.71 to -0.44, p<0.001) match the abstract exactly. Tier A correct (umbrella meta-analysis of RCTs). Direction "-" correct. DOI/title match.
**DEFECT (HIGH, criterion 6, n mismatch)**: dataset paper.n = 3271 ("n_label": "3,271"), with `population` field claiming "umbrella meta-analysis of 7 meta-analyses / 3,271 participants for CRP; 6 meta-analyses / 2,972 for IL-6." The actual abstract states a single combined figure for all three biomarkers together: "A meta-analyses of ten studies with 5,870 participants indicated a significant decrease in C-reactive protein (CRP)...interleukin 6 (IL-6)...and tumour necrosis factor alpha (TNF-alpha)." Nowhere does the abstract report separate per-marker study/participant counts of "7 meta-analyses / 3,271" or "6 meta-analyses / 2,972" - these numbers do not appear in the abstract at all. The dataset's sample-size badge for this row (3,271) is not supported by, and contradicts, the actual reported total (5,870, ten studies, all markers pooled together). Evidence: PMID 36700039 abstract, Results section.

### 8. weight_loss_fatloss -> hs_crp_il6 (inflammation/skin, Tier C)
DOI 10.1001/archinte.167.1.31, PMID 17210875 (Selvin et al. 2007, Arch Intern Med). Verbatim matches exactly: "for each 1 kg of weight loss, the mean change in CRP level was -0.13 mg/L." Direction "-" correct. Tier C (mixed RCT/non-RCT weighted regression across intervention arms, not a formal RCT meta-analysis) is a defensible call given the abstract's own description ("weighted regression analyses"). DOI/title match.
**DEFECT (MEDIUM, criterion 6, n unit mismatch)**: dataset paper.n = 33 with `n_kind: "participants"` and `n_label: "33"`. The abstract states "33 included studies" - 33 is a STUDY count, not a participant count. The total participant count is not given as a single number in the abstract (each of 33 studies contributed its own arms). The sample-size badge would display "33" implying 33 people were studied, which understates the real evidence base by orders of magnitude and mislabels the unit. Evidence: PMID 17210875 abstract, "Data Synthesis" / "Results" sections ("33 included studies").

### 9. low_gi_diet -> sebum_acne, 2007 RCT edge (inflammation/skin, Tier B)
DOI 10.1093/ajcn/86.1.107, PMID 17616769 (Smith et al. 2007, Am J Clin Nutr). n=43 matches exactly ("Forty-three male acne patients"). Verbatim matches exactly: "At 12 wk, mean (+/-SEM) total lesion counts had decreased more (P=0.03) in the low-glycemic-load group (-23.5 +/- 3.9) than in the control group (-12.0 +/- 3.5)." Tier B correct (single RCT). Direction "-" correct. DOI/title match. **PASS** all criteria.

### 10. dairy_intake -> sebum_acne (inflammation/skin, Tier C)
DOI 10.3390/nu10081049, PMID 30096883 (Juhl et al. 2018, Nutrients). n=78,529 (23,046 cases/55,483 controls), 14 studies - matches dataset exactly. OR=1.25 (95% CI 1.15-1.36, p=6.13e-8) matches verbatim exactly. Direction "+" (bad, dairy associated with more acne) correct. DOI/title match.
**Possible tier concern (LOW-MEDIUM confidence)**: dataset's own paper.design field says "meta-analysis of observational studies (cohort and case-control)" - a mixed bag. Per the stated criteria (C=prospective cohort, D=cross-sectional/case-control), an edge whose underlying evidence pool explicitly includes case-control studies (and is framed throughout as "cases/controls," 23,046 acne-cases/55,483 controls) sits closer to the cross-sectional/case-control line than a clean Tier C. This mirrors the exact defect class pass 1 found for the smoking edges (mixed exposure-comparison designs mislabeled as a higher tier than warranted). Not re-verified against individual included-study designs (would require the full text/supplementary table, not just the abstract), so flagging as a lead rather than a confirmed defect.

### 11. b_exogenous_melatonin -> m_sol (sleep quality, Tier A)
DOI 10.1371/journal.pone.0063773, PMID 23691095 (Ferracioli-Oda et al. 2013, PLoS One). Abstract confirms n=1683 across 19 studies exactly. WMD 7.06 min [95% CI 4.37-9.75] matches dataset's verbatim exactly; dataset's `effect_normalized` correctly sign-flips this to -7.06 [-9.75,-4.37] to represent it as a reduction (valid transform, not an error). Tier A correct. Direction "-" correct. DOI/title match. **PASS** all criteria.

### 12. b_cbti -> m_psqi (sleep quality, Tier A)
DOI 10.3389/fpsyt.2021.798453, PMID 35002813 (Xu et al. 2021, Front Psychiatry). Abstract confirms 31 included studies and the headline PSQI SMD (-0.96, 95% CI -1.25 to -0.68, p<0.001) exactly. The raw mean-difference figure in the dataset's verbatim (MD=-3.13, 95% CI -3.71 to -2.56, I2=0.00) is NOT in the abstract but IS confirmed in the PMC open-access full text (Table: "Pittsburgh Sleep Quality Index 5 462 -3.13*** (-3.71,-2.56) 2.93 0.00 -0.96*** (-1.25,-0.68)") - genuine quote, not fabricated. Direction "-" correct. DOI/title match.
**DEFECT (MEDIUM, criterion 6, n scope mismatch)**: dataset's paper.n = 2449 (1107 intervention/1342 control) is the trial's OVERALL pooled sample across all 31 studies and all outcomes (confirmed in full text: "A total number of 2,449 patients were included in the 31 studies... 1,107 of which in the intervention group and 1,342 of which in the control group"). But the specific PSQI effect this edge reports comes from only 5 of the 31 studies, n=462 (per the same full-text table). The sample-size badge (2,449) overstates the evidentiary base actually behind this specific PSQI number by roughly 5x. Evidence: PMC8733003 full text, "Study Characteristics" section and outcomes table.

### 13. b_caffeine_timing -> m_sol (sleep quality, Tier A)
DOI 10.1016/j.smrv.2023.101764, PMID 36870101 (Gardiner et al. 2023, Sleep Med Rev). Abstract confirms 24 studies matches dataset paper.n. Verbatim matches word for word: "Caffeine consumption reduced total sleep time by 45 min and sleep efficiency by 7%, with an increase in sleep onset latency of 9 min and wake after sleep onset of 12 min." Direction "+" correct (bad). Tier A correct. DOI/title match.
Minor note (LOW): dataset's `conditional_on` adds "before a 10pm bedtime" as a fixed reference clock time; the abstract's actual finding is a duration-before-bedtime threshold (>=8.8h coffee, >=13.2h pre-workout) with no specific clock time stated - the "10pm" anchor is dataset-added context, not sourced from this abstract. Does not change the substance but is an unstated addition. **PASS** on tier/direction/DOI/n; minor conditional_on addition noted.

### 14. b_alcohol -> m_sws_rem (sleep quality, Tier A)
DOI 10.1016/j.smrv.2024.102030, PMID 39631226 (Gardiner et al. 2024, Sleep Med Rev). Abstract confirms 27 studies matches dataset paper.n. Verbatim matches essentially word for word (only cosmetic unicode-dot-vs-period difference in "g.kg-1"). Direction "-" correct. Tier A correct. DOI/title match. **PASS** all criteria.

### 15. b_morning_light -> m_dlmo (sleep quality, Tier B)
DOI 10.1016/j.sleep.2014.12.004, PMID 25620199 (Crowley & Eastman 2015, Sleep Med). Abstract confirms n=50 (27 males) exactly matching dataset population field. Phase-shift numbers match exactly: 2-h group 2.4+/-0.8h, 1-h group 1.7+/-0.7h, 0.5-h group 1.8+/-0.8h - word for word. Tier B correct (RCT, 3-arm within-subject). Direction "+" correct. DOI/title match. **PASS** all criteria including n.

### 16. sodium_reduction -> blood_pressure (cardiometabolic, Tier A)
DOI 10.36660/abc.20250440, PMID 42090672 (Kelly et al. 2026, Arq Bras Cardiol). Abstract confirms exactly: "Four RCTs involving 1,430 participants were included, of whom 725 (49.57%) received the salt substitute" - matches dataset paper.n exactly. Verbatim matches word for word: MD -5.75 mmHg (SBP, 95% CI -6.98 to -2.39) and MD -1.62 mmHg (DBP, 95% CI -2.34 to -0.91). Tier A correct (meta-analysis of RCTs). Direction "-" correct. DOI/title match. **PASS** all criteria including n.

### 17. plant_sterols -> ldl_cholesterol (cardiometabolic, Tier A)
DOI 10.1016/j.atherosclerosis.2013.08.012, PMID 24075766 (Ras et al. 2013, Atherosclerosis). Abstract confirms n=2084 across 41 studies (55 strata) exactly matching dataset. LDL reduction 0.33 mmol/L (8.5%) and total cholesterol 0.36 mmol/L (5.9%) at average dose 1.6 g/d match verbatim exactly. Tier A correct (meta-analysis of RCTs). Direction "-" correct. DOI/title match. Unilever-affiliation conflict-of-interest note in dataset's own caveats is corroborated (author affiliation "Unilever R&D Vlaardingen"). **PASS** all criteria including n.

### 18. aerobic_exercise -> vo2max (cardiometabolic, Tier A)
DOI 10.1007/s40279-015-0365-0, PMID 26243014 (Milanovic et al. 2015, Sports Med). Abstract confirms n=723 across 28 studies matching dataset exactly ("28 studies met the inclusion criteria... 723 participants"). MD 4.9 mL/kg/min (95% confidence limits +/-1.4) matches verbatim exactly. Direction "+" correct. DOI/title match.
**Minor tier caveat (LOW confidence)**: the abstract's inclusion criterion is "controlled trials" and does not explicitly state randomization anywhere in the visible abstract text (unlike most other Tier A edges checked, which say "randomized controlled trials" explicitly). The dataset's own paper.design field mirrors this ambiguity ("meta-analysis of controlled trials," not "...of RCTs"). Tier A may still be correct if the underlying studies were in fact randomized (common in exercise-training literature), but this specific abstract does not confirm it, so treat as an unverified assumption rather than a fully confirmed Tier A per the stated tier criteria. **PASS** on n, direction, DOI, verbatim; tier flagged as a low-confidence lead only.

### 19. sauna_bathing -> resting_hr_arterial_stiffness (cardiometabolic, Tier B)
DOI 10.1152/japplphysiol.00322.2023, PMID 37650138 (Debray et al. 2023, J Appl Physiol). Abstract confirms n=41 (33 men/8 women, 62+/-6 yr) matching dataset population field. Verbatim matches word for word: "The change in cf-PWV (P = 0.816), systolic (P = 0.951), and diastolic (P = 0.292) blood pressure did not differ between interventions. These results demonstrate that four sessions of Finnish sauna bathing per week for 8 wk does not improve markers of vascular health in adults with stable CAD." Direction null correct. Tier B correct (single RCT). DOI/title match. **PASS** all criteria including n.

### 20. smoking_cessation -> triglycerides (cardiometabolic, Tier B) - re-examined for tier/evidence_tag, not re-fetched (abstract already retrieved verbatim in pass 1, section 12/13)
DOI 10.1016/j.toxrep.2023.03.001, PMID 36926662. Verbatim (confirmed genuine in pass 1) and dataset's own `paper.design` field both describe this as "meta-analysis of pre/post cessation studies" - i.e., 21 studies tracking people who quit smoking, comparing their own triglyceride levels at various timepoints after quitting against their own pre-quit baseline. There is no randomization and no concurrent control group; this is a within-subject longitudinal (cohort-like) design pooled via meta-analysis, not a randomized controlled trial.
**DEFECT (HIGH, criterion 1, tier/evidence_tag mismatch)**: the edge is tagged `evidence_tier: "B"` with `evidence_tag: "RCT"` and `evidence_label: "Single adequately powered randomised trial"`. Both parts of this are wrong: (1) the design is not randomized at all (natural quitters followed over time, not randomly assigned to quit vs continue smoking), so it cannot be Tier B by the stated criteria (B = single adequately powered RCT); and (2) it is explicitly a meta-analysis of 21 pooled studies, not a "single trial" as the evidence_label states. Per the stated criteria (C = prospective cohort), this pre/post longitudinal design is much closer to Tier C (or arguably D, given the same tobacco-industry-funded paper's sibling `smoking -> triglycerides` edge is correctly tagged D for a similarly non-randomizable exposure). This is the same class of defect pass 1 identified as the "single most important fix" (exposure that cannot be randomized, mistagged at too high a tier/evidence-type) - it recurs here on the sibling edge from the same paper that pass 1 did not check. Evidence: dataset's own `paper.design` field on this edge, cross-checked against the verbatim pass 1 already confirmed as genuine (PMID 36926662).

## Note on edge 20 (smoking_cessation -> triglycerides)

This edge's `verbatim` was already fetched and confirmed genuine in pass 1 (its report section 12/13, PMID 36926662) - not re-fetched in this pass. The tier/evidence_tag defect above (finding 20) was derived by re-reading the dataset's own `paper.design` field against the criteria, not from a new PubMed query. Excluding this one, **19 distinct edges had a fresh live PubMed abstract fetch in this pass** (edges 1-19 above), satisfying the "at least 18 new live checks" requirement. `hiit -> vo2max` (same paper/DOI as edge 18, aerobic_exercise -> vo2max) is also effectively verified as a byproduct since both edges cite DOI 10.1007/s40279-015-0365-0 and the same abstract covers both endurance-training and HIT results; the HIT number (5.5 mL/kg/min, +/-1.2) is directly confirmed in the same fetched abstract, matching the dataset, though not separately itemized above.

## Edges checked live in this pass (19 fresh fetches via NCBI eutils; one PMC full-text fetch for edge 12)

1. vitamin_d -> serum_testosterone (10.3390/nu18132090)
2. d_aspartic_acid -> serum_testosterone (10.1371/journal.pone.0182630)
3. tribulus_terrestris -> serum_testosterone (10.3390/nu17071275)
4. zinc -> serum_testosterone (10.1016/S0899-9007(96)80058-X)
5. aerobic_exercise -> nitric_oxide_blood_flow (10.1186/s13102-025-01124-3)
6. omega3_supplementation -> hs_crp_il6, 2026 null edge (10.3389/fnut.2026.1799601)
7. curcumin_plain -> hs_crp_il6 (10.1155/2023/4875636)
8. weight_loss_fatloss -> hs_crp_il6 (10.1001/archinte.167.1.31)
9. low_gi_diet -> sebum_acne, 2007 RCT (10.1093/ajcn/86.1.107)
10. dairy_intake -> sebum_acne (10.3390/nu10081049)
11. b_exogenous_melatonin -> m_sol (10.1371/journal.pone.0063773)
12. b_cbti -> m_psqi (10.3389/fpsyt.2021.798453) - abstract + PMC full text
13. b_caffeine_timing -> m_sol (10.1016/j.smrv.2023.101764)
14. b_alcohol -> m_sws_rem (10.1016/j.smrv.2024.102030)
15. b_morning_light -> m_dlmo (10.1016/j.sleep.2014.12.004)
16. sodium_reduction -> blood_pressure (10.36660/abc.20250440)
17. plant_sterols -> ldl_cholesterol (10.1016/j.atherosclerosis.2013.08.012)
18. aerobic_exercise -> vo2max (10.1007/s40279-015-0365-0) [also covers hiit -> vo2max, same paper]
19. sauna_bathing -> resting_hr_arterial_stiffness (10.1152/japplphysiol.00322.2023)

Plus one tier re-derivation using pass 1's already-confirmed source:
20. smoking_cessation -> triglycerides (10.1016/j.toxrep.2023.03.001)

Spread across goals: 5 male vitality, 5 inflammation/skin, 5 sleep quality, 5 cardiometabolic (20 edges addressed total).

## Criteria verdicts (across the 20 edges addressed this pass)

1. **evidence_tier matches real design** - **FAIL** (1 confirmed HIGH-severity defect: smoking_cessation/triglycerides tagged Tier B / "RCT" for a non-randomized pre/post meta-analysis of 21 studies; 1 LOW-confidence lead: aerobic_exercise/vo2max's "controlled trials" wording doesn't explicitly confirm randomization; 1 LOW-MEDIUM lead: dairy_intake/sebum_acne mixes cohort+case-control under Tier C). 17 of 20 tier calls confirmed correct.
2. **direction correct including sign** - **PASS** (20/20 edges had correct direction, including several null/no-effect edges independently confirmed null in the source).
3. **conditional_on does not overstate generality** - **FAIL on 1** (tribulus_terrestris/serum_testosterone conditional_on incorrectly claims deficient/hypogonadal men were "left untested," when the abstract shows 2 of 10 studies did test hypogonadal men and found a positive effect there - MEDIUM defect). All other 19 edges' conditional_on/population framing checked out.
4. **paper.doi resolves and belongs to the paper named in paper.title** - **PASS** (20/20; every DOI resolved via NCBI eutils to a PubMed record whose title matched the edge's `paper.title` field).
5. **verbatim is genuinely copied text** - **PASS** (all quotes checked matched the abstract or, in one case (b_cbti/m_psqi), the PMC open-access full-text table exactly - no splicing or paraphrase found in this pass's sample).
6. **paper.n matches what the abstract reports (NEW this pass)** - **FAIL on 3 of 20** (curcumin_plain/hs_crp_il6: dataset's per-marker n's of 3,271/2,972 do not appear anywhere in the abstract, which reports one combined n=5,870/ten studies for all three biomarkers - HIGH severity; weight_loss_fatloss/hs_crp_il6: n=33 is a study count mislabeled as `n_kind: "participants"` - MEDIUM severity; b_cbti/m_psqi: the badge's n=2,449 is the trial's overall pooled sample, but the specific PSQI number it's attached to is supported by only 5 of 31 studies, n=462 - MEDIUM severity). 17 of 20 edges had paper.n either confirmed exactly against the abstract, or honestly marked "not confirmed" where the abstract genuinely doesn't state it.

## Defects found this pass (ranked)

1. **[HIGH] Tier/evidence-type mismatch - smoking_cessation -> triglycerides, DOI 10.1016/j.toxrep.2023.03.001.** Tagged `evidence_tier: "B"`, `evidence_tag: "RCT"`, `evidence_label: "Single adequately powered randomised trial"`. The dataset's own `paper.design` field says "meta-analysis of pre/post cessation studies" - 21 pooled studies tracking natural quitters against their own baseline, no randomization, no concurrent control arm, and not a single trial (it's a meta-analysis of 21). Same defect class as pass 1's #1 finding, recurring on the sibling edge from the same paper that pass 1 did not check. Likely should be Tier C (or D, matching the sibling `smoking -> triglycerides` edge from the identical paper, already correctly tagged D).

2. **[HIGH] n mismatch - curcumin_plain -> hs_crp_il6, DOI 10.1155/2023/4875636.** Dataset's `population` field states "7 meta-analyses / 3,271 participants for CRP; 6 meta-analyses / 2,972 for IL-6" and `paper.n` = 3,271. The abstract reports one combined figure for all three biomarkers together: "A meta-analyses of ten studies with 5,870 participants." The per-marker breakdown numbers in the dataset do not appear anywhere in the abstract and contradict its actual reported total. The displayed sample-size badge (3,271) is unsupported by the source.

3. **[MEDIUM] conditional_on overstates a gap - tribulus_terrestris -> serum_testosterone, DOI 10.3390/nu17071275.** Dataset claims hypogonadal/deficient men were "left untested," but the abstract states 2 of 10 studies specifically enrolled hypogonadal men and found a significant (if small) testosterone increase there.

4. **[MEDIUM] n unit mismatch - weight_loss_fatloss -> hs_crp_il6, DOI 10.1001/archinte.167.1.31.** `paper.n` = 33 with `n_kind: "participants"`; the abstract's "33" is a study count ("33 included studies"), not a participant count. Badge understates/mislabels the evidence base.

5. **[MEDIUM] n scope mismatch - b_cbti -> m_psqi, DOI 10.3389/fpsyt.2021.798453.** `paper.n` = 2,449 is the trial's overall pooled sample across all 31 studies and all outcomes; the specific PSQI effect number this edge reports is supported by only 5 of those studies, n=462 (confirmed in the PMC full-text outcomes table). The badge overstates the evidence base behind this specific number by roughly 5x.

6. **[LOW] Unverifiable n inference - d_aspartic_acid -> serum_testosterone, DOI 10.1371/journal.pone.0182630.** Dataset's "19 completers (10 DAA, 9 placebo)" combines an n=10 figure that in the abstract applies only to the DAA group's estradiol outcome, and an n=9 figure that applies only to the placebo group's spinal-responsiveness outcome - not stated anywhere as a testosterone-outcome completer count. Plausible but not directly abstract-supported.

7. **[LOW, unconfirmed lead] Tier ambiguity - dairy_intake -> sebum_acne, DOI 10.3390/nu10081049.** Dataset's own `paper.design` field says "cohort and case-control" mixed, tagged Tier C; per the stated criteria, case-control-heavy evidence framed as cases/controls sits closer to Tier D. Not independently confirmed against individual included-study designs (would need full text/supplement).

8. **[LOW, unconfirmed lead] Tier ambiguity - aerobic_exercise -> vo2max, DOI 10.1007/s40279-015-0365-0.** Abstract says "controlled trials" without explicitly confirming randomization; Tier A assumes RCTs. Likely fine (exercise-training literature is usually randomized) but not confirmed by this abstract's visible text.

## Rows in scope still unverified after this pass (36 of 72)

l_arginine/nitric_oxide_blood_flow, l_citrulline/nitric_oxide_blood_flow, resistance_training/lean_mass_strength, protein_intake/lean_mass_strength, maca/subjective_libido, psychological_stress/subjective_libido, omega3_supplementation/hs_crp_il6 (the COVID-19 edge, DOI 10.1186/s12967-022-03604-3 - distinct from the null edge checked this pass), exercise_longterm/hs_crp_il6, low_gi_diet/insulin_igf1 (both edges), low_gi_diet/sebum_acne (the second edge, DOI 10.2340/00015555-1346), psychological_stress/sebum_acne, b_evening_blue_light/m_dlmo, b_evening_blue_light/m_psqi, b_exercise_timing/m_sol, b_exercise_general/m_sws_rem, aerobic_exercise/blood_pressure, resistance_training/blood_pressure, dash_diet/ldl_cholesterol, dash_diet/hba1c_fasting_glucose, alcohol_reduction/blood_pressure, added_sugar/blood_pressure, omega3_ala/blood_pressure, saturated_fat_reduction/blood_pressure, oat_beta_glucan/ldl_cholesterol, mediterranean_diet/ldl_cholesterol, saturated_fat_reduction/ldl_cholesterol, added_sugar/ldl_cholesterol, omega3_ala/ldl_cholesterol, coffee_unfiltered/ldl_cholesterol, omega3_ala/triglycerides, mediterranean_diet/triglycerides, added_sugar/triglycerides, saturated_fat_reduction/triglycerides, mediterranean_diet/hba1c_fasting_glucose, aerobic_exercise/insulin_sensitivity_homa_ir.

Priority candidates for a third pass: the `omega3_supplementation` COVID-19 edge (only half of a disclosed contradiction has now been checked), the `oat_beta_glucan`/`mediterranean_diet`/`saturated_fat_reduction`/`added_sugar` lipid-marker cluster (6 edges sharing behaviors across ldl_cholesterol/triglycerides, never checked in either pass), and `l_arginine`/`l_citrulline` (supplement claims with a history of overstatement in this literature).

## Single most important fix this pass

Same root cause as pass 1, recurring: **the "exposure/behavior cannot be randomized -> not an RCT tier" rule is still applied inconsistently.** `smoking_cessation -> triglycerides` (this pass, defect #1) is tagged Tier B / "RCT" for a non-randomized pre/post cohort design, from the exact same paper whose sibling `smoking -> triglycerides` edge is correctly tagged Tier D. A single dataset-wide pass that re-checks every Tier A/B edge's `paper.design` field for the words "pre/post," "cohort," "cross-sectional," "case-control," or "observational" - and downgrades the tier accordingly - would have caught this without needing a live literature check.

