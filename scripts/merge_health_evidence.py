"""Merge the per-goal literature extractions into the dataset the explorer fetches.

Each research file is written independently by its own extraction agent, so they disagree
on small things: the cut list lives under a different key in each, marker ids may collide
across goals, and node lists repeat. This script normalises all of that and fails loudly
rather than shipping a graph with dangling references.

Usage:  python scripts/merge_health_evidence.py
"""

import hashlib
import json
import math
import re
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "superpowers" / "research"
OUT = ROOT / "astro-blog" / "public" / "data" / "health-evidence.json"
VERBATIM_STATUS = SRC / "_verbatim_status.json"

# Each extraction agent invented its own behavior ids, so the same real-world exposure
# arrives under different names ("fat_loss" and "weight_loss"), while genuinely different
# exposures share a name family ("one night of sleep loss" vs "three nights"). Merging the
# first pair by id would be right; merging the second would destroy a real finding.
#
# So nodes are never merged. Instead each behavior is tagged with a family, and cross-goal
# leverage is counted per family. Dose and formulation distinctions survive; the fact that
# "alcohol" shows up under several goals still surfaces.
# Family rules are matched against the behavior NAME, not its id. Every re-run of an
# extraction agent invents fresh ids ("weight_loss" one pass, "weight_loss_fatloss" the
# next), so an id table silently rots; names stay stable because they describe the exposure.
# First matching rule wins, so order matters.
FAMILY_RULES = [
    # Order matters: the first matching rule wins, so narrower names come first.
    ("protein", "protein"),                 # before "exercise": "Protein intake (with resistance training)"
    ("creatine", "creatine"),
    ("theanine", None),                     # a combination pill, not dietary caffeine
    ("caffeine", "caffeine"),
    ("coffee", "caffeine"),
    ("alcohol", "alcohol"),
    ("smoking", "smoking"),
    ("smoke", "smoking"),
    ("omega-3", "omega3"),
    ("omega 3", "omega3"),
    ("n-3", "omega3"),
    ("epa", "omega3"),
    ("fish oil", "omega3"),
    ("vitamin d", "vitamin_d"),
    ("magnesium", "magnesium"),
    ("melatonin", "melatonin"),
    ("sleep deprivation", "sleep_loss"),
    ("sleep duration", "sleep_loss"),
    ("sleep restriction", "sleep_loss"),
    ("sleep disturbance", "sleep_loss"),
    ("weight loss", "body_fat"),
    ("fat loss", "body_fat"),
    ("body fat", "body_fat"),
    ("obesity", "body_fat"),
    ("bmi", "body_fat"),
    ("adiposity", "body_fat"),
    ("sedentary", "sedentary"),
    ("sitting", "sedentary"),
    ("mediterranean", "diet_pattern"),
    ("dash", "diet_pattern"),
    ("glycaemic", "diet_pattern"),
    ("glycemic", "diet_pattern"),
    ("fibre", "fibre"),
    ("fiber", "fibre"),
    ("sodium", "sodium"),
    ("sugar", "sugar"),
    ("mindfulness", "meditation"),
    ("meditation", "meditation"),
    ("cognitive behavio", "cbt"),
    ("social", "social"),
    ("loneliness", "social"),
    ("isolation", "social"),
    ("air pollution", "air_pollution"),
    ("pm2.5", "air_pollution"),
    ("brain training", None),          # cognitive training is not exercise
    ("working-memory", None),
    ("exercise", "exercise"),
    ("resistance training", "exercise"),
    ("physical activity", "exercise"),
    ("interval training", "exercise"),
    ("endurance training", "exercise"),
    ("step count", "exercise"),
    ("steps", "exercise"),
    ("fitness", "exercise"),
    ("stress", "stress"),
    ("light", "light"),
    ("curcumin", "curcumin"),
]

# Display order in the explorer. Shared goals first (inflammation through oral);
# male and female reproductive goals sit together at the end, male before female.
GOAL_ORDER = [
    "goal_b_inflammation_skin",
    "goal_c_sleep_quality",
    "goal_d_cardiometabolic",
    "goal_e_body_composition_strength",
    "goal_f_cognition_focus",
    "goal_g_mood_anxiety",
    "goal_h_longevity_mortality",
    "goal_i_liver",
    "goal_j_immune",
    "goal_k_bone_joint_health",
    "goal_l_gut",
    "goal_n_oral",
    "male_vitality",
    "goal_m_female_health",
]


def ordered_goals(goals):
    rank = {gid: i for i, gid in enumerate(GOAL_ORDER)}
    return sorted(goals.values(), key=lambda g: rank.get(g["id"], 99))


FAMILY_LABEL = {
    "alcohol": "Alcohol",
    "body_fat": "Body fat",
    "sleep_loss": "Sleep loss",
    "exercise": "Exercise",
    "stress": "Psychological stress",
    "light": "Light exposure",
    "curcumin": "Curcumin",
    "protein": "Protein intake",
    "creatine": "Creatine",
    "caffeine": "Caffeine",
    "smoking": "Smoking",
    "omega3": "Omega-3",
    "vitamin_d": "Vitamin D",
    "magnesium": "Magnesium",
    "melatonin": "Melatonin",
    "sedentary": "Sedentary time",
    "diet_pattern": "Diet pattern",
    "fibre": "Dietary fibre",
    "sodium": "Sodium",
    "sugar": "Sugar",
    "meditation": "Meditation",
    "cbt": "Cognitive behavioural therapy",
    "social": "Social connection",
    "air_pollution": "Air pollution",
}



# Presentation groups for the behavior view. The extraction agents tagged every behavior
# with one of five categories, but "habit" ended up a grab-bag holding sleep, alcohol,
# smoking, stress, surgery and blood-pressure drugs at once, and alcohol was split across
# two categories. These rules re-group by name first and fall back to the source category,
# so the ordering a reader sees does not depend on which agent wrote which row.
# First match wins; order matters.
GROUP_RULES = [
    ("bariatric", "medical"),
    ("glp-1", "medical"),
    ("semaglutide", "medical"),
    ("blood pressure control", "medical"),
    ("cognitive behavio", "medical"),
    ("brain training", "medical"),
    ("light therapy", "medical"),
    ("sleep", "sleep"),
    ("caffeine", "drink"),
    ("coffee", "drink"),
    ("alcohol", "drink"),
    ("smoking", "tobacco"),
    ("nicotine", "tobacco"),
    ("sedentary", "exercise"),
    ("sitting", "exercise"),
    ("step count", "exercise"),
    ("physical activity", "exercise"),
    ("exercise", "exercise"),
    ("interval training", "exercise"),
    ("fitness", "exercise"),
    ("stress", "mind"),
    ("mindfulness", "mind"),
    ("meditation", "mind"),
    ("loneliness", "mind"),
    ("social isolation", "mind"),
    ("air pollution", "environment"),
    ("sauna", "environment"),
    ("nature", "environment"),
    ("light", "environment"),
    ("temperature", "environment"),
    ("weight loss", "food"),
    ("fat loss", "food"),
    ("obesity", "food"),
    ("body mass index", "food"),
    ("fasting", "food"),
]

