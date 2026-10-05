"""Collect 2026 job descriptions from public job-board APIs.

Sources are the official unauthenticated board APIs discovered by
discover_boards.py. Raw board responses are cached under data/jd/raw/ so
re-runs are free and every derived number can be traced back to a response.

Filters applied, in order:
  1. country in {US, CA}
  2. posted in 2026 (required field; a posting with no usable date is dropped)
  3. title maps to one of the ten canonical titles

Output: data/jd/records.json  - one normalised record per surviving posting.
Run: python scripts/jd/collect_jds.py [--refresh]
"""

import json
import os
import re
import sys
import html
import time
import datetime
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from fetchlib import fetch_json  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
RAW = os.path.join(ROOT, "data", "jd", "raw")
OUT = os.path.join(ROOT, "data", "jd", "records.json")
BOARDS = os.path.join(HERE, "boards.json")

# ── Title canonicalisation ────────────────────────────────────────────────
# Order matters: the first rule whose pattern matches wins, so the most
# specific titles are tested first. Patterns are matched against the raw
# posting title only; JD-content disambiguation happens in reconcile().

TITLE_RULES = [
    ("analytics_engineer", r"\banalytics\s+engineer"),
    ("mlops_engineer",
     r"\bml\s*ops\b|\bmlops\b|\bmachine\s+learning\s+operations\b"
     r"|\b(ml|machine\s+learning|ai)\s+(platform|infrastructure|infra|systems)\s+engineer"
     r"|\b(model|inference)\s+(serving|deployment|platform)\s+engineer"),
    # Forward-deployed engineers are their own title (user decision 2026-10-03).
    # The title must also say engineer: "Deployment Strategist, FDE" (a field PM)
    # and "Forward Deployed Data Scientist" are not FDEs.
    ("fde", r"\b(forward[\s-]+deployed|fde)\b.*\bengineer|\bengineer.*\b(forward[\s-]+deployed|fde)\b"),
    ("ai_engineer",
     r"\bai\s+engineer|\bgenai\s+engineer|\bgenerative\s+ai\s+engineer"
     r"|\bllm\s+engineer|\bapplied\s+ai\s+engineer|\bai\s+software\s+engineer"),
    ("ml_engineer",
     r"\bmachine\s+learning\s+engineer|\bml\s+engineer\b|\bdeep\s+learning\s+engineer"
     r"|\bresearch\s+engineer,?\s+(ml|machine\s+learning)|\bperception\s+engineer"),
    ("data_engineer",
     r"\bdata\s+engineer|\bbig\s+data\s+engineer|\betl\s+engineer"
     r"|\bdata\s+platform\s+engineer|\bdata\s+infrastructure\s+engineer"),
    ("data_scientist",
     r"\bdata\s+scientist|\bdata\s+science\b(?!.*\bmanager\b)"
     r"|\bresearch\s+scientist,?\s+(data|ml|machine)"),
    ("data_analyst",
     r"\bdata\s+analyst|\banalytics\s+analyst|\breporting\s+analyst"
     r"|\binsights?\s+analyst|\bbi\s+analyst|\bbusiness\s+intelligence\s+analyst"),
    ("business_analyst",
     r"\bbusiness\s+analyst|\bbusiness\s+systems\s+analyst"
     r"|\bproduct\s+analyst|\bstrategy\s+(and|&)\s+operations\s+analyst"),
    ("backend_engineer",
     r"\bback\s*-?\s*end\s+engineer|\bbackend\s+(software\s+)?engineer"
     r"|\bplatform\s+engineer|\binfrastructure\s+engineer|\bserver\s+engineer"
     r"|\bdistributed\s+systems\s+engineer|\bapi\s+engineer"),
    ("software_engineer",
     r"\bsoftware\s+engineer|\bsoftware\s+development\s+engineer\b|\bsde\b"
     r"|\bfull\s*-?\s*stack\s+engineer|\bsoftware\s+developer"),
]

# Matched so that these postings do not fall through to a broader title, then
# dropped: Backend Engineer was removed from the study (user decision 2026-10-03;
# its skill profile was indistinguishable from Software Engineer, cosine 0.95).
EXCLUDED_TITLES = {"backend_engineer"}

