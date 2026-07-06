---
title: "Understanding BERT"
subtitle: "Pre-training deep bidirectional representations for language understanding. How masked language modeling enables a single model to master almost any NLP task."
authors:
  - "Jacob Devlin"
  - "Ming-Wei Chang"
  - "Kenton Lee"
  - "Kristina Toutanova"
affiliations:
  - "Google AI Language"
published: "2018-10-11"
doi: "arXiv:1810.04805"
doiUrl: "https://arxiv.org/abs/1810.04805"
abstract: "Pre-training deep bidirectional representations for language understanding. How masked language modeling enables a single model to master almost any NLP task."
tags:
  - "explainer"
category: "ml"
thumbnail: "/img/bert/fig1-pretraining-finetuning.png"
---

<p class="d-note">
    This article explains the landmark paper
    <a href="https://arxiv.org/abs/1810.04805">BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding</a>
    by Devlin et al. (2018), which introduced a new paradigm for NLP: pre-train once, fine-tune everywhere.
</p>

<style>
  .bt-callout {
    border-left: 3px solid; border-radius: 0 6px 6px 0;
    padding: 11px 14px; margin: 20px 0; font-size: 0.92rem; line-height: 1.55;
  }
  .bt-callout-tip  { border-color: #10b981; background: #f0fdf4; color: #065f46; }
  .bt-callout-warn { border-color: #f59e0b; background: #fffbeb; color: #92400e; }
  .bt-callout-note { border-color: #6366f1; background: #eef2ff; color: #3730a3; }
  .bt-badge { display: inline-block; font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.02em; }
  .bt-badge-green  { background: #d1fae5; color: #065f46; }
  .bt-badge-yellow { background: #fef3c7; color: #92400e; }
  .bt-badge-red    { background: #fee2e2; color: #b91c1c; }
  @media (prefers-color-scheme: dark) {
    .bt-callout-tip  { background: #052e21; color: #6ee7b7; }
    .bt-callout-warn { background: #2e2205; color: #fcd34d; }
    .bt-callout-note { background: #1e1b4b; color: #c7d2fe; }
  }
</style>

## Introduction

By 2018, computer vision had a recipe everyone used: train a big model on ImageNet,
then fine-tune it for your task. Language had no equivalent. Every new NLP problem still
meant designing a new architecture and training it from scratch.

Two approaches were circling the answer:

- **Feature-based** (ELMo): pre-train embeddings, freeze them, bolt a task-specific model on top
- **Fine-tuning** (GPT): pre-train one language model, fine-tune the whole thing—but reading only left to right

**BERT took the best of both and removed their shared weakness.** One pre-trained model,
fine-tuned end to end for almost any task, reading context from *both directions at once*.
The rest of this article is about why "both directions" was the hard part—and the trick
that made it work.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/bert/fig1-pretraining-finetuning.png" alt="BERT pre-training and fine-tuning overview" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 1 from the paper:</strong> The overall pre-training and fine-tuning procedures for BERT. Apart from the output layers, the same architecture is used in both stages.
    </figcaption>
</figure>

## The Directionality Problem

### Why direction matters

Consider the sentence:

<div class="d-example-box">
"The bank by the river was steep."
</div>

To understand "bank" correctly, you need:
- **Left context**: "The" (not very helpful)
- **Right context**: "by the river" (critical—this means riverbank, not financial institution)

A left-to-right language model can't use the right context when processing "bank." It's fundamentally limited.

### Previous solutions

**ELMo** trained two separate LSTMs—one left-to-right, one right-to-left—and concatenated their outputs. This captures both directions, but the two directions don't interact during training. Each direction is learned independently.

**GPT** used a Transformer decoder, but it's autoregressive: each position can only attend to positions on its left. It's powerful, but still unidirectional.

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/bert/fig3-model-architectures.png" alt="Pre-training architecture comparison: BERT, GPT, ELMo" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 3 from the paper:</strong> The three pre-training approaches side by side. BERT uses a bidirectional Transformer. GPT uses a left-to-right Transformer. ELMo uses two separate unidirectional LSTMs.
    </figcaption>
</figure>

<div class="d-callout">
    <strong>Key question:</strong> Can we train a single model where every position attends to every other position—truly bidirectional?
</div>

## The Bidirectional Challenge

The problem with "just make it bidirectional" is subtle but fundamental.

In a standard language model, you predict the next word given previous words:

<div class="d-math-block">
$$P(w_t | w_1, w_2, \ldots, w_{t-1})$$
</div>

Read it as: the probability of word $w_t$ given everything *before* it. The target word
is never part of its own context, so the task stays honest.

But turn on bidirectional attention and that guarantee is gone. If word $w_t$ can attend
to $w_{t+1}$, and $w_{t+1}$ can attend back to $w_t$, then predicting $w_t$ lets it peek
at itself through its neighbors. The model would learn to copy instead of understand.

<div class="bt-callout bt-callout-warn">
    <strong>This is the leakage problem, and it is why you can't just "make GPT bidirectional."</strong>
    A bidirectional model that predicts the next word has already seen the answer. The objective
    has to change, not just the attention mask.
</div>

**BERT's insight:** don't predict the next word. Hide some words, then predict the ones you hid.

## Masked Language Modeling (MLM)

The core pre-training objective of BERT is the **Masked Language Model**.

### The procedure

1. Take a sentence (or sentence pair)
2. Randomly select 15% of tokens to "mask"
3. Of those selected tokens:
   - 80% → replace with `[MASK]` token
   - 10% → replace with a random word
   - 10% → keep unchanged
4. Train the model to predict the original tokens

<figure class="d-figure">
    <div class="d-figure-content">
        <div class="bert-masking-viz">
            <div class="masking-row">
                <span class="masking-label">Original:</span>
                <div class="masking-tokens">
                    <span class="token">The</span>
                    <span class="token target">cat</span>
                    <span class="token">sat</span>
                    <span class="token">on</span>
                    <span class="token">the</span>
                    <span class="token target">mat</span>
                </div>
            </div>
            <div class="masking-row">
                <span class="masking-label">Input:</span>
                <div class="masking-tokens">
                    <span class="token">The</span>
                    <span class="token masked">[MASK]</span>
                    <span class="token">sat</span>
                    <span class="token">on</span>
                    <span class="token">the</span>
                    <span class="token random">dog</span>
                </div>
            </div>
            <div class="masking-legend">
                <div class="legend-item">
                    <span class="legend-box masked"></span>
                    <span>80% masked</span>
                </div>
                <div class="legend-item">
                    <span class="legend-box random"></span>
                    <span>10% random</span>
                </div>
                <div class="legend-item">
                    <span class="legend-box unchanged"></span>
                    <span>10% unchanged</span>
                </div>
            </div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        BERT's masking strategy. The model must predict "cat" and "mat" from bidirectional context.
    </figcaption>
</figure>

### Why the 80/10/10 split?

If we always used `[MASK]`, the model would never see real words in those positions during pre-training—but during fine-tuning there are no `[MASK]` tokens at all. The model would be tuned for an input distribution it never meets in production.

The 10% random replacement teaches the model that it can't just trust every token it sees. The 10% unchanged teaches it to keep reasoning from context even when a token looks perfectly normal.

<div class="bt-callout bt-callout-note">
    <strong>The split is a hedge against a train/serve mismatch.</strong> Because the model never
    knows whether a given position was masked, replaced, or left alone, it has to build a rich
    representation of <em>every</em> token from its neighbors—which is exactly the behavior you
    want at fine-tuning time.
</div>

### The equation

For each masked position $i$, BERT outputs a distribution over the vocabulary:

<div class="d-equation-panel">
    <div class="d-equation-title">Masked Language Model Objective</div>
    <div class="d-equation-main">
        $$P(w_i | \text{context}) = \text{softmax}(W_o \cdot h_i + b_o)$$
    </div>
    <div class="d-equation-legend">
        <div class="d-legend-item">
            <span class="d-legend-dot query"></span>
            <span><strong>Target</strong> $h_i$: the masked position's hidden state</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot value"></span>
            <span><strong>Context</strong>: all other positions (bidirectional!)</span>
        </div>
        <div class="d-legend-item">
            <span class="d-legend-dot param"></span>
            <span><strong>Parameters</strong> $W_o$, $b_o$: output projection</span>
        </div>
    </div>
</div>

In words: take the hidden state $h_i$ that BERT computed for the masked slot—a vector
that has already absorbed the whole sentence through self-attention—project it onto the
30,000-word vocabulary, and softmax to get a probability for each candidate word. Training
nudges those probabilities toward the word that was actually hidden.

### Try it: mask a word and watch BERT guess

Click any word below to hide it. The bars show what a bidirectional model predicts for
the blank, using context from **both sides** of the gap.

<figure class="d-figure">
    <div class="d-figure-content">
        <div id="bt-mask-demo" class="bt-mask-demo"></div>
    </div>
    <figcaption class="d-figure-caption">
        <strong>Interactive:</strong> Masked-language-model prediction. Predictions are illustrative,
        chosen to show how left and right context together pin down the missing word. The true word
        is marked in green.
    </figcaption>
</figure>
<script src="/js/bert.js"></script>

## Next Sentence Prediction (NSP)

Many NLP tasks require understanding relationships between *sentences*, not just within them: question answering, natural language inference, etc.

BERT adds a second pre-training objective: **Next Sentence Prediction**.

### The procedure

1. Sample sentence pairs (A, B) from the corpus
2. 50% of the time: B is the actual next sentence after A (label: `IsNext`)
3. 50% of the time: B is a random sentence (label: `NotNext`)
4. Train the model to classify the pair

### Input format

BERT packs both sentences into a single sequence:

<figure class="d-figure">
    <div class="d-figure-content">
        <div class="bert-input-viz">
            <div class="input-sequence">
                <span class="token special">[CLS]</span>
                <span class="token segment-a">tokens</span>
                <span class="token segment-a">of</span>
                <span class="token segment-a">sentence</span>
                <span class="token segment-a">A</span>
                <span class="token special">[SEP]</span>
                <span class="token segment-b">tokens</span>
                <span class="token segment-b">of</span>
                <span class="token segment-b">sentence</span>
                <span class="token segment-b">B</span>
                <span class="token special">[SEP]</span>
            </div>
            <div class="input-legend">
                <div class="legend-item">
                    <span class="legend-box special"></span>
                    <span>Special tokens</span>
                </div>
                <div class="legend-item">
                    <span class="legend-box segment-a"></span>
                    <span>Segment A</span>
                </div>
                <div class="legend-item">
                    <span class="legend-box segment-b"></span>
                    <span>Segment B</span>
                </div>
            </div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        BERT's input format. [CLS] is used for classification; [SEP] separates sentences.
    </figcaption>
</figure>

The `[CLS]` token's output becomes the aggregate sequence representation, used for sentence-level predictions.

<div class="bt-callout bt-callout-warn">
    <strong>NSP did not survive scrutiny.</strong> A year later, RoBERTa dropped Next Sentence
    Prediction entirely and matched or beat BERT. The signal NSP provided was largely already
    present in masked language modeling over long spans. It is included here because it is part
    of the original design—but treat it as the paper's weakest load-bearing piece.
</div>

## BERT Architecture

BERT uses the **Transformer encoder** architecture—the same one from "Attention Is All You Need," but without the decoder.

### Model sizes

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th></th>
                <th>BERT-Base</th>
                <th>BERT-Large</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Layers (L)</td>
                <td>12</td>
                <td>24</td>
            </tr>
            <tr>
                <td>Hidden size (H)</td>
                <td>768</td>
                <td>1024</td>
            </tr>
            <tr>
                <td>Attention heads (A)</td>
                <td>12</td>
                <td>16</td>
            </tr>
            <tr>
                <td>Parameters</td>
                <td>110M</td>
                <td>340M</td>
            </tr>
        </tbody>
    </table>
</div>

### Input representation

Each input token is represented as the sum of three embeddings:

<div class="d-math-block">
$$\text{Input} = E_{\text{token}} + E_{\text{segment}} + E_{\text{position}}$$
</div>

- **Token embedding**: WordPiece vocabulary of 30,000 tokens
- **Segment embedding**: Which sentence (A or B) this token belongs to
- **Position embedding**: Learned (not sinusoidal like the original Transformer)

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/bert/fig2-input-representation.png" alt="BERT input representation" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 2 from the paper:</strong> BERT's input representation. The final input embedding is the element-wise sum of the token, segment, and position embeddings.
    </figcaption>
</figure>

### The computation

Stack of $L$ identical layers, each containing:

1. **Multi-head self-attention** — every position attends to every position
2. **Feed-forward network** — applied independently to each position

Both wrapped with residual connections and layer normalization.

<div class="d-callout">
    <strong>Key point:</strong> Unlike GPT, there's no masking in the attention. Position 5 can attend to position 10. This is what makes BERT bidirectional.
</div>

## Fine-tuning BERT

The breakthrough of BERT is how simple fine-tuning becomes. For most tasks:

1. Take the pre-trained BERT model
2. Add a single task-specific layer on top
3. Fine-tune *all* parameters on your labeled data (3-4 epochs)

<figure class="d-figure">
    <div class="d-figure-content">
        <div class="finetuning-grid">
            <div class="finetune-task">
                <div class="finetune-title">Classification</div>
                <div class="finetune-example">(sentiment, NLI)</div>
                <div class="finetune-diagram">
                    <div class="finetune-output">Label</div>
                    <div class="finetune-arrow">↑</div>
                    <div class="finetune-bert">BERT</div>
                    <div class="finetune-arrow">↑</div>
                    <div class="finetune-input">
                        <span class="token special">[CLS]</span>
                        <span class="token">text</span>
                        <span class="token">...</span>
                    </div>
                </div>
            </div>
            <div class="finetune-task">
                <div class="finetune-title">Token Labeling</div>
                <div class="finetune-example">(NER, POS tagging)</div>
                <div class="finetune-diagram">
                    <div class="finetune-output-multi">
                        <span>B-PER</span>
                        <span>I-PER</span>
                        <span>O</span>
                    </div>
                    <div class="finetune-arrow">↑</div>
                    <div class="finetune-bert">BERT</div>
                    <div class="finetune-arrow">↑</div>
                    <div class="finetune-input">
                        <span class="token">John</span>
                        <span class="token">Smith</span>
                        <span class="token">works</span>
                    </div>
                </div>
            </div>
            <div class="finetune-task">
                <div class="finetune-title">Question Answering</div>
                <div class="finetune-example">(SQuAD)</div>
                <div class="finetune-diagram">
                    <div class="finetune-output">Start, End</div>
                    <div class="finetune-arrow">↑</div>
                    <div class="finetune-bert">BERT</div>
                    <div class="finetune-arrow">↑</div>
                    <div class="finetune-input">
                        <span class="token special">[CLS]</span>
                        <span class="token">Q</span>
                        <span class="token special">[SEP]</span>
                        <span class="token">Passage</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <figcaption class="d-figure-caption">
        BERT fine-tuning patterns (simplified). The same pre-trained model adapts to different tasks with minimal architecture changes.
    </figcaption>
</figure>

<figure class="d-figure">
    <div class="d-figure-content">
        <img src="/img/bert/fig4-finetuning-tasks.png" alt="BERT fine-tuning on downstream tasks" style="max-width: 100%; height: auto;">
    </div>
    <figcaption class="d-figure-caption">
        <strong>Figure 4 from the paper:</strong> How BERT is adapted to four representative downstream tasks: (a) sequence classification, (b) sentence-pair classification, (c) question answering, and (d) named entity recognition.
    </figcaption>
</figure>

### Hyperparameters for fine-tuning

The authors found most tasks work well with:
- Batch size: 16 or 32
- Learning rate: 5e-5, 3e-5, or 2e-5
- Epochs: 2, 3, or 4
- Dropout: 0.1 (kept from pre-training)

Fine-tuning is fast: minutes to hours on a single GPU for most datasets.

## Results

BERT achieved state-of-the-art on 11 NLP benchmarks at the time of publication.

### GLUE Benchmark

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Task</th>
                <th>Previous SOTA</th>
                <th>BERT-Large</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>MNLI (accuracy)</td>
                <td>80.6</td>
                <td class="good"><strong>86.7</strong></td>
            </tr>
            <tr>
                <td>QQP (F1)</td>
                <td>66.1</td>
                <td class="good"><strong>72.1</strong></td>
            </tr>
            <tr>
                <td>QNLI (accuracy)</td>
                <td>87.4</td>
                <td class="good"><strong>92.7</strong></td>
            </tr>
            <tr>
                <td>SST-2 (accuracy)</td>
                <td>93.5</td>
                <td class="good"><strong>94.9</strong></td>
            </tr>
            <tr>
                <td>CoLA (Matthew's corr)</td>
                <td>35.0</td>
                <td class="good"><strong>60.5</strong></td>
            </tr>
            <tr class="highlight-row">
                <td><strong>GLUE Average</strong></td>
                <td>72.8</td>
                <td class="good"><strong>80.5</strong></td>
            </tr>
        </tbody>
    </table>
</div>

### SQuAD (Question Answering)

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th></th>
                <th>Human</th>
                <th>Previous SOTA</th>
                <th>BERT</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>SQuAD 1.1 (F1)</td>
                <td>91.2</td>
                <td>91.7</td>
                <td class="good"><strong>93.2</strong></td>
            </tr>
            <tr>
                <td>SQuAD 2.0 (F1)</td>
                <td>89.5</td>
                <td>78.0</td>
                <td class="good"><strong>83.1</strong></td>
            </tr>
        </tbody>
    </table>
</div>

BERT exceeded human performance on SQuAD 1.1 and dramatically improved SQuAD 2.0.

## Why BERT Works

Several factors contribute to BERT's success:

### 1. True bidirectionality

Every position can attend to every other position. Information flows in all directions. This is more powerful than concatenating two unidirectional models.

### 2. Deep pre-training

12-24 layers of Transformer, pre-trained on billions of words. The model learns rich representations of language structure, syntax, and semantics—all before seeing a single labeled example.

### 3. Simple fine-tuning

No task-specific architecture needed. The same pre-trained model works for classification, tagging, and question answering. This democratized NLP: you no longer needed to design a new architecture for each task.

## Limitations and Trade-offs

<div class="d-callout warning">
    <strong>Computational cost:</strong> Pre-training BERT is expensive: days on TPUs, millions of training steps.
</div>

### Sequence length

BERT is limited to 512 tokens due to memory constraints. For long documents, you need to truncate or use sliding windows.

### The [MASK] token

The `[MASK]` token appears during pre-training but not during fine-tuning. This pre-train/fine-tune mismatch may limit performance. (Later models like XLNet and ELECTRA address this.)

### Not a language model

BERT can't generate text autoregressively like GPT. It's designed for understanding, not generation. You can't just "sample from BERT."

## Legacy

BERT sparked an explosion of research. Each successor kept the encoder-plus-pretraining
core and pushed on one axis:

<div class="d-table-wrapper">
    <table class="d-table">
        <thead>
            <tr>
                <th>Model</th>
                <th>Year</th>
                <th>Pushed on</th>
                <th>Change</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>RoBERTa</strong></td>
                <td>2019</td>
                <td><span class="bt-badge bt-badge-green">Training recipe</span></td>
                <td>More data, no NSP, longer training</td>
            </tr>
            <tr>
                <td><strong>ALBERT</strong></td>
                <td>2019</td>
                <td><span class="bt-badge bt-badge-yellow">Efficiency</span></td>
                <td>Parameter sharing across layers</td>
            </tr>
            <tr>
                <td><strong>DistilBERT</strong></td>
                <td>2019</td>
                <td><span class="bt-badge bt-badge-yellow">Efficiency</span></td>
                <td>Distilled, 40% smaller, ~97% of performance</td>
            </tr>
            <tr>
                <td><strong>XLNet</strong></td>
                <td>2019</td>
                <td><span class="bt-badge bt-badge-red">Objective</span></td>
                <td>Permutation LM, removes the [MASK] mismatch</td>
            </tr>
            <tr>
                <td><strong>ELECTRA</strong></td>
                <td>2020</td>
                <td><span class="bt-badge bt-badge-red">Objective</span></td>
                <td>Replaced-token detection instead of MLM</td>
            </tr>
            <tr>
                <td><strong>DeBERTa</strong></td>
                <td>2020</td>
                <td><span class="bt-badge bt-badge-green">Architecture</span></td>
                <td>Disentangled content and position attention</td>
            </tr>
        </tbody>
    </table>
</div>

And the broader paradigm—**pre-train, then fine-tune**—became the default for NLP, later
extending to GPT-3's few-shot prompting and today's large language models.

<div class="bt-callout bt-callout-tip">
    <strong>BERT's descendants still run in production every day.</strong> When you type a search
    query, a BERT-style encoder likely ranks the results; when a RAG system retrieves documents,
    an encoder produces the embeddings it searches over. Decoder-only models write the answers,
    but encoders are what let machines <em>find</em> and <em>compare</em> text at scale.
</div>

BERT showed that with enough pre-training, a single architecture could master almost any
NLP task. That insight changed the field.

<section class="d-bibliography">

## References

1. Devlin, J., Chang, M. W., Lee, K., & Toutanova, K. (2018).
   [BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805). NAACL 2019.

2. Peters, M. E., et al. (2018). Deep contextualized word representations (ELMo). NAACL 2018.

3. Radford, A., et al. (2018). Improving Language Understanding by Generative Pre-Training (GPT). OpenAI.

4. Vaswani, A., et al. (2017). Attention Is All You Need. NeurIPS 2017.

</section>
