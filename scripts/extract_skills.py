"""Deterministic skill extraction: taxonomy regexes over every JD record.

Inputs : scripts/skill_taxonomy.json, data/jd/records.json,
         data/jd/records_linkedin.json (optional)
Output : data/jd/skill_matrix.json - one row per record with the skill ids
         matched in the required section and in the preferred section.

No LLM in this step; the same inputs always give the same matrix.
Run: python scripts/extract_skills.py
"""

import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TAXONOMY = os.path.join(HERE, "skill_taxonomy.json")
SOURCES = [("ats", os.path.join(ROOT, "data", "jd", "records.json")),
           ("linkedin", os.path.join(ROOT, "data", "jd", "records_linkedin.json"))]
OUT = os.path.join(ROOT, "data", "jd", "skill_matrix.json")


# ── Boilerplate stripping ─────────────────────────────────────────────────
# The verification gate found most false positives in company intros and in
# tails (benefits, EEO, privacy and recruiting-AI notices). A short
# heading-like line switches between job content and boilerplate.
JOB_HEAD = re.compile(
    r"\b(about\s+(the|this)\s+(role|position|job|team|opportunity)|the\s+role|the\s+team"
    r"|what\s+you('|\s+wi)ll\s+(do|work|be\s+doing|bring|need)|what\s+you\s+bring"
    r"|responsibilities|in\s+this\s+role|your\s+impact|you\s+will|you'll"
    r"|requirements?|qualifications?|who\s+you\s+are|what\s+we('re|\s+are)\s+looking\s+for"
    r"|skills|experience|nice\s+to\s+have|bonus|preferred|day[\s-]to[\s-]day"
    r"|the\s+opportunity|overview\s+of\s+the\s+role|job\s+description|key\s+duties"
    r"|about\s+(the|our|this)\b.{0,40}\bteam)\b", re.I)
BOILER_HEAD = re.compile(
    r"\b(about\s+(us|the\s+company|(?-i:(?!The\b)[A-Z][\w&.-]+(\s+[A-Z][\w&.-]+)?))\s*:?\s*$|who\s+we\s+are|our\s+(mission|values|story|culture)"
    r"|benefits|perks|what\s+we\s+offer|why\s+(join|work)|compensation|pay\s+transparency|salary"
    r"|total\s+rewards|equal\s+(employment\s+)?opportunity|eeo|diversity|inclusion"
    r"|accommodation|privacy|how\s+we('re|\s+are)\s+different|life\s+at|our\s+commitment"
    r"|logistics|location|work\s+(policy|arrangement)|hybrid|remote|#li|travel"
    r"|recruit(er|ment)|agenc(y|ies)|notice)\b", re.I)
BOILER_PARA = re.compile(
    r"equal\s+(employment\s+)?opportunity|without\s+regard\s+to|reasonable\s+accommodation"
    r"|protected\s+veteran|privacy\s+(notice|policy)|applicant\s+(privacy|notice)"
    r"|e-?verify|(use|uses|using)\s+(ai|artificial\s+intelligence)[^.]{0,60}(recruit|hiring|application)"
    r"|(recruit|hiring|application)[^.]{0,60}\b(ai|artificial\s+intelligence)\s+tools?"
    r"|401\(?k\)?|paid\s+time\s+off|parental\s+leave|health,\s+dental|medical,\s+dental"
    r"|base\s+(salary|pay)\s+range|salary\s+range|pay\s+range|fraudulent|recruitment\s+scam"
    r"|automated\s+employment\s+decision|\baedt\b|export\s+(control|administration)|\bitar\b"
    r"|authorization\s+to\s+receive|compensation\s+(philosophy|package|is\s+determined)"
    r"|fairness\s+in\s+our\s+compensation|(our|we\s+offer|comprehensive)\s+benefits"
    r"|wellness\s+(stipend|program)|learning\s+(and\s+development\s+)?stipend", re.I)

# U+2010..U+2015 and U+2212 hyphens/dashes (U+2011 appears in 59 JDs) and
# non-breaking spaces would make every hyphenated or spaced pattern miss.
NORMALISE = {cp: "-" for cp in (0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2015, 0x2212)}
NORMALISE.update({0x00A0: " ", 0x202F: " ", 0x2019: "'", 0x2018: "'"})


def normalise(text):
    return (text or "").translate(NORMALISE)


def is_heading(line):
    s = line.strip().rstrip(":.…").strip()
    return 0 < len(s) <= 70 and not s.endswith(".") and len(s.split()) <= 9


def strip_boilerplate(text, drop_intro=True):
    """Line-level: heading lines switch between job content and boilerplate;
    body lines are kept only in job mode and when they are not themselves an
    EEO / benefits / privacy sentence. With drop_intro, everything before the
    first job heading is dropped (only if such a heading exists)."""
    if not text:
        return ""
    lines = [l for l in normalise(text).splitlines() if l.strip()]

    def job_head(l):
        return is_heading(l) and JOB_HEAD.search(l) and not BOILER_HEAD.search(l)

    # The untitled intro is everything before the first non-boilerplate heading,
    # dropped only when the posting has at least one job heading at all.
    has_job = any(job_head(l) for l in lines)
    first_job = next((i for i, l in enumerate(lines)
                      if is_heading(l) and not BOILER_HEAD.search(l)), None) if has_job else None
    keep, skipping = [], False
    for i, l in enumerate(lines):
        if job_head(l):
            skipping = False
        elif is_heading(l) and BOILER_HEAD.search(l):
            skipping = True
        if drop_intro and first_job is not None and i < first_job:
            continue
        if skipping or BOILER_PARA.search(l):
            continue
        keep.append(l)
    return "\n".join(keep)


def load_taxonomy():
    with open(TAXONOMY, encoding="utf-8") as f:
        tax = json.load(f)
    return tax, [(s["id"], re.compile(s["pattern"], re.I)) for s in tax["skills"]]


def match(compiled, text):
    return sorted(sid for sid, rx in compiled if text and rx.search(text))


def main():
    tax, compiled = load_taxonomy()
    rows = []
    for source, path in SOURCES:
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            records = json.load(f)
        for i, r in enumerate(records):
            req = match(compiled, strip_boilerplate(r["text_required"]))
            pref = [s for s in match(compiled, strip_boilerplate(r["text_preferred"], False))
                    if s not in req]
            rows.append({
                "rid": "%s:%d" % (source, i), "source": source,
                "title": r["title"], "country": r["country"],
                "seniority": r["seniority"], "company": r["company"],
                "has_pref_section": bool(r["text_preferred"]),
                "required": req, "preferred": pref,
            })
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"taxonomy_version": tax["version"], "rows": rows}, f)

    n = len(rows)
    zero = sum(1 for r in rows if not r["required"] and not r["preferred"])
    avg = sum(len(r["required"]) + len(r["preferred"]) for r in rows) / max(1, n)
    print("records: %d  (ats %d, linkedin %d)" % (
        n, sum(r["source"] == "ats" for r in rows), sum(r["source"] == "linkedin" for r in rows)))
    print("records with no skill matched: %d" % zero)
    print("mean skills per record: %.1f" % avg)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
