(function () {
  'use strict';

  var BENCHMARKS = [
    { name: 'SWE-Bench Pro', scores: [{ label: 'GPT-5.6 Sol', value: 64.6, cls: 'openai' }, { label: 'Grok 4.5', value: 64.7, cls: 'grok' }] },
    { name: 'DeepSWE v1.1', scores: [{ label: 'GPT-5.6 Sol', value: 72.7, cls: 'openai' }, { label: 'Grok 4.5', value: 53.0, cls: 'grok' }] },
    { name: 'Terminal-Bench 2.1', scores: [{ label: 'GPT-5.6 Sol', value: 88.8, cls: 'openai' }, { label: 'Grok 4.5', value: 83.3, cls: 'grok' }] }
  ];

  var PROFILES = {
    gpt: { coding: 96, agent: 94, multimodal: 82, cost: 67 },
    grok: { coding: 92, agent: 84, multimodal: 62, cost: 94 },
    muse: { coding: 80, agent: 96, multimodal: 98, cost: 82 }
  };

  function renderBenchmarks() {
    var root = document.getElementById('fm-benchmark-bars');
    if (!root) return;
    BENCHMARKS.forEach(function (benchmark) {
      var group = document.createElement('div');
      group.className = 'fm-benchmark';
      var title = document.createElement('div');
      title.className = 'fm-benchmark-title';
      title.textContent = benchmark.name;
      group.appendChild(title);
      benchmark.scores.forEach(function (score) {
        var row = document.createElement('div');
        row.className = 'fm-bar-row';
        row.innerHTML = '<span>' + score.label + '</span><div class="fm-track"><div class="fm-bar fm-bar-' + score.cls + '" style="width:' + score.value + '%"></div></div><span class="fm-score">' + score.value.toFixed(1) + '</span>';
        group.appendChild(row);
      });
      root.appendChild(group);
    });
  }

  function initSelector() {
    var root = document.getElementById('fm-selector');
    if (!root) return;
    var dimensions = ['coding', 'agent', 'multimodal', 'cost'];
    var sliders = {};
    dimensions.forEach(function (key) { sliders[key] = document.getElementById('fm-' + key); });

    function update() {
      var weights = {};
      var total = 0;
      dimensions.forEach(function (key) {
        weights[key] = Number(sliders[key].value);
        total += weights[key];
        document.getElementById('fm-' + key + '-val').textContent = weights[key];
      });
      if (total === 0) {
        dimensions.forEach(function (key) { weights[key] = 1; });
        total = dimensions.length;
      }

      var scores = {};
      Object.keys(PROFILES).forEach(function (model) {
        var weighted = dimensions.reduce(function (sum, key) { return sum + PROFILES[model][key] * weights[key]; }, 0);
        scores[model] = weighted / total;
        document.getElementById('fm-' + model + '-score').textContent = scores[model].toFixed(1);
      });
      var winner = Object.keys(scores).reduce(function (best, model) { return scores[model] > scores[best] ? model : best; }, 'gpt');
      root.querySelectorAll('.fm-result').forEach(function (card) {
        card.classList.toggle('fm-winner', card.getAttribute('data-model') === winner);
      });
    }

    dimensions.forEach(function (key) { sliders[key].addEventListener('input', update); });
    update();
  }

  function init() {
    renderBenchmarks();
    initSelector();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
