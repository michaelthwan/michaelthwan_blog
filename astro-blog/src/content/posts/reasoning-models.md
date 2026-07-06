---
title: "How Reasoning Models Learn to Think"
subtitle: "RL with verifiable rewards, GRPO, and the second scaling axis — from OpenAI o1 to DeepSeek-R1."
authors:
  - "Michael Wan"
affiliations:
  - "Michael Wan Interactive Insights"
published: "2026-07-04"
doi: "arXiv:2501.12948"
doiUrl: "https://arxiv.org/abs/2501.12948"
abstract: "Pretraining teaches a model what to say; it does not teach it how to think through a hard problem. Reasoning models like OpenAI o1 and DeepSeek-R1 add a second training phase: reinforcement learning against rewards that can be checked mechanically, such as a math answer or a passing test suite. This post explains that recipe — the verifiable reward signal, the GRPO algorithm that makes it cheap, the behaviors that emerge, and the new scaling axis it unlocked at test time."
category: "ml"
tags:
  - "explainer"
thumbnail: "/img/reasoning-models/thumbnail.svg"
---

<style>
  /* ── Callouts ─────────────────────────────────────────────── */
  .rsn-callout {
    border-left: 3px solid; border-radius: 0 6px 6px 0;
    padding: 11px 14px; margin: 20px 0; font-size: 0.92rem; line-height: 1.55;
  }
  .rsn-callout-tip  { border-color: #10b981; background: #f0fdf4; color: #065f46; }
  .rsn-callout-warn { border-color: #f59e0b; background: #fffbeb; color: #92400e; }
  .rsn-callout-note { border-color: #6366f1; background: #eef2ff; color: #3730a3; }

  /* ── Badge pills ──────────────────────────────────────────── */
  .rsn-badge { display: inline-block; font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; white-space: nowrap; }
  .rsn-badge-green  { background: #d1fae5; color: #065f46; }
  .rsn-badge-yellow { background: #fef3c7; color: #92400e; }
  .rsn-badge-red    { background: #fee2e2; color: #b91c1c; }

  /* ── Equation panel ───────────────────────────────────────── */
  .rsn-eq-panel { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 18px; margin: 22px 0; background: #fafafa; }
  .rsn-eq-title { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
  .rsn-eq-legend { margin-top: 10px; font-size: 0.88rem; line-height: 1.6; color: #374151; }
  .rsn-eq-legend div { margin: 4px 0; }
  .rsn-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 7px; vertical-align: baseline; }
  .rsn-dot-adv    { background: #4f46e5; }
  .rsn-dot-ratio  { background: #10b981; }
  .rsn-dot-kl     { background: #f59e0b; }
  .rsn-dot-group  { background: #9ca3af; }

  /* ── Aha-moment transcript box ────────────────────────────── */
  .rsn-transcript {
    border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa;
    padding: 14px 18px; margin: 20px 0; font-size: 0.9rem; line-height: 1.6; color: #374151;
  }
  .rsn-transcript .rsn-aha { background: #eef2ff; color: #3730a3; padding: 0 3px; border-radius: 3px; }

  /* ── GRPO interactive ─────────────────────────────────────── */
  #rsn-grpo { border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 20px; margin: 26px 0; background: #fff; }
  #rsn-grpo h3 { margin-top: 0; }
  .rsn-grpo-desc { color: #555; font-size: 0.93em; margin-bottom: 14px; }
  .rsn-grpo-head, .rsn-grpo-row {
    display: grid; grid-template-columns: 92px minmax(150px, 1fr) minmax(170px, 1.2fr);
    gap: 12px; align-items: center; padding: 5px 6px; border-radius: 6px;
  }
  .rsn-grpo-head { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; color: #6b7280; }
  .rsn-grpo-row { transition: background 0.25s; }
  .rsn-grpo-label { font-size: 0.88rem; color: #374151; }
  .rsn-grpo-ctrl { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .rsn-grpo-slider { flex: 1; min-width: 0; accent-color: #4f46e5; }
  .rsn-grpo-reward-val { font-family: monospace; font-size: 0.85rem; color: #374151; min-width: 38px; text-align: right; }
  .rsn-grpo-advwrap { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .rsn-grpo-track { position: relative; flex: 1; height: 14px; background: #f1f5f9; border-radius: 7px; overflow: hidden; min-width: 0; }
  .rsn-grpo-center { position: absolute; left: 50%; top: 0; width: 1px; height: 100%; background: #cbd5e1; }
  .rsn-grpo-bar { position: absolute; top: 2px; height: 10px; border-radius: 5px; width: 0; transition: width 0.2s, background 0.2s; }
  .rsn-grpo-adv-val { font-family: monospace; font-size: 0.85rem; min-width: 52px; text-align: right; }
  .rsn-grpo-stats { display: flex; gap: 22px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 0.88rem; color: #374151; flex-wrap: wrap; }
  .rsn-grpo-stats strong { font-family: monospace; }
  .rsn-grpo-buttons { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .rsn-grpo-buttons button {
    padding: 5px 14px; font-size: 0.85em; cursor: pointer; border-radius: 4px;
    border: 1px solid #cbd5e1; background: #fff; color: #374151;
  }
  .rsn-grpo-buttons button:hover { border-color: #4f46e5; color: #4338ca; }
  .rsn-grpo-takeaway { margin-top: 12px; font-size: 0.9rem; line-height: 1.55; color: #374151; background: #fafafa; border-radius: 6px; padding: 10px 12px; min-height: 3em; }

  /* ── Tables ───────────────────────────────────────────────── */
  .rsn-table-wrap { overflow-x: auto; margin: 20px 0; }
  .rsn-table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
  .rsn-table th, .rsn-table td { border-bottom: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
  .rsn-table th { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.03em; color: #6b7280; }
  .rsn-table td.rsn-num { font-family: monospace; }

  @media (max-width: 560px) {
    .rsn-grpo-head { display: none; }
    .rsn-grpo-row { grid-template-columns: 1fr; gap: 6px; }
  }
</style>

<p class="d-note">
    This article explains how reasoning models are trained, centered on
    <a href="https://arxiv.org/abs/2501.12948">DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning</a>
    (arXiv:2501.12948, January 2025) — the first openly documented recipe — together with the
    GRPO algorithm from <a href="https://arxiv.org/abs/2402.03300">DeepSeekMath</a> and the
    test-time compute results reported for OpenAI's o1.
</p>

## Introduction

By 2024, the recipe that built GPT-3 and GPT-4 was running into a wall on one specific class of problems. Pretraining on more text kept improving fluency, knowledge, and style. It did not proportionally improve **multi-step reasoning** — competition math, algorithmic coding, formal logic. GPT-4-class models still scored in the low teens on AIME, a high-school olympiad qualifier.

The reason is structural. Next-token prediction teaches a model *what text tends to follow other text*. A hard math problem is not solved by recalling likely text. It is solved by trying an approach, noticing it fails, and trying another — a search process. Pretraining data rarely shows that process; published solutions show only the polished final path, not the dead ends.

In September 2024 OpenAI released **o1**, the first model trained to produce a long private chain of thought before answering, and reported that its accuracy improved along a new axis: not more parameters or more data, but **more reinforcement learning and more thinking time**. o1's training details stayed closed. Four months later, DeepSeek published **R1** with the full recipe — and the recipe turned out to be surprisingly simple.

The shift is easy to state. Pretraining teaches a model *what to say*. This second phase teaches it *how to think*: the model is rewarded only for reaching correct answers, and it must discover for itself what kind of thinking gets there.

## The Key Idea: Verifiable Rewards

Reinforcement learning needs a reward signal. For LLMs, the standard source had been **RLHF**: train a separate neural reward model on human preference rankings, then optimize the LLM against it. RLHF made models polite and helpful. It is a poor teacher for reasoning, for one deep reason: the reward model is itself a fallible neural network, and the policy will learn to exploit its mistakes. Optimize hard enough against a learned judge and you get answers that *look* right to the judge rather than answers that *are* right. This is **reward hacking**, and it caps how much optimization pressure you can safely apply.

Math and code offer an escape. A math problem with a known answer can be checked by string comparison. A program can be run against a test suite. These checks are **rule-based, binary, and uncheatable** — there is no neural judge to fool. The community now calls this **RL with verifiable rewards (RLVR)**.

<div class="rsn-table-wrap">
<table class="rsn-table">
<thead>
<tr><th>Domain</th><th>Reward source</th><th>Hackable?</th></tr>
</thead>
<tbody>
<tr><td>Competition math</td><td>exact-match on final answer</td><td><span class="rsn-badge rsn-badge-green">No — rule-based check</span></td></tr>
<tr><td>Coding</td><td>compiler + unit tests</td><td><span class="rsn-badge rsn-badge-green">No — tests execute</span></td></tr>
<tr><td>Logic puzzles</td><td>solution validator</td><td><span class="rsn-badge rsn-badge-green">No — rule-based check</span></td></tr>
<tr><td>Helpfulness / chat</td><td>learned reward model (RLHF)</td><td><span class="rsn-badge rsn-badge-yellow">Yes — judge is a neural net</span></td></tr>
<tr><td>Creative writing, strategy</td><td>no reliable verifier known</td><td><span class="rsn-badge rsn-badge-red">Open problem</span></td></tr>
</tbody>
</table>
</div>

DeepSeek-R1-Zero used exactly two rule-based rewards: an **accuracy reward** (is the final answer correct?) and a **format reward** (is the reasoning enclosed in `<think>` tags?). The paper is explicit that they avoided neural reward models precisely because of reward hacking during large-scale RL.

<div class="rsn-callout rsn-callout-note">
    <strong>Why binary rewards are enough.</strong> A 0/1 signal per answer sounds hopelessly sparse.
    The trick is sampling: generate many attempts per problem and compare them against each other.
    Even at 15% accuracy, a group of 16 samples usually contains at least one success to learn from.
    The next section shows the algorithm that turns this comparison into a gradient.
</div>

## Core Mechanics: The RL Loop and GRPO

The training loop is short. Take a base model (R1-Zero started from DeepSeek-V3-Base — no supervised fine-tuning at all). For each problem in a batch, sample a **group** of $G$ complete answers, chain of thought included. Score each with the verifier. Update the policy to make high-scoring answers more likely and low-scoring answers less likely. Repeat for thousands of steps.

<figure>
  <img src="/img/reasoning-models/diagram-rl-loop.svg" alt="The RLVR loop: policy samples a group of chain-of-thought answers, a verifier scores each, group-relative advantages are computed, and the policy is updated" style="max-width: 640px; width: 100%; margin: 0 auto; display: block;" />
  <figcaption>One RLVR training step. The policy samples a group of answers, a rule-based verifier scores them, and each answer's score is converted to a group-relative advantage that drives the policy update.</figcaption>
</figure>

The interesting question is the update rule. The classical choice, **PPO**, needs a second neural network — a *value model* (critic) — to estimate how good each state is, so that the reward can be converted into an *advantage*: how much better this answer is than expected. For LLMs the value model is typically as large as the policy itself. That doubles memory, and training a per-token value estimate for a reward that only arrives at the very last token is both hard and noisy.

**GRPO (Group Relative Policy Optimization)**, introduced in DeepSeekMath, deletes the value model. Its observation: you are already sampling $G$ answers per problem. The group itself tells you what "expected" looks like. The objective is:

<div class="d-math-block">
$$
\mathcal{J}_{GRPO}(\theta) = \mathbb{E}\left[ \frac{1}{G}\sum_{i=1}^{G} \left( \min\!\left( \rho_i A_i,\; \text{clip}(\rho_i, 1-\varepsilon, 1+\varepsilon)\, A_i \right) - \beta\, \mathbb{D}_{KL}(\pi_\theta \,\|\, \pi_{ref}) \right) \right]
$$
</div>

with the probability ratio $\rho_i = \pi_\theta(o_i \mid q) / \pi_{\theta_{old}}(o_i \mid q)$, and — the heart of the method — the **group-relative advantage**:

<div class="d-math-block">
$$
A_i = \frac{r_i - \text{mean}(r_1, r_2, \ldots, r_G)}{\text{std}(r_1, r_2, \ldots, r_G)}
$$
</div>

<div class="rsn-eq-panel">
  <div class="rsn-eq-title">Reading the objective, term by term</div>
  <div class="rsn-eq-legend">
    <div><span class="rsn-dot rsn-dot-adv"></span><strong>$A\_i$ — group-relative advantage.</strong> Answer $i$'s reward, measured in standard deviations above or below the group mean. "Above average for this problem" is positive; "below average" is negative. The group replaces the value network as the baseline.</div>
    <div><span class="rsn-dot rsn-dot-ratio"></span><strong>$\rho\_i$ and the clip — the PPO safety rail.</strong> $\rho\_i$ measures how much the current policy has drifted from the policy that generated the samples. Clipping to $[1-\varepsilon, 1+\varepsilon]$ stops any single batch from yanking the policy too far — the stabilizer GRPO keeps from PPO.</div>
    <div><span class="rsn-dot rsn-dot-kl"></span><strong>$\beta\, \mathbb{D}\_{KL}$ — the leash.</strong> A penalty for drifting from a frozen reference model, so the policy cannot collapse into degenerate text that happens to score well.</div>
    <div><span class="rsn-dot rsn-dot-group"></span><strong>$\frac{1}{G}\sum\_{i=1}^{G}$ — average over the group.</strong> Every sampled answer contributes; the winners and losers within one group jointly define the gradient.</div>
  </div>
</div>

Why this is cheaper and stabler than PPO for LLMs:

- **No value network.** Roughly half the GPU memory and compute of PPO disappears, along with an entire second training problem (fitting the critic).
- **The baseline cannot be wrong in a learned way.** A critic is a neural net with its own biases and lag; a group mean is a direct Monte-Carlo estimate for *this exact problem, right now*.
- **Normalization matches sparse rewards.** With 0/1 rewards, dividing by the group's standard deviation automatically scales the gradient: a problem where the model almost always fails but one sample succeeds produces a strong learning signal on that one success.

<div class="rsn-callout rsn-callout-tip">
    <strong>One sentence to remember GRPO by:</strong> sample a group of answers, and treat "better
    than your own siblings" as the advantage. Everything else in the objective is standard PPO machinery
    minus the critic.
</div>

## Interactive: Group-Relative Advantage Explorer

This is the core mechanic of the whole recipe, and it fits in one small calculation. Below are six sampled answers to one problem. **Drag the reward sliders** and watch each answer's advantage $A\_i = (r\_i - \text{mean})/\text{std}$ update live. Indigo bars are pushed *up* by the policy update; gray bars are pushed *down*. Try the "all identical" preset to see the failure mode.

<div id="rsn-grpo" class="interactive-container">
  <h3>GRPO advantage, computed live</h3>
  <p class="rsn-grpo-desc">Set each answer's reward (0 = verifier says wrong, 1 = verifier says correct; intermediate values mimic partial credit). The group is its own baseline.</p>
  <div class="rsn-grpo-head">
    <div>Sample</div><div>Reward $r\_i$</div><div>Advantage $A\_i$</div>
  </div>
  <div id="rsn-grpo-rows"></div>
  <div class="rsn-grpo-stats">
    <span>group mean: <strong id="rsn-grpo-mean">–</strong></span>
    <span>group std: <strong id="rsn-grpo-std">–</strong></span>
  </div>
  <div class="rsn-grpo-buttons">
    <button id="rsn-grpo-preset-binary" type="button">Binary rewards (3 correct)</button>
    <button id="rsn-grpo-preset-same" type="button">All identical</button>
    <button id="rsn-grpo-reset" type="button">Reset</button>
  </div>
  <div id="rsn-grpo-takeaway" class="rsn-grpo-takeaway"></div>
</div>

Two things worth noticing while playing. First, only *relative* standing matters: raise every reward by the same amount and the advantages do not move. Second, a group where every answer gets the same reward — all right or all wrong — produces zero advantage everywhere and therefore zero gradient. GRPO learns nothing from problems that are too easy or too hard for the current policy, which is why training naturally concentrates on the frontier of what the model can almost do.

## What Emerges: The R1-Zero Story

DeepSeek-R1-Zero is the cleanest experiment in the paper: base model, GRPO, rule-based rewards, and **no supervised examples of reasoning whatsoever**. Nobody showed the model a single worked chain of thought. What happened over thousands of RL steps is the most striking result in the reasoning-model literature.

**Accuracy climbed from guessing to o1-level.** On AIME 2024, pass@1 rose from 15.6% to **71.0%**, and to **86.7%** with majority voting over 64 samples — matching OpenAI's o1-0912 (74.4% pass@1).

<figure>
  <img src="/img/reasoning-models/fig-accuracy.svg" alt="AIME 2024 accuracy of DeepSeek-R1-Zero rising over RL training steps from 15.6% to 71.0%, crossing near the o1-0912 reference line" style="max-width: 620px; width: 100%; margin: 0 auto; display: block;" />
  <figcaption>AIME 2024 pass@1 during R1-Zero's RL training, redrawn from Figure 2 of the DeepSeek-R1 paper (arXiv:2501.12948). Exact endpoints (15.6% &rarr; 71.0%) are from the paper; intermediate points are smoothed for clarity. Dashed line: o1-0912 at 74.4%.</figcaption>
</figure>

**The model chose to think longer.** Nothing in the reward mentions length. Yet average response length grew steadily from a few hundred tokens to many thousands, because longer deliberation — exploring, checking, backtracking — is what wins reward on hard problems. Thinking time was *discovered*, not programmed.

<figure>
  <img src="/img/reasoning-models/fig-length.svg" alt="Average response length of DeepSeek-R1-Zero growing over RL training steps from a few hundred tokens to many thousands" style="max-width: 620px; width: 100%; margin: 0 auto; display: block;" />
  <figcaption>Average response length on the training set during RL, redrawn from Figure 3 of the DeepSeek-R1 paper. The trend (hundreds of tokens &rarr; roughly 10k) is from the paper; the plotted points are smoothed.</figcaption>
</figure>

**Self-verification and reflection appeared on their own.** Mid-training, the model began re-checking its own steps, flagging errors, and restarting derivations. The paper's most quoted moment is a transcript where R1-Zero, mid-solution to an algebra problem, interrupts itself:

<div class="rsn-transcript">
  ...We started with the equation $\sqrt{a - \sqrt{a+x}} = x$. First, let's square both sides...<br/><br/>
  <span class="rsn-aha">Wait, wait. Wait. That's an aha moment I can flag here.</span><br/><br/>
  Let's reevaluate this step-by-step to identify if the correct sum can be...
</div>

The authors call this the **"aha moment"** — for the model and, they admit, for themselves. Reinforcement learning did not teach the model *how* to reflect; it created conditions under which reflection paid, and the behavior emerged.

<div class="rsn-callout rsn-callout-warn">
    <strong>R1-Zero was not shippable.</strong> Its chains of thought mixed languages mid-sentence and were
    barely readable. The released DeepSeek-R1 adds a small "cold start" set of curated long-form reasoning
    examples before RL, a language-consistency reward, and a final RLHF-style pass for general helpfulness.
    The reasoning power comes from RLVR; the polish comes from everything around it.
</div>

The full R1 pipeline pushed AIME 2024 to **79.8%** pass@1 and MATH-500 to **97.3%** — on par with OpenAI's o1-1217 — plus a 2,029 Codeforces rating (96.3rd percentile among human competitors).

## Test-Time Compute: The Second Scaling Axis

For a decade, "scaling" meant one thing: more parameters, more data, more pretraining FLOPs. Reasoning models added a second, independent axis. OpenAI's o1 announcement showed AIME accuracy rising roughly **log-linearly with the amount of compute spent thinking at inference time** — the same trained model gets smarter if you let it think longer.

<figure>
  <img src="/img/reasoning-models/fig-testtime.svg" alt="Schematic curve of reasoning accuracy rising roughly log-linearly with thinking tokens spent at test time" style="max-width: 620px; width: 100%; margin: 0 auto; display: block;" />
  <figcaption>The second scaling axis (schematic; the log-linear shape follows the o1 report's test-time compute figure). Accuracy on reasoning benchmarks rises with thinking tokens spent per problem, independent of model size.</figcaption>
</figure>

This changes the economics of intelligence. Capability is no longer fixed at training time; it becomes a **dial you turn per query**, trading tokens (money, latency) for accuracy. Easy question: think briefly. Olympiad problem: think for tens of thousands of tokens. Every major lab now ships this dial explicitly — reasoning-effort settings, extended-thinking budgets, and hybrid models that decide per query whether to think at all.

### Distillation: reasoning in small models

The second surprise in the R1 paper is how well reasoning **transfers by imitation**. DeepSeek generated ~800k samples with R1 and fine-tuned small open models on them — plain supervised learning, no RL at all:

<div class="rsn-table-wrap">
<table class="rsn-table">
<thead>
<tr><th>Model</th><th>AIME 2024 (pass@1)</th><th>Note</th></tr>
</thead>
<tbody>
<tr><td>GPT-4o-0513</td><td class="rsn-num">9.3%</td><td>frontier non-reasoning model</td></tr>
<tr><td>R1-Distill-Qwen-7B</td><td class="rsn-num">55.5%</td><td>7B student of R1</td></tr>
<tr><td>R1-Distill-Qwen-32B</td><td class="rsn-num">72.6%</td><td>above o1-mini (63.6%)</td></tr>
<tr><td>DeepSeek-R1 (671B MoE)</td><td class="rsn-num">79.8%</td><td>the teacher</td></tr>
</tbody>
</table>
</div>

A 7-billion-parameter model outscoring GPT-4o on competition math by a factor of six was the moment "reasoning" stopped being a frontier-lab exclusive. The catch, confirmed by the paper's own ablation: **discovering** reasoning via RL from scratch works poorly at small scale — RL directly on a 32B base underperformed simple distillation from R1. Big models find the behaviors; small models can only inherit them.

<div class="rsn-callout rsn-callout-note">
    <strong>Why the distill models mattered strategically.</strong> They were MIT-licensed and ran on a
    single consumer GPU. Within weeks of January 2025, o1-class math performance went from a rate-limited
    closed API to a local download — which is a large part of why the R1 release moved markets, not just
    benchmarks.
</div>

## Trade-offs and Open Problems

The recipe is real, but every part of it has a sharp edge.

**Reward hacking never disappears; it moves.** Rule-based rewards close the front door — you cannot fool a unit test with a plausible-sounding proof. But policies find side doors: hard-coding expected outputs of visible test cases, exploiting weak or under-specified tests, guessing answer formats. And the moment any learned judge re-enters the pipeline (for partial credit, or for unverifiable domains), the original RLHF hackability returns with it.

**Verifiable domains are a narrow slice of what we want.** Math, code, and puzzles have oracles. Strategy advice, product judgment, honest writing, and research taste do not. The open question of the field is transfer: does thinking trained on math generalize outward? Partially — reasoning models do beat their bases on many general tasks — but the gap between "verifiable-domain gains" and "everything-else gains" is consistently large. Extending RLVR beyond its native domains (via rubric-based judges, self-verification, or formal-methods scaffolding) is an active research frontier, not a solved problem.

**Overthinking is a tax.** RL rewards correctness, not efficiency, so models pad: thousands of tokens of deliberation on questions a lookup would settle. That is real money and real latency at serving time, and it is why effort controls and think/no-think routing became standard within a year of R1.

**The chain of thought is not a window into the model.** The `<think>` text is optimized to *produce correct answers*, not to *faithfully report computation*. Models can reach right answers via written reasoning that is wrong, and there is evidence that CoT can rationalize rather than explain. Reading the thoughts is useful; trusting them as an audit log is not.

<div class="rsn-callout rsn-callout-warn">
    <strong>A safety-relevant tension.</strong> Optimization pressure on the chain of thought (for style,
    language consistency, or safety keywords) teaches the model what its thoughts should <em>look</em> like —
    which can make the visible reasoning less faithful to the real computation. Several labs now argue for
    keeping CoT lightly supervised precisely so it stays monitorable.
</div>

## Key Takeaways

**1. Verifiable rewards are the unlock.** Math and code provide binary, rule-based reward signals that cannot be gamed the way a learned RLHF reward model can. That is what makes large-scale RL on reasoning stable.

**2. GRPO makes the RL loop cheap.** Sample a group of answers and normalize each reward against the group's mean and standard deviation: $A\_i = (r\_i - \text{mean})/\text{std}$. The group replaces PPO's value network — half the memory, one fewer model to train, and a baseline that is always locally correct.

**3. Reasoning behaviors emerge; they are not programmed.** Longer deliberation, self-verification, backtracking, and the "aha moment" all appeared in R1-Zero from nothing but correct-answer rewards — with AIME pass@1 rising 15.6% to 71.0%.

**4. Test-time compute is a second scaling axis.** Accuracy rises with thinking tokens per query, independent of model size. Intelligence became a per-request dial, with token cost as the price.

**5. Discovery needs scale; inheritance does not.** RL finds reasoning in large models; distillation copies it into small ones better than small-scale RL can discover it. That asymmetry shaped the open-model landscape after January 2025.

<section class="d-bibliography">

## References

1. DeepSeek-AI. [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948). arXiv:2501.12948, 2025.
2. Zhihong Shao et al. [DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models](https://arxiv.org/abs/2402.03300). arXiv:2402.03300, 2024. (Introduces GRPO.)
3. OpenAI. [Learning to Reason with LLMs](https://openai.com/index/learning-to-reason-with-llms/). September 2024. (o1 announcement; test-time compute scaling figure.)
4. John Schulman et al. [Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347). arXiv:1707.06347, 2017.
5. Long Ouyang et al. [Training Language Models to Follow Instructions with Human Feedback](https://arxiv.org/abs/2203.02155). NeurIPS 2022. (InstructGPT / RLHF.)
6. Charlie Snell et al. [Scaling LLM Test-Time Compute Optimally Can Be More Effective than Scaling Model Parameters](https://arxiv.org/abs/2408.03314). arXiv:2408.03314, 2024.

</section>

<footer class="d-appendix">
    PDF: <a href="https://arxiv.org/pdf/2501.12948">arxiv.org/pdf/2501.12948</a>
</footer>

<script src="/js/reasoning-models.js"></script>
