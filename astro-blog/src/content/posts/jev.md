---
title: "Jev: A System One Model"
subtitle: "TypeSafe's Jev answers with typed decisions and probabilities instead of text. What it is, where it sits next to an LLM, and what the first outside tests found."
authors:
  - "Michael Wan"
affiliations:
  - "Michael Wan Interactive Insights"
published: "2026-09-27"
abstract: "Most software does not need an essay from a model. It needs a quick decision: which tool, which queue, safe or not. TypeSafe's Jev, released in September 2026, is built only for that: typed questions in, probability distributions out, answers in milliseconds, and no charge for output. This post explains what Jev is, how it slots into an LLM agent as a router and a guardrail, why its probabilities are the whole product, and what the first outside tests found when they checked them."
category: "ml"
tags:
  - "explainer"
thumbnail: "/img/jev/thumbnail.svg"
---

<style>
  .jev-callout {
    border-left: 3px solid; border-radius: 0 6px 6px 0;
    padding: 11px 14px; margin: 20px 0; font-size: 0.92rem; line-height: 1.55;
  }
  .jev-callout-note { border-color: #6366f1; background: #eef2ff; color: #3730a3; }
  .jev-callout-warn { border-color: #f59e0b; background: #fffbeb; color: #92400e; }
  :root[data-theme="dark"] .jev-callout-note { background: rgba(99,102,241,0.12); color: #a5b4fc; }
  :root[data-theme="dark"] .jev-callout-warn { background: rgba(245,158,11,0.10); color: #fcd34d; }

  .jev-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin: 16px 0; }
  .jev-table th { text-align: left; padding: 8px 10px; border-bottom: 2px solid var(--color-border); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--color-gray); }
  .jev-table td { padding: 8px 10px; border-bottom: 1px solid var(--color-border); vertical-align: top; }
  .jev-table td.jev-num { font-variant-numeric: tabular-nums; white-space: nowrap; }

  .jev-box {
    border: 1px solid var(--color-border); border-radius: 10px; padding: 18px 20px;
    margin: 26px 0; background: var(--color-surface);
  }
  .jev-box h3 { margin-top: 0; }
  .jev-desc { color: var(--color-gray); font-size: 0.9rem; margin: 0 0 14px 0; }
  .jev-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin: 10px 0; }
  .jev-row label { font-size: 0.85rem; font-weight: 600; }
  .jev-box select {
    padding: 5px 10px; font-size: 0.85rem; cursor: pointer; border-radius: 5px; font-family: inherit;
    border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text);
  }
  .jev-box input[type="range"] { flex: 1; min-width: 140px; accent-color: var(--color-blue); }
  .jev-val { font-family: monospace; font-weight: 700; color: var(--color-blue); min-width: 40px; }

  .jev-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-top: 14px; }
  .jev-stat { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; padding: 10px 12px; }
  .jev-stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-gray); }
  .jev-stat-value { font-size: 1.3rem; font-weight: 700; font-variant-numeric: tabular-nums; }
  .jev-stat-value.jev-warn { color: var(--color-orange); }
  .jev-claim { margin-top: 12px; font-size: 0.9rem; }
  .jev-claim strong { font-variant-numeric: tabular-nums; }
  .jev-takeaway { margin-top: 12px; font-size: 0.9rem; line-height: 1.55; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 6px; padding: 10px 12px; min-height: 3.2em; }

  .jev-traffic { display: flex; height: 22px; border-radius: 5px; overflow: hidden; margin: 14px 0 6px 0; background: var(--color-border); }
  .jev-traffic div { height: 100%; transition: width 0.2s; }
  #jev-router-seg-ok { background: var(--color-blue); }
  #jev-router-seg-bad { background: var(--color-orange); }
  #jev-router-seg-llm { background: var(--color-gray-light); }
  .jev-legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.8rem; color: var(--color-gray); }
  .jev-legend span::before { content: ""; display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: -1px; background: var(--c); }
</style>

