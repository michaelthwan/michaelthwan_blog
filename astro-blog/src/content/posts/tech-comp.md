---
title: "The Trimodal Nature of Tech Compensation in 2026"
subtitle: "Three tiers still shape tech pay — and in 2026, a fourth spike of frontier AI labs has appeared above them."
authors:
  - "Michael Wan"
affiliations:
  - "Independent Analysis"
published: "2026-07-03"
abstract: "An interactive, data-driven look at why tech compensation falls into three tiers — Traditional, Competitive Tech, and Big Tech+ — how the gaps widened through 2025-26, and why frontier AI labs now form a fourth spike above the classic curve. Includes a tier explorer where you can see exactly which companies make up each slice."
tags:
  - "explainer"
category: "business"
thumbnail: "/img/tech-comp/trimodal-thumbnail.svg"
---

<p class="d-note">
    This article is inspired by Gergely Orosz's
    <a href="https://newsletter.pragmaticengineer.com/p/trimodal">Pragmatic Engineer</a>
    trimodal analysis (updated March 2025). The data here is synthetic but calibrated to
    <a href="https://www.levels.fyi">levels.fyi</a> public compensation records and the
    levels.fyi 2025 year-end report. Refreshed July 2026.
</p>

## The Salary Gap is Real

Two software engineers with the same title, same years of experience, and similar technical skills can earn wildly different amounts — sometimes 4x apart. This isn't noise or negotiation luck. It's **structural**.

When you plot total compensation data for thousands of software engineers, you don't see a single bell curve. You see **three overlapping distributions** — a trimodal pattern that reflects three fundamentally different labor markets operating side by side. And as of 2026, a fourth, smaller spike has appeared above all of them.

<div class="d-figure">
    <div class="d-figure-content" style="background: white; padding: 8px;">
        <canvas id="comp-overall-histogram" class="comp-chart-canvas"></canvas>
    </div>
    <div class="d-figure-caption">
        <strong>Figure 1.</strong> Distribution of total compensation across all levels for US-based SWEs. Each color represents a different tier. Dashed lines mark tier medians. Three peaks — plus the violet AI-lab spike stretching far to the right.
    </div>
</div>

The left cluster (blue-gray) peaks around **$100-140K**. The middle cluster (orange) peaks around **$200-260K**. The green mass centers near **$340K** with a long tail. And the violet spike — frontier AI labs — starts where Big Tech tops out and runs past **$1M**. Same job title. Same country. Completely different compensation realities.

## The Three Tiers (Plus One)

Following Gergely Orosz's taxonomy, we can classify the tech labor market into three tiers, defined less by prestige than by **who a company benchmarks its pay against**:

### Tier 1 — Traditional / Local Tech

Companies that compete for *local* talent: IT departments inside non-tech companies, outsourcing firms, consultancies, and banks. Compensation is almost entirely base salary. Note the surprise entries — levels.fyi data shows bank *software engineering* roles land here (Goldman Sachs SWE median is roughly $170K, far below its front-office pay), and Orosz's list of top Tier-1 payers includes names you'd guess were "tech tech": Indeed, HubSpot, Workday, Capital One, eBay.

**Examples:** Accenture, Infosys, IBM, Goldman Sachs, JPMorgan Chase, Capital One, Visa, Disney, Workday, Indeed.

### Tier 2 — Competitive Tech

Recognized tech brands that pay significantly above the local market and offer meaningful equity, but that don't quite benchmark against Google and Meta. They compete for talent with Tier 3 and lose their best people to it.

**Examples:** Adobe, Salesforce, Atlassian, Shopify, Spotify, Uber, Airbnb, LinkedIn, Snap, MongoDB.

### Tier 3 — Big Tech + Top Startups + Quant

The classic top of the market: companies with massive revenue per employee that compete globally for engineering talent. Equity often exceeds base at senior levels; quant firms pay the same totals mostly in cash. Tier boundaries blur here — levels.fyi has Netflix at roughly **$460K** median and Databricks near **$490K**, well above the Google all-level median of ~$295K.

**Examples:** Google, Meta, Apple, Amazon, Microsoft, Netflix, NVIDIA, Stripe, Databricks, Jane Street, Citadel, Two Sigma.

### Tier 4 — Frontier AI Labs (the 2026 spike)

This is the new development. Orosz's framework is still officially trimodal, but 2026 compensation benchmarks increasingly describe a *de facto* fourth mode: frontier AI labs paying **2-3x strong Big Tech medians**. levels.fyi puts OpenAI's SWE median around **$800K**; Anthropic lands somewhere in the **$420-600K** range depending on which population you count. Equity — often private, infrequently liquid — makes up more than half of these packages, reaching 60-70% at the biggest labs.

