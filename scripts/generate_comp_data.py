"""
Generate realistic tech compensation data for the trimodal compensation blog post.

2026 refresh: parameters recalibrated to levels.fyi 2025 year-end report, the
Pragmatic Engineer trimodal update (2025-03), and 2026 AI-lab comp benchmarks.
Adds a fourth tier (frontier AI labs) and per-company profiles so the interactive
can show which companies make up each tier slice.

Outputs comp_data.json to be embedded in script.js as the COMP_DATA constant.
"""

import json
import random
import math
import os

random.seed(42)

# ── Tier definitions ──
# Each company: name, domain (for favicon), mult (comp multiplier vs tier means),
# optional w (sampling weight, default 1), optional cash=True (quant-style: equity
# paid mostly as cash bonus instead of stock).

TIERS = {
    1: {
        "name": "Traditional / Local Tech",
        "short": "Traditional",
        "color": "#78909c",
        "companies": [
            {"name": "Accenture", "domain": "accenture.com", "mult": 0.92, "w": 2},
            {"name": "Infosys", "domain": "infosys.com", "mult": 0.78, "w": 2},
            {"name": "Tata Consultancy", "domain": "tcs.com", "mult": 0.75},
            {"name": "Cognizant", "domain": "cognizant.com", "mult": 0.84},
            {"name": "Capgemini", "domain": "capgemini.com", "mult": 0.85},
            {"name": "IBM", "domain": "ibm.com", "mult": 1.0, "w": 2},
            {"name": "Dell", "domain": "dell.com", "mult": 0.98},
            {"name": "Goldman Sachs", "domain": "goldmansachs.com", "mult": 1.05},
            {"name": "JPMorgan Chase", "domain": "jpmorganchase.com", "mult": 1.04},
            {"name": "Capital One", "domain": "capitalone.com", "mult": 1.15},
            {"name": "Visa", "domain": "visa.com", "mult": 1.08},
            {"name": "Disney", "domain": "disney.com", "mult": 1.05},
            {"name": "eBay", "domain": "ebay.com", "mult": 1.14},
            {"name": "Workday", "domain": "workday.com", "mult": 1.18},
            {"name": "HubSpot", "domain": "hubspot.com", "mult": 1.12},
            {"name": "Indeed", "domain": "indeed.com", "mult": 1.2},
        ],
    },
    2: {
        "name": "Competitive Tech",
        "short": "Competitive",
        "color": "#e07b39",
        "companies": [
            {"name": "Adobe", "domain": "adobe.com", "mult": 1.0, "w": 2},
            {"name": "Salesforce", "domain": "salesforce.com", "mult": 1.0, "w": 2},
            {"name": "Atlassian", "domain": "atlassian.com", "mult": 1.05},
            {"name": "Shopify", "domain": "shopify.com", "mult": 1.0},
            {"name": "Spotify", "domain": "spotify.com", "mult": 0.95},
            {"name": "Pinterest", "domain": "pinterest.com", "mult": 1.1},
            {"name": "Snap", "domain": "snap.com", "mult": 1.05},
            {"name": "Dropbox", "domain": "dropbox.com", "mult": 1.05},
            {"name": "MongoDB", "domain": "mongodb.com", "mult": 1.0},
            {"name": "Robinhood", "domain": "robinhood.com", "mult": 1.1},
            {"name": "Uber", "domain": "uber.com", "mult": 1.15, "w": 2},
            {"name": "Airbnb", "domain": "airbnb.com", "mult": 1.2},
            {"name": "LinkedIn", "domain": "linkedin.com", "mult": 1.05, "w": 2},
            {"name": "Twilio", "domain": "twilio.com", "mult": 0.9},
            {"name": "Block", "domain": "block.xyz", "mult": 1.0},
            {"name": "Reddit", "domain": "reddit.com", "mult": 1.05},
        ],
    },
    3: {
        "name": "Big Tech + Top Startups + Quant",
        "short": "Big Tech+",
        "color": "#5a9f68",
        "companies": [
            {"name": "Google", "domain": "google.com", "mult": 0.95, "w": 3},
            {"name": "Meta", "domain": "meta.com", "mult": 1.05, "w": 3},
            {"name": "Apple", "domain": "apple.com", "mult": 0.95, "w": 2},
            {"name": "Amazon", "domain": "amazon.com", "mult": 0.85, "w": 3},
            {"name": "Microsoft", "domain": "microsoft.com", "mult": 0.85, "w": 3},
            {"name": "Netflix", "domain": "netflix.com", "mult": 1.18},
            {"name": "NVIDIA", "domain": "nvidia.com", "mult": 1.12, "w": 2},
            {"name": "Stripe", "domain": "stripe.com", "mult": 0.95},
            {"name": "Databricks", "domain": "databricks.com", "mult": 1.15},
            {"name": "Snowflake", "domain": "snowflake.com", "mult": 0.95},
            {"name": "Datadog", "domain": "datadoghq.com", "mult": 0.9},
            {"name": "Coinbase", "domain": "coinbase.com", "mult": 1.0},
            {"name": "Jane Street", "domain": "janestreet.com", "mult": 1.25, "cash": True},
            {"name": "Citadel", "domain": "citadel.com", "mult": 1.3, "cash": True},
            {"name": "Two Sigma", "domain": "twosigma.com", "mult": 1.1, "cash": True},
            {"name": "Hudson River Trading", "domain": "hudsonrivertrading.com", "mult": 1.25, "cash": True},
            {"name": "D. E. Shaw", "domain": "deshaw.com", "mult": 1.15, "cash": True},
        ],
    },
    4: {
        "name": "Frontier AI Labs",
        "short": "AI Labs",
        "color": "#7e57c2",
        "companies": [
            {"name": "OpenAI", "domain": "openai.com", "mult": 1.1, "w": 3},
            {"name": "Anthropic", "domain": "anthropic.com", "mult": 0.85, "w": 3},
            {"name": "Google DeepMind", "domain": "deepmind.google", "mult": 0.9, "w": 2},
            {"name": "xAI", "domain": "x.ai", "mult": 0.8},
            {"name": "Thinking Machines Lab", "domain": "thinkingmachines.ai", "mult": 0.95},
            {"name": "Mistral AI", "domain": "mistral.ai", "mult": 0.6},
            {"name": "Cohere", "domain": "cohere.com", "mult": 0.65},
        ],
    },
}

