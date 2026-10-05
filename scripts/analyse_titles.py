"""Title-level skill analysis over data/jd/skill_matrix.json.

Metrics (definitions fixed in docs/plans/it-title-overlap-plan.md, Phase 4):
  - p(skill | title), for required and for required-or-preferred
  - signature skills: smoothed log-odds of a skill in one title vs all others
  - common core: skills above 60% (required-or-preferred) in every title
  - title similarity: cosine and Jaccard on prevalence vectors, 10x10,
    plus average-linkage hierarchical clustering on 1 - cosine
  - seniority drift: cosine of senior vs junior/mid vectors to every title
  - source sensitivity: similarity from ATS records only vs all records

Low-n rule (decided before seeing data): a title x country cell with n < 20 is
dropped from quantitative figures; 20-39 is shown with a low-n flag and blanked
in the per-country similarity matrices; >= 40 is full.

Outputs: astro-blog/public/data/title-skills.json (prevalence aggregates)
         astro-blog/public/data/title-analysis.json (everything else)
Run: python scripts/analyse_titles.py
"""

import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MATRIX = os.path.join(ROOT, "data", "jd", "skill_matrix.json")
TAXONOMY = os.path.join(HERE, "skill_taxonomy.json")
PUB = os.path.join(ROOT, "astro-blog", "public", "data")

TITLES = ["software_engineer", "fde", "data_engineer", "data_scientist",
          "ml_engineer", "ai_engineer", "mlops_engineer", "analytics_engineer",
          "data_analyst", "business_analyst"]
COUNTRIES = ["US", "CA"]
DROP_N, FULL_N = 20, 40
CORE_P = 0.60
PRIOR = 10.0  # pseudo-JDs at the pooled base rate, for the log-odds prior


def cell_status(n):
    return "dropped" if n < DROP_N else ("low_n" if n < FULL_N else "full")


def prevalence(rows, skills, mode):
    """mode 'req' counts required only; 'any' counts required or preferred."""
    n = len(rows)
    cnt = dict.fromkeys(skills, 0)
    for r in rows:
        got = set(r["required"]) if mode == "req" else set(r["required"]) | set(r["preferred"])
        for s in got:
            if s in cnt:
                cnt[s] += 1
    return n, cnt


def vec(cnt, n, skills):
    return [cnt[s] / n if n else 0.0 for s in skills]


def cosine(a, b):
    num = sum(x * y for x, y in zip(a, b))
    da = math.sqrt(sum(x * x for x in a))
    db = math.sqrt(sum(y * y for y in b))
    return num / (da * db) if da and db else None


def weighted_jaccard(a, b):
    num = sum(min(x, y) for x, y in zip(a, b))
    den = sum(max(x, y) for x, y in zip(a, b))
    return num / den if den else None


def logit(p):
    return math.log(p / (1 - p))


def signatures(rows_by_title, skills, top=12):
    """Smoothed log-odds ratio of each skill in title t vs every other title,
    with a pooled-rate prior worth PRIOR JDs on each side, plus a z-score."""
    all_rows = [r for t in TITLES for r in rows_by_title[t]]
    n_all, c_all = prevalence(all_rows, skills, "any")
    out = {}
    for t in TITLES:
        n_t, c_t = prevalence(rows_by_title[t], skills, "any")
        if not n_t:
            continue
        res = []
        for s in skills:
            p0 = (c_all[s] + 0.5) / (n_all + 1.0)
            y_t, y_r = c_t[s], c_all[s] - c_t[s]
            n_r = n_all - n_t
            a_t, b_t = y_t + PRIOR * p0, n_t - y_t + PRIOR * (1 - p0)
            a_r, b_r = y_r + PRIOR * p0, n_r - y_r + PRIOR * (1 - p0)
            lor = math.log(a_t / b_t) - math.log(a_r / b_r)
            z = lor / math.sqrt(1 / a_t + 1 / b_t + 1 / a_r + 1 / b_r)
            res.append({"skill": s, "log_odds": round(lor, 3), "z": round(z, 2),
                        "p_title": round(y_t / n_t, 3), "p_rest": round(y_r / max(1, n_r), 3)})
        res.sort(key=lambda d: -d["log_odds"])
        out[t] = [d for d in res if d["z"] >= 1.96][:top]
    return out


