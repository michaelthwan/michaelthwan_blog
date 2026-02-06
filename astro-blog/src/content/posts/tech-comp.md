---
title: "The Trimodal Nature of Tech Compensation in 2026"
subtitle: "Why the tech salary market has three distinct tiers, and what drives the gaps."
authors:
  - "Michael Wan"
affiliations:
  - "Independent Analysis"
published: "2026-02-05"
abstract: "An interactive, data-driven look at why tech compensation falls into three tiers — Traditional, Competitive Tech, and Big Tech+ — and how equity, level, and geography shape the distribution."
tags:
  - "explainer"
category: "business"
thumbnail: "/img/tech-comp/trimodal-thumbnail.svg"
---

<p class="d-note">
    This article is inspired by Gergely Orosz's
    <a href="https://blog.pragmaticengineer.com/software-engineering-salaries-in-the-netherlands-and-europe/">Pragmatic Engineer</a>
    analysis of trimodal compensation. The data here is modeled on patterns from
    <a href="https://www.levels.fyi">levels.fyi</a> public compensation records for
    Software Engineers in the US and Canada.
</p>

## The Salary Gap is Real

Two software engineers with the same title, same years of experience, and similar technical skills can earn wildly different amounts — sometimes 3x apart. This isn't noise or negotiation luck. It's **structural**.

When you plot total compensation data for thousands of software engineers, you don't see a single bell curve. You see **three overlapping distributions** — a trimodal pattern that reflects three fundamentally different labor markets operating side by side.

<div class="d-figure">
    <div class="d-figure-content" style="background: white; padding: 8px;">
        <canvas id="comp-overall-histogram" class="comp-chart-canvas"></canvas>
    </div>
    <div class="d-figure-caption">
        <strong>Figure 1.</strong> Distribution of total compensation across all levels for US-based SWEs. Each color represents a different tier. Dashed lines mark tier medians. The three peaks are clearly visible.
    </div>
</div>

The left cluster (blue-gray) peaks around **$100-125K**. The middle cluster (orange) peaks around **$200-225K**. The right tail (green) stretches past **$500K** and keeps going. Same job title. Same country. Completely different compensation realities.

## The Three Tiers

Following Gergely Orosz's taxonomy, we can classify the tech labor market into three tiers:

### Tier 1 — Traditional / Local Tech

These are IT departments inside non-tech companies, outsourcing firms, government contractors, and small local agencies. Compensation is almost entirely base salary, with minimal equity or bonus.

**Examples:** Accenture, Infosys, IBM, Dell, government IT, bank technology departments, small consulting shops.

### Tier 2 — Competitive Tech

Well-known tech companies that pay significantly above market but below the very top. They offer meaningful equity packages and compete for talent with Tier 3 firms.

**Examples:** Shopify, Atlassian, Adobe, Salesforce, Spotify, Pinterest, Datadog, Snowflake.

### Tier 3 — Big Tech + Top Startups + Quant

The top of the market. These companies have massive revenue per employee and compete aggressively for engineering talent. Equity often exceeds base salary at senior levels.

**Examples:** Google, Meta, Apple, Netflix, Stripe, OpenAI, Anthropic, Uber, Airbnb, Jane Street, Citadel, Two Sigma.

<div class="d-figure">
    <div class="d-figure-content" style="background: white; padding: 8px;">
        <canvas id="comp-tier-medians" class="comp-chart-canvas"></canvas>
    </div>
    <div class="d-figure-caption">
        <strong>Figure 2.</strong> Median total compensation by tier (US). Whiskers show P25-P75 range. The tier-over-tier jumps are large — Tier 3 median is nearly 3x Tier 1.
    </div>
</div>

The median Tier 3 engineer earns **$332K** — roughly **2.8x** the median Tier 1 engineer at **$117K**. Even Tier 2 at **$221K** is nearly double Tier 1. These aren't small differences.

## What Creates the Gap: Equity

The biggest single driver of the gap isn't base salary — it's **equity compensation**. At Tier 1, equity is essentially nonexistent. At Tier 3, it can be the largest component of total pay.

<div class="d-figure">
    <div class="d-figure-content" style="background: white; padding: 8px;">
        <canvas id="comp-equity-breakdown" class="comp-chart-canvas" style="height: 200px;"></canvas>
    </div>
    <div class="d-figure-caption">
        <strong>Figure 3.</strong> Compensation breakdown by tier. At Tier 1, 85% of pay is base salary. At Tier 3, equity (41%) exceeds base (48%).
    </div>
</div>

This is the key structural insight: **Tier 1 companies pay salaries. Tier 3 companies pay ownership stakes.** When a Tier 3 company's stock appreciates, the gap widens further. When it drops, Tier 3 engineers feel it more acutely.

## Compensation by Level

The gap between tiers doesn't stay constant — it **widens dramatically** at senior levels. An entry-level engineer at Tier 3 makes roughly 2.4x a Tier 1 counterpart. A staff engineer at Tier 3 makes nearly **4x**.

