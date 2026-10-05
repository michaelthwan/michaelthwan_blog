"""Gap filler: 2026 job descriptions from LinkedIn's public guest job pages.

Used only for the cells the ATS route left thin (all ten titles in Canada,
plus four US titles). Records go through the same canonicalisation, seniority,
country and required/preferred code as collect_jds.py and carry
source="linkedin" so every figure can separate or exclude them.

Politeness: one request at a time, 1.5-3 s apart, exponential backoff on
429/999, and a hard stop after repeated refusals. Search pages and posting
pages are cached under data/jd/linkedin/ so a re-run fetches nothing twice.

Output: data/jd/records_linkedin.json (postings already in records.json under
the same company + title + country are dropped as duplicates).
Run: python scripts/jd/collect_linkedin.py [--max-pages N]
"""

import json
import os
import re
import sys
import html
import time
import random
import datetime
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from fetchlib import fetch  # noqa: E402
from collect_jds import (canonical_title, seniority_of, country_of, to_text,  # noqa: E402
                         split_req_pref, extract_pay, TITLE_RULES, EXCLUDED_TITLES)

ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(ROOT, "data", "jd", "linkedin")
ATS_RECORDS = os.path.join(ROOT, "data", "jd", "records.json")
OUT = os.path.join(ROOT, "data", "jd", "records_linkedin.json")

SEARCH = ("https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
          "?keywords=%s&location=%s&start=%d")
DETAIL = "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/%s"
HEADERS = {"Accept": "text/html", "Accept-Language": "en-US,en;q=0.9"}

KEYWORDS = {
    "software_engineer": ["software engineer"],
    "fde": ["forward deployed engineer"],
    "data_engineer": ["data engineer"],
    "data_scientist": ["data scientist"],
    "ml_engineer": ["machine learning engineer"],
    "ai_engineer": ["ai engineer", "llm engineer"],
    "mlops_engineer": ["mlops engineer", "ml platform engineer"],
    "analytics_engineer": ["analytics engineer"],
    "data_analyst": ["data analyst"],
    "business_analyst": ["business analyst"],
}
# Cells to fill: every title in Canada, plus the US titles the job boards left thin.
# FDE and AI Engineer were added for the US after FDE became its own title
# (2026-10-03), which left US AI Engineer with 32 board postings.
TARGETS = [(t, "Canada") for t in KEYWORDS] + [
    (t, "United States") for t in
    ("analytics_engineer", "mlops_engineer", "business_analyst", "data_analyst",
     "fde", "ai_engineer")]

CARD = re.compile(r'data-entity-urn="urn:li:jobPosting:(\d+)"(.*?)(?=data-entity-urn=|\Z)', re.S)
CARD_DATE = re.compile(r'<time[^>]*datetime="(\d{4}-\d{2}-\d{2})"')


class Refused(Exception):
    pass


_last = [0.0]
_refusals = [0]


def polite_get(url):
    """Return (code, text) with pacing and backoff; raise Refused when LinkedIn
    keeps refusing, so the run stops instead of hammering."""
    for attempt in range(4):
        wait = _last[0] + random.uniform(1.5, 3.0) - time.time()
        if wait > 0:
            time.sleep(wait)
        code, text = fetch(url, timeout=40, headers=HEADERS)
        _last[0] = time.time()
        if code == 200:
            _refusals[0] = 0
            return code, text
        if code in (429, 999, 0):
            _refusals[0] += 1
            if _refusals[0] >= 8:
                raise Refused("refused %d times in a row, last code %d" % (_refusals[0], code))
            time.sleep(30 * (2 ** attempt))
            continue
        return code, text
    return code, text


def cached(name, url):
    p = os.path.join(CACHE, name)
    if os.path.exists(p):
        with open(p, encoding="utf-8") as f:
            return f.read()
    code, text = polite_get(url)
    if code != 200:
        return None
    with open(p, "w", encoding="utf-8") as f:
        f.write(text)
    return text


def grab(pattern, text):
    m = re.search(pattern, text, re.S)
    return html.unescape(re.sub(r"<[^>]+>", " ", m.group(1))).strip() if m else ""


def parse_detail(text):
    crit = dict(
        (html.unescape(h).strip().lower(), html.unescape(v).strip())
        for h, v in re.findall(
            r'job-criteria-subheader">\s*(.*?)\s*</h3>\s*<span[^>]*>\s*(.*?)\s*</span>',
            text, re.S))
    body_m = re.search(r'show-more-less-html__markup[^>]*>(.*?)</div>', text, re.S)
    return {
        "title": " ".join(grab(r'topcard__title[^>]*>(.*?)</h2>', text).split()),
        "company": " ".join(grab(r'topcard__org-name-link[^>]*>(.*?)</a>', text).split()),
        "loc": " ".join(grab(r'topcard__flavor--bullet[^>]*>(.*?)</span>', text).split()),
        "salary": " ".join(grab(r'compensation__salary[^>]*>(.*?)</div>', text).split()),
        "body": to_text(body_m.group(1)) if body_m else "",
        "li_seniority": crit.get("seniority level", ""),
        "employment": crit.get("employment type", ""),
        "industry": crit.get("industries", ""),
    }


SAL = re.compile(r"(CA\$|C\$|\$)([\d,]+(?:\.\d+)?)(?:/yr)?\s*-\s*(?:CA\$|C\$|\$)([\d,]+(?:\.\d+)?)/yr")


