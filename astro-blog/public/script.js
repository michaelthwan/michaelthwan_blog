/**
 * Distill-style Blog JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    initTOCHighlighting();
    initPositionalEncodingViz();
    initNormDistributionViz();
    initTilingInteractive();
    initFlashAlgorithmInteractive();
    initCompStaticCharts();
    initCompTierExplorer();
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

/* ============================================
   COMPENSATION DATA (generated by scripts/generate_comp_data.py)
   ============================================ */

const COMP_DATA = {"tiers":{"1":{"name":"Traditional / Local Tech","color":"#78909c"},"2":{"name":"Competitive Tech","color":"#e07b39"},"3":{"name":"Big Tech + Top Startups + Quant","color":"#5a9f68"}},"levels":["Entry","Mid","Senior","Staff"],"binWidth":12500,"usHistogram":[{"lo":50000,"hi":62500,"t1":3,"t2":0,"t3":0},{"lo":62500,"hi":75000,"t1":24,"t2":0,"t3":0},{"lo":75000,"hi":87500,"t1":34,"t2":0,"t3":0},{"lo":87500,"hi":100000,"t1":50,"t2":1,"t3":0},{"lo":100000,"hi":112500,"t1":46,"t2":4,"t3":0},{"lo":112500,"hi":125000,"t1":47,"t2":6,"t3":0},{"lo":125000,"hi":137500,"t1":38,"t2":11,"t3":1},{"lo":137500,"hi":150000,"t1":33,"t2":30,"t3":1},{"lo":150000,"hi":162500,"t1":16,"t2":12,"t3":3},{"lo":162500,"hi":175000,"t1":28,"t2":26,"t3":5},{"lo":175000,"hi":187500,"t1":11,"t2":21,"t3":10},{"lo":187500,"hi":200000,"t1":9,"t2":22,"t3":20},{"lo":200000,"hi":212500,"t1":7,"t2":23,"t3":9},{"lo":212500,"hi":225000,"t1":3,"t2":21,"t3":16},{"lo":225000,"hi":237500,"t1":0,"t2":22,"t3":18},{"lo":237500,"hi":250000,"t1":0,"t2":16,"t3":12},{"lo":250000,"hi":262500,"t1":0,"t2":15,"t3":13},{"lo":262500,"hi":275000,"t1":1,"t2":15,"t3":10},{"lo":275000,"hi":287500,"t1":0,"t2":15,"t3":17},{"lo":287500,"hi":300000,"t1":0,"t2":8,"t3":10},{"lo":300000,"hi":312500,"t1":0,"t2":13,"t3":17},{"lo":312500,"hi":325000,"t1":0,"t2":9,"t3":9},{"lo":325000,"hi":337500,"t1":0,"t2":11,"t3":7},{"lo":337500,"hi":350000,"t1":0,"t2":6,"t3":12},{"lo":350000,"hi":362500,"t1":0,"t2":3,"t3":5},{"lo":362500,"hi":375000,"t1":0,"t2":4,"t3":10},{"lo":375000,"hi":387500,"t1":0,"t2":8,"t3":9},{"lo":387500,"hi":400000,"t1":0,"t2":4,"t3":7},{"lo":400000,"hi":412500,"t1":0,"t2":7,"t3":6},{"lo":412500,"hi":425000,"t1":0,"t2":6,"t3":6},{"lo":425000,"hi":437500,"t1":0,"t2":1,"t3":8},{"lo":437500,"hi":450000,"t1":0,"t2":3,"t3":7},{"lo":450000,"hi":462500,"t1":0,"t2":1,"t3":6},{"lo":462500,"hi":475000,"t1":0,"t2":0,"t3":5},{"lo":475000,"hi":487500,"t1":0,"t2":3,"t3":6},{"lo":487500,"hi":500000,"t1":0,"t2":1,"t3":3},{"lo":500000,"hi":512500,"t1":0,"t2":1,"t3":7},{"lo":512500,"hi":525000,"t1":0,"t2":1,"t3":7},{"lo":525000,"hi":537500,"t1":0,"t2":0,"t3":7},{"lo":537500,"hi":550000,"t1":0,"t2":0,"t3":4},{"lo":550000,"hi":562500,"t1":0,"t2":0,"t3":2},{"lo":562500,"hi":575000,"t1":0,"t2":0,"t3":4},{"lo":575000,"hi":587500,"t1":0,"t2":0,"t3":4},{"lo":587500,"hi":600000,"t1":0,"t2":0,"t3":2},{"lo":600000,"hi":612500,"t1":0,"t2":0,"t3":3},{"lo":612500,"hi":625000,"t1":0,"t2":0,"t3":3},{"lo":625000,"hi":637500,"t1":0,"t2":0,"t3":3},{"lo":637500,"hi":650000,"t1":0,"t2":0,"t3":2},{"lo":650000,"hi":662500,"t1":0,"t2":0,"t3":4},{"lo":662500,"hi":675000,"t1":0,"t2":0,"t3":1},{"lo":675000,"hi":687500,"t1":0,"t2":0,"t3":2},{"lo":687500,"hi":700000,"t1":0,"t2":0,"t3":3},{"lo":700000,"hi":712500,"t1":0,"t2":0,"t3":1},{"lo":712500,"hi":725000,"t1":0,"t2":0,"t3":3},{"lo":725000,"hi":737500,"t1":0,"t2":0,"t3":1},{"lo":737500,"hi":750000,"t1":0,"t2":0,"t3":1},{"lo":750000,"hi":762500,"t1":0,"t2":0,"t3":2},{"lo":762500,"hi":775000,"t1":0,"t2":0,"t3":2},{"lo":775000,"hi":787500,"t1":0,"t2":0,"t3":1}],"caHistogram":[{"lo":37500,"hi":50000,"t1":6,"t2":0,"t3":0},{"lo":50000,"hi":62500,"t1":30,"t2":0,"t3":0},{"lo":62500,"hi":75000,"t1":63,"t2":1,"t3":0},{"lo":75000,"hi":87500,"t1":61,"t2":5,"t3":0},{"lo":87500,"hi":100000,"t1":56,"t2":15,"t3":1},{"lo":100000,"hi":112500,"t1":49,"t2":28,"t3":1},{"lo":112500,"hi":125000,"t1":27,"t2":31,"t3":9},{"lo":125000,"hi":137500,"t1":25,"t2":24,"t3":10},{"lo":137500,"hi":150000,"t1":21,"t2":23,"t3":19},{"lo":150000,"hi":162500,"t1":10,"t2":32,"t3":24},{"lo":162500,"hi":175000,"t1":2,"t2":32,"t3":19},{"lo":175000,"hi":187500,"t1":0,"t2":21,"t3":14},{"lo":187500,"hi":200000,"t1":0,"t2":21,"t3":16},{"lo":200000,"hi":212500,"t1":0,"t2":21,"t3":22},{"lo":212500,"hi":225000,"t1":0,"t2":14,"t3":24},{"lo":225000,"hi":237500,"t1":0,"t2":20,"t3":16},{"lo":237500,"hi":250000,"t1":0,"t2":11,"t3":11},{"lo":250000,"hi":262500,"t1":0,"t2":7,"t3":12},{"lo":262500,"hi":275000,"t1":0,"t2":11,"t3":10},{"lo":275000,"hi":287500,"t1":0,"t2":12,"t3":8},{"lo":287500,"hi":300000,"t1":0,"t2":5,"t3":7},{"lo":300000,"hi":312500,"t1":0,"t2":4,"t3":11},{"lo":312500,"hi":325000,"t1":0,"t2":3,"t3":6},{"lo":325000,"hi":337500,"t1":0,"t2":5,"t3":6},{"lo":337500,"hi":350000,"t1":0,"t2":0,"t3":11},{"lo":350000,"hi":362500,"t1":0,"t2":3,"t3":13},{"lo":362500,"hi":375000,"t1":0,"t2":0,"t3":9},{"lo":375000,"hi":387500,"t1":0,"t2":1,"t3":7},{"lo":387500,"hi":400000,"t1":0,"t2":0,"t3":8},{"lo":400000,"hi":412500,"t1":0,"t2":0,"t3":7},{"lo":412500,"hi":425000,"t1":0,"t2":0,"t3":4},{"lo":425000,"hi":437500,"t1":0,"t2":0,"t3":2},{"lo":437500,"hi":450000,"t1":0,"t2":0,"t3":4},{"lo":450000,"hi":462500,"t1":0,"t2":0,"t3":4},{"lo":462500,"hi":475000,"t1":0,"t2":0,"t3":2},{"lo":475000,"hi":487500,"t1":0,"t2":0,"t3":4},{"lo":487500,"hi":500000,"t1":0,"t2":0,"t3":6},{"lo":500000,"hi":512500,"t1":0,"t2":0,"t3":4},{"lo":525000,"hi":537500,"t1":0,"t2":0,"t3":5},{"lo":537500,"hi":550000,"t1":0,"t2":0,"t3":1},{"lo":550000,"hi":562500,"t1":0,"t2":0,"t3":3},{"lo":575000,"hi":587500,"t1":0,"t2":0,"t3":3},{"lo":600000,"hi":612500,"t1":0,"t2":0,"t3":2},{"lo":612500,"hi":625000,"t1":0,"t2":0,"t3":1},{"lo":637500,"hi":650000,"t1":0,"t2":0,"t3":1},{"lo":687500,"hi":700000,"t1":0,"t2":0,"t3":1},{"lo":700000,"hi":712500,"t1":0,"t2":0,"t3":1},{"lo":725000,"hi":737500,"t1":0,"t2":0,"t3":1}],"histograms":{"US":{"All":[{"lo":50000,"hi":62500,"t1":3,"t2":0,"t3":0},{"lo":62500,"hi":75000,"t1":24,"t2":0,"t3":0},{"lo":75000,"hi":87500,"t1":34,"t2":0,"t3":0},{"lo":87500,"hi":100000,"t1":50,"t2":1,"t3":0},{"lo":100000,"hi":112500,"t1":46,"t2":4,"t3":0},{"lo":112500,"hi":125000,"t1":47,"t2":6,"t3":0},{"lo":125000,"hi":137500,"t1":38,"t2":11,"t3":1},{"lo":137500,"hi":150000,"t1":33,"t2":30,"t3":1},{"lo":150000,"hi":162500,"t1":16,"t2":12,"t3":3},{"lo":162500,"hi":175000,"t1":28,"t2":26,"t3":5},{"lo":175000,"hi":187500,"t1":11,"t2":21,"t3":10},{"lo":187500,"hi":200000,"t1":9,"t2":22,"t3":20},{"lo":200000,"hi":212500,"t1":7,"t2":23,"t3":9},{"lo":212500,"hi":225000,"t1":3,"t2":21,"t3":16},{"lo":225000,"hi":237500,"t1":0,"t2":22,"t3":18},{"lo":237500,"hi":250000,"t1":0,"t2":16,"t3":12},{"lo":250000,"hi":262500,"t1":0,"t2":15,"t3":13},{"lo":262500,"hi":275000,"t1":1,"t2":15,"t3":10},{"lo":275000,"hi":287500,"t1":0,"t2":15,"t3":17},{"lo":287500,"hi":300000,"t1":0,"t2":8,"t3":10},{"lo":300000,"hi":312500,"t1":0,"t2":13,"t3":17},{"lo":312500,"hi":325000,"t1":0,"t2":9,"t3":9},{"lo":325000,"hi":337500,"t1":0,"t2":11,"t3":7},{"lo":337500,"hi":350000,"t1":0,"t2":6,"t3":12},{"lo":350000,"hi":362500,"t1":0,"t2":3,"t3":5},{"lo":362500,"hi":375000,"t1":0,"t2":4,"t3":10},{"lo":375000,"hi":387500,"t1":0,"t2":8,"t3":9},{"lo":387500,"hi":400000,"t1":0,"t2":4,"t3":7},{"lo":400000,"hi":412500,"t1":0,"t2":7,"t3":6},{"lo":412500,"hi":425000,"t1":0,"t2":6,"t3":6},{"lo":425000,"hi":437500,"t1":0,"t2":1,"t3":8},{"lo":437500,"hi":450000,"t1":0,"t2":3,"t3":7},{"lo":450000,"hi":462500,"t1":0,"t2":1,"t3":6},{"lo":462500,"hi":475000,"t1":0,"t2":0,"t3":5},{"lo":475000,"hi":487500,"t1":0,"t2":3,"t3":6},{"lo":487500,"hi":500000,"t1":0,"t2":1,"t3":3},{"lo":500000,"hi":512500,"t1":0,"t2":1,"t3":7},{"lo":512500,"hi":525000,"t1":0,"t2":1,"t3":7},{"lo":525000,"hi":537500,"t1":0,"t2":0,"t3":7},{"lo":537500,"hi":550000,"t1":0,"t2":0,"t3":4},{"lo":550000,"hi":562500,"t1":0,"t2":0,"t3":2},{"lo":562500,"hi":575000,"t1":0,"t2":0,"t3":4},{"lo":575000,"hi":587500,"t1":0,"t2":0,"t3":4},{"lo":587500,"hi":600000,"t1":0,"t2":0,"t3":2},{"lo":600000,"hi":612500,"t1":0,"t2":0,"t3":3},{"lo":612500,"hi":625000,"t1":0,"t2":0,"t3":3},{"lo":625000,"hi":637500,"t1":0,"t2":0,"t3":3},{"lo":637500,"hi":650000,"t1":0,"t2":0,"t3":2},{"lo":650000,"hi":662500,"t1":0,"t2":0,"t3":4},{"lo":662500,"hi":675000,"t1":0,"t2":0,"t3":1},{"lo":675000,"hi":687500,"t1":0,"t2":0,"t3":2},{"lo":687500,"hi":700000,"t1":0,"t2":0,"t3":3},{"lo":700000,"hi":712500,"t1":0,"t2":0,"t3":1},{"lo":712500,"hi":725000,"t1":0,"t2":0,"t3":3},{"lo":725000,"hi":737500,"t1":0,"t2":0,"t3":1},{"lo":737500,"hi":750000,"t1":0,"t2":0,"t3":1},{"lo":750000,"hi":762500,"t1":0,"t2":0,"t3":2},{"lo":762500,"hi":775000,"t1":0,"t2":0,"t3":2},{"lo":775000,"hi":787500,"t1":0,"t2":0,"t3":1}],"Entry":[{"lo":50000,"hi":62500,"t1":3,"t2":0,"t3":0},{"lo":62500,"hi":75000,"t1":22,"t2":0,"t3":0},{"lo":75000,"hi":87500,"t1":23,"t2":0,"t3":0},{"lo":87500,"hi":100000,"t1":23,"t2":1,"t3":0},{"lo":100000,"hi":112500,"t1":8,"t2":4,"t3":0},{"lo":112500,"hi":125000,"t1":1,"t2":6,"t3":0},{"lo":125000,"hi":137500,"t1":0,"t2":11,"t3":1},{"lo":137500,"hi":150000,"t1":0,"t2":24,"t3":1},{"lo":150000,"hi":162500,"t1":0,"t2":10,"t3":3},{"lo":162500,"hi":175000,"t1":0,"t2":13,"t3":5},{"lo":175000,"hi":187500,"t1":0,"t2":7,"t3":10},{"lo":187500,"hi":200000,"t1":0,"t2":3,"t3":19},{"lo":200000,"hi":212500,"t1":0,"t2":1,"t3":7},{"lo":212500,"hi":225000,"t1":0,"t2":0,"t3":12},{"lo":225000,"hi":237500,"t1":0,"t2":0,"t3":9},{"lo":237500,"hi":250000,"t1":0,"t2":0,"t3":3},{"lo":250000,"hi":262500,"t1":0,"t2":0,"t3":8},{"lo":262500,"hi":275000,"t1":0,"t2":0,"t3":1},{"lo":275000,"hi":287500,"t1":0,"t2":0,"t3":1}],"Mid":[{"lo":62500,"hi":75000,"t1":2,"t2":0,"t3":0},{"lo":75000,"hi":87500,"t1":11,"t2":0,"t3":0},{"lo":87500,"hi":100000,"t1":24,"t2":0,"t3":0},{"lo":100000,"hi":112500,"t1":34,"t2":0,"t3":0},{"lo":112500,"hi":125000,"t1":28,"t2":0,"t3":0},{"lo":125000,"hi":137500,"t1":17,"t2":0,"t3":0},{"lo":137500,"hi":150000,"t1":4,"t2":5,"t3":0},{"lo":150000,"hi":162500,"t1":0,"t2":2,"t3":0},{"lo":162500,"hi":175000,"t1":0,"t2":13,"t3":0},{"lo":175000,"hi":187500,"t1":0,"t2":12,"t3":0},{"lo":187500,"hi":200000,"t1":0,"t2":19,"t3":1},{"lo":200000,"hi":212500,"t1":0,"t2":17,"t3":2},{"lo":212500,"hi":225000,"t1":0,"t2":18,"t3":4},{"lo":225000,"hi":237500,"t1":0,"t2":14,"t3":9},{"lo":237500,"hi":250000,"t1":0,"t2":8,"t3":9},{"lo":250000,"hi":262500,"t1":0,"t2":7,"t3":5},{"lo":262500,"hi":275000,"t1":0,"t2":2,"t3":9},{"lo":275000,"hi":287500,"t1":0,"t2":3,"t3":15},{"lo":287500,"hi":300000,"t1":0,"t2":0,"t3":8},{"lo":300000,"hi":312500,"t1":0,"t2":0,"t3":16},{"lo":312500,"hi":325000,"t1":0,"t2":0,"t3":8},{"lo":325000,"hi":337500,"t1":0,"t2":0,"t3":6},{"lo":337500,"hi":350000,"t1":0,"t2":0,"t3":8},{"lo":350000,"hi":362500,"t1":0,"t2":0,"t3":4},{"lo":362500,"hi":375000,"t1":0,"t2":0,"t3":7},{"lo":375000,"hi":387500,"t1":0,"t2":0,"t3":5},{"lo":387500,"hi":400000,"t1":0,"t2":0,"t3":3},{"lo":425000,"hi":437500,"t1":0,"t2":0,"t3":1}],"Senior":[{"lo":87500,"hi":100000,"t1":3,"t2":0,"t3":0},{"lo":100000,"hi":112500,"t1":4,"t2":0,"t3":0},{"lo":112500,"hi":125000,"t1":18,"t2":0,"t3":0},{"lo":125000,"hi":137500,"t1":19,"t2":0,"t3":0},{"lo":137500,"hi":150000,"t1":27,"t2":1,"t3":0},{"lo":150000,"hi":162500,"t1":12,"t2":0,"t3":0},{"lo":162500,"hi":175000,"t1":14,"t2":0,"t3":0},{"lo":175000,"hi":187500,"t1":2,"t2":2,"t3":0},{"lo":200000,"hi":212500,"t1":1,"t2":5,"t3":0},{"lo":212500,"hi":225000,"t1":0,"t2":3,"t3":0},{"lo":225000,"hi":237500,"t1":0,"t2":7,"t3":0},{"lo":237500,"hi":250000,"t1":0,"t2":6,"t3":0},{"lo":250000,"hi":262500,"t1":0,"t2":8,"t3":0},{"lo":262500,"hi":275000,"t1":0,"t2":12,"t3":0},{"lo":275000,"hi":287500,"t1":0,"t2":11,"t3":1},{"lo":287500,"hi":300000,"t1":0,"t2":8,"t3":1},{"lo":300000,"hi":312500,"t1":0,"t2":12,"t3":1},{"lo":312500,"hi":325000,"t1":0,"t2":8,"t3":1},{"lo":325000,"hi":337500,"t1":0,"t2":9,"t3":1},{"lo":337500,"hi":350000,"t1":0,"t2":4,"t3":4},{"lo":350000,"hi":362500,"t1":0,"t2":2,"t3":1},{"lo":362500,"hi":375000,"t1":0,"t2":0,"t3":3},{"lo":375000,"hi":387500,"t1":0,"t2":1,"t3":4},{"lo":387500,"hi":400000,"t1":0,"t2":0,"t3":4},{"lo":400000,"hi":412500,"t1":0,"t2":1,"t3":6},{"lo":412500,"hi":425000,"t1":0,"t2":0,"t3":6},{"lo":425000,"hi":437500,"t1":0,"t2":0,"t3":4},{"lo":437500,"hi":450000,"t1":0,"t2":0,"t3":7},{"lo":450000,"hi":462500,"t1":0,"t2":0,"t3":6},{"lo":462500,"hi":475000,"t1":0,"t2":0,"t3":5},{"lo":475000,"hi":487500,"t1":0,"t2":0,"t3":5},{"lo":487500,"hi":500000,"t1":0,"t2":0,"t3":3},{"lo":500000,"hi":512500,"t1":0,"t2":0,"t3":6},{"lo":512500,"hi":525000,"t1":0,"t2":0,"t3":6},{"lo":525000,"hi":537500,"t1":0,"t2":0,"t3":6},{"lo":537500,"hi":550000,"t1":0,"t2":0,"t3":3},{"lo":550000,"hi":562500,"t1":0,"t2":0,"t3":2},{"lo":562500,"hi":575000,"t1":0,"t2":0,"t3":4},{"lo":575000,"hi":587500,"t1":0,"t2":0,"t3":2},{"lo":587500,"hi":600000,"t1":0,"t2":0,"t3":2},{"lo":600000,"hi":612500,"t1":0,"t2":0,"t3":1},{"lo":612500,"hi":625000,"t1":0,"t2":0,"t3":2},{"lo":637500,"hi":650000,"t1":0,"t2":0,"t3":2},{"lo":650000,"hi":662500,"t1":0,"t2":0,"t3":1}],"Staff":[{"lo":125000,"hi":137500,"t1":2,"t2":0,"t3":0},{"lo":137500,"hi":150000,"t1":2,"t2":0,"t3":0},{"lo":150000,"hi":162500,"t1":4,"t2":0,"t3":0},{"lo":162500,"hi":175000,"t1":14,"t2":0,"t3":0},{"lo":175000,"hi":187500,"t1":9,"t2":0,"t3":0},{"lo":187500,"hi":200000,"t1":9,"t2":0,"t3":0},{"lo":200000,"hi":212500,"t1":6,"t2":0,"t3":0},{"lo":212500,"hi":225000,"t1":3,"t2":0,"t3":0},{"lo":225000,"hi":237500,"t1":0,"t2":1,"t3":0},{"lo":237500,"hi":250000,"t1":0,"t2":2,"t3":0},{"lo":262500,"hi":275000,"t1":1,"t2":1,"t3":0},{"lo":275000,"hi":287500,"t1":0,"t2":1,"t3":0},{"lo":287500,"hi":300000,"t1":0,"t2":0,"t3":1},{"lo":300000,"hi":312500,"t1":0,"t2":1,"t3":0},{"lo":312500,"hi":325000,"t1":0,"t2":1,"t3":0},{"lo":325000,"hi":337500,"t1":0,"t2":2,"t3":0},{"lo":337500,"hi":350000,"t1":0,"t2":2,"t3":0},{"lo":350000,"hi":362500,"t1":0,"t2":1,"t3":0},{"lo":362500,"hi":375000,"t1":0,"t2":4,"t3":0},{"lo":375000,"hi":387500,"t1":0,"t2":7,"t3":0},{"lo":387500,"hi":400000,"t1":0,"t2":4,"t3":0},{"lo":400000,"hi":412500,"t1":0,"t2":6,"t3":0},{"lo":412500,"hi":425000,"t1":0,"t2":6,"t3":0},{"lo":425000,"hi":437500,"t1":0,"t2":1,"t3":3},{"lo":437500,"hi":450000,"t1":0,"t2":3,"t3":0},{"lo":450000,"hi":462500,"t1":0,"t2":1,"t3":0},{"lo":475000,"hi":487500,"t1":0,"t2":3,"t3":1},{"lo":487500,"hi":500000,"t1":0,"t2":1,"t3":0},{"lo":500000,"hi":512500,"t1":0,"t2":1,"t3":1},{"lo":512500,"hi":525000,"t1":0,"t2":1,"t3":1},{"lo":525000,"hi":537500,"t1":0,"t2":0,"t3":1},{"lo":537500,"hi":550000,"t1":0,"t2":0,"t3":1},{"lo":575000,"hi":587500,"t1":0,"t2":0,"t3":2},{"lo":600000,"hi":612500,"t1":0,"t2":0,"t3":2},{"lo":612500,"hi":625000,"t1":0,"t2":0,"t3":1},{"lo":625000,"hi":637500,"t1":0,"t2":0,"t3":3},{"lo":650000,"hi":662500,"t1":0,"t2":0,"t3":3},{"lo":662500,"hi":675000,"t1":0,"t2":0,"t3":1},{"lo":675000,"hi":687500,"t1":0,"t2":0,"t3":2},{"lo":687500,"hi":700000,"t1":0,"t2":0,"t3":3},{"lo":700000,"hi":712500,"t1":0,"t2":0,"t3":1},{"lo":712500,"hi":725000,"t1":0,"t2":0,"t3":3},{"lo":725000,"hi":737500,"t1":0,"t2":0,"t3":1},{"lo":737500,"hi":750000,"t1":0,"t2":0,"t3":1},{"lo":750000,"hi":762500,"t1":0,"t2":0,"t3":2},{"lo":762500,"hi":775000,"t1":0,"t2":0,"t3":2},{"lo":775000,"hi":787500,"t1":0,"t2":0,"t3":1}]},"Canada":{"All":[{"lo":37500,"hi":50000,"t1":6,"t2":0,"t3":0},{"lo":50000,"hi":62500,"t1":30,"t2":0,"t3":0},{"lo":62500,"hi":75000,"t1":63,"t2":1,"t3":0},{"lo":75000,"hi":87500,"t1":61,"t2":5,"t3":0},{"lo":87500,"hi":100000,"t1":56,"t2":15,"t3":1},{"lo":100000,"hi":112500,"t1":49,"t2":28,"t3":1},{"lo":112500,"hi":125000,"t1":27,"t2":31,"t3":9},{"lo":125000,"hi":137500,"t1":25,"t2":24,"t3":10},{"lo":137500,"hi":150000,"t1":21,"t2":23,"t3":19},{"lo":150000,"hi":162500,"t1":10,"t2":32,"t3":24},{"lo":162500,"hi":175000,"t1":2,"t2":32,"t3":19},{"lo":175000,"hi":187500,"t1":0,"t2":21,"t3":14},{"lo":187500,"hi":200000,"t1":0,"t2":21,"t3":16},{"lo":200000,"hi":212500,"t1":0,"t2":21,"t3":22},{"lo":212500,"hi":225000,"t1":0,"t2":14,"t3":24},{"lo":225000,"hi":237500,"t1":0,"t2":20,"t3":16},{"lo":237500,"hi":250000,"t1":0,"t2":11,"t3":11},{"lo":250000,"hi":262500,"t1":0,"t2":7,"t3":12},{"lo":262500,"hi":275000,"t1":0,"t2":11,"t3":10},{"lo":275000,"hi":287500,"t1":0,"t2":12,"t3":8},{"lo":287500,"hi":300000,"t1":0,"t2":5,"t3":7},{"lo":300000,"hi":312500,"t1":0,"t2":4,"t3":11},{"lo":312500,"hi":325000,"t1":0,"t2":3,"t3":6},{"lo":325000,"hi":337500,"t1":0,"t2":5,"t3":6},{"lo":337500,"hi":350000,"t1":0,"t2":0,"t3":11},{"lo":350000,"hi":362500,"t1":0,"t2":3,"t3":13},{"lo":362500,"hi":375000,"t1":0,"t2":0,"t3":9},{"lo":375000,"hi":387500,"t1":0,"t2":1,"t3":7},{"lo":387500,"hi":400000,"t1":0,"t2":0,"t3":8},{"lo":400000,"hi":412500,"t1":0,"t2":0,"t3":7},{"lo":412500,"hi":425000,"t1":0,"t2":0,"t3":4},{"lo":425000,"hi":437500,"t1":0,"t2":0,"t3":2},{"lo":437500,"hi":450000,"t1":0,"t2":0,"t3":4},{"lo":450000,"hi":462500,"t1":0,"t2":0,"t3":4},{"lo":462500,"hi":475000,"t1":0,"t2":0,"t3":2},{"lo":475000,"hi":487500,"t1":0,"t2":0,"t3":4},{"lo":487500,"hi":500000,"t1":0,"t2":0,"t3":6},{"lo":500000,"hi":512500,"t1":0,"t2":0,"t3":4},{"lo":525000,"hi":537500,"t1":0,"t2":0,"t3":5},{"lo":537500,"hi":550000,"t1":0,"t2":0,"t3":1},{"lo":550000,"hi":562500,"t1":0,"t2":0,"t3":3},{"lo":575000,"hi":587500,"t1":0,"t2":0,"t3":3},{"lo":600000,"hi":612500,"t1":0,"t2":0,"t3":2},{"lo":612500,"hi":625000,"t1":0,"t2":0,"t3":1},{"lo":637500,"hi":650000,"t1":0,"t2":0,"t3":1},{"lo":687500,"hi":700000,"t1":0,"t2":0,"t3":1},{"lo":700000,"hi":712500,"t1":0,"t2":0,"t3":1},{"lo":725000,"hi":737500,"t1":0,"t2":0,"t3":1}],"Entry":[{"lo":37500,"hi":50000,"t1":5,"t2":0,"t3":0},{"lo":50000,"hi":62500,"t1":26,"t2":0,"t3":0},{"lo":62500,"hi":75000,"t1":34,"t2":1,"t3":0},{"lo":75000,"hi":87500,"t1":15,"t2":5,"t3":0},{"lo":87500,"hi":100000,"t1":0,"t2":15,"t3":1},{"lo":100000,"hi":112500,"t1":0,"t2":25,"t3":1},{"lo":112500,"hi":125000,"t1":0,"t2":23,"t3":9},{"lo":125000,"hi":137500,"t1":0,"t2":9,"t3":10},{"lo":137500,"hi":150000,"t1":0,"t2":1,"t3":18},{"lo":150000,"hi":162500,"t1":0,"t2":1,"t3":22},{"lo":162500,"hi":175000,"t1":0,"t2":0,"t3":11},{"lo":175000,"hi":187500,"t1":0,"t2":0,"t3":5},{"lo":187500,"hi":200000,"t1":0,"t2":0,"t3":2},{"lo":212500,"hi":225000,"t1":0,"t2":0,"t3":1}],"Mid":[{"lo":37500,"hi":50000,"t1":1,"t2":0,"t3":0},{"lo":50000,"hi":62500,"t1":4,"t2":0,"t3":0},{"lo":62500,"hi":75000,"t1":27,"t2":0,"t3":0},{"lo":75000,"hi":87500,"t1":40,"t2":0,"t3":0},{"lo":87500,"hi":100000,"t1":35,"t2":0,"t3":0},{"lo":100000,"hi":112500,"t1":12,"t2":3,"t3":0},{"lo":112500,"hi":125000,"t1":1,"t2":8,"t3":0},{"lo":125000,"hi":137500,"t1":0,"t2":14,"t3":0},{"lo":137500,"hi":150000,"t1":0,"t2":21,"t3":1},{"lo":150000,"hi":162500,"t1":0,"t2":27,"t3":2},{"lo":162500,"hi":175000,"t1":0,"t2":27,"t3":8},{"lo":175000,"hi":187500,"t1":0,"t2":11,"t3":9},{"lo":187500,"hi":200000,"t1":0,"t2":6,"t3":14},{"lo":200000,"hi":212500,"t1":0,"t2":2,"t3":22},{"lo":212500,"hi":225000,"t1":0,"t2":1,"t3":22},{"lo":225000,"hi":237500,"t1":0,"t2":0,"t3":13},{"lo":237500,"hi":250000,"t1":0,"t2":0,"t3":10},{"lo":250000,"hi":262500,"t1":0,"t2":0,"t3":8},{"lo":262500,"hi":275000,"t1":0,"t2":0,"t3":6},{"lo":275000,"hi":287500,"t1":0,"t2":0,"t3":3},{"lo":287500,"hi":300000,"t1":0,"t2":0,"t3":2}],"Senior":[{"lo":62500,"hi":75000,"t1":2,"t2":0,"t3":0},{"lo":75000,"hi":87500,"t1":6,"t2":0,"t3":0},{"lo":87500,"hi":100000,"t1":21,"t2":0,"t3":0},{"lo":100000,"hi":112500,"t1":33,"t2":0,"t3":0},{"lo":112500,"hi":125000,"t1":16,"t2":0,"t3":0},{"lo":125000,"hi":137500,"t1":17,"t2":1,"t3":0},{"lo":137500,"hi":150000,"t1":4,"t2":1,"t3":0},{"lo":150000,"hi":162500,"t1":1,"t2":4,"t3":0},{"lo":162500,"hi":175000,"t1":0,"t2":5,"t3":0},{"lo":175000,"hi":187500,"t1":0,"t2":10,"t3":0},{"lo":187500,"hi":200000,"t1":0,"t2":14,"t3":0},{"lo":200000,"hi":212500,"t1":0,"t2":17,"t3":0},{"lo":212500,"hi":225000,"t1":0,"t2":12,"t3":1},{"lo":225000,"hi":237500,"t1":0,"t2":16,"t3":3},{"lo":237500,"hi":250000,"t1":0,"t2":8,"t3":1},{"lo":250000,"hi":262500,"t1":0,"t2":5,"t3":4},{"lo":262500,"hi":275000,"t1":0,"t2":5,"t3":4},{"lo":275000,"hi":287500,"t1":0,"t2":2,"t3":4},{"lo":287500,"hi":300000,"t1":0,"t2":0,"t3":5},{"lo":300000,"hi":312500,"t1":0,"t2":0,"t3":10},{"lo":312500,"hi":325000,"t1":0,"t2":0,"t3":6},{"lo":325000,"hi":337500,"t1":0,"t2":0,"t3":6},{"lo":337500,"hi":350000,"t1":0,"t2":0,"t3":11},{"lo":350000,"hi":362500,"t1":0,"t2":0,"t3":13},{"lo":362500,"hi":375000,"t1":0,"t2":0,"t3":8},{"lo":375000,"hi":387500,"t1":0,"t2":0,"t3":4},{"lo":387500,"hi":400000,"t1":0,"t2":0,"t3":8},{"lo":400000,"hi":412500,"t1":0,"t2":0,"t3":5},{"lo":412500,"hi":425000,"t1":0,"t2":0,"t3":2},{"lo":437500,"hi":450000,"t1":0,"t2":0,"t3":1},{"lo":450000,"hi":462500,"t1":0,"t2":0,"t3":1},{"lo":462500,"hi":475000,"t1":0,"t2":0,"t3":1},{"lo":487500,"hi":500000,"t1":0,"t2":0,"t3":1},{"lo":525000,"hi":537500,"t1":0,"t2":0,"t3":1}],"Staff":[{"lo":100000,"hi":112500,"t1":4,"t2":0,"t3":0},{"lo":112500,"hi":125000,"t1":10,"t2":0,"t3":0},{"lo":125000,"hi":137500,"t1":8,"t2":0,"t3":0},{"lo":137500,"hi":150000,"t1":17,"t2":0,"t3":0},{"lo":150000,"hi":162500,"t1":9,"t2":0,"t3":0},{"lo":162500,"hi":175000,"t1":2,"t2":0,"t3":0},{"lo":187500,"hi":200000,"t1":0,"t2":1,"t3":0},{"lo":200000,"hi":212500,"t1":0,"t2":2,"t3":0},{"lo":212500,"hi":225000,"t1":0,"t2":1,"t3":0},{"lo":225000,"hi":237500,"t1":0,"t2":4,"t3":0},{"lo":237500,"hi":250000,"t1":0,"t2":3,"t3":0},{"lo":250000,"hi":262500,"t1":0,"t2":2,"t3":0},{"lo":262500,"hi":275000,"t1":0,"t2":6,"t3":0},{"lo":275000,"hi":287500,"t1":0,"t2":10,"t3":1},{"lo":287500,"hi":300000,"t1":0,"t2":5,"t3":0},{"lo":300000,"hi":312500,"t1":0,"t2":4,"t3":1},{"lo":312500,"hi":325000,"t1":0,"t2":3,"t3":0},{"lo":325000,"hi":337500,"t1":0,"t2":5,"t3":0},{"lo":350000,"hi":362500,"t1":0,"t2":3,"t3":0},{"lo":362500,"hi":375000,"t1":0,"t2":0,"t3":1},{"lo":375000,"hi":387500,"t1":0,"t2":1,"t3":3},{"lo":400000,"hi":412500,"t1":0,"t2":0,"t3":2},{"lo":412500,"hi":425000,"t1":0,"t2":0,"t3":2},{"lo":425000,"hi":437500,"t1":0,"t2":0,"t3":2},{"lo":437500,"hi":450000,"t1":0,"t2":0,"t3":3},{"lo":450000,"hi":462500,"t1":0,"t2":0,"t3":3},{"lo":462500,"hi":475000,"t1":0,"t2":0,"t3":1},{"lo":475000,"hi":487500,"t1":0,"t2":0,"t3":4},{"lo":487500,"hi":500000,"t1":0,"t2":0,"t3":5},{"lo":500000,"hi":512500,"t1":0,"t2":0,"t3":4},{"lo":525000,"hi":537500,"t1":0,"t2":0,"t3":4},{"lo":537500,"hi":550000,"t1":0,"t2":0,"t3":1},{"lo":550000,"hi":562500,"t1":0,"t2":0,"t3":3},{"lo":575000,"hi":587500,"t1":0,"t2":0,"t3":3},{"lo":600000,"hi":612500,"t1":0,"t2":0,"t3":2},{"lo":612500,"hi":625000,"t1":0,"t2":0,"t3":1},{"lo":637500,"hi":650000,"t1":0,"t2":0,"t3":1},{"lo":687500,"hi":700000,"t1":0,"t2":0,"t3":1},{"lo":700000,"hi":712500,"t1":0,"t2":0,"t3":1},{"lo":725000,"hi":737500,"t1":0,"t2":0,"t3":1}]}},"usStats":{"1":{"median":117372,"p25":93808,"p75":145211,"count":350,"avgBase":104127,"avgEquity":8350,"avgBonus":9891},"2":{"median":221319,"p25":174249,"p75":289654,"count":350,"avgBase":153569,"avgEquity":66452,"avgBonus":20943},"3":{"median":332446,"p25":243286,"p75":479738,"count":350,"avgBase":185324,"avgEquity":157597,"avgBonus":40637}},"caStats":{"1":{"median":90442,"p25":73480,"p75":111392,"count":350,"avgBase":82160,"avgEquity":5080,"avgBonus":7208},"2":{"median":168906,"p25":128938,"p75":223327,"count":350,"avgBase":119649,"avgEquity":45144,"avgBonus":14745},"3":{"median":237342,"p25":180960,"p75":357252,"count":350,"avgBase":144556,"avgEquity":103240,"avgBonus":29718}},"usLevelStats":{"Entry":{"1":{"median":84987,"p25":73458,"p75":92123,"count":80},"2":{"median":146342,"p25":134711,"p75":165092,"count":80},"3":{"median":202990,"p25":188613,"p75":228326,"count":80}},"Mid":{"1":{"median":107989,"p25":97263,"p75":118518,"count":120},"2":{"median":206967,"p25":186478,"p75":227942,"count":120},"3":{"median":297802,"p25":263679,"p75":335684,"count":120}},"Senior":{"1":{"median":140764,"p25":125062,"p75":153162,"count":100},"2":{"median":281245,"p25":255016,"p75":312662,"count":100},"3":{"median":462402,"p25":409668,"p75":525132,"count":100}},"Staff":{"1":{"median":177224,"p25":165486,"p75":197938,"count":50},"2":{"median":398202,"p25":364520,"p75":424035,"count":50},"3":{"median":698762,"p25":605947,"p75":795746,"count":50}}},"caLevelStats":{"Entry":{"1":{"median":65528,"p25":59176,"p75":72161,"count":80},"2":{"median":109682,"p25":99534,"p75":117512,"count":80},"3":{"median":150604,"p25":137245,"p75":161478,"count":80}},"Mid":{"1":{"median":83748,"p25":74721,"p75":92896,"count":120},"2":{"median":156550,"p25":142676,"p75":170875,"count":120},"3":{"median":215030,"p25":197270,"p75":236556,"count":120}},"Senior":{"1":{"median":107870,"p25":98364,"p75":122420,"count":100},"2":{"median":209629,"p25":190506,"p75":231731,"count":100},"3":{"median":346734,"p25":308308,"p75":371706,"count":100}},"Staff":{"1":{"median":138322,"p25":122974,"p75":148966,"count":50},"2":{"median":285412,"p25":253952,"p75":310564,"count":50},"3":{"median":491454,"p25":438368,"p75":553876,"count":50}}},"equityBreakdown":{"1":{"basePct":85.1,"equityPct":6.8,"bonusPct":8.1,"avgBase":104127,"avgEquity":8350,"avgBonus":9891},"2":{"basePct":63.7,"equityPct":27.6,"bonusPct":8.7,"avgBase":153569,"avgEquity":66452,"avgBonus":20943},"3":{"basePct":48.3,"equityPct":41.1,"bonusPct":10.6,"avgBase":185324,"avgEquity":157597,"avgBonus":40637}}};

