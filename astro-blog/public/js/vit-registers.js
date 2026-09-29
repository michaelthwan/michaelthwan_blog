/**
 * Hijacked-patch explorer
 * For: vit-registers.md
 *
 * Shows the real attention maps from the paper (DINOv2 and DeiT-III, with and
 * without registers). The maps are at patch resolution: a 48 x 48 grid. Patches
 * whose attention is far above their neighbours are detected from the
 * no-register map at load time and circled as "hijacked". Switching to 4
 * registers swaps in the map from the model trained with registers: the specks
 * disappear and the register slots fill instead. Hovering explains each patch.
 */

(function () {
  const root = document.getElementById("vr-hijack");
  if (!root) return;

  const SIZE = 224; // source image size in pixels
  // grid = patches per side in each map (DINOv2 uses 14-pixel patches, DeiT-III 16).
  const MODELS = {
    dinov2: { name: "DINOv2", grid: 48, noReg: "/img/vit-registers/dinov2-0reg-attn.png", reg: "/img/vit-registers/dinov2-4reg-attn.png" },
    deit3: { name: "DeiT-III", grid: 42, noReg: "/img/vit-registers/deit3-0reg-attn.png", reg: "/img/vit-registers/deit3-4reg-attn.png" },
  };

  const stage = root.querySelector(".vr-stage");
  const img = root.querySelector("#vr-hijack-map");
  const overlay = root.querySelector("#vr-hijack-overlay");
  const slots = root.querySelectorAll(".vr-slot");
  const countEl = root.querySelector("#vr-hijack-count");
  const takeaway = root.querySelector("#vr-hijack-takeaway");
  const hoverEl = root.querySelector("#vr-hijack-hover");
  const modelBtns = root.querySelectorAll("[data-model]");
  const regBtns = root.querySelectorAll("[data-reg]");
  const HOVER_IDLE = "Hover over the map to see what a patch is doing.";

  const state = { model: "dinov2", reg: 0 };
  const outliers = {}; // model -> array of {r, q}

  // Brightness at each patch centre.
  function patchBrightness(src, GRID) {
    return new Promise((resolve) => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement("canvas");
        c.width = c.height = SIZE;
        const ctx = c.getContext("2d");
        ctx.drawImage(im, 0, 0, SIZE, SIZE);
        const px = ctx.getImageData(0, 0, SIZE, SIZE).data;
        const cell = SIZE / GRID;
        const v = new Float64Array(GRID * GRID);
        for (let r = 0; r < GRID; r++) {
          for (let q = 0; q < GRID; q++) {
            const x = Math.floor((q + 0.5) * cell), y = Math.floor((r + 0.5) * cell);
            const i = (y * SIZE + x) * 4;
            v[r * GRID + q] = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          }
        }
        resolve(v);
      };
      im.onerror = () => resolve(null);
      im.src = src;
    });
  }

  // A hijacked patch is far brighter than the ring of patches around it in the
  // map without registers, and that brightness is gone in the map with
  // registers (so real attention on the object is not counted).
  function detectOutliers(model) {
    const GRID = model.grid;
    return Promise.all([patchBrightness(model.noReg, GRID), patchBrightness(model.reg, GRID)]).then(([v, withReg]) => {
        if (!v || !withReg) return [];
        const found = [];
        for (let r = 0; r < GRID; r++) {
          for (let q = 0; q < GRID; q++) {
            const nb = [];
            for (let dr = -2; dr <= 2; dr++) {
              for (let dq = -2; dq <= 2; dq++) {
                if (Math.abs(dr) < 2 && Math.abs(dq) < 2) continue; // ring around the patch
                const rr = r + dr, qq = q + dq;
                if (rr >= 0 && rr < GRID && qq >= 0 && qq < GRID) nb.push(v[rr * GRID + qq]);
              }
            }
            nb.sort((a, b) => a - b);
            const med = nb[Math.floor(nb.length / 2)];
            const val = v[r * GRID + q];
            if (val > med + 50 && val > med * 1.6 && val - withReg[r * GRID + q] > 40) found.push({ r, q });
          }
        }
        // Merge touching detections (8-connected) into one speck.
        const key = (p) => p.r * GRID + p.q;
        const todo = new Map(found.map((p) => [key(p), p]));
        const specks = [];
        todo.forEach((start, k0) => {
          if (!todo.has(k0)) return;
          const cells = [];
          const stack = [start];
          todo.delete(k0);
          while (stack.length) {
            const p = stack.pop();
            cells.push(p);
            for (let dr = -1; dr <= 1; dr++) {
              for (let dq = -1; dq <= 1; dq++) {
                const k = (p.r + dr) * GRID + (p.q + dq);
                if (p.q + dq >= 0 && p.q + dq < GRID && todo.has(k)) { stack.push(todo.get(k)); todo.delete(k); }
              }
            }
          }
          specks.push({ cells });
        });
        return specks.map((s) => ({
          r: s.cells.reduce((a, p) => a + p.r, 0) / s.cells.length,
          q: s.cells.reduce((a, p) => a + p.q, 0) / s.cells.length,
          n: s.cells.length,
        }));
    });
  }

  function render() {
    const m = MODELS[state.model];
    img.src = state.reg ? m.reg : m.noReg;
    img.alt = m.name + (state.reg ? " attention map, trained with 4 registers" : " attention map, trained without registers");

    const specks = state.reg ? [] : (outliers[state.model] || []);
    const GRID = m.grid;
    overlay.innerHTML = "";
    specks.forEach((s) => {
      const d = document.createElement("div");
      d.className = "vr-ring";
      d.style.left = ((s.q + 0.5) / GRID * 100) + "%";
      d.style.top = ((s.r + 0.5) / GRID * 100) + "%";
      overlay.appendChild(d);
    });
    slots.forEach((s) => s.classList.toggle("vr-slot-on", !!state.reg));

    modelBtns.forEach((b) => b.classList.toggle("vr-on", b.dataset.model === state.model));
    regBtns.forEach((b) => b.classList.toggle("vr-on", +b.dataset.reg === state.reg));

    const patches = specks.reduce((a, s) => a + s.n, 0);
    countEl.innerHTML = state.reg
      ? "<strong>0</strong> hijacked patches. The image-wide summary now lives in the registers."
      : "<strong>" + specks.length + "</strong> hijacked spots (" + patches + " of " + (GRID * GRID).toLocaleString() + " patches).";

    takeaway.innerHTML = state.reg
      ? "Same architecture and training recipe, plus four empty tokens. The background specks are gone: the model writes its " +
        "image-wide summary into the registers, and every patch goes back to describing its own pixels."
      : "Every circled speck sits on plain background, far from the moth and the flower. Those patches carry almost nothing their " +
        "neighbours do not already say, so the model overwrites them with image-wide information.";
    hoverEl.textContent = HOVER_IDLE;
  }

  stage.addEventListener("mousemove", (e) => {
    const rect = stage.getBoundingClientRect();
    const GRID = MODELS[state.model].grid;
    const q = (e.clientX - rect.left) / rect.width * GRID - 0.5;
    const r = (e.clientY - rect.top) / rect.height * GRID - 0.5;
    const specks = state.reg ? [] : (outliers[state.model] || []);
    const hit = specks.some((s) => Math.abs(s.q - q) <= 1.6 && Math.abs(s.r - r) <= 1.6);
    hoverEl.textContent = hit
      ? "Hijacked patch: plain background whose pixels the model ignores. It stores a summary of the whole image instead, and its token has a very high norm (see Clue 1)."
      : "Normal patch: describes its own small square of the image.";
  });
  stage.addEventListener("mouseleave", () => { hoverEl.textContent = HOVER_IDLE; });

  modelBtns.forEach((b) => b.addEventListener("click", () => { state.model = b.dataset.model; render(); }));
  regBtns.forEach((b) => b.addEventListener("click", () => { state.reg = +b.dataset.reg; render(); }));

  render();
  Promise.all(Object.keys(MODELS).map((k) => detectOutliers(MODELS[k]).then((s) => { outliers[k] = s; })))
    .then(render);
})();