# Titles that look like a match but are a different job entirely.
TITLE_EXCLUDE = re.compile(
    r"\b(manager|director|head\s+of|vp\b|vice\s+president|lead,|principal\s+manager"
    r"|intern\b|internship|co-?op\b|new\s+grad|university|phd\b|apprentice"
    r"|recruiter|sourcer|sales|account\s+executive|solutions?\s+(architect|engineer)"
    r"|customer|support\s+engineer|technical\s+program|program\s+manager"
    r"|product\s+manager|designer|marketing|contract\b|fellow\b)",
    re.I,
)

SENIORITY_RULES = [
    ("staff_plus", r"\b(staff|principal|senior\s+staff|distinguished|architect|l[67]\b"
                   r"|lead\s+engineer|tech\s+lead)\b"),
    ("senior", r"\b(senior|sr\.?|snr|iii\b|iv\b|l5\b|e5\b)\b"),
    ("junior", r"\b(junior|jr\.?|associate|entry|i\b|l3\b|e3\b|graduate)\b"),
]

# ── Location ──────────────────────────────────────────────────────────────
CA_CITIES = ("toronto", "vancouver", "montreal", "montréal", "ottawa", "calgary",
             "waterloo", "kitchener", "edmonton", "quebec", "québec", "halifax",
             "victoria", "winnipeg", "mississauga", "burnaby", "markham",
             "ontario", "british columbia", "alberta", "manitoba", "saskatchewan",
             "nova scotia", "new brunswick", "canada")
US_CITIES = ("san francisco", "new york", "nyc", "seattle", "austin", "boston",
             "chicago", "denver", "los angeles", "atlanta", "miami", "dallas",
             "houston", "portland", "san diego", "san jose", "palo alto",
             "mountain view", "sunnyvale", "bellevue", "redmond", "cambridge",
             "washington", "philadelphia", "phoenix", "nashville", "detroit",
             "pittsburgh", "salt lake", "minneapolis", "boulder", "raleigh",
             "charlotte", "columbus", "united states", "u.s.", "usa",
             "remote - us", "remote us", "us remote", "us-remote", "remote, us",
             "anywhere in the us", "nationwide", "bay area", "silicon valley",
             "brooklyn", "manhattan", "arlington", "mclean", "reston", "austin tx")
US_STATES = re.compile(r",\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|"
                       r"ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|"
                       r"RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b")
CA_PROV = re.compile(r",\s*(ON|BC|AB|QC|MB|SK|NS|NB|NL|PE)\b")


def country_of(text):
    if not text:
        return None
    t = text.lower()
    if CA_PROV.search(text) or any(c in t for c in CA_CITIES):
        return "CA"
    if US_STATES.search(text) or any(c in t for c in US_CITIES):
        return "US"
    return None


# Pay-transparency boilerplate is a reliable country signal in the body when the
# location string is only "Remote" or "Hybrid": US postings cite state pay laws,
# Canadian ones quote CAD or name a province.
US_BODY = re.compile(
    r"\b(colorado|new york city|california|washington state|equal employment"
    r"\s+opportunity|eeo\b|401\(k\)|401k|visa sponsorship in the u\.?s|usd\b"
    r"|pay transparency act|ftc\b|hipaa)\b", re.I)
CA_BODY = re.compile(
    r"\b(cad\b|canadian|canada|ontario|british columbia|quebec|alberta"
    r"|ohip|rrsp|provincial)\b", re.I)


def country_fallback(body):
    """Used only when the location string is ambiguous ('Remote', 'Hybrid').
    Counts country signals in the posting body and requires a clear margin."""
    us = len(US_BODY.findall(body))
    ca = len(CA_BODY.findall(body))
    if ca >= 2 and ca > us:
        return "CA"
    if us >= 2 and us > ca:
        return "US"
    return None


AMBIGUOUS_LOC = re.compile(
    r"^\s*(remote|hybrid|distributed|anywhere|flexible|onsite|on-site|various"
    r"|multiple locations|north america|remote \(.*\))\s*$", re.I)


def canonical_title(raw):
    if not raw or TITLE_EXCLUDE.search(raw):
        return None
    low = raw.lower()
    for name, pat in TITLE_RULES:
        if re.search(pat, low):
            return name
    return None