<p class="d-note">
    Jev has no paper, model card, or published architecture. This post draws on TypeSafe's
    <a href="https://typesafe.ai/blog/introducing-system-one-models-and-jev">launch post</a> and
    <a href="https://docs.typesafe.ai/">documentation</a>, press coverage from September 15 to 19, 2026, the three
    most-watched explainer videos, and a
    <a href="https://www.beri.net/article/typesafe-jev-typed-decision-model-calibration-decomposition-shadow-eval">write-up by Rajesh Beri</a>
    (September 20, 2026) that collects several community evaluations. All diagrams are original. The interactive runs
    on simulated data tuned to one of those evaluations; it is not Jev output. Sources retrieved September 27, 2026.
</p>

## Key Takeaways

<div class="takeaways">
    <div class="takeaway">
        <span class="takeaway-num">1</span>
        <div class="takeaway-content">
            <strong>Jev makes snap decisions, not text.</strong> Typed questions go in, probability distributions come out in 70 to 500 ms, and output is not billed. Reasoning and writing stay with the LLM.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">2</span>
        <div class="takeaway-content">
            <strong>Its place is next to an LLM, not instead of one.</strong> It routes requests to tools, agents, and queues, and checks outputs as a guardrail: high-volume jobs where speed and price matter most.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">3</span>
        <div class="takeaway-content">
            <strong>A threshold is only as good as its calibration.</strong> A router acts on Jev alone above a cutoff. That cutoff is a real error budget only if a 0.95 answer is right 95% of the time.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">4</span>
        <div class="takeaway-content">
            <strong>Calibration held on benchmarks and slipped off them.</strong> Calibration error was 0.024 to 0.032 on public benchmarks but 0.107 on unfamiliar tickets; below 0.99, confidence did not separate good answers from bad.
        </div>
    </div>
    <div class="takeaway">
        <span class="takeaway-num">5</span>
        <div class="takeaway-content">
            <strong>Fan-out is cheap, not free of work.</strong> One broad phishing question scored 62.6%. Five narrow questions plus a regression fitted on 1,000 labelled emails reached 95.0%.
        </div>
    </div>
</div>

## Software wants decisions, not essays

An agent receives a request. Before it does anything useful, it must decide which tool to call. A support system receives a ticket and must pick a queue. A chatbot drafts a reply and must decide whether it is safe to send. None of these steps needs a paragraph. Each needs a **typed answer**, fast, and an honest sense of **how likely that answer is to be right**.

Today most of these small decisions go to a large language model. You ask in prose, wait a few seconds while it writes, parse the text, and pay for every output token. If you want a confidence, you ask for that too, and the model writes a number that sounds right. Nothing guarantees that its "90%" answers are right 90% of the time. The GPT-4 technical report measured this drift: post-training made the model more useful and its probabilities less honest.

In mid-September 2026, a startup called **TypeSafe** came out of stealth with a model that does only the small decisions. It is called **Jev**.

## What Jev is

TypeSafe borrows its framing from Daniel Kahneman's two systems: fast, intuitive judgement (System 1) and slow, deliberate reasoning (System 2). The last two years of frontier AI pushed hard on System 2. [Reasoning models](/posts/reasoning-models) think for thousands of tokens before they answer. TypeSafe calls Jev a **System One model**: it does not reason, write, or chat. It makes the snap decision.

The founder, Diogo Almeida, worked at OpenAI on RLHF, InstructGPT, ChatGPT, and GPT-4, according to press coverage of the launch. The company raised a $40M seed round led by DCVC. The pitch is short: **unstructured state in, typed probabilistic decisions out.**

<figure>
  <img src="/img/jev/diagram-two-paths.svg" alt="Two ways to classify the same support ticket. An LLM generates the category and a confidence as text, token by token. Jev takes the same ticket plus typed questions and returns a probability distribution for each." style="max-width: 760px; width: 100%; margin: 0 auto; display: block;" />
  <figcaption>Two ways to classify the same support ticket. Top: a chat model writes the category and a confidence as text, and your code parses both. Bottom: Jev receives the ticket plus a schema of questions and returns a distribution for each one; the category question is the same, and the other two ride along in the same call. How Jev computes those distributions is not disclosed.</figcaption>
</figure>

