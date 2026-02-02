# Understanding BERT

**Subtitle:** Pre-training deep bidirectional representations for language understanding.

**Authors:** Jacob Devlin, Ming-Wei Chang, Kenton Lee, Kristina Toutanova  
**Affiliation:** Google AI Language  
**Published:** October 2018  
**DOI:** [arXiv:1810.04805](https://arxiv.org/abs/1810.04805)

---

> This article explains the landmark paper *BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding* by Devlin et al. (2018), which introduced a new paradigm for NLP: pre-train once, fine-tune everywhere.

---

## Introduction

In 2018, NLP faced a dilemma. Deep learning had revolutionized computer vision with ImageNet pre-training—train a big model on millions of images, then fine-tune for your specific task. But language didn't have an equivalent.

Previous approaches fell into two camps:

- **Feature-based** (ELMo): Pre-train embeddings, freeze them, add task-specific architecture on top
- **Fine-tuning** (GPT): Pre-train a language model, fine-tune the whole thing—but only looking left-to-right

BERT unified and improved both: a single pre-trained model that could be fine-tuned for almost any NLP task, while capturing context from *both directions*.

---

## The Directionality Problem

### Why direction matters

Consider the sentence:

> "The bank by the river was steep."

To understand "bank" correctly, you need:
- **Left context**: "The" (not very helpful)
- **Right context**: "by the river" (critical—this means riverbank, not financial institution)

A left-to-right language model can't use the right context when processing "bank." It's fundamentally limited.

### Previous solutions

**ELMo** trained two separate LSTMs—one left-to-right, one right-to-left—and concatenated their outputs. This captures both directions, but the two directions don't interact during training. Each direction is learned independently.

**GPT** used a Transformer decoder, but it's autoregressive: each position can only attend to positions on its left. It's powerful, but still unidirectional.

**Key question:** Can we train a single model where every position attends to every other position—truly bidirectional?

---

## The Bidirectional Challenge

The problem with "just make it bidirectional" is subtle but fundamental.

In a standard language model, you predict the next word given previous words:

$$P(w_t | w_1, w_2, \ldots, w_{t-1})$$

This is well-defined. Each word is predicted from context that doesn't include itself.

But if you allow bidirectional attention, each word can "see itself" through the other words. The model could trivially learn to copy. The training objective breaks down.

**BERT's insight:** Don't predict the next word. Predict *masked* words.

---

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

### Why the 80/10/10 split?

If we always used `[MASK]`, the model would never see real words in those positions during pre-training, but during fine-tuning there are no `[MASK]` tokens. This creates a mismatch.

The 10% random replacement teaches the model that it can't just trust every token it sees. The 10% unchanged teaches the model to use context even when the token looks "normal."

### The equation

For each masked position $i$, BERT outputs a distribution over the vocabulary:

$$P(w_i | \text{context}) = \text{softmax}(W_o \cdot h_i + b_o)$$

Where $h_i$ is the final hidden state at position $i$, and $W_o$ projects to vocabulary size.

**Color codes:**
- <span style="color: #e07b39;">**Target**</span>: the masked position $h_i$
- <span style="color: #7b68a4;">**Context**</span>: all other positions (bidirectional!)
- <span style="color: #4a90a4;">**Parameters**</span>: $W_o$, $b_o$

---

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

```
[CLS] tokens of sentence A [SEP] tokens of sentence B [SEP]
```

- `[CLS]` — a special token whose final hidden state is used for classification
- `[SEP]` — separator between sentences

The `[CLS]` token's output becomes the aggregate sequence representation, used for sentence-level predictions.

---

## BERT Architecture

BERT uses the **Transformer encoder** architecture—the same one from "Attention Is All You Need," but without the decoder.

### Model sizes

| | BERT-Base | BERT-Large |
|---|---|---|
| Layers (L) | 12 | 24 |
| Hidden size (H) | 768 | 1024 |
| Attention heads (A) | 12 | 16 |
| Parameters | 110M | 340M |

### Input representation

Each input token is represented as the sum of three embeddings:

$$\text{Input} = E_{\text{token}} + E_{\text{segment}} + E_{\text{position}}$$

- **Token embedding**: WordPiece vocabulary of 30,000 tokens
- **Segment embedding**: Which sentence (A or B) this token belongs to
- **Position embedding**: Learned (not sinusoidal like the original Transformer)

### The computation

Stack of $L$ identical layers, each containing:

1. **Multi-head self-attention** — every position attends to every position
2. **Feed-forward network** — applied independently to each position

Both wrapped with residual connections and layer normalization.

**Key point:** Unlike GPT, there's no masking in the attention. Position 5 can attend to position 10. This is what makes BERT bidirectional.

---

## Pre-training Data and Procedure

### Data

- **BooksCorpus** (800M words): 11,038 unpublished books
- **English Wikipedia** (2,500M words): text only, no lists/tables/headers

Total: ~3.3 billion words of pre-training data.

### Training details

- Batch size: 256 sequences × 512 tokens = 131,072 tokens/batch
- Training steps: 1,000,000 (about 40 epochs over the data)
- Optimizer: Adam with learning rate warmup and linear decay
- Hardware: 4 Cloud TPUs (16 TPU chips) for BERT-Base; 16 TPUs for BERT-Large
- Time: 4 days for BERT-Base; more for BERT-Large

---

## Fine-tuning BERT

The breakthrough of BERT is how simple fine-tuning becomes. For most tasks:

1. Take the pre-trained BERT model
2. Add a single task-specific layer on top
3. Fine-tune *all* parameters on your labeled data (3-4 epochs)

### Task adaptations

**Sentence classification** (e.g., sentiment):
- Use `[CLS]` token's output
- Add a softmax classifier: $P(c) = \text{softmax}(W \cdot h_{\text{[CLS]}})$

**Token classification** (e.g., named entity recognition):
- Use each token's output
- Add a softmax classifier per position

**Question answering** (e.g., SQuAD):
- Input: `[CLS] question [SEP] passage [SEP]`
- Learn two vectors: $S$ (start) and $E$ (end)
- For each passage token $i$, compute: $P_{\text{start}}(i) = \text{softmax}(S \cdot h_i)$
- Similarly for end position
- Answer span = highest $P_{\text{start}}(i) \cdot P_{\text{end}}(j)$ where $j \geq i$

**Sentence pair classification** (e.g., NLI):
- Input: `[CLS] sentence A [SEP] sentence B [SEP]`
- Use `[CLS]` output for classification

### Hyperparameters for fine-tuning

The authors found most tasks work well with:
- Batch size: 16 or 32
- Learning rate: 5e-5, 3e-5, or 2e-5
- Epochs: 2, 3, or 4
- Dropout: 0.1 (kept from pre-training)

Fine-tuning is fast: minutes to hours on a single GPU for most datasets.

---

## Results

BERT achieved state-of-the-art on 11 NLP benchmarks at the time of publication.

### GLUE Benchmark

| Task | Previous SOTA | BERT-Large |
|------|---------------|------------|
| MNLI (accuracy) | 80.6 | **86.7** |
| QQP (F1) | 66.1 | **72.1** |
| QNLI (accuracy) | 87.4 | **92.7** |
| SST-2 (accuracy) | 93.5 | **94.9** |
| CoLA (Matthew's corr) | 35.0 | **60.5** |
| STS-B (Pearson corr) | 81.0 | **86.5** |
| MRPC (F1) | 84.4 | **89.3** |
| RTE (accuracy) | 61.7 | **70.1** |
| **GLUE Average** | 72.8 | **80.5** |

### SQuAD (Question Answering)

| | Human | Previous SOTA | BERT |
|---|---|---|---|
| SQuAD 1.1 (F1) | 91.2 | 91.7 | **93.2** |
| SQuAD 2.0 (F1) | 89.5 | 78.0 | **83.1** |

BERT exceeded human performance on SQuAD 1.1 and dramatically improved SQuAD 2.0, which includes unanswerable questions.

---

## Ablation Studies

The authors conducted careful ablations to understand what matters.

### Pre-training objectives

| Configuration | MNLI | SQuAD |
|---------------|------|-------|
| BERT (MLM + NSP) | 84.4 | 88.4 |
| No NSP | 83.9 | 87.9 |
| Left-to-right only | 82.1 | 87.1 |
| + BiLSTM | 82.1 | 87.7 |

**Findings:**
- NSP helps for tasks involving sentence pairs
- Bidirectionality is crucial (left-to-right drops 2+ points)
- A BiLSTM on top doesn't recover what's lost by not being bidirectional during pre-training

### Model size

Bigger is better—even for small datasets. A larger pre-trained model, fine-tuned on a small dataset, outperforms a smaller model fine-tuned on the same data. This was surprising at the time.

---

## Why BERT Works

Several factors contribute to BERT's success:

### 1. True bidirectionality

Every position can attend to every other position. Information flows in all directions. This is more powerful than concatenating two unidirectional models.

### 2. Deep pre-training

12-24 layers of Transformer, pre-trained on billions of words. The model learns rich representations of language structure, syntax, and semantics—all before seeing a single labeled example.

### 3. Simple fine-tuning

No task-specific architecture needed. The same pre-trained model works for classification, tagging, and question answering. This democratized NLP: you no longer needed to design a new architecture for each task.

### 4. Shared representations

The pre-trained representations capture general linguistic knowledge. Fine-tuning specializes them for a specific task, but starts from a strong foundation.

---

## Limitations and Trade-offs

### Computational cost

Pre-training BERT is expensive: days on TPUs, millions of training steps. Fine-tuning is cheap, but you need the pre-trained checkpoint.

### Sequence length

BERT is limited to 512 tokens due to memory constraints. For long documents, you need to truncate or use sliding windows.

### The `[MASK]` token

The `[MASK]` token appears during pre-training but not during fine-tuning. This pre-train/fine-tune mismatch may limit performance. (Later models like XLNet and ELECTRA address this.)

### Not a language model

BERT can't generate text autoregressively like GPT. It's designed for understanding, not generation. You can't just "sample from BERT."

---

## Legacy

BERT sparked an explosion of research:

- **RoBERTa** (2019): More data, no NSP, better hyperparameters
- **ALBERT** (2019): Parameter sharing for efficiency
- **DistilBERT** (2019): Smaller, faster, retains 97% of performance
- **XLNet** (2019): Permutation language modeling
- **ELECTRA** (2020): Replaced token detection instead of MLM
- **DeBERTa** (2020): Disentangled attention

And the broader paradigm—**pre-train, then fine-tune**—became the default approach for NLP, eventually extending to GPT-3's few-shot learning and beyond.

BERT showed that with enough pre-training, a single model architecture could master almost any NLP task. That insight changed the field.

---

## References

1. Devlin, J., Chang, M. W., Lee, K., & Toutanova, K. (2018). [BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805). NAACL 2019.

2. Peters, M. E., et al. (2018). Deep contextualized word representations (ELMo). NAACL 2018.

3. Radford, A., et al. (2018). Improving Language Understanding by Generative Pre-Training (GPT). OpenAI.

4. Vaswani, A., et al. (2017). Attention Is All You Need. NeurIPS 2017.
