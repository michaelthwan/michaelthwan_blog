/**
 * Distill-style Blog JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    initTOCHighlighting();
    initPositionalEncodingViz();
    initNormDistributionViz();
    initTilingInteractive();
    initFlashAlgorithmInteractive();
});

/* ============================================
   CANVAS UTILITIES
   ============================================ */

/**
 * Clear canvas with a background color and draw L-shaped axes
 */
function clearAndDrawAxes(ctx, width, height, padding, opts = {}) {
    const { bgColor = '#fafafa', axisColor = '#ccc' } = opts;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
}

/**
 * Draw evenly spaced labels along the X axis
 */
function drawXLabels(ctx, labels, positions, y, opts = {}) {
    const { color = '#999', font = '11px Inter, sans-serif', align = 'center' } = opts;
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align;
    labels.forEach((label, i) => {
        ctx.fillText(label, positions[i], y);
    });
}

/* ============================================
   TABLE OF CONTENTS - Active Section Highlighting
   ============================================ */

function initTOCHighlighting() {
    const tocLinks = document.querySelectorAll('.d-toc-list a');
    const sections = document.querySelectorAll('section[id]');

    if (!tocLinks.length || !sections.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                tocLinks.forEach(link => link.classList.remove('active'));

                const id = entry.target.getAttribute('id');
                const activeLink = document.querySelector(`.d-toc-list a[href="#${id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }, {
        root: null,
        rootMargin: '-100px 0px -70% 0px',
        threshold: 0
    });

    sections.forEach(section => observer.observe(section));
}

/* ============================================
   POSITIONAL ENCODING VISUALIZATION
   ============================================ */

const PE_CONFIG = {
    numPositions: 30,
    numDimensions: 32,
    dModel: 64,
    sampleDims: [0, 1, 2, 3, 14, 15, 30, 31],
    xLabelStep: 8
};

function initPositionalEncodingViz() {
    const container = document.getElementById('pos-encoding-interactive');
    if (!container) return;

    let selectedPosition = 0;

    container.innerHTML = `
        <div class="pe-controls">
            <div class="pe-slider-group">
                <label for="pe-position-slider">Position: <span id="pe-position-value">0</span></label>
                <input type="range" id="pe-position-slider" min="0" max="${PE_CONFIG.numPositions - 1}" value="0">
            </div>
            <div class="pe-info">
                <span class="pe-info-item"><span class="pe-dot pe-sin"></span> sin (even dims)</span>
                <span class="pe-info-item"><span class="pe-dot pe-cos"></span> cos (odd dims)</span>
            </div>
        </div>
        <div class="pe-main">
            <div class="pe-grid-container">
                <div class="pe-grid-label">All Positions</div>
                <div class="pe-grid" id="pe-grid"></div>
                <div class="pe-grid-axes">
                    <span>Position →</span>
                    <span>Dimension →</span>
                </div>
            </div>
            <div class="pe-wave-container">
                <div class="pe-wave-label">Encoding at position <span id="pe-wave-pos">0</span></div>
                <canvas id="pe-wave-canvas" width="400" height="150"></canvas>
                <div class="pe-wave-axes">
                    <span>Dimension index →</span>
                </div>
            </div>
        </div>
        <div class="pe-values" id="pe-values"></div>
    `;

    const grid = document.getElementById('pe-grid');
    const slider = document.getElementById('pe-position-slider');
    const positionLabel = document.getElementById('pe-position-value');
    const waveLabel = document.getElementById('pe-wave-pos');
    const canvas = document.getElementById('pe-wave-canvas');
    const valuesContainer = document.getElementById('pe-values');

    // Build the grid
    grid.style.gridTemplateColumns = `repeat(${PE_CONFIG.numDimensions}, 1fr)`;

    const cells = [];
    for (let pos = 0; pos < PE_CONFIG.numPositions; pos++) {
        const row = [];
        for (let dim = 0; dim < PE_CONFIG.numDimensions; dim++) {
            const cell = document.createElement('div');
            cell.className = 'pe-cell';
            cell.dataset.pos = pos;
            cell.dataset.dim = dim;

            const value = computePE(pos, dim, PE_CONFIG.dModel);
            cell.style.backgroundColor = valueToColor((value + 1) / 2);
            cell.title = `pos=${pos}, dim=${dim}\nvalue=${value.toFixed(4)}`;

            cell.addEventListener('click', () => {
                slider.value = pos;
                updateSelection(pos);
            });

            grid.appendChild(cell);
            row.push(cell);
        }
        cells.push(row);
    }

    slider.addEventListener('input', (e) => {
        updateSelection(parseInt(e.target.value));
    });

    function updateSelection(pos) {
        selectedPosition = pos;
        positionLabel.textContent = pos;
        waveLabel.textContent = pos;

        cells.forEach((row, rowIdx) => {
            row.forEach(cell => {
                cell.classList.toggle('pe-cell-selected', rowIdx === pos);
            });
        });

        drawWaveChart(canvas, pos);
        showValues(valuesContainer, pos);
    }

    updateSelection(0);
}

function computePE(pos, dim, dModel) {
    const i = Math.floor(dim / 2);
    const wavelength = Math.pow(10000, (2 * i) / dModel);
    return dim % 2 === 0 ? Math.sin(pos / wavelength) : Math.cos(pos / wavelength);
}

function drawWaveChart(canvas, pos) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    clearAndDrawAxes(ctx, width, height, padding);

    // Draw zero line
    const zeroY = padding.top + chartHeight / 2;
    ctx.strokeStyle = '#ddd';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, zeroY);
    ctx.lineTo(width - padding.right, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Y-axis labels
    ctx.fillStyle = '#999';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('+1', padding.left - 5, padding.top + 4);
    ctx.fillText('0', padding.left - 5, zeroY + 3);
    ctx.fillText('-1', padding.left - 5, height - padding.bottom);

    // Compute values and draw bars
    const barWidth = chartWidth / PE_CONFIG.numDimensions;

    for (let dim = 0; dim < PE_CONFIG.numDimensions; dim++) {
        const val = computePE(pos, dim, PE_CONFIG.dModel);
        const x = padding.left + dim * barWidth;
        const barHeight = (val / 2) * chartHeight;

        ctx.fillStyle = dim % 2 === 0 ? '#e07b39' : '#4a90a4';

        if (val >= 0) {
            ctx.fillRect(x + 1, zeroY - barHeight, barWidth - 2, barHeight);
        } else {
            ctx.fillRect(x + 1, zeroY, barWidth - 2, -barHeight);
        }
    }

    // X-axis labels
    const labels = [];
    const positions = [];
    for (let i = 0; i < PE_CONFIG.numDimensions; i += PE_CONFIG.xLabelStep) {
        labels.push(i.toString());
        positions.push(padding.left + i * barWidth + barWidth / 2);
    }
    drawXLabels(ctx, labels, positions, height - padding.bottom + 15, { font: '10px Inter, sans-serif' });
}

function showValues(container, pos) {
    const samples = PE_CONFIG.sampleDims.filter(d => d < PE_CONFIG.numDimensions);

    let html = '<div class="pe-values-grid">';
    samples.forEach(dim => {
        const val = computePE(pos, dim, PE_CONFIG.dModel);
        const type = dim % 2 === 0 ? 'sin' : 'cos';
        const typeClass = dim % 2 === 0 ? 'pe-val-sin' : 'pe-val-cos';
        html += `
            <div class="pe-value-item ${typeClass}">
                <span class="pe-value-label">dim ${dim} (${type})</span>
                <span class="pe-value-num">${val.toFixed(4)}</span>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Map value [0, 1] to diverging color scale (Blue -> White -> Orange)
 */
function valueToColor(value) {
    const blue = { r: 66, g: 133, b: 244 };
    const white = { r: 255, g: 255, b: 255 };
    const orange = { r: 234, g: 88, b: 12 };

    let from, to, t;
    if (value < 0.5) {
        from = blue; to = white; t = value * 2;
    } else {
        from = white; to = orange; t = (value - 0.5) * 2;
    }

    const r = Math.round(from.r + (to.r - from.r) * t);
    const g = Math.round(from.g + (to.g - from.g) * t);
    const b = Math.round(from.b + (to.b - from.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
}

/* ============================================
   NORM DISTRIBUTION VISUALIZATION
   ============================================ */

const NORM_CONFIG = {
    numSamples: 500,
    outlierRatio: 0.025,
    normalMean: 50, normalStd: 20,
    outlierMean: 180, outlierStd: 30,
    binWidth: 10,
    maxNorm: 300,
    defaultThreshold: 150,
    xLabelStep: 50
};

function initNormDistributionViz() {
    const container = document.getElementById('norm-distribution-interactive');
    if (!container) return;

    const data = generateBimodalNormData();
    let threshold = NORM_CONFIG.defaultThreshold;

    container.innerHTML = `
        <div class="norm-controls">
            <div class="norm-slider-group">
                <label>Outlier threshold:</label>
                <input type="range" id="norm-threshold-slider" min="50" max="250" value="${threshold}">
                <span class="norm-threshold-value" id="norm-threshold-display">${threshold}</span>
            </div>
            <div class="norm-stats">
                <div class="norm-stat">
                    <span class="dot normal"></span>
                    <span>Normal: <strong id="normal-count">0</strong> (<span id="normal-pct">0</span>%)</span>
                </div>
                <div class="norm-stat">
                    <span class="dot outlier"></span>
                    <span>Outliers: <strong id="outlier-count">0</strong> (<span id="outlier-pct">0</span>%)</span>
                </div>
            </div>
        </div>
        <div class="norm-chart-container">
            <canvas id="norm-chart-canvas" width="600" height="200"></canvas>
        </div>
    `;

    const slider = document.getElementById('norm-threshold-slider');
    const thresholdDisplay = document.getElementById('norm-threshold-display');
    const canvas = document.getElementById('norm-chart-canvas');
    const normalCountEl = document.getElementById('normal-count');
    const outlierCountEl = document.getElementById('outlier-count');
    const normalPctEl = document.getElementById('normal-pct');
    const outlierPctEl = document.getElementById('outlier-pct');

    slider.addEventListener('input', (e) => {
        threshold = parseInt(e.target.value);
        thresholdDisplay.textContent = threshold;
        drawChart();
    });

    function drawChart() {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        clearAndDrawAxes(ctx, width, height, padding, { bgColor: '#fff' });

        // Create histogram bins
        const numBins = NORM_CONFIG.maxNorm / NORM_CONFIG.binWidth;
        const bins = new Array(numBins).fill(0);

        data.forEach(norm => {
            const binIndex = Math.min(Math.floor(norm / NORM_CONFIG.binWidth), numBins - 1);
            bins[binIndex]++;
        });

        const maxBinCount = Math.max(...bins);

        // Draw threshold line
        const thresholdX = padding.left + (threshold / NORM_CONFIG.maxNorm) * chartWidth;
        ctx.strokeStyle = '#c62828';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(thresholdX, padding.top);
        ctx.lineTo(thresholdX, height - padding.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw threshold label
        ctx.fillStyle = '#c62828';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`threshold = ${threshold}`, thresholdX, padding.top - 5);

        // Draw bars
        const barWidth = chartWidth / numBins;
        let normalCount = 0;
        let outlierCount = 0;

        bins.forEach((count, i) => {
            const binStart = i * NORM_CONFIG.binWidth;
            const x = padding.left + i * barWidth;
            const barHeight = (count / maxBinCount) * chartHeight;
            const y = height - padding.bottom - barHeight;

            const isOutlier = binStart >= threshold;
            ctx.fillStyle = isOutlier ? '#ef5350' : '#66bb6a';
            ctx.fillRect(x + 1, y, barWidth - 2, barHeight);

            if (isOutlier) outlierCount += count;
            else normalCount += count;
        });

        // Update stats
        const total = normalCount + outlierCount;
        normalCountEl.textContent = normalCount;
        outlierCountEl.textContent = outlierCount;
        normalPctEl.textContent = ((normalCount / total) * 100).toFixed(1);
        outlierPctEl.textContent = ((outlierCount / total) * 100).toFixed(1);

        // X-axis labels
        const labels = [];
        const positions = [];
        for (let i = 0; i <= NORM_CONFIG.maxNorm; i += NORM_CONFIG.xLabelStep) {
            labels.push(i.toString());
            positions.push(padding.left + (i / NORM_CONFIG.maxNorm) * chartWidth);
        }
        drawXLabels(ctx, labels, positions, height - padding.bottom + 15);

        // X-axis title
        ctx.fillStyle = '#666';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Token Norm', padding.left + chartWidth / 2, height - 5);

        // Y-axis title
        ctx.save();
        ctx.translate(15, padding.top + chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Count', 0, 0);
        ctx.restore();
    }

    drawChart();
}

function generateBimodalNormData() {
    const data = [];
    for (let i = 0; i < NORM_CONFIG.numSamples; i++) {
        if (Math.random() < NORM_CONFIG.outlierRatio) {
            data.push(gaussianRandom(NORM_CONFIG.outlierMean, NORM_CONFIG.outlierStd));
        } else {
            data.push(gaussianRandom(NORM_CONFIG.normalMean, NORM_CONFIG.normalStd));
        }
    }
    return data.map(v => Math.max(0, Math.min(NORM_CONFIG.maxNorm, v)));
}

function gaussianRandom(mean, std) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
}

/* ============================================
   FLASHATTENTION - TILING INTERACTIVE
   ============================================ */

const TILING_CONFIG = {
    matrixSize: 16,
    blockSize: 4,
    maxSteps: 20,
    playSpeed: 300,
    descriptions: [
        'Start: Both methods need to compute the N×N attention matrix.',
        'Standard attention computes and stores the entire matrix in HBM...',
        'Each cell computed is written to slow HBM memory.',
        'The full matrix grows quadratically with sequence length.',
        'FlashAttention processes one block at a time in fast SRAM.',
        'Only the current block needs to fit in SRAM.',
        'Previous blocks are processed and discarded from SRAM.',
        'Output is accumulated incrementally using online softmax.',
        'Memory usage stays constant regardless of sequence length!',
        'Standard attention: O(N²) memory. FlashAttention: O(block size).'
    ]
};

function initTilingInteractive() {
    const container = document.getElementById('tiling-interactive');
    if (!container) return;

    let currentStep = 0;
    let isPlaying = false;
    let playInterval = null;

    container.innerHTML = `
        <div class="tiling-controls">
            <div class="tiling-slider-group">
                <label>Step:</label>
                <input type="range" id="tiling-step-slider" min="0" max="${TILING_CONFIG.maxSteps}" value="0">
                <span class="tiling-step-label" id="tiling-step-label">Start</span>
            </div>
            <button id="tiling-play-btn" class="tiling-play-btn">▶ Play</button>
        </div>
        <div class="tiling-comparison">
            <div class="tiling-panel">
                <div class="tiling-panel-title standard">Standard Attention</div>
                <div class="matrix-viz" id="standard-matrix"></div>
                <div class="tiling-stats" id="standard-stats"></div>
            </div>
            <div class="tiling-panel">
                <div class="tiling-panel-title flash">FlashAttention</div>
                <div class="matrix-viz" id="flash-matrix"></div>
                <div class="tiling-stats" id="flash-stats"></div>
            </div>
        </div>
        <div class="tiling-description" id="tiling-desc"></div>
    `;

    const slider = document.getElementById('tiling-step-slider');
    const stepLabel = document.getElementById('tiling-step-label');
    const playBtn = document.getElementById('tiling-play-btn');
    const standardMatrix = document.getElementById('standard-matrix');
    const flashMatrix = document.getElementById('flash-matrix');
    const standardStats = document.getElementById('standard-stats');
    const flashStats = document.getElementById('flash-stats');
    const descEl = document.getElementById('tiling-desc');

    function createMatrixGrid(container, size) {
        container.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'matrix-grid';
        grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement('div');
            cell.className = 'matrix-cell empty';
            cell.dataset.index = i;
            grid.appendChild(cell);
        }
        container.appendChild(grid);
        return grid;
    }

    const standardGrid = createMatrixGrid(standardMatrix, TILING_CONFIG.matrixSize);
    const flashGrid = createMatrixGrid(flashMatrix, TILING_CONFIG.matrixSize);

    function updateVisualization(step) {
        const cells = TILING_CONFIG.matrixSize * TILING_CONFIG.matrixSize;
        const progress = step / TILING_CONFIG.maxSteps;

        // Standard attention: fills entire matrix, keeps it all in HBM
        const standardCells = standardGrid.querySelectorAll('.matrix-cell');
        const standardFilled = Math.floor(progress * cells);

        standardCells.forEach((cell, i) => {
            if (i < standardFilled) {
                cell.className = 'matrix-cell in-hbm';
            } else if (i === standardFilled && step > 0) {
                cell.className = 'matrix-cell current';
            } else {
                cell.className = 'matrix-cell empty';
            }
        });

        // FlashAttention: processes in blocks, only current block in SRAM
        const flashCells = flashGrid.querySelectorAll('.matrix-cell');
        const blocksPerRow = TILING_CONFIG.matrixSize / TILING_CONFIG.blockSize;
        const totalBlocks = blocksPerRow * blocksPerRow;
        const currentBlock = Math.floor(progress * totalBlocks);

        flashCells.forEach((cell, i) => {
            const row = Math.floor(i / TILING_CONFIG.matrixSize);
            const col = i % TILING_CONFIG.matrixSize;
            const blockRow = Math.floor(row / TILING_CONFIG.blockSize);
            const blockCol = Math.floor(col / TILING_CONFIG.blockSize);
            const blockIndex = blockRow * blocksPerRow + blockCol;

            if (blockIndex < currentBlock) {
                cell.className = 'matrix-cell computed';
            } else if (blockIndex === currentBlock && step > 0) {
                cell.className = 'matrix-cell in-sram';
            } else {
                cell.className = 'matrix-cell empty';
            }
        });

        // Update stats
        const hbmUsedStandard = standardFilled > 0 ? `${standardFilled} cells` : '0';
        const hbmUsedFlash = currentBlock > 0 ? `${TILING_CONFIG.blockSize * TILING_CONFIG.blockSize} cells` : '0';

        standardStats.innerHTML = `HBM usage: <span class="bad">${hbmUsedStandard}</span> (grows with N²)`;
        flashStats.innerHTML = `SRAM usage: <span class="good">${hbmUsedFlash}</span> (constant block size)`;

        // Update description
        const descIndex = Math.min(Math.floor(step / 2), TILING_CONFIG.descriptions.length - 1);
        descEl.textContent = TILING_CONFIG.descriptions[descIndex];

        // Update label
        if (step === 0) stepLabel.textContent = 'Start';
        else if (step === TILING_CONFIG.maxSteps) stepLabel.textContent = 'Done';
        else stepLabel.textContent = `Step ${step}`;
    }

    slider.addEventListener('input', (e) => {
        currentStep = parseInt(e.target.value);
        updateVisualization(currentStep);
    });

    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            clearInterval(playInterval);
            playBtn.textContent = '▶ Play';
            isPlaying = false;
        } else {
            if (currentStep >= TILING_CONFIG.maxSteps) {
                currentStep = 0;
                slider.value = 0;
            }
            isPlaying = true;
            playBtn.textContent = '⏸ Pause';
            playInterval = setInterval(() => {
                currentStep++;
                slider.value = currentStep;
                updateVisualization(currentStep);
                if (currentStep >= TILING_CONFIG.maxSteps) {
                    clearInterval(playInterval);
                    playBtn.textContent = '▶ Play';
                    isPlaying = false;
                }
            }, TILING_CONFIG.playSpeed);
        }
    });

    updateVisualization(0);
}

/* ============================================
   FLASHATTENTION ALGORITHM INTERACTIVE
   ============================================ */

const FLASH_ALGO_CONFIG = {
    numBlocks: 4,
    maxSteps: 80,
    playSpeed: 400,
    phasesPerIter: 5,
    phases: ['load_kv', 'load_q', 'compute', 'compute2', 'write_o']
};

function initFlashAlgorithmInteractive() {
    const container = document.getElementById('flash-algorithm-interactive');
    if (!container) return;

    let step = 0;
    let isPlaying = false;
    let playInterval = null;

    container.innerHTML = `
        <div class="flash-algo-controls">
            <button id="flash-algo-play" class="flash-algo-btn">▶ Play</button>
            <button id="flash-algo-step" class="flash-algo-btn">Step</button>
            <button id="flash-algo-reset" class="flash-algo-btn">Reset</button>
            <span class="flash-algo-status" id="flash-algo-status">Ready</span>
        </div>
        <div class="flash-algo-layout">
            <div class="flash-algo-hbm">
                <div class="flash-algo-hbm-label">HBM (Slow)</div>
                <div class="flash-algo-matrices">
                    <div class="flash-algo-matrix-wrap">
                        <div class="flash-algo-matrix-label">Q</div>
                        <div class="flash-algo-matrix q-matrix" id="q-matrix"></div>
                    </div>
                    <div class="flash-algo-matrix-wrap">
                        <div class="flash-algo-matrix-label">K<sup>T</sup></div>
                        <div class="flash-algo-matrix k-matrix" id="k-matrix"></div>
                    </div>
                    <div class="flash-algo-matrix-wrap">
                        <div class="flash-algo-matrix-label">V</div>
                        <div class="flash-algo-matrix v-matrix" id="v-matrix"></div>
                    </div>
                    <div class="flash-algo-matrix-wrap">
                        <div class="flash-algo-matrix-label">Output</div>
                        <div class="flash-algo-matrix o-matrix" id="o-matrix"></div>
                    </div>
                </div>
            </div>
            <div class="flash-algo-transfer" id="flash-algo-transfer"></div>
            <div class="flash-algo-sram">
                <div class="flash-algo-sram-label">SRAM (Fast)</div>
                <div class="flash-algo-sram-content" id="sram-content">
                    <div class="sram-empty">Empty</div>
                </div>
                <div class="flash-algo-compute" id="compute-area"></div>
            </div>
        </div>
        <div class="flash-algo-loops">
            <div class="flash-algo-loop outer-loop">
                <span class="loop-label">Outer loop (j):</span>
                <span class="loop-value" id="outer-loop-val">—</span>
                <span class="loop-desc">K, V blocks</span>
            </div>
            <div class="flash-algo-loop inner-loop">
                <span class="loop-label">Inner loop (i):</span>
                <span class="loop-value" id="inner-loop-val">—</span>
                <span class="loop-desc">Q blocks</span>
            </div>
        </div>
    `;

    const qMatrix = document.getElementById('q-matrix');
    const kMatrix = document.getElementById('k-matrix');
    const vMatrix = document.getElementById('v-matrix');
    const oMatrix = document.getElementById('o-matrix');
    const sramContent = document.getElementById('sram-content');
    const computeArea = document.getElementById('compute-area');
    const transferArea = document.getElementById('flash-algo-transfer');
    const statusEl = document.getElementById('flash-algo-status');
    const outerLoopVal = document.getElementById('outer-loop-val');
    const innerLoopVal = document.getElementById('inner-loop-val');

    function buildMatrix(container, id, isVertical) {
        container.innerHTML = '';
        for (let i = 0; i < FLASH_ALGO_CONFIG.numBlocks; i++) {
            const block = document.createElement('div');
            block.className = 'flash-algo-block';
            block.dataset.index = i;
            block.dataset.matrix = id;
            container.appendChild(block);
        }
        container.style.flexDirection = isVertical ? 'column' : 'row';
    }

    buildMatrix(qMatrix, 'q', true);
    buildMatrix(kMatrix, 'k', false);
    buildMatrix(vMatrix, 'v', true);
    buildMatrix(oMatrix, 'o', true);

    const playBtn = document.getElementById('flash-algo-play');
    const stepBtn = document.getElementById('flash-algo-step');
    const resetBtn = document.getElementById('flash-algo-reset');

    function getPhaseForStep(s) {
        if (s === 0) return { phase: 'idle', outer: -1, inner: -1 };

        const iterStep = s - 1;
        const iteration = Math.floor(iterStep / FLASH_ALGO_CONFIG.phasesPerIter);
        const phaseInIter = iterStep % FLASH_ALGO_CONFIG.phasesPerIter;

        const outer = Math.floor(iteration / FLASH_ALGO_CONFIG.numBlocks);
        const inner = iteration % FLASH_ALGO_CONFIG.numBlocks;

        if (outer >= FLASH_ALGO_CONFIG.numBlocks) {
            return { phase: 'done', outer: FLASH_ALGO_CONFIG.numBlocks - 1, inner: FLASH_ALGO_CONFIG.numBlocks - 1 };
        }

        return { phase: FLASH_ALGO_CONFIG.phases[phaseInIter], outer, inner };
    }

    function updateVisualization(s) {
        const state = getPhaseForStep(s);

        // Reset all blocks
        document.querySelectorAll('.flash-algo-block').forEach(b => {
            b.classList.remove('active', 'in-sram', 'computed', 'loading');
        });

        // Update loop indicators
        outerLoopVal.textContent = state.outer >= 0 ? `j = ${state.outer}` : '—';
        innerLoopVal.textContent = state.inner >= 0 ? `i = ${state.inner}` : '—';

        if (state.phase === 'idle') {
            statusEl.textContent = 'Ready - Press Play';
            sramContent.innerHTML = '<div class="sram-empty">Empty</div>';
            computeArea.innerHTML = '';
            transferArea.innerHTML = '';
        } else if (state.phase === 'done') {
            statusEl.textContent = 'Complete!';
            oMatrix.querySelectorAll('.flash-algo-block').forEach(b => b.classList.add('computed'));
            sramContent.innerHTML = '<div class="sram-empty">Empty</div>';
            computeArea.innerHTML = '<div class="compute-done">✓ All blocks processed</div>';
            transferArea.innerHTML = '';
        } else {
            const kBlock = kMatrix.querySelector(`[data-index="${state.outer}"]`);
            const vBlock = vMatrix.querySelector(`[data-index="${state.outer}"]`);
            const qBlock = qMatrix.querySelector(`[data-index="${state.inner}"]`);

            // Mark completed output blocks
            for (let o = 0; o < state.outer; o++) {
                oMatrix.querySelectorAll('.flash-algo-block').forEach(b => b.classList.add('computed'));
            }
            for (let i = 0; i < state.inner; i++) {
                const oBlock = oMatrix.querySelector(`[data-index="${i}"]`);
                if (oBlock) oBlock.classList.add('computed');
            }

            if (state.phase === 'load_kv') {
                statusEl.textContent = `Loading K[${state.outer}], V[${state.outer}] to SRAM`;
                if (kBlock) kBlock.classList.add('loading');
                if (vBlock) vBlock.classList.add('loading');
                transferArea.innerHTML = '<div class="transfer-arrow down">↓ K, V</div>';
                sramContent.innerHTML = `
                    <div class="sram-block loading">K<sub>${state.outer}</sub></div>
                    <div class="sram-block loading">V<sub>${state.outer}</sub></div>
                `;
                computeArea.innerHTML = '';
            } else if (state.phase === 'load_q') {
                statusEl.textContent = `Loading Q[${state.inner}] to SRAM`;
                if (kBlock) kBlock.classList.add('in-sram');
                if (vBlock) vBlock.classList.add('in-sram');
                if (qBlock) qBlock.classList.add('loading');
                transferArea.innerHTML = '<div class="transfer-arrow down">↓ Q</div>';
                sramContent.innerHTML = `
                    <div class="sram-block active">K<sub>${state.outer}</sub></div>
                    <div class="sram-block active">V<sub>${state.outer}</sub></div>
                    <div class="sram-block loading">Q<sub>${state.inner}</sub></div>
                `;
                computeArea.innerHTML = '';
            } else if (state.phase === 'compute' || state.phase === 'compute2') {
                statusEl.textContent = `Computing S = Q[${state.inner}]·K[${state.outer}]ᵀ, then softmax·V`;
                if (kBlock) kBlock.classList.add('in-sram');
                if (vBlock) vBlock.classList.add('in-sram');
                if (qBlock) qBlock.classList.add('in-sram');
                transferArea.innerHTML = '';
                sramContent.innerHTML = `
                    <div class="sram-block active">K<sub>${state.outer}</sub></div>
                    <div class="sram-block active">V<sub>${state.outer}</sub></div>
                    <div class="sram-block active">Q<sub>${state.inner}</sub></div>
                `;
                computeArea.innerHTML = `
                    <div class="compute-op ${state.phase === 'compute2' ? 'step2' : ''}">
                        <span class="compute-formula">S<sub>${state.inner}${state.outer}</sub> = Q<sub>${state.inner}</sub>·K<sub>${state.outer}</sub><sup>T</sup></span>
                        <span class="compute-arrow">→</span>
                        <span class="compute-formula">O<sub>${state.inner}</sub> += softmax(S)·V<sub>${state.outer}</sub></span>
                    </div>
                `;
            } else if (state.phase === 'write_o') {
                statusEl.textContent = `Writing O[${state.inner}] to HBM`;
                if (kBlock) kBlock.classList.add('in-sram');
                if (vBlock) vBlock.classList.add('in-sram');
                const oBlock = oMatrix.querySelector(`[data-index="${state.inner}"]`);
                if (oBlock) oBlock.classList.add('loading');
                transferArea.innerHTML = '<div class="transfer-arrow up">↑ O</div>';
                sramContent.innerHTML = `
                    <div class="sram-block active">K<sub>${state.outer}</sub></div>
                    <div class="sram-block active">V<sub>${state.outer}</sub></div>
                    <div class="sram-block fading">O<sub>${state.inner}</sub></div>
                `;
                computeArea.innerHTML = '<div class="compute-op done">✓ Block complete</div>';
            }
        }
    }

    function advanceStep() {
        step++;
        if (step > FLASH_ALGO_CONFIG.maxSteps) {
            step = FLASH_ALGO_CONFIG.maxSteps;
            stopPlaying();
        }
        updateVisualization(step);
    }

    function stopPlaying() {
        if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
        }
        isPlaying = false;
        playBtn.textContent = '▶ Play';
    }

    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            stopPlaying();
        } else {
            if (step >= FLASH_ALGO_CONFIG.maxSteps) step = 0;
            isPlaying = true;
            playBtn.textContent = '⏸ Pause';
            playInterval = setInterval(advanceStep, FLASH_ALGO_CONFIG.playSpeed);
        }
    });

    stepBtn.addEventListener('click', () => {
        stopPlaying();
        advanceStep();
    });

    resetBtn.addEventListener('click', () => {
        stopPlaying();
        step = 0;
        updateVisualization(0);
    });

    updateVisualization(0);
}