# "Infrastructure Engineer" also names civil, facilities and IT-support jobs.
# Titles matched only through that phrase need software signals in the body.
INFRA_ONLY = re.compile(r"\binfrastructure\s+engineer", re.I)
INFRA_NOT_SOFTWARE = re.compile(r"\b(critical|physical|site|it|facilities|hardware)\s+"
                                r"infrastructure\s+engineer", re.I)
BACKEND_OTHER = re.compile(r"back\s*-?\s*end|platform\s+engineer|server\s+engineer"
                           r"|distributed\s+systems|api\s+engineer", re.I)
SOFTWARE_SIGNAL = re.compile(r"\b(kubernetes|terraform|aws|gcp|azure|distributed\s+systems"
                             r"|golang|python|java|rust|microservices|linux)\b", re.I)


def reconcile(canon, raw_title, body):
    """JD-content check for ambiguous titles (plan: map by content, not string)."""
    if canon == "backend_engineer" and INFRA_ONLY.search(raw_title) \
            and not BACKEND_OTHER.search(raw_title):
        if INFRA_NOT_SOFTWARE.search(raw_title) or len(SOFTWARE_SIGNAL.findall(body)) < 3:
            return None
    return canon


def seniority_of(raw):
    low = " " + (raw or "").lower() + " "
    for name, pat in SENIORITY_RULES:
        if re.search(pat, low):
            return name
    return "mid"


TAG = re.compile(r"<[^>]+>")
WS = re.compile(r"[ \t ]+")


def to_text(markup):
    if not markup:
        return ""
    # Greenhouse returns the body HTML-escaped (&lt;p&gt;); decode it first or the
    # tag stripping below never sees a tag.
    if "&lt;" in markup and "<" not in markup:
        markup = html.unescape(markup)
    s = re.sub(r"</p>|</div>|</h[1-6]>", "\n\n", markup, flags=re.I)
    s = re.sub(r"</?(li|ul|ol|tr|br)\b[^>]*>", "\n", s, flags=re.I)
    s = TAG.sub(" ", s)
    s = html.unescape(s)
    s = s.replace("’", "'").replace("‘", "'")
    s = s.replace("“", '"').replace("”", '"').replace("–", "-")
    s = WS.sub(" ", s)
    s = re.sub(r"\n\s*\n\s*\n+", "\n\n", s)
    return s.strip()


# ── required vs preferred split ───────────────────────────────────────────
PREF_HEAD = re.compile(
    r"^\s*(?:[^\n]{0,80}?)\b(nice\s+to\s+have|preferred\s+qualifications?|bonus\s+points?"
    r"|preferred\s+(?:skills|experience)|pluses|it'?s\s+a\s+plus|even\s+better"
    r"|desired\s+qualifications?|additionally,?\s+(?:we'?d|it'?s))\b[^\n]{0,40}$",
    re.I | re.M)
REQ_HEAD = re.compile(
    r"^\s*(?:[^\n]{0,80}?)\b(minimum\s+qualifications?|basic\s+qualifications?"
    r"|required\s+qualifications?|what\s+you'?ll\s+need|who\s+you\s+are"
    r"|requirements?|qualifications?|what\s+we'?re\s+looking\s+for"
    r"|you\s+(?:should\s+)?have|skills?\s+and\s+experience)\b[^\n]{0,40}$",
    re.I | re.M)


def split_req_pref(text):
    """Return (required_text, preferred_text). Everything before the first
    preferred heading counts as required context; if no preferred heading
    exists, preferred is empty."""
    m = PREF_HEAD.search(text)
    if not m:
        return text, ""
    return text[:m.start()], text[m.start():]


# ── Board adapters ────────────────────────────────────────────────────────
def cache_path(token):
    return os.path.join(RAW, token + ".json")


def load_board(token, info, refresh=False):
    p = cache_path(token)
    if os.path.exists(p) and not refresh:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    ats = info["ats"]
    if ats == "greenhouse":
        code, data = fetch_json(
            "https://boards-api.greenhouse.io/v1/boards/%s/jobs?content=true" % token,
            timeout=120)
    elif ats == "lever":
        code, data = fetch_json(
            "https://api.lever.co/v0/postings/%s?mode=json" % token, timeout=90)
    else:
        code, data = fetch_json(
            "https://api.smartrecruiters.com/v1/companies/%s/postings?limit=100" % token,
            timeout=90)
    if data is None:
        return None
    payload = {"ats": ats, "token": token, "fetched": datetime.date.today().isoformat(),
               "data": data}
    with open(p, "w", encoding="utf-8") as f:
        json.dump(payload, f)
    return payload


