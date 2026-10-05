"""Pay by title, level and country from two separate sources, never blended.

1. Job-posting pay disclosures (data/jd/records*.json): the posted base-salary
   range of each 2026 posting. A posting contributes its range midpoint.
   Split by title x country x seniority. Same low-n rule as the skill
   analysis: n < 20 is not shown, 20-39 is flagged low_n.
2. levels.fyi title pages (data/jd/levels_audit.json): title-level percentiles
   of self-reported pay, trailing window. No per-level data is published on
   the free pages, so levels.fyi gives one band per title x country.

Postings disclose BASE pay; levels.fyi publishes both BASE and TOTAL
compensation (TC), plus equity and bonus. Every figure says which one it shows:
posted base is compared with levels.fyi base, and levels.fyi TC is shown as its
own series. Distributions are read from the saved levels.fyi pages
(data/jd/levels_raw/, the schema.org Occupation block: P10/P25/median/P75/P90).

Output: astro-blog/public/data/title-comp.json
Run: python scripts/analyse_pay.py
"""

import json
import re
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SOURCES = [("ats", os.path.join(ROOT, "data", "jd", "records.json")),
           ("linkedin", os.path.join(ROOT, "data", "jd", "records_linkedin.json"))]
LEVELS = os.path.join(ROOT, "data", "jd", "levels_audit.json")
OUT = os.path.join(ROOT, "astro-blog", "public", "data", "title-comp.json")

TITLES = ["software_engineer", "fde", "data_engineer", "data_scientist",
          "ml_engineer", "ai_engineer", "mlops_engineer", "analytics_engineer",
          "data_analyst", "business_analyst"]
LEVELS_NAME = {"software_engineer": "Software Engineer", "fde": "Forward Deployed Engineer",
               "data_engineer": "Data Engineer", "data_scientist": "Data Scientist",
               "ml_engineer": "Machine Learning Engineer", "ai_engineer": "AI Engineer",
               "mlops_engineer": "MLOps Engineer", "analytics_engineer": "Analytics Engineer",
               "data_analyst": "Data Analyst", "business_analyst": "Business Analyst"}
COUNTRY_NAME = {"US": "United States", "CA": "Canada"}
# Junior postings are almost absent (new-grad programmes were excluded), so
# junior and mid are reported together (user decision 2026-10-04).
TIERS = {"junior_mid": ("junior", "mid"), "senior": ("senior",), "staff_plus": ("staff_plus",)}
DROP_N, FULL_N = 20, 40
# The pay explorer shows thinner cells than the figures do (user request
# 2026-10-04): 7-19 postings are drawn with a "very low n" flag.
SHOW_N = 7


def quantile(xs, q):
    xs = sorted(xs)
    if not xs:
        return None
    pos = (len(xs) - 1) * q
    lo = int(pos)
    hi = min(lo + 1, len(xs) - 1)
    return xs[lo] + (xs[hi] - xs[lo]) * (pos - lo)


def summarise(postings):
    n = len(postings)
    if n < SHOW_N:
        return {"n": n, "status": "dropped"}
    mids = [(p["pay_low"] + p["pay_high"]) / 2 for p in postings]
    status = "very_low_n" if n < DROP_N else "low_n" if n < FULL_N else "full"
    return {"n": n, "status": status,
            "median_mid": round(quantile(mids, 0.5)),
            "p10_mid": round(quantile(mids, 0.1)), "p90_mid": round(quantile(mids, 0.9)),
            "p25_mid": round(quantile(mids, 0.25)), "p75_mid": round(quantile(mids, 0.75)),
            "median_low": round(quantile([p["pay_low"] for p in postings], 0.5)),
            "median_high": round(quantile([p["pay_high"] for p in postings], 0.5)),
            "median_width_pct": round(100 * quantile(
                [(p["pay_high"] - p["pay_low"]) / p["pay_low"] for p in postings], 0.5), 1)}


PCTS = (("p10", "percentile10"), ("p25", "percentile25"), ("median", "median"),
        ("p75", "percentile75"), ("p90", "percentile90"))


def levels_distributions(source_paths):
    """Base / total / equity / bonus percentiles from a saved levels.fyi page.
    The Occupation block is a JSON string inside the page props; its values are
    in the page's local currency (CAD on Canada pages)."""
    path = os.path.join(ROOT, "data", "jd", source_paths.split(" -> ")[0])
    with open(path, encoding="utf-8") as f:
        text = f.read()
    if path.endswith(".html"):
        m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', text, re.S)
        props = json.loads(m.group(1))["props"]
    else:
        props = json.loads(text)
    pp = props.get("pageProps", props)
    occ = pp.get("jobTitlePageOccupationSchema") or pp.get("jobFamilyLocationPageOccupationSchema")
    occ = json.loads(occ) if isinstance(occ, str) else occ
    out = {}
    for e in occ["estimatedSalary"]:
        out[e["name"]] = {k: (round(e[src]) if e.get(src) is not None else None) for k, src in PCTS}
        out[e["name"]]["currency"] = e.get("currency")
    return out