A call to Jev carries two things: the **state** (text or data describing the situation) and a set of **questions** defined in advance. Each question has one of three types.

<div class="d-table-wrapper">
<table class="jev-table">
<thead><tr><th>Type</th><th>Asks</th><th>Returns</th></tr></thead>
<tbody>
<tr><td><strong>Choice</strong></td><td>Which of these options? (up to 255)</td><td>the chosen option, a probability for every option, and a confidence score</td></tr>
<tr><td><strong>Score</strong></td><td>Where does this sit on an ordered rubric?</td><td>a level, a distribution over levels, and a confidence score</td></tr>
<tr><td><strong>Noul</strong></td><td>Yes or no?</td><td>$P(\text{yes})$</td></tr>
</tbody>
</table>
</div>

Because every answer is a typed value checked against the schema, it cannot be malformed. That is what TypeSafe's "0% hallucination" claim means: an answer can be wrong, but it cannot be off-schema.

The three most-watched explainer videos, from Caleb Writes Code, Krish Naik, and Theo (t3.gg), all stress what Jev is *not*: a replacement for LLMs. Theo offers a good rule of thumb. If a person would make the decision instantly, it is a Jev decision. If they would need to think, it belongs to a reasoning model.

## Fast and nearly free

Speed and cost are the headline numbers in almost every piece of coverage.

- **Latency.** TypeSafe quotes <strong class="hi">70 to 500 ms</strong> end to end, and 40x to 200x faster than LLMs at the same level of frontier intelligence. Its launch post credits a new architecture and a parallel sampler that answers everything in a single query.
- **Price.** <strong class="hi">$0.042</strong> per million input tokens. Output is free, because a handful of typed values is, in TypeSafe's words, "too cheap to meter". LLM APIs usually charge several times more for output than for input.

Free output changes how you ask. A 1,000-token ticket costs about $0.000042 whether you ask one question or twenty, and TypeSafe says the questions in a call are answered in parallel. Its docs call the resulting pattern **speculative fan-out**: send many questions in one call, including ones you might not need, and let your code decide which answers matter.

TypeSafe's headline benchmark numbers ("193.6x faster, 444.6x cheaper") come from its own workflow evaluations. The company notes that its own team wrote them and that the results likely sit at the high end. The outside tests below look at what the 444x actually measures.

## Where Jev sits next to an LLM

The videos spend most of their time on one question: where do you put Jev in a system you already have? Routing dominates. Krish Naik also shows a second placement, as a guardrail.

<figure>
  <img src="/img/jev/diagram-router.svg" alt="Jev inside an agent system. A request goes first to Jev as a router. If its top probability clears the threshold, the tool is called directly; otherwise the request escalates to a reasoning LLM agent, whose output passes through Jev again as a guardrail." style="max-width: 760px; width: 100%; margin: 0 auto; display: block;" />
  <figcaption>The two placements shown in the explainer videos. Jev routes requests in front of the agent and checks outputs behind it; the LLM handles only what needs reasoning or writing.</figcaption>
</figure>

**As a router.** An agent has several tools: a SQL database, web search, a Python sandbox. Deciding which one to call is usually an LLM call of its own. In Krish Naik's demo, Jev gives each tool a probability instead (SQL 0.96, Python 0.02, the rest smaller), and the agent calls the top one directly. The same pattern routes a request between agents, or a ticket between queues.

**As a guardrail.** After an LLM drafts a reply, a yes/no question ("safe to send?", "does this answer the question?") decides whether to send it or regenerate. A guardrail runs on every response, so a check that costs milliseconds and almost nothing is attractive.

Both placements share a detail that the demos mostly skip. The router has to decide **when Jev's answer is good enough to act on**. The usual rule is a threshold:

<div class="d-math-block">
$$
\text{act if } \max_k p_k \geq \tau \quad \text{else escalate to the LLM}
$$
</div>

Set $\tau = 0.95$ and you expect at most 5% errors among the requests Jev handles alone. That promise holds only if Jev's probabilities are **calibrated**, meaning its 0.95 answers are right at least 95% of the time. This is why TypeSafe sells calibration, not just speed: without it, the threshold is a guess.