def iter_postings(payload):
    """Yield a dict per posting: title, loc, posted, url, body, offices, pay_meta."""
    ats, data = payload["ats"], payload["data"]
    if ats == "greenhouse":
        for j in data.get("jobs", []):
            loc = (j.get("location") or {}).get("name", "")
            offices = ", ".join(
                (o.get("location") or o.get("name") or "")
                for o in (j.get("offices") or []))
            posted = j.get("first_published") or j.get("updated_at") or ""
            yield {"title": j.get("title", ""), "loc": loc, "offices": offices,
                   "posted": posted[:10], "url": j.get("absolute_url", ""),
                   "body": to_text(j.get("content", "")),
                   "pay_meta": greenhouse_pay(j.get("metadata"))}
    elif ats == "lever":
        for p in data:
            cat = p.get("categories") or {}
            loc = cat.get("location") or ""
            if p.get("country"):
                loc = loc + ", " + p["country"]
            ts = p.get("createdAt")
            posted = (datetime.datetime.utcfromtimestamp(ts / 1000).date().isoformat()
                      if ts else "")
            body = p.get("descriptionPlain", "") or ""
            for lst in p.get("lists", []):
                body += "\n\n" + to_text(lst.get("text", "")) + "\n" + \
                        to_text(lst.get("content", ""))
            body += "\n\n" + (p.get("additionalPlain", "") or "")
            yield {"title": p.get("text", ""), "loc": loc, "offices": "",
                   "posted": posted, "url": p.get("hostedUrl", ""),
                   "body": body, "pay_meta": None}
    else:
        for p in data.get("content", []):
            l = p.get("location") or {}
            yield {"title": p.get("name", ""),
                   "loc": (l.get("city", "") + ", " + l.get("country", "")),
                   "offices": "", "posted": (p.get("releasedDate") or "")[:10],
                   "url": p.get("ref", ""), "body": "", "pay_meta": None}


def greenhouse_pay(metadata):
    """Greenhouse exposes legally-required pay disclosures as a structured
    metadata field on boards that use it, which is far more reliable than
    parsing the range out of the prose."""
    for m in (metadata or []):
        name = (m.get("name") or "").lower()
        if "pay" not in name and "salary" not in name and "compensation" not in name:
            continue
        v = m.get("value")
        if isinstance(v, dict) and v.get("min_value") and v.get("max_value"):
            try:
                return (int(float(v["min_value"])), int(float(v["max_value"])),
                        (v.get("unit") or "USD").upper())
            except (TypeError, ValueError):
                continue
    return None


# ── Pay extraction from posting text (pay-transparency disclosures) ───────
MONEY = r"(?:USD|US\$|CAD|CA\$|C\$|\$)\s?(\d{2,3}(?:,\d{3})|\d{2,3}(?:\.\d)?\s?[kK])"
PAY_RANGE = re.compile(
    MONEY + r"\s*(?:-|–|—|to)\s*" + MONEY, re.I)
CAD_HINT = re.compile(r"\bCAD\b|\bCA\$|\bC\$|(?-i:\bCAN\b)|canadian", re.I)
USD_HINT = re.compile(r"\bUSD\b|\bUS\$|\bU\.S\.\s+base")


def parse_money(tok):
    tok = tok.replace(",", "").strip()
    if tok.lower().endswith("k"):
        return int(float(tok[:-1]) * 1000)
    return int(float(tok))


def extract_pay(text, country=None):
    """Return (low, high, currency) for the first plausible annual range.
    A bare '$' takes the posting country's currency (Canadian postings write CAD
    as '$'). With a country given, a range in the other currency is skipped:
    multi-country postings often quote the US range first, and that is not the
    Canadian pay."""
    want = {"CA": "CAD", "US": "USD"}.get(country)
    for m in PAY_RANGE.finditer(text):
        lo, hi = parse_money(m.group(1)), parse_money(m.group(2))
        if not (30000 <= lo <= 900000 and lo < hi <= 1500000):
            continue
        ctx = text[max(0, m.start() - 160):m.end() + 160]
        if re.search(r"\bper\s+hour|hourly|/hr\b", ctx, re.I):
            continue
        cur = ("CAD" if CAD_HINT.search(ctx) else
               "USD" if USD_HINT.search(ctx) else want)
        if want and cur != want:
            continue
        return lo, hi, cur
    return None, None, None


