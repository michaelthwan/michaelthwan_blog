---
title: "98 Years of the S&P 500: How Major Events Shaped Market History"
subtitle: "Every crash felt like the end. Every recovery seemed impossible. The market kept climbing."
authors:
  - "Michael Wan"
affiliations:
  - "Independent Analysis"
published: "2026-02-07"
abstract: "An interactive visual journey through 98 years of S&P 500 performance, showing how wars, recessions, pandemics, and policy shifts drove the market through 22 bull runs and 21 corrections — and why $100 invested in 1926 became $1.48 million."
tags:
  - "explainer"
category: "business"
thumbnail: "/img/sp500/thumbnail.svg"
---

<style>
  /* ── SP500 essay accents (scoped, prefix sp-) ── */
  .sp-callout {
    border-left: 3px solid; border-radius: 0 6px 6px 0;
    padding: 12px 15px; margin: 22px 0; font-size: 0.92rem; line-height: 1.6;
  }
  .sp-callout-warn { border-color: #f59e0b; background: #fffbeb; color: #92400e; }
  .sp-callout-note { border-color: #6366f1; background: #eef2ff; color: #3730a3; }
  .sp-callout-key  { border-color: #1b5e20; background: #eefaf0; color: #1b4d20; }

  .sp-takeaway { font-size: 0.9rem; color: #4b5563; line-height: 1.6; margin: 10px 0 26px; padding-left: 12px; border-left: 2px solid #e5e7eb; }
  .sp-takeaway strong { color: #111827; }
</style>

<p class="d-note">
    Charts plot Robert Shiller's S&P Composite monthly-average series (1926–2024).
    Bull and bear markets are segmented with a 15% reversal threshold on monthly averages,
    and every percentage label is computed from the plotted data — note that daily and intraday
    extremes were often deeper than the monthly averages shown. The narrative framing draws on
    an analysis by <a href="https://web.archive.org/web/20260212170504/https://www.sensiblefinancial.com/how-has-the-sp-500-performed-over-the-last-98-years/">Sensible Financial</a>.
    All charts use logarithmic Y-axes — equal vertical distances represent equal percentage changes.
</p>

## The Big Picture

A hundred dollars invested in the S&P 500 on January 1, 1926, with dividends reinvested, would have grown to approximately **$1.48 million** by 2024 — a compounded annual growth rate of **10.3%**. That single number masks a century of crashes, wars, pandemics, and policy experiments. The theme of this whole article lives in that tension: **every crash felt terminal while it was happening, and the system compounded anyway.**

How does a line survive an 85% collapse and still end up at $1.48 million? The chart below shows the full journey. On a logarithmic scale, the long-term trend is unmistakable: **an upward march punctuated by sharp but temporary setbacks.** Hover over the line to see exact values at any point.

<div class="d-figure">
    <div class="d-figure-content sp500-chart-wrap">
        <canvas id="sp500-overview"></canvas>
    </div>
    <div class="d-figure-caption">
        <strong>Figure 1.</strong> S&P 500 Composite Index, 1926–2024 (log scale, monthly averages). Major crashes are annotated. On a log scale, equal vertical distances are equal percentage moves — which makes clear that the Great Depression's 85% collapse dwarfs every crash since, despite its tiny absolute numbers. <em>Hover a milestone in the strip below the chart to highlight it.</em>
    </div>
</div>

Over these 98 years, the market experienced **22 bull runs** and **21 corrections of 15% or more** (measured on monthly averages). Each crash felt unprecedented at the time. Each recovery seemed improbable. And yet the line kept climbing.

<div class="sp-callout sp-callout-warn">
  <strong>Three caveats before you extrapolate.</strong> First, these are <em>nominal</em> figures — in inflation-adjusted terms the $1.48M is closer to $80K of 1926 purchasing power, and the real CAGR is nearer 7%. Second, this is the story of the market that <em>survived</em>: an investor in 1926 could just as easily have picked Germany, Japan, or Russia, where equity holders were wiped out or nearly so — survivorship bias flatters every long-run US chart. Third, monthly averages smooth the terror: daily drawdowns were consistently deeper than the numbers labeled here.
</div>

With those caveats on the table, let's walk through the three major eras — watching, in each one, how the crash-of-the-decade felt like the end of the system, and wasn't.

---

## Era I: Depression, War, and Recovery (1926–1958)

<div class="d-figure">
    <div class="d-figure-content sp500-chart-wrap">
        <canvas id="sp500-era1"></canvas>
    </div>
    <div class="d-figure-caption">
        <strong>Figure 2.</strong> S&P 500, 1926–1958. <span style="color:#1b5e20">Green</span> labels mark bull runs (dot at the peak); <span style="color:#b71c1c">red</span> labels mark declines (dot at the trough). The Great Depression wiped out 85% of value — the worst decline in market history.
    </div>
</div>

### The Roaring Twenties (+147%)

The S&P 500 rose two-and-a-half-fold between January 1926 and its September 1929 peak. Fueled by easy credit, rampant speculation, and a booming industrial economy, the market seemed unstoppable. Margin trading allowed investors to buy stocks with just 10% down.

### The Great Depression (-85%)

Then came the crash. From September 1929 to June 1932, the S&P 500 fell from a monthly average of 31.3 to 4.8 — an **85% decline** that remains the worst bear market in U.S. history (on daily closes, the drop was 86%, from 31.86 to 4.40). The index wouldn't recover to its 1929 peak until **September 1954**, a full 25 years later.

The decline wasn't a single event. It came in waves: an initial 34% crash in the fall of 1929, a deceptive +24% rebound into April 1930, then a grinding two-year, 81% descent as bank failures cascaded through the economy. By 1932, unemployment reached 25% and GDP had contracted by a third.

### New Deal and False Starts

The recovery was equally turbulent. A furious **+73%** rally off the June 1932 lows lasted just three months before rolling over. FDR's New Deal then sparked a more durable **+82%** advance into early 1934, and after another pullback the market gained **+115%** into early 1937. But the **Roosevelt Recession of 1937-38** cut the market nearly in half again (-45%) when the government pulled back stimulus too early — a cautionary tale that would echo through future policy debates.

### World War II (-39%, then +139%)

The outbreak of World War II sent markets into a long slide, down 39% to a bottom of 7.8 in April 1942. But as the U.S. war machine ramped up industrial production, the market began a sustained climb. By mid-1946, the S&P had risen 139% from its wartime low.

### The Post-War Boom (+249%)

The longest bull market of this era stretched from mid-1949 to mid-1956 — seven years of growth driven by suburbanization, consumer spending, the baby boom, and America's emergence as the world's dominant industrial power, lifting the index 249%. The Eisenhower Recession of 1957 (-17%) was a brief interruption in an extraordinary run.

<p class="sp-takeaway"><strong>Era I in one line:</strong> the worst crash in history took 25 years to repair — and the investor who kept reinvesting dividends through it still came out far ahead. Terminal-feeling, not terminal.</p>

---

## Era II: Cold War, Oil, and Reaganomics (1959–1991)

Era I's lesson was about surviving one giant collapse. Era II poses a different question: what happens when the market doesn't crash spectacularly, but simply *goes nowhere* for a decade?

<div class="d-figure">
    <div class="d-figure-content sp500-chart-wrap">
        <canvas id="sp500-era2"></canvas>
    </div>
    <div class="d-figure-caption">
        <strong>Figure 3.</strong> S&P 500, 1959–1991. This era saw more frequent cycles — eight declines of 15% or more in 33 years. The Oil Shock of 1973-74 and Black Monday of 1987 were the sharpest drops.
    </div>
</div>

### The Kennedy Slide (-22%)

The early 1960s opened with a sudden 22% decline in the first half of 1962, triggered by Kennedy's confrontation with the steel industry and general overvaluation. But the drop was short-lived, and by January 1966 the market had gained 68% from its trough.

### Go-Go Years and Nifty Fifty

The mid-1960s "Go-Go" era saw speculative enthusiasm around growth stocks and conglomerates. The "Nifty Fifty" — a group of blue-chip stocks considered safe at any price — drove the market to new highs through 1972. The S&P reached 120 in January 1973.

### Vietnam, Oil, and Stagflation (-43%)

Then the world changed. The Vietnam War's economic cost, Nixon's wage-price controls, and the **OPEC oil embargo of 1973** combined to produce the worst bear market since the Depression. The S&P fell **43%** from its January 1973 peak, bottoming in late 1974 (the daily-close low of 62.28 came in October).

What followed was even more painful: a "lost decade" of **stagflation** — simultaneous high inflation and stagnant growth. From 1968 to 1982, the S&P 500 went essentially nowhere in real (inflation-adjusted) terms. An investor who bought at the 1968 peak didn't see a real return for over 14 years.

<div class="sp-callout sp-callout-note">
  <strong>Nominal charts hide the 1970s.</strong> On the price chart above, 1968–1982 looks like a sideways wobble. In purchasing-power terms it was a slow-motion 60%+ loss — inflation did the damage that no single crash label captures. This is the strongest argument for reading long-run market history in real terms, not just nominal.
</div>

### Volcker's Shock Therapy (-19%)

In 1980, Federal Reserve Chairman Paul Volcker raised interest rates to **19%** to kill inflation. The short-term pain was severe — a 19% market decline and a deep recession — but it worked. Inflation fell from 14% to under 4% by 1983, setting the stage for the great bull market of the 1980s.

### Reaganomics (+201%)

Tax cuts, deregulation, and falling interest rates fueled a spectacular five-year rally from 1982 to 1987. The S&P tripled, rising **201%** from a monthly average of 109 to 329.

### Black Monday (-27%)

On October 19, 1987, the market crashed **22.6% in a single day** — the largest single-day percentage drop in history. Program trading and portfolio insurance strategies amplified the selling; peak to trough, monthly averages fell 27%. But unlike the Great Depression, the recovery was swift. By July 1989 — under two years — the market had set new highs. The lesson: not all crashes lead to prolonged bear markets.

<p class="sp-takeaway"><strong>Era II in one line:</strong> the enemy changed — from collapse to inflation — but the pattern held. The decade that felt permanently stuck ended with the launch pad for the biggest bull market ever.</p>

---

## Era III: The Modern Market (1992–2024)

By the 1990s the players had learned Era I's lesson: central banks now intervene fast and hard. Era III tests whether that changes the crash-recovery pattern — and it does, in one specific way: **the crashes stay violent, but the recoveries keep getting shorter.**

<div class="d-figure">
    <div class="d-figure-content sp500-chart-wrap">
        <canvas id="sp500-era3"></canvas>
    </div>
    <div class="d-figure-caption">
        <strong>Figure 4.</strong> S&P 500, 1992–2024. Three major crashes — Dot-com, Great Recession, and COVID — but faster recoveries than historical averages. The market multiplied 14x over this period.
    </div>
</div>

### The Roaring Nineties (+516%)

The bull market that began after Black Monday ran for nearly thirteen years — the longest on record — gaining **516%**. Globalization, the tech revolution, and the longest economic expansion in U.S. history propelled the market from 416 in early 1992 to nearly 1,500 by 2000.

The Asian Financial Crisis of 1998 (-12% on monthly averages, a 19% slide in daily closes) was over in two months. It barely registered as a pause in the bull run.

### The Dot-com Bust (-44%)

The bubble burst in 2000. Hundreds of internet companies with no profits (and sometimes no revenue) saw their stocks collapse. The S&P fell **44%** over the next two and a half years — the daily-close bottom of 777 came in October 2002, and monthly averages troughed in early 2003. The September 11 attacks in 2001 accelerated the decline but weren't the primary cause.

### The Housing Bubble and Great Recession (-51%)

After recovering from the dot-com bust, the market was hit by an even larger crisis. The **subprime mortgage meltdown** and collapse of major financial institutions (Bear Stearns, Lehman Brothers, AIG) triggered a **51% decline** — the worst since the Depression. The S&P bottomed in March 2009, touching an intraday low of 667.

The recovery was fueled by unprecedented Federal Reserve intervention — quantitative easing, near-zero interest rates, and bank bailouts. From the 2009 low, the market began a bull run that would last over a decade.

### The Post-GFC Bull Run (+333%)

From March 2009 to early 2020, the market rose **333%** over nearly eleven years — one of the longest bull markets in history (the 2011 euro-crisis dip of 12% never reached correction territory on monthly averages). Low interest rates, tech-driven productivity gains, and corporate tax cuts all contributed. By February 2020, the S&P had reached a daily-close peak of 3,386.

### COVID-19 (-34%)

The pandemic crash of March 2020 was the **fastest 30% decline ever** — it took just 22 trading days, and daily closes fell 34% peak to trough. The crash and rebound happened so fast that monthly averages, which smooth within-month swings, dropped only 19%. It was also followed by the **fastest recovery ever**: within six months, the market had fully recovered, driven by massive fiscal stimulus, Federal Reserve intervention, and a shift toward technology that benefited the largest companies.

### Inflation Returns (-25%)

Russia's invasion of Ukraine in 2022, combined with post-pandemic inflation and aggressive Fed rate hikes, produced a **25% decline** in daily closes over 10 months (20% on monthly averages). By late 2023, the market had recovered again, driven by the AI boom and resilient corporate earnings.

<p class="sp-takeaway"><strong>Era III in one line:</strong> three 30-50% crashes in three decades, each recovered faster than the last — 7 years, 5.4 years, 6 months. The system didn't stop crashing; it got faster at absorbing crashes.</p>

---

## Bull vs. Bear: By the Numbers

Three eras of anecdotes invite a statistical question: across all 43 swings, are the ups actually bigger than the downs — or does it just feel that way in hindsight? The answer is unambiguous: **bull markets are longer and larger than bear markets.** Measured on monthly averages with a 15% reversal threshold, the average bull run gains 115% over 3.3 years. The average decline loses 30% over 1.2 years.

<div class="d-table-wrapper">
<table class="sp500-stats-table">
    <thead>
        <tr>
            <th></th>
            <th class="sp500-bull-header">Bull Market Events</th>
            <th class="sp500-bull-header">Duration</th>
            <th class="sp500-bull-header">Gain</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Shortest</strong></td>
            <td>1932 Summer Rally</td>
            <td>3 Months</td>
            <td class="sp500-gain">+73%</td>
        </tr>
        <tr>
            <td><strong>Average</strong></td>
            <td>—</td>
            <td>3.3 Years</td>
            <td class="sp500-gain">+115%</td>
        </tr>
        <tr>
            <td><strong>Longest</strong></td>
            <td>Post-Black Monday (1987–2000)</td>
            <td>12.7 Years</td>
            <td class="sp500-gain">+516%</td>
        </tr>
    </tbody>
</table>
</div>

<div class="d-table-wrapper">
<table class="sp500-stats-table">
    <thead>
        <tr>
            <th></th>
            <th class="sp500-bear-header">Bear Market Events</th>
            <th class="sp500-bear-header">Duration</th>
            <th class="sp500-bear-header">Loss</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Shortest</strong></td>
            <td>COVID Crash (2020)</td>
            <td>2 Months</td>
            <td class="sp500-loss">-19%</td>
        </tr>
        <tr>
            <td><strong>Average</strong></td>
            <td>—</td>
            <td>1.2 Years</td>
            <td class="sp500-loss">-30%</td>
        </tr>
        <tr>
            <td><strong>Longest</strong></td>
            <td>Great Depression</td>
            <td>2.8 Years</td>
            <td class="sp500-loss">-85%</td>
        </tr>
    </tbody>
</table>
</div>

The asymmetry is striking. **Markets spend far more time going up than going down.** But bear markets are psychologically devastating precisely because they are concentrated and violent. A 50% decline requires a 100% gain to recover — which is why crashes feel so much worse than rallies feel good.

<div class="sp-callout sp-callout-key">
  <strong>This asymmetry is the whole compounding engine.</strong> +115% average gain over 3.3 years versus -30% average loss over 1.2 years means each full cycle nets out positive. The investor doesn't need to dodge the bears; they need to still be holding when the next bull starts — which, historically, has begun while the news was still terrible.
</div>

## Recovery Times

How long does it take to recover from a crash? The answer varies enormously:

- **COVID crash (2020):** 6 months to full recovery
- **Black Monday (1987):** just under 2 years
- **Dot-com bust (2000):** about 7 years to break even
- **Housing crisis (2007):** 5.4 years
- **Great Depression (1929):** 25 years — though dividends reinvested cut this significantly

The trend is toward **faster recoveries**, likely because modern central banks intervene more aggressively than their predecessors. The Federal Reserve's toolkit has expanded dramatically since the 1930s.

## Valuation Through the Decades

If crashes can't be timed, is there *anything* in the data that says something about the future? Price alone doesn't tell you whether the market is cheap or expensive. For that, we need a valuation metric. The **Shiller PE Ratio** (also called **CAPE** — Cyclically Adjusted Price-to-Earnings) divides the S&P 500's price by the average of the past 10 years of inflation-adjusted earnings. By smoothing out short-term profit swings, it provides a more stable read on whether stocks are historically cheap or overpriced.

<div class="d-figure">
    <div class="d-figure-content sp500-chart-wrap">
        <canvas id="sp500-cape"></canvas>
    </div>
    <div class="d-figure-caption">
        <strong>Figure 5.</strong> S&P 500 (blue dashed, right axis, log scale) overlaid with the Shiller PE Ratio (CAPE, orange, left axis). The dashed horizontal line marks the CAPE long-term average of ~17. Notice how CAPE peaks preceded or coincided with major market inflection points.
    </div>
</div>

The pattern is striking. The two highest CAPE readings in history — **44 in late 1999** and **39 in late 2021** — both preceded significant drawdowns. The lowest readings — single digits in 1932, 1942, and 1982 — marked the starting points of some of the greatest bull markets ever. In mid-1982, with CAPE below 7, the next 18 years would deliver a **more than 13-fold increase** in the S&P 500.

But CAPE is not a timing tool. By late 1996 the ratio had surpassed its 1929 peak of 27 — already "expensive" by historical standards — and the market still **doubled** over the following three years before the dot-com crash.

<div class="sp-callout sp-callout-note">
  <strong>Read CAPE as a yield, not an alarm.</strong> High CAPE doesn't predict <em>when</em> crashes happen — 1996 proved that expensively. What it does predict, fairly reliably, is <strong>lower average returns over the following decade</strong>. It measures the price you pay for a dollar of earnings, and higher prices mean lower future yields, just as with bonds. Today's CAPE of ~38, well above the ~17 long-term average, says "expect less," not "sell now."
</div>

## Key Takeaways

<div class="takeaways">
    <div class="takeaway">
        <span class="takeaway-num">1</span>
        <div class="takeaway-content">
            <strong>The long-term trend is relentlessly upward.</strong> Despite two world wars, a global depression, oil crises, terrorist attacks, a pandemic, and countless recessions, $100 invested in 1926 became $1.48 million (nominal — roughly a 7% annual return after inflation). The market's compounding engine is extraordinarily resilient — with the survivorship caveat that this is the one big market where it never broke.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">2</span>
        <div class="takeaway-content">
            <strong>Every crash felt like "this time is different."</strong> The Great Depression, the Oil Shock, the Dot-com bust, the Financial Crisis, COVID — each one generated narratives about permanent economic damage. Each time, the market recovered.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">3</span>
        <div class="takeaway-content">
            <strong>Time in the market beats timing the market.</strong> Missing just the 10 best trading days over any 20-year period cuts returns by roughly half. Those best days often occur during or immediately after crashes — exactly when panic is highest.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">4</span>
        <div class="takeaway-content">
            <strong>Policy responses have gotten faster.</strong> The Great Depression lasted a decade partly because the government initially did too little. Modern central banks and fiscal authorities now intervene within days, which has compressed recovery times — from 25 years in the 1930s to 6 months in 2020.
        </div>
    </div>
</div>

## References

<div class="d-bibliography">
<ol>
    <li>Shiller, Robert J. "U.S. Stock Markets 1871–Present and CAPE Ratio." Yale University. Monthly-average S&P Composite data via <a href="https://datahub.io/core/s-and-p-500">datahub.io</a>.</li>
    <li>Sensible Financial Planning. "How Has the S&P 500 Performed Over the Last 98 Years?" <a href="https://web.archive.org/web/20260212170504/https://www.sensiblefinancial.com/how-has-the-sp-500-performed-over-the-last-98-years/">archived at web.archive.org</a>.</li>
    <li>S&P Dow Jones Indices. "S&P 500 Historical Data." <a href="https://www.spglobal.com/spdji/">spglobal.com</a>.</li>
    <li>Shiller, Robert J. <em>Irrational Exuberance</em>. Princeton University Press, 2015.</li>
    <li>Siegel, Jeremy J. <em>Stocks for the Long Run</em>. McGraw-Hill, 2023.</li>
</ol>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
<script src="/js/sp500-charts.js?v=6"></script>
