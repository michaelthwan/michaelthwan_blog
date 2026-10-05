"""Wave 3 board discovery.

Wave 2 lifted the sample from 67 to 199 boards and 1,327 to 2,175 records, but
the rare titles are still short: Analytics Engineer (US 18), MLOps Engineer
(US 19), Business Analyst (US 22), and every Canadian cell except Software
Engineer and Data Scientist. Yield runs at roughly 11 usable records per board,
so this wave goes as wide as the conservative route allows before the
LinkedIn/Indeed fallback is considered.

Run: python scripts/jd/discover_wave3.py
"""

import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from fetchlib import fetch_json  # noqa: E402
from discover_wave2 import probe  # noqa: E402

BOARDS = os.path.join(HERE, "boards.json")

CANDIDATES = {
    "canada": """
    telus bell rogers shaw videotron cogeco eastlink distributel teksavvy
    scotiabank bmo cibc nationalbank desjardins tangerine simplii meridian
    vancity atb servus coastcapital firstontario alterna motusbank
    manulife sunlife canadalife ia intact aviva definity economical
    wawanesa cooperators gore northbridge travelerscanada
    loblaw sobeys metro canadiantire lcbo indigo roots lululemon aritzia
    sportchek marks atmosphere princessauto peavey homehardware rona
    canadapost purolator dayandross tfi bison challenger
    aircanada westjet porter flair lynx viarail bcferries translink
    hydroone bchydro epcor enmax fortis emera algonquinpower
    suncor cenovus imperialoil tourmaline arcresources whitecap
    agnico barrick kinross teck nutrien cameco
    cae bombardier pratt heroux magellan ibmcanada accenturecanada
    cgi stantec wsp arcadis aecon ellisdon pcl graham bird
    openlane ritchiebros copart adesa clutch canadadrives
    questrade wealthbar nestwealth modernadvisor justwealth
    paymentsource moneris globalpayments nuvei chase elavon
    interac payments payfirma zum geoswift knightsbridgefx
    thinkific teachable maplelms absorb docebo d2lcorp
    kira diligen blueJ loopio responsive proposify qwilr
    axonify docebo saba cornerstone bridge learnamp
    jumpstart boltinsurance apollocover zensurance foxquilt
    cloverleaf fiix uptake mobiquity blackline fleetcomplete geotab
    samdesk sensibill dejero smartwires rewind backupify
    verticalscope trendhunter corusent cineplex thescore pointsbet
    pollard gamingnetwork greatcanadian boyd
    wellth maplehealth dialoguehealth lifespeak greenshield telushealth
    ceridian dayforce humi riseapp collage peoplefirst payworks avanti
    knak eloqua acoustic emarsys dashthis snapengage
    unity ubisoft behaviour eidos warnerbrosmontreal squareenixmontreal
    beenox activisionquebec gameloft frima sarbakan digitalextremes
    ea biowarecanada relic rockstartoronto drinkbox klei hinterland
    """,
    "us_mid": """
    gong outreach salesloft clari chorus people apollo zoominfo lusha
    seismic highspot showpad mindtickle lessonly 360learning
    front intercom zendesk freshworks helpscout gorgias kustomer
    ironclad lexion evisort luminance everlaw relativity logikcull
    deel remote oysterhr velocityglobal globalization papaya
    lattice cultureamp 15five leapsome bonusly workhuman
    greenhouseio lever ashby gem findem seekout hiretual
    checkr certn truework argyle pinwheel atomic
    vouched persona alloy socure sardine unit21 hummingbird
    middesk mercurytech modern stripe adyenus
    benchling dotmatics scispot labguru quartzy
    aledade privia agilon vera oakstreet onemedical
    included healthie spruce luma phreesia klara
    notable regard navina hippocratic abridge nuance suki
    pathai paige ibex proscia aiforia
    arcadia innovaccer healthverity truveris prognos
    """,
    "data_more": """
    starburst ahana onehouse tabular databricksinc deltalake
    soda greatexpectations elementl hightouchio rudderstack mparticle
    amplitudeanalytics heapanalytics pendo fullstory quantummetric
    contentsquare glassbox logrocket smartlook hotjar
    looker sisense yellowfin goodata holistics zing
    datafold datacoral datameer panoply keboola weld polytomic
    nexla shipyard orchestra kestra windmill mage dlt
    bruin paradime datacoves y42 fal
    monosi anomalo lightup validio telmai
    stemma amundsen openmetadata castordoc dataworld
    """,
    "ai_more": """
    anyscaleco rayproject outerbounds metaflow union unionai flyte
    determinedai hopsworks tecton featureform featurebase
    deepchecks evidently fiddlerai robustintelligence protectai
    langfuse humanloop braintrust promptlayer vellum
    scaleaicom surgehq invisible turingcom micro1
    adeptailabs magic poolside cognition codeium tabnine sourcegraph
    augment supermaven continue aider zed warp
    """,
}


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
    print("wave 3: probed %d new candidates, %d boards found" % (len(tasks), len(found)))
    for group in CANDIDATES:
        hits = sorted(by_group.get(group, []))
        print("  %-12s %3d  %s" % (group, len(hits), " ".join(hits)))
    print("\nboards.json now holds %d boards" % len(boards))


if __name__ == "__main__":
    main()