# Source category is the fallback when no name rule matches.
CATEGORY_GROUP = {
    "exercise": "exercise",
    "supplement": "supplement",
    "diet": "food",
    "environment": "environment",
    "habit": "mind",
}

# Display order: the families that reach the most goals come first.
GROUP_ORDER = [
    ("exercise", "Exercise and movement"),
    ("sleep", "Sleep"),
    ("food", "Food, diet and body weight"),
    ("drink", "Drink and stimulants"),
    ("tobacco", "Tobacco"),
    # One "Supplements" heading held 54 nodes - micronutrients, botanicals, amino acids and
    # a hormone under a single label, which told a reader nothing and made the behaviour tab
    # unreadable at that heading. They stay adjacent so the block still reads as one thing.
    ("supplement_micronutrient", "Supplements: vitamins and minerals"),
    ("supplement_fatty_acid", "Supplements: fatty acids"),
    ("supplement_amino", "Supplements: amino acids and metabolites"),
    ("supplement_botanical", "Supplements: botanicals and plant extracts"),
    ("supplement_biotic", "Supplements: live cultures"),
    ("supplement_cofactor", "Supplements: hormones and cofactors"),
    ("supplement", "Supplements: other"),
    ("medical", "Medical and therapeutic"),
    ("mind", "Mind and social"),
    ("environment", "Environment and exposure"),
]

GROUP_LABEL = dict(GROUP_ORDER)



# Two agents working the same exposure from different goals sometimes minted two nodes for
# one thing - identical names under different ids, or the same concept with the words
# swapped round. Merging them is safe because the rows themselves stay separate; only the
# node they hang from is unified, which is what the cross-goal leverage count reads.
# Genuinely different exposures (EPA versus DHA, acute versus chronic alcohol, curcumin
# formulations) are deliberately NOT listed here.
# Behaviours dropped from the explorer, with the reason shown on the page's own list of
# what was considered and left out. Both of these are prescription drugs that arrived filed
# under "supplement", which put them beside vitamin D and fish oil as though a reader could
# pick them up in the same aisle. A page about what to do is the wrong place to rank a drug
# a doctor prescribes.
DROP_BEHAVIORS = {
    "metformin_pcos": "A prescription drug for PCOS, not something a reader chooses. It "
                      "arrived grouped with supplements, which put a prescribed medicine "
                      "beside vitamin D and fish oil.",
    "nsaids_dysmenorrhea": "A prescription-strength analgesic regimen, not a behaviour a "
                            "reader adopts. Same misgrouping.",
}

MERGE_BEHAVIORS = {
    "alcohol_consumption": "alcohol",
    "social_isolation": "loneliness_social_isolation",
    "smoking_and_cessation": "smoking",
    "vitamin_d_supplementation": "vitamin_d",
}


# Rules that must beat the category, because the extractors had no drug category and filed
# pharmaceuticals and clinical therapies under "supplement" or "habit".
# Which kind of supplement a node is. Matched on the name after the group has already been
# settled as a supplement, so these never compete with the drug and therapy rules.
SUPPLEMENT_KINDS = [
    # Claimed before the botanicals: these are combination products whose names carry a
    # plant in them but whose subject is the compound.
    ("theanine", "supplement_amino"),
    ("curcumin", "supplement_botanical"),

    ("vitamin", "supplement_micronutrient"),
    ("zinc", "supplement_micronutrient"),
    ("magnesium", "supplement_micronutrient"),
    ("calcium", "supplement_micronutrient"),
    ("iron", "supplement_micronutrient"),
    ("selenium", "supplement_micronutrient"),
    ("multivitamin", "supplement_micronutrient"),

    ("omega-3", "supplement_fatty_acid"),
    ("omega 3", "supplement_fatty_acid"),
    ("alpha-linolenic", "supplement_fatty_acid"),
    ("fish oil", "supplement_fatty_acid"),

    ("creatine", "supplement_amino"),
    ("hmb", "supplement_amino"),
    ("bcaa", "supplement_amino"),
    ("branched-chain", "supplement_amino"),
    ("arginine", "supplement_amino"),
    ("citrulline", "supplement_amino"),
    ("aspartic", "supplement_amino"),
    ("collagen", "supplement_amino"),
    ("inositol", "supplement_amino"),
    ("glucosamine", "supplement_amino"),

    ("probiotic", "supplement_biotic"),
    ("psychobiotic", "supplement_biotic"),

    ("melatonin", "supplement_cofactor"),
    ("nicotinamide", "supplement_cofactor"),
    ("coenzyme q10", "supplement_cofactor"),
    ("ubiquinone", "supplement_cofactor"),

    ("ginseng", "supplement_botanical"),
    ("panax", "supplement_botanical"),
    ("eleutherococcus", "supplement_botanical"),
    ("saffron", "supplement_botanical"),
    ("crocus", "supplement_botanical"),
    ("ginkgo", "supplement_botanical"),
    ("st john", "supplement_botanical"),
    ("hypericum", "supplement_botanical"),
    ("maca", "supplement_botanical"),
    ("lepidium", "supplement_botanical"),
    ("tribulus", "supplement_botanical"),
    ("cohosh", "supplement_botanical"),
    ("cimicifuga", "supplement_botanical"),
    ("soy isoflavone", "supplement_botanical"),
    ("elderberry", "supplement_botanical"),
    ("sambucus", "supplement_botanical"),
    ("peppermint", "supplement_botanical"),
    ("valerian", "supplement_botanical"),
]

