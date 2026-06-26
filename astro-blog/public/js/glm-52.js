/**
 * GLM-5.2 — IndexShare FLOPs Visualizer
 * Simplified per-token compute model illustrating how IndexShare reduces the cost
 * of sparse-attention indexing at long context.
 *
 *   Standard DSA  : L * (D + alpha * n)        -- indexer runs every layer
 *   IndexShare    : L * D + (L / g) * alpha*n  -- indexer runs once per group of g layers
 *
 * Constants are tuned so that n = 1M, g = 4 yields the ~2.9x reduction Z.ai reports.
 */
(function () {
    const root = document.getElementById("indexshare-interactive");
    if (!root) return;

    const L = 92;          // layers
    const D = 145000;      // per-layer context-independent compute (relative units)
    const ALPHA = 1;       // indexer cost per context token, per layer

    // Slider step -> context length in tokens (log-ish scale)
    const CTX = [4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000, 1000000];

    const ctxSlider   = document.getElementById("glm-ctx");
    const groupSlider = document.getElementById("glm-group");
    const ctxVal      = document.getElementById("glm-ctx-val");
    const groupVal    = document.getElementById("glm-group-val");
    const barStd      = document.getElementById("glm-bar-standard");
    const barShare    = document.getElementById("glm-bar-share");
    const numStd      = document.getElementById("glm-num-standard");
    const numShare    = document.getElementById("glm-num-share");
    const reduction   = document.getElementById("glm-reduction");
    const saved       = document.getElementById("glm-saved");
    const stale       = document.getElementById("glm-stale");

    function fmtTokens(n) {
        if (n >= 1000000) return (n / 1000000) + "M";
        return (n / 1000) + "K";
    }

    // Render a relative-compute number in compact units.
    function fmtCompute(x) {
        const m = x / 1e6;
        return m.toFixed(m < 10 ? 2 : 1) + " GU"; // "giga-units"
    }

    function update() {
        const n = CTX[parseInt(ctxSlider.value, 10)];
        const g = parseInt(groupSlider.value, 10);

        const standard = L * (D + ALPHA * n);
        const share    = L * D + (L / g) * ALPHA * n;

        const ratio   = standard / share;
        const savedPct = (1 - share / standard) * 100;

        // Bar widths: standard is always the reference (100%).
        barStd.style.width = "100%";
        barShare.style.width = Math.max(2, (share / standard) * 100) + "%";

        numStd.textContent   = fmtCompute(standard);
        numShare.textContent = fmtCompute(share);

        ctxVal.textContent   = fmtTokens(n);
        groupVal.textContent = g;
        reduction.textContent = ratio.toFixed(2);
        saved.textContent    = savedPct.toFixed(0) + "%";

        // Staleness commentary tied to group size.
        if (g === 1) {
            stale.textContent = "plain DSA, indices always fresh";
        } else if (g <= 4) {
            stale.textContent = "indices up to " + (g - 1) + " layers stale (GLM-5.2 trains for this)";
        } else {
            stale.textContent = "indices up to " + (g - 1) + " layers stale — quality risk";
        }
    }

    ctxSlider.addEventListener("input", update);
    groupSlider.addEventListener("input", update);
    update();
})();
