/**
 * Distill-style Blog JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    initTOCHighlighting();
    initPositionalEncodingViz();
    initNormDistributionViz();
});

/**
 * Table of Contents - Active Section Highlighting
 */
function initTOCHighlighting() {
    const tocLinks = document.querySelectorAll('.d-toc-list a');
    const sections = document.querySelectorAll('section[id]');

    if (!tocLinks.length || !sections.length) return;

    const observerOptions = {
        root: null,
        rootMargin: '-100px 0px -70% 0px',
        threshold: 0
    };

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
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
}

/**
 * Interactive Positional Encoding Visualization
 */
function initPositionalEncodingViz() {
    const container = document.getElementById('pos-encoding-interactive');
    if (!container) return;

    const config = {
        numPositions: 30,
        numDimensions: 32,
        dModel: 64,
        selectedPosition: 0
    };

    // Create the UI
    container.innerHTML = `
        <div class="pe-controls">
            <div class="pe-slider-group">
                <label for="pe-position-slider">Position: <span id="pe-position-value">0</span></label>
                <input type="range" id="pe-position-slider" min="0" max="${config.numPositions - 1}" value="0">
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
    grid.style.gridTemplateColumns = `repeat(${config.numDimensions}, 1fr)`;

    const cells = [];
    for (let pos = 0; pos < config.numPositions; pos++) {
        const row = [];
        for (let dim = 0; dim < config.numDimensions; dim++) {
            const cell = document.createElement('div');
            cell.className = 'pe-cell';
            cell.dataset.pos = pos;
            cell.dataset.dim = dim;

            const value = computePE(pos, dim, config.dModel);
            const normalizedValue = (value + 1) / 2;
            cell.style.backgroundColor = valueToColor(normalizedValue);
            cell.title = `pos=${pos}, dim=${dim}\nvalue=${value.toFixed(4)}`;

            // Click to select position
            cell.addEventListener('click', () => {
                slider.value = pos;
                updateSelection(pos);
            });

            grid.appendChild(cell);
            row.push(cell);
        }
        cells.push(row);
    }

    // Slider interaction
    slider.addEventListener('input', (e) => {
        updateSelection(parseInt(e.target.value));
    });

    function updateSelection(pos) {
        config.selectedPosition = pos;
        positionLabel.textContent = pos;
        waveLabel.textContent = pos;

        // Highlight selected row
        cells.forEach((row, rowIdx) => {
            row.forEach(cell => {
                cell.classList.toggle('pe-cell-selected', rowIdx === pos);
            });
        });

        // Draw wave chart
        drawWaveChart(canvas, pos, config);

        // Show values
        showValues(valuesContainer, pos, config);
    }

    // Initial render
    updateSelection(0);
}

/**
 * Compute positional encoding value
 */
function computePE(pos, dim, dModel) {
    const i = Math.floor(dim / 2);
    const wavelength = Math.pow(10000, (2 * i) / dModel);

    if (dim % 2 === 0) {
        return Math.sin(pos / wavelength);
    } else {
        return Math.cos(pos / wavelength);
    }
}

/**
 * Draw the wave chart for a given position
 */
function drawWaveChart(canvas, pos, config) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Draw zero line
    ctx.strokeStyle = '#ddd';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const zeroY = padding.top + chartHeight / 2;
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

    // Compute values
    const values = [];
    for (let dim = 0; dim < config.numDimensions; dim++) {
        values.push(computePE(pos, dim, config.dModel));
    }

    // Draw bars
    const barWidth = chartWidth / config.numDimensions;

    values.forEach((val, dim) => {
        const x = padding.left + dim * barWidth;
        const barHeight = (val / 2) * chartHeight; // Scale -1..1 to chart height
        const y = zeroY - barHeight;

        // Color based on sin/cos
        ctx.fillStyle = dim % 2 === 0 ? '#e07b39' : '#4a90a4';

        if (val >= 0) {
            ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        } else {
            ctx.fillRect(x + 1, zeroY, barWidth - 2, -barHeight);
        }
    });

    // X-axis labels
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    for (let i = 0; i < config.numDimensions; i += 8) {
        ctx.fillText(i.toString(), padding.left + i * barWidth + barWidth / 2, height - padding.bottom + 15);
    }
}

/**
 * Show sample values
 */
function showValues(container, pos, config) {
    const samples = [0, 1, 2, 3, 14, 15, 30, 31].filter(d => d < config.numDimensions);

    let html = '<div class="pe-values-grid">';
    samples.forEach(dim => {
        const val = computePE(pos, dim, config.dModel);
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
 * Map value [0, 1] to diverging color scale
 */
function valueToColor(value) {
    // Blue -> White -> Orange
    const blue = { r: 66, g: 133, b: 244 };
    const white = { r: 255, g: 255, b: 255 };
    const orange = { r: 234, g: 88, b: 12 };

    let r, g, b;

    if (value < 0.5) {
        const t = value * 2;
        r = Math.round(blue.r + (white.r - blue.r) * t);
        g = Math.round(blue.g + (white.g - blue.g) * t);
        b = Math.round(blue.b + (white.b - blue.b) * t);
    } else {
        const t = (value - 0.5) * 2;
        r = Math.round(white.r + (orange.r - white.r) * t);
        g = Math.round(white.g + (orange.g - white.g) * t);
        b = Math.round(white.b + (orange.b - white.b) * t);
    }

    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Interactive Norm Distribution Visualization for ViT Registers post
 */
function initNormDistributionViz() {
    const container = document.getElementById('norm-distribution-interactive');
    if (!container) return;

    // Simulate bimodal distribution data (based on paper's findings)
    const numSamples = 500;
    const data = generateBimodalNormData(numSamples);
    let threshold = 150;

    // Create UI
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

        // Clear
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);

        // Create histogram bins
        const binWidth = 10;
        const maxNorm = 300;
        const numBins = maxNorm / binWidth;
        const bins = new Array(numBins).fill(0);

        data.forEach(norm => {
            const binIndex = Math.min(Math.floor(norm / binWidth), numBins - 1);
            bins[binIndex]++;
        });

        const maxBinCount = Math.max(...bins);

        // Draw axes
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, height - padding.bottom);
        ctx.lineTo(width - padding.right, height - padding.bottom);
        ctx.stroke();

        // Draw threshold line
        const thresholdX = padding.left + (threshold / maxNorm) * chartWidth;
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
            const binStart = i * binWidth;
            const binEnd = (i + 1) * binWidth;
            const x = padding.left + i * barWidth;
            const barHeight = (count / maxBinCount) * chartHeight;
            const y = height - padding.bottom - barHeight;

            // Color based on threshold
            const isOutlier = binStart >= threshold;
            ctx.fillStyle = isOutlier ? '#ef5350' : '#66bb6a';

            ctx.fillRect(x + 1, y, barWidth - 2, barHeight);

            // Count
            if (isOutlier) {
                outlierCount += count;
            } else {
                normalCount += count;
            }
        });

        // Update stats
        const total = normalCount + outlierCount;
        normalCountEl.textContent = normalCount;
        outlierCountEl.textContent = outlierCount;
        normalPctEl.textContent = ((normalCount / total) * 100).toFixed(1);
        outlierPctEl.textContent = ((outlierCount / total) * 100).toFixed(1);

        // X-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i <= maxNorm; i += 50) {
            const x = padding.left + (i / maxNorm) * chartWidth;
            ctx.fillText(i.toString(), x, height - padding.bottom + 15);
        }

        // X-axis title
        ctx.fillText('Token Norm', padding.left + chartWidth / 2, height - 5);

        // Y-axis title
        ctx.save();
        ctx.translate(15, padding.top + chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Count', 0, 0);
        ctx.restore();
    }

    // Initial draw
    drawChart();
}

/**
 * Generate bimodal distribution mimicking ViT norm distribution
 * ~97% normal tokens (centered around 50), ~3% outliers (centered around 180)
 */
function generateBimodalNormData(n) {
    const data = [];
    const outlierRatio = 0.025; // ~2.5% outliers as per paper

    for (let i = 0; i < n; i++) {
        if (Math.random() < outlierRatio) {
            // Outlier distribution: centered around 180, std ~30
            data.push(gaussianRandom(180, 30));
        } else {
            // Normal distribution: centered around 50, std ~20
            data.push(gaussianRandom(50, 20));
        }
    }

    return data.map(v => Math.max(0, Math.min(300, v))); // Clamp to [0, 300]
}

/**
 * Generate Gaussian random number using Box-Muller transform
 */
function gaussianRandom(mean, std) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
}