TIERS_FILE = os.path.join(ROOT, "data", "jd", "levels_tiers.json")
TIER_YEARS = ("2025", "2026")


def dist(values):
    return {"p10": round(quantile(values, 0.1)), "p25": round(quantile(values, 0.25)),
            "median": round(quantile(values, 0.5)), "p75": round(quantile(values, 0.75)),
            "p90": round(quantile(values, 0.9))}


def levels_by_tier():
    """Per-tier levels.fyi distributions from company pages of the posting-sample
    employers (scripts/jd/collect_levels_tiers.py). Company levels were mapped to
    Junior/Mid, Senior, Staff+ there. Only submissions with 2025-2026 offer dates
    are used; a submission counts once per study title (uuid)."""
    if not os.path.exists(TIERS_FILE):
        return {}
    with open(TIERS_FILE, encoding="utf-8") as f:
        data = json.load(f)
    groups, seen = {}, set()
    for s in data["samples"]:
        if not s["in_study"] or (s.get("offerDate") or "")[:4] not in TIER_YEARS:
            continue
        key = (s["uuid"], s["study_title"])
        if key in seen or s["tier"] not in TIERS:
            continue
        seen.add(key)
        groups.setdefault((s["study_title"], s["country"], s["tier"]), []).append(s)
    out = {}
    for (title, country, tier), rows in groups.items():
        n = len(rows)
        # Sorted first so ties resolve the same way on every run.
        top = max(sorted(set(r["company"] for r in rows)), key=lambda c: sum(r["company"] == c for r in rows))
        cell = {"n": n, "n_companies": len(set(r["company"] for r in rows)),
                "top_company": top,
                "top_company_share": round(sum(r["company"] == top for r in rows) / n, 3),
                "status": "dropped" if n < SHOW_N else "very_low_n" if n < DROP_N
                else "low_n" if n < FULL_N else "full",
                "currency": rows[0]["currency"]}
        if n >= SHOW_N:
            cell["base"] = dist([r["base"] for r in rows])
            cell["total"] = dist([r["tc"] for r in rows])
        out.setdefault("%s|%s" % (title, country), {})[tier] = cell
    return out


def weighted_median(pairs):
    """pairs: (value, weight). Median of the weighted distribution."""
    pairs = sorted(pairs)
    total = sum(w for _, w in pairs)
    acc = 0.0
    for v, w in pairs:
        acc += w
        if acc >= total / 2:
            return v
    return None


def gap_decomposition(paid, title="software_engineer", country="US"):
    """Splits the gap between posted base (all levels) and the levels.fyi title
    page base into level mix and employer mix, using the company-page samples:
      title page base          -> levels.fyi population, its own level mix
      company samples, own mix -> posting-sample employers, levels.fyi's tier mix
      company samples, reweighted to the posting tier mix
      posted base              -> posting-sample employers, posting tier mix
    """
    if not os.path.exists(TIERS_FILE):
        return None
    with open(TIERS_FILE, encoding="utf-8") as f:
        data = json.load(f)
    seen, rows = set(), []
    for s in data["samples"]:
        if (s["in_study"] and s["study_title"] == title and s["country"] == country
                and (s.get("offerDate") or "")[:4] in TIER_YEARS and s["tier"] in TIERS
                and s["uuid"] not in seen):
            seen.add(s["uuid"])
            rows.append(s)
    posts = [p for p in paid if p["title"] == title and p["country"] == country]
    post_tier = {t: sum(p["seniority"] in m for p in posts) for t, m in TIERS.items()}
    n_post = sum(post_tier.values())
    samp_tier = {t: sum(r["tier"] == t for r in rows) for t in TIERS}
    weights = {t: (post_tier[t] / n_post) / (samp_tier[t] / len(rows)) for t in TIERS if samp_tier[t]}
    return {
        "title": title, "country": country,
        "posted_base_median": round(quantile([(p["pay_low"] + p["pay_high"]) / 2 for p in posts], 0.5)),
        "company_samples_base_median_own_mix": round(quantile([r["base"] for r in rows], 0.5)),
        "company_samples_base_median_posting_mix": round(weighted_median(
            [(r["base"], weights[r["tier"]]) for r in rows])),
        "posting_tier_mix": {t: round(post_tier[t] / n_post, 3) for t in TIERS},
        "sample_tier_mix": {t: round(samp_tier[t] / len(rows), 3) for t in TIERS},
        "n_samples": len(rows), "n_postings": n_post}