def salary_of(d):
    """LinkedIn's structured salary line first ('CA$80,000.00/yr - CA$95,000.00/yr'),
    then the same in-text disclosure parser the ATS route uses."""
    m = SAL.search(d["salary"])
    if m:
        lo = int(float(m.group(2).replace(",", "")))
        hi = int(float(m.group(3).replace(",", "")))
        cur = "CAD" if m.group(1) in ("CA$", "C$") else "USD"
        want = "CAD" if country_of(d["loc"]) == "CA" else "USD"
        if cur == want and 30000 <= lo <= 900000 and lo < hi <= 1500000:
            return lo, hi, cur, "linkedin_salary_field"
    lo, hi, cur = extract_pay(d["body"], country_of(d["loc"]))
    return (lo, hi, cur, "parsed_from_text") if lo else (None, None, None, None)


def norm_company(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def main():
    max_pages = 10
    if "--max-pages" in sys.argv:
        max_pages = int(sys.argv[sys.argv.index("--max-pages") + 1])
    os.makedirs(CACHE, exist_ok=True)
    today = datetime.date.today().isoformat()

    with open(ATS_RECORDS, encoding="utf-8") as f:
        ats = json.load(f)
    seen_keys = set((norm_company(r["company"]), r["title_raw"].lower(), r["country"])
                    for r in ats)

    # 1. Search: collect candidate posting ids whose card title maps to the target.
    cands = {}
    stats = {"cards": 0, "card_title_miss": 0, "card_not_2026": 0}
    try:
        for title, loc in TARGETS:
            for kw in KEYWORDS[title]:
                for page in range(max_pages):
                    name = "search_%s_%s_%d.html" % (kw.replace(" ", "-"), loc[:2], page)
                    url = SEARCH % (urllib.parse.quote(kw), urllib.parse.quote(loc), page * 10)
                    text = cached(name, url)
                    if not text:
                        break
                    cards = CARD.findall(text)
                    if not cards:
                        break
                    for jid, chunk in cards:
                        stats["cards"] += 1
                        t = " ".join(html.unescape(grab(r'base-search-card__title[^>]*>(.*?)</h3>',
                                                        chunk)).split())
                        if canonical_title(t) != title:  # card must match its search
                            stats["card_title_miss"] += 1
                            continue
                        dm = CARD_DATE.search(chunk)
                        if not dm or not dm.group(1).startswith("2026"):
                            stats["card_not_2026"] += 1
                            continue
                        cands.setdefault(jid, (title, dm.group(1)))
                    if len(cards) < 10:
                        break
        print("search done: %d candidate postings" % len(cands))

        # 2. Detail pages.
        records, drop = [], {"no_detail": 0, "no_country": 0, "title_changed": 0,
                             "short_body": 0, "not_full_time": 0, "dup_of_ats": 0,
                             "dup_in_linkedin": 0}
        li_keys = set()
        for i, (jid, (title, posted)) in enumerate(sorted(cands.items())):
            text = cached("job_%s.html" % jid, DETAIL % jid)
            if not text:
                drop["no_detail"] += 1
                continue
            d = parse_detail(text)
            country = country_of(d["loc"])
            if country not in ("US", "CA"):
                drop["no_country"] += 1
                continue
            # The detail title decides; a posting found under one search can
            # belong to another study title (e.g. an FDE found by "ai engineer").
            title = canonical_title(d["title"])
            if title is None or title in EXCLUDED_TITLES:
                drop["title_changed"] += 1
                continue
            if d["employment"] and d["employment"].lower() not in ("full-time",):
                drop["not_full_time"] += 1
                continue
            if len(d["body"]) < 600:
                drop["short_body"] += 1
                continue
            key = (norm_company(d["company"]), d["title"].lower(), country)
            if key in seen_keys:
                drop["dup_of_ats"] += 1
                continue
            if key in li_keys:
                drop["dup_in_linkedin"] += 1
                continue
            li_keys.add(key)
            req, pref = split_req_pref(d["body"])
            lo, hi, cur, pay_src = salary_of(d)
            records.append({
                "company": d["company"], "company_group": "linkedin",
                "ats": "linkedin", "source": "linkedin", "industry": d["industry"],
                "country": country, "location": d["loc"],
                "title_raw": d["title"], "title": title,
                "seniority": seniority_of(d["title"]),
                "li_seniority": d["li_seniority"],
                "posted_date": posted, "retrieved": today,
                "url": "https://www.linkedin.com/jobs/view/%s" % jid,
                "pay_low": lo, "pay_high": hi, "pay_currency": cur, "pay_source": pay_src,
                "text_required": req, "text_preferred": pref,
            })
            if (i + 1) % 50 == 0:
                print("  details %d / %d, kept %d" % (i + 1, len(cands), len(records)),
                      flush=True)
    except Refused as e:
        print("STOPPED:", e, "- cached pages are kept; re-run later to resume.")
        return

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False)
    print("search stats:", stats)
    print("drops:", drop)
    grid = {}
    for r in records:
        grid[(r["title"], r["country"])] = grid.get((r["title"], r["country"]), 0) + 1
    print("\n%-20s %5s %5s" % ("title", "US", "CA"))
    for t in [t for t, _ in TITLE_RULES if t not in EXCLUDED_TITLES]:
        print("%-20s %5d %5d" % (t, grid.get((t, "US"), 0), grid.get((t, "CA"), 0)))
    paid = sum(1 for r in records if r["pay_low"])
    print("\nkept %d, with pay %d" % (len(records), paid))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
