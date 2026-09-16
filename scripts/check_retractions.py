"""Check every cited paper against PubMed for retractions, corrections and concerns.

A verifier flagged the gap this closes: the dataset disclosed an Expression of Concern on
one paper because the extracting agent happened to notice it, while the other cited papers
were never checked at all. Noticing by chance is not a process. PubMed records these links
in CommentsCorrectionsList, so the whole corpus can be checked deterministically.

Findings are written to a file the merge step reads, so a flagged paper shows a badge on
every row that cites it rather than depending on whoever wrote that row.

Usage:  python scripts/check_retractions.py
"""

import json
import pathlib
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "astro-blog" / "public" / "data" / "health-evidence.json"
OUT = ROOT / "docs" / "superpowers" / "research" / "_paper_status.json"

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

# RefTypes worth surfacing. "CommentIn" and "ErratumFor" are noise for this purpose:
# the first is ordinary commentary, the second means this paper corrects another.
SERIOUS = {
    "RetractionIn": "retracted",
    "ExpressionOfConcernIn": "expression_of_concern",
    "ErratumIn": "erratum",
    "CorrectedandRepublishedIn": "corrected_and_republished",
}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "health-evidence-audit/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def pmid_for(doi):
    q = urllib.parse.quote(f'"{doi}"[AID]')
    try:
        xml = fetch(f"{EUTILS}/esearch.fcgi?db=pubmed&term={q}&retmax=1")
    except Exception as exc:
        return None, f"esearch failed: {exc}"
    m = re.search(r"<Id>(\d+)</Id>", xml)
    return (m.group(1) if m else None), None


def statuses_for(pmids):
    """Return {pmid: [(kind, note), ...]} for a batch of PubMed ids."""
    ids = ",".join(pmids)
    xml = fetch(f"{EUTILS}/efetch.fcgi?db=pubmed&id={ids}&retmode=xml")
    out = {}
    for chunk in xml.split("<PubmedArticle>")[1:]:
        m = re.search(r"<PMID[^>]*>(\d+)</PMID>", chunk)
        if not m:
            continue
        pmid = m.group(1)
        found = []
        if "<PublicationType UI=\"D016441\">Retracted Publication</PublicationType>" in chunk:
            found.append(("retracted", "PubMed publication type: Retracted Publication"))
        for ref_type, kind in SERIOUS.items():
            for cc in re.findall(r'<CommentsCorrections RefType="' + ref_type + r'">(.*?)</CommentsCorrections>',
                                 chunk, re.S):
                ref = re.search(r"<RefSource>(.*?)</RefSource>", cc, re.S)
                found.append((kind, (ref.group(1).strip() if ref else ref_type)))
        if found:
            out[pmid] = found
    return out


def main():
    with DATA.open(encoding="utf-8") as fh:
        data = json.load(fh)

    dois = []
    for e in data["edges"]:
        doi = (e.get("paper") or {}).get("doi")
        if doi and doi not in dois:
            dois.append(doi)

    print(f"checking {len(dois)} cited papers against PubMed")

    resolved, unresolved = {}, []
    for i, doi in enumerate(dois, 1):
        pmid, err = pmid_for(doi)
        if pmid:
            resolved[pmid] = doi
        else:
            unresolved.append(doi)
        if i % 25 == 0:
            print(f"  resolved {i}/{len(dois)}")
        time.sleep(0.34)          # NCBI allows 3 requests a second without an API key

    print(f"  resolved to PubMed: {len(resolved)}   not found: {len(unresolved)}")

    flagged = {}
    pmids = list(resolved)
    for i in range(0, len(pmids), 40):
        batch = pmids[i:i + 40]
        try:
            for pmid, found in statuses_for(batch).items():
                flagged[resolved[pmid]] = [{"kind": k, "note": n} for k, n in found]
        except Exception as exc:
            print(f"  efetch batch failed: {exc}")
        time.sleep(0.34)

    payload = {
        "_note": "Publication-status flags pulled from PubMed for every cited paper. "
                 "Written by scripts/check_retractions.py; consumed by the merge step so "
                 "that a flagged paper marks every row citing it.",
        "checked": len(dois),
        "resolved": len(resolved),
        "unresolved": unresolved,
        "by_doi": flagged,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=1)

    serious = {d: f for d, f in flagged.items()
               if any(x["kind"] in ("retracted", "expression_of_concern") for x in f)}
    print(f"\npapers with any correction notice: {len(flagged)}")
    print(f"papers retracted or under an Expression of Concern: {len(serious)}")
    for doi, f in serious.items():
        print(f"  {doi}: {', '.join(x['kind'] for x in f)}")
    print(f"\nwrote {OUT}")
    if unresolved:
        print(f"note: {len(unresolved)} DOIs could not be matched in PubMed and were not checked")


if __name__ == "__main__":
    main()
