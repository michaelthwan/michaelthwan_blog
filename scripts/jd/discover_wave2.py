"""Wave 2 board discovery: probe a much larger candidate list and merge hits
into boards.json.

Wave 1 (discover_boards.py) found 67 boards from 166 candidates, which left the
rarer titles — Analytics Engineer, MLOps Engineer, Business Analyst — far below
the 40-per-cell floor, and Canada thin everywhere. Breadth is the only fix that
does not require scraping, so this wave probes a much wider list. Misses cost
one HTTP request and are discarded.

Run: python scripts/jd/discover_wave2.py
"""

import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from fetchlib import fetch_json  # noqa: E402

BOARDS = os.path.join(HERE, "boards.json")

CANDIDATES = {
    # ── Canada: the binding constraint on the whole study ────────────────
    "canada": """
    shopify wealthsimple clio faire 1password onepassword hootsuite thinkific
    jobber vidyard ada adasupport cohere benevity later lightspeed lightspeedhq
    nuvei coveo kinaxis wattpad ecobee borrowell koho neofinancial neo
    pointclickcare tophat d2l axonify dialogue bench benchaccounting clearco
    dapperlabs dapper league knak alida rewind flipp ritual drop waveapps wave
    freshbooks hubdoc integrateai deepgenomics bluedot winterlight cyclica
    proteinqure xanadu xanaduai 1qbit dwavesys altaml attabotics symend
    zayzoon helcim showpass zerokey miovision clearpathrobotics avidbots
    intellijoint bonfire encircle voltus assent fullscript klipfolio solink
    martello rossvideo calian opentext descartes enghouse tucows absolute
    magnetforensics trulioo verafin mogo fundthrough zensurance sonnet
    unbounce visier diligent procurify klue dooly janeapp jane aspectbiosystems
    zymeworks abcellera sanctuaryai mojio finnai hopper sonder breather
    poka workleap gsoft botpress locallogic paper stradigi imagia mila
    proposify metamaterial manifold eastvalley wajax sylvite tenstorrent
    blockstream ledn shakepay netcoins bitbuy coinsquare virgo wonder
    properly perch carebook maplewave swiftmedical thinkresearch pagefreezer
    certn trulydigital bitstrips skipthedishes instacart prodigygame prodigy
    wysdom receptiviti nicoya hyivy kepler keplercommunications spaceryde
    telesat mdarobotics nuvation bitnobi ianacare medmedigital
    vena venasolutions q4inc q4 influitive uberflip postbeyond sociabble
    achievers cloudmd maplelabs maple felixhealth tiahealth
    coconutsoftware kognitiv eqbank eqworks cineplexdigital corus
    """,
    # ── US large product and platform companies ──────────────────────────
    "us_large": """
    snap snapchat zoom slack box okta auth0 twilio sendgrid segment
    docusign dropbox atlassian servicenow workiva smartsheet airtable miro
    canva grammarly calendly loom zapier webflow vercel netlify render
    digitalocean fastly akamai sentry launchdarkly pagerduty sumologic
    newrelic dynatrace splunk grafana chronosphere honeycomb circleci
    harness jfrog sonarsource snyk wiz orca lacework sysdig tenable rapid7
    crowdstrike sentinelone cybereason arcticwolf huntress dragos claroty
    netskope zscaler cloudflare fortinet proofpoint mimecast abnormal
    """,
    # ── Data and analytics vendors: the Analytics Engineer heartland ─────
    "data_vendors": """
    dbtlabs getdbt hex hexteam sigmacomputing census getcensus hightouch
    montecarlodata bigeye atlan selectstar cubedev preset metabase mode
    modeanalytics thoughtspot alteryx dataiku dominodatalab h2oai datarobot
    snorkelai labelbox scaleai aquariumlearning galileo arize whylabs fiddler
    truera cometml neptuneai zenml seldon octoml bentoml deepset vectara
    qdrant zilliz redis clickhouse timescale cockroachlabs singlestore
    yugabyte planetscale neon supabase prisma temporal dagsterlabs dagster
    astronomer prefect estuary decodable materialize tinybird rockset imply
    streamnative redpanda upsolver dremio firebolt starburstdata trino
    confluent fivetran airbyte matillion stitch talend informatica collibra
    alation datahub acryldata secoda euno transform lightdash omni
    """,
    # ── AI-native ────────────────────────────────────────────────────────
    "ai_native": """
    openai anthropic mistral mistralai cohereai perplexity perplexityai
    runway runwayml elevenlabs synthesia descript characterai inflection
    adept imbue reka contextual contextualai sierra sierraai decagon
    harvey hebbia glean writer writerai jasper copyai typeface tome
    cresta observeai assembly assemblyai deepgram speechmatics
    huggingface weightsandbiases wandb lightningai gradient modal
    replicate baseten fal falai lambdalabs coreweave crusoe voltagepark
    nebius sambanova groq cerebras tenstorrent etched dmatrix
    """,
    # ── Fintech and insurance ────────────────────────────────────────────
    "fintech": """
    plaid marqeta unit mercury column modern treasury moderntreasury
    ramp brex navan expensify bill divvy melio tipalti airwallex
    wise remitly nium rapyd checkout adyen klarna afterpay sezzle
    betterment wealthfront acorns stash public m1finance alpaca
    lemonade root hippo nextinsurance coalition atbay corvus
    pie clearcover kin branch ethos ladder policygenius
    nerdwallet creditkarma sofi chime varo current dave empower
    addepar carta pitchbook ycharts intrinio polygon finicity
    """,
    # ── Health, bio, climate, industrial ─────────────────────────────────
    "health_industrial": """
    oscarhealth devoted cedar ro hims zocdoc komodohealth tempus
    flatironhealth benchling recursion insitro genesistherapeutics
    isomorphic absci generate schrodinger veeva iqvia datavant
    truveta verily colorhealth invitae grail guardanthealth
    carbonhealth forward parsley omada virta noom calm headspace
    springhealth lyrahealth modernhealth headway alma grow
    watershed persefoni sweep plana crusoeenergy formenergy
    redwoodmaterials sila ionic quantumscape solidpower
    zipline skydio shield shieldai anduril applied appliedintuition
    waabi aurora kodiak gatik einride nuro zoox motional
    samsara motive keeptruckin flexport convoy project44 fourkites
    """,
    # ── Consumer, media, retail, gaming ──────────────────────────────────
    "consumer_media": """
    spotify soundcloud bandcamp patreon substack medium ghost
    nytimes theatlantic vox buzzfeed vice axios politico semafor
    netflix hulu roku vizio plex mubi criterion
    epicgames riotgames bungie respawn insomniac naughtydog
    zynga scopely jamcity playtika supercell king rovio
    discord twitch kick rumble
    etsy poshmark thredup depop mercari offerup
    instacart doordash grubhub gopuff getir gorillas
    peloton whoop oura eightsleep hingehealth tonal
    warbyparker allbirds glossier away casper purple
    chewy bark rover wag
    """,
}


