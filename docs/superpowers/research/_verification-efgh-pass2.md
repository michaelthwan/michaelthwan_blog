# Verification report: goals E, F, G, H (health-evidence.json) — PASS 2

Artifact: `C:\github\mw_knowledge_blog\astro-blog\public\data\health-evidence.json`
Scope: same 112 edges as pass 1 (goals E/F/G/H). This pass targets the ~86 edges
pass 1 did NOT check live, prioritizing spread across all four goals, plus the
NEW criterion: `paper.n` vs abstract-reported n, especially longevity rows.

Status: COMPLETE

## Edges selected for this pass (21, none overlapping pass 1's checked list)

Goal E (5): aerobic_exercise/fat_mass; caloric_deficit_magnitude/lean_mass;
hmb/lean_mass; intermittent_fasting_tre/fat_mass (numecd 2024.103805 paper);
resistance_training/lean_mass.

Goal F (5): ginkgo_biloba/global_cognition_older; mindfulness_meditation/working_memory;
nicotine/sustained_attention_rt; omega3_supplementation/global_cognition_older;
blood_pressure_control/global_cognition_older (SPRINT MIND).

Goal G (5): aerobic_exercise/depressive_symptoms (umbrella review, bjsports-2025-110301);
cbt/anxiety_symptoms; vitamin_d/depressive_symptoms; mindfulness_based_interventions/cortisol;
resistance_training/anxiety_symptoms.

Goal H (6): fruit_vegetable_intake/all_cause_mortality; mediterranean_diet/all_cause_mortality;
physical_activity_volume/all_cause_mortality (daily steps); processed_red_meat/cancer_incidence_mortality
(foodchem umbrella review); sleep_duration/all_cause_mortality; air_pollution_pm25/all_cause_mortality.

(Report continues below as edges are checked live.)

---

## Live verification log (NCBI eutils efetch against abstracts)

1. **aerobic_exercise / fat_mass** (10.1001/jamanetworkopen.2024.52185, PMID 39724371,
   Jayedi et al. 2024 JAMA Netw Open) — PASS. DOI/title match exactly. `paper.n`=6880
   matches abstract ("6880 participants"). Verbatim matches abstract's RESULTS sentence
   exactly, word for word. Tier A correct (dose-response meta-analysis of 116 RCTs).
   Direction "-" correct (fat mass reduced). `conditional_on` linear/monotonic-to-300-min
   claim matches abstract's CONCLUSIONS exactly. No defect.

2. **caloric_deficit_magnitude / lean_mass** (10.1001/jamanetworkopen.2019.13733,
   PMID 31664441, Seimon/TEMPO trial 2019 JAMA Netw Open) — PASS. DOI/title match.
   `paper.n`=101 matches ("A total of 101 postmenopausal women were recruited"). Verbatim
   matches abstract's RESULTS sentence exactly. Tier B correct (single RCT). Direction "-"
   correct. No defect. (Abstract's COI section discloses several Novo Nordisk/pharma
   advisory-board ties for co-authors, but this is a diet-only RCT with no drug arm, so
   no COI-disclosure gap comparable to the GLP-1 edges from pass 1.)

3. **hmb / lean_mass** (10.3390/nu12051523, PMID 32456217, Jakubowski et al. 2020
   Nutrients) — PASS. DOI/title match. `paper.n`=302 matches ("A total of 302 participants
   (18-45 y) were included in body mass and composition analysis"). Verbatim ("A
   significant effect was found on TBM. However, there were no significant effects for
   FFM, FM, or strength outcomes.") matches abstract exactly. Tier A correct
   (meta-analysis of RCTs). Direction null correct (null result on the marker itself). No
   defect.

4. **intermittent_fasting_tre / fat_mass** (10.1016/j.numecd.2024.103805, PMID 39732588,
   Hamsho et al. 2025 Nutr Metab Cardiovasc Dis) — PASS. DOI/title match exactly. `paper.n`
   is correctly left null: the abstract never reports a participant count, only "20 RCTs
   were included" — leaving n null rather than guessing is correct, not a defect. Verbatim
   matches abstract's RESULTS sentence exactly (fat mass kg P=0.006 short-term, fat mass %
   P=0.0002 long-term). Tier A correct. No defect.

