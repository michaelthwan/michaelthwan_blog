// BERT masked-language-model demo.
// Self-contained. Renders a sentence; clicking a token masks it and shows
// illustrative predictions that reflect how bidirectional context pins the word.
// IDs/classes here are private to this file (bt-mask- prefix) and are not
// referenced by public/script.js.
(function () {
  'use strict';

  var SENTENCE = [
    { word: 'The', preds: null },
    {
      word: 'cat',
      preds: [
        { w: 'cat', p: 0.34, truth: true },
        { w: 'dog', p: 0.29 },
        { w: 'boy', p: 0.07 },
        { w: 'man', p: 0.05 },
        { w: 'girl', p: 0.04 }
      ]
    },
    {
      word: 'sat',
      preds: [
        { w: 'sat', p: 0.38, truth: true },
        { w: 'lay', p: 0.19 },
        { w: 'jumped', p: 0.09 },
        { w: 'stood', p: 0.06 },
        { w: 'slept', p: 0.05 }
      ]
    },
    {
      word: 'on',
      preds: [
        { w: 'on', p: 0.55, truth: true },
        { w: 'upon', p: 0.12 },
        { w: 'atop', p: 0.08 },
        { w: 'near', p: 0.05 },
        { w: 'in', p: 0.04 }
      ]
    },
    { word: 'the', preds: null },
    {
      word: 'mat',
      preds: [
        { w: 'mat', p: 0.30, truth: true },
        { w: 'floor', p: 0.21 },
        { w: 'ground', p: 0.11 },
        { w: 'couch', p: 0.07 },
        { w: 'bed', p: 0.05 }
      ]
    }
  ];

  function build(container) {
    var wrap = document.createElement('div');
    wrap.className = 'bt-mask-wrap';

    var row = document.createElement('div');
    row.className = 'bt-mask-row';

    var panel = document.createElement('div');
    panel.className = 'bt-mask-panel';
    panel.innerHTML = '<div class="bt-mask-hint">Click a word above to hide it and see the prediction.</div>';

    var maskedIndex = -1;

    function renderTokens() {
      row.innerHTML = '';
      SENTENCE.forEach(function (tok, i) {
        var span = document.createElement('span');
        var maskable = tok.preds !== null;
        span.className = 'bt-mask-token' + (maskable ? ' bt-mask-clickable' : '') +
          (i === maskedIndex ? ' bt-mask-hidden' : '');
        span.textContent = i === maskedIndex ? '[MASK]' : tok.word;
        if (maskable) {
          span.addEventListener('click', function () {
            maskedIndex = (maskedIndex === i) ? -1 : i;
            renderTokens();
            renderPanel();
          });
        }
        row.appendChild(span);
      });
    }

    function renderPanel() {
      if (maskedIndex < 0) {
        panel.innerHTML = '<div class="bt-mask-hint">Click a word above to hide it and see the prediction.</div>';
        return;
      }
      var preds = SENTENCE[maskedIndex].preds;
      var max = preds[0].p;
      var html = '<div class="bt-mask-plabel">Top predictions for the blank</div>';
      preds.forEach(function (pr) {
        var pct = Math.round(pr.p * 100);
        var w = Math.round((pr.p / max) * 100);
        html += '<div class="bt-mask-bar-row' + (pr.truth ? ' bt-mask-truth' : '') + '">' +
          '<span class="bt-mask-bar-word">' + pr.w + '</span>' +
          '<span class="bt-mask-bar-track"><span class="bt-mask-bar-fill" style="width:' + w + '%"></span></span>' +
          '<span class="bt-mask-bar-pct">' + pct + '%</span>' +
          '</div>';
      });
      panel.innerHTML = html;
    }

    wrap.appendChild(row);
    wrap.appendChild(panel);
    container.appendChild(wrap);

    renderTokens();
    renderPanel();
  }

  function injectStyle() {
    if (document.getElementById('bt-mask-style')) return;
    var css =
      '.bt-mask-wrap{font-size:0.95rem}' +
      '.bt-mask-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px}' +
      '.bt-mask-token{padding:6px 12px;border-radius:6px;background:#f3f4f6;color:#374151;border:1px solid #e5e7eb}' +
      '.bt-mask-clickable{cursor:pointer;transition:background .15s,color .15s}' +
      '.bt-mask-clickable:hover{background:#e0e7ff;color:#3730a3}' +
      '.bt-mask-hidden{background:#4f46e5;color:#fff;border-color:#4f46e5;font-weight:700}' +
      '.bt-mask-panel{max-width:420px;margin:0 auto;min-height:40px}' +
      '.bt-mask-hint{color:#9ca3af;text-align:center;font-size:0.85rem;padding:10px 0}' +
      '.bt-mask-plabel{font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;margin-bottom:8px}' +
      '.bt-mask-bar-row{display:flex;align-items:center;gap:8px;margin:5px 0}' +
      '.bt-mask-bar-word{width:64px;text-align:right;font-size:0.85rem;color:#374151}' +
      '.bt-mask-bar-track{flex:1;height:14px;background:#f3f4f6;border-radius:7px;overflow:hidden}' +
      '.bt-mask-bar-fill{display:block;height:100%;background:#a5b4fc;border-radius:7px}' +
      '.bt-mask-bar-pct{width:38px;font-size:0.8rem;color:#6b7280;font-variant-numeric:tabular-nums}' +
      '.bt-mask-truth .bt-mask-bar-word{font-weight:700;color:#065f46}' +
      '.bt-mask-truth .bt-mask-bar-fill{background:#10b981}' +
      '.bt-mask-truth .bt-mask-bar-word::after{content:" \\2713";color:#10b981}' +
      '@media (prefers-color-scheme: dark){' +
      '.bt-mask-token{background:#27272a;color:#d4d4d8;border-color:#3f3f46}' +
      '.bt-mask-clickable:hover{background:#312e81;color:#c7d2fe}' +
      '.bt-mask-bar-word{color:#d4d4d8}.bt-mask-bar-track{background:#27272a}' +
      '.bt-mask-hint{color:#71717a}}';
    var style = document.createElement('style');
    style.id = 'bt-mask-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function init() {
    var container = document.getElementById('bt-mask-demo');
    if (!container) return;
    injectStyle();
    build(container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
