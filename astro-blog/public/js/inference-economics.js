/**
 * Inference Economics — interactive charts and cost calculator.
 *
 * Two pieces:
 *  1) A log-scale chart of the blended price per million tokens for
 *     GPT-4-class (or better) capability over time. Prices are 80/20
 *     input/output blends of published list prices (nominal USD).
 *  2) A monthly inference-cost calculator with a "time machine" that
 *     reprices the same workload at 2023, 2024, and 2026 list prices.
 *
 * Self-contained vanilla JS. Every DOM lookup is guarded so a missing
 * element never throws. Chart.js is loaded from CDN in the post markdown.
 */

(function () {
  'use strict';

  /* ============================================================
     1. PRICE-OVER-TIME CHART
     Blended 80/20 (input/output) list price, $ per 1M tokens,
     for models at or above GPT-4 capability. Sources are cited
     in the post body. year_decimal = year + month/12 (approx).
     ============================================================ */

  const PRICE_POINTS = [
    { x: 2023.20, y: 36.0,  model: 'GPT-4 (launch)',      note: '$30 / $60 in-out' },
    { x: 2023.85, y: 14.0,  model: 'GPT-4 Turbo',         note: '$10 / $30 in-out' },
    { x: 2024.37, y: 7.0,   model: 'GPT-4o (launch)',     note: '$5 / $15 in-out' },
    { x: 2024.80, y: 4.0,   model: 'GPT-4o (Oct cut)',    note: '$2.50 / $10 in-out' },
    { x: 2024.95, y: 0.44,  model: 'DeepSeek V3',         note: '~$0.27 / $1.10 in-out' },
    { x: 2025.15, y: 0.16,  model: 'Gemini 2.0 Flash',    note: '$0.10 / $0.40 in-out' }
  ];

  // Small plugin: draw the model name next to each point.
  const pointLabelPlugin = {
    id: 'iePointLabels',
    afterDatasetsDraw: function (chart) {
      const meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data) return;
      const ctx = chart.ctx;
      ctx.save();
      ctx.font = '600 10.5px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#4b5563';
      for (let i = 0; i < meta.data.length; i++) {
        const pt = meta.data[i];
        const src = PRICE_POINTS[i];
        if (!pt || !src) continue;
        const above = i < 4; // early points labelled above, later below
        ctx.textAlign = i === 0 ? 'left' : (i === PRICE_POINTS.length - 1 ? 'right' : 'center');
        const dy = above ? -10 : 16;
        ctx.fillText(src.model, pt.x, pt.y + dy);
      }
      ctx.restore();
    }
  };

  function buildPriceChart() {
    const canvas = document.getElementById('ie-price-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    Chart.register(pointLabelPlugin);

    new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [{
          data: PRICE_POINTS,
          parsing: { xAxisKey: 'x', yAxisKey: 'y' },
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.07)',
          borderWidth: 2.5,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#2563eb',
          tension: 0.25
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: { padding: { top: 18, right: 24, left: 6, bottom: 4 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.96)',
            titleColor: '#111827',
            bodyColor: '#4b5563',
            borderColor: '#d1d5db',
            borderWidth: 1,
            cornerRadius: 4,
            padding: 10,
            displayColors: false,
            callbacks: {
              title: function (items) {
                const p = items[0].raw;
                return p.model;
              },
              label: function (item) {
                const p = item.raw;
                return ['Blended: $' + p.y.toFixed(2) + ' / 1M tokens', p.note];
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            min: 2023,
            max: 2025.4,
            title: { display: true, text: 'Year', color: '#6b7280', font: { size: 12, family: 'Inter, system-ui, sans-serif' } },
            ticks: {
              stepSize: 0.5,
              color: '#9ca3af',
              font: { size: 10, family: 'Inter, system-ui, sans-serif' },
              callback: function (v) { return Number.isInteger(v) ? String(v) : ''; }
            },
            grid: { color: 'rgba(0,0,0,0.04)' }
          },
          y: {
            type: 'logarithmic',
            title: { display: true, text: 'Blended $ / 1M tokens (log)', color: '#6b7280', font: { size: 12, family: 'Inter, system-ui, sans-serif' } },
            min: 0.1,
            max: 60,
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: {
              color: '#9ca3af',
              font: { size: 10, family: 'Inter, system-ui, sans-serif' },
              callback: function (v) {
                const show = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
                return show.includes(v) ? '$' + v : '';
              }
            }
          }
        }
      }
    });
  }

  /* ============================================================
     2. COST CALCULATOR
     ============================================================ */

  // 2026 model tiers: [inputPricePerM, outputPricePerM]
  const TIERS_2026 = {
    frontier: { label: 'Frontier (Opus / GPT-5.5 class)', in: 5.00, out: 25.00 },
    mid:      { label: 'Mid-tier (Sonnet / Gemini 3 Pro class)', in: 3.00, out: 15.00 },
    economy:  { label: 'Economy (Gemini 3 Flash / Haiku class)', in: 0.50, out: 3.00 },
    ultra:    { label: 'Ultra-economy (DeepSeek Flash class)', in: 0.14, out: 0.28 }
  };

  // "Time machine" list prices for a GPT-4-class workload, by year.
  const ERA_PRICES = {
    2023: { label: 'GPT-4 (2023)',            in: 30.00, out: 60.00 },
    2024: { label: 'GPT-4o (late 2024)',      in: 2.50,  out: 10.00 },
    2026: { label: 'Economy tier (2026)',     in: 0.50,  out: 3.00  }
  };

  const DAYS_PER_MONTH = 30.4;

  function fmtMoney(v) {
    if (v >= 1000000) return '$' + (v / 1000000).toFixed(2) + 'M';
    if (v >= 1000) return '$' + (v / 1000).toFixed(1) + 'k';
    if (v >= 10) return '$' + v.toFixed(0);
    if (v >= 1) return '$' + v.toFixed(2);
    return '$' + v.toFixed(3);
  }

  function fmtInt(v) {
    return Math.round(v).toLocaleString();
  }

  function fmtTokens(v) {
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(0) + 'k';
    return String(Math.round(v));
  }

  function monthlyCost(reqPerDay, inTok, outTok, priceIn, priceOut) {
    const reqPerMonth = reqPerDay * DAYS_PER_MONTH;
    const inCost = (reqPerMonth * inTok / 1e6) * priceIn;
    const outCost = (reqPerMonth * outTok / 1e6) * priceOut;
    return inCost + outCost;
  }

  function initCalculator() {
    const reqSlider = document.getElementById('ie-req-slider');
    const inSlider = document.getElementById('ie-in-slider');
    const outSlider = document.getElementById('ie-out-slider');
    const tierSelect = document.getElementById('ie-tier-select');
    if (!reqSlider || !inSlider || !outSlider || !tierSelect) return;

    const reqVal = document.getElementById('ie-req-val');
    const inVal = document.getElementById('ie-in-val');
    const outVal = document.getElementById('ie-out-val');
    const tokensMonth = document.getElementById('ie-tokens-month');
    const costMonth = document.getElementById('ie-cost-month');
    const tierNote = document.getElementById('ie-tier-note');

    function recompute() {
      const reqPerDay = parseInt(reqSlider.value, 10) || 0;
      const inTok = parseInt(inSlider.value, 10) || 0;
      const outTok = parseInt(outSlider.value, 10) || 0;
      const tier = TIERS_2026[tierSelect.value] || TIERS_2026.mid;

      if (reqVal) reqVal.textContent = fmtInt(reqPerDay);
      if (inVal) inVal.textContent = fmtInt(inTok);
      if (outVal) outVal.textContent = fmtInt(outTok);
      if (tierNote) tierNote.textContent = '$' + tier.in.toFixed(2) + ' in / $' + tier.out.toFixed(2) + ' out per 1M tokens';

      const totalTokensMonth = reqPerDay * DAYS_PER_MONTH * (inTok + outTok);
      if (tokensMonth) tokensMonth.textContent = fmtTokens(totalTokensMonth);

      const selCost = monthlyCost(reqPerDay, inTok, outTok, tier.in, tier.out);
      if (costMonth) costMonth.textContent = fmtMoney(selCost);

      // Time machine: same workload, three eras.
      const eraCosts = {};
      let maxCost = 0;
      Object.keys(ERA_PRICES).forEach(function (yr) {
        const e = ERA_PRICES[yr];
        const c = monthlyCost(reqPerDay, inTok, outTok, e.in, e.out);
        eraCosts[yr] = c;
        if (c > maxCost) maxCost = c;
      });

      Object.keys(ERA_PRICES).forEach(function (yr) {
        const valEl = document.getElementById('ie-cost-' + yr);
        const barEl = document.getElementById('ie-bar-' + yr);
        if (valEl) valEl.textContent = fmtMoney(eraCosts[yr]);
        if (barEl) {
          const pct = maxCost > 0 ? (eraCosts[yr] / maxCost) * 100 : 0;
          barEl.style.width = Math.max(pct, 1.5) + '%';
        }
      });

      const factorEl = document.getElementById('ie-factor');
      if (factorEl) {
        const factor = eraCosts[2026] > 0 ? eraCosts[2023] / eraCosts[2026] : 0;
        factorEl.textContent = factor >= 10 ? Math.round(factor) + '×' : factor.toFixed(1) + '×';
      }
    }

    [reqSlider, inSlider, outSlider].forEach(function (el) {
      el.addEventListener('input', recompute);
    });
    tierSelect.addEventListener('change', recompute);
    recompute();
  }

  /* ============================================================
     BOOT
     ============================================================ */

  function init() {
    try { buildPriceChart(); } catch (e) { /* chart optional */ }
    try { initCalculator(); } catch (e) { /* calculator optional */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
