"""
Generate realistic tech compensation data for the trimodal compensation blog post.

Based on patterns from levels.fyi public data and Gergely Orosz's analysis.
Outputs comp_data.json to be embedded in script.js as the COMP_DATA constant.
"""

import json
import random
import math
import os

random.seed(42)

# ── Tier definitions ──

TIERS = {
    1: {
        "name": "Traditional / Local Tech",
        "color": "#78909c",
        "companies": [
            "Accenture", "Infosys", "Wipro", "TCS", "CGI", "Cognizant",
            "Capgemini", "Deloitte Digital", "IBM", "HP", "Dell", "Oracle",
            "SAP (services)", "Ericsson", "Nokia", "Motorola",
            "Local Startups", "Agencies", "Government IT", "Banks (IT dept)",
        ],
    },
    2: {
        "name": "Competitive Tech",
        "color": "#e07b39",
        "companies": [
            "Shopify", "Atlassian", "Intuit", "Adobe", "Salesforce", "Cisco",
            "VMware", "Twilio", "Block", "Snap", "Pinterest", "Spotify",
            "LinkedIn", "GitHub", "Reddit", "Palantir", "Datadog",
            "Snowflake", "HashiCorp", "Elastic",
        ],
    },
    3: {
        "name": "Big Tech + Top Startups + Quant",
        "color": "#5a9f68",
        "companies": [
            "Google", "Meta", "Apple", "Amazon", "Microsoft", "Netflix",
            "Stripe", "Databricks", "OpenAI", "Anthropic",
            "Uber", "Airbnb", "Coinbase", "DoorDash", "Instacart",
            "Two Sigma", "Citadel", "Jane Street", "DE Shaw", "HRT",
        ],
    },
}

# ── Compensation parameters (USD, annual) ──
# Structure: {tier: {level: (base_mean, base_std, equity_mean, equity_std, bonus_mean, bonus_std)}}
# These approximate real levels.fyi distributions

COMP_PARAMS_US = {
    1: {
        "Entry":  (75000, 12000,  2000,  2000,  5000,  3000),
        "Mid":    (95000, 15000,  5000,  4000,  8000,  5000),
        "Senior": (120000, 18000, 10000,  8000, 12000,  7000),
        "Staff":  (145000, 20000, 20000, 15000, 18000, 10000),
    },
    2: {
        "Entry":  (110000, 15000, 25000, 15000, 12000,  6000),
        "Mid":    (140000, 18000, 50000, 25000, 18000, 10000),
        "Senior": (175000, 20000, 90000, 40000, 25000, 12000),
        "Staff":  (210000, 25000, 150000, 60000, 35000, 15000),
    },
    3: {
        "Entry":  (130000, 15000,  50000, 25000, 20000, 10000),
        "Mid":    (170000, 20000, 100000, 40000, 30000, 15000),
        "Senior": (210000, 25000, 200000, 80000, 50000, 20000),
        "Staff":  (250000, 30000, 400000, 150000, 80000, 30000),
    },
}

# Canada: roughly 70-80% of US, with lower equity
CANADA_FACTOR = {
    "base": 0.78,
    "equity": 0.65,
    "bonus": 0.72,
}

LEVELS = ["Entry", "Mid", "Senior", "Staff"]
LEVEL_YOE = {"Entry": (0, 2), "Mid": (3, 5), "Senior": (5, 10), "Staff": (10, 20)}
SAMPLES_PER_CELL = {"Entry": 80, "Mid": 120, "Senior": 100, "Staff": 50}

BIN_WIDTH = 25000


def gauss(mean, std):
    """Box-Muller gaussian."""
    u1 = random.random()
    u2 = random.random()
    z = math.sqrt(-2 * math.log(max(u1, 1e-10))) * math.cos(2 * math.pi * u2)
    return max(0, mean + z * std)


