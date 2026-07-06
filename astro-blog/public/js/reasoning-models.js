/**
 * GRPO Group-Relative Advantage Explorer
 * For: reasoning-models.md
 *
 * The reader sets the reward of six sampled answers. The module live-computes the
 * group mean, the group standard deviation, and each answer's group-relative
 * advantage  A_i = (r_i - mean) / std.  Positive advantages (pushed up by the
 * policy update) are colored indigo; negative advantages (pushed down) are gray.
 * The point: the baseline is the group mean, so no separate value network is needed.
 */

(function () {
  const container = document.getElementById("rsn-grpo");
  if (!container) return;

  const rowsEl = document.getElementById("rsn-grpo-rows");
  const meanEl = document.getElementById("rsn-grpo-mean");
  const stdEl = document.getElementById("rsn-grpo-std");
  const takeawayEl = document.getElementById("rsn-grpo-takeaway");
  const resetBtn = document.getElementById("rsn-grpo-reset");
  const binaryBtn = document.getElementById("rsn-grpo-preset-binary");
  const sameBtn = document.getElementById("rsn-grpo-preset-same");
  if (!rowsEl) return;

  const N = 6;
  const DEFAULT = [1, 1, 0, 1, 0, 0];
  const ACCENT = "#4f46e5"; // pushed up
  const DOWN = "#94a3b8"; // pushed down
  const EPS = 1e-8;
  const MAX_ABS_A = 2.2; // advantage magnitude that fills the bar track

  let rewards = DEFAULT.slice();

  // Per-row DOM handles
  const sliders = [];
  const rewardOut = [];
  const advBars = [];
  const advOut = [];
  const rowBoxes = [];

  function buildRows() {
    rowsEl.innerHTML = "";
    for (let i = 0; i < N; i++) {
      const row = document.createElement("div");
      row.className = "rsn-grpo-row";

      // label
      const label = document.createElement("div");
      label.className = "rsn-grpo-label";
      label.innerHTML = "answer o<sub>" + (i + 1) + "</sub>";
      row.appendChild(label);

      // reward slider + value
      const ctrl = document.createElement("div");
      ctrl.className = "rsn-grpo-ctrl";
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "1";
      slider.step = "0.05";
      slider.value = String(rewards[i]);
      slider.className = "rsn-grpo-slider";
      slider.setAttribute("aria-label", "reward for answer " + (i + 1));
      slider.addEventListener("input", function () {
        const v = parseFloat(slider.value);
        rewards[i] = isNaN(v) ? 0 : v;
        recompute();
      });
      const rout = document.createElement("span");
      rout.className = "rsn-grpo-reward-val";
      ctrl.appendChild(slider);
      ctrl.appendChild(rout);
      row.appendChild(ctrl);

      // advantage bar (center-anchored track)
      const track = document.createElement("div");
      track.className = "rsn-grpo-track";
      const center = document.createElement("div");
      center.className = "rsn-grpo-center";
      const bar = document.createElement("div");
      bar.className = "rsn-grpo-bar";
      track.appendChild(center);
      track.appendChild(bar);
      const aout = document.createElement("span");
      aout.className = "rsn-grpo-adv-val";
      const advWrap = document.createElement("div");
      advWrap.className = "rsn-grpo-advwrap";
      advWrap.appendChild(track);
      advWrap.appendChild(aout);
      row.appendChild(advWrap);

      rowsEl.appendChild(row);

      sliders[i] = slider;
      rewardOut[i] = rout;
      advBars[i] = bar;
      advOut[i] = aout;
      rowBoxes[i] = row;
    }
  }

  function mean(arr) {
    let s = 0;
    for (let k = 0; k < arr.length; k++) s += arr[k];
    return s / arr.length;
  }

  function std(arr, mu) {
    let s = 0;
    for (let k = 0; k < arr.length; k++) s += (arr[k] - mu) * (arr[k] - mu);
    return Math.sqrt(s / arr.length);
  }

  function recompute() {
    const mu = mean(rewards);
    const sigma = std(rewards, mu);
    const degenerate = sigma < 1e-6;

    if (meanEl) meanEl.textContent = mu.toFixed(2);
    if (stdEl) stdEl.textContent = sigma.toFixed(2);

    for (let i = 0; i < N; i++) {
      if (rewardOut[i]) rewardOut[i].textContent = rewards[i].toFixed(2);

      const a = degenerate ? 0 : (rewards[i] - mu) / (sigma + EPS);
      const frac = Math.max(-1, Math.min(1, a / MAX_ABS_A));
      const pct = Math.abs(frac) * 50; // half-track max

      const bar = advBars[i];
      if (bar) {
        if (a >= 0) {
          bar.style.left = "50%";
          bar.style.right = "auto";
          bar.style.background = ACCENT;
        } else {
          bar.style.right = "50%";
          bar.style.left = "auto";
          bar.style.background = DOWN;
        }
        bar.style.width = pct + "%";
      }

      if (advOut[i]) {
        advOut[i].textContent = (a >= 0 ? "+" : "") + a.toFixed(2);
        advOut[i].style.color = degenerate ? "#9ca3af" : a >= 0 ? "#4338ca" : "#64748b";
      }

      if (rowBoxes[i]) {
        rowBoxes[i].style.background = degenerate
          ? "transparent"
          : a > 0
          ? "rgba(79,70,229,0.06)"
          : a < 0
          ? "rgba(148,163,184,0.10)"
          : "transparent";
      }
    }

    if (takeawayEl) {
      if (degenerate) {
        takeawayEl.innerHTML =
          "All six rewards are equal, so the standard deviation is zero and <strong>every advantage is 0</strong>. " +
          "The batch produces no gradient. A group with no spread teaches the policy nothing &mdash; " +
          "learning needs some answers to beat others.";
      } else {
        takeawayEl.innerHTML =
          "The baseline is just the <strong>group mean (" +
          mu.toFixed(2) +
          ")</strong>, estimated from the sampled answers themselves. Answers above it get a positive advantage and are reinforced; " +
          "answers below it are suppressed. <strong>No value network is trained</strong> &mdash; the group is the baseline.";
      }
    }
  }

  function setAll(vals) {
    rewards = vals.slice();
    for (let i = 0; i < N; i++) if (sliders[i]) sliders[i].value = String(rewards[i]);
    recompute();
  }

  if (resetBtn) resetBtn.addEventListener("click", function () { setAll(DEFAULT); });
  if (binaryBtn) binaryBtn.addEventListener("click", function () { setAll([1, 0, 1, 0, 0, 1]); });
  if (sameBtn) sameBtn.addEventListener("click", function () { setAll([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]); });

  buildRows();
  recompute();
})();