GROUP_RULES_STRONG = [
    ("bariatric", "medical"),
    ("glp-1", "medical"),
    ("semaglutide", "medical"),
    ("blood pressure control", "medical"),
    ("cognitive behavio", "medical"),
    ("brain training", "medical"),
    ("light therapy", "medical"),
    # Caffeine arrives tagged "supplement" from the cognition trials, which used capsules,
    # and "diet" from the sleep trials, which used coffee. It is one stimulant either way,
    # and splitting it across two groups hid that. The theanine combination is a different
    # product and stays with the supplements, so it is claimed first.
    ("theanine", "supplement_amino"),
    ("caffeine", "drink"),
    ("coffee", "drink"),
]


def group_of(behavior):
    """Pick the presentation group for one behavior.

    Order matters and cost two bugs to get right. A plain name scan put creatine under
    Sleep, because the trial was run under sleep deprivation and the name says so, and put
    mindfulness training under Exercise, because the name ends in "training". So the
    extractor's own category wins for supplements, and only the strong rules above - the
    ones identifying drugs and clinical therapies - are allowed to override it.
    """
    low = (behavior.get("name") or "").lower()

    for needle, grp in GROUP_RULES_STRONG:
        if needle in low:
            return grp

    if behavior.get("category") == "supplement":
        for needle, kind in SUPPLEMENT_KINDS:
            if needle in low:
                return kind
        return "supplement"

    for needle, grp in GROUP_RULES:
        if needle in low:
            return grp

    return CATEGORY_GROUP.get(behavior.get("category"), "mind")


def family_of(name):
    low = (name or "").lower()
    for needle, fam in FAMILY_RULES:
        # Anchored at the START of a word, not a bare substring. "epa" matched the "epa"
        # inside "HRG80 hydroponic red-root preparation" and filed a ginseng under the
        # omega-3 family, where it inherited omega-3's cross-goal count.
        #
        # The END is deliberately left open. Several tokens here are prefixes chosen to
        # catch a family of spellings - "cognitive behavio" covers both behavioral and
        # behavioural, "vitamin d" has to reach "Vitamin D3" - and closing the end broke
        # all three of those while fixing the one real bug.
        if re.search(r"(?<![a-z0-9])" + re.escape(needle), low):
            return fam
    return None


CUT_KEYS = ("cut", "cut_candidates", "cut_edges", "cuts")
REQUIRED_EDGE_FIELDS = ("behavior_id", "marker_id", "evidence_tier", "verbatim")



def _decimals(text):
    """Decimal figures in a string, with p-value shorthand normalised.

    Papers write "P < .001" and extractors write "p<0.001"; both mean the same
    number, so the leading zero is restored before comparison. Integers are ignored
    deliberately: "12 weeks", "33 studies" and "2 drinks" are context, not estimates,
    and flagging them buries the real defects in noise.
    """
    t = (text or "").replace(",", "")
    t = re.sub(r"(?<![\d.])\.(\d)", r"0.\g<1>", t)
    return set(re.findall(r"\d+\.\d+", t))




# Evidence tags replace the old bare A/B/C/D letters, which told the reader nothing.
EVIDENCE_TAG = {
    "A": ("META-RCT", "Meta-analysis or systematic review of randomised trials"),
    "B": ("RCT", "Single adequately powered randomised trial"),
    "C": ("COHORT", "Prospective cohort study"),
    "D": ("CROSS-SEC", "Cross-sectional, case-control, animal or mechanistic"),
}

EVIDENCE_POINTS = {"A": 3.0, "B": 2.0, "C": 1.0, "D": 0.0}


def _magnitude(edge):
    v = edge.get("effect_normalized")
    if isinstance(v, (int, float)):
        return abs(float(v))
    for field in ("effect_normalized", "effect"):
        m = re.search(r"-?\d+(?:\.\d+)?", str(edge.get(field) or ""))
        if m:
            return abs(float(m.group(0)))
    return None



# Which way is the good way, per marker.
#
# The row already says what moved and in which direction. That is not the same question as
# whether the move was welcome: aerobic exercise LOWERS blood pressure, depressive symptoms
# and fat mass, and every one of those is a benefit. Colouring by raw direction painted the
# single best-supported behavior in the dataset entirely red. So direction and desirability
# are tracked separately, and the page shows both.
#
# "+" means higher is better, "-" means lower is better, None means the marker genuinely
# does not have a good direction on its own and nothing is claimed.
MARKER_DESIRABLE = {
    "all_cause_mortality": "-",
    "cardiovascular_mortality": "-",
    "cancer_incidence_mortality": "-",
    "anxiety_symptoms": "-",
    "depressive_symptoms": "-",
    "perceived_stress": "-",
    "blood_pressure": "-",
    "ldl_cholesterol": "-",
    "triglycerides": "-",
    "hba1c_fasting_glucose": "-",
    "insulin_sensitivity_homa_ir": "-",   # reported as HOMA-IR, where lower is better
    "insulin_igf1": "-",
    "hs_crp_il6": "-",
    "sebum_acne": "-",
    "fat_mass": "-",
    "waist_vat": "-",
    "resting_hr_arterial_stiffness": "-",
    "m_psqi": "-",                        # PSQI and ISI are symptom scores: lower is better
    "m_sol": "-",                         # minutes to fall asleep
    "sustained_attention_rt": "-",        # lapses and reaction time
    "lean_mass": "+",
    "lean_mass_strength": "+",
    "max_strength": "+",
    "vo2max": "+",
    "nitric_oxide_blood_flow": "+",
    "serum_testosterone": "+",
    "subjective_libido": "+",
    "working_memory": "+",
    "episodic_memory": "+",
    "global_cognition_older": "+",
    "m_sws_rem": "+",
    "liver_fat_steatosis": "-",
    "alt_ast": "-",
    "liver_stiffness_fibrosis": "-",
    "arti_incidence": "-",
    "infection_duration": "-",
    "experimental_infection_susceptibility": "-",
    "fracture_incidence": "-",
    "oa_pain": "-",                       # WOMAC pain and VAS: a higher score is worse pain
    "oa_function": "-",                   # WOMAC function is a difficulty score, so lower is better
    "ibs_severity": "-",
    "constipation_relief": "+",
    "stool_frequency_consistency": "+",   # all rows use it in the constipation sense
    "caries_increment": "-",
    "gingival_inflammation": "-",
    "plaque_index": "-",
    # Recorded as pocket depth / attachment loss and as periodontitis risk, so a rise is
    # always the harm - the smoking and diabetes rows both use "+" for worse disease.
    "periodontal_attachment": "-",
    "vasomotor_symptoms": "-",
    "menstrual_pain": "-",
    "pms_symptoms": "-",
    "pcos_androgens": "-",             # lower androgens is the treatment goal in PCOS
    "menstrual_regularity": "+",       # more ovulatory cycles
    "gait_speed_walking_function": "+",
    "sperm_parameters": "+",
    "statin_muscle_symptoms": "-",     # symptom rating scales: fewer symptoms is better
    "vaccine_antibody_response": "+",
    "bmd": "+",
    # Genuinely directionless on their own - no claim is made for these.
    "cortisol": None,                     # mixes diurnal slope with awakening response
    "m_dlmo": None,                       # a phase shift is neither good nor bad without context
    # Time to process, so lower is better. This was None because some sources report a
    # time and others an effect size favouring the treatment - but None made all three
    # of its rows render as "no inherent good direction" when every one is a benefit.
    # The rows reporting a favouring effect size now say so themselves via up_is_good,
    # which leaves the marker free to state the direction its own units run in.
    "processing_speed": "-",
    "rmr": None,
    "hepatic_insulin_sensitivity": None,  # sources mix a sensitivity index with HOMA-IR
    # Mixes transit hours with colonic motor AUC, and the two run opposite ways: faster
    # motility is the benefit for constipation and the harm for stress-driven IBS.
    "gut_transit": None,
    # Raising blood NAD+ is the stated aim of every NMN trial, and every trial that measured
    # it saw it rise - while grip strength, gait speed and insulin sensitivity did not follow.
    # Marking a rise "favourable" would assert the surrogate carries the benefit, which is
    # the exact question the rows underneath are unable to answer.
    "blood_nad_plus": None,
}


