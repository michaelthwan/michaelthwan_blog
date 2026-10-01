// Transformer post interactives (A-E). Self-contained; all classes/ids use the
// tf- prefix and are styled by the inline <style> block in transformer.md.
// The positional-encoding interactive lives in public/script.js and is untouched.
// Pure math helpers are exported for Node so the numbers can be checked outside
// the browser: `node -e "const t=require('./public/js/transformer.js'); ..."`.
(function () {
  'use strict';

  /* ---------- math ---------- */

  function dot(a, b) {
    var s = 0;
    for (var i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
  }

  // Softmax: exponentiate every score, then divide by the total so the results
  // are positive and sum to 1. -Infinity scores (masked) get exactly 0.
  function softmax(xs) {
    var m = -Infinity;
    xs.forEach(function (x) { if (x > m) m = x; });
    var e = xs.map(function (x) { return x === -Infinity ? 0 : Math.exp(x - m); });
    var s = e.reduce(function (p, c) { return p + c; }, 0);
    return e.map(function (x) { return x / s; });
  }

  // One query attending over a set of keys/values: scores, scaled scores,
  // weights, and the weighted mix of values.
  function attendOne(q, keys, values, dk) {
    var raw = keys.map(function (k) { return dot(q, k); });
    var scaled = raw.map(function (x) { return x / Math.sqrt(dk); });
    var w = softmax(scaled);
    var out = values[0].map(function (_, d) {
      return values.reduce(function (acc, v, i) { return acc + w[i] * v[d]; }, 0);
    });
    return { raw: raw, scaled: scaled, w: w, out: out };
  }

  // Deterministic RNG (mulberry32) and standard normals (Box-Muller).
  function makeRng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function normals(rng, n) {
    var out = [];
    while (out.length < n) {
      var u = Math.max(rng(), 1e-12), v = rng();
      var r = Math.sqrt(-2 * Math.log(u));
      out.push(r * Math.cos(2 * Math.PI * v));
      out.push(r * Math.sin(2 * Math.PI * v));
    }
    return out.slice(0, n);
  }
  function std(xs) {
    var m = xs.reduce(function (p, c) { return p + c; }, 0) / xs.length;
    var v = xs.reduce(function (p, c) { return p + (c - m) * (c - m); }, 0) / xs.length;
    return Math.sqrt(v);
  }

  // Interactive C data: one query, 8 shown keys, 256 extra keys only used to
  // estimate the spread of scores. Components are unit-variance normals.
  var DK_MAX = 512;
  var SCALE_DATA = (function () {
    var rng = makeRng(20170612);
    var q = normals(rng, DK_MAX);
    var keys = [];
    for (var i = 0; i < 8; i++) keys.push(normals(rng, DK_MAX));
    var probe = [];
    for (var j = 0; j < 256; j++) probe.push(normals(rng, DK_MAX));
    return { q: q, keys: keys, probe: probe };
  })();

  function scaleDemo(dk) {
    var q = SCALE_DATA.q.slice(0, dk);
    var raw = SCALE_DATA.keys.map(function (k) { return dot(q, k.slice(0, dk)); });
    var probeRaw = SCALE_DATA.probe.map(function (k) { return dot(q, k.slice(0, dk)); });
    var scaled = raw.map(function (x) { return x / Math.sqrt(dk); });
    var wU = softmax(raw), wS = softmax(scaled);
    // Sum of w_i (1 - w_i): the diagonal of the softmax Jacobian. Near 0 means
    // nudging the scores barely moves the weights, so little gradient flows.
    var sens = function (w) { return w.reduce(function (p, x) { return p + x * (1 - x); }, 0); };
    return {
      raw: raw, scaled: scaled, wU: wU, wS: wS,
      stdU: std(probeRaw), stdS: std(probeRaw) / Math.sqrt(dk),
      maxU: Math.max.apply(null, wU), maxS: Math.max.apply(null, wS),
      sensU: sens(wU), sensS: sens(wS)
    };
  }

  // Masked softmax over a score matrix. causal=true blocks j > i.
  function maskedAttention(S, causal) {
    return S.map(function (row, i) {
      return softmax(row.map(function (x, j) { return causal && j > i ? -Infinity : x; }));
    });
  }

  /* ---------- data ---------- */

  // Interactive A: toy 6-d vectors. Dims: animate, place, action, state,
  // function word, pronoun. Hand-made for illustration, not from a model.
  var SENT = ['The', 'animal', "didn't", 'cross', 'the', 'street', 'because', 'it', 'was', 'tired', '.'];
  var A_KEYS = [
    [0, 0, 0, 0, 1, 0], [1, 0, 0, 0, 0, 0], [0, 0, 0.6, 0, 0.5, 0], [0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 0], [0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0.8, 0], [0.3, 0.3, 0, 0, 0, 1],
    [0, 0, 0.5, 0, 0.5, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0.3, 0]
  ];
  var A_QUERIES = [
    [2, 0, 0, 0, 0, 0], [0, 0, 1.5, 1, 0, 0], [1.5, 0, 1.5, 0, 0, 0], [1.5, 1.5, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 0], [0, 0, 2, 0, 0, 0], [0, 0, 1, 1, 0.5, 0], [3, 0, 0, 0.8, 0, 0],
    [0, 0, 0, 1.5, 0, 1.5], [1.5, 0, 0, 0, 0, 1.5], [0, 0, 1, 0, 1, 0]
  ];
  // Variant: "...because it was wide." The adjective now describes a place,
  // so the query from "it" looks for place-like words instead.
  var A_WIDE_KEY = [0, 0.2, 0, 1, 0, 0];
  var A_WIDE_IT_QUERY = [0, 3, 0, 0.8, 0, 0];
  var A_WIDE_ADJ_QUERY = [0, 1.5, 0, 0, 0, 1.5];

  function sentenceWeights(qi, variant) {
    var keys = A_KEYS.slice();
    var q = A_QUERIES[qi];
    if (variant === 'wide') {
      keys[9] = A_WIDE_KEY;
      if (qi === 7) q = A_WIDE_IT_QUERY;
      if (qi === 9) q = A_WIDE_ADJ_QUERY;
    }
    // Scores are used as-is (these toy vectors are already small).
    return softmax(keys.map(function (k) { return dot(q, k); }));
  }

  // Interactive B: d_k = 2, three tokens.
  var B_TOKENS = ['the', 'cat', 'sat'];
  var B_KEYS = [[1, 0], [0.5, 1], [-1, 0.5]];
  var B_VALUES = [[3, 0.5], [1, 3], [0, 0]];
  // Label placement for the value points: [dx, dy, anchor].
  var B_VLABEL = [[-10, 20, 'end'], [10, 4, 'start'], [10, -10, 'start']];

  // Interactive D: illustrative head patterns over SENT.
  function patternRow(n, i, targets) {
    var row = new Array(n).fill(0), used = 0, free = 0;
    Object.keys(targets).forEach(function (k) { row[+k] += targets[k]; used += targets[k]; });
    for (var j = 0; j < n; j++) if (!(j in targets)) free++;
    for (var t = 0; t < n; t++) if (!(t in targets)) row[t] += (1 - used) / free;
    return row;
  }
  function headMatrix(fn) {
    return SENT.map(function (_, i) { return patternRow(SENT.length, i, fn(i)); });
  }
  var HEADS = [
    {
      name: 'Head 1: previous word',
      caption: 'Each word looks mostly at the word just before it. A cheap way to know local word order.',
      M: headMatrix(function (i) { var t = {}; if (i === 0) { t[0] = 0.85; } else { t[i - 1] = 0.75; t[i] = 0.15; } return t; })
    },
    {
      name: 'Head 2: "it" finds "animal"',
      caption: 'Only the pronoun has something to resolve: "it" sends most of its weight to "animal". Other words mostly look at themselves.',
      M: headMatrix(function (i) { var t = {}; if (i === 7) { t[1] = 0.7; t[7] = 0.1; } else { t[i] = 0.6; } return t; })
    },
    {
      name: 'Head 3: verb finds its subject',
      caption: '"didn\'t" and "cross" look at "animal"; "was" and "tired" look at "it". The head links each verb to who is doing it.',
      M: headMatrix(function (i) {
        var t = {};
        if (i === 2 || i === 3) t[1] = 0.7;
        else if (i === 8) t[7] = 0.7;
        else if (i === 9) { t[7] = 0.6; t[1] = 0.15; }
        else t[i] = 0.6;
        return t;
      })
    }
  ];

  // Interactive E: decoder input for "The cat sat down" and toy scores.
  var E_TOKENS = ['<start>', 'The', 'cat', 'sat', 'down'];
  var E_SCORES = [
    [1.0, 0.2, 0.1, 0.3, 0.0],
    [0.8, 1.2, 0.6, 0.2, 0.1],
    [0.3, 1.4, 1.0, 0.5, 0.2],
    [0.2, 0.6, 1.5, 0.9, 0.7],
    [0.1, 0.3, 0.9, 1.3, 1.0]
  ];

  /* ---------- DOM helpers ---------- */

  var SVGNS = 'http://www.w3.org/2000/svg';
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    setAttrs(n, attrs);
    append(n, kids);
    return n;
  }
  function s(tag, attrs, kids) {
    var n = document.createElementNS(SVGNS, tag);
    setAttrs(n, attrs);
    append(n, kids);
    return n;
  }
  function setAttrs(n, attrs) {
    if (!attrs) return;
    Object.keys(attrs).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.setAttribute('class', attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
  }
  function append(n, kids) {
    if (kids == null) return;
    (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
  }
  function pct(x) { return (x * 100).toFixed(x < 0.095 && x > 0 ? 1 : 0) + '%'; }
  function f2(x) { return (x < 0 ? '−' : '') + Math.abs(x).toFixed(2); }
  function bar(w, color) {
    return h('div', { class: 'tf-bar' }, [
      h('div', { class: 'tf-bar-fill ' + (color || 'blue'), style: 'width:' + (w * 100).toFixed(1) + '%' })
    ]);
  }
  function seg(options, current, onPick) {
    var wrap = h('div', { class: 'tf-seg', role: 'group' });
    options.forEach(function (o) {
      var b = h('button', { type: 'button', class: 'tf-seg-btn', 'aria-pressed': String(o.value === current), text: o.label });
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(wrap.children, function (c) { c.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        onPick(o.value);
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  /* ---------- A: who is "it" looking at? ---------- */

  function initWhoIsIt(root) {
    var state = { q: 7, variant: 'tired' };
    var chips = h('div', { class: 'tf-chips' });
    var list = h('div', { class: 'tf-wlist' });
    var note = h('p', { class: 'tf-status' });
    var toggle = seg([{ label: '...it was tired.', value: 'tired' }, { label: '...it was wide.', value: 'wide' }],
      state.variant, function (v) { state.variant = v; render(); });

    function words() {
      var w = SENT.slice();
      if (state.variant === 'wide') w[9] = 'wide';
      return w;
    }
    function render() {
      var ws = words();
      var w = sentenceWeights(state.q, state.variant);
      chips.innerHTML = '';
      ws.forEach(function (word, i) {
        var b = h('button', { type: 'button', class: 'tf-chip' + (i === state.q ? ' is-query' : ''), 'aria-pressed': String(i === state.q), text: word });
        b.style.setProperty('--w', w[i].toFixed(3));
        b.addEventListener('click', function () { state.q = i; render(); });
        chips.appendChild(b);
      });
      list.innerHTML = '';
      ws.forEach(function (word, i) {
        var row = h('div', { class: 'tf-wrow' + (i === state.q ? ' is-query' : '') }, [
          h('span', { class: 'tf-wlabel', text: word }),
          bar(w[i], 'blue'),
          h('span', { class: 'tf-wval', text: pct(w[i]) })
        ]);
        row.addEventListener('click', function () { state.q = i; render(); });
        list.appendChild(row);
      });
      var best = 0;
      w.forEach(function (x, i) { if (x > w[best]) best = i; });
      var sum = w.reduce(function (p, c) { return p + c; }, 0);
      note.textContent = 'Query "' + ws[state.q] + '" gives its largest weight to "' + ws[best] + '" (' + pct(w[best]) +
        '). The ' + ws.length + ' weights add up to ' + pct(sum) + '.';
    }
    append(root, [
      h('div', { class: 'tf-controls' }, [h('span', { class: 'tf-hint', text: 'Click a word to make it the query.' }), toggle]),
      chips, list, note
    ]);
    render();
  }

  /* ---------- B: drag the query ---------- */

  function initDragQuery(root) {
    var q = [-0.3, 1.3];
    var SZ = 240;
    // Left plane: queries and keys, range [-2, 2].
    var L = { min: -2, max: 2 };
    // Right plane: values and output, range [-0.6, 3.4].
    var R = { min: -0.6, max: 3.4 };
    function px(v, r) { return (v - r.min) / (r.max - r.min) * SZ; }
    function py(v, r) { return SZ - (v - r.min) / (r.max - r.min) * SZ; }

    function grid(r) {
      var g = s('g', { class: 'tf-grid' });
      for (var t = Math.ceil(r.min); t <= Math.floor(r.max); t++) {
        g.appendChild(s('line', { x1: px(t, r), y1: 0, x2: px(t, r), y2: SZ, class: t === 0 ? 'tf-axis' : '' }));
        g.appendChild(s('line', { x1: 0, y1: py(t, r), x2: SZ, y2: py(t, r), class: t === 0 ? 'tf-axis' : '' }));
      }
      return g;
    }
    function markers() {
      return s('defs', null, ['blue', 'orange'].map(function (c) {
        return s('marker', { id: 'tf-arrow-' + c, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' },
          s('path', { d: 'M0,0 L10,5 L0,10 z', class: 'tf-fill-' + c }));
      }));
    }

    var left = s('svg', { viewBox: '0 0 ' + SZ + ' ' + SZ, class: 'tf-plane tf-plane-drag', role: 'img', 'aria-label': 'Query and key vectors' });
    left.appendChild(markers());
    left.appendChild(grid(L));
    B_KEYS.forEach(function (k, i) {
      left.appendChild(s('line', { x1: px(0, L), y1: py(0, L), x2: px(k[0], L), y2: py(k[1], L), class: 'tf-vec tf-stroke-blue', 'marker-end': 'url(#tf-arrow-blue)' }));
      left.appendChild(s('text', { x: px(k[0], L) + (k[0] < 0 ? -6 : 6), y: py(k[1], L) - 6, class: 'tf-plabel tf-text-blue', 'text-anchor': k[0] < 0 ? 'end' : 'start', text: 'key: ' + B_TOKENS[i] }));
    });
    var qLine = s('line', { class: 'tf-vec tf-vec-q tf-stroke-orange', 'marker-end': 'url(#tf-arrow-orange)' });
    var qHandle = s('circle', { r: 8, class: 'tf-handle' });
    var qLabel = s('text', { class: 'tf-plabel tf-text-orange', text: 'query' });
    left.appendChild(qLine); left.appendChild(qHandle); left.appendChild(qLabel);

    var right = s('svg', { viewBox: '0 0 ' + SZ + ' ' + SZ, class: 'tf-plane', role: 'img', 'aria-label': 'Value vectors and the output' });
    right.appendChild(grid(R));
    right.appendChild(s('polygon', { points: B_VALUES.map(function (v) { return px(v[0], R) + ',' + py(v[1], R); }).join(' '), class: 'tf-hull' }));
    var spokes = B_VALUES.map(function () { var l = s('line', { class: 'tf-spoke' }); right.appendChild(l); return l; });
    var vDots = B_VALUES.map(function (v, i) {
      var c = s('circle', { cx: px(v[0], R), cy: py(v[1], R), class: 'tf-fill-aqua' });
      right.appendChild(c);
      var lb = B_VLABEL[i];
      right.appendChild(s('text', { x: px(v[0], R) + lb[0], y: py(v[1], R) + lb[1], 'text-anchor': lb[2], class: 'tf-plabel tf-text-aqua', text: 'value: ' + B_TOKENS[i] }));
      return c;
    });
    var outDot = s('circle', { r: 6, class: 'tf-outdot' });
    var outLabel = s('text', { class: 'tf-plabel tf-text-strong', text: 'output' });
    right.appendChild(outDot); right.appendChild(outLabel);

    var tbody = h('tbody');
    var table = h('table', { class: 'tf-live' }, [
      h('thead', null, h('tr', null, ['token', 'q·k', '÷ √2', 'weight'].map(function (t) { return h('th', { text: t }); }))),
      tbody
    ]);
    var outText = h('p', { class: 'tf-status' });

    function render() {
      var r = attendOne(q, B_KEYS, B_VALUES, 2);
      qLine.setAttribute('x1', px(0, L)); qLine.setAttribute('y1', py(0, L));
      qLine.setAttribute('x2', px(q[0], L)); qLine.setAttribute('y2', py(q[1], L));
      qHandle.setAttribute('cx', px(q[0], L)); qHandle.setAttribute('cy', py(q[1], L));
      var flip = q[0] > 0.6;
      qLabel.setAttribute('text-anchor', flip ? 'end' : 'start');
      qLabel.setAttribute('x', px(q[0], L) + (flip ? -11 : 11));
      qLabel.setAttribute('y', py(q[1], L) + (q[1] > 1.5 ? 20 : -12));
      var ox = px(r.out[0], R), oy = py(r.out[1], R);
      outDot.setAttribute('cx', ox); outDot.setAttribute('cy', oy);
      outLabel.setAttribute('x', ox + 9); outLabel.setAttribute('y', oy - 8);
      B_VALUES.forEach(function (v, i) {
        vDots[i].setAttribute('r', (3 + 9 * r.w[i]).toFixed(1));
        spokes[i].setAttribute('x1', ox); spokes[i].setAttribute('y1', oy);
        spokes[i].setAttribute('x2', px(v[0], R)); spokes[i].setAttribute('y2', py(v[1], R));
        spokes[i].style.strokeOpacity = (0.15 + 0.85 * r.w[i]).toFixed(2);
      });
      tbody.innerHTML = '';
      B_TOKENS.forEach(function (t, i) {
        tbody.appendChild(h('tr', null, [
          h('td', { text: t }), h('td', { text: f2(r.raw[i]) }), h('td', { text: f2(r.scaled[i]) }),
          h('td', { class: 'tf-wcell' }, [bar(r.w[i], 'blue'), h('span', { class: 'tf-wval', text: pct(r.w[i]) })])
        ]));
      });
      outText.textContent = 'query = [' + f2(q[0]) + ', ' + f2(q[1]) + ']   output = ' +
        r.w.map(function (w, i) { return w.toFixed(2) + '·[' + B_VALUES[i].join(', ') + ']'; }).join(' + ') +
        ' = [' + f2(r.out[0]) + ', ' + f2(r.out[1]) + ']';
    }

    function toPlane(ev) {
      var pt = left.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      var m = left.getScreenCTM();
      if (!m) return;
      var p = pt.matrixTransform(m.inverse());
      var x = L.min + p.x / SZ * (L.max - L.min);
      var y = L.min + (SZ - p.y) / SZ * (L.max - L.min);
      var len = Math.hypot(x, y), cap = 1.9;
      if (len > cap) { x *= cap / len; y *= cap / len; }
      q = [Math.round(x * 20) / 20, Math.round(y * 20) / 20];
      render();
    }
    var dragging = false;
    left.addEventListener('pointerdown', function (ev) {
      dragging = true;
      try { left.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      toPlane(ev);
      ev.preventDefault();
    });
    left.addEventListener('pointermove', function (ev) { if (dragging) toPlane(ev); });
    ['pointerup', 'pointercancel'].forEach(function (t) { left.addEventListener(t, function () { dragging = false; }); });

    append(root, [
      h('div', { class: 'tf-controls' }, h('span', { class: 'tf-hint', text: 'Drag the orange query arrow (or tap anywhere on the left plane).' })),
      h('div', { class: 'tf-two' }, [
        h('div', { class: 'tf-panel' }, [h('div', { class: 'tf-panel-title', text: 'Query and keys: compare' }), left]),
        h('div', { class: 'tf-panel' }, [h('div', { class: 'tf-panel-title', text: 'Values: blend by the weights' }), right])
      ]),
      table, outText
    ]);
    render();
  }

  /* ---------- C: why scale? ---------- */

  function initScaleDemo(root) {
    var exp = 6; // d_k = 2^6 = 64
    var label = h('strong', { class: 'tf-dk' });
    var slider = h('input', { type: 'range', min: 1, max: 9, step: 1, value: exp, 'aria-label': 'Key dimension d_k' });
    var cols = [
      { title: 'Without scaling: softmax(q·k)', key: 'U', color: 'orange' },
      { title: 'With scaling: softmax(q·k / √dₖ)', key: 'S', color: 'blue' }
    ].map(function (c) {
      c.list = h('div', { class: 'tf-wlist tf-wlist-compact' });
      c.stats = h('div', { class: 'tf-stats' });
      c.el = h('div', { class: 'tf-panel' }, [h('div', { class: 'tf-panel-title', text: c.title }), c.list, c.stats]);
      return c;
    });
    function render() {
      var dk = Math.pow(2, exp);
      label.textContent = 'dₖ = ' + dk;
      var r = scaleDemo(dk);
      cols.forEach(function (c) {
        var w = r['w' + c.key];
        c.list.innerHTML = '';
        w.forEach(function (x, i) {
          c.list.appendChild(h('div', { class: 'tf-wrow' }, [
            h('span', { class: 'tf-wlabel', text: 'key ' + (i + 1) }), bar(x, c.color), h('span', { class: 'tf-wval', text: pct(x) })
          ]));
        });
        c.stats.innerHTML = '';
        [['spread of scores (std)', r['std' + c.key].toFixed(1)],
         ['largest weight', pct(r['max' + c.key])],
         ['learning signal Σ w(1−w)', r['sens' + c.key].toFixed(2)]].forEach(function (p) {
          c.stats.appendChild(h('div', { class: 'tf-stat' }, [h('span', { text: p[0] }), h('b', { text: p[1] })]));
        });
      });
    }
    slider.addEventListener('input', function () { exp = +slider.value; render(); });
    append(root, [
      h('div', { class: 'tf-controls' }, [h('span', { class: 'tf-hint', text: 'Slide to change the vector size.' }), h('label', { class: 'tf-slider' }, [label, slider])]),
      h('div', { class: 'tf-two' }, cols.map(function (c) { return c.el; }))
    ]);
    render();
  }

  /* ---------- D: multi-head ---------- */

  function heatmap(tokens, M, opts) {
    opts = opts || {};
    var n = tokens.length, cell = opts.cell || 22, lw = opts.labels === false ? 0 : 60, th = opts.labels === false ? 0 : 56;
    var W = lw + n * cell, H = th + n * cell;
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'tf-heat', role: 'img', 'aria-label': opts.aria || 'Attention weights' });
    var rows = [];
    M.forEach(function (row, i) {
      var g = s('g', { class: 'tf-hrow', 'data-row': i });
      if (lw) g.appendChild(s('text', { x: lw - 6, y: th + i * cell + cell * 0.68, 'text-anchor': 'end', class: 'tf-hlabel', text: tokens[i] }));
      row.forEach(function (w, j) {
        var x = lw + j * cell, y = th + i * cell;
        g.appendChild(s('rect', { x: x + 0.5, y: y + 0.5, width: cell - 1, height: cell - 1, class: 'tf-hbg' }));
        var r = s('rect', { x: x + 0.5, y: y + 0.5, width: cell - 1, height: cell - 1, class: 'tf-hcell', 'data-col': j });
        r.style.fillOpacity = Math.min(1, w / 0.8).toFixed(3);
        g.appendChild(r);
      });
      svg.appendChild(g);
      rows.push(g);
    });
    if (th) tokens.forEach(function (t, j) {
      var x = lw + j * cell + cell * 0.62, y = th - 6;
      svg.appendChild(s('text', { x: x, y: y, transform: 'rotate(-55 ' + x + ' ' + y + ')', class: 'tf-hlabel', text: t }));
    });
    svg.tfRows = rows;
    return svg;
  }

  function initHeads(root) {
    var body = h('div', { class: 'tf-heads-body' });
    var tabs = HEADS.map(function (hd, i) { return { label: 'Head ' + (i + 1), value: i }; });
    tabs.push({ label: 'All heads', value: 'all' });

    function showHead(i) {
      var hd = HEADS[i];
      var status = h('p', { class: 'tf-status', text: 'Hover or tap a row to read it.' });
      var svg = heatmap(SENT, hd.M, { aria: hd.name });
      svg.tfRows.forEach(function (g, r) {
        var pick = function () {
          svg.tfRows.forEach(function (o) { o.classList.toggle('is-dim', o !== g); });
          var row = hd.M[r], best = 0;
          row.forEach(function (x, j) { if (x > row[best]) best = j; });
          status.textContent = 'Query "' + SENT[r] + '" puts ' + pct(row[best]) + ' on "' + SENT[best] + '".';
        };
        g.addEventListener('pointerenter', pick);
        g.addEventListener('click', pick);
      });
      svg.addEventListener('pointerleave', function () { svg.tfRows.forEach(function (o) { o.classList.remove('is-dim'); }); });
      append(body, [
        h('div', { class: 'tf-panel-title', text: hd.name }),
        h('div', { class: 'tf-axis-note', text: 'Rows: the word asking (query). Columns: the word being read (key). Darker = more weight.' }),
        svg, status, h('p', { class: 'tf-head-cap', text: hd.caption })
      ]);
    }
    function showAll() {
      var minis = h('div', { class: 'tf-minis' }, HEADS.map(function (hd, i) {
        return h('div', { class: 'tf-mini' }, [heatmap(SENT, hd.M, { labels: false, cell: 10, aria: hd.name }), h('div', { class: 'tf-mini-cap', text: 'head ' + (i + 1) })]);
      }));
      var segs = h('div', { class: 'tf-concat' });
      for (var k = 0; k < 8; k++) segs.appendChild(h('span', { class: 'tf-concat-seg' + (k < 3 ? ' c' + k : ''), text: String(k + 1) }));
      append(body, [
        h('div', { class: 'tf-panel-title', text: 'All heads: run in parallel, then concatenate and mix' }),
        minis,
        h('div', { class: 'tf-flow' }, [
          h('div', null, [h('span', { class: 'tf-flow-k', text: '8 heads × 64 numbers per word (heads 4 to 8 not drawn above)' }), segs]),
          h('div', { class: 'tf-flow-arrow', text: 'concatenate → 512 numbers → multiply by Wᴼ (512 × 512) → 512 numbers' })
        ]),
        h('p', { class: 'tf-head-cap', text: 'Each head writes its own 64-number summary for every word. Gluing the 8 summaries end to end gives 512 numbers again, and the learned matrix Wᴼ mixes them so the next layer gets one vector per word.' })
      ]);
    }
    function show(v) {
      body.innerHTML = '';
      if (v === 'all') showAll(); else showHead(v);
    }
    append(root, [
      h('div', { class: 'tf-controls' }, [h('span', { class: 'tf-hint', text: 'Pick a head.' }), seg(tabs, 0, show)]),
      body
    ]);
    show(0);
  }

  /* ---------- E: masking ---------- */

  function initMask(root) {
    var state = { causal: true, row: 2 };
    var grid = h('div', { class: 'tf-mgrid', style: 'grid-template-columns: minmax(0,1.3fr) repeat(' + E_TOKENS.length + ', minmax(0,1fr));' });
    var status = h('p', { class: 'tf-status' });
    function render() {
      var A = maskedAttention(E_SCORES, state.causal);
      grid.innerHTML = '';
      grid.appendChild(h('div', { class: 'tf-mcorner', text: 'query ↓  key →' }));
      E_TOKENS.forEach(function (t) { grid.appendChild(h('div', { class: 'tf-mhead', text: t })); });
      A.forEach(function (row, i) {
        var sel = i === state.row;
        var lab = h('button', { type: 'button', class: 'tf-mlabel' + (sel ? ' is-sel' : ''), text: E_TOKENS[i] });
        lab.addEventListener('click', function () { state.row = i; render(); });
        grid.appendChild(lab);
        row.forEach(function (w, j) {
          var blocked = state.causal && j > i;
          var c = h('button', { type: 'button', class: 'tf-mcell' + (blocked ? ' is-blocked' : '') + (sel ? ' is-sel' : ' is-other'), 'aria-label': E_TOKENS[i] + ' to ' + E_TOKENS[j] + (blocked ? ': blocked' : ': ' + pct(w)), text: blocked ? '×' : pct(w) });
          if (!blocked) c.style.setProperty('--w', w.toFixed(3));
          c.addEventListener('click', function () { state.row = i; render(); });
          grid.appendChild(c);
        });
      });
      var visible = E_TOKENS.filter(function (_, j) { return !(state.causal && j > state.row); });
      var sum = A[state.row].reduce(function (p, c) { return p + c; }, 0);
      status.textContent = '"' + E_TOKENS[state.row] + '" can see: ' + visible.join(', ') + '. Its weights still add up to ' + pct(sum) + '.';
    }
    var toggle = seg([
      { label: 'Encoder: everyone sees everyone', value: false },
      { label: 'Decoder: no peeking ahead', value: true }
    ], state.causal, function (v) { state.causal = v; render(); });
    append(root, [
      h('div', { class: 'tf-controls' }, [h('span', { class: 'tf-hint', text: 'Click a row; switch the mask.' }), toggle]),
      grid, status
    ]);
    render();
  }

  /* ---------- boot ---------- */

  var API = {
    dot: dot, softmax: softmax, attendOne: attendOne, makeRng: makeRng, scaleDemo: scaleDemo,
    maskedAttention: maskedAttention, sentenceWeights: sentenceWeights,
    SENT: SENT, B_KEYS: B_KEYS, B_VALUES: B_VALUES, HEADS: HEADS, E_SCORES: E_SCORES
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof document === 'undefined') return;

  function boot() {
    [['tf-attn-sentence', initWhoIsIt], ['tf-drag-query', initDragQuery], ['tf-scale-demo', initScaleDemo],
     ['tf-heads', initHeads], ['tf-mask', initMask]].forEach(function (p) {
      var el = document.getElementById(p[0]);
      if (el && !el.hasChildNodes()) p[1](el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
