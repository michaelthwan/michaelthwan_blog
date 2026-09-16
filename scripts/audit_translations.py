"""Deterministic check that zh-TW overlay text did not drop numbers from English.

The translation agents were told to keep every digit. One of them caught itself
turning "type 1/type 2 diabetes" into "第一型／第二型" — the Chinese numerals
made the original 1 and 2 unrecoverable. This script is that check, applied to
the whole overlay rather than one batch: every Arabic number in a translated
English field must still appear as an Arabic number in the Chinese.

verbatim / key_results / effect are not translated (always English) and are
ignored. Year ranges written as "2013 年至 2020 年" still contain both digits
and pass. Chinese numerals in place of those digits fail.

Usage:  python scripts/audit_translations.py
"""

import collections
import json
import pathlib
import re
import sys
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
EN = ROOT / "astro-blog" / "public" / "data" / "health-evidence.json"
ZH = ROOT / "astro-blog" / "public" / "data" / "health-evidence.zh-TW.json"

problems = []
notes = []


def problem(kind, detail):
    problems.append(f"[{kind}] {detail}")


def note(kind, detail):
    notes.append(f"[{kind}] {detail}")


# Chemical and assay names embed digits that are not quantities. Mask them so
# "HbA1c" / "VO2max" / "GLP-1" do not look like dropped 1s and 2s.
SCI_NAME = re.compile(
    r"HbA1c|A1c|VO2max|VO\s*2|GLP-?1|25\(OH\)D",
    re.IGNORECASE,
)

# Ordinary Chinese number words. "第一類" / "第二型" / "三臂" are correct zh-TW,
# not missing digits.
CN_DIGIT = {
    "零": 0, "〇": 0, "一": 1, "二": 2, "兩": 2, "三": 3, "四": 4,
    "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10,
}


def numbers(text):
    """Arabic number tokens, with thousand-separators and '.001' restored.

    Western grouping (1,337) is stripped on the original string, before NFKC.
    NFKC turns the Chinese enumeration comma into ASCII ',', and stripping
    after that glues 'P=0.34，357' into '0.34357'.
    """
    t = SCI_NAME.sub(" ", text or "")
    t = re.sub(r"(?<!\.)\b\d{1,3}(?:,\d{3})+\b", lambda m: m.group(0).replace(",", ""), t)
    t = unicodedata.normalize("NFKC", t)
    t = re.sub(r"(?<![\d.])\.(\d)", r"0.\g<1>", t)
    return re.findall(r"\d+(?:\.\d+)?", t)


def zh_values(zh_text):
    """Arabic numbers plus Chinese numerals and 萬-scaled quantities."""
    vals = set()
    for t in numbers(zh_text):
        try:
            vals.add(float(t))
        except ValueError:
            pass
    for ch, n in CN_DIGIT.items():
        if ch in (zh_text or ""):
            vals.add(float(n))
    # "23.5 million" -> "2,350 萬" is 23.5 * 100 萬. Accept that scaling.
    wan = re.findall(
        r"(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*萬",
        unicodedata.normalize("NFKC", zh_text or ""),
    )
    for w in wan:
        try:
            n = float(w.replace(",", ""))
        except ValueError:
            continue
        vals.add(n)
        vals.add(n / 100.0)       # million -> 萬
        vals.add(n / 10000.0)     # 億-style slip; harmless if unused
    return vals


def missing_numbers(en_text, zh_text):
    """Quantities in English that are absent from the Chinese, even as a float."""
    zh_float = zh_values(zh_text)
    dropped, reformatted = [], []
    seen = set()
    en_tok = numbers(en_text)
    zh_tok = set(numbers(zh_text))
    for t in en_tok:
        if t in seen:
            continue
        seen.add(t)
        if t in zh_tok:
            continue
        try:
            f = float(t)
        except ValueError:
            dropped.append(t)
            continue
        if f in zh_float:
            continue
        dropped.append(t)
    return dropped, reformatted


def overlay_for_edge(edge, table):
    return table.get(edge.get("edge_id")) or table.get(edge.get("legacy_key"))


def check_pair(kind, key, field, en_text, zh_text):
    if not en_text:
        return
    if zh_text is None:
        problem("untranslated-field", f"{kind} {key} .{field}")
        return
    dropped, _reformatted = missing_numbers(en_text, zh_text)
    if dropped:
        problem("dropped-number",
                f"{kind} {key} .{field} lost {dropped}  en={en_text!r:.180}")


def main():
    with EN.open(encoding="utf-8") as fh:
        en = json.load(fh)
    with ZH.open(encoding="utf-8") as fh:
        zh = json.load(fh)

    zh_goals = zh.get("goals") or {}
    zh_markers = zh.get("markers") or {}
    zh_behaviors = zh.get("behaviors") or {}
    zh_edges = zh.get("edges") or {}
    zh_groups = zh.get("groups") or {}

    for g in en["nodes"]["goals"]:
        hit = zh_goals.get(g["id"])
        if not hit:
            problem("missing-goal", f'{g["id"]} ("{g.get("name")}")')
            continue
        check_pair("goal", g["id"], "name", g.get("name"), hit.get("name"))

    for m in en["nodes"]["markers"]:
        hit = zh_markers.get(m["id"])
        if not hit:
            problem("missing-marker", f'{m["id"]} ("{m.get("name")}")')
            continue
        check_pair("marker", m["id"], "name", m.get("name"), hit.get("name"))

    for b in en["nodes"]["behaviors"]:
        hit = zh_behaviors.get(b["id"])
        if not hit:
            problem("missing-behavior", f'{b["id"]} ("{b.get("name")}")')
            continue
        check_pair("behavior", b["id"], "name", b.get("name"), hit.get("name"))
        check_pair("behavior", b["id"], "dose_or_intensity",
                   b.get("dose_or_intensity"), hit.get("dose_or_intensity"))

    matched_id = matched_legacy = 0
    for e in en["edges"]:
        hit = overlay_for_edge(e, zh_edges)
        key = e.get("edge_id") or e.get("legacy_key")
        if not hit:
            problem("missing-edge", key)
            continue
        if e.get("edge_id") in zh_edges:
            matched_id += 1
        else:
            matched_legacy += 1
        for field in ("conditional_on", "population", "caveats"):
            check_pair("edge", key, field, e.get(field), hit.get(field))

    en_groups = {b.get("group") for b in en["nodes"]["behaviors"] if b.get("group")}
    for g in sorted(en_groups):
        if g not in zh_groups:
            problem("missing-group", g)

    print(f"audited {len(en['edges'])} edges against {len(zh_edges)} overlay keys")
    print(f"  overlay hits by unique id {matched_id}  by legacy key {matched_legacy}")
    print(f"  goals {len(en['nodes']['goals'])}  markers {len(en['nodes']['markers'])}  "
          f"behaviors {len(en['nodes']['behaviors'])}")
    if notes:
        print(f"\n{len(notes)} note(s):")
        for n in notes[:60]:
            print("  ", n)
        if len(notes) > 60:
            print(f"   ... {len(notes) - 60} more")
    if problems:
        print(f"\n{len(problems)} PROBLEM(S):")
        for p in problems:
            print("  ", p)
        sys.exit(1)
    print("\nno problems found")


if __name__ == "__main__":
    main()
