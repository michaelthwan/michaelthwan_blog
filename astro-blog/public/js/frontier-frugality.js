/* Frontier Frugality — agentic session cost calculator */
(function () {
  'use strict';

  var PRICES = {
    fable:  { input: 10, output: 50 },
    opus:   { input: 5,  output: 25 },
    sonnet: { input: 3,  output: 15 }
  };
  var HAIKU = { input: 1, output: 5 };

  var BASE_CONTEXT = 15000;   // system prompt + instructions + tool definitions
  var OUTPUT_PER_TURN = 400;  // visible output tokens per turn
  var SUMMARY_RATIO = 0.10;   // subagent summary length vs delegated bulk
  var SUBAGENT_OVERHEAD = 2;  // allowance for the subagent's own loop overhead
  var CACHE_WRITE_MULT = 1.25;
  var CACHE_READ_MULT = 0.10;

  function fmtMoney(x) {
    if (x >= 1000) return '$' + Math.round(x).toLocaleString('en-US');
    if (x >= 100) return '$' + x.toFixed(0);
    if (x >= 10) return '$' + x.toFixed(1);
    return '$' + x.toFixed(2);
  }

  // Total input tokens billed across T turns when context grows by dx per turn.
  function billedInputTokens(T, dx) {
    return T * BASE_CONTEXT + dx * T * (T - 1) / 2;
  }

  // Session cost for the orchestrator, with or without caching.
  // dx = context growth per turn actually entering the orchestrator's window.
  function orchestratorCost(T, dx, price, cached) {
    var tokens = billedInputTokens(T, dx);
    var inputCost;
    if (cached) {
      var written = BASE_CONTEXT + T * dx; // each token written to cache once
      var reads = Math.max(0, tokens - written);
      inputCost = (CACHE_WRITE_MULT * written + CACHE_READ_MULT * reads) * price.input / 1e6;
    } else {
      inputCost = tokens * price.input / 1e6;
    }
    var outputCost = T * OUTPUT_PER_TURN * price.output / 1e6;
    return inputCost + outputCost;
  }

  // Cost of Haiku subagents reading the delegated bulk and returning summaries.
  function subagentCost(T, delta, share) {
    var bulk = delta * share;
    var perTurn = (bulk * HAIKU.input + SUMMARY_RATIO * bulk * HAIKU.output) / 1e6;
    return T * SUBAGENT_OVERHEAD * perTurn;
  }

  function init() {
    var root = document.getElementById('ff-calculator');
    if (!root) return;

    var modelSel = document.getElementById('ff-model-select');
    var turnsSlider = document.getElementById('ff-turns-slider');
    var deltaSlider = document.getElementById('ff-delta-slider');
    var shareSlider = document.getElementById('ff-share-slider');

    function update() {
      var price = PRICES[modelSel.value];
      var T = parseInt(turnsSlider.value, 10);
      var delta = parseInt(deltaSlider.value, 10);
      var share = parseInt(shareSlider.value, 10) / 100;

      document.getElementById('ff-turns-val').textContent = T + ' turns';
      document.getElementById('ff-delta-val').textContent = delta.toLocaleString('en-US') + ' tokens';
      document.getElementById('ff-share-val').textContent = Math.round(share * 100) + '%';

      // Context growth per turn after delegation: kept bulk + summaries of delegated bulk.
      var deltaDeleg = delta * (1 - share) + delta * share * SUMMARY_RATIO;
      var sub = subagentCost(T, delta, share);

      var costNaive = orchestratorCost(T, delta, price, false);
      var costCache = orchestratorCost(T, delta, price, true);
      var costDeleg = orchestratorCost(T, deltaDeleg, price, false) + sub;
      var costBoth = orchestratorCost(T, deltaDeleg, price, true) + sub;

      document.getElementById('ff-cost-naive').textContent = fmtMoney(costNaive);
      document.getElementById('ff-cost-both').textContent = fmtMoney(costBoth);
      document.getElementById('ff-cost-month').textContent = fmtMoney(costBoth * 20);

      var rows = [
        ['naive', costNaive],
        ['cache', costCache],
        ['deleg', costDeleg],
        ['both', costBoth]
      ];
      rows.forEach(function (row) {
        var pct = costNaive > 0 ? Math.max(1.5, 100 * row[1] / costNaive) : 0;
        document.getElementById('ff-bar-' + row[0]).style.width = pct + '%';
        document.getElementById('ff-val-' + row[0]).textContent = fmtMoney(row[1]);
      });

      var factor = costBoth > 0 ? costNaive / costBoth : 0;
      document.getElementById('ff-factor').textContent = factor.toFixed(1) + 'x';
    }

    [modelSel, turnsSlider, deltaSlider, shareSlider].forEach(function (el) {
      el.addEventListener('input', update);
    });
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
