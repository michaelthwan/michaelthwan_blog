"""Merge the per-goal literature extractions into the dataset the explorer fetches.

Each research file is written independently by its own extraction agent, so they disagree
on small things: the cut list lives under a different key in each, marker ids may collide
across goals, and node lists repeat. This script normalises all of that and fails loudly
rather than shipping a graph with dangling references.

Usage:  python scripts/merge_health_evidence.py
"""

import json
import re
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "superpowers" / "research"
OUT = ROOT / "astro-blog" / "public" / "data" / "health-evidence.json"

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
    ("exercise", "exercise"),
    ("resistance training", "exercise"),
    ("physical activity", "exercise"),
    ("training", "exercise"),
    ("step count", "exercise"),
    ("steps", "exercise"),
    ("fitness", "exercise"),
    ("stress", "stress"),
    ("light", "light"),
    ("curcumin", "curcumin"),
]

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
    ("training", "exercise"),
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
    ("supplement", "Supplements"),
    ("medical", "Medical and therapeutic"),
    ("mind", "Mind and social"),
    ("environment", "Environment and exposure"),
]

GROUP_LABEL = dict(GROUP_ORDER)


def group_of(behavior):
    low = (behavior.get("name") or "").lower()
    for needle, grp in GROUP_RULES:
        if needle in low:
            return grp
    return CATEGORY_GROUP.get(behavior.get("category"), "mind")


def family_of(name):
    low = (name or "").lower()
    for needle, fam in FAMILY_RULES:
        if needle in low:
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
    "vaccine_antibody_response": "+",
    "bmd": "+",
    # Genuinely directionless on their own - no claim is made for these.
    "cortisol": None,                     # mixes diurnal slope with awakening response
    "m_dlmo": None,                       # a phase shift is neither good nor bad without context
    "processing_speed": None,             # sources encode it as time, others as speed
    "rmr": None,
    "hepatic_insulin_sensitivity": None,  # sources mix a sensitivity index with HOMA-IR
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
        want = marker.get("desirable")
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
            pts = 2.0 if rank >= 0.667 else (1.0 if rank >= 0.333 else 0.0)
            score += pts
            why.append(f"effect size ranks {round(rank * 100)}th percentile among the "
                       f"{len(peers)} scored rows on this marker (+{pts:g})")
        elif mag is not None:
            score += 1.0
            why.append("only scored row on this marker, so no relative ranking (+1)")
        else:
            why.append("no numeric effect to rank (+0)")

        if e.get("conditional_on"):
            score -= 0.5
            why.append("the finding is conditional on a specific population (-0.5)")
        if e.get("unsupported_numbers") or e.get("quote_elided"):
            score -= 0.5
            why.append("a quote-integrity flag is open on this row (-0.5)")
        if e.get("coi_note"):
            score -= 0.5
            why.append("an author has a stake in the result (-0.5)")

        tier = ("S" if score >= 4.5 else "A" if score >= 3.5 else "B" if score >= 2.5
                else "C" if score >= 1.5 else "D" if score >= 0.5 else "E")
        e["usefulness"] = {"tier": tier, "score": round(score, 2), "why": why}
        counts[tier] = counts.get(tier, 0) + 1

    return counts


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
            for k, v in (o.get("flags") or {}).items():
                e[k] = v
            # A tier correction is a real change to what the row claims, so the original
            # is preserved beside it: the page shows both, not a quietly rewritten value.
            if o.get("evidence_tier") and o["evidence_tier"] != e.get("evidence_tier"):
                e["tier_corrected_from"] = e.get("evidence_tier")
                e["evidence_tier"] = o["evidence_tier"]
            if o.get("tier_note"):
                e["tier_note"] = o["tier_note"]
            for field in ("quote_note", "coi_note"):
                if o.get(field):
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

    unsupported = check_number_support(edges)
    elided = check_quote_integrity(edges)
    # Overrides run last: the automated checks clear flags they cannot confirm, and a
    # human-verified defect must not be erased by a check that could not detect it.
    overridden = apply_verification_overrides(edges)
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
        if not markers[m]["goal_ids"] and m not in live_markers:
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
            "goals": list(goals.values()),
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
    print(f"  verification overrides applied: {overridden}")
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