/* ============================================
   COMPENSATION CHARTS - Shared Utilities
   ============================================ */

function fmtK(n) { return n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`; }

function drawStackedHistogram(canvas, bins, opts = {}) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    const padding = { top: 28, right: 20, bottom: 44, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    clearAndDrawAxes(ctx, width, height, padding, { bgColor: opts.bg || '#fff' });

    if (!bins || bins.length === 0) return;

    // Grouped bars: max is per-tier count (not stacked sum)
    const maxCount = Math.max(...bins.map(b => Math.max(b.t1, b.t2, b.t3)));
    const colors = [COMP_DATA.tiers['1'].color, COMP_DATA.tiers['2'].color, COMP_DATA.tiers['3'].color];
    const groupW = chartW / bins.length;
    const barW = groupW / 3;

    bins.forEach((bin, i) => {
        const groupX = padding.left + i * groupW;
        [bin.t1, bin.t2, bin.t3].forEach((count, ti) => {
            if (count === 0) return;
            const barH = (count / maxCount) * chartH;
            const x = groupX + ti * barW;
            const y = height - padding.bottom - barH;
            ctx.fillStyle = colors[ti];
            ctx.fillRect(x, y, Math.max(barW - 0.5, 1), barH);
        });
    });

    // Draw tier median lines if stats provided
    if (opts.stats) {
        const minLo = bins[0].lo;
        const maxHi = bins[bins.length - 1].hi;
        const range = maxHi - minLo;
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1.5;
        for (let t = 1; t <= 3; t++) {
            const med = opts.stats[t].median;
            const xPos = padding.left + ((med - minLo) / range) * chartW;
            if (xPos > padding.left && xPos < width - padding.right) {
                ctx.strokeStyle = colors[t - 1];
                ctx.beginPath();
                ctx.moveTo(xPos, padding.top);
                ctx.lineTo(xPos, height - padding.bottom);
                ctx.stroke();
            }
        }
        ctx.setLineDash([]);
    }

    // Legend
    const tierNames = ['Tier 1 — Traditional', 'Tier 2 — Competitive', 'Tier 3 — Big Tech+'];
    let lx = padding.left;
    ctx.font = '10px Inter, sans-serif';
    tierNames.forEach((name, i) => {
        ctx.fillStyle = colors[i];
        ctx.fillRect(lx, 6, 10, 10);
        ctx.fillStyle = '#555';
        ctx.textAlign = 'left';
        ctx.fillText(name, lx + 13, 15);
        lx += ctx.measureText(name).width + 24;
    });

    // X-axis labels
    const labelStep = Math.max(1, Math.floor(bins.length / 6));
    const labels = [];
    const positions = [];
    for (let i = 0; i < bins.length; i += labelStep) {
        labels.push(fmtK(bins[i].lo));
        positions.push(padding.left + i * groupW + groupW / 2);
    }
    drawXLabels(ctx, labels, positions, height - padding.bottom + 16);

    // Axis titles
    ctx.fillStyle = '#666';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(opts.xLabel || 'Total Compensation (USD)', padding.left + chartW / 2, height - 4);

    ctx.save();
    ctx.translate(12, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Count', 0, 0);
    ctx.restore();
}

/* ============================================
   COMPENSATION - Static Charts
   ============================================ */

function initCompStaticCharts() {
    const overallCanvas = document.getElementById('comp-overall-histogram');
    if (overallCanvas) {
        drawStackedHistogram(overallCanvas, COMP_DATA.usHistogram, {
            stats: COMP_DATA.usStats,
            xLabel: 'Total Compensation (USD)'
        });
    }

    const mediansCanvas = document.getElementById('comp-tier-medians');
    if (mediansCanvas) drawTierMedians(mediansCanvas);

    const equityCanvas = document.getElementById('comp-equity-breakdown');
    if (equityCanvas) drawEquityBreakdown(equityCanvas);

    const levelCanvas = document.getElementById('comp-level-comparison');
    if (levelCanvas) drawLevelComparison(levelCanvas);

    const usCanvas = document.getElementById('comp-us-histogram');
    if (usCanvas) {
        drawStackedHistogram(usCanvas, COMP_DATA.histograms.US.All, {
            stats: COMP_DATA.usStats,
            xLabel: 'Total Compensation (USD)'
        });
    }
    const caCanvas = document.getElementById('comp-canada-histogram');
    if (caCanvas) {
        drawStackedHistogram(caCanvas, COMP_DATA.histograms.Canada.All, {
            stats: COMP_DATA.caStats,
            xLabel: 'Total Compensation (CAD-equivalent)'
        });
    }
}

function drawTierMedians(canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    const padding = { top: 30, right: 20, bottom: 60, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    clearAndDrawAxes(ctx, width, height, padding, { bgColor: '#fff' });

    const tiers = [1, 2, 3];
    const stats = COMP_DATA.usStats;
    const maxVal = Math.max(...tiers.map(t => stats[t].p75));
    const barW = chartW / (tiers.length * 2 + 1);
    const colors = tiers.map(t => COMP_DATA.tiers[t].color);

    tiers.forEach((t, i) => {
        const x = padding.left + (i * 2 + 1) * barW;
        const barH = (stats[t].median / maxVal) * chartH;
        const y = height - padding.bottom - barH;

        ctx.fillStyle = colors[i];
        ctx.fillRect(x, y, barW, barH);

        // P25-P75 whiskers
        const p25Y = height - padding.bottom - (stats[t].p25 / maxVal) * chartH;
        const p75Y = height - padding.bottom - (stats[t].p75 / maxVal) * chartH;
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + barW / 2, p75Y);
        ctx.lineTo(x + barW / 2, p25Y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + barW / 4, p75Y);
        ctx.lineTo(x + 3 * barW / 4, p75Y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + barW / 4, p25Y);
        ctx.lineTo(x + 3 * barW / 4, p25Y);
        ctx.stroke();

        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(fmtK(stats[t].median), x + barW / 2, y - 8);
    });

    const tierLabels = ['Tier 1', 'Tier 2', 'Tier 3'];
    const tierPositions = tiers.map((_, i) => padding.left + (i * 2 + 1.5) * barW);
    drawXLabels(ctx, tierLabels, tierPositions, height - padding.bottom + 16);

    const subLabels = ['Traditional', 'Competitive', 'Big Tech+'];
    ctx.fillStyle = '#999';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    subLabels.forEach((label, i) => {
        ctx.fillText(label, tierPositions[i], height - padding.bottom + 30);
    });
}

function drawEquityBreakdown(canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    const padding = { top: 20, right: 100, bottom: 30, left: 100 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    const tiers = [1, 2, 3];
    const barH = chartH / (tiers.length * 2 + 1);
    const compColors = { base: '#607d8b', equity: '#43a047', bonus: '#f9a825' };

    tiers.forEach((t, i) => {
        const bd = COMP_DATA.equityBreakdown[t];
        const y = padding.top + (i * 2 + 0.5) * barH;
        let xOffset = 0;

        ctx.fillStyle = COMP_DATA.tiers[t].color;
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Tier ${t}`, padding.left - 10, y + barH / 2 + 4);

        [
            { pct: bd.basePct, color: compColors.base },
            { pct: bd.equityPct, color: compColors.equity },
            { pct: bd.bonusPct, color: compColors.bonus },
        ].forEach(seg => {
            const segW = (seg.pct / 100) * chartW;
            ctx.fillStyle = seg.color;
            ctx.fillRect(padding.left + xOffset, y, segW, barH);

            if (seg.pct > 12) {
                ctx.fillStyle = '#fff';
                ctx.font = '11px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${seg.pct}%`, padding.left + xOffset + segW / 2, y + barH / 2 + 4);
            }
            xOffset += segW;
        });
    });

    const legendY = padding.top + chartH + 10;
    let lx = padding.left;
    [
        { label: 'Base Salary', color: compColors.base },
        { label: 'Equity/Stock', color: compColors.equity },
        { label: 'Bonus', color: compColors.bonus },
    ].forEach(item => {
        ctx.fillStyle = item.color;
        ctx.fillRect(lx, legendY, 12, 12);
        ctx.fillStyle = '#666';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, lx + 16, legendY + 10);
        lx += ctx.measureText(item.label).width + 36;
    });
}

