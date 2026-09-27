/**
 * Jev-as-router interactive
 * For: jev.md
 *
 * Every request goes to Jev first. If Jev's top probability clears the threshold
 * tau, the tool is called directly; otherwise the request escalates to a reasoning
 * LLM. The reader moves tau and sees share handled by Jev, overall accuracy,
 * cost, latency, and whether the accuracy Jev claims matches what it delivers.
 *
 * Simulated data: each request has a true probability q that the top pick is
 * right (logit z ~ Normal(0, 2.2)). A model reports the logit T_model * z, so
 * T_model > 1 is overconfident. Temperature refit divides by T_fix = T_model.
 * Expected accuracy per request is max(q, 1 - q) regardless of temperature;
 * temperature only changes the confidence claimed. T_model = 3.29 is the refit
 * temperature a community study measured for Jev's Choice answers (Sept 19 2026,
 * collected in Rajesh Beri's write-up). Cost/latency figures are illustrative.
 */

(function () {
  const root = document.getElementById("jev-router");
  if (!root) return;

  const N = 4000;
  const T_MODEL = { calib: 1.0, over: 3.29 };
  const JEV = { cost: 0.04, latency: 0.3 }; // $ per 1,000 requests, seconds
  const LLM = { cost: 5.0, latency: 8.0, acc: 0.97 };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(20260927);
  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));

  const Z = new Float64Array(N);
  const ACC = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    Z[i] = gauss() * 2.2;
    const q = sigmoid(Z[i]);
    ACC[i] = Math.max(q, 1 - q);
  }

  const $ = (id) => document.getElementById(id);
  const presetSel = $("jev-router-preset");
  const refit = $("jev-router-refit");
  const slider = $("jev-router-tau");
  const pct = (x, d) => (x * 100).toFixed(d === undefined ? 1 : d) + "%";

  function update() {
    const tModel = T_MODEL[presetSel.value];
    const tFix = refit.checked ? tModel : 1;
    const tau = parseFloat(slider.value);
    $("jev-router-tau-val").textContent = tau.toFixed(2);

    let n = 0, sumConf = 0, sumAcc = 0;
    for (let i = 0; i < N; i++) {
      const p = sigmoid((tModel * Z[i]) / tFix);
      const conf = Math.max(p, 1 - p);
      if (conf >= tau) { n++; sumConf += conf; sumAcc += ACC[i]; }
    }
    const handled = n / N;
    const claimed = n ? sumConf / n : 0;
    const delivered = n ? sumAcc / n : 0;
    const overall = (sumAcc + (N - n) * LLM.acc) / N;
    const cost = JEV.cost + (1 - handled) * LLM.cost;
    const latency = JEV.latency + (1 - handled) * LLM.latency;

    $("jev-router-handled").textContent = pct(handled, 0);
    $("jev-router-acc").textContent = pct(overall);
    $("jev-router-cost").textContent = "$" + cost.toFixed(2);
    $("jev-router-latency").textContent = latency.toFixed(1) + " s";
    $("jev-router-claimed").textContent = n ? pct(claimed) : "–";
    $("jev-router-delivered").textContent = n ? pct(delivered) : "–";
    $("jev-router-delivered").classList.toggle("jev-warn", n > 0 && claimed - delivered > 0.02);

    const wrong = n ? (n - sumAcc) / N : 0;
    $("jev-router-seg-ok").style.width = ((handled - wrong) * 100).toFixed(2) + "%";
    $("jev-router-seg-bad").style.width = (wrong * 100).toFixed(2) + "%";
    $("jev-router-seg-llm").style.width = ((1 - handled) * 100).toFixed(2) + "%";

    let msg;
    if (!n) {
      msg = "Jev is never confident enough, so every request pays for the LLM. You have added a step and saved nothing.";
    } else if (claimed - delivered > 0.02) {
      msg = "The router is <strong>leaking</strong>. Jev handles " + pct(handled, 0) + " of requests claiming " + pct(claimed) +
        " accuracy, but delivers " + pct(delivered) + ". Cost and latency look great; the errors are the price. " +
        "Tick <em>apply temperature refit</em> to see the same threshold with honest probabilities.";
    } else {
      msg = "The threshold <strong>means what it says</strong>: Jev's claimed and delivered accuracy match. " +
        "Raise it and more requests pay for the LLM; lower it and Jev handles more, with a known error rate.";
    }
    $("jev-router-takeaway").innerHTML = msg;
  }

  [presetSel, refit, slider].forEach((c) => c.addEventListener("input", update));
  presetSel.addEventListener("change", update);
  update();
})();