def assign_valence(edges, markers):
    """Tag each row as favourable, unfavourable, unclear, or no effect."""
    counts = {}
    for m in markers.values():
        if m["id"] in MARKER_DESIRABLE:
            m["desirable"] = MARKER_DESIRABLE[m["id"]]
        else:
            m["desirable"] = None
            print(f"  WARNING: no desirable direction recorded for marker {m['id']}")

    for e in edges:
        marker = markers.get(e.get("marker_id")) or {}
        # Which way is better can belong to the ROW rather than to the marker, because the
        # measure belongs to the row. "Sustained attention" is reported by some papers as
        # PVT lapses, where a rise is the harm, and by others as an effect size favouring
        # the treatment, where a rise is the benefit. One `desirable` on the marker tagged
        # every improvement on it as harm - six rows red that were not. Where a row says
        # which scale it used, that wins.
        up_good = e.get("up_is_good")
        want = ("+" if up_good else "-") if up_good is not None else marker.get("desirable")
        d = e.get("direction")
        if d is None:
            v = "none"
        elif want is None:
            v = "unclear"
        else:
            v = "good" if d == want else "bad"
        e["valence"] = v
        counts[v] = counts.get(v, 0) + 1
    return counts


def assign_usefulness(edges, markers):
    """Rank each row S..E.

    The page argues against collapsing effect size and evidence quality into one number,
    and that argument still holds: the tier is a convenience for sorting, not a finding.
    So it is computed from stated components that stay visible on the row, and the
    magnitude term is ranked WITHIN a marker only, because comparing a hormone percentage
    to a mortality hazard ratio is meaningless.

    A studied-and-no-effect row is not scored at all. It is real information, but it is
    not an action, so it sorts last and carries its own mark.
    """
    by_marker = {}
    for e in edges:
        if e.get("direction") is None:
            continue
        mag = _magnitude(e)
        if mag is not None:
            by_marker.setdefault(e["marker_id"], []).append(mag)
    for k in by_marker:
        by_marker[k].sort()

    counts = {}
    for e in edges:
        if e.get("direction") is None:
            e["usefulness"] = {"tier": "NULL", "score": None,
                               "why": ["studied, no effect found - information, not an action"]}
            counts["NULL"] = counts.get("NULL", 0) + 1
            continue

        why = []
        tier_letter = e.get("evidence_tier")
        score = EVIDENCE_POINTS.get(tier_letter, 0.0)
        why.append(EVIDENCE_TAG.get(tier_letter, ("?", "unclassified"))[1] + f" (+{score:g})")

        mag = _magnitude(e)
        peers = by_marker.get(e["marker_id"], [])
        if mag is not None and len(peers) >= 2:
            rank = sum(1 for p in peers if p < mag) / (len(peers) - 1)
            raw = 2.0 if rank >= 0.667 else (1.0 if rank >= 0.333 else 0.0)
            # A percentile among two rows is not a percentile; it is which of two studies
            # reported the bigger number, and it was handing one of them a two-point swing.
            # A quarter of the scored corpus sits on markers with two or three rows. The
            # award is pulled back toward the middle in proportion to how many peers there
            # actually are, reaching full strength at five, so a thin marker can still tilt
            # a score but cannot decide it.
            trust = min(1.0, (len(peers) - 1) / 4.0)
            pts = round(1.0 + (raw - 1.0) * trust, 2)
            score += pts
            why.append(f"effect size ranks {round(rank * 100)}th percentile among the "
                       f"{len(peers)} scored rows on this marker (+{pts:g}"
                       + (f", pulled toward the middle because {len(peers)} rows is a thin "
                          f"comparison" if trust < 1.0 else "") + ")")
        elif mag is not None:
            score += 1.0
            why.append("only scored row on this marker, so no relative ranking (+1)")
        else:
            why.append("no numeric effect to rank (+0)")

        # There used to be a -0.5 here for a row stating the population its finding held
        # in. Every one of the 253 scored rows states one - the extraction asked for it -
        # so the penalty was a constant, subtracted from everything, discriminating
        # nothing, and telling each reader their row had been marked down for being
        # specific about who was studied. The thresholds below absorbed the constant, so
        # removing it changes no tier; it only stops the row claiming a deduction that
        # never separated it from anything.
        # How many people it was measured in. Until now a meta-analysis of 200 and one of
        # 50,000 scored identically, which is the first thing any reader asks of a study.
        # The corpus runs from 4 participants to 7.3 million, so the term is logarithmic.
        #
        # It is centred on 1,000 participants rather than on the middle of its own scale.
        # The median row in this corpus has 922, so a scale running 0 to 1 across the whole
        # range put the TYPICAL row at 0.32 and quietly demoted two rows in three - the term
        # was measuring "is this a huge study" when what it should measure is "is this
        # bigger or smaller than usual". Anchored at 1,000: ten times more is +0.25, ten
        # times fewer is -0.25, and 100,000 upward saturates.
        #
        # A row whose paper never stated a sample size takes the midpoint, which is now also
        # the typical row. Not knowing is not the same as being small, and the thresholds
        # below carry that midpoint, so an unreported n leaves a row exactly where it was.
        paper = e.get("paper") or {}
        n = paper.get("n_value") if paper.get("n_kind") == "participants" else None
        if isinstance(n, int) and n > 0:
            pts = max(0.0, min(1.0, 0.5 + (math.log10(n) - 3) / 4))
            pts = round(pts, 2)
            score += pts
            why.append(f"measured in {n:,} participants (+{pts:g})")
        else:
            score += 0.5
            why.append("the paper does not state a participant count, so the size term is "
                       "left at its midpoint (+0.5)")

        if (e.get("unsupported_numbers") or e.get("quote_elided")
                or e.get("quote_spliced")):
            score -= 0.5
            why.append("a quote-integrity flag is open on this row (-0.5)")
        if e.get("coi_note"):
            score -= 0.5
            why.append("an author has a stake in the result (-0.5)")

        # Each boundary is 0.5 higher than it was, which is where it always effectively
        # sat: a score of 4.5 under the old scheme meant a row that had earned 5.0 and
        # then lost the constant half-point. Removing the constant without moving the
        # boundaries would have promoted two rows in three.
        # Each boundary carries the size term's midpoint, so a row with no stated sample
        # size scores exactly where it did before the term existed.
        tier = ("S" if score >= 5.5 else "A" if score >= 4.5 else "B" if score >= 3.5
                else "C" if score >= 2.5 else "D" if score >= 1.5 else "E")
        e["usefulness"] = {"tier": tier, "score": round(score, 2), "why": why}
        counts[tier] = counts.get(tier, 0) + 1

    return counts





