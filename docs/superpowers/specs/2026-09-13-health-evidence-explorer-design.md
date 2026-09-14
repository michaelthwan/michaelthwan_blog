# Design: Health Evidence Explorer

Date: 2026-09-13
Repo: mw_knowledge_blog (astro-blog)
Status: approved design, pre-implementation

## 1. Motivation

`geekan/HowToLiveLonger` (35k+ stars) is the reference point. It did two things well:

- It forced every factor onto a single comparable metric (ACM, all-cause mortality).
- It framed the body as a system with inputs / outputs / context.

It breaks in one place, structurally: it multiplies independent-looking effect
reductions (-47% x -27% x -25% ...) into a headline `-66.67% ACM / +20 years`.
Those factors are not independent. People who play racquet sports are also the people
who do not smoke, are not obese, and are wealthier. The same healthy cohort is counted
many times. The headline number is an artifact of the arithmetic, not a finding.

The fix is not a better number. It is a better data structure.

## 2. Core design: three layers, not two

```
Behavior  ->  Marker (biomarker / mechanism)  ->  Goal
```

Example:

```
Zinc                -> serum testosterone  -> male vitality
Resistance training -> serum testosterone  -> male vitality
Resistance training -> lean mass           -> male vitality
Maca                -> subjective libido   -> male vitality   (does NOT touch testosterone)
L-arginine          -> nitric oxide        -> male vitality
```

The marker layer is load-bearing for three reasons:

1. **It exposes mechanism.** The maca row above shows, with no editorial comment, that
   maca moves a questionnaire score and not a hormone. A flat list hides this.
2. **It makes summing structurally impossible.** Zinc and resistance training converge
   on the same marker node. Behaviors converging on one marker do not add. The reader
   sees the convergence; the UI never offers a total.
3. **It makes effect sizes comparable.** Cross-goal comparison is meaningless
   ("-23% ACM" vs "+15% testosterone"). Ranking therefore happens only *within a marker
   node*, where units match. Cross-node ranking is not offered.

## 3. One dataset, two rootings

The same graph, rooted at different nodes:

| Entry mode | Root | Reader question |
|---|---|---|
| Goal-first | Goal | "I want more vitality - what can I do?" |
| Behavior-first | Behavior | "I take zinc - what does it actually do?" |

Goal-first expands to `Goal -> markers -> behaviors (ranked)`. Behavior-first walks the
same edges in reverse. One JSON file, two renderers.

## 4. Scope for v1

Three goals, chosen because their trees overlap:

- **A. Male vitality / testosterone**
- **B. Inflammation / skin**
- **C. Sleep quality**

Target volume: ~37 candidate edges as listed in 4.1, ~50 papers (some edges need more than
one paper). Edges that fail the evidence bar during extraction
are cut. Cutting is a correct outcome, not a failure.

### 4.1 Candidate edges

Hypotheses only. Every one must be confirmed, corrected, or deleted by the literature pass.

**Goal A - Male vitality**

| Marker | Candidate behaviors |
|---|---|
| Serum testosterone | resistance training, sleep duration, fat loss, zinc (deficient only), vitamin D (deficient only), alcohol (negative) |
| Nitric oxide / blood flow | L-arginine, L-citrulline, aerobic exercise |
| Lean mass / strength | resistance training, protein intake |
| Subjective libido (IIEF etc.) | maca, psychological stress |
| Expected null | D-aspartic acid, Tribulus terrestris |

**Goal B - Inflammation / skin**

| Marker | Candidate behaviors |
|---|---|
| hs-CRP / IL-6 | omega-3, curcumin, exercise, sleep deprivation (negative), smoking (negative), body fat |
| Insulin / IGF-1 | low-GI diet, sugar reduction, dairy |
| Sebum / acne lesion count | low-GI diet, dairy, stress |

**Goal C - Sleep quality**

| Marker | Candidate behaviors |
|---|---|
| Melatonin phase (DLMO) | morning light, evening blue light (negative) |
| Sleep onset latency | caffeine timing, room temperature, exercise timing, melatonin supplementation |
| Deep sleep / REM share | alcohol (negative), exercise |
| Subjective PSQI | CBT-I, magnesium (weak evidence) |

### 4.2 Why these three together

Several behaviors appear in all three trees:

```
Sleep deprivation -> testosterone down   (A)
                  -> IL-6 / CRP up       (B)
                  -> (is the goal)       (C)

Alcohol           -> testosterone down   (A)
                  -> inflammation up     (B)
                  -> REM suppression     (C)

Body fat          -> testosterone down   (A)
                  -> CRP up              (B)
```

**Behaviors that appear in more than one tree are the high-leverage behaviors.** This is
the article's thesis, and it emerges from the data rather than being asserted. Readers
switching between goals see sleep and alcohol recur, while maca, magnesium and Tribulus
appear once, at a low evidence tier. Building the three goals separately would destroy
this effect.

Secondary payoff: alcohol is negative in all three trees, which demonstrates that what
you stop doing outweighs what you supplement.