**Examples:** OpenAI, Anthropic, Google DeepMind, xAI, Thinking Machines Lab, Mistral AI, Cohere.

<div class="d-figure">
    <div class="d-figure-content" style="background: white; padding: 8px;">
        <canvas id="comp-tier-medians" class="comp-chart-canvas"></canvas>
    </div>
    <div class="d-figure-caption">
        <strong>Figure 2.</strong> Median total compensation by tier (US). Whiskers show P25-P75 range. Tier 3 median is ~2.6x Tier 1 — and Tier 4 is ~4.4x.
    </div>
</div>

The median Tier 3 engineer earns **$339K** — roughly **2.6x** the median Tier 1 engineer at **$132K**. Tier 2 at **$253K** is nearly double Tier 1. And the AI-lab spike at **$579K** median sits another 70% above Tier 3. These aren't small differences.

## What Creates the Gap: Equity

The biggest single driver of the gap isn't base salary — it's **equity compensation**. At Tier 1, equity is essentially nonexistent. At Tier 4, it's the majority of the package.

<div class="d-figure">
    <div class="d-figure-content" style="background: white; padding: 8px;">
        <canvas id="comp-equity-breakdown" class="comp-chart-canvas" style="height: 240px;"></canvas>
    </div>
    <div class="d-figure-caption">
        <strong>Figure 3.</strong> Compensation breakdown by tier. At Tier 1, 83% of pay is base salary. At Tier 4, equity (55%) dominates. Tier 3's fat bonus slice comes from quant firms, which pay Big-Tech-beating totals mostly in cash.
    </div>
</div>

This is the key structural insight: **Tier 1 companies pay salaries. Tier 3 and 4 companies pay ownership stakes.** When the stock appreciates, the gap widens further; when it drops, upper-tier engineers feel it more acutely. The Tier 4 version comes with an extra catch — much of it is *private* equity, so the headline number depends on a valuation you can't sell into.

## Compensation by Level

The gap between tiers doesn't stay constant — it **widens dramatically** at senior levels. An entry-level engineer at Tier 3 makes roughly 2.4x a Tier 1 counterpart. At staff level the multiple is over **3x** — and against Tier 4 it's **4x**.

<div class="d-figure">
    <div class="d-figure-content" style="background: white; padding: 8px;">
        <canvas id="comp-level-comparison" class="comp-chart-canvas" style="height: 320px;"></canvas>
    </div>
    <div class="d-figure-caption">
        <strong>Figure 4.</strong> Median total compensation by level and tier. The tier gap widens at each level, driven by equity grants that scale superlinearly at the top tiers.
    </div>
</div>

Why does the gap widen? Because equity grants at the top scale superlinearly with level. A senior engineer at a Tier 3 company might get $200K/year in RSUs; a staff engineer $300-400K. Meanwhile, the Tier 1 equivalent gets a modest raise in base salary.

The market data confirms the widening is *accelerating*: in the levels.fyi 2025 year-end report, Staff-level pay rose **+7.5%** year over year while Entry-level rose just **+1.6%**. The top of the curve is pulling away from the bottom even before you count the AI labs.

## US vs Canada

Canada has the same tiers, compressed downward. The overall shape is similar — still multimodal — but with lower absolute numbers across the board.

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
            <td>$132K</td>
            <td>$98K</td>
            <td>74%</td>
        </tr>
        <tr>
            <td class="tier-label" style="color: #e07b39;">Tier 2 — Competitive</td>
            <td>$253K</td>
            <td>$194K</td>
            <td>76%</td>
        </tr>
        <tr>
            <td class="tier-label" style="color: #5a9f68;">Tier 3 — Big Tech+</td>
            <td>$339K</td>
            <td>$254K</td>
            <td>75%</td>
        </tr>
        <tr>
            <td class="tier-label" style="color: #7e57c2;">Tier 4 — AI Labs</td>
            <td>$579K</td>
            <td>$494K</td>
            <td>85%</td>
        </tr>
    </tbody>
</table>
</div>

The discount is roughly 24-26% for the three classic tiers, aligning with exchange rate and cost-of-living adjustments. The AI-lab tier is the exception: frontier labs benchmark globally rather than locally, so the Canada discount shrinks — a Toronto offer from a frontier lab (or homegrown Cohere) is much closer to US parity than a Toronto offer from a bank.

## Interactive: Salary Tier Explorer

Use the controls below to explore the distribution by country and experience level (it opens at **Senior**, the most representative view). Hover over bars to see exact counts per bin — and **click any tier card to open it up and see which companies make up that slice**, with each company's median for the selected level.

<div id="comp-tier-explorer"></div>

Try clicking **Tier 3** — you'll see the quant firms (Citadel, Jane Street) and top scaleups (Databricks) sitting above the Big Tech names inside the same tier. At **Staff** level the tiers separate almost completely; at **Entry** level they overlap far more.