<div class="d-figure">
    <div class="d-figure-content" style="background: white; padding: 8px;">
        <canvas id="comp-level-comparison" class="comp-chart-canvas" style="height: 320px;"></canvas>
    </div>
    <div class="d-figure-caption">
        <strong>Figure 4.</strong> Median total compensation by level and tier. The tier gap widens at each level — from ~2.4x at entry to ~4x at staff. This is primarily driven by equity grants that scale aggressively at senior levels in Tier 3.
    </div>
</div>

Why does the gap widen? Because equity grants at Tier 3 companies scale superlinearly with level. A senior engineer at Google might get $200K/year in RSUs. A staff engineer might get $400K+. Meanwhile, the Tier 1 equivalent gets a modest raise in base salary.

## US vs Canada

Canada has the same three tiers, but compressed downward. The overall shape is similar — still trimodal — but with lower absolute numbers across the board.

<div class="comp-chart-pair">
    <div>
        <div class="comp-chart-label">United States</div>
        <canvas id="comp-us-histogram"></canvas>
    </div>
    <div>
        <div class="comp-chart-label">Canada</div>
        <canvas id="comp-canada-histogram"></canvas>
    </div>
</div>

<div class="d-table-wrapper">
<table class="comp-comparison-table">
    <thead>
        <tr>
            <th>Tier</th>
            <th>US Median</th>
            <th>Canada Median</th>
            <th>Canada / US</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="tier-label" style="color: #78909c;">Tier 1 — Traditional</td>
            <td>$117K</td>
            <td>$90K</td>
            <td>77%</td>
        </tr>
        <tr>
            <td class="tier-label" style="color: #e07b39;">Tier 2 — Competitive</td>
            <td>$221K</td>
            <td>$169K</td>
            <td>76%</td>
        </tr>
        <tr>
            <td class="tier-label" style="color: #5a9f68;">Tier 3 — Big Tech+</td>
            <td>$332K</td>
            <td>$237K</td>
            <td>71%</td>
        </tr>
    </tbody>
</table>
</div>

The discount is roughly 23-29% across tiers, which roughly aligns with the exchange rate and cost-of-living adjustment. However, the discount is **largest at Tier 3** — Canadian offices of Big Tech companies tend to offer proportionally lower equity grants.

## Interactive: Salary Tier Explorer

Use the controls below to explore the distribution by country and experience level. Hover over bars to see exact counts per bin.

<div id="comp-tier-explorer"></div>

Try selecting **Staff** level — you'll see the tiers separate almost completely, with virtually no overlap between Tier 1 and Tier 3. At the **Entry** level, the distributions overlap much more.

## What Tier Am I In?

If you're wondering where you fall:

- **Tier 1 signals:** Your company's core business isn't technology. Your compensation is almost entirely base salary. Your total comp is within the ranges you see on general job boards.
- **Tier 2 signals:** Your company is a recognized tech brand. You receive meaningful equity (RSUs or options). Your comp is notably above what you'd find in generic salary surveys, but you know peers at FAANG are earning more.
- **Tier 3 signals:** Your company is a household tech name or a well-funded high-growth startup. Equity is a major portion of your comp. Your total package would surprise most people outside tech.

The tier you're in matters more than your negotiation skills. **Moving between tiers is the single highest-leverage career move** in tech compensation — far more impactful than switching teams, getting a promotion within the same tier, or negotiating a signing bonus.

## Key Takeaways

<div class="takeaways">
    <div class="takeaway">
        <span class="takeaway-num">1</span>
        <div class="takeaway-content">
            <strong>Tech compensation is trimodal, not normally distributed.</strong> Tier 1 (traditional/local) clusters around $80-150K, Tier 2 (competitive tech) around $175-300K, and Tier 3 (Big Tech+) from $250K to $800K+.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">2</span>
        <div class="takeaway-content">
            <strong>Equity is the primary driver of the gap.</strong> At Tier 1, equity is ~7% of comp. At Tier 3, it's 41%. This makes Tier 3 comp more volatile but substantially higher in bull markets.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">3</span>
        <div class="takeaway-content">
            <strong>The gap widens with seniority.</strong> The tier multiplier goes from ~2.4x at entry level to ~4x at staff level, driven by superlinear equity scaling at Tier 3.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">4</span>
        <div class="takeaway-content">
            <strong>Moving tiers beats negotiation.</strong> Switching from Tier 1 to Tier 2, or Tier 2 to Tier 3, produces compensation jumps that no amount of within-tier negotiation can match.
        </div>
    </div>
</div>

## References

<div class="d-bibliography">
<ol>
    <li>Orosz, G. "Software Engineer Compensation — The Pragmatic Engineer." <a href="https://blog.pragmaticengineer.com/">Pragmatic Engineer Blog</a>, 2023-2026.</li>
    <li>Levels.fyi. "Compensation Data for Software Engineers." <a href="https://www.levels.fyi">levels.fyi</a>.</li>
    <li>Data in this article is modeled on public compensation distributions. Individual records are synthetic but calibrated to match real aggregate patterns from levels.fyi and Glassdoor data.</li>
</ol>
</div>
