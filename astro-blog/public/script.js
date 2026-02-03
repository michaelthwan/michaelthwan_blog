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
 * Positional Encoding Visualization
 */
function initPositionalEncodingViz() {
    const grid = document.getElementById('pos-encoding-grid');
    if (!grid) return;
    
    const numPositions = 20;
    const numDimensions = 32;
    const dModel = 64;
    
    // Set grid columns
    grid.style.gridTemplateColumns = `repeat(${numDimensions}, 1fr)`;
    
    for (let pos = 0; pos < numPositions; pos++) {
        for (let i = 0; i < numDimensions; i++) {
            const cell = document.createElement('div');
            cell.className = 'pos-cell';
            
            const dimIndex = Math.floor(i / 2);
            const wavelength = Math.pow(10000, (2 * dimIndex) / dModel);
            
            let value;
            if (i % 2 === 0) {
                value = Math.sin(pos / wavelength);
            } else {
                value = Math.cos(pos / wavelength);
            }
            
            const normalizedValue = (value + 1) / 2;
            cell.style.backgroundColor = valueToColor(normalizedValue);
            cell.title = `pos=${pos}, dim=${i}, value=${value.toFixed(3)}`;
            
            grid.appendChild(cell);
        }
    }
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