### RLCD: training for honest probabilities

TypeSafe names its training objective **RLCD, Reinforcement Learning for Calibrated Decisions**. Its launch post places it next to two familiar objectives. RLHF optimizes for what human raters prefer. RLVR, the recipe behind reasoning models, optimizes for answers a program can verify. RLCD optimizes for probabilities that are **epistemically honest**: when Jev says 0.9, it should be right nine times in ten, and similar inputs should get similar answers.

<div class="jev-callout jev-callout-warn">
    <strong>What is not disclosed.</strong> TypeSafe has not published the RLCD loss, the architecture, the parameter
    count, the training data, or any calibration metric of its own. The launch post mentions a new architecture and a
    parallel sampler; press coverage adds that training used synthetic data. Whether Jev is a new architecture or a
    classification head on a language-model backbone cannot be determined from public material.
</div>

One practical detail: Jev's **confidence** field is not the probability of the top answer. TypeSafe's docs describe it as a statistic computed from the distribution. In an example discussed by TuringPost, the top option held 0.84 while the reported confidence was 0.596, because a second option held 0.159. If you build a threshold, build it on the probabilities.

## What the first outside tests found

The explainer videos repeat TypeSafe's numbers; none of them tests the calibration claim. Within a week of launch, several people did, and published their results on GitHub. Rajesh Beri collected them in one write-up. They are small, fast, and mostly on synthetic data, so treat them as early evidence rather than a verdict.

### One question versus five

The open-source `jev-phishing-bench` (September 17) ran phishing detection on 2,000 synthetic emails (1,000 for fitting, 1,000 for evaluation) and compared Jev with Claude Haiku 4.5.

<figure>
  <img src="/img/jev/diagram-fanout.svg" alt="Phishing detection results. One broad yes-or-no question to Jev gave 62.6 percent accuracy against 81.3 percent for Haiku 4.5. Five narrow questions combined by a logistic regression fitted on 1,000 labelled emails gave 95.0 percent against 93.2 percent for Haiku." style="max-width: 760px; width: 100%; margin: 0 auto; display: block;" />
  <figcaption>Two ways to use Jev on the same task, with numbers from jev-phishing-bench as reported by Beri. The write-up gives only examples of the five narrow questions, so the diagram shows two examples and three placeholders.</figcaption>
</figure>

Asked one broad question ("is this phishing?"), Jev scored <strong class="hi">62.6%</strong> against Haiku's **81.3%**. It caught 43.2% of the actual phishing emails and falsely flagged 18.0% of legitimate ones.

Split into five narrow questions (for example, does a link point to a URL shortener or free hosting, and does the sender use a free email address) and combined by a logistic regression, Jev reached <strong class="hi">95.0%</strong> against Haiku's **93.2%** on the same setup, a gap that is not statistically significant. The catch is the regression: it was fitted on 1,000 labelled emails. In Beri's words, the 95% is "Jev plus your labelled data plus a regression you maintain." Fan-out is cheap with Jev. Turning five answers into one good decision is still your job.

### Calibration off the benchmark

Calibration is usually summarized as **expected calibration error (ECE)**: the average gap between claimed confidence and actual accuracy, where 0 is perfect. On public benchmarks, Jev's ECE came in at **0.024 to 0.032**, which is good. A study on September 19, run through Vercel's AI gateway, used 900 synthetic support tickets unlike those benchmarks. There, ECE rose to <strong class="hi">0.107</strong>, about 4.4 times the noise floor. Choice and Score answers were overconfident. Yes/no answers were underconfident.

The worst case is the most instructive. On questions that depended on an internal policy missing from the ticket text, Jev was right <strong class="hi">44.7%</strong> of the time while assigning its answers an average probability of **0.74**. No training objective can calibrate a model on information it was never shown.

A pre-registered study published as `priorbench/jev` (September 20) found a related pattern over 5,721 calls. Jev scored 95.9% zero-shot on its 400-item benchmark, but accuracy above the threshold stayed **flat from 0.50 to 0.95**, then jumped to **100% at 0.99**. The 0.99 band covered 60.2% of traffic. In practice, confidence below 0.99 did not separate good answers from bad.