# ── Compensation parameters (USD, annual), 2026 calibration ──
# {tier: {level: (base_mean, base_std, equity_mean, equity_std, bonus_mean, bonus_std)}}
# Anchors: levels.fyi 2025 EOY medians (Senior $312K, Staff $457K across the market),
# Orosz trimodal 2025 (Tier 1 entry median ~$105K, senior ~$180K at top payers),
# levels.fyi company pages (Google $295K, Netflix ~$460K, Databricks ~$490K,
# OpenAI ~$800K median), techinterview.org tier ranges (2026-04).

COMP_PARAMS_US = {
    1: {
        "Entry":  (82000, 12000,  3000,  3000,  6000,  3500),
        "Mid":    (105000, 15000,  7000,  5000,  9000,  5000),
        "Senior": (138000, 18000, 16000, 12000, 15000,  8000),
        "Staff":  (162000, 22000, 28000, 18000, 20000, 10000),
    },
    2: {
        "Entry":  (125000, 15000, 30000, 15000, 13000,  6000),
        "Mid":    (150000, 18000, 60000, 25000, 20000, 10000),
        "Senior": (180000, 20000, 105000, 40000, 28000, 12000),
        "Staff":  (215000, 25000, 175000, 60000, 40000, 15000),
    },
    3: {
        "Entry":  (145000, 15000, 55000, 25000, 22000, 10000),
        "Mid":    (180000, 20000, 115000, 45000, 32000, 15000),
        "Senior": (215000, 25000, 185000, 80000, 50000, 20000),
        "Staff":  (255000, 30000, 330000, 120000, 70000, 30000),
    },
    4: {
        "Entry":  (200000, 25000, 110000, 45000, 20000, 10000),
        "Mid":    (240000, 30000, 240000, 90000, 25000, 12000),
        "Senior": (280000, 35000, 430000, 160000, 30000, 15000),
        "Staff":  (330000, 40000, 680000, 220000, 40000, 20000),
    },
}

# Canada: roughly 70-80% of US, with lower equity (AI labs discount less)
CANADA_FACTOR = {
    "base": 0.78,
    "equity": 0.65,
    "bonus": 0.72,
}
CANADA_FACTOR_T4 = {
    "base": 0.85,
    "equity": 0.8,
    "bonus": 0.8,
}

LEVELS = ["Entry", "Mid", "Senior", "Staff"]
LEVEL_YOE = {"Entry": (0, 2), "Mid": (3, 5), "Senior": (5, 10), "Staff": (10, 20)}
SAMPLES_PER_CELL = {"Entry": 80, "Mid": 120, "Senior": 100, "Staff": 50}
# The AI-lab spike is a small mode, not a fourth peak of equal mass
SAMPLES_PER_CELL_T4 = {"Entry": 10, "Mid": 24, "Senior": 32, "Staff": 16}

BIN_WIDTH = 25000
MAX_TOTAL = 1600000  # records above this clamp into the last bin


def gauss(mean, std):
    """Box-Muller gaussian."""
    u1 = random.random()
    u2 = random.random()
    z = math.sqrt(-2 * math.log(max(u1, 1e-10))) * math.cos(2 * math.pi * u2)
    return max(0, mean + z * std)


