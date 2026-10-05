"""Per-tier levels.fyi pay for the same employers as the 2026 posting sample.

levels.fyi title pages only give all-level numbers, so this script goes to the
company pages instead, one page per (company, job family, country):

    https://www.levels.fyi/companies/<slug>/salaries/<family>/locations/<united-states|canada>

The /locations/ suffix is always passed (without it the page infers a
location). Everything is read from <script id="__NEXT_DATA__"> -> props.pageProps:
  - levels.levels   the company ladder (titles per level, ladder order)
  - faqLevels       complete per-level counts, median TC and typicalYoe
  - averages[].samples  a SUBSET (~20-30 per level) of individual submissions

Employers are the study companies in data/jd/records.json (ATS board token) and
data/jd/records_linkedin.json (display name). A display name for an ATS token
is taken from the cached board response (Greenhouse company_name,
SmartRecruiters company.name; Lever has none, so the token is used). Slug
candidates are slugified name variants plus the token; a candidate is accepted
only when the page's pageProps.company name or slug matches the study name or
token after normalisation (or comes from the hand-checked OVERRIDE table).
A family page 404s when the company lacks that family, so companies with >= 2
postings whose first needed family 404s are re-probed on software-engineer
before being called unresolved. Companies are processed in descending order of
study postings (>= 2 postings first) until the request budget is spent.

Families fetched, and the study titles they feed:
  software-engineer -> software_engineer (all samples),
                       ml_engineer (focusTag "ML / AI"),
                       data_engineer (focusTag "Data")
  data-scientist    -> data_scientist
  data-analyst      -> data_analyst
  business-analyst  -> business_analyst
A family is fetched for a company and country only when the company has study
postings there for a title that maps to it. Every sample is emitted once per
study title it maps to (an ML sample appears as software_engineer AND as
ml_engineer); in_study says whether the company has postings for that
study title in that country. When two study names resolve to one levels.fyi
slug (ATS token "affirm" and LinkedIn name "Affirm"), the pages are processed
once under the first name and the other is listed in "aliases".

Tier per company level, decided per ladder (company x family x country):
  Senior anchors are levels with a title containing the word Senior/Sr but not
  Staff/Principal/Distinguished/Fellow/Architect/Lead/Manager/Director.
  - Ladder has an anchor: levels below the lowest anchor -> junior_mid
    ("anchor_below"), anchors (and anything between them) -> senior ("anchor"),
    levels above the highest anchor -> staff_plus ("anchor_above"). Order wins
    over words: IBM "Staff Engineer" Band 7 below the anchor is junior_mid.
  - No anchor: "title" (Staff/Principal/Distinguished/Fellow -> staff_plus;
    I/II/1/2/Junior/Associate/Entry -> junior_mid), else "yoe_typical"
    (typicalYoe midpoint) or "yoe_samples" (median sample YOE): < 5 junior_mid,
    5-9 senior, >= 10 staff_plus. Before those, a level whose code (any of
    its titles, e.g. L6, G10, T6) also appears on the same company + country
    software-engineer ladder, when that ladder was anchor-mapped, takes the
    SWE level's tier ("borrow_swe"). A level above a staff_plus level with no
    evidence inherits it ("inherit_above"); else "unmapped". Monotonic along
    the ladder ("+monotonic" when a level was raised).
  Finally TIER_OVERRIDES (hand-set, one-line reason each) replaces the tier of
  listed (slug, level code) pairs on every ladder of that company ("override").
  tier_title keeps seniority_of() from collect_jds.py on the longest non-code
  title, for audit only.

Currency: page JSON stores all money values in USD (the site converts for
display). On Canada pages base/tc/stock/bonus and tc_median_page are multiplied
by pageProps.locationExchangeRate and labelled CAD; every record carries "fx",
the rate applied (1.0 for US).

Politeness: one request at a time, >= 2.5 s apart, stop after repeated
refusals (429/403/challenge pages). Every response (including 404s) is cached
under data/jd/levels_company_raw/ as the extracted pageProps, so re-runs are
free and only fetch what is missing.

Outputs: data/jd/levels_tiers.json and data/jd/levels_tier_map.csv.
Run: python scripts/jd/collect_levels_tiers.py [--budget N] [--offline]
"""