# Sample size is recorded three different ways across the corpus: a plain participant count,
# a sentence like "11 RCTs, 421 participants", and an honest "not confirmed" where an agent
# could not retrieve it. Parsing happens here rather than in the page so the rule is one
# auditable place, and so a bad parse shows up in the merge output rather than on a badge.
N_PARTICIPANTS = re.compile(
    r"([\d][\d,]*)\s*(?:total\s+)?(?:participants|patients|subjects|men|women|adults|"
    r"individuals|children|person-years)", re.I)
N_STUDIES = re.compile(
    r"([\d][\d,]*)\s*(?:RCTs?|randomi[sz]ed controlled trials?|studies|trials|"
    r"meta-analyses|cohorts?)", re.I)
N_UNKNOWN = re.compile(r"not confirmed|could not|unavailable|unclear", re.I)


def parse_sample_size(raw):
    """Return (kind, value, label) for one paper's recorded n."""
    if raw is None or raw == "":
        return ("unknown", None, None)
    if isinstance(raw, (int, float)):
        return ("participants", int(raw), f"{int(raw):,}")

    text = str(raw)
    if N_UNKNOWN.search(text):
        return ("unknown", None, None)

    # Participants beat study counts: a reader wants to know how many people, and taking
    # the largest number in the sentence would sometimes grab an unrelated figure.
    m = N_PARTICIPANTS.search(text)
    if m:
        return ("participants", int(m.group(1).replace(",", "")), f"{int(m.group(1).replace(',', '')):,}")
    m = N_STUDIES.search(text)
    if m:
        return ("studies", int(m.group(1).replace(",", "")), f"{int(m.group(1).replace(',', '')):,}")
    m = re.search(r"([\d][\d,]*)", text)
    if m:
        return ("participants", int(m.group(1).replace(",", "")), f"{int(m.group(1).replace(',', '')):,}")
    return ("unknown", None, None)


def assign_sample_sizes(edges):
    counts = {"participants": 0, "studies": 0, "unknown": 0}
    for e in edges:
        paper = e.get("paper") or {}
        kind, value, label = parse_sample_size(paper.get("n"))
        paper["n_kind"] = kind
        paper["n_value"] = value
        paper["n_label"] = label
        e["paper"] = paper
        counts[kind] += 1
    return counts


def assign_edge_ids(edges):
    """Give every row a stable unique id.

    The page identified a row by behavior + marker + DOI, which is not unique: eight pairs
    of rows share all three because one paper reported opposing findings on one marker -
    vitamin D daily versus bolus, vitamin C in the general population versus under heavy
    exertion, saffron on a self-rated versus a clinician-rated scale. Those pairs are among
    the most valuable rows in the dataset, and clicking either of them opened the other
    one's study panel. The direction and effect distinguish them, so a short digest of
    those is appended; it stays stable as long as the row's own content does.
    """
    for e in edges:
        base = f"{e.get('behavior_id')}::{e.get('marker_id')}::{(e.get('paper') or {}).get('doi', '')}"
        e["legacy_key"] = base
        stamp = f"{e.get('direction')}|{(e.get('effect') or '')[:80]}"
        e["edge_id"] = base + "::" + hashlib.sha1(stamp.encode("utf-8")).hexdigest()[:8]

    seen = {}
    for e in edges:
        seen[e["edge_id"]] = seen.get(e["edge_id"], 0) + 1
    clashes = [k for k, n in seen.items() if n > 1]
    for k in clashes:
        print(f"  WARNING: edge id still not unique after hashing: {k}")
    return len(clashes)


def apply_paper_status(edges):
    """Attach PubMed correction notices to every row citing an affected paper.

    One extracting agent happened to notice an Expression of Concern and wrote it into a
    caveat. Noticing by chance is not coverage, so scripts/check_retractions.py now queries
    PubMed for the whole corpus and this attaches whatever it found. A retraction or a
    concern is loud; a plain erratum is quieter but still worth a reader knowing, because
    the number on the row may be the one that was corrected.
    """
    path = SRC / "_paper_status.json"
    if not path.exists():
        return 0
    with path.open(encoding="utf-8") as fh:
        flags = (json.load(fh).get("by_doi") or {})

    LOUD = {"retracted", "expression_of_concern", "corrected_and_republished"}
    touched = 0
    for e in edges:
        doi = (e.get("paper") or {}).get("doi")
        hit = flags.get(doi)
        if not hit:
            continue
        kinds = sorted({x["kind"] for x in hit})
        e["paper_notices"] = kinds
        e["paper_notice_detail"] = "; ".join(x.get("note", "") for x in hit if x.get("note"))
        e["paper_notice_serious"] = any(k in LOUD for k in kinds)
        touched += 1
    return touched


