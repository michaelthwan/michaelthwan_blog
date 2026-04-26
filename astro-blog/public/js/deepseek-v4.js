(function () {
  const container = document.getElementById('v4-attention-explorer');
  if (!container) return;

  const CONTEXT_OPTIONS = [32000, 128000, 512000, 1000000];
  const CSA_M_OPTIONS = [8, 16, 32, 64];
  const HCA_M_OPTIONS = [64, 128, 256, 512];
  const TOPK_OPTIONS = [8, 16, 32, 64];
  const WINDOW_OPTIONS = [128, 256, 512, 1024, 2048];

  const state = {
    mode: 'csa',
    contextIndex: 2,
    csaMIndex: 2,
    hcaMIndex: 1,
    topKIndex: 1,
    windowIndex: 2,
  };

  container.innerHTML = `
    <div class="v4-explorer-shell">
      <div class="v4-explorer-header">
        <div>
          <div class="v4-explorer-title">CSA vs HCA Explorer</div>
          <p class="v4-explorer-subtitle">
            Approximate the compression trade DeepSeek-V4 makes at long context. This is an intuition builder, not the paper's exact kernel-level cost model.
          </p>
        </div>
        <div class="v4-mode-toggle" role="tablist" aria-label="Attention mode">
          <button class="v4-mode-btn active" data-mode="csa" type="button">CSA</button>
          <button class="v4-mode-btn" data-mode="hca" type="button">HCA</button>
        </div>
      </div>

      <div class="v4-control-grid">
        <div class="v4-control">
          <label for="v4-context-slider">Context length</label>
          <input id="v4-context-slider" type="range" min="0" max="${CONTEXT_OPTIONS.length - 1}" step="1" value="${state.contextIndex}">
          <div class="v4-control-value" id="v4-context-value"></div>
        </div>

        <div class="v4-control v4-control-csa">
          <label for="v4-csa-m-slider">CSA compression group size <code>m</code></label>
          <input id="v4-csa-m-slider" type="range" min="0" max="${CSA_M_OPTIONS.length - 1}" step="1" value="${state.csaMIndex}">
          <div class="v4-control-value" id="v4-csa-m-value"></div>
        </div>

        <div class="v4-control v4-control-hca v4-hidden">
          <label for="v4-hca-m-slider">HCA compression group size <code>m'</code></label>
          <input id="v4-hca-m-slider" type="range" min="0" max="${HCA_M_OPTIONS.length - 1}" step="1" value="${state.hcaMIndex}">
          <div class="v4-control-value" id="v4-hca-m-value"></div>
        </div>

        <div class="v4-control v4-control-csa">
          <label for="v4-topk-slider">CSA selected compressed entries <code>k</code></label>
          <input id="v4-topk-slider" type="range" min="0" max="${TOPK_OPTIONS.length - 1}" step="1" value="${state.topKIndex}">
          <div class="v4-control-value" id="v4-topk-value"></div>
        </div>

        <div class="v4-control">
          <label for="v4-window-slider">Local sliding window</label>
          <input id="v4-window-slider" type="range" min="0" max="${WINDOW_OPTIONS.length - 1}" step="1" value="${state.windowIndex}">
          <div class="v4-control-value" id="v4-window-value"></div>
        </div>
      </div>

      <div class="v4-explorer-copy" id="v4-mode-copy"></div>

      <div class="v4-stat-grid">
        <div class="v4-stat-card">
          <div class="v4-stat-label">Dense KV entries</div>
          <div class="v4-stat-value" id="v4-dense-value"></div>
        </div>
        <div class="v4-stat-card">
          <div class="v4-stat-label">Stored long-range entries</div>
          <div class="v4-stat-value" id="v4-compressed-value"></div>
        </div>
        <div class="v4-stat-card">
          <div class="v4-stat-label">Entries touched per query</div>
          <div class="v4-stat-value" id="v4-attended-value"></div>
        </div>
        <div class="v4-stat-card">
          <div class="v4-stat-label">Approx. query savings vs dense</div>
          <div class="v4-stat-value" id="v4-savings-value"></div>
        </div>
      </div>

      <div class="v4-bars">
        <div class="v4-bar-block">
          <div class="v4-bar-header">
            <span>Dense baseline</span>
            <span id="v4-dense-note"></span>
          </div>
          <div class="v4-bar-track v4-bar-track-dense" id="v4-dense-bar"></div>
        </div>

        <div class="v4-bar-block">
          <div class="v4-bar-header">
            <span>Compressed long-range memory</span>
            <span id="v4-compressed-note"></span>
          </div>
          <div class="v4-bar-track" id="v4-compressed-bar"></div>
        </div>

        <div class="v4-bar-block">
          <div class="v4-bar-header">
            <span>Per-query attention fan-out</span>
            <span id="v4-attended-note"></span>
          </div>
          <div class="v4-bar-track" id="v4-attended-bar"></div>
          <div class="v4-bar-legend">
            <span><i class="v4-legend-swatch v4-legend-window"></i> local window</span>
            <span><i class="v4-legend-swatch v4-legend-global"></i> compressed global memory</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const refs = {
    modeButtons: Array.from(container.querySelectorAll('.v4-mode-btn')),
    contextSlider: document.getElementById('v4-context-slider'),
    csaMSlider: document.getElementById('v4-csa-m-slider'),
    hcaMSlider: document.getElementById('v4-hca-m-slider'),
    topKSlider: document.getElementById('v4-topk-slider'),
    windowSlider: document.getElementById('v4-window-slider'),
    csaControls: Array.from(container.querySelectorAll('.v4-control-csa')),
    hcaControls: Array.from(container.querySelectorAll('.v4-control-hca')),
    modeCopy: document.getElementById('v4-mode-copy'),
    contextValue: document.getElementById('v4-context-value'),
    csaMValue: document.getElementById('v4-csa-m-value'),
    hcaMValue: document.getElementById('v4-hca-m-value'),
    topKValue: document.getElementById('v4-topk-value'),
    windowValue: document.getElementById('v4-window-value'),
    denseValue: document.getElementById('v4-dense-value'),
    compressedValue: document.getElementById('v4-compressed-value'),
    attendedValue: document.getElementById('v4-attended-value'),
    savingsValue: document.getElementById('v4-savings-value'),
    denseNote: document.getElementById('v4-dense-note'),
    compressedNote: document.getElementById('v4-compressed-note'),
    attendedNote: document.getElementById('v4-attended-note'),
    denseBar: document.getElementById('v4-dense-bar'),
    compressedBar: document.getElementById('v4-compressed-bar'),
    attendedBar: document.getElementById('v4-attended-bar'),
  };

  function fmtNumber(value) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
    return `${value}`;
  }

  function pct(value) {
    return `${(value * 100).toFixed(1)}%`;
  }

  function renderCells(track, totalCells, activeCells, splitAt) {
    track.innerHTML = '';
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'v4-bar-cell';
      if (i < activeCells) {
        if (splitAt != null && i < splitAt) {
          cell.classList.add('window');
        } else {
          cell.classList.add('global');
        }
      }
      track.appendChild(cell);
    }
  }

  function updateModeVisibility() {
    const isCSA = state.mode === 'csa';
    refs.csaControls.forEach((el) => el.classList.toggle('v4-hidden', !isCSA));
    refs.hcaControls.forEach((el) => el.classList.toggle('v4-hidden', isCSA));
    refs.modeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === state.mode));

    refs.modeCopy.innerHTML = isCSA
      ? `<strong>CSA:</strong> compress the KV cache, use an indexer to pick a small set of relevant compressed entries, then combine that with a local sliding window.`
      : `<strong>HCA:</strong> compress much more aggressively, keep the global memory extremely small, and attend over that coarse memory plus the local sliding window.`;
  }

  function update() {
    updateModeVisibility();

    const context = CONTEXT_OPTIONS[state.contextIndex];
    const windowSize = WINDOW_OPTIONS[state.windowIndex];
    const denseEntries = context;

    refs.contextValue.textContent = fmtNumber(context);
    refs.csaMValue.textContent = `${CSA_M_OPTIONS[state.csaMIndex]} tokens -> 1 entry`;
    refs.hcaMValue.textContent = `${HCA_M_OPTIONS[state.hcaMIndex]} tokens -> 1 entry`;
    refs.topKValue.textContent = `${TOPK_OPTIONS[state.topKIndex]} compressed entries`;
    refs.windowValue.textContent = `${fmtNumber(windowSize)} raw tokens`;

    let compressedEntries;
    let attendedEntries;
    let attendedGlobal;
    let localWindowShare = windowSize / denseEntries;

    if (state.mode === 'csa') {
      const m = CSA_M_OPTIONS[state.csaMIndex];
      const topK = TOPK_OPTIONS[state.topKIndex];
      compressedEntries = Math.ceil(context / m);
      attendedGlobal = Math.min(compressedEntries, topK);
      attendedEntries = attendedGlobal + windowSize;
    } else {
      const mPrime = HCA_M_OPTIONS[state.hcaMIndex];
      compressedEntries = Math.ceil(context / mPrime);
      attendedGlobal = compressedEntries;
      attendedEntries = attendedGlobal + windowSize;
    }

    const storedRatio = compressedEntries / denseEntries;
    const attendedRatio = Math.min(1, attendedEntries / denseEntries);
    const savingsRatio = Math.max(0, 1 - attendedEntries / denseEntries);

    refs.denseValue.textContent = fmtNumber(denseEntries);
    refs.compressedValue.textContent = fmtNumber(compressedEntries);
    refs.attendedValue.textContent = fmtNumber(attendedEntries);
    refs.savingsValue.textContent = pct(savingsRatio);

    refs.denseNote.textContent = `${fmtNumber(denseEntries)} raw entries`;
    refs.compressedNote.textContent = `${pct(storedRatio)} of dense storage`;
    refs.attendedNote.textContent = `${pct(attendedRatio)} of dense fan-out`;

    renderCells(refs.denseBar, 48, 48, null);

    const compressedCells = Math.max(1, Math.round(storedRatio * 48));
    renderCells(refs.compressedBar, 48, compressedCells, 0);

    const totalAttendedCells = Math.max(1, Math.round(attendedRatio * 48));
    const windowCells = Math.min(totalAttendedCells, Math.max(1, Math.round(localWindowShare * 48)));
    renderCells(refs.attendedBar, 48, totalAttendedCells, windowCells);
  }

  refs.modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode;
      update();
    });
  });

  refs.contextSlider.addEventListener('input', (e) => {
    state.contextIndex = parseInt(e.target.value, 10);
    update();
  });

  refs.csaMSlider.addEventListener('input', (e) => {
    state.csaMIndex = parseInt(e.target.value, 10);
    update();
  });

  refs.hcaMSlider.addEventListener('input', (e) => {
    state.hcaMIndex = parseInt(e.target.value, 10);
    update();
  });

  refs.topKSlider.addEventListener('input', (e) => {
    state.topKIndex = parseInt(e.target.value, 10);
    update();
  });

  refs.windowSlider.addEventListener('input', (e) => {
    state.windowIndex = parseInt(e.target.value, 10);
    update();
  });

  update();
})();