import argparse
import collections
import csv
import datetime
import json
import os
import re
import statistics
import subprocess
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from collect_jds import seniority_of  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
JD = os.path.join(ROOT, "data", "jd")
RAW_ATS = os.path.join(JD, "raw")
CACHE = os.path.join(JD, "levels_company_raw")
OUT_JSON = os.path.join(JD, "levels_tiers.json")
OUT_CSV = os.path.join(JD, "levels_tier_map.csv")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/129.0 Safari/537.36")
DELAY = 2.5

FAMILY_OF = {
    "software_engineer": "software-engineer",
    "ml_engineer": "software-engineer",
    "data_engineer": "software-engineer",
    "data_scientist": "data-scientist",
    "data_analyst": "data-analyst",
    "business_analyst": "business-analyst",
}
FOCUS = {"ml_engineer": "ML / AI", "data_engineer": "Data"}
LOC = {"US": "united-states", "CA": "canada"}
COUNTRY_ID = {"US": 254, "CA": 43}
TIER_OF = {"junior": "junior_mid", "mid": "junior_mid",
           "senior": "senior", "staff_plus": "staff_plus"}
RANK = {"junior_mid": 0, "senior": 1, "staff_plus": 2}

NEXT = re.compile(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', re.S)
CODE = re.compile(r"^(?:[a-z]{1,4}|level)?[ -]?(?:\d+(?:\.\d+)?|[ivx]+)[a-z]?$", re.I)
# Hand-checked slugs for study names that the slugify variants miss. These skip
# the name check (the levels.fyi name differs from the study name by design).
OVERRIDE = {
    "shieldai": "shield-ai", "kodiak": "kodiak-robotics", "veeva": "veeva-systems",
    "lyrahealth": "lyra-health", "magnetforensics": "magnet-forensics",
    "liftoff": "liftoff-mobile", "Amazon Web Services (AWS)": "amazon",
    "EA SPORTS": "electronic-arts", "BMO": "bmo-financial-group", "TD": "td-bank",
    "EY": "ernst-and-young", "KPMG Canada": "kpmg", "BDO Canada": "bdo",
    "Capgemini Engineering": "capgemini", "Pratt & Whitney": "pratt-whitney",
    "Sun Life": "sun-life-financial", "Munich Re": "munich-re-group",
}

SENIOR_WORD = re.compile(r"\b(senior|sr)\b", re.I)
ANCHOR_EXCLUDE = re.compile(r"\b(staff|principal|distinguished|fellow|architect|lead|manager|director)\b", re.I)
STAFF_WORD = re.compile(r"\b(staff|principal|distinguished|fellow)\b", re.I)
JUNIOR_WORD = re.compile(r"\b(i|ii|1|2|junior|jr|associate|entry|graduate|new grad)\b", re.I)

# Hand-set tiers for levels the rules get wrong, keyed by (levels.fyi slug,
# level code or title, lowercased). Applied to every family and country of that
# company after the rule-based mapping (method "override"), so one code gets one
# tier across the company's ladders. Evidence: cached ladders in
# data/jd/levels_company_raw/ (titles, typicalYoe, sample YOE, median TC).
TIER_OVERRIDES = {
    # eBay: anchor "Senior MTS" sits above SE 3/MTS 1/MTS 2, so all three fell to junior_mid.
    ("ebay", "se 3"): ("junior_mid", "typical YOE 5.5; eBay SE 3 is the level below MTS 1 (mid-level)"),
    ("ebay", "mts 1"): ("senior", "sample YOE 9, TC 221k CAD; MTS 1 is eBay's senior engineer level"),
    ("ebay", "mts 2"): ("staff_plus", "typical YOE 9.5, sample 11; MTS 2 is eBay's staff-equivalent level"),
    ("ebay", "senior mts"): ("staff_plus", "above MTS 2, so staff_plus to stay monotonic"),
    # IBM: one band, one tier, across SWE and BA (BA ladder had Band 7 senior, Band 8 staff_plus).
    ("ibm", "band 7"): ("junior_mid", "SWE and BA typical YOE 5.5; 'Staff Engineer' is IBM's mid band"),
    ("ibm", "band 8"): ("senior", "Advisory band, SWE typical YOE 7.5"),
    ("ibm", "band 9"): ("senior", "'Senior Engineer' title on the SWE ladder"),
    ("ibm", "band 10"): ("staff_plus", "Senior Technical Staff Member, sample YOE 22"),
    # Scotiabank: L8 was staff_plus (SWE), senior (BA), junior_mid (DS).
    ("scotiabank", "l6"): ("junior_mid", "typical YOE 2.5-3.5 on SWE and BA"),
    ("scotiabank", "l7"): ("junior_mid", "typical YOE 3.5 on SWE and DS (7.5 on BA, outvoted)"),
    ("scotiabank", "l8"): ("senior", "TC 134-150k CAD and YOE 4.5-12 across ladders: senior band"),
    ("scotiabank", "l9"): ("senior", "sample YOE 6-7.5, TC within 10% of L8; no evidence of staff scope"),
    # Lyft: SWE T6 is titled Staff Engineer; DS had no titles so T6/T7 fell to senior by YOE.
    ("lyft", "t3"): ("junior_mid", "SWE 'Software Engineer', typical YOE 2.5"),
    ("lyft", "t4"): ("junior_mid", "typical YOE 3.5-4.5 on SWE and DS"),
    ("lyft", "t5"): ("senior", "typical YOE 6.5-8; the level below Staff Engineer"),
    ("lyft", "t6"): ("staff_plus", "SWE T6 is titled Staff Engineer"),
    ("lyft", "t7"): ("staff_plus", "above Staff Engineer"),
    # Pinterest: DS L-codes are SWE IC-codes minus 10 (L5 = IC15 Senior, L6 = IC16 Staff).
    ("pinterest", "l3"): ("junior_mid", "= IC13 Software Engineer I; sample YOE 0"),
    ("pinterest", "l4"): ("junior_mid", "= IC14 Software Engineer II; typical YOE 4.5"),
    ("pinterest", "l5"): ("senior", "= IC15 Senior Software Engineer; typical YOE 8.5"),
    ("pinterest", "l6"): ("staff_plus", "= IC16 Staff Software Engineer; TC 471k USD"),
    # Stripe: SWE L1/L2 junior_mid, L3 senior, L4 Staff Engineer; DS/BA ladders read by sparse sample YOE.
    ("stripe", "l1"): ("junior_mid", "entry level; SWE typical YOE 0.5"),
    ("stripe", "l2"): ("junior_mid", "SWE typical YOE 3.5"),
    ("stripe", "l3"): ("senior", "SWE typical YOE 7.5-9"),
    ("stripe", "l4"): ("staff_plus", "SWE L4 is titled Staff Engineer"),
    # RBC: PL numbers count down; PL08 is titled Senior, PL07 Staff, but PL07 DS typical YOE is 4.5.
    ("rbc", "pl07"): ("senior", "DS typical YOE 4.5, SWE TC 173k CAD (senior pay); avoids Staff+ below Senior"),
    ("rbc", "pl06"): ("staff_plus", "above PL07; SWE sample YOE 15.5"),
    # Geotab: L3 was staff_plus in US (5 samples) but senior in CA.
    ("geotab", "l3"): ("senior", "CA SWE typical YOE 7.5; US sample of 5 at TC 115k USD is not staff pay"),
}

SUFFIX = {"inc", "llc", "ltd", "limited", "corp", "corporation", "co", "company",
          "technologies", "technology", "group", "holdings", "the", "plc", "lp"}


# ── network + cache ───────────────────────────────────────────────────────
class Fetcher:
    def __init__(self, budget, offline):
        self.budget = budget
        self.offline = offline
        self.used = 0
        self.last = 0.0
        self.refusals = 0
        self.stopped = None

    def page(self, slug, family, country):
        """Return the cached record {url, code, fetched, pageProps} or None when
        the budget is spent / the run has been stopped."""
        name = "%s__%s__%s.json" % (slug, family, LOC[country])
        path = os.path.join(CACHE, name)
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        if self.offline or self.stopped or self.used >= self.budget:
            return None
        url = "https://www.levels.fyi/companies/%s/salaries/%s/locations/%s" % (
            slug, family, LOC[country])
        wait = DELAY - (time.time() - self.last)
        if wait > 0:
            time.sleep(wait)
        code, text = curl(url)
        self.last = time.time()
        self.used += 1
        m = NEXT.search(text or "")
        props = None
        if m:
            try:
                props = json.loads(m.group(1)).get("props", {}).get("pageProps")
            except ValueError:
                props = None
        if code in (403, 429) or code == 0 or (code == 200 and props is None):
            self.refusals += 1
            print("  refusal/odd page code=%s url=%s" % (code, url))
            if self.refusals >= 3:
                self.stopped = "3 consecutive refusals, last code %s at %s" % (code, url)
            time.sleep(10 * self.refusals)
            return None
        self.refusals = 0
        rec = {"url": url, "code": code, "fetched": datetime.date.today().isoformat(),
               "pageProps": props if code == 200 else None}
        with open(path, "w", encoding="utf-8") as f:
            json.dump(rec, f, ensure_ascii=False)
        return rec


def curl(url):
    fd, path = tempfile.mkstemp(suffix=".html")
    os.close(fd)
    cmd = ["curl", "-s", "-L", "-m", "45", "--compressed", "-A", UA,
           "-H", "Accept-Language: en-US,en;q=0.9", "-o", path, "-w", "%{http_code}", url]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        code = int((out.stdout or "0").strip() or 0)
        with open(path, "rb") as f:
            return code, f.read().decode("utf-8", "replace")
    except Exception:
        return 0, ""
    finally:
        try:
            os.remove(path)
        except OSError:
            pass


# ── study companies and slug candidates ───────────────────────────────────
def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def strip_suffix(name):
    words = re.findall(r"[a-z0-9]+", re.sub(r"\(.*?\)", " ", (name or "").lower()).replace("&", " and "))
    while words and words[-1] in SUFFIX:
        words.pop()
    while words and words[0] == "the":
        words.pop(0)
    return words


def ats_name(token):
    path = os.path.join(RAW_ATS, token + ".json")
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        text = f.read(400000)
    m = re.search(r'"company_name":\s*"([^"]+)"', text) or \
        re.search(r'"company":\s*\{"identifier":\s*"[^"]*",\s*"name":\s*"([^"]+)"', text)
    return m.group(1) if m else None


def candidates(company, name):
    out = []
    full = re.findall(r"[a-z0-9]+", (name or "").lower().replace("&", " and ").replace(".", ""))
    stripped = strip_suffix(name)
    for c in ("-".join(stripped), "-".join(full), "".join(stripped),
              re.sub(r"[^a-z0-9-]", "", company.lower().replace(" ", "-"))):
        if c and c not in out:
            out.append(c)
    return out[:4]


def matches(props, company, name):
    co = props.get("company") or {}
    got = {norm(co.get("name")), norm(co.get("slug"))}
    want = {norm(company), norm(name), "".join(strip_suffix(name)), "".join(strip_suffix(company))}
    want.discard("")
    return bool(got & want)


def load_study():
    recs = []
    for fn in ("records.json", "records_linkedin.json"):
        with open(os.path.join(JD, fn), encoding="utf-8") as f:
            recs += json.load(f)
    study = {}
    for r in recs:
        if r["title"] not in FAMILY_OF or r["country"] not in LOC:
            continue
        s = study.setdefault(r["company"], {"n": 0, "titles": set(), "need": set(),
                                            "ats": r.get("ats")})
        s["n"] += 1
        s["titles"].add((r["title"], r["country"]))
        s["need"].add((FAMILY_OF[r["title"]], r["country"]))
    for company, s in study.items():
        s["name"] = company if s["ats"] == "linkedin" else (ats_name(company) or company)
    return study


# ── tier mapping ──────────────────────────────────────────────────────────
def yoe_tier(x):
    if x is None:
        return None
    return "junior_mid" if x < 5 else ("senior" if x < 10 else "staff_plus")


def title_tier(titles):
    """seniority_of() on the longest non-code title (audit column tier_title)."""
    desc = [t for t in titles if t and not CODE.match(t.strip())]
    if not desc:
        return None
    return TIER_OF[seniority_of(max(desc, key=len))]


def build_ladder(props):
    lad = ((props.get("levels") or {}).get("levels")) or []
    rows = []
    for e in lad:
        if e.get("is_gap"):
            continue
        rows.append({"titles": [t for t in e.get("titles") or [] if t], "order": e.get("order")})
    if not rows:  # no published ladder: fall back to averages order
        for a in sorted(props.get("averages") or [], key=lambda a: a.get("levelIndex", 0)):
            rows.append({"titles": a.get("titles") or [a.get("primaryLevelName")],
                         "order": a.get("levelIndex")})
    rows.sort(key=lambda r: (r["order"] is None, r["order"]))
    for i, r in enumerate(rows):
        r["order"] = i
    return rows


def find_level(rows, level):
    key = (level or "").strip().lower()
    for r in rows:
        if key in (t.strip().lower() for t in r["titles"]):
            return r
    return None


def map_page(props, country, swe_codes=None):
    rows = build_ladder(props)
    faq = {}
    for f in props.get("faqLevels") or []:
        faq[(f.get("level") or "").strip().lower()] = f
    samples = [s for a in props.get("averages") or [] for s in a.get("samples") or []]
    by_level = collections.defaultdict(list)
    for s in samples:
        r = find_level(rows, s.get("level"))
        if r is None:  # a level not on the ladder: append it at the top
            r = {"titles": [s.get("level")], "order": len(rows)}
            rows.append(r)
        by_level[r["order"]].append(s)
    for r in rows:
        f = None
        for t in r["titles"]:
            f = faq.get(t.strip().lower())
            if f:
                break
        r["count"] = f.get("count") if f else 0
        r["tc_median_page"] = f.get("totalCompensation") if f else None
        ty = (f or {}).get("typicalYoe")
        r["typical_yoe_mid"] = (ty["min"] + ty["max"]) / 2.0 if ty and ty.get("min") is not None else None
        own = [s.get("yearsOfExperience") for s in by_level[r["order"]]
               if s.get("countryId") == COUNTRY_ID[country] and s.get("yearsOfExperience") is not None]
        if not own:
            own = [s.get("yearsOfExperience") for s in by_level[r["order"]]
                   if s.get("yearsOfExperience") is not None]
        r["sample_yoe_median"] = statistics.median(own) if own else None
        r["tier_title"] = title_tier(r["titles"])
    assign_tiers(rows, swe_codes)
    return rows, by_level


def is_anchor(titles):
    return any(SENIOR_WORD.search(t) and not ANCHOR_EXCLUDE.search(t) for t in titles if t)


def apply_overrides(slug, rows):
    for r in rows:
        for t in r["titles"]:
            hit = TIER_OVERRIDES.get((slug, (t or "").strip().lower()))
            if hit:
                r["tier"], r["method"], r["override_reason"] = hit[0], "override", hit[1]
                break
    return rows


def swe_code_tiers(rows):
    """{lowercased code/title: tier} from a software-engineer ladder, or None
    when that ladder was not mapped by the anchor rule."""
    if not rows or not any(r["method"].startswith("anchor") for r in rows):
        return None
    out = {}
    for r in rows:
        for t in r["titles"]:
            if t:
                out.setdefault(t.strip().lower(), r["tier"])
    return out


def assign_tiers(rows, swe_codes=None):
    """Anchor rule per ladder; for ladders with no anchor, borrow the tier of the
    same level code on the company's anchor-mapped software-engineer ladder,
    else the title/YOE rules."""
    anchors = [r["order"] for r in rows if is_anchor(r["titles"])]
    if anchors:
        lo, hi = min(anchors), max(anchors)
        for r in rows:
            if r["order"] < lo:
                r["tier"], r["method"] = "junior_mid", "anchor_below"
            elif r["order"] > hi:
                r["tier"], r["method"] = "staff_plus", "anchor_above"
            else:
                # levels between two anchors (rare) count as senior with them
                r["tier"], r["method"] = "senior", "anchor"
        return
    prev = -1
    for r in rows:
        joined = " ".join(t for t in r["titles"] if t)
        borrowed = [swe_codes[t.strip().lower()] for t in r["titles"]
                    if t and swe_codes and t.strip().lower() in swe_codes]
        if borrowed:
            r["tier"], r["method"] = borrowed[0], "borrow_swe"
            prev = max(prev, RANK[borrowed[0]])
            continue
        if STAFF_WORD.search(joined):
            tier, method = "staff_plus", "title"
        elif JUNIOR_WORD.search(joined):
            tier, method = "junior_mid", "title"
        elif yoe_tier(r["typical_yoe_mid"]):
            tier, method = yoe_tier(r["typical_yoe_mid"]), "yoe_typical"
        elif yoe_tier(r["sample_yoe_median"]):
            tier, method = yoe_tier(r["sample_yoe_median"]), "yoe_samples"
        elif prev == RANK["staff_plus"]:
            tier, method = "staff_plus", "inherit_above"
        else:
            tier, method = "unmapped", "unmapped"
        if tier != "unmapped":
            if RANK[tier] < prev:
                tier = [k for k, v in RANK.items() if v == prev][0]
                method += "+monotonic"
            prev = RANK[tier]
        r["tier"], r["method"] = tier, method


# ── main ──────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--budget", type=int, default=1170, help="max network requests this run")
    ap.add_argument("--offline", action="store_true", help="use the cache only")
    args = ap.parse_args()
    os.makedirs(CACHE, exist_ok=True)
    fx = Fetcher(args.budget, args.offline)
    study = load_study()
    order = sorted(study, key=lambda c: (-study[c]["n"], c))

    slugs, unresolved, skipped, level_map, samples = {}, [], [], [], []
    currency_checks = []
    owner, aliases, groups = {}, {}, collections.OrderedDict()
    with_ladder, contributing = set(), set()
    for company in order:
        s = study[company]
        need = sorted(s["need"], key=lambda fc: (fc[0] != "software-engineer", fc))
        slug, tried, rec = None, [], None
        # Probe on the first needed family; a company with >= 2 postings whose
        # needed family 404s is probed again on software-engineer, because a
        # family page 404s when the company has no such family on levels.fyi.
        probes = [need[0]]
        if s["n"] >= 2 and need[0][0] != "software-engineer":
            probes.append(("software-engineer", need[0][1]))
        for probe in probes:
            if company in OVERRIDE:
                rec = fx.page(OVERRIDE[company], *probe)
                if rec is not None:
                    tried.append("%s:%s(override,%s)" % (OVERRIDE[company], rec["code"], probe[0]))
                    if rec["code"] == 200 and rec.get("pageProps"):
                        slug = OVERRIDE[company]
            for cand in ([] if slug else candidates(company, s["name"])):
                rec = fx.page(cand, *probe)
                if rec is None:
                    break
                tried.append("%s:%s(%s)" % (cand, rec["code"], probe[0]))
                if rec["code"] == 200 and rec.get("pageProps") and matches(rec["pageProps"], company, s["name"]):
                    slug = cand
                    break
            if slug or rec is None:
                break
        slugs[company] = slug
        if slug is None:
            if rec is None and (fx.stopped or fx.used >= fx.budget or fx.offline):
                skipped.append(company)
            else:
                unresolved.append({"company": company, "name": s["name"], "n": s["n"], "tried": tried})
            continue
        # one employer can appear under two study names (ATS token and LinkedIn
        # display name); its pages are processed once, under the first name.
        if slug in owner:
            aliases[company] = owner[slug]
        else:
            owner[slug] = company
            groups[slug] = {"titles": set(), "need": set()}
        groups[slug]["titles"] |= s["titles"]
        groups[slug]["need"] |= s["need"]
        for fc in need[1:]:
            fx.page(slug, *fc)
        if fx.used and fx.used % 50 == 0:
            print("  progress: %d requests, %d companies done" % (fx.used, len(slugs)))

    for slug, g in groups.items():
        company = owner[slug]
        swe = {}
        for country in ("US", "CA"):
            if any(fc[1] == country and fc[0] != "software-engineer" for fc in g["need"]):
                srec = fx.page(slug, "software-engineer", country)
                sprops = (srec or {}).get("pageProps")
                if srec and srec["code"] == 200 and sprops:
                    swe[country] = swe_code_tiers(apply_overrides(slug, map_page(sprops, country)[0]))
        for family, country in sorted(g["need"]):
            rec = fx.page(slug, family, country)
            props = (rec or {}).get("pageProps")
            if not rec or rec["code"] != 200 or not props:
                continue
            # Page JSON stores every money value in USD; the site converts for
            # display with locationExchangeRate. Convert here so values match the
            # currency label (CAD on Canada pages).
            cur = props.get("locationCurrency") or "USD"
            rate = float(props.get("locationExchangeRate") or 1.0) if cur != "USD" else 1.0
            conv = (lambda v: round(v * rate, 2) if isinstance(v, (int, float)) else v)
            rows, by_level = map_page(props, country,
                                      swe.get(country) if family != "software-engineer" else None)
            apply_overrides(slug, rows)
            if props.get("levels") and (props["levels"].get("levels") or []):
                with_ladder.add(slug)
            for r in rows:
                level_map.append({
                    "company": company, "slug": slug, "family": family, "country": country,
                    "level": r["titles"][0] if r["titles"] else None, "titles": r["titles"],
                    "order": r["order"], "tier": r["tier"], "method": r["method"],
                    "tier_title": r["tier_title"], "typical_yoe_mid": r["typical_yoe_mid"],
                    "sample_yoe_median": r["sample_yoe_median"], "count": r["count"],
                    "tc_median_page": conv(r["tc_median_page"]), "currency": cur, "fx": rate,
                    "override_reason": r.get("override_reason")})
                for smp in by_level[r["order"]]:
                    if smp.get("countryId") != COUNTRY_ID[country]:
                        continue
                    if family == "software-engineer":
                        sts = ["software_engineer"] + [t for t, ft in FOCUS.items()
                                                       if smp.get("focusTag") == ft]
                    else:
                        sts = [t for t, fam in FAMILY_OF.items() if fam == family]
                    for st in sts:
                        samples.append({
                            "company": company, "family": family, "study_title": st,
                            "in_study": (st, country) in g["titles"], "country": country,
                            "currency": cur, "level": smp.get("level"), "tier": r["tier"],
                            "focusTag": smp.get("focusTag"), "uuid": smp.get("uuid"),
                            "offerDate": (smp.get("offerDate") or "")[:10],
                            "yoe": smp.get("yearsOfExperience"),
                            "base": conv(smp.get("baseSalary")), "tc": conv(smp.get("totalCompensation")),
                            "stock": conv(smp.get("avgAnnualStockGrantValue")),
                            "bonus": conv(smp.get("avgAnnualBonusValue")), "fx": rate})
                        if st and (st, country) in g["titles"] and                                 (smp.get("offerDate") or "")[:4] in ("2025", "2026"):
                            contributing.add(slug)
            if country == "CA":
                currency_checks.append((company, family, cur, props.get("locationExchangeRate")))

    out = {"generated": datetime.date.today().isoformat(),
           "source": "levels.fyi company pages, pageProps (see collect_levels_tiers.py)",
           "coverage": {
               "study_names": len(study),
               "study_names_resolved": sum(1 for v in slugs.values() if v),
               "employers_resolved": len(groups),
               "employers_with_ladder": len(with_ladder),
               "employers_with_2025_2026_in_study_sample": len(contributing),
               "note": "employers = distinct levels.fyi slugs after merging aliases; "
                       "ladder = non-empty pageProps.levels.levels on a fetched page"},
           "companies": slugs, "aliases": aliases, "unresolved": unresolved, "not_attempted": skipped,
           "level_map": level_map, "samples": samples}
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    cols = ["company", "slug", "family", "country", "order", "level", "titles", "tier", "method",
            "tier_title", "typical_yoe_mid", "sample_yoe_median", "count", "tc_median_page",
            "currency", "fx"]
    with open(OUT_CSV, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for r in level_map:
            w.writerow({k: (" | ".join(r[k]) if k == "titles" else r[k]) for k in cols})

    att = [c for c in order if c not in skipped]
    res = [c for c in att if slugs.get(c)]
    print("network requests this run: %d (budget %d)%s" % (
        fx.used, args.budget, "; STOPPED: " + fx.stopped if fx.stopped else ""))
    print("study companies: %d; attempted %d; resolved %d (%.0f%%); unresolved %d; not attempted %d" % (
        len(order), len(att), len(res), 100.0 * len(res) / max(1, len(att)), len(unresolved), len(skipped)))
    multi = [c for c in order if study[c]["n"] >= 2]
    print("companies with >= 2 postings: %d; resolved %d" % (
        len(multi), sum(1 for c in multi if slugs.get(c))))
    print("level_map rows: %d; methods: %s" % (
        len(level_map), dict(collections.Counter(r["method"] for r in level_map))))
    print("samples: %d (in_study %d)" % (len(samples), sum(1 for x in samples if x["in_study"])))
    cur = collections.Counter((c[2], c[3]) for c in currency_checks)
    print("CA page currency / exchangeRate: %s" % dict(cur))
    print("coverage: %s" % {k: v for k, v in out["coverage"].items() if k != "note"})


if __name__ == "__main__":
    main()