### Try it: the router with the measured miscalibration

What does overconfidence do to the router from the diagram above? The simulation below routes 4,000 requests. Jev sees every request first; anything below the threshold escalates to the LLM. The overconfident setting uses the refit temperature the September 19 study measured for Choice answers (3.29).

<div id="jev-router" class="jev-box interactive-container">
  <h3>Jev as a router, calibrated or not</h3>
  <p class="jev-desc">Move the threshold. Illustrative assumptions: Jev costs $0.04 per 1,000 requests and 0.3 s; the LLM fallback costs $5 per 1,000 requests, takes 8 s, and is right 97% of the time.</p>
  <div class="jev-row">
    <label for="jev-router-preset">Jev's probabilities</label>
    <select id="jev-router-preset">
      <option value="over">As tested: overconfident (Choice answers)</option>
      <option value="calib">As claimed: calibrated</option>
    </select>
    <label><input type="checkbox" id="jev-router-refit" /> apply temperature refit</label>
  </div>
  <div class="jev-row">
    <label for="jev-router-tau">Threshold &tau;</label>
    <input id="jev-router-tau" type="range" min="0.5" max="0.99" step="0.01" value="0.9" />
    <span id="jev-router-tau-val" class="jev-val">0.90</span>
  </div>
  <div class="jev-traffic" aria-hidden="true">
    <div id="jev-router-seg-ok"></div><div id="jev-router-seg-bad"></div><div id="jev-router-seg-llm"></div>
  </div>
  <div class="jev-legend">
    <span style="--c: var(--color-blue)">handled by Jev, right</span>
    <span style="--c: var(--color-orange)">handled by Jev, wrong</span>
    <span style="--c: var(--color-gray-light)">escalated to the LLM</span>
  </div>
  <div class="jev-stats">
    <div class="jev-stat"><div class="jev-stat-label">Handled by Jev</div><div class="jev-stat-value" id="jev-router-handled">–</div></div>
    <div class="jev-stat"><div class="jev-stat-label">Overall accuracy</div><div class="jev-stat-value" id="jev-router-acc">–</div></div>
    <div class="jev-stat"><div class="jev-stat-label">Cost per 1,000</div><div class="jev-stat-value" id="jev-router-cost">–</div></div>
    <div class="jev-stat"><div class="jev-stat-label">Avg latency</div><div class="jev-stat-value" id="jev-router-latency">–</div></div>
  </div>
  <div class="jev-claim">On the requests Jev handles, it claims <strong id="jev-router-claimed">–</strong> accuracy and delivers <strong id="jev-router-delivered">–</strong>.</div>
  <div id="jev-router-takeaway" class="jev-takeaway"></div>
</div>

With overconfident probabilities, the router looks excellent on cost and latency, because it hands most requests to Jev. The errors are hidden in the gap between claimed and delivered accuracy. The checkbox applies the classic fix, **temperature scaling**: divide the logits by one constant fitted on labelled data (the study fitted 3.29 for Choice answers). It repairs what Jev claims without changing what it picks, and it needs labelled data from your own traffic. That is the very step a calibrated-out-of-the-box model promises to remove.

### Cost, and what "444x cheaper" measures

<div class="d-table-wrapper">
<table class="jev-table">
<thead><tr><th>Setup (phishing test)</th><th>Cost per 1,000 emails</th><th>Relative</th></tr></thead>
<tbody>
<tr><td>Jev, five questions in one call</td><td class="jev-num heat" style="--v:0.04">$0.038</td><td class="jev-num dbar" style="--v:0.04">1x</td></tr>
<tr><td>Haiku 4.5, one question</td><td class="jev-num heat" style="--v:0.45">$0.462</td><td class="jev-num dbar" style="--v:0.44">12x</td></tr>
<tr><td>Haiku 4.5, five signals</td><td class="jev-num heat hot" style="--v:1.00">$1.02</td><td class="jev-num dbar" style="--v:1.00">27x</td></tr>
</tbody>
</table>
<div class="dv-note">Shading and bars: darker or longer = larger cost; both columns scale to the most expensive setup.</div>
</div>