def main():
    refresh = "--refresh" in sys.argv
    with open(BOARDS, encoding="utf-8") as f:
        boards = json.load(f)
    os.makedirs(RAW, exist_ok=True)

    payloads = {}
    def work(item):
        token, info = item
        return token, load_board(token, info, refresh)
    with ThreadPoolExecutor(max_workers=6) as pool:
        for token, payload in pool.map(work, sorted(boards.items())):
            if payload:
                payloads[token] = payload

    records = []
    stats = {"postings": 0, "no_country": 0, "country_from_body": 0,
             "country_from_office": 0, "no_date": 0, "not_2026": 0,
             "no_title": 0, "excluded_title": 0, "short_body": 0, "duplicate": 0, "kept": 0}
    seen = set()
    for token, payload in payloads.items():
        group = boards[token]["group"]
        for p in iter_postings(payload):
            stats["postings"] += 1
            loc, body = p["loc"], p["body"]
            country = None
            if not AMBIGUOUS_LOC.match(loc or ""):
                country = country_of(loc)
            if country is None and p["offices"]:
                country = country_of(p["offices"])
                if country:
                    stats["country_from_office"] += 1
            if country is None and body:
                country = country_fallback(body)
                if country:
                    stats["country_from_body"] += 1
            if country is None:
                stats["no_country"] += 1
                continue
            posted = p["posted"]
            if not posted:
                stats["no_date"] += 1
                continue
            if not posted.startswith("2026"):
                stats["not_2026"] += 1
                continue
            canon = reconcile(canonical_title(p["title"]), p["title"], body)
            if canon is None:
                stats["no_title"] += 1
                continue
            if canon in EXCLUDED_TITLES:
                stats["excluded_title"] += 1
                continue
            if len(body) < 600:
                stats["short_body"] += 1
                continue
            # One requisition posted to several cities is one JD: same company,
            # title, country and body text count once (the first location kept).
            key = (token, p["title"].strip().lower(), country, body)
            if key in seen:
                stats["duplicate"] += 1
                continue
            seen.add(key)
            req, pref = split_req_pref(body)
            want_cur = "CAD" if country == "CA" else "USD"
            if p["pay_meta"] and p["pay_meta"][2] == want_cur:
                lo, hi, cur = p["pay_meta"]
                pay_src = "disclosure_field"
            else:
                lo, hi, cur = extract_pay(body, country)
                pay_src = "parsed_from_text" if lo else None
            if lo and not (30000 <= lo <= 900000 and lo < hi <= 1500000):
                lo = hi = cur = pay_src = None
            records.append({
                "company": token, "company_group": group,
                "ats": payload["ats"], "country": country, "location": loc,
                "title_raw": p["title"], "title": canon,
                "seniority": seniority_of(p["title"]),
                "posted_date": posted, "retrieved": payload["fetched"],
                "url": p["url"],
                "pay_low": lo, "pay_high": hi, "pay_currency": cur,
                "pay_source": pay_src,
                "text_required": req, "text_preferred": pref,
            })
            stats["kept"] += 1

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False)

    print("boards loaded: %d" % len(payloads))
    for k, v in stats.items():
        print("  %-14s %d" % (k, v))
    grid = {}
    for r in records:
        grid[(r["title"], r["country"])] = grid.get((r["title"], r["country"]), 0) + 1
    titles = [t for t, _ in TITLE_RULES if t not in EXCLUDED_TITLES]
    print("\n%-20s %5s %5s" % ("title", "US", "CA"))
    for t in titles:
        print("%-20s %5d %5d" % (t, grid.get((t, "US"), 0), grid.get((t, "CA"), 0)))
    paid = sum(1 for r in records if r["pay_low"])
    print("\npostings with a disclosed pay range: %d / %d (%.0f%%)"
          % (paid, len(records), 100.0 * paid / max(1, len(records))))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