5. **resistance_training / lean_mass** (10.1249/MSS.0000000000002585, PMID 33433148,
   Lopez et al. 2021 Med Sci Sports Exerc) — DOI/title match. `paper.n`=747 matches
   ("Twenty-eight studies involving 747 healthy adults"). Verbatim matches abstract's
   RESULTS sentence exactly. Tier A correct. Erratum correctly captured in
   `paper_notices`/`paper_notice_detail` (matches live PubMed "Erratum in" line exactly,
   `paper_notice_serious: false` is reasonable — a correction notice with no abstract-level
   detail). **MINOR ISSUE**: `direction` is recorded as "+" for this edge, but this specific
   paper does not compare resistance training against a no-exercise control on lean
   mass/hypertrophy at all — it only compares RT *loads* (low/moderate/high) against each
   other, finding load-independence. The dataset's own `caveats` field is transparent about
   this ("cannot quantify absolute hypertrophy magnitude vs sedentary controls"), so a
   careful reader is not misled, but the bare `direction: "+"` on this row is not something
   this paper itself demonstrates — it is imported general knowledge, not a result of the
   cited study. Low severity given the caveat, but flagged as a `conditional_on`/direction
   attribution nit.

6. **ginkgo_biloba / global_cognition_older** (10.1002/14651858.CD013661.pub2, PMID
   41641880, Wieland et al. 2026 Cochrane) — PASS. DOI/title match exactly. `paper.n`=1913
   matches ("Twelve studies (1913 participants) tested ginkgo against placebo in people
   with MCI"). Verbatim (ADAS-cog MD -0.07, 95% CI -0.67 to 0.51, 2 studies, 508
   participants) matches abstract exactly. Tier A correct (Cochrane meta-analysis of RCTs).
   Direction null correct (null result in MCI population). `conditional_on` note that the
   same review found dementia benefit matches the abstract's separate Dementia subsection.
   No defect.