function drawLevelComparison(canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    const padding = { top: 30, right: 20, bottom: 60, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    clearAndDrawAxes(ctx, width, height, padding, { bgColor: '#fff' });

    const levels = COMP_DATA.levels;
    const tiers = [1, 2, 3];
    const ls = COMP_DATA.usLevelStats;
    const maxVal = Math.max(...levels.flatMap(l => tiers.map(t => ls[l][t].median)));

    const groupW = chartW / levels.length;
    const barW = groupW / (tiers.length + 1);
    const colors = tiers.map(t => COMP_DATA.tiers[t].color);

    levels.forEach((level, li) => {
        tiers.forEach((t, ti) => {
            const x = padding.left + li * groupW + (ti + 0.5) * barW;
            const val = ls[level][t].median;
            const barH = (val / maxVal) * chartH;
            const y = height - padding.bottom - barH;

            ctx.fillStyle = colors[ti];
            ctx.fillRect(x, y, barW - 2, barH);

            ctx.fillStyle = '#333';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(fmtK(val), x + (barW - 2) / 2, y - 5);
        });
    });

    const levelPositions = levels.map((_, i) => padding.left + i * groupW + groupW / 2);
    drawXLabels(ctx, levels, levelPositions, height - padding.bottom + 16);
    ctx.fillStyle = '#999';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    levels.forEach((level, i) => {
        const yoe = { Entry: '0-2 YoE', Mid: '3-5 YoE', Senior: '5-10 YoE', Staff: '10+ YoE' }[level];
        ctx.fillText(yoe, levelPositions[i], height - padding.bottom + 30);
    });

    // Legend
    const tierNames = ['Tier 1 — Traditional', 'Tier 2 — Competitive', 'Tier 3 — Big Tech+'];
    let lx = padding.left;
    ctx.font = '10px Inter, sans-serif';
    tierNames.forEach((name, i) => {
        ctx.fillStyle = colors[i];
        ctx.fillRect(lx, 6, 10, 10);
        ctx.fillStyle = '#555';
        ctx.textAlign = 'left';
        ctx.fillText(name, lx + 13, 15);
        lx += ctx.measureText(name).width + 24;
    });
}

/* ============================================
   COMPENSATION - Tier Explorer Interactive
   ============================================ */

function initCompTierExplorer() {
    const container = document.getElementById('comp-tier-explorer');
    if (!container) return;

    container.innerHTML = `
        <div class="comp-explorer-controls">
            <div class="comp-select-group">
                <label for="comp-country">Country</label>
                <select id="comp-country">
                    <option value="US" selected>United States</option>
                    <option value="Canada">Canada</option>
                </select>
            </div>
            <div class="comp-select-group">
                <label for="comp-level">Level</label>
                <select id="comp-level">
                    <option value="All" selected>All Levels</option>
                    <option value="Entry">Entry (0-2 YoE)</option>
                    <option value="Mid">Mid (3-5 YoE)</option>
                    <option value="Senior">Senior (5-10 YoE)</option>
                    <option value="Staff">Staff (10+ YoE)</option>
                </select>
            </div>
            <div class="comp-explorer-legend">
                <span class="comp-legend-item"><span class="comp-legend-dot" style="background:#78909c"></span>Tier 1</span>
                <span class="comp-legend-item"><span class="comp-legend-dot" style="background:#e07b39"></span>Tier 2</span>
                <span class="comp-legend-item"><span class="comp-legend-dot" style="background:#5a9f68"></span>Tier 3</span>
            </div>
        </div>
        <div class="comp-canvas-wrap">
            <canvas id="comp-explorer-canvas"></canvas>
            <div class="comp-tooltip" id="comp-tooltip"></div>
        </div>
        <div class="comp-stats-row" id="comp-stats-row"></div>
    `;

    const countrySelect = document.getElementById('comp-country');
    const levelSelect = document.getElementById('comp-level');
    const canvas = document.getElementById('comp-explorer-canvas');
    const tooltip = document.getElementById('comp-tooltip');
    const statsRow = document.getElementById('comp-stats-row');

    let currentBins = [];
    let currentPadding = {};
    let currentChartW = 0;

    function update() {
        const country = countrySelect.value;
        const level = levelSelect.value;
        const bins = COMP_DATA.histograms[country][level];
        const stats = country === 'US' ? COMP_DATA.usStats : COMP_DATA.caStats;
        const levelStats = country === 'US' ? COMP_DATA.usLevelStats : COMP_DATA.caLevelStats;

        currentBins = bins;
        drawStackedHistogram(canvas, bins, {
            stats: level === 'All' ? stats : null,
            xLabel: country === 'US' ? 'Total Compensation (USD)' : 'Total Compensation (CAD-equivalent)'
        });

        const rect = canvas.getBoundingClientRect();
        currentPadding = { top: 20, right: 20, bottom: 44, left: 55 };
        currentChartW = rect.width - currentPadding.left - currentPadding.right;

        let statsHtml = '';
        for (let t = 1; t <= 3; t++) {
            const s = level === 'All' ? stats[t] : (levelStats[level] ? levelStats[level][t] : stats[t]);
            const tierInfo = COMP_DATA.tiers[t];
            statsHtml += `
                <div class="comp-stat-card" style="border-top: 3px solid ${tierInfo.color}">
                    <div class="comp-stat-tier" style="color: ${tierInfo.color}">Tier ${t}</div>
                    <div class="comp-stat-name">${tierInfo.name}</div>
                    <div class="comp-stat-median">${fmtK(s.median)}</div>
                    <div class="comp-stat-range">P25: ${fmtK(s.p25)} &mdash; P75: ${fmtK(s.p75)}</div>
                    <div class="comp-stat-count">${s.count} records</div>
                </div>
            `;
        }
        statsRow.innerHTML = statsHtml;
    }

    countrySelect.addEventListener('change', update);
    levelSelect.addEventListener('change', update);

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (!currentBins.length) return;

        const barW = currentChartW / currentBins.length;
        const binIdx = Math.floor((x - currentPadding.left) / barW);

        if (binIdx >= 0 && binIdx < currentBins.length && x >= currentPadding.left) {
            const bin = currentBins[binIdx];
            const total = bin.t1 + bin.t2 + bin.t3;
            tooltip.style.display = 'block';
            tooltip.style.left = `${x + 10}px`;
            tooltip.style.top = `${y - 10}px`;
            tooltip.innerHTML = `<strong>${fmtK(bin.lo)} - ${fmtK(bin.hi)}</strong><br>Tier 1: ${bin.t1} | Tier 2: ${bin.t2} | Tier 3: ${bin.t3}<br>Total: ${total}`;
        } else {
            tooltip.style.display = 'none';
        }
    });

    canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const barW = currentChartW / currentBins.length;
        const binIdx = Math.floor((x - currentPadding.left) / barW);
        if (binIdx >= 0 && binIdx < currentBins.length) {
            const bin = currentBins[binIdx];
            tooltip.style.display = 'block';
            tooltip.style.left = `${x + 10}px`;
            tooltip.style.top = '10px';
            tooltip.innerHTML = `<strong>${fmtK(bin.lo)} - ${fmtK(bin.hi)}</strong><br>T1: ${bin.t1} | T2: ${bin.t2} | T3: ${bin.t3}`;
        }
    });

    canvas.addEventListener('touchend', () => {
        setTimeout(() => { tooltip.style.display = 'none'; }, 2000);
    });

    update();
}