def pick_company(tier):
    companies = TIERS[tier]["companies"]
    weights = [c.get("w", 1) for c in companies]
    return random.choices(companies, weights=weights, k=1)[0]


def generate_records(country="US"):
    records = []
    params = COMP_PARAMS_US
    for tier in [1, 2, 3, 4]:
        samples = SAMPLES_PER_CELL_T4 if tier == 4 else SAMPLES_PER_CELL
        for level in LEVELS:
            n = samples[level]
            base_m, base_s, eq_m, eq_s, bon_m, bon_s = params[tier][level]

            if country == "Canada":
                factor = CANADA_FACTOR_T4 if tier == 4 else CANADA_FACTOR
                base_m *= factor["base"]
                base_s *= factor["base"]
                eq_m *= factor["equity"]
                eq_s *= factor["equity"]
                bon_m *= factor["bonus"]
                bon_s *= factor["bonus"]

            for _ in range(n):
                company = pick_company(tier)
                m = company["mult"]
                base = round(gauss(base_m * m, base_s))
                equity = round(gauss(eq_m * m, eq_s * m))
                bonus = round(gauss(bon_m * m, bon_s))
                if company.get("cash"):
                    # Quant firms: most of the "equity" slice is cash bonus
                    bonus += round(equity * 0.8)
                    equity = round(equity * 0.2)
                total = base + equity + bonus
                yoe_lo, yoe_hi = LEVEL_YOE[level]
                yoe = round(random.uniform(yoe_lo, yoe_hi), 1)
                records.append({
                    "tier": tier,
                    "level": level,
                    "country": country,
                    "company": company["name"],
                    "base": base,
                    "equity": equity,
                    "bonus": bonus,
                    "total": total,
                    "yoe": yoe,
                })
    return records


def compute_histogram(records, bin_width=BIN_WIDTH, max_val=MAX_TOTAL):
    """Grouped histogram bins by tier. Bins are contiguous (zeros kept) from the
    first non-empty bin to the last, so x-position math in JS stays linear."""
    num_bins = int(max_val / bin_width)
    counts = [{"t1": 0, "t2": 0, "t3": 0, "t4": 0} for _ in range(num_bins)]
    for r in records:
        idx = min(int(min(r["total"], max_val - 1) / bin_width), num_bins - 1)
        counts[idx][f"t{r['tier']}"] += 1

    nonzero = [i for i, c in enumerate(counts) if sum(c.values()) > 0]
    if not nonzero:
        return []
    bins = []
    for i in range(nonzero[0], nonzero[-1] + 1):
        c = counts[i]
        bins.append({"lo": i * bin_width, "hi": (i + 1) * bin_width, **c})
    return bins


def percentile(values, p):
    if not values:
        return 0
    s = sorted(values)
    k = (len(s) - 1) * p / 100
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return s[int(k)]
    return round(s[f] * (c - k) + s[c] * (k - f))


def compute_stats(records):
    """Per-tier stats: median, p25, p75, avg base/equity/bonus, count."""
    stats = {}
    for tier in [1, 2, 3, 4]:
        tier_recs = [r for r in records if r["tier"] == tier]
        totals = [r["total"] for r in tier_recs]
        bases = [r["base"] for r in tier_recs]
        equities = [r["equity"] for r in tier_recs]
        bonuses = [r["bonus"] for r in tier_recs]

        avg_base = round(sum(bases) / len(bases)) if bases else 0
        avg_equity = round(sum(equities) / len(equities)) if equities else 0
        avg_bonus = round(sum(bonuses) / len(bonuses)) if bonuses else 0

        stats[tier] = {
            "median": percentile(totals, 50),
            "p25": percentile(totals, 25),
            "p75": percentile(totals, 75),
            "count": len(tier_recs),
            "avgBase": avg_base,
            "avgEquity": avg_equity,
            "avgBonus": avg_bonus,
        }
    return stats


def compute_level_stats(records):
    """Per tier per level median total comp."""
    result = {}
    for level in LEVELS:
        result[level] = {}
        for tier in [1, 2, 3, 4]:
            recs = [r for r in records if r["tier"] == tier and r["level"] == level]
            totals = [r["total"] for r in recs]
            result[level][str(tier)] = {
                "median": percentile(totals, 50),
                "p25": percentile(totals, 25),
                "p75": percentile(totals, 75),
                "count": len(recs),
            }
    return result


