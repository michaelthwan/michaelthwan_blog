"""Audit the merged health-evidence dataset for defects the merge step does not catch.

The merge script enforces referential integrity and refuses to write a broken graph. This
one looks for the quieter problems: duplicated nodes, mislabelled families, orphaned rows,
metadata that disagrees with itself. It never edits anything - it reports and exits
non-zero so it can gate a build.

Usage:  python scripts/audit_health_evidence.py
"""

import collections
import json
import re
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "astro-blog" / "public" / "data" / "health-evidence.json"
PUBLIC = ROOT / "astro-blog" / "public"

problems = []
notes = []


def problem(kind, detail):
    problems.append(f"[{kind}] {detail}")


def note(kind, detail):
    notes.append(f"[{kind}] {detail}")


def main():
    with DATA.open(encoding="utf-8") as fh:
        d = json.load(fh)

    behaviors = {b["id"]: b for b in d["nodes"]["behaviors"]}
    markers = {m["id"]: m for m in d["nodes"]["markers"]}
    goals = {g["id"]: g for g in d["nodes"]["goals"]}
    edges = d["edges"]
    figures = d.get("figures_by_doi") or {}

    # --- duplicate nodes -------------------------------------------------
    by_name = collections.defaultdict(list)
    for b in behaviors.values():
        by_name[b["name"].strip().lower()].append(b["id"])
    for name, ids in by_name.items():
        if len(ids) > 1:
            problem("duplicate-behavior", f'"{name}" exists as {ids}')

    by_marker_name = collections.defaultdict(list)
    for m in markers.values():
        by_marker_name[m["name"].strip().lower()].append(m["id"])
    for name, ids in by_marker_name.items():
        if len(ids) > 1:
            note("duplicate-marker-name", f'"{name[:50]}" as {ids}')

    # --- orphans ---------------------------------------------------------
    used_b = {e["behavior_id"] for e in edges}
    used_m = {e["marker_id"] for e in edges}
    for bid in behaviors:
        if bid not in used_b:
            problem("orphan-behavior", f"{bid} has no rows but is still rendered")
    for mid in markers:
        if mid not in used_m:
            problem("orphan-marker", f"{mid} has no rows")
    for gid, g in goals.items():
        if not any(gid in (m.get("goal_ids") or []) for m in markers.values()):
            problem("orphan-goal", f'{gid} ("{g.get("name")}") has no markers')

    # --- duplicate rows --------------------------------------------------
    # One paper legitimately produces two rows on one marker when it reports opposing
    # findings - saffron significant on the self-rated BDI and null on the clinician-rated
    # HDRS, smoking harm alongside cessation benefit. Those differ in direction or effect
    # and are content, not duplication. Only rows identical in both are real duplicates.
    seen = collections.Counter()
    for e in edges:
        seen[(e["behavior_id"], e["marker_id"], (e.get("paper") or {}).get("doi"),
              str(e.get("direction")), (e.get("effect") or "").strip())] += 1
    for key, n in seen.items():
        if n > 1:
            problem("duplicate-edge", f"{key[0]} -> {key[1]} cited to {key[2]} appears {n} times identically")

    pairs = collections.defaultdict(list)
    for e in edges:
        pairs[(e["behavior_id"], e["marker_id"], (e.get("paper") or {}).get("doi"))].append(e)
    for key, group in pairs.items():
        if len(group) > 1 and not any(g.get("conditional_on") for g in group):
            problem("indistinguishable-rows",
                    f"{key[0]} -> {key[1]} has {len(group)} rows from one paper and no conditional_on to tell them apart")

    # --- family and group sanity ----------------------------------------
    # A family exists to group one real-world exposure. If a family spans behaviours from
    # two different presentation groups, one of them is probably mis-matched by a name rule.
    fam_groups = collections.defaultdict(set)
    for b in behaviors.values():
        if b.get("family"):
            fam_groups[b["family"]].add(b.get("group_label"))
    # A family spanning groups is only suspicious when none of the groups is Medical:
    # bariatric surgery and dieting really do share the body-fat family, as do a light box
    # and morning daylight. Two non-medical groups means a name rule misfired.
    for fam, grps in fam_groups.items():
        if len(grps) > 1 and "Medical and therapeutic" not in grps:
            problem("family-crosses-groups", f"family '{fam}' spans groups {sorted(grps)}")
        elif len(grps) > 1:
            note("family-spans-medical", f"family '{fam}' spans {sorted(grps)}")

    # --- valence and tiers ----------------------------------------------
    for m in markers.values():
        if "desirable" not in m:
            problem("marker-no-desirable", f"{m['id']} was never assigned a good direction")
    unclear = {e["marker_id"] for e in edges if e.get("valence") == "unclear"}
    for mid in unclear:
        if markers.get(mid, {}).get("desirable") is not None:
            problem("valence-mismatch", f"{mid} is unclear but has a desirable direction")

    for e in edges:
        u = e.get("usefulness") or {}
        if e.get("direction") is None and u.get("tier") != "NULL":
            problem("tier-on-null", f"{e['behavior_id']} -> {e['marker_id']} is null but tier {u.get('tier')}")
        if e.get("direction") is not None and u.get("tier") == "NULL":
            problem("null-tier-on-real", f"{e['behavior_id']} -> {e['marker_id']} has a direction but NULL tier")

    # --- citation metadata ----------------------------------------------
    doi_titles = collections.defaultdict(set)
    for e in edges:
        p = e.get("paper") or {}
        if p.get("doi"):
            doi_titles[p["doi"]].add((p.get("title") or "").strip().lower())
    for doi, titles in doi_titles.items():
        if len(titles) > 1:
            problem("doi-title-conflict", f"{doi} carries {len(titles)} different titles")

    for e in edges:
        p = e.get("paper") or {}
        if not p.get("doi"):
            problem("no-doi", f"{e['behavior_id']} -> {e['marker_id']}")
        if not e.get("verbatim"):
            problem("no-verbatim", f"{e['behavior_id']} -> {e['marker_id']}")
        if e.get("direction") is not None and not e.get("effect"):
            problem("no-effect", f"{e['behavior_id']} -> {e['marker_id']} has a direction but no effect")

    # --- figures ---------------------------------------------------------
    for doi, entry in figures.items():
        for f in entry.get("figures") or []:
            lp = (f.get("local_path") or "").lstrip("/")
            path = PUBLIC / lp
            if not lp or not path.exists() or path.stat().st_size == 0:
                problem("missing-figure", f"{doi} -> {f.get('local_path')}")
            if not f.get("caption"):
                problem("figure-no-caption", f"{doi} -> {f.get('label')}")

    referenced = {(f.get("local_path") or "").lstrip("/")
                  for entry in figures.values() for f in (entry.get("figures") or [])}
    img_dir = PUBLIC / "img" / "health-evidence"
    if img_dir.exists():
        for p in img_dir.iterdir():
            rel = f"img/health-evidence/{p.name}"
            if rel not in referenced and "thumbnail" not in rel:
                note("unused-image", rel)

    # --- a row whose own sentence contradicts its colour ------------------
    #
    # `direction` means the marker's NUMBER moved, not that things got better. An
    # extraction that reads "+" as "improved" inverts the verdict on every symptom score,
    # and that is invisible in the data - the row is internally consistent, it is just
    # wrong. Six rows shipped red that were findings of benefit (NMN on PSQI, and five
    # attention rows) before a reader spotted one of them.
    #
    # This cannot be decided mechanically, so it reports as a note. Anything listed here
    # needs a human to read the effect sentence and say which way the number went.
    GOOD_WORDS = re.compile(r"\b(improv\w+|benefit\w*|better|protect\w+|favour\w+|"
                            r"favor\w+|alleviat\w+|relief)\b", re.I)
    BAD_WORDS = re.compile(r"\b(worse|worsen\w*|impair\w+|harm\w*|detriment\w+|"
                           r"deteriorat\w+)\b", re.I)
    for e in edges:
        if e.get("direction") is None or e.get("valence_reviewed"):
            continue
        text = " ".join(x for x in (e.get("effect"), e.get("verbatim")) if x)
        says_good = bool(GOOD_WORDS.search(text)) and not BAD_WORDS.search(text)
        says_bad = bool(BAD_WORDS.search(text)) and not GOOD_WORDS.search(text)
        if says_good and e.get("valence") == "bad":
            note("valence-reads-wrong",
                 f'{e["behavior_id"]} -> {e["marker_id"]} is tagged unfavourable but its '
                 f'effect sentence describes a benefit')
        elif says_bad and e.get("valence") == "good":
            note("valence-reads-wrong",
                 f'{e["behavior_id"]} -> {e["marker_id"]} is tagged favourable but its '
                 f'effect sentence describes a harm')

    # --- one behaviour holding both a favourable and an unfavourable row ---
    #
    # On the same marker, that is usually not a disagreement between papers - it is a row
    # filed under the wrong behaviour. The mortality finding for QUITTING smoking sat under
    # smoking, so smoking carried a green favourable mark on all-cause mortality next to its
    # own red one. Cheap to check and it caught the real thing.
    signs = collections.defaultdict(set)
    for e in edges:
        if e.get("valence") in ("good", "bad"):
            signs[(e["behavior_id"], e["marker_id"])].add(e["valence"])
    for (bid, mid), seen in sorted(signs.items()):
        if len(seen) > 1:
            problem("valence-split",
                    f'{bid} -> {mid} holds both a favourable and an unfavourable row; '
                    f'check whether one of them belongs to a different behaviour')

    # --- a row whose text is about a different behaviour than its node ----
    #
    # The counterpart of the above, for cases where the signs happen not to clash. A row
    # under "smoking" whose sentence is about cessation is filed wrong whichever way its
    # sign came out.
    OPPOSITES = [
        ("smoking", ("cessation", "quitting", "quit smoking", "who had quit", "ex-smoker")),
        ("alcohol", ("abstinence", "abstainer", "stopped drinking")),
        ("sedentary", ("breaking up sitting", "interrupting sitting")),
    ]
    for e in edges:
        bid = e.get("behavior_id", "")
        text = " ".join(x for x in (e.get("effect"), e.get("verbatim")) if x).lower()
        for stem, words in OPPOSITES:
            if not bid.startswith(stem) or "cessation" in bid or "abstin" in bid:
                continue
            hit = [w for w in words if w in text]
            if hit:
                note("row-may-be-misfiled",
                     f'{bid} -> {e["marker_id"]} is filed under {stem} but its text mentions '
                     f'{hit[0]!r}; check which behaviour the finding belongs to')

    # --- report ----------------------------------------------------------
    print(f"audited {len(edges)} edges, {len(behaviors)} behaviours, "
          f"{len(markers)} markers, {len(goals)} goals")
    if notes:
        print(f"\n{len(notes)} note(s):")
        for n in notes[:40]:
            print("  ", n)
    if problems:
        print(f"\n{len(problems)} PROBLEM(S):")
        for p in problems:
            print("  ", p)
        sys.exit(1)
    print("\nno problems found")


if __name__ == "__main__":
    main()
