/**
 * Distill-style Blog JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    initTOCHighlighting();
    initPositionalEncodingViz();
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