def similarity(vectors):
    names = [t for t in TITLES if t in vectors]
    cos = [[round(cosine(vectors[a], vectors[b]), 4) for b in names] for a in names]
    jac = [[round(weighted_jaccard(vectors[a], vectors[b]), 4) for b in names] for a in names]
    return names, cos, jac


def cluster(names, cos):
    """Average-linkage agglomerative clustering on distance 1 - cosine.
    Returns merge steps (left, right, distance) in order, leaves as names."""
    d = {(i, j): 1 - cos[i][j] for i in range(len(names)) for j in range(len(names))}
    clusters = {i: [i] for i in range(len(names))}
    label = {i: names[i] for i in range(len(names))}
    steps, nxt = [], len(names)
    while len(clusters) > 1:
        keys = sorted(clusters)
        best = None
        for x in range(len(keys)):
            for y in range(x + 1, len(keys)):
                a, b = clusters[keys[x]], clusters[keys[y]]
                dist = sum(d[(i, j)] for i in a for j in b) / (len(a) * len(b))
                if best is None or dist < best[0]:
                    best = (dist, keys[x], keys[y])
        dist, ka, kb = best
        steps.append({"left": label[ka], "right": label[kb], "distance": round(dist, 4),
                      "members": sorted(names[i] for i in clusters[ka] + clusters[kb])})
        clusters[nxt] = clusters.pop(ka) + clusters.pop(kb)
        label[nxt] = "c%d" % nxt
        nxt += 1
    return steps


def pearson(xs, ys):
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy)