def refile_edges(edges):
    """Move rows that were attached to the wrong behaviour node."""
    path = SRC / "_verification_overrides.json"
    if not path.exists():
        return 0
    with path.open(encoding="utf-8") as fh:
        entries = json.load(fh).get("overrides", [])

    moves = [o for o in entries if o.get("refile_to")]
    if not moves:
        return 0

    done = 0
    for o in moves:
        for e in edges:
            if (e.get("behavior_id") != o.get("behavior_id")
                    or e.get("marker_id") != o.get("marker_id")):
                continue
            # A behaviour can hold several rows on one marker, which is how the defect
            # arose in the first place, so the move is pinned to the row's own quote.
            if o.get("match") and o["match"] not in (e.get("verbatim") or ""):
                continue
            e["refiled_from"] = e["behavior_id"]
            e["behavior_id"] = o["refile_to"]
            if o.get("review_note"):
                e["review_note"] = o["review_note"]
            e["verified_note_source"] = o.get("source", "verification")
            done += 1
    return done


def apply_verification_overrides(edges):
    """Apply findings from the independent verification pass.

    The verifiers were forbidden from editing the data they reviewed, so their findings
    live in a separate file and are applied here. This keeps the extraction files as the
    extractors wrote them, makes every correction traceable to the report it came from,
    and means a defect surfaces on the page rather than being quietly patched away.
    """
    path = SRC / "_verification_overrides.json"
    if not path.exists():
        return 0
    with path.open(encoding="utf-8") as fh:
        entries = json.load(fh).get("overrides", [])

    index = {}
    for e in edges:
        index.setdefault((e.get("behavior_id"), e.get("marker_id")), []).append(e)

    applied = 0
    for o in entries:
        targets = index.get((o.get("behavior_id"), o.get("marker_id")), [])
        if not targets:
            print(f"  WARNING: override targets a missing edge: "
                  f"{o.get('behavior_id')} -> {o.get('marker_id')}")
            continue
        for e in targets:
            if "when_direction" in o and e.get("direction") != o["when_direction"]:
                continue
            # A behaviour and marker can name several rows from different papers. Where the
            # correction belongs to one of them, it is pinned to that row's own quote - the
            # two alcohol mortality rows differ in exactly this way, and without the pin a
            # correction meant for one of them silently rewrote both.
            if o.get("match") and o["match"] not in (e.get("verbatim") or ""):
                continue
            for k, v in (o.get("flags") or {}).items():
                e[k] = v
            # A tier correction is a real change to what the row claims, so the original
            # is preserved beside it: the page shows both, not a quietly rewritten value.
            if o.get("evidence_tier") and o["evidence_tier"] != e.get("evidence_tier"):
                e["tier_corrected_from"] = e.get("evidence_tier")
                e["evidence_tier"] = o["evidence_tier"]
            if o.get("tier_note"):
                e["tier_note"] = o["tier_note"]
            for field in ("quote_note", "coi_note", "review_note"):
                if o.get(field):
                    e[field] = o[field]
            # A sample-size badge is the row's loudest number and the easiest to get
            # wrong: a study count printed as people, or a trial's overall n attached to
            # an outcome only a fifth of it measured. A verified correction replaces the
            # badge and keeps what it replaced, so the page can say it was corrected
            # rather than pretending it was always right.
            if o.get("sample"):
                paper = e.setdefault("paper", {})
                e["n_corrected_from"] = paper.get("n_label") or paper.get("n")
                paper.update(o["sample"])
                # The parsed numeric form has to follow the correction, or the row
                # carries the old figure everywhere except the badge.
                if isinstance(o["sample"].get("n"), int):
                    paper["n_value"] = o["sample"]["n"]
            # A direction recorded as "improved" rather than "the number rose" inverts the
            # verdict on every symptom score. Correcting it keeps the old value beside it.
            if o.get("direction") and o["direction"] != e.get("direction"):
                e["direction_corrected_from"] = e.get("direction")
                e["direction"] = o["direction"]
            if o.get("up_is_good") is not None:
                e["up_is_good"] = o["up_is_good"]
            for field in ("conditional_on", "population"):
                if o.get(field):
                    e[field + "_corrected_from"] = e.get(field)
                    e[field] = o[field]
            e["verified_note_source"] = o.get("source", "verification")
            applied += 1
    return applied


def check_quote_integrity(edges):
    """Flag quotes that elide their own content.

    A `verbatim` containing "..." is not a copied sentence; it is a reconstruction with
    the inconvenient parts removed. The numbers may still check out while the claim the
    sentence actually made has been edited away, so this is tracked separately from the
    numeric check.
    """
    flagged = 0
    for e in edges:
        v = e.get("verbatim") or ""
        if "..." in v or "…" in v or "[...]" in v:
            e["quote_elided"] = True
            flagged += 1
        else:
            e.pop("quote_elided", None)
    return flagged


# What each outcome of the contiguity check does to a row. The check names five
# outcomes and they do not collapse into two: an earlier version tested for one of them
# and swept the rest into a single else, which handed the four least contiguous quotes in
# the corpus the reassuring "quoted from the full text" note and excused them the
# penalty - the exact inversion of what they had earned.
VERBATIM_ACTION = {
    "near": (None, None),
    "spliced": ("quote_spliced", None),
    "unmatched": ("quote_spliced", "unmatched"),
    "no_numbers": ("quote_spliced", "no_numbers"),
    "beyond_abstract": ("quote_beyond_abstract", None),
}


