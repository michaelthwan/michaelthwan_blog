/**
 * Sinkhorn-Knopp Interactive Visualizer
 * For: deepseek-mhc.md
 *
 * Shows a 3x3 editable matrix being projected onto the Birkhoff polytope
 * by alternating row-normalize and column-normalize steps.
 */

(function () {
  const N = 3;

  // Default initial values (non-negative, not yet doubly stochastic)
  const DEFAULT = [
    [4, 1, 2],
    [3, 3, 1],
    [1, 2, 5],
  ];

  let matrix = DEFAULT.map(row => [...row]);
  let originalValues = DEFAULT.map(row => [...row]);
  let step = 0; // even = about to do row, odd = about to do col
  let playing = false;
  let playTimer = null;

  // ── DOM references ──────────────────────────────────────────────────────────
  const container = document.getElementById('sinkhorn-interactive');
  if (!container) return;

  const gridArea = document.getElementById('sk-grid-area');
  const stepBtn = document.getElementById('sk-step-btn');
  const playBtn = document.getElementById('sk-play-btn');
  const resetBtn = document.getElementById('sk-reset-btn');
  const speedSlider = document.getElementById('sk-speed');
  const statusEl = document.getElementById('sk-status');
  const convBar = document.getElementById('sk-conv-bar');
  const convVal = document.getElementById('sk-conv-val');

  // ── Build matrix grid + row/col sum indicators ──────────────────────────────
  const inputs = []; // inputs[i][j]
  const rowSumEls = []; // rowSumEls[i]
  const colSumEls = []; // colSumEls[j]

  function buildGrid() {
    gridArea.innerHTML = '';

    // Wrapper for the matrix + row sums
    const matWrap = document.createElement('div');
    matWrap.style.cssText = 'display:inline-block';

    // Grid of inputs (NxN) + row sum column
    for (let i = 0; i < N; i++) {
      const rowDiv = document.createElement('div');
      rowDiv.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:6px';

      inputs[i] = [];
      for (let j = 0; j < N; j++) {
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.min = '0';
        inp.step = '0.01';
        inp.value = matrix[i][j].toFixed(3);
        inp.style.cssText =
          'width:66px;padding:6px 4px;text-align:center;border:1px solid #ccc;' +
          'border-radius:4px;font-size:0.9em;font-family:inherit;background:#fff;' +
          'transition:background 0.4s';
        inp.addEventListener('input', () => {
          const v = parseFloat(inp.value);
          if (!isNaN(v) && v >= 0) {
            matrix[i][j] = v;
            originalValues[i][j] = v;
            step = 0;
            updateSums();
            updateConvergence();
            setStatus('Matrix edited. Step counter reset.');
          }
        });
        inputs[i][j] = inp;
        rowDiv.appendChild(inp);
      }

      // Row sum indicator
      const rSum = document.createElement('span');
      rSum.style.cssText =
        'min-width:52px;font-size:0.82em;font-family:monospace;padding:2px 6px;' +
        'border-radius:3px;transition:background 0.4s,color 0.4s';
      rowSumEls[i] = rSum;
      rowDiv.appendChild(rSum);

      matWrap.appendChild(rowDiv);
    }

    // Column sum row
    const colRow = document.createElement('div');
    colRow.style.cssText = 'display:flex;gap:6px;margin-top:2px;padding-left:0';
    for (let j = 0; j < N; j++) {
      const cSum = document.createElement('span');
      cSum.style.cssText =
        'width:66px;text-align:center;font-size:0.82em;font-family:monospace;' +
        'padding:2px 4px;border-radius:3px;transition:background 0.4s,color 0.4s';
      colSumEls[j] = cSum;
      colRow.appendChild(cSum);
    }
    // spacer for the row-sum column
    const spacer = document.createElement('span');
    spacer.style.cssText = 'min-width:52px';
    colRow.appendChild(spacer);
    matWrap.appendChild(colRow);

    gridArea.appendChild(matWrap);

    // Legend panel beside the matrix
    const legend = document.createElement('div');
    legend.style.cssText =
      'font-size:0.82em;color:#666;line-height:1.7;padding-top:4px;min-width:160px';
    legend.innerHTML =
      '<div><span style="display:inline-block;width:12px;height:12px;background:#c8e6c9;border-radius:2px;vertical-align:middle;margin-right:5px"></span>sum ≈ 1 (converged)</div>' +
      '<div><span style="display:inline-block;width:12px;height:12px;background:#ffcdd2;border-radius:2px;vertical-align:middle;margin-right:5px"></span>sum ≠ 1 (not yet)</div>' +
      '<div style="margin-top:8px;color:#888"><em>Cell color intensity<br>shows value magnitude.</em></div>';
    gridArea.appendChild(legend);
  }

  // ── Sync inputs → matrix ────────────────────────────────────────────────────
  function readInputs() {
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const v = parseFloat(inputs[i][j].value);
        matrix[i][j] = isNaN(v) || v < 0 ? 0 : v;
      }
    }
  }

  // ── Update displayed values + heatmap colors ────────────────────────────────
  function updateInputs() {
    // Find max for heatmap scaling
    let maxVal = 0;
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++)
        if (matrix[i][j] > maxVal) maxVal = matrix[i][j];
    if (maxVal === 0) maxVal = 1;

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const v = matrix[i][j];
        inputs[i][j].value = v.toFixed(4);
        const intensity = Math.round((v / maxVal) * 180);
        const r = 255 - Math.round(intensity * 0.6);
        const g = 255 - Math.round(intensity * 0.3);
        const b = 255 - Math.round(intensity * 0);
        inputs[i][j].style.background = `rgb(${r},${g},${b + Math.round(intensity * 0.8)})`;
        inputs[i][j].style.color = intensity > 100 ? '#fff' : '#333';
      }
    }
  }

  // ── Update row/col sum indicators ──────────────────────────────────────────
  function updateSums() {
    for (let i = 0; i < N; i++) {
      let s = 0;
      for (let j = 0; j < N; j++) s += matrix[i][j];
      const ok = Math.abs(s - 1) < 0.005;
      rowSumEls[i].textContent = '= ' + s.toFixed(3);
      rowSumEls[i].style.background = ok ? '#c8e6c9' : '#ffcdd2';
      rowSumEls[i].style.color = ok ? '#1b5e20' : '#b71c1c';
    }
    for (let j = 0; j < N; j++) {
      let s = 0;
      for (let i = 0; i < N; i++) s += matrix[i][j];
      const ok = Math.abs(s - 1) < 0.005;
      colSumEls[j].textContent = s.toFixed(3);
      colSumEls[j].style.background = ok ? '#c8e6c9' : '#ffcdd2';
      colSumEls[j].style.color = ok ? '#1b5e20' : '#b71c1c';
    }
  }

  // ── Convergence bar ─────────────────────────────────────────────────────────
  function maxDeviation() {
    let maxDev = 0;
    for (let i = 0; i < N; i++) {
      let rs = 0; for (let j = 0; j < N; j++) rs += matrix[i][j];
      maxDev = Math.max(maxDev, Math.abs(rs - 1));
    }
    for (let j = 0; j < N; j++) {
      let cs = 0; for (let i = 0; i < N; i++) cs += matrix[i][j];
      maxDev = Math.max(maxDev, Math.abs(cs - 1));
    }
    return maxDev;
  }

  function updateConvergence() {
    const dev = maxDeviation();
    // Scale bar: dev=2 → 100%, dev=0 → 0%
    const pct = Math.min(100, (dev / 2) * 100);
    convBar.style.width = pct + '%';
    convBar.style.background = dev < 0.005 ? '#27ae60' : '#1565c0';
    convVal.textContent = dev.toFixed(4);
  }

  // ── Row normalize ───────────────────────────────────────────────────────────
  function rowNormalize() {
    for (let i = 0; i < N; i++) {
      let s = 0; for (let j = 0; j < N; j++) s += matrix[i][j];
      if (s > 1e-10) for (let j = 0; j < N; j++) matrix[i][j] /= s;
    }
  }

  // ── Col normalize ───────────────────────────────────────────────────────────
  function colNormalize() {
    for (let j = 0; j < N; j++) {
      let s = 0; for (let i = 0; i < N; i++) s += matrix[i][j];
      if (s > 1e-10) for (let i = 0; i < N; i++) matrix[i][j] /= s;
    }
  }

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function isConverged() {
    return maxDeviation() < 0.001;
  }

  // ── Single step ─────────────────────────────────────────────────────────────
  function doStep() {
    readInputs();
    if (isConverged()) {
      setStatus('Converged! All row and column sums equal 1. W ∈ 𝓑ₙ.');
      stopPlay();
      return;
    }
    if (step % 2 === 0) {
      rowNormalize();
      setStatus(`Step ${Math.floor(step / 2) + 1}a: Row normalize — each row now sums to 1.`);
    } else {
      colNormalize();
      setStatus(`Step ${Math.floor(step / 2) + 1}b: Column normalize — each column now sums to 1.`);
    }
    step++;
    updateInputs();
    updateSums();
    updateConvergence();
    if (isConverged()) {
      setStatus('Converged! All row and column sums equal 1. W ∈ 𝓑ₙ.');
      stopPlay();
    }
  }

  // ── Play / Stop ──────────────────────────────────────────────────────────────
  function startPlay() {
    if (playing) return;
    if (isConverged()) { setStatus('Already converged. Reset to start again.'); return; }
    playing = true;
    playBtn.textContent = 'Stop';
    function tick() {
      doStep();
      if (!playing) return;
      const delay = parseInt(speedSlider.value, 10);
      playTimer = setTimeout(tick, delay);
    }
    tick();
  }

  function stopPlay() {
    playing = false;
    clearTimeout(playTimer);
    playBtn.textContent = 'Play';
  }

  // ── Reset ────────────────────────────────────────────────────────────────────
  function reset() {
    stopPlay();
    matrix = originalValues.map(row => [...row]);
    step = 0;
    updateInputs();
    updateSums();
    updateConvergence();
    setStatus('Reset to original values.');
  }

  // ── Event listeners ──────────────────────────────────────────────────────────
  stepBtn.addEventListener('click', () => { stopPlay(); doStep(); });
  playBtn.addEventListener('click', () => { playing ? stopPlay() : startPlay(); });
  resetBtn.addEventListener('click', reset);

  // ── Initialize ────────────────────────────────────────────────────────────────
  buildGrid();
  updateInputs();
  updateSums();
  updateConvergence();
  setStatus('Edit any cell, then press Step or Play.');
})();