def compute_companies(records):
    """Per level (incl. All) per tier: companies with box-plot stats (min, p25,
    median, p75, max) and record count, sorted by median desc. Feeds the tier
    deep-dive panel."""
    result = {}
    for level in ["All"] + LEVELS:
        result[level] = {}
        for tier in [1, 2, 3, 4]:
            recs = [
                r for r in records
                if r["tier"] == tier and (level == "All" or r["level"] == level)
            ]
            by_company = {}
            for r in recs:
                by_company.setdefault(r["company"], []).append(r["total"])
            entries = [
                {
                    "name": name,
                    "min": min(totals),
                    "p25": percentile(totals, 25),
                    "median": percentile(totals, 50),
                    "p75": percentile(totals, 75),
                    "max": max(totals),
                    "count": len(totals),
                }
                for name, totals in by_company.items()
            ]
            entries.sort(key=lambda e: -e["median"])
            result[level][str(tier)] = entries
    return result


def main():
    us_records = generate_records("US")
    ca_records = generate_records("Canada")

    comp_data = {
        "tiers": {
            str(t): {
                "name": TIERS[t]["name"],
                "short": TIERS[t]["short"],
                "color": TIERS[t]["color"],
            }
            for t in [1, 2, 3, 4]
        },
        "levels": LEVELS,
        "binWidth": BIN_WIDTH,

        # Overall histograms (all levels)
        "usHistogram": compute_histogram(us_records),
        "caHistogram": compute_histogram(ca_records),

        # Per-country, per-level histograms for the interactive
        "histograms": {},

        # Tier stats by country
        "usStats": compute_stats(us_records),
        "caStats": compute_stats(ca_records),

        # Level x tier matrix
        "usLevelStats": compute_level_stats(us_records),
        "caLevelStats": compute_level_stats(ca_records),

        # Equity breakdown (% of total comp) by tier — US
        "equityBreakdown": {},

        # Company deep-dive: per country/level/tier company medians
        "companies": {
            "US": compute_companies(us_records),
            "Canada": compute_companies(ca_records),
        },
        "companyDomains": {
            c["name"]: c["domain"]
            for t in [1, 2, 3, 4]
            for c in TIERS[t]["companies"]
        },
    }

    # Build per-country per-level histograms
    for country, recs in [("US", us_records), ("Canada", ca_records)]:
        comp_data["histograms"][country] = {}
        comp_data["histograms"][country]["All"] = compute_histogram(recs)
        for level in LEVELS:
            level_recs = [r for r in recs if r["level"] == level]
            comp_data["histograms"][country][level] = compute_histogram(level_recs)

    # Equity breakdown
    for tier in [1, 2, 3, 4]:
        recs = [r for r in us_records if r["tier"] == tier]
        avg_base = sum(r["base"] for r in recs) / len(recs)
        avg_equity = sum(r["equity"] for r in recs) / len(recs)
        avg_bonus = sum(r["bonus"] for r in recs) / len(recs)
        total = avg_base + avg_equity + avg_bonus
        comp_data["equityBreakdown"][str(tier)] = {
            "basePct": round(avg_base / total * 100, 1),
            "equityPct": round(avg_equity / total * 100, 1),
            "bonusPct": round(avg_bonus / total * 100, 1),
            "avgBase": round(avg_base),
            "avgEquity": round(avg_equity),
            "avgBonus": round(avg_bonus),
        }

    # Write JSON
    out_path = os.path.join(os.path.dirname(__file__), "comp_data.json")
    with open(out_path, "w") as f:
        json.dump(comp_data, f, separators=(",", ":"))

    print(f"Generated comp_data.json at {out_path}")
    print(f"  US records: {len(us_records)}")
    print(f"  Canada records: {len(ca_records)}")

    for tier in [1, 2, 3, 4]:
        s = comp_data["usStats"][tier]
        print(f"  Tier {tier} US median: ${s['median']:,}  (P25: ${s['p25']:,}, P75: ${s['p75']:,}, n={s['count']})")
    print("  US level medians (T1/T2/T3/T4):")
    for level in LEVELS:
        ls = comp_data["usLevelStats"][level]
        meds = " / ".join(f"${ls[str(t)]['median']:,}" for t in [1, 2, 3, 4])
        print(f"    {level}: {meds}")
    print("  Canada tier medians:")
    for tier in [1, 2, 3, 4]:
        s = comp_data["caStats"][tier]
        print(f"    Tier {tier}: ${s['median']:,}")
    print("  Equity breakdown (base/equity/bonus %):")
    for tier in [1, 2, 3, 4]:
        b = comp_data["equityBreakdown"][str(tier)]
        print(f"    Tier {tier}: {b['basePct']} / {b['equityPct']} / {b['bonusPct']}")
    print("  US Senior company medians:")
    for tier in [1, 2, 3, 4]:
        entries = comp_data["companies"]["US"]["Senior"][str(tier)]
        tops = ", ".join(f"{e['name']} ${e['median']//1000}K" for e in entries[:5])
        print(f"    Tier {tier}: {tops}")


if __name__ == "__main__":
    main()
