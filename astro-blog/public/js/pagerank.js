/**
 * PageRank Interactive — live directed-graph explorer.
 * Click a node to select it, then click another to toggle a directed edge.
 * PageRank is recomputed (power iteration, 200 steps) after every change.
 */
(function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────── */
  const NS    = 'http://www.w3.org/2000/svg';
  const N     = 5;
  const LABELS = ['A', 'B', 'C', 'D', 'E'];

  // Fixed node centres in the 480 × 300 SVG viewBox
  const POS = [
    [240, 150],  // A  centre
    [395, 72],   // B  top-right
    [395, 228],  // C  bottom-right
    [85,  72],   // D  top-left
    [85,  228],  // E  bottom-left
  ];

  // Preset edge lists  [from, to]
  const PRESETS = {
    default:    [[1,0],[3,0],[2,0],[4,0],[0,1],[2,1]],
    spidertrap: [[0,1],[1,0],[2,3],[3,2],[4,0],[4,2]],
    dangling:   [[1,0],[3,0],[2,0],[4,0],[1,2]],   // node 0: no outgoing links
    hub:        [[1,0],[2,0],[3,0],[4,0],[0,2]],
  };

  /* ── state ─────────────────────────────────────────────── */
  let edgeSet  = new Set();   // "from,to" strings
  let beta     = 0.85;
  let selected = null;        // currently selected node index
  let pr       = Array(N).fill(1 / N);

  /* ── PageRank engine ────────────────────────────────────── */
  function computePR() {
    const outDeg  = Array(N).fill(0);
    const inLinks = Array.from({ length: N }, () => []);

    for (const key of edgeSet) {
      const [f, t] = key.split(',').map(Number);
      outDeg[f]++;
      inLinks[t].push(f);
    }

    let r = Array(N).fill(1 / N);

    for (let iter = 0; iter < 200; iter++) {
      // Rank leaked by dangling nodes (no outgoing links)
      let dang = 0;
      for (let i = 0; i < N; i++) if (outDeg[i] === 0) dang += r[i];

      const rNew = Array(N).fill(0);
      for (let j = 0; j < N; j++) {
        let sum = 0;
        for (const i of inLinks[j]) sum += r[i] / outDeg[i];
        rNew[j] = beta * sum + beta * (dang / N) + (1 - beta) / N;
      }

      // Renormalize to exactly 1.0
      const total = rNew.reduce((a, b) => a + b, 0);
      for (let j = 0; j < N; j++) rNew[j] /= total;

      const diff = r.reduce((s, v, i) => s + Math.abs(v - rNew[i]), 0);
      r = rNew;
      if (diff < 1e-12) break;
    }
    return r;
  }

  // Per-node colours for the convergence line chart
  const NODE_COLORS = ['#1a1a1a', '#1565c0', '#2e7d32', '#e65100', '#6a1b9a'];

  /* ── convergence history ────────────────────────────────── */
  function computeConvergence() {
    const STEPS   = 25;
    const outDeg  = Array(N).fill(0);
    const inLinks = Array.from({ length: N }, () => []);

    for (const key of edgeSet) {
      const [f, t] = key.split(',').map(Number);
      outDeg[f]++;
      inLinks[t].push(f);
    }

    const history = [];
    let r = Array(N).fill(1 / N);
    history.push([...r]);

    for (let step = 1; step < STEPS; step++) {
      let dang = 0;
      for (let i = 0; i < N; i++) if (outDeg[i] === 0) dang += r[i];

      const rNew = Array(N).fill(0);
      for (let j = 0; j < N; j++) {
        let sum = 0;
        for (const i of inLinks[j]) sum += r[i] / outDeg[i];
        rNew[j] = beta * sum + beta * (dang / N) + (1 - beta) / N;
      }
      const total = rNew.reduce((a, b) => a + b, 0);
      for (let j = 0; j < N; j++) rNew[j] /= total;
      r = rNew;
      history.push([...r]);
    }
    return history;
  }

  /* ── radius / colour helpers ────────────────────────────── */
  function getRadius(i) {
    const minPR = Math.min(...pr);
    const maxPR = Math.max(...pr);
    const span  = maxPR - minPR || 1e-9;
    return 18 + ((pr[i] - minPR) / span) * 20;   // 18 – 38 px
  }

  function getNodeFill(i) {
    const minPR = Math.min(...pr);
    const maxPR = Math.max(...pr);
    const span  = maxPR - minPR || 1e-9;
    const t     = (pr[i] - minPR) / span;
    const l     = Math.round(170 - t * 140);       // #aaa → #222
    return `rgb(${l},${l},${l})`;
  }

  /* ── SVG helpers ─────────────────────────────────────────── */
  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }

  /* ── convergence chart ──────────────────────────────────── */
  let convSvgEl;

  function renderConvergence() {
    if (!convSvgEl) return;
    while (convSvgEl.firstChild) convSvgEl.removeChild(convSvgEl.firstChild);

    const history = computeConvergence();
    const STEPS   = history.length;          // 25
    const Y_MAX   = 0.60;
    // chart area inside 460×130 viewBox
    const ML = 34, MR = 36, MT = 14, MB = 20;
    const CW = 460 - ML - MR;
    const CH = 130 - MT - MB;

    const xOf = s => ML + (s / (STEPS - 1)) * CW;
    const yOf = v => MT + CH - Math.min(v, Y_MAX) / Y_MAX * CH;

    // Grid lines + y-axis labels
    [0, 0.2, 0.4, 0.6].forEach(v => {
      const y = yOf(v);
      convSvgEl.appendChild(el('line', {
        x1: ML, y1: y, x2: ML + CW, y2: y,
        stroke: '#eee', 'stroke-width': '1',
      }));
      const t = el('text', {
        x: ML - 4, y: y + 4,
        'font-family': 'Inter,system-ui,sans-serif', 'font-size': '9',
        fill: '#bbb', 'text-anchor': 'end',
      });
      t.textContent = v.toFixed(1);
      convSvgEl.appendChild(t);
    });

    // X-axis ticks + labels
    [0, 6, 12, 18, 24].forEach(s => {
      const x = xOf(s);
      convSvgEl.appendChild(el('line', {
        x1: x, y1: MT + CH, x2: x, y2: MT + CH + 3,
        stroke: '#ccc', 'stroke-width': '1',
      }));
      const t = el('text', {
        x, y: MT + CH + 12,
        'font-family': 'Inter,system-ui,sans-serif', 'font-size': '9',
        fill: '#bbb', 'text-anchor': 'middle',
      });
      t.textContent = String(s);
      convSvgEl.appendChild(t);
    });

    // Lines: one per node
    for (let j = 0; j < N; j++) {
      const pts = history.map((h, s) => `${xOf(s).toFixed(1)},${yOf(h[j]).toFixed(1)}`).join(' ');
      convSvgEl.appendChild(el('polyline', {
        points: pts, fill: 'none',
        stroke: NODE_COLORS[j], 'stroke-width': '1.6',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      }));

      // Node label at right end
      const finalY = yOf(history[STEPS - 1][j]);
      const lbl = el('text', {
        x: ML + CW + 4, y: finalY + 4,
        'font-family': 'Inter,system-ui,sans-serif', 'font-size': '10',
        'font-weight': '700', fill: NODE_COLORS[j],
      });
      lbl.textContent = LABELS[j];
      convSvgEl.appendChild(lbl);
    }

    // Axis border
    convSvgEl.appendChild(el('line', {
      x1: ML, y1: MT, x2: ML, y2: MT + CH,
      stroke: '#ddd', 'stroke-width': '1',
    }));
    convSvgEl.appendChild(el('line', {
      x1: ML, y1: MT + CH, x2: ML + CW, y2: MT + CH,
      stroke: '#ddd', 'stroke-width': '1',
    }));
  }

  /* ── render ─────────────────────────────────────────────── */
  let svgEl, tableEl;

  function render() {
    /* clear SVG */
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

    /* ── defs: arrowhead marker ── */
    const defs   = el('defs', {});
    const marker = el('marker', {
      id: 'pr-arrow', markerWidth: '10', markerHeight: '10',
      refX: '10', refY: '5', orient: 'auto',
      markerUnits: 'userSpaceOnUse',
    });
    marker.appendChild(el('polygon', { points: '0,0 0,10 10,5', fill: '#999' }));
    defs.appendChild(marker);
    svgEl.appendChild(defs);

    /* ── edges ── */
    const radii = Array.from({ length: N }, (_, i) => getRadius(i));

    for (const key of edgeSet) {
      const [f, t] = key.split(',').map(Number);
      const [fx, fy] = POS[f];
      const [tx, ty] = POS[t];
      const dx = tx - fx, dy = ty - fy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / dist, uy = dy / dist;

      // Start at source circle boundary; end before target circle boundary
      // (leave 10 px gap so arrowhead tip is flush with the circle edge)
      const x1 = fx + ux * (radii[f] + 2);
      const y1 = fy + uy * (radii[f] + 2);
      const x2 = tx - ux * (radii[t] + 10);
      const y2 = ty - uy * (radii[t] + 10);

      svgEl.appendChild(el('line', {
        x1, y1, x2, y2,
        stroke: '#bbb', 'stroke-width': '1.8',
        'marker-end': 'url(#pr-arrow)',
      }));
    }

    /* ── nodes ── */
    for (let i = 0; i < N; i++) {
      const [cx, cy] = POS[i];
      const r        = radii[i];
      const isSelected = selected === i;

      // Selection ring (carries data-node so clicks on the ring also register)
      if (isSelected) {
        svgEl.appendChild(el('circle', {
          cx, cy, r: r + 5,
          fill: 'none', stroke: '#1565c0', 'stroke-width': '2',
          'stroke-dasharray': '4 2',
          style: 'cursor:pointer',
          'data-node': i,
        }));
      }

      // Node circle
      const circle = el('circle', {
        cx, cy, r,
        fill: isSelected ? '#1565c0' : getNodeFill(i),
        style: 'cursor:pointer',
        'data-node': i,
      });
      svgEl.appendChild(circle);

      // Label
      const fontSize = r > 24 ? 14 : 12;
      const label = el('text', {
        x: cx, y: cy + fontSize * 0.38,
        fill: 'white',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-size': fontSize, 'font-weight': '700',
        'text-anchor': 'middle',
        style: 'pointer-events:none; user-select:none',
      });
      label.textContent = LABELS[i];
      svgEl.appendChild(label);
    }

    /* ── PR table ── */
    tableEl.innerHTML = '';
    const sorted = Array.from({ length: N }, (_, i) => i)
      .sort((a, b) => pr[b] - pr[a]);
    for (const i of sorted) {
      const tr = tableEl.insertRow();
      tr.insertCell().textContent = LABELS[i];
      const bar  = tr.insertCell();
      const val  = tr.insertCell();
      const pct  = (pr[i] * 100).toFixed(1) + '%';
      const w    = Math.round(pr[i] * N * 100);    // scale: 20% = 100%
      bar.innerHTML = `<div class="pr-bar" style="width:${Math.min(w,100)}%"></div>`;
      val.textContent = (pr[i]).toFixed(4);
      val.className   = 'pr-val';
    }

    renderConvergence();
  }

  /* ── interaction ─────────────────────────────────────────── */
  function handleNodeClick(i) {
    if (selected === null) {
      selected = i;
    } else if (selected === i) {
      selected = null;
    } else {
      // Toggle directed edge: selected → i
      const key = `${selected},${i}`;
      if (edgeSet.has(key)) edgeSet.delete(key);
      else                   edgeSet.add(key);
      selected = null;
      pr = computePR();
    }
    render();
  }

  function loadPreset(name) {
    edgeSet.clear();
    selected = null;
    for (const [f, t] of PRESETS[name]) edgeSet.add(`${f},${t}`);
    pr = computePR();
    render();
  }

  /* ── CSS ─────────────────────────────────────────────────── */
  const CSS = `
.pr-wrap {
  font-family: Inter, system-ui, sans-serif;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 18px 20px 16px;
  margin: 2em 0;
  background: #fafafa;
}
.pr-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.pr-preset-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pr-preset {
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 20px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all .15s;
}
.pr-preset:hover { border-color: #888; }
.pr-preset.active {
  background: #333;
  border-color: #333;
  color: white;
}
.pr-beta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #555;
  margin-left: auto;
}
.pr-beta-row input[type=range] { width: 110px; accent-color: #333; }
.pr-main {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  flex-wrap: wrap;
}
#pr-svg {
  width: 100%;
  max-width: 480px;
  flex: 1 1 280px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
}
.pr-side {
  flex: 0 0 160px;
  min-width: 140px;
}
.pr-hint {
  font-size: 11px;
  color: #888;
  margin: 0 0 10px;
  line-height: 1.4;
}
.pr-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.pr-table th {
  font-weight: 600;
  font-size: 11px;
  color: #888;
  text-align: left;
  padding-bottom: 4px;
  border-bottom: 1px solid #eee;
}
.pr-table td {
  padding: 4px 4px 4px 0;
  vertical-align: middle;
}
.pr-table td:first-child {
  font-weight: 700;
  width: 20px;
}
.pr-bar {
  height: 8px;
  background: #333;
  border-radius: 2px;
  transition: width .3s ease;
  min-width: 2px;
}
.pr-val { padding-left: 8px; color: #555; font-variant-numeric: tabular-nums; }
.pr-conv-section {
  margin-top: 16px;
  border-top: 1px solid #e8e8e8;
  padding-top: 10px;
}
.pr-conv-title {
  font-size: 11px;
  font-weight: 600;
  color: #aaa;
  margin: 0 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
#pr-conv-svg { width: 100%; display: block; }
`;

  /* ── bootstrap ───────────────────────────────────────────── */
  function init() {
    const mount = document.getElementById('pr-interactive');
    if (!mount) return;

    // Inject CSS
    const styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    // Build DOM
    mount.innerHTML = `
<div class="pr-wrap">
  <div class="pr-controls">
    <div class="pr-preset-group">
      <button class="pr-preset active" data-preset="default">Default</button>
      <button class="pr-preset" data-preset="spidertrap">Spider Trap</button>
      <button class="pr-preset" data-preset="dangling">Dangling Node</button>
      <button class="pr-preset" data-preset="hub">Hub &amp; Spoke</button>
    </div>
    <div class="pr-beta-row">
      <span>β =&nbsp;<strong id="pr-beta-lbl">0.85</strong></span>
      <input id="pr-beta-range" type="range" min="0.50" max="0.95" step="0.05" value="0.85">
    </div>
  </div>
  <div class="pr-main">
    <svg id="pr-svg" viewBox="0 0 480 300"></svg>
    <div class="pr-side">
      <p class="pr-hint">Select a node, then click another to toggle a directed link between them.</p>
      <table class="pr-table">
        <thead><tr><th>Node</th><th>Score</th><th></th></tr></thead>
        <tbody id="pr-tbody"></tbody>
      </table>
    </div>
  </div>
  <div class="pr-conv-section">
    <p class="pr-conv-title">Convergence over iterations</p>
    <svg id="pr-conv-svg" viewBox="0 0 460 130"></svg>
  </div>
</div>`;

    svgEl    = document.getElementById('pr-svg');
    tableEl  = document.getElementById('pr-tbody');
    convSvgEl = document.getElementById('pr-conv-svg');

    // SVG click delegation
    svgEl.addEventListener('click', e => {
      const nd = e.target.closest('[data-node]');
      if (nd) {
        handleNodeClick(Number(nd.dataset.node));
      } else {
        // Click on background → deselect
        if (selected !== null) { selected = null; render(); }
      }
    });

    // Preset buttons
    mount.querySelectorAll('.pr-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        mount.querySelectorAll('.pr-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadPreset(btn.dataset.preset);
      });
    });

    // Beta slider
    const betaRange = document.getElementById('pr-beta-range');
    const betaLbl   = document.getElementById('pr-beta-lbl');
    betaRange.addEventListener('input', () => {
      beta = parseFloat(betaRange.value);
      betaLbl.textContent = beta.toFixed(2);
      pr = computePR();
      render();
    });

    // Load default
    loadPreset('default');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