def generate_records(country="US"):
    records = []
    params = COMP_PARAMS_US
    for tier in [1, 2, 3]:
        for level in LEVELS:
            n = SAMPLES_PER_CELL[level]
            base_m, base_s, eq_m, eq_s, bon_m, bon_s = params[tier][level]

            if country == "Canada":
                base_m *= CANADA_FACTOR["base"]
                base_s *= CANADA_FACTOR["base"]
                eq_m *= CANADA_FACTOR["equity"]
                eq_s *= CANADA_FACTOR["equity"]
                bon_m *= CANADA_FACTOR["bonus"]
                bon_s *= CANADA_FACTOR["bonus"]

            for _ in range(n):
                base = round(gauss(base_m, base_s))
                equity = round(gauss(eq_m, eq_s))
                bonus = round(gauss(bon_m, bon_s))
                total = base + equity + bonus
                yoe_lo, yoe_hi = LEVEL_YOE[level]
                yoe = round(random.uniform(yoe_lo, yoe_hi), 1)
                company = random.choice(TIERS[tier]["companies"])
                records.append({
                    "tier": tier,
                    "level": level,
                    "country": country,
                    "company": company,
                    "base": base,
                    "equity": equity,
                    "bonus": bonus,
                    "total": total,
                    "yoe": yoe,
                })
    return records


def compute_histogram(records, bin_width=BIN_WIDTH, max_val=800000):
    """Stacked histogram bins by tier."""
    num_bins = int(max_val / bin_width)
    bins = []
    for i in range(num_bins):
        lo = i * bin_width
        hi = lo + bin_width
        t1 = sum(1 for r in records if r["tier"] == 1 and lo <= r["total"] < hi)
        t2 = sum(1 for r in records if r["tier"] == 2 and lo <= r["total"] < hi)
        t3 = sum(1 for r in records if r["tier"] == 3 and lo <= r["total"] < hi)
        if t1 + t2 + t3 > 0:
            bins.append({"lo": lo, "hi": hi, "t1": t1, "t2": t2, "t3": t3})
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
    for tier in [1, 2, 3]:
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
        for tier in [1, 2, 3]:
            recs = [r for r in records if r["tier"] == tier and r["level"] == level]
            totals = [r["total"] for r in recs]
            result[level][str(tier)] = {
                "median": percentile(totals, 50),
                "p25": percentile(totals, 25),
                "p75": percentile(totals, 75),
                "count": len(recs),
            }
    return result


def main():
    us_records = generate_records("US")
    ca_records = generate_records("Canada")
    all_records = us_records + ca_records

    # Filter to Senior for the main histogram (most representative)
    us_senior = [r for r in us_records if r["level"] == "Senior"]

    comp_data = {
        "tiers": {
            str(t): {"name": TIERS[t]["name"], "color": TIERS[t]["color"]}
            for t in [1, 2, 3]
        },
        "levels": LEVELS,
        "binWidth": BIN_WIDTH,

        # Overall US histogram (all levels)
        "usHistogram": compute_histogram(us_records),

        # Canada histogram (all levels)
        "caHistogram": compute_histogram(ca_records),

        # Per-country, per-level histograms for the interactive
        "histograms": {},

        # Tier stats by country
        "usStats": compute_stats(us_records),
        "caStats": compute_stats(ca_records),

        # Level × tier matrix
        "usLevelStats": compute_level_stats(us_records),
        "caLevelStats": compute_level_stats(ca_records),

        # Equity breakdown (% of total comp) by tier — US
        "equityBreakdown": {},
    }

    # Build per-country per-level histograms
    for country, recs in [("US", us_records), ("Canada", ca_records)]:
        comp_data["histograms"][country] = {}
        comp_data["histograms"][country]["All"] = compute_histogram(recs)
        for level in LEVELS:
            level_recs = [r for r in recs if r["level"] == level]
            comp_data["histograms"][country][level] = compute_histogram(level_recs)

    # Equity breakdown
    for tier in [1, 2, 3]:
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
        json.dump(comp_data, f, indent=2)

    print(f"Generated comp_data.json at {out_path}")
    print(f"  US records: {len(us_records)}")
    print(f"  Canada records: {len(ca_records)}")

    # Print summary
    for tier in [1, 2, 3]:
        s = comp_data["usStats"][tier]
        print(f"  Tier {tier} US median: ${s['median']:,}  (P25: ${s['p25']:,}, P75: ${s['p75']:,})")


if __name__ == "__main__":
    main()