def disclosure_wording(paid):
    """Keyword check in the 250 characters either side of the disclosed range:
    is it called base pay, or does total compensation / OTE appear nearby?
    A rough check of what the posted numbers are, reported in the post's limits."""
    counts = {"total_or_ote_nearby": 0, "base_named": 0, "unspecified": 0, "equity_or_bonus_nearby": 0}
    for r in paid:
        text = r["text_required"] + r["text_preferred"]
        i = text.find("{:,}".format(r["pay_low"]))
        ctx = text[max(0, i - 250):i + 250].lower() if i >= 0 else ""
        if re.search(r"total (target )?comp|\bote\b|on-target", ctx):
            counts["total_or_ote_nearby"] += 1
        elif re.search(r"\bbase\b", ctx):
            counts["base_named"] += 1
        else:
            counts["unspecified"] += 1
        if re.search(r"equity|stock|rsu|bonus|commission", ctx):
            counts["equity_or_bonus_nearby"] += 1
    counts["n"] = len(paid)
    return counts


def main():
    paid = []
    for source, path in SOURCES:
        with open(path, encoding="utf-8") as f:
            for r in json.load(f):
                if r["pay_low"] and r["pay_high"]:
                    r = dict(r, source=source)
                    paid.append(r)

    # A Canadian posting that quotes exactly the same range as a US posting of the
    # same company is a US (USD) range read as CAD (seen at Brex, Gusto, Okta);
    # its pay is not used.
    us_ranges = set((p["company"], p["pay_low"], p["pay_high"]) for p in paid if p["country"] == "US")
    reused = [p for p in paid if p["country"] == "CA"
              and (p["company"], p["pay_low"], p["pay_high"]) in us_ranges]
    paid = [p for p in paid if not (p["country"] == "CA"
                                    and (p["company"], p["pay_low"], p["pay_high"]) in us_ranges)]
    print("Canadian postings dropped for reusing a US range: %d" % len(reused))

    postings = {}
    for t in TITLES:
        for c in ("US", "CA"):
            cell = [p for p in paid if p["title"] == t and p["country"] == c]
            entry = {"all": summarise(cell),
                     "by_seniority": {tier: summarise([p for p in cell if p["seniority"] in members])
                                      for tier, members in TIERS.items()},
                     "by_source": {s: summarise([p for p in cell if p["source"] == s])
                                   for s in ("ats", "linkedin")}}
            postings["%s|%s" % (t, c)] = entry

    with open(LEVELS, encoding="utf-8") as f:
        audit = json.load(f)
    levels = {}
    for t in TITLES:
        for c in ("US", "CA"):
            row = next((a for a in audit if a.get("title") == LEVELS_NAME[t]
                        and a.get("country") == COUNTRY_NAME[c]), None)
            if not row:
                continue
            # Canada values are converted from USD by levels.fyi itself, hence floats.
            levels["%s|%s" % (t, c)] = {
                k: (round(row[k]) if isinstance(row.get(k), float) else row.get(k)) for k in ("status", "page_type", "parent_title", "focus_tag",
                                        "url", "retrieved", "window", "n", "currency",
                                        "median_total", "p25_total", "p75_total",
                                        "median_base")}
            levels["%s|%s" % (t, c)]["dist"] = levels_distributions(row["source_paths"])
            n_lv = row.get("n") or 0
            levels["%s|%s" % (t, c)]["status_label"] = (
                "full" if n_lv >= FULL_N else "low_n" if n_lv >= DROP_N
                else "very_low_n" if n_lv >= SHOW_N else "dropped")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"rules": {"show_n": SHOW_N, "drop_n": DROP_N, "full_n": FULL_N,
                             "posting_measure": "midpoint of posted base range",
                             "levels_measure": "levels.fyi title page, trailing window",
                             "levels_tier_measure": "levels.fyi company-page submissions, offers 2025-2026, company levels mapped to tiers"},
                   "titles": TITLES, "postings": postings, "levels_fyi": levels,
                   "levels_fyi_by_tier": levels_by_tier(),
                   "gap_decomposition": [gap_decomposition(paid, t, "US") for t in
                                         ("software_engineer", "data_scientist")],
                   "disclosure_wording": disclosure_wording(paid)}, f)

    print("postings with pay: %d" % len(paid))
    print("%-20s %-3s %5s %9s | %6s %9s %9s | %s" % (
        "title", "cty", "n", "post_mid", "lv_n", "lv_base", "lv_total", "post by seniority (n/median)"))
    for t in TITLES:
        for c in ("US", "CA"):
            a = postings["%s|%s" % (t, c)]["all"]
            lv = levels.get("%s|%s" % (t, c), {})
            sen = "  ".join("%s %d/%s" % (s[:3], v["n"], v.get("median_mid", "-"))
                            for s, v in postings["%s|%s" % (t, c)]["by_seniority"].items())
            print("%-20s %-3s %5d %9s | %6s %9s %9s | %s" % (
                t, c, a["n"], a.get("median_mid", "-"), lv.get("n"), lv.get("median_base"),
                lv.get("median_total"), sen))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