def apply_verbatim_status(edges):
    """Carry the contiguity check onto the rows, keeping its distinctions intact.

    scripts/check_verbatim.py measures whether each quoted sentence appears in its
    paper's abstract as one unbroken run and names what a failure means. A sentence whose
    every figure is in the abstract but whose words will not run contiguously was
    assembled out of parts; a sentence whose figures are absent was quoted from the full
    text, which is ordinary practice and no fault. Those two get opposite treatment, so
    the mapping above is explicit and a new outcome from the checker raises a KeyError
    here rather than being silently filed under whichever branch happens to be last.

    This runs BEFORE the verification overrides on purpose. A check that cannot read the
    full text will flag quotes that a person has read the full text and cleared, and when
    that happens the person is right. Running first means an override can set the flag
    back to false and have it stick.
    """
    if not VERBATIM_STATUS.exists():
        return 0, 0
    with VERBATIM_STATUS.open(encoding="utf-8") as fh:
        flagged = (json.load(fh).get("flagged") or {})

    spliced = beyond = 0
    for e in edges:
        for key in ("quote_spliced", "quote_spliced_coverage", "quote_beyond_abstract",
                    "quote_beyond_abstract_coverage", "quote_check_kind"):
            e.pop(key, None)
        entry = flagged.get(e.get("edge_id") or "")
        # A row carrying an ellipsis already declares its own elision; a second badge on
        # top of it says nothing new.
        if not entry or e.get("quote_elided"):
            continue
        field, detail = VERBATIM_ACTION[entry["kind"]]
        if not field:
            continue
        # The flag is a boolean. Storing the coverage here meant a quote with no overlap
        # at all scored 0.0, read as false, and silently lost the badge it most deserved.
        e[field] = True
        e[field + "_coverage"] = entry.get("coverage")
        if detail:
            e["quote_check_kind"] = detail
        if field == "quote_spliced":
            spliced += 1
        else:
            beyond += 1
    return spliced, beyond


def check_number_support(edges):
    """Every decimal in `effect` must appear in that edge's own `verbatim`.

    This is the one integrity property a reader cannot check at a glance and the one
    the whole page rests on. Edges that fail are not dropped - they are marked, and
    the UI says so on the row.
    """
    flagged = 0
    for e in edges:
        missing = sorted(_decimals(e.get("effect")) - _decimals(e.get("verbatim")),
                         key=float)
        if missing:
            e["unsupported_numbers"] = missing
            flagged += 1
        else:
            e.pop("unsupported_numbers", None)
    return flagged


def load_sources():
    files = sorted(SRC.glob("goal-*.json"))
    if not files:
        sys.exit(f"No research files found in {SRC}")
    for path in files:
        with path.open(encoding="utf-8") as fh:
            yield path, json.load(fh)