def probe(args):
    group, token = args
    code, data = fetch_json(
        "https://boards-api.greenhouse.io/v1/boards/%s/jobs" % token, timeout=20)
    if code == 200 and isinstance(data, dict) and data.get("jobs"):
        return token, {"ats": "greenhouse", "group": group, "n_jobs": len(data["jobs"])}
    code, data = fetch_json(
        "https://api.lever.co/v0/postings/%s?mode=json" % token, timeout=20)
    if code == 200 and isinstance(data, list) and data:
        return token, {"ats": "lever", "group": group, "n_jobs": len(data)}
    code, data = fetch_json(
        "https://api.smartrecruiters.com/v1/companies/%s/postings?limit=1" % token,
        timeout=20)
    if code == 200 and isinstance(data, dict) and data.get("totalFound"):
        return token, {"ats": "smartrecruiters", "group": group,
                       "n_jobs": data["totalFound"]}
    return token, None


def main():
    with open(BOARDS, encoding="utf-8") as f:
        boards = json.load(f)
    known = set(boards)

    tasks, seen = [], set()
    for group, blob in CANDIDATES.items():
        for token in blob.split():
            if token in known or token in seen:
                continue
            seen.add(token)
            tasks.append((group, token))

    found = {}
    with ThreadPoolExecutor(max_workers=16) as pool:
        for token, info in pool.map(probe, tasks):
            if info:
                found[token] = info

    boards.update(found)
    with open(BOARDS, "w", encoding="utf-8") as f:
        json.dump(boards, f, indent=2, sort_keys=True)

    by_group = {}
    for token, info in found.items():
        by_group.setdefault(info["group"], []).append(token)
    print("wave 2: probed %d new candidates, %d boards found" % (len(tasks), len(found)))
    for group in CANDIDATES:
        hits = sorted(by_group.get(group, []))
        total = len([t for g, t in tasks if g == group])
        print("  %-18s %3d/%3d" % (group, len(hits), total))
        if hits:
            print("      " + " ".join(hits))
    print("\nboards.json now holds %d boards" % len(boards))


if __name__ == "__main__":
    main()