## What Changed in 2025-26

Four shifts define this refresh:

1. **The AI talent war created the fourth spike.** Frontier labs now pay 2-3x Big Tech medians, with a 56% wage premium for AI skills (up from 25% a year earlier). The headlines are wilder still — Sam Altman publicly claimed Meta dangled "$100M signing bonuses" at OpenAI staff, and one reported Meta package totaled ~$1.5B over six years. Read the fine print: these are heavily back-weighted with retention vests and performance gates, not guaranteed cash.

2. **The top is pulling away from the bottom.** Staff +7.5% vs Entry +1.6% year over year (levels.fyi 2025). The curve is stretching vertically even within tiers.

3. **The entry-level squeeze is real.** Entry-level postings fell from 8.1% to 7.4% of the tech job mix while senior postings grew, "junior" roles increasingly ask for 2-5 years of experience, and roughly 148,000 tech workers were displaced in 2026 with AI cited in about a quarter of recent layoffs. Getting *into* the funnel is now the hard part.

4. **Geographic arbitrage is eroding.** Return-to-office roles grew +12% year over year, pulling pay premiums back toward hub cities. London still pays about 70% of San Francisco; Bangalore about 25%.

## What Tier Am I In?

If you're wondering where you fall:

- **Tier 1 signals:** Your company's core business isn't technology. Your compensation is almost entirely base salary. Your total comp is within the ranges you see on general job boards.
- **Tier 2 signals:** Your company is a recognized tech brand. You receive meaningful equity (RSUs or options). Your comp is notably above generic salary surveys, but you know peers at Big Tech are earning more.
- **Tier 3 signals:** Your company is a household tech name, a top scaleup, or a quant firm. Equity (or quant cash bonus) is a major portion of your comp. Your total package would surprise most people outside tech.
- **Tier 4 signals:** You work at a frontier AI lab. Most of your compensation is private equity whose value depends on the next funding round. Your offer letter made you re-read it.

The tier you're in matters more than your negotiation skills. **Moving between tiers is the single highest-leverage career move** in tech compensation — far more impactful than switching teams, getting a promotion within the same tier, or negotiating a signing bonus.

## Key Takeaways

<div class="takeaways">
    <div class="takeaway">
        <span class="takeaway-num">1</span>
        <div class="takeaway-content">
            <strong>Tech compensation is trimodal — with a new fourth spike.</strong> Tier 1 clusters around $100-170K, Tier 2 around $200-335K, Tier 3 around $260-475K, and frontier AI labs run from ~$420K past $1M.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">2</span>
        <div class="takeaway-content">
            <strong>Equity is the primary driver of the gap.</strong> At Tier 1, equity is ~9% of comp. At Tier 4, it's ~55% — and mostly private stock, which cuts both ways.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">3</span>
        <div class="takeaway-content">
            <strong>The gap widens with seniority — and it's accelerating.</strong> The tier multiplier grows from ~2.4x at entry to 3-4x at staff, and market-wide, staff pay rose 7.5% in a year while entry pay rose 1.6%.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">4</span>
        <div class="takeaway-content">
            <strong>Moving tiers beats negotiation.</strong> Switching from Tier 1 to Tier 2, or Tier 2 to Tier 3, produces compensation jumps that no amount of within-tier negotiation can match. In 2026, the Tier 3 → Tier 4 jump is the largest of all — for the small set of engineers the labs are bidding for.
        </div>
    </div>
</div>

## References

<div class="d-bibliography">
<ol>
    <li>Orosz, G. "The Trimodal Nature of Tech Compensation in the US, UK and India." <a href="https://newsletter.pragmaticengineer.com/p/trimodal">The Pragmatic Engineer</a>, March 2025.</li>
    <li>Levels.fyi. "2025 End-of-Year Pay Report." <a href="https://www.levels.fyi/2025/">levels.fyi/2025</a>.</li>
    <li>Levels.fyi company pages for OpenAI, Anthropic, Google, Amazon, Netflix, Databricks, Stripe, Jane Street, and Goldman Sachs. <a href="https://www.levels.fyi">levels.fyi</a>, retrieved July 2026.</li>
    <li>Pin. "AI Compensation Benchmarks 2026." <a href="https://www.pin.com/blog/ai-compensation-salary-guide/">pin.com</a>, May 2026.</li>
    <li>techinterview.org. "Compensation by Company Tier 2026." <a href="https://www.techinterview.org/post/3233474671/compensation-by-company-tier-2026/">techinterview.org</a>, April 2026.</li>
    <li>Data in this article is modeled on public compensation distributions. Individual records are synthetic but calibrated to match real aggregate patterns from the sources above; per-company medians in the interactive are representative, not exact.</li>
</ol>
</div>