8. **nicotine / sustained_attention_rt** (10.1007/s00213-010-1848-1, PMID 20414766,
   Heishman et al. 2010 Psychopharmacology) — PASS. DOI/title match exactly. `paper.n` is
   correctly left null (abstract reports "41 double-blind, placebo-controlled laboratory
   studies" but no summed participant count). Verbatim matches abstract's RESULTS sentence
   exactly (six domains, effect size range 0.16-0.44). Tier A correct. Direction "+"
   correct (nicotine improves the marker; edge's `valence: bad` correctly separates
   "direction of effect on the marker" from "is this a good behavior to adopt"). No defect.

9. **omega3_supplementation / global_cognition_older** (10.1002/14651858.CD005379.pub3,
   PMID 22696350, Sydenham/Cochrane 2012) — PASS. DOI/title match exactly. `paper.n`=3221
   matches ("In two studies involving 3221 participants there was no difference..."). Verbatim
   matches abstract exactly. Tier A correct (Cochrane meta-analysis). Direction null correct
   (null result). No defect.

10. **blood_pressure_control / global_cognition_older** (10.1001/jama.2018.21442, PMID
    30688979, SPRINT MIND, Williamson et al. 2019 JAMA) — PASS. DOI/title match exactly.
    `paper.n`=9361 matches ("Among 9361 randomized participants"). Verbatim matches
    abstract's RESULTS paragraph exactly. Tier B correct (single RCT, not inflated to A).
    Direction "+" is handled carefully: the edge's own `conditional_on`/`caveats` correctly
    state the significant finding is on the SECONDARY MCI outcome (HR 0.81) while the
    primary probable-dementia outcome was non-significant (HR 0.83, CI crosses 1) —
    matches the abstract's own CONCLUSIONS sentence ("did not result in a significant
    reduction in the risk of probable dementia... may have been underpowered"). No defect.

11. **aerobic_exercise / depressive_symptoms** (10.1136/bjsports-2025-110301, PMID
    41667154, Munro et al. 2026 Br J Sports Med umbrella review) — PASS. DOI/title match
    exactly. `paper.n`=79551 matches ("79 551 participants"). Verbatim matches abstract's
    RESULTS sentence exactly. Tier A correct (umbrella review/meta-meta-analysis of RCTs
    of RCTs). Direction "-" correct. No defect.

12. **cbt / anxiety_symptoms** (10.1001/jamapsychiatry.2023.3971, PMID 37851421, Papola
    et al. 2024 JAMA Psychiatry) — DOI/title match exactly. `paper.n`=5048 matches ("Effect
    size estimates on data from 5048 participants"). Tier A correct. Direction "-" correct.
    Erratum correctly captured in `paper_notices` (matches both live "Erratum in" DOIs).
    **DEFECT FOUND (verbatim splice, same pattern as pass 1's sedentary_time defect)**: the
    edge's `verbatim` field reads as one continuous quote — "...were associated with
    reduced GAD symptoms vs treatment as usual. When considering anxiety severity at 3 to
    12 months after completion of the intervention, only CBT remained..." — but in the live
    abstract, TWO full intervening sentences sit between those two clauses: one reporting
    acceptability relative risks ("Relative risks for all-cause discontinuation...eg,
    relative risk, 1.04 [95% CI, 0.64-1.67] for CBT vs treatment as usual") and one
    reporting relaxation therapy's loss of significance after excluding high-risk-of-bias
    studies ("When excluding studies at high risk of bias, relaxation therapy lost its
    superiority over treatment as usual (SMD, -0.47; 95% CI, -1.18 to 0.23)"). The edge has
    no `quote_elided` flag and no ellipsis marking this gap, so it reads as a single
    contiguous sentence from the source when it is not. Note: the dropped relaxation-therapy
    sensitivity-analysis sentence is scientifically relevant to this same edge's own
    `conditional_on` claim about robustness-to-bias-exclusion, which the edge *does*
    separately state correctly in its own words — so the splice is a provenance defect,
    not a factual error, but it is a second, independent instance of the exact defect
    pattern flagged as the "single most important fix" in pass 1.

13. **vitamin_d / depressive_symptoms** (10.1017/S0033291724001697, PMID 39552387, Ghaemi
    et al. 2024 Psychol Med) — PASS. DOI/title match exactly. `paper.n`=24189 matches
    ("Our analysis included 31 trials with 24189 participants"). Verbatim matches abstract
    exactly and word-for-word, including preserving the abstract's own apparent typo
    "GEADE = moderate" (almost certainly a GRADE typo in the original) — a good positive
    signal that this is a genuine copy, not a cleaned-up paraphrase. Tier A correct.
    Direction "-" correct. The strong duration-decay `conditional_on` claim (short-term
    strong effect vanishing/reversing by >52 weeks) matches the abstract's numbers exactly.
    No defect.

14. **mindfulness_based_interventions / cortisol** (10.1016/j.psyneuen.2023.106415, PMID
    37879237, Rogerson et al. 2024 Psychoneuroendocrinology) — PASS. DOI/title match
    exactly. `paper.n`=3508 matches ("58 studies (combined N = 3508)"). Verbatim matches
    abstract exactly, including the source's own unusual spacing artifacts ("g = 0. 345",
    "g = 0. 347") — again a strong signal of genuine verbatim copying rather than cleanup.
    Tier A correct. Direction "-" correct given the edge's explicit benefit-positive sign
    convention note. `conditional_on` awakening-vs-diurnal contrast (g=0.644 vs g=0.255)
    matches the abstract exactly. No defect.

7. **mindfulness_meditation / working_memory** (10.1080/17437199.2023.2248222, PMID
   37578065, Zainal & Newman 2024 Health Psychol Rev) — PASS. DOI/title match. `paper.n`
   =9538 matches ("One-hundred-and-eleven RCTs (n = 9,538)"). Verbatim matches abstract
   RESULTS sentence exactly, including the g=0.257-0.643/0.192-0.394 ranges and the null
   latency/processing-speed/episodic-memory finding carried into `conditional_on`. Tier A
   correct. Direction "+" correct. No defect.

15. **resistance_training / anxiety_symptoms** (10.1007/s40279-017-0769-0, PMID 28819746,
    Gordon et al. 2017 Sports Med) — PASS. DOI/title match exactly. `paper.n`=922 matches
    ("Trials involved 922 participants"). Verbatim matches abstract's RESULTS sentence
    exactly (Δ=0.31, healthy Δ=0.50, ill Δ=0.19). Tier A correct. Direction "-" correct
    (per the edge's own re-sign convention, documented transparently in `caveats`). No
    defect.

16. **fruit_vegetable_intake / all_cause_mortality** (10.1136/bmj.g4490, PMID 25073782,
    Wang et al. 2014 BMJ) — PASS, and this is a SPECIFIC RISK check (U-shape/plateau must
    be declared). DOI/title match exactly. `paper.n`=833234 matches ("833,234
    participants"). Verbatim matches abstract's RESULTS sentence exactly, including the
    "threshold around five servings...did not reduce further" plateau language, which
    `conditional_on` correctly declares as non-monotonic rather than collapsing to one
    number. Tier C correct (prospective cohort, not inflated despite huge n). Erratum
    correctly captured (`paper_notice_detail` "BMJ. 2014;349:5472" matches live "Erratum
    in" line exactly). No defect.

17. **mediterranean_diet / all_cause_mortality** (10.1136/bmj.a1344, PMID 18786971, Sofi
    et al. 2008 BMJ) — PASS. DOI/title match exactly. `paper.n`=514816 matches ("eight
    cohorts (514,816 subjects and 33,576 deaths)"), and the edge correctly distinguishes
    this all-cause-mortality-specific subset from the full review's larger pooled
    population (abstract: "12 studies, with a total of 1,574,299 subjects" — matches the
    edge's `population` field parenthetical exactly). Verbatim matches abstract's RESULTS
    sentence exactly. Tier C correct (prospective cohort). Direction "-" correct. No
    defect.

18. **physical_activity_volume / all_cause_mortality** (10.1016/S2468-2667(21)00302-9,
    PMID 35247352, Paluch et al. 2022 Lancet Public Health, "daily steps") — PASS, and this
    is a SPECIFIC RISK check (step-count U-shape/plateau). DOI/title match exactly.
    `paper.n`=47471 matches ("total sample included 47 471 adults"). Verbatim matches
    abstract's FINDINGS sentences exactly, and the automated `unsupported_numbers` flag on
    0.47/0.55/0.60 is confirmed a FALSE POSITIVE — all three numbers are present verbatim in
    the live abstract ("0·60...for quartile 2, 0·55...for quartile 3, and 0·47...for
    quartile 4"). Tier C correct (individual-participant-data meta-analysis of cohorts, not
    inflated). `conditional_on` correctly declares the age-dependent plateau (6000-8000
    steps 60+, 8000-10000 under 60) rather than reporting a single linear dose-response. No
    defect.

19. **processed_red_meat / cancer_incidence_mortality** (10.1016/j.foodchem.2021.129697,
    PMID 33838606, Huang et al. 2021 Food Chem umbrella review) — PASS on DOI/title/verbatim/
    n (n correctly left null; abstract reports "72 meta-analyses" but no summed participant
    count). Verbatim matches abstract's closing sentence exactly. Tier C is a reasonable,
    non-inflated call (cannot be tier A — no RCT possible for long-term red-meat-cancer
    causation). **MINOR/INFORMATIONAL**: the edge's `evidence_tag`/`evidence_label` say
    "COHORT"/"Prospective cohort study", but the paper's own abstract describes an umbrella
    review that is not restricted to prospective cohort designs — the `paper.design` field
    itself (not shown verbatim here, but present in the record) already says "umbrella
    review... of prospective and case-control studies", i.e. a mix including case-control
    (tier-D-type) studies. Labeling the whole umbrella review's `evidence_tag` as a single
    "Prospective cohort study" slightly overstates design homogeneity, though the tier
    letter (C) itself is not inflated to A/B and remains a defensible single-tier summary
    for a mixed-observational umbrella review. Low severity, cosmetic tag/label precision
    only.

20. **sleep_duration / all_cause_mortality** (10.1161/JAHA.117.005947, PMID 28889101, Yin
    et al. 2017 JAHA) — PASS, and this is a SPECIFIC RISK check (sleep-duration U-shape must
    be declared). DOI/title match exactly. `paper.n` correctly left null (abstract gives no
    aggregate participant count). Verbatim matches abstract's METHODS AND RESULTS sentences
    exactly (RR 1.06 <7h, RR 1.13 >7h, nadir ~7h). Tier C correct. `conditional_on`
    explicitly states the U-shape with steeper long-sleep-side risk, matching the abstract;
    not collapsed into one number. No defect.

21. **air_pollution_pm25 / all_cause_mortality** (10.1016/j.cpcardiol.2023.101670, PMID
    36828043, Krittanawong et al. 2023 Curr Probl Cardiol) — PASS, and this is the
    task's flagged "large-cohort n accuracy" check. DOI/title match exactly. `paper.n`
    =7300591 matches the abstract EXACTLY ("7,300,591 individuals were followed") — no
    off-by-one-digit or truncation error in this large sample-size badge. Verbatim matches
    abstract's sentence exactly (HR 1.08, 95% CI 1.05-1.11). Tier C correct (meta-analysis
    of prospective cohorts, cannot be randomized). Direction "+" correct. No defect.

---

## Edges checked live this pass (21 targeted, 21 checked; all resolved DOI/title/n on first
or retried eutils call)

1. aerobic_exercise / fat_mass (10.1001/jamanetworkopen.2024.52185)
2. caloric_deficit_magnitude / lean_mass (10.1001/jamanetworkopen.2019.13733)
3. hmb / lean_mass (10.3390/nu12051523)
4. intermittent_fasting_tre / fat_mass (10.1016/j.numecd.2024.103805)
5. resistance_training / lean_mass (10.1249/MSS.0000000000002585)
6. ginkgo_biloba / global_cognition_older (10.1002/14651858.CD013661.pub2)
7. mindfulness_meditation / working_memory (10.1080/17437199.2023.2248222)
8. nicotine / sustained_attention_rt (10.1007/s00213-010-1848-1)
9. omega3_supplementation / global_cognition_older (10.1002/14651858.CD005379.pub3)
10. blood_pressure_control / global_cognition_older (10.1001/jama.2018.21442)
11. aerobic_exercise / depressive_symptoms (10.1136/bjsports-2025-110301)
12. cbt / anxiety_symptoms (10.1001/jamapsychiatry.2023.3971)
13. vitamin_d / depressive_symptoms (10.1017/S0033291724001697)
14. mindfulness_based_interventions / cortisol (10.1016/j.psyneuen.2023.106415)
15. resistance_training / anxiety_symptoms (10.1007/s40279-017-0769-0)
16. fruit_vegetable_intake / all_cause_mortality (10.1136/bmj.g4490)
17. mediterranean_diet / all_cause_mortality (10.1136/bmj.a1344)
18. physical_activity_volume / all_cause_mortality (10.1016/S2468-2667(21)00302-9)
19. processed_red_meat / cancer_incidence_mortality (10.1016/j.foodchem.2021.129697)
20. sleep_duration / all_cause_mortality (10.1161/JAHA.117.005947)
21. air_pollution_pm25 / all_cause_mortality (10.1016/j.cpcardiol.2023.101670)

Combined with pass 1 (18 papers / 26 edges), **47 edges across both passes** have now been
verified live against NCBI abstracts, spanning all four goals and every tier (A-D) present
in scope.

---

## Verdict per criterion (this pass's 21 edges)

1. **evidence_tier matches real design** — PASS for 20/21. Nuance on `processed_red_meat` /
   `cancer_incidence_mortality`: see defect 3 below (tag/label precision, not tier
   inflation). No tier was inflated to A or B anywhere in this pass, including the two
   large-n longevity rows (79,551 and 7,300,591 participants), which stayed at tier A
   (RCT-meta-analysis) and tier C (cohort meta-analysis) respectively rather than being
   bumped for sample size alone.

2. **direction correct including sign** — PASS for 20/21. See defect 2 below
   (`resistance_training`/`lean_mass` direction attributed to a paper that does not itself
   demonstrate an RT-vs-control comparison). All U-shape/cortisol-sign-convention/re-signed
   edges (steps, sleep duration, PM2.5, cortisol g, RET anxiety Δ) had sign handled
   correctly with the convention explained in `caveats`/`conditional_on`.

3. **conditional_on does not overstate generality; U-shapes/plateaus declared** — PASS for
   all 21 edges, including three SPECIFIC RISK checks in scope for this pass: fruit/
   vegetable intake (5-serving plateau), daily steps (age-dependent plateau at 6000-10,000
   steps/day), and sleep duration (U-shape centered at ~7h) — all declared non-monotonic
   with the actual threshold/shape named, not collapsed into a single linear number.

4. **paper.doi resolves and belongs to the paper in paper.title** — PASS for all 21 papers;
   every DOI resolved via NCBI esearch to a PMID whose title matched `paper.title` exactly
   or near-exactly (only cosmetic case/punctuation differences).

5. **verbatim is genuinely copied text, not a paraphrase** — ONE NEW DEFECT: `cbt` /
   `anxiety_symptoms` splices two non-adjacent abstract sentences with no `quote_elided`
   flag or ellipsis, silently dropping two full intervening sentences (see defect 1). This
   is the SECOND independent instance of the exact defect class pass 1 flagged as its
   single most important fix — it recurs, meaning the underlying extraction process has not
   been corrected for this failure mode. All other 20 verbatim strings checked live this
   pass were genuine, contiguous quotes, several preserving the source's own typos/spacing
   artifacts ("GEADE = moderate", "g = 0. 345") — a positive signal of real copy-paste
   rather than cleaned paraphrase.

6. **paper.n matches the abstract (NEW this pass)** — PASS for 21/21. Every non-null
   `paper.n` matched the abstract's reported participant count exactly, including the two
   very large longevity cohort sizes specifically flagged as easy-to-mistype:
   `air_pollution_pm25` (7,300,591 — exact digit-for-digit match) and
   `physical_activity_volume`/daily-steps (47,471 — exact match), plus
   `fruit_vegetable_intake` (833,234), `mediterranean_diet` (514,816 — correctly the
   all-cause-mortality-specific cohort subset, not the full review's larger 1,574,299),
   `aerobic_exercise`/depression umbrella review (79,551), and `cbt` (5,048). Every edge
   where `paper.n` was left null was null because the abstract itself reports no aggregate
   participant count (only a study/trial count) — never a case of an available number being
   dropped or mistyped.

---

## Defect list (ranked, this pass)

**1. [MEDIUM] Verbatim splice presented as continuous quote — `cbt` x `anxiety_symptoms`**
(10.1001/jamapsychiatry.2023.3971, PMID 37851421). The edge's `verbatim` field reads as one
continuous sentence: "...were associated with reduced GAD symptoms vs treatment as usual.
When considering anxiety severity at 3 to 12 months after completion of the intervention,
only CBT remained significantly associated with greater effectiveness than treatment as
usual (SMD, -0.60; 95% CI, -0.99 to -0.21)." In the live abstract, two full sentences sit
between those two clauses and are silently dropped with no ellipsis and no
`quote_elided: true` flag: an acceptability relative-risk sentence ("Relative risks for
all-cause discontinuation...eg, relative risk, 1.04 [95% CI, 0.64-1.67] for CBT vs
treatment as usual") and a relaxation-therapy sensitivity-analysis sentence ("When
excluding studies at high risk of bias, relaxation therapy lost its superiority over
treatment as usual (SMD, -0.47; 95% CI, -1.18 to 0.23)"). This is the SAME defect class,
same missing-flag mechanism, as pass 1's `sedentary_time` / `cancer_incidence_mortality`
finding — confirming a recurring pattern rather than an isolated incident. The edge's own
`conditional_on` field does separately and correctly describe the relaxation-therapy
sensitivity-analysis finding in its own words, so this is a provenance/citation-integrity
defect, not a factual error — but it is invisible to both the numeric-mismatch check and
the `quote_elided` flag, since no number is altered and nothing is missing from the edge's
own stated claims, only from the quote's implicit claim to be one continuous sentence.

**2. [LOW] Direction attributed to a paper that does not itself demonstrate it —
`resistance_training` x `lean_mass`** (10.1249/MSS.0000000000002585, PMID 33433148). The
edge records `direction: "+"`, but the cited paper (Lopez 2021) compares resistance-training
*loads* against each other (finding hypertrophy is load-independent) and contains no
RT-vs-no-exercise-control comparison on lean mass at all. The dataset's own `caveats` field
already flags this limitation clearly, so a reader is not misled, but the bare `direction`
field implies the cited study establishes the sign, when it does not.

**3. [LOW, cosmetic] Design-label imprecision — `processed_red_meat` x
`cancer_incidence_mortality`** (10.1016/j.foodchem.2021.129697, PMID 33838606). Tagged
`evidence_tag: "COHORT"` / `evidence_label: "Prospective cohort study"`, but the paper is an
umbrella review whose own `paper.design` field states it covers "prospective and
case-control studies" — a mixed-design review labeled with a single cohort-specific tag.
The tier letter (C) itself is not inflated and remains defensible as a single-tier summary
for a mixed-observational umbrella review; only the tag/label wording overstates design
homogeneity.

No other defects were found in the 21 edges checked live this pass. The task's flagged
`paper.n` risk (large longevity cohort sizes being hard-to-eyeball-verify badges) was
checked on every edge and found accurate in all 21 cases, including the two largest
(7,300,591 and 833,234).

---

## Rows still unverified after pass 1 + pass 2

Programmatically diffing the full in-scope edge list against both passes' checked
(behavior_id, marker_id, doi) tuples leaves roughly 60 in-scope rows not yet checked live
(exact count depends on how duplicate behavior/marker/doi rows with different
sub-populations are counted; see the two passes' own edge lists above for the authoritative
checked set). Remaining candidates by goal:

- **Goal E**: aerobic_exercise/waist_vat; bcaa/lean_mass, /max_strength;
  caloric_deficit_magnitude/fat_mass, /max_strength, /waist_vat; creatine_monohydrate/
  max_strength; hmb/max_strength; intermittent_fasting_tre/fat_mass, /lean_mass (the OTHER
  intermittent-fasting paper, fnut.2025.1664412, not checked this pass); protein_intake/
  fat_mass, /max_strength; resistance_training/fat_mass, /max_strength, /rmr, /waist_vat;
  sleep_restriction_during_diet/fat_mass, /lean_mass.
- **Goal F**: acute_aerobic_exercise/processing_speed; aerobic_exercise_chronic/
  episodic_memory; caffeine/sustained_attention_rt; creatine_sleep_deprivation/
  processing_speed, /sustained_attention_rt; ginkgo_biloba/sustained_attention_rt;
  l_theanine_caffeine/sustained_attention_rt; mindfulness_meditation/episodic_memory;
  nicotine/working_memory; sleep_deprivation/sustained_attention_rt.
- **Goal G**: aerobic_exercise/anxiety_symptoms, /depressive_symptoms (the
  bmj-2023-075847 paper, a different depression-exercise meta-analysis from the one
  checked this pass); alcohol_use_disorder/depressive_symptoms; bright_light_therapy/
  depressive_symptoms x2; cbt/depressive_symptoms; loneliness_social_isolation/
  depressive_symptoms; mindfulness_based_interventions/anxiety_symptoms,
  /depressive_symptoms, /perceived_stress; omega3_dha/depressive_symptoms, omega3_epa/
  depressive_symptoms; probiotics_psychobiotics/anxiety_symptoms; resistance_training/
  depressive_symptoms; sleep_deprivation/anxiety_symptoms, /depressive_symptoms;
  time_in_nature/anxiety_symptoms, /depressive_symptoms; vitamin_d/anxiety_symptoms.
- **Goal H**: air_pollution_pm25/cancer_incidence_mortality, /cardiovascular_mortality;
  alcohol/cancer_incidence_mortality; cardiorespiratory_fitness/all_cause_mortality;
  fruit_vegetable_intake/cancer_incidence_mortality, /cardiovascular_mortality;
  loneliness_social_isolation/all_cause_mortality; mediterranean_diet/
  cancer_incidence_mortality, /cardiovascular_mortality (same paper checked this pass for
  all-cause mortality, but the cancer/CVD-specific numbers were not independently
  re-verified against the live abstract); obesity_bmi/cancer_incidence_mortality;
  physical_activity_volume/all_cause_mortality (the OTHER steps paper, eurjpc.zwad229),
  /cardiovascular_mortality; processed_red_meat/all_cause_mortality,
  /cancer_incidence_mortality (advnut.2024.100214 — the "challenges the dose-response
  estimates" companion paper the dataset's own caveats mention but which neither pass has
  independently checked against its live abstract); sleep_duration/cardiovascular_mortality.

Absence of a live check on these rows is not evidence of a problem — it reflects this
pass's tool-call budget (targeted 18+, delivered 21 spread across all four goals) — but
they are the highest-priority candidates for a pass 3, particularly the
`processed_red_meat` / `advnut.2024.100214` companion paper and the `mediterranean_diet`
cancer/cardiovascular sub-splits noted above.