def main():
    with open(MATRIX, encoding="utf-8") as f:
        matrix = json.load(f)
    with open(TAXONOMY, encoding="utf-8") as f:
        tax = json.load(f)
    skills = [s["id"] for s in tax["skills"]]
    meta = {s["id"]: {"label": s["label"], "group": s["group"]} for s in tax["skills"]}
    rows = matrix["rows"]

    by_title = {t: [r for r in rows if r["title"] == t] for t in TITLES}

    # Cell sizes and status.
    cells = {}
    for t in TITLES:
        for c in COUNTRIES:
            sub = [r for r in by_title[t] if r["country"] == c]
            cells["%s|%s" % (t, c)] = {
                "n": len(sub), "status": cell_status(len(sub)),
                "n_linkedin": sum(r["source"] == "linkedin" for r in sub),
                "n_with_pref_section": sum(r["has_pref_section"] for r in sub)}

    # Prevalence, pooled and per country.
    prev = {}
    pooled_vec = {}
    for t in TITLES:
        n, c_req = prevalence(by_title[t], skills, "req")
        _, c_any = prevalence(by_title[t], skills, "any")
        prev[t] = {"n": n, "req": {s: round(c_req[s] / n, 4) for s in skills if n},
                   "any": {s: round(c_any[s] / n, 4) for s in skills if n}, "by_country": {}}
        pooled_vec[t] = vec(c_any, n, skills)
        for c in COUNTRIES:
            sub = [r for r in by_title[t] if r["country"] == c]
            if len(sub) < DROP_N:
                continue
            m, cc = prevalence(sub, skills, "any")
            prev[t]["by_country"][c] = {"n": m, "any": {s: round(cc[s] / m, 4) for s in skills}}

    core = [s for s in skills
            if all(prev[t]["n"] and prev[t]["any"][s] >= CORE_P for t in TITLES)]
    near_core = sorted(
        ((s, min(prev[t]["any"][s] for t in TITLES)) for s in skills),
        key=lambda x: -x[1])[:15]

    names, cos, jac = similarity(pooled_vec)
    tree = cluster(names, cos)

    per_country = {}
    for c in COUNTRIES:
        vs = {}
        for t in TITLES:
            if cells["%s|%s" % (t, c)]["status"] == "full":
                sub = [r for r in by_title[t] if r["country"] == c]
                m, cc = prevalence(sub, skills, "any")
                vs[t] = vec(cc, m, skills)
        if len(vs) >= 2:
            nm, cs, js = similarity(vs)
            per_country[c] = {"titles": nm, "cosine": cs, "jaccard": js}

    # Source sensitivity: does adding LinkedIn rows move the similarity structure?
    sens = None
    ats_vec = {}
    for t in TITLES:
        sub = [r for r in by_title[t] if r["source"] == "ats"]
        if len(sub) >= FULL_N:
            m, cc = prevalence(sub, skills, "any")
            ats_vec[t] = vec(cc, m, skills)
    common = [t for t in names if t in ats_vec]
    if len(common) >= 3:
        xs, ys = [], []
        for i, a in enumerate(common):
            for b in common[i + 1:]:
                xs.append(cosine(ats_vec[a], ats_vec[b]))
                ys.append(cosine(pooled_vec[a], pooled_vec[b]))
        sens = {"titles": common, "pairs": len(xs),
                "pearson_ats_vs_all": round(pearson(xs, ys), 4),
                "max_abs_diff": round(max(abs(x - y) for x, y in zip(xs, ys)), 4)}

    # Seniority drift: is the senior version of a title closer to its neighbours?
    drift = {}
    for t in TITLES:
        hi = [r for r in by_title[t] if r["seniority"] in ("senior", "staff_plus")]
        lo = [r for r in by_title[t] if r["seniority"] in ("junior", "mid")]
        if len(hi) < DROP_N or len(lo) < DROP_N:
            continue
        nh, ch = prevalence(hi, skills, "any")
        nl, cl = prevalence(lo, skills, "any")
        vh, vl = vec(ch, nh, skills), vec(cl, nl, skills)
        drift[t] = {"n_senior": nh, "n_junior_mid": nl,
                    "cos_to": {u: {"senior": round(cosine(vh, pooled_vec[u]), 4),
                                   "junior_mid": round(cosine(vl, pooled_vec[u]), 4)}
                               for u in TITLES if u != t}}

    os.makedirs(PUB, exist_ok=True)
    with open(os.path.join(PUB, "title-skills.json"), "w", encoding="utf-8") as f:
        json.dump({"taxonomy_version": matrix["taxonomy_version"], "skills": meta,
                   "titles": TITLES, "cells": cells, "prevalence": prev}, f)
    with open(os.path.join(PUB, "title-analysis.json"), "w", encoding="utf-8") as f:
        json.dump({"rules": {"drop_n": DROP_N, "full_n": FULL_N, "core_p": CORE_P,
                             "prior": PRIOR},
                   "common_core": core,
                   "near_core": [{"skill": s, "min_p": round(p, 4)} for s, p in near_core],
                   "signatures": signatures(by_title, skills),
                   "similarity": {"titles": names, "cosine": cos, "jaccard": jac},
                   "similarity_by_country": per_country, "clustering": tree,
                   "source_sensitivity": sens, "seniority_drift": drift}, f)

    print("cells (n, status):")
    for t in TITLES:
        print("  %-20s US %4d %-7s  CA %4d %-7s" % (
            t, cells[t + "|US"]["n"], cells[t + "|US"]["status"],
            cells[t + "|CA"]["n"], cells[t + "|CA"]["status"]))
    print("common core (>= %.0f%% in every title): %s" % (CORE_P * 100, core or "none"))
    print("closest to core:", ", ".join("%s %.2f" % x for x in near_core[:8]))
    print("most similar pairs (cosine):")
    pairs = sorted(((cos[i][j], names[i], names[j]) for i in range(len(names))
                    for j in range(i + 1, len(names))), reverse=True)
    for v, a, b in pairs[:8]:
        print("  %.3f  %s ~ %s" % (v, a, b))
    print("clustering:")
    for s in tree:
        print("  %.3f  %s" % (s["distance"], " + ".join(s["members"])))
    print("source sensitivity:", sens)
    print("wrote", PUB)


if __name__ == "__main__":
    main()