The cost advantage is real, but smaller than the headline suggests. TypeSafe itself discloses that its 444.6x figure measures **agreement with the average of two frontier models** (GPT-6 Astra and Fable 5.1), which is a different thing from correctness. A separate test by Good Start Labs, over 6,003 rubric checks and published by Langfuse, measured agreement with Claude instead. DeepSeek V4.1 Flash agreed 93.5% of the time and Jev 91.5%, at $260 per million verdicts against Jev's $160. On that test DeepSeek V4.1 Flash cost 1.6 times as much as Jev, far from hundreds. TypeSafe also says it cannot prove its price is unsubsidized.

<div class="jev-callout jev-callout-note">
    <strong>Beri's conclusion:</strong> the case for Jev is agility, not accuracy. When your categories change every
    quarter, you edit a schema instead of retraining a classifier.
</div>

## Where Jev fits

Put the pitch, the coverage, and the tests side by side and a narrower, still useful picture emerges.

**Where it fits.** High-volume, typed decisions on text: tool and agent routing, ticket triage, guardrail checks. It fits best where categories change often and a slower fallback exists for low-confidence cases. The classic alternative is a fine-tuned classifier plus temperature scaling. That recipe is cheap and well calibrated in-distribution, but it needs labelled data and retraining whenever the label set changes. Jev offers the same shape without the training step.

**Where it does not fit.** Anything that needs generated text or reasoning; that stays with the LLM. Image inputs, which Jev does not accept yet. Decisions that depend on context missing from the state. And any router that trusts a threshold below about 0.99 without first checking calibration on its own data.

**What would change the picture.** A technical report with calibration metrics across domains; tests on real rather than synthetic traffic; and evidence that the price holds without a subsidy. Until then, treat Jev like any new classifier: shadow it against labelled data, fit a temperature if needed, and let measured accuracy set the threshold.

<section class="d-bibliography">

## References

1. Diogo Almeida (TypeSafe). [Introducing System One Models & Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev). September 2026. See also the [documentation](https://docs.typesafe.ai/).
2. Rajesh Beri. [TypeSafe's Jev Scores 62.6% Asked Once and 95% Split Five Ways](https://www.beri.net/article/typesafe-jev-typed-decision-model-calibration-decomposition-shadow-eval). September 20, 2026. (Collects jev-phishing-bench, the Vercel-gateway calibration study, priorbench/jev, and Good Start Labs' Langfuse results.)
3. Caleb Writes Code. [Jev explained in 7min..](https://www.youtube.com/watch?v=vj7hysh0mOI) YouTube, September 18, 2026.
4. Krish Naik. [Will Jev Replace LLM's? What is Jev From TypeSafe AI](https://www.youtube.com/watch?v=2vYV4K1RQ1w). YouTube, September 21, 2026.
5. Theo - t3.gg. [Jev is incredible](https://www.youtube.com/watch?v=F3YXg7AaKWE). YouTube, September 2026.
6. MarkTechPost. [TypeSafe AI Releases Jev: A System One Model That Returns Typed, Calibrated Decisions Instead of Text](https://www.marktechpost.com/2026/09/19/typesafe-ai-releases-jev/). September 19, 2026.
7. TuringPost. [Guide: Jev, RLCD, and the Reinvention of the AI Classifier](https://www.turingpost.com/p/what-is-jev-rlcd). September 19, 2026.
8. Forbes. [This $200 Million Startup Wants To Fix AI's Overconfidence Problem](https://www.forbes.com/sites/the-prompt/2026/09/15/this-200-million-startup-wants-to-fix-ais-overconfidence-problem/). September 15, 2026.
9. OpenAI. [GPT-4 Technical Report](https://arxiv.org/abs/2303.08774). arXiv:2303.08774, 2023. (Calibration before and after post-training.)
10. Chuan Guo et al. [On Calibration of Modern Neural Networks](https://arxiv.org/abs/1706.04599). ICML 2017. (Temperature scaling.)
11. Daniel Kahneman. *Thinking, Fast and Slow*. 2011.

</section>

<script src="/js/jev.js"></script>