def merge():
    goals, markers, behaviors = {}, {}, {}
    edges, cut = [], []
    problems, warnings = [], []
    goal_labels = {}

    for path, data in load_sources():
        nodes = data.get("nodes", {})
        # Extractors placed the goal node in three different spots across the three files:
        # nodes.goals[], a top-level "goal" object, or nowhere at all. Accept all of them.
        goal_nodes = list(nodes.get("goals", []))
        top_goal = data.get("goal")
        if isinstance(top_goal, dict) and top_goal.get("id"):
            goal_nodes.append(top_goal)
        for g in goal_nodes:
            goals.setdefault(g["id"], g)
        for m in nodes.get("markers", []):
            # A marker shared by two goals must keep both goal_ids, not the last one written.
            if m["id"] in markers:
                merged = set(markers[m["id"]].get("goal_ids", [])) | set(m.get("goal_ids", []))
                markers[m["id"]]["goal_ids"] = sorted(merged)
            else:
                markers[m["id"]] = dict(m)
        for b in nodes.get("behaviors", []):
            behaviors.setdefault(b["id"], b)

        for e in data.get("edges", []):
            e["behavior_id"] = MERGE_BEHAVIORS.get(e["behavior_id"], e["behavior_id"])
        edges.extend(data.get("edges", []))

        # Fallback label for a goal whose node the extractor forgot to write.
        meta_goal = (data.get("_meta") or {}).get("goal")
        if meta_goal:
            label = meta_goal.split(" - ", 1)[-1].strip()
            for m in nodes.get("markers", []):
                for gid in m.get("goal_ids", []):
                    goal_labels.setdefault(gid, label)

        for key in CUT_KEYS:
            for entry in data.get(key, []) or []:
                cut.append({
                    "label": entry.get("label") or entry.get("candidate") or "",
                    "reason": entry.get("reason", ""),
                    "goal": data.get("_meta", {}).get("goal", path.stem),
                })

    # A row can be filed under the wrong behaviour, and when it is, nothing else notices:
    # the row is internally consistent, its numbers check out, its sign is computed
    # correctly from the direction it states. It is simply attached to the wrong thing. The
    # mortality row for quitting smoking sat under "Cigarette smoking", so a finding that
    # quitters gain ten years of life rendered as a green favourable mark on smoking.
    #
    # This runs before the integrity check so a refiled row is validated against the node it
    # ends up on, not the one it came from.
    refiled = refile_edges(edges)

    # Integrity: every edge must resolve, and carry the fields the page depends on.
    for e in edges:
        for field in REQUIRED_EDGE_FIELDS:
            if not e.get(field):
                problems.append(f"edge {e.get('behavior_id')} -> {e.get('marker_id')}: missing {field}")
        if e.get("behavior_id") not in behaviors:
            problems.append(f"dangling behavior_id: {e.get('behavior_id')}")
        if e.get("marker_id") not in markers:
            problems.append(f"dangling marker_id: {e.get('marker_id')}")
        doi = (e.get("paper") or {}).get("doi")
        if not doi:
            problems.append(f"edge {e.get('behavior_id')} -> {e.get('marker_id')}: no DOI")

    # Some extraction agents omit the goal node itself while still tagging their markers
    # with its id. Synthesise the node from the file's own _meta.goal rather than failing
    # the whole merge; the name comes from the source file, nothing is invented.
    for m in markers.values():
        for gid in m.get("goal_ids", []):
            if gid in goals:
                continue
            label = goal_labels.get(gid)
            if label:
                goals[gid] = {"id": gid, "name": label, "definition": ""}
                warnings.append(f"synthesised missing goal node {gid} as '{label}'")
            else:
                problems.append(f"marker {m['id']} points at unknown goal {gid}")

    if warnings:
        print("WARNINGS:")
        for w in warnings:
            print("  -", w)

    if problems:
        print("INTEGRITY PROBLEMS:")
        for p in problems:
            print("  -", p)
        sys.exit(1)

    # Figure/passage enrichment files are keyed by DOI and shared across edges.
    figures_by_doi = {}
    for path in sorted(SRC.glob("goal-*-figures.json")):
        with path.open(encoding="utf-8") as fh:
            for doi, entry in (json.load(fh).get("by_doi") or {}).items():
                figures_by_doi[doi.replace("https://doi.org/", "")] = entry

    for dup in MERGE_BEHAVIORS:
        behaviors.pop(dup, None)

    dropped = 0
    for bid, reason in DROP_BEHAVIORS.items():
        node = behaviors.pop(bid, None)
        gone = [e for e in edges if e.get("behavior_id") == bid]
        if not gone:
            continue
        edges[:] = [e for e in edges if e.get("behavior_id") != bid]
        dropped += len(gone)
        # It leaves the explorer but not the record: the page lists what was considered
        # and set aside, and silently vanishing rows is how a dataset stops being auditable.
        cut.append({
            "label": (node or {}).get("name", bid),
            "reason": reason,
            "goal": "removed from the explorer",
        })

    unsupported = check_number_support(edges)
    elided = check_quote_integrity(edges)
    # Overrides run after every automated check, in both directions: a human-verified
    # defect must not be erased by a check that could not detect it, and a flag a person
    # has read the full text and cleared must not be raised again by a check that only
    # ever saw the abstract.
    sample_counts = assign_sample_sizes(edges)
    clashes = assign_edge_ids(edges)
    notices = apply_paper_status(edges)
    spliced, beyond = apply_verbatim_status(edges)
    overridden = apply_verification_overrides(edges)
    # An override may have cleared a flag the automated check raised, so the
    # counts are recomputed from the rows as they finally stand.
    spliced = sum(1 for e in edges if e.get("quote_spliced"))
    unsupported = sum(1 for e in edges if e.get("unsupported_numbers"))
    beyond = sum(1 for e in edges if e.get("quote_beyond_abstract"))
    elided = sum(1 for e in edges if e.get("quote_elided"))
    # Usefulness runs last: it reads the quality flags and the overrides above.
    # A goal whose rows have not been extracted yet leaves a skeleton behind (goal node and
    # markers, no edges). Rendering it as an empty section implies the literature was
    # searched and nothing survived, which is a different and much stronger claim than
    # "not done yet". Drop such goals until they carry rows.
    live_markers = {e.get("marker_id") for e in edges}
    empty_goals = []
    for gid in list(goals):
        has_rows = any(gid in (m.get("goal_ids") or []) and m["id"] in live_markers
                       for m in markers.values())
        if not has_rows:
            empty_goals.append(goals[gid].get("name", gid))
            del goals[gid]
    if empty_goals:
        print("  goals held back (no rows extracted yet): " + ", ".join(empty_goals))
    for m in list(markers):
        markers[m]["goal_ids"] = [g for g in (markers[m].get("goal_ids") or []) if g in goals]
        # A marker with no rows left is dropped whether or not it still names a goal.
        # Dropping the two prescription-drug behaviours emptied one, and the page would
        # otherwise have rendered a marker heading under which nothing was measured -
        # which reads as "searched and found nothing" rather than "nothing here".
        if m not in live_markers:
            del markers[m]

    valence_counts = assign_valence(edges, markers)
    tier_counts = assign_usefulness(edges, markers)

    for e in edges:
        tag = EVIDENCE_TAG.get(e.get("evidence_tier"))
        if tag:
            e["evidence_tag"] = tag[0]
            e["evidence_label"] = tag[1]

    for b in behaviors.values():
        grp = group_of(b)
        b["group"] = grp
        b["group_label"] = GROUP_LABEL.get(grp, grp)
        b["group_rank"] = [g for g, _ in GROUP_ORDER].index(grp) if grp in GROUP_LABEL else 99

        fam = family_of(b.get("name"))
        if fam:
            b["family"] = fam
            b["family_label"] = FAMILY_LABEL.get(fam, fam)

    out = {
        "figures_by_doi": figures_by_doi,
        "nodes": {
            "goals": ordered_goals(goals),
            "markers": list(markers.values()),
            "behaviors": list(behaviors.values()),
        },
        "edges": edges,
        "cut": cut,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)

    nulls = sum(1 for e in edges if e.get("direction") is None)
    papers = {(e.get("paper") or {}).get("doi") for e in edges}
    print(f"wrote {OUT}")
    print(f"  goals {len(goals)}  markers {len(markers)}  behaviors {len(behaviors)}")
    figs = sum(len(v.get("figures") or []) for v in figures_by_doi.values())
    print(f"  edges {len(edges)}  null-result edges {nulls}  papers {len(papers)}  cut {len(cut)}")
    print(f"  enriched papers {len(figures_by_doi)}  figures {figs}")

    # Report cross-goal leverage per family: the article's whole thesis.
    fam_goals = {}
    marker_goals = {m["id"]: m.get("goal_ids", []) for m in markers.values()}
    for e in edges:
        fam = behaviors.get(e["behavior_id"], {}).get("family") or e["behavior_id"]
        fam_goals.setdefault(fam, set()).update(marker_goals.get(e["marker_id"], []))
    multi = {f: g for f, g in fam_goals.items() if len(g) > 1}
    print(f"  edges whose effect numbers are not all in their own quote: {unsupported}")
    print(f"  edges with a quote-integrity flag: {elided}")
    print(f"  edges whose quote is not contiguous in the abstract: {spliced}")
    print(f"  edges quoted from beyond the abstract: {beyond}")
    print(f"  verification overrides applied: {overridden}")
    print(f"  rows refiled onto a different behaviour: {refiled}")
    print(f"  rows dropped as prescription drugs: {dropped}")
    serious = sum(1 for e in edges if e.get("paper_notice_serious"))
    print(f"  duplicate edge ids remaining: {clashes}")
    print(f"  sample size parsed: participants {sample_counts['participants']}, "
          f"study counts {sample_counts['studies']}, not recorded {sample_counts['unknown']}")
    print(f"  rows citing a paper with a PubMed correction notice: {notices} "
          f"(of which retraction or concern: {serious})")
    gcount = {}
    for b in behaviors.values():
        gcount[b["group"]] = gcount.get(b["group"], 0) + 1
    print("  behavior groups: " +
          "  ".join(f"{GROUP_LABEL[g]}={gcount.get(g, 0)}" for g, _ in GROUP_ORDER if gcount.get(g)))

    print("  valence: " + "  ".join(
        f"{k}={valence_counts.get(k, 0)}" for k in ["good", "bad", "unclear", "none"]))

    order = ["S", "A", "B", "C", "D", "E", "NULL"]
    print("  usefulness tiers: " +
          "  ".join(f"{t}={tier_counts.get(t, 0)}" for t in order if tier_counts.get(t)))
    print(f"  families spanning >1 goal: {len(multi)}")
    for f, g in sorted(multi.items(), key=lambda kv: -len(kv[1])):
        print(f"    {FAMILY_LABEL.get(f, behaviors.get(f, {}).get('name', f))}: {len(g)} goals")


if __name__ == "__main__":
    merge()
