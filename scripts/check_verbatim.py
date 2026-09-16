"""Check every quoted result sentence against the real abstract.

Two independent verifiers found the same defect a pass apart: a `verbatim` that splices two
non-adjacent sentences from an abstract into one, with no ellipsis and no flag. The numbers
in it are real, the wording is the paper's, and the existing automated checks pass it - so
it reads as a clean quotation while saying something the paper never said in one breath.

A quotation is contiguous or it is not. That is checkable for the whole corpus rather than
whichever rows a verifier happened to sample, so it is checked here.

Findings are written to a file the merge step reads; flagged rows get the same "check quote"
badge the other quote defects already use.

Usage:  python scripts/check_verbatim.py
"""

import html
import json
import pathlib
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "astro-blog" / "public" / "data" / "health-evidence.json"
OUT = ROOT / "docs" / "superpowers" / "research" / "_verbatim_status.json"
EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "health-evidence-audit/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def normalise(text):
    """Reduce both sides to a bare sequence of words, numbers and comparison operators.

    An earlier version kept punctuation, and the result was useless: a quote differing
    from the abstract only by a comma inside a confidence interval scored as though it
    had been spliced. Nearly a third of the corpus was flagged and almost none of it was
    actually wrong.

    What survives normalisation is chosen so that stripping it cannot change a claim.
    Three things are therefore kept rather than discarded, each because dropping it made
    two different statements look identical:

      - the minus sign in front of a figure, so a quote reporting -0.19 cannot match an
        abstract reporting 0.19;
      - the comparison operators, so "p >= 0.05" and "p <= 0.05" stay distinguishable
        after the entity decode turns both into a bare symbol this would otherwise strip;
      - decimal points, obviously.

    Everything the publishers do to figures is undone first, because none of it is
    content: numeric character references, the middle dot Cambridge journals set as a
    decimal point, and the thousands commas Cochrane writes.
    """
    t = html.unescape(text or "").lower()
    t = t.replace("\u2013", "-").replace("\u2014", "-").replace("\u2212", "-")
    # Cambridge journals set the decimal point as a middle dot - "3\u00b75 g/d", "-0\u00b719".
    t = re.sub(r"(?<=[0-9])\u00b7(?=[0-9])", ".", t)
    # Cochrane writes thousands with a comma - "52,105 participants".
    t = re.sub(r"(?<=[0-9]),(?=[0-9]{3}(?![0-9]))", "", t)
    # Operators carry the claim, so they become words before punctuation is stripped.
    # The corpus writes plus-minus as ASCII "+/-" and the abstracts write it as \u00b1.
    # Both must become the same word BEFORE the sign rule below runs: leaving "+/-" to be
    # stripped down to a bare "-" made "2.8+/-0.6" read as "2.8 -0.6", turning four exact
    # quotations into false splices.
    for sym, word in (("\u2265", " gte "), ("\u2264", " lte "), (">=", " gte "),
                      ("<=", " lte "), (">", " gt "), ("<", " lt "),
                      ("\u00b1", " plusminus "), ("+/-", " plusminus "),
                      ("-/+", " plusminus ")):
        t = t.replace(sym, word)
    # Abstracts print the Greek letter, the extraction spells it out: "TNF-\u03b1" against
    # "TNF-alpha", "IL-1\u03b2" against "IL-1beta". Stripping the letter as punctuation left
    # the two sides genuinely different and cost true matches on the interleukins.
    for greek, name in (("\u03b1", " alpha "), ("\u03b2", " beta "), ("\u03b3", " gamma "),
                        ("\u03b4", " delta "), ("\u03ba", " kappa "), ("\u03bc", " mu "),
                        ("\u03c9", " omega ")):
        t = t.replace(greek, name)
    t = re.sub(r"[^a-z0-9.\-]+", " ", t)
    # A dash is a minus sign only where it stands directly in front of a figure with
    # nothing but space behind it. Everything else - hyphenated words, an em dash between
    # clauses, a stray "= - 2.53" - is punctuation and goes. Trying to express that as one
    # negative lookbehind let a spaced dash through and cost a true match; marking the real
    # signs first and then clearing the field is easier to read and to be sure of.
    # The minus and the figure it signs are often separated by a thin or non-breaking
    # space in the source ("MD =-\u00a02.53"), so the gap is closed rather than treated as
    # proof that the dash was punctuation.
    t = re.sub(r"(?:(?<=\s)|\A)-\s*(?=[0-9])", "\x01", t)
    t = t.replace("-", " ").replace("\x01", "-")
    t = re.sub(r"(?<![0-9])\.+|\.+(?![0-9])", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def pmid_for(doi):
    q = urllib.parse.quote(f'"{doi}"[AID]')
    try:
        xml = fetch(f"{EUTILS}/esearch.fcgi?db=pubmed&term={q}&retmax=1")
    except Exception:
        return None
    m = re.search(r"<Id>(\d+)</Id>", xml)
    return m.group(1) if m else None


def abstracts_for(pmids):
    xml = fetch(f"{EUTILS}/efetch.fcgi?db=pubmed&id={','.join(pmids)}&retmode=xml")
    out = {}
    for chunk in xml.split("<PubmedArticle>")[1:]:
        m = re.search(r"<PMID[^>]*>(\d+)</PMID>", chunk)
        if not m:
            continue
        parts = re.findall(r"<AbstractText[^>]*>(.*?)</AbstractText>", chunk, re.S)
        text = " ".join(re.sub(r"<[^>]+>", "", p) for p in parts)
        text = (text.replace("&lt;", "<").replace("&gt;", ">")
                    .replace("&amp;", "&").replace("&quot;", '"'))
        out[m.group(1)] = text
    return out


def longest_run(quote, abstract):
    """Fraction of the quote covered by its longest contiguous run in the abstract.

    A clean quotation scores 1.0. A splice of two halves scores near 0.5 - each half is
    present, neither is the whole. A paraphrase scores low. Full-text-only quotes score 0
    because the abstract never contained them, which is why a low score is a lead to look
    at rather than a verdict on its own.
    """
    q, a = normalise(quote), normalise(abstract)
    if not q or not a:
        return None
    if q in a:
        return 1.0
    words = q.split()
    best = 0
    for start in range(len(words)):
        if len(words) - start <= best:
            break
        lo, hi = best, len(words) - start
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if " ".join(words[start:start + mid]) in a:
                lo = mid
            else:
                hi = mid - 1
        best = max(best, lo)
    return round(best / len(words), 3)


def categorise(quote, abstract, score):
    """Name what a given score actually means, so nothing downstream has to guess.

    A low score is not one finding, it is four, and they call for opposite treatment:

      near            - close enough that the gap is a transcription slip ("12 wk" for
                        "12 weeks"). Not worth a reader's attention.
      spliced         - every figure in the quote is somewhere in the abstract, yet the
                        words refuse to run contiguously. The sentence was assembled out
                        of parts. This is the defect two verifiers found by hand.
      unmatched       - the same, but with almost no contiguity at all. Every number
                        checks out and the sentence still is not there.
      beyond_abstract - a figure in the quote is absent from the abstract, so the
                        sentence came from the full text. Ordinary practice, no fault.
      no_numbers      - the quote carries no figure to test, so the two cases above
                        cannot be told apart. A lead, and honestly labelled as one.
    """
    if score >= 0.8:
        return "near"
    qn = set(re.findall(r"\d+\.?\d*", normalise(quote)))
    an = set(re.findall(r"\d+\.?\d*", normalise(abstract)))
    if not qn:
        return "no_numbers"
    if qn - an:
        return "beyond_abstract"
    return "spliced" if score >= 0.35 else "unmatched"


def main():
    data = json.load(DATA.open(encoding="utf-8"))

    by_doi = {}
    for e in data["edges"]:
        doi = (e.get("paper") or {}).get("doi")
        if doi and e.get("verbatim"):
            by_doi.setdefault(doi, []).append(e)

    print(f"checking quoted sentences for {len(by_doi)} papers")

    cache_path = OUT.parent / "_abstract_cache.json"
    cache = {}
    if cache_path.exists():
        with cache_path.open(encoding="utf-8") as fh:
            cache = json.load(fh)
        print(f"  {len(cache)} abstracts already cached")

    resolved = {}
    for i, doi in enumerate(by_doi, 1):
        if doi in cache:
            continue
        pmid = pmid_for(doi)
        if pmid:
            resolved[pmid] = doi
        if i % 25 == 0:
            print(f"  resolved {i}/{len(by_doi)}")
        time.sleep(0.34)

    abstracts = dict(cache)
    pmids = list(resolved)
    for i in range(0, len(pmids), 40):
        try:
            for pmid, text in abstracts_for(pmids[i:i + 40]).items():
                abstracts[resolved[pmid]] = text
        except Exception as exc:
            print(f"  efetch batch failed: {exc}")
        time.sleep(0.34)

    results, buckets = {}, {"exact": 0, "partial": 0, "spliced": 0, "absent": 0, "no_abstract": 0}
    for doi, edges in by_doi.items():
        abstract = abstracts.get(doi)
        for e in edges:
            key = e.get("edge_id") or e.get("legacy_key")
            if not abstract:
                buckets["no_abstract"] += 1
                continue
            score = longest_run(e["verbatim"], abstract)
            if score is None:
                buckets["no_abstract"] += 1
                continue
            if score >= 0.995:
                buckets["exact"] += 1
                continue
            band = "partial" if score >= 0.8 else ("spliced" if score >= 0.35 else "absent")
            buckets[band] += 1
            results[key] = {"doi": doi, "coverage": score, "band": band,
                            "kind": categorise(e["verbatim"], abstract, score)}

    kinds = {}
    for r in results.values():
        kinds[r["kind"]] = kinds.get(r["kind"], 0) + 1

    with cache_path.open("w", encoding="utf-8") as fh:
        json.dump(abstracts, fh, ensure_ascii=False)

    payload = {
        "_note": "Longest contiguous run of each quoted sentence found in its paper's "
                 "PubMed abstract, as a fraction of the quote. 1.0 is a clean quotation. "
                 "Around 0.5 usually means two non-adjacent sentences spliced together. "
                 "A low score can also mean the sentence came from the full text, which the "
                 "abstract never contained, so treat these as leads rather than verdicts. "
                 "Written by scripts/check_verbatim.py.",
        "buckets": buckets,
        "kinds": kinds,
        "flagged": results,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    json.dump(payload, OUT.open("w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print(f"\n  exact quotations      {buckets['exact']}")
    print(f"  mostly contiguous     {buckets['partial']}")
    print(f"  likely spliced        {buckets['spliced']}")
    print(f"  not in the abstract   {buckets['absent']}")
    print(f"  abstract unavailable  {buckets['no_abstract']}")
    for k in sorted(kinds):
        print(f"    of which {k:16} {kinds[k]}")
    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()
