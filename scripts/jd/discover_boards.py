"""Discover which candidate employers expose a public job board API.

Only official, unauthenticated job-board APIs are probed:
  Greenhouse      https://boards-api.greenhouse.io/v1/boards/<token>/jobs
  Lever           https://api.lever.co/v0/postings/<token>?mode=json
  SmartRecruiters https://api.smartrecruiters.com/v1/companies/<token>/postings

These endpoints exist so job boards and aggregators can consume postings, so
reading them is not scraping. Workday, Ashby, Workable and Job Bank are
unreachable from this environment (connection refused by the network policy),
which is why no bank, telco or large non-tech employer appears in the hit list.

Writes scripts/jd/boards.json: {token: {ats, name, n_jobs}}.
Run: python scripts/jd/discover_boards.py
"""

import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetchlib import fetch_json  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "boards.json")

# Candidate employers, grouped so the final sample can be checked for mix.
# "big tech / large product", "mid-size product", "AI-native", "Canada",
# "non-tech employer hiring tech". Tokens are guesses; misses are expected and
# are simply dropped.
CANDIDATES = {
    "large": """
    stripe airbnb lyft doordash instacart pinterest reddit coinbase robinhood
    dropbox cloudflare datadog mongodb elastic hashicorp twilio asana figma
    notion discord affirm chime plaid brex gusto rippling samsara benchling
    grammarly duolingo squarespace etsy peloton wayfair zillow redfin compass
    carta flexport databricks snowflake confluent gitlab atlassian unity roblox
    """,
    "midsize": """
    seatgeek vimeo shutterstock draftkings fanatics warbyparker allbirds
    thumbtack angi nextdoor bumble hinge eventbrite classpass calm headspace
    oscar devoted cedar ro hims zocdoc komodohealth tempus flatiron
    sharethrough liftoff attentive klaviyo braze amplitude mixpanel heap
    segment fivetran dbtlabs hex sigmacomputing airbyte starburst
    """,
    "ai": """
    anthropic openai scaleai huggingface cohere runwayml perplexityai
    adeptailabs mistralai weightsandbiases langchain llamaindex together
    fireworksai anyscale modal replicate pineconeio weaviate chroma
    """,
    "canada": """
    shopify wealthsimple clio faire 1password hootsuite thinkific jobber
    vidyard ada cohere benevity later lightspeed nuvei coveo kinaxis wattpad
    ecobee borrowell koho neofinancial pointclickcare tophat d2l axonify
    dialogue sampler bench clearco properly dapper league knak alida
    """,
    "nontech": """
    nytimes vox theathletic spotify sonos gopro casper away blueapron
    sweetgreen chewy carvana opendoor zipcar getaround turo lime bird
    cruise rivian lucidmotors zoox nuro aurora kodiak
    """,
}

GH = "https://boards-api.greenhouse.io/v1/boards/%s/jobs"
LV = "https://api.lever.co/v0/postings/%s?mode=json"
SR = "https://api.smartrecruiters.com/v1/companies/%s/postings?limit=1"


def probe(args):
    group, token = args
    code, data = fetch_json(GH % token, timeout=25)
    if code == 200 and isinstance(data, dict) and data.get("jobs"):
        return token, {"ats": "greenhouse", "group": group, "n_jobs": len(data["jobs"])}
    code, data = fetch_json(LV % token, timeout=25)
    if code == 200 and isinstance(data, list) and data:
        return token, {"ats": "lever", "group": group, "n_jobs": len(data)}
    code, data = fetch_json(SR % token, timeout=25)
    if code == 200 and isinstance(data, dict) and data.get("totalFound"):
        return token, {"ats": "smartrecruiters", "group": group,
                       "n_jobs": data["totalFound"]}
    return token, None


def main():
    tasks = []
    for group, blob in CANDIDATES.items():
        for token in blob.split():
            tasks.append((group, token))
    hits = {}
    with ThreadPoolExecutor(max_workers=12) as pool:
        for token, info in pool.map(probe, tasks):
            if info:
                hits[token] = info
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(hits, f, indent=2, sort_keys=True)

    by_group = {}
    for token, info in hits.items():
        by_group.setdefault(info["group"], []).append(token)
    print("probed %d candidates, %d boards found" % (len(tasks), len(hits)))
    for group in CANDIDATES:
        found = sorted(by_group.get(group, []))
        total = len(CANDIDATES[group].split())
        print("  %-8s %2d/%2d  %s" % (group, len(found), total, " ".join(found)))
    ats = {}
    for info in hits.values():
        ats[info["ats"]] = ats.get(info["ats"], 0) + 1
    print("  by ats:", ats)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