## 5. Data schema

A single static JSON shipped with the post.

```
nodes.behaviors[]  id, name, category (exercise|supplement|diet|environment|habit),
                   dose_or_intensity
nodes.markers[]    id, name, unit, goal_ids[]        // a marker may serve several goals
nodes.goals[]      id, name, definition

edges[]            behavior_id, marker_id
                   direction: "+" | "-" | null       // null = studied, no effect found
                   effect                            // as reported, original units
                   effect_normalized, normalization_method  // SMD | pct_change | RR
                   evidence_tier: A | B | C | D
                   population                        // age, sex, health status, training status
                   conditional_on                    // e.g. "zinc-deficient men only"
                   paper { doi, title, year, design, n }
                   verbatim                          // the result sentence, quoted
                   figure                            // embedded if licensing allows, else link
                   caveats                           // COI, small n, unreplicated
```

### 5.1 Evidence tiers

- **A** - meta-analysis / systematic review of RCTs
- **B** - single adequately powered RCT
- **C** - prospective cohort
- **D** - cross-sectional, case-control, animal, or mechanistic inference

### 5.2 The two fields that differentiate this from HowToLiveLonger

- `conditional_on` - zinc raises testosterone in deficient men; resistance training has
  the largest effect in untrained subjects. Most supplement claims die in this field.
  HowToLiveLonger has no such field and therefore cannot distinguish "works for everyone"
  from "works for the deficient".
- `verbatim` - the quoted result sentence. It serves the reader (every claim is checkable
  on the spot) and it serves quality control (see section 8).

### 5.3 Null results are content

`direction: null` records that a behavior was studied and no effect was found. Tribulus
having no effect is information, not missing data. Most health sites omit null results.

## 6. Interface

One mode toggle, two rootings.

**Goal mode** - pick a goal, tree expands: root = goal, branches = markers, leaves =
behaviors. Leaves sorted by `evidence_tier`, then by effect size. Both badges displayed.

**Behavior mode** - pick a behavior, reversed tree: root = behavior, branches = markers it
moves, leaves = goals those markers serve.

A leaf that also appears under other goals carries a cross-tree badge (e.g. `x3`), making
leverage visible.

Clicking any edge opens a side panel: paper title, year, design, n, the `verbatim` result
sentence, population, `conditional_on`, figure, caveats.

### 6.1 Ranking rule

Do not collapse effect size and evidence tier into a single score. Collapsing reinvents
the false precision of `+20 years`. Primary sort is evidence tier, secondary sort is
effect size, and both badges are shown. A tier-D 60% effect always ranks below a tier-A
12% effect.

### 6.2 No totals, ever

The UI offers no aggregate score, no "your total", no "expected years gained". This is
deliberate and the article states why.

### 6.3 Rendering

Indented nested HTML tree with CSS indent guides, not an SVG node graph. Reasons: readable
on mobile, accessible, maintainable. An SVG tree looks better and is much harder to make
responsive.

## 7. Article structure

The explorer is the payload; the prose is the argument for why it is built this way.

1. What HowToLiveLonger got right (single metric, I/O framing)
2. Where it breaks: multiplying non-independent effects
3. The fix is a data structure, not a number - add the marker layer so convergence is visible
4. **<- explorer embedded here**
5. What the trees show: cross-tree behaviors, null results, how much `conditional_on`
   eats of supplement claims
6. Limits of this approach: markers are not outcomes, publication bias, no meta-analysis
   was performed here

Language: English, consistent with the other 19 posts. Tone is descriptive, not
prescriptive: "a 2011 RCT in zinc-deficient men found...", never "take zinc to...".
The page describes literature; it does not give medical advice, and says so.

## 8. Literature extraction and verification

The largest work item and the only one that can produce hard factual errors.

- Research subagents search PubMed and journal sources, one goal per agent.
- Every edge must carry a DOI and the `verbatim` result sentence.
- A separate, independent agent re-checks each extracted number against the quoted
  sentence and the abstract. The extractor does not verify its own extraction.
- Edges that cannot meet the bar (animal-only, single underpowered study) are cut and
  listed as cut, with the reason.

## 9. Integration with the existing blog

- Post at `astro-blog/src/content/posts/<slug>.md`, rendered through `Article.astro`.
- Post-specific JS at `astro-blog/public/js/<slug>.js`, per the existing convention used
  by `sp500-charts.js`.
- Dataset as a static JSON under `astro-blog/public/data/`.
- Scoped inline `<style>` inside the markdown with a unique class prefix, matching the
  pattern in `sp500-history.md`.
- Frontmatter `category`: the schema currently allows `ml | dev | business` only. The user
  will specify the category later. Until then no schema change is made and no category is
  guessed.

## 10. Out of scope for v1

- Goals beyond the three listed (all-cause mortality in particular, which is large enough
  to absorb the entire project).
- Any personalization, user accounts, or saved state.
- Any aggregate scoring.
- Schema or `blog.astro` layout changes for a new category.
