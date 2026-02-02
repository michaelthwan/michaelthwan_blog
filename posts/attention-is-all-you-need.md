# Understanding the Transformer

> **Summary:** The Transformer is a neural network architecture that relies entirely on attention mechanisms, dispensing with recurrence and convolutions. We build it from first principles, showing why each component exists and how the pieces fit together.

---

## Contents

- [The Sequential Bottleneck](#the-sequential-bottleneck)
- [Attention as a Lookup](#attention-as-a-lookup)
- [Scaled Dot-Product Attention](#scaled-dot-product-attention)
- [Multi-Head Attention](#multi-head-attention)
- [The Transformer Architecture](#the-transformer-architecture)
- [Positional Encoding](#positional-encoding)
- [Why Self-Attention?](#why-self-attention)
- [Training and Results](#training-and-results)
- [Into the Weeds](#into-the-weeds)

---

## The Sequential Bottleneck

Before the Transformer, the dominant approach to sequence tasks—machine translation, language modeling, text generation—was the **recurrent neural network (RNN)**, particularly LSTMs and GRUs.

RNNs process sequences one token at a time. To compute the hidden state at position $t$, you need the hidden state at position $t-1$:

$$
h_t = f(h_{t-1}, x_t)
$$

This creates two problems:

### Problem 1: No parallelization

Because each step depends on the previous step, you cannot parallelize computation within a single sequence. Training is inherently sequential in time. For long sequences, this becomes a severe bottleneck.

```
Token:    x₁ → x₂ → x₃ → x₄ → x₅ → ...
Hidden:   h₁ → h₂ → h₃ → h₄ → h₅ → ...
              ↑     ↑     ↑     ↑
           must wait for previous
```

### Problem 2: Long-range dependencies are hard

Information from early tokens must survive many sequential steps to influence later processing. Gradients must flow backward through all those steps. In practice, this makes learning long-range dependencies difficult, even with gating mechanisms like LSTM.

> **Key question:** Can we design an architecture where every position can directly attend to every other position—without sequential dependencies?

The answer is the **Transformer**.

---

## Attention as a Lookup

The core idea of attention is surprisingly simple: it's a **soft lookup** into a set of values, where the lookup key determines how much weight to give each value.

Think of it like a database query:
- You have a **query** (what you're looking for)
- You have a set of **keys** (labels for stored items)
- You have a set of **values** (the stored items themselves)

The attention mechanism compares your query to each key, computes a relevance score, and returns a weighted combination of the values.

```
Query: "What information is relevant to translating this word?"

Keys:   [k₁, k₂, k₃, k₄, k₅]     ← representations of source positions
Values: [v₁, v₂, v₃, v₄, v₅]     ← information at those positions

Scores: [0.1, 0.7, 0.05, 0.1, 0.05]  ← how relevant is each position?

Output: 0.1·v₁ + 0.7·v₂ + 0.05·v₃ + 0.1·v₄ + 0.05·v₅
```

The key insight: **attention connects any two positions in constant time**. There's no sequential path that information must traverse.

---

## Scaled Dot-Product Attention

The Transformer uses a specific form of attention called **Scaled Dot-Product Attention**.

### The Mechanism

Given:
- Queries $Q \in \mathbb{R}^{n \times d_k}$ (what we're looking for)
- Keys $K \in \mathbb{R}^{m \times d_k}$ (what we're looking in)
- Values $V \in \mathbb{R}^{m \times d_v}$ (what we retrieve)

The attention output is:

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right) V
$$

### Color codes

- **Query** $Q$: what information does this position need?
- **Key** $K$: what information does this position offer?
- **Value** $V$: the actual content to retrieve
- **Scaling** $\sqrt{d_k}$: prevents dot products from growing too large

### Step by step

1. **Compute compatibility scores**: $QK^T$ gives an $n \times m$ matrix of dot products. Entry $(i, j)$ measures how much query $i$ matches key $j$.

2. **Scale**: Divide by $\sqrt{d_k}$. Without scaling, large $d_k$ values push dot products into regions where softmax has very small gradients.

3. **Normalize**: Apply softmax row-wise. Each query now has a probability distribution over keys.

4. **Retrieve**: Multiply by $V$. Each output is a weighted combination of values, weighted by attention scores.

### Why dot-product attention?

Additive attention (using a learned feed-forward network) has similar theoretical complexity, but dot-product attention is **much faster** in practice—it's just matrix multiplication, highly optimized on modern hardware.

### Why scale?

For large $d_k$, the dot products $q \cdot k$ tend to have large magnitude (variance roughly $d_k$). This pushes softmax into saturated regions where gradients vanish. Scaling by $\sqrt{d_k}$ keeps the variance at 1.

---

## Multi-Head Attention

A single attention function can only focus on one type of relationship at a time. What if we want to attend to different aspects simultaneously—syntactic structure, semantic similarity, positional proximity?

**Multi-Head Attention** runs multiple attention functions in parallel, each with its own learned projections.

### The Mechanism

Instead of one attention function with $d_{\text{model}}$-dimensional keys, values, and queries:

1. **Project** $Q$, $K$, $V$ into $h$ different subspaces using learned linear projections
2. **Apply attention** independently in each subspace (each "head")
3. **Concatenate** the outputs
4. **Project** back to $d_{\text{model}}$ dimensions

$$
\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, \ldots, \text{head}_h) W^O
$$

where each head is:

$$
\text{head}_i = \text{Attention}(Q W_i^Q, K W_i^K, V W_i^V)
$$

### Color codes

- **Projection matrices** $W_i^Q, W_i^K, W_i^V$: learned transformations into subspace $i$
- **Output projection** $W^O$: combines all heads back together
- **Head dimension**: $d_k = d_v = d_{\text{model}} / h$

### Why multiple heads?

Each head can learn to attend to different things:
- One head might focus on the previous word
- Another might focus on the subject of the sentence
- Another might focus on semantically similar words

The Transformer paper uses $h = 8$ heads with $d_k = d_v = 64$ (for $d_{\text{model}} = 512$).

### Computational cost

With reduced per-head dimension, the total computational cost is similar to single-head attention with full dimensionality. You get multiple attention patterns for roughly the same price.

---

## The Transformer Architecture

Now we can assemble the full Transformer. It follows the classic **encoder-decoder** structure, but built entirely from attention and feed-forward layers.

### Encoder

The encoder processes the input sequence and produces a sequence of representations.

**Each encoder layer has two sub-layers:**

1. **Multi-head self-attention**: Every position attends to every position in the input
2. **Position-wise feed-forward network**: A two-layer MLP applied independently to each position

$$
\text{FFN}(x) = \max(0, xW_1 + b_1)W_2 + b_2
$$

**Residual connections and layer normalization** wrap each sub-layer:

$$
\text{output} = \text{LayerNorm}(x + \text{Sublayer}(x))
$$

The encoder is a stack of $N = 6$ identical layers.

### Decoder

The decoder generates the output sequence one token at a time, attending to both itself and the encoder output.

**Each decoder layer has three sub-layers:**

1. **Masked multi-head self-attention**: Each position attends only to earlier positions (preserves autoregressive property)
2. **Encoder-decoder attention**: Queries come from the decoder; keys and values come from the encoder
3. **Position-wise feed-forward network**: Same as in encoder

The decoder is also a stack of $N = 6$ identical layers.

### Why masking in the decoder?

During training, we feed the entire target sequence to the decoder at once (for parallelization). But the model shouldn't be able to "see the future"—position $i$ should only depend on positions $< i$. Masking sets attention scores to $-\infty$ for illegal positions, which become 0 after softmax.

### The complete picture

```
Input Embeddings                     Output Embeddings (shifted right)
       ↓                                       ↓
   + Positional                           + Positional
   Encoding                               Encoding
       ↓                                       ↓
┌──────────────┐                    ┌──────────────────┐
│   Encoder    │                    │     Decoder      │
│   Layer ×6   │ ──────────────────→│     Layer ×6     │
│              │  (Keys, Values)    │                  │
└──────────────┘                    └──────────────────┘
                                           ↓
                                    Linear + Softmax
                                           ↓
                                    Output Probabilities
```

---

## Positional Encoding

There's a critical missing piece: **the Transformer has no notion of position**.

Self-attention is permutation-equivariant. If you shuffle the input tokens, the outputs shuffle in the same way. But word order matters! "Dog bites man" and "Man bites dog" mean very different things.

### The solution: add positional information

The Transformer adds **positional encodings** to the input embeddings. These encodings have the same dimension $d_{\text{model}}$ as the embeddings, so they can simply be summed.

### Sinusoidal encoding

The paper uses sine and cosine functions of different frequencies:

$$
PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)
$$

$$
PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)
$$

- $pos$ is the position in the sequence
- $i$ is the dimension
- Each dimension gets a sinusoid with a different wavelength

### Why sinusoids?

**Hypothesis 1: Relative positions are learnable.** For any fixed offset $k$, $PE_{pos+k}$ can be written as a linear function of $PE_{pos}$. The model can learn to attend by relative position.

**Hypothesis 2: Extrapolation.** Sinusoidal encodings might generalize to sequence lengths longer than those seen during training.

The paper also tried **learned positional embeddings** and found nearly identical results. Sinusoids were chosen for their potential extrapolation benefits.

---

## Why Self-Attention?

Why prefer self-attention over recurrence or convolutions? The paper gives three reasons:

### 1. Computational complexity per layer

| Layer Type | Complexity | Sequential Ops | Max Path Length |
|------------|------------|----------------|-----------------|
| Self-Attention | $O(n^2 \cdot d)$ | $O(1)$ | $O(1)$ |
| Recurrent | $O(n \cdot d^2)$ | $O(n)$ | $O(n)$ |
| Convolutional | $O(k \cdot n \cdot d^2)$ | $O(1)$ | $O(\log_k n)$ |

For typical NLP settings where sequence length $n$ is smaller than representation dimension $d$, self-attention is faster than recurrence.

### 2. Parallelization

Self-attention connects all positions in $O(1)$ sequential operations. Recurrence requires $O(n)$ sequential operations. This is crucial for training on modern hardware.

### 3. Path length for long-range dependencies

Self-attention connects any two positions directly. Information flows from position $i$ to position $j$ in one step. With recurrence, it takes $O(n)$ steps. Shorter paths make learning long-range dependencies easier.

### Trade-off: memory

Self-attention has $O(n^2)$ memory complexity (storing all attention scores). For very long sequences, this can become prohibitive. The paper suggests restricted attention (attending only to a local window) as a potential solution.

---

## Training and Results

### Training setup

- **Data**: WMT 2014 English-German (4.5M sentence pairs) and English-French (36M sentences)
- **Hardware**: 8 NVIDIA P100 GPUs
- **Time**: Base model: 12 hours (100K steps). Big model: 3.5 days (300K steps)
- **Optimizer**: Adam with a custom learning rate schedule (warmup + decay)

### Learning rate schedule

$$
\text{lr} = d_{\text{model}}^{-0.5} \cdot \min(\text{step}^{-0.5}, \text{step} \cdot \text{warmup}^{-1.5})
$$

The learning rate increases linearly during warmup (4000 steps), then decreases proportionally to the inverse square root of the step number.

### Regularization

- **Dropout**: Applied to sub-layer outputs, attention weights, and embeddings. $P_{\text{drop}} = 0.1$ for base model.
- **Label smoothing**: $\epsilon_{ls} = 0.1$. Hurts perplexity but improves BLEU.

### Results

| Model | EN-DE BLEU | EN-FR BLEU | Training Cost |
|-------|------------|------------|---------------|
| Previous SOTA (ensemble) | 26.36 | 41.29 | $7.7 \times 10^{19}$ FLOPs |
| Transformer (base) | 27.3 | 38.1 | $3.3 \times 10^{18}$ FLOPs |
| Transformer (big) | **28.4** | **41.8** | $2.3 \times 10^{19}$ FLOPs |

The Transformer achieves state-of-the-art BLEU scores at a fraction of the training cost.

---

## Into the Weeds

### Model hyperparameters

**Base model:**
- $N = 6$ layers
- $d_{\text{model}} = 512$
- $d_{ff} = 2048$
- $h = 8$ heads
- $d_k = d_v = 64$
- 65M parameters

**Big model:**
- $N = 6$ layers
- $d_{\text{model}} = 1024$
- $d_{ff} = 4096$
- $h = 16$ heads
- 213M parameters

### Ablation studies

The paper systematically varies each hyperparameter:

- **Number of heads**: Single-head is 0.9 BLEU worse. Too many heads (32) also hurts slightly.
- **Key dimension**: Reducing $d_k$ hurts quality, suggesting compatibility computation benefits from higher dimensions.
- **Depth**: Fewer layers (2, 4) hurt significantly. 8 layers provide marginal improvement.
- **Width**: Larger $d_{\text{model}}$ and $d_{ff}$ improve quality.
- **Dropout**: Essential. Without dropout, the model overfits.
- **Positional encoding**: Learned embeddings perform identically to sinusoids.

### Attention visualizations

The paper includes attention head visualizations showing:

- Different heads learn different patterns
- Some heads clearly track syntactic dependencies (e.g., verb → object)
- Some heads perform anaphora resolution (e.g., "its" → "law")
- Some heads follow long-distance dependencies

This interpretability is a side benefit of attention-based models.

### Beyond translation

The Transformer also achieves strong results on English constituency parsing, demonstrating generalization beyond translation. A 4-layer Transformer trained on 40K sentences matches or exceeds previous discriminative parsers.

---

## Summary

The Transformer introduces a new architecture paradigm:

1. **Attention is all you need**: No recurrence, no convolution—just attention and feed-forward layers.

2. **Parallelization**: Every position can be computed simultaneously. Training is much faster.

3. **Direct connections**: Any two positions are connected in $O(1)$ steps. Long-range dependencies are easier to learn.

4. **Multi-head attention**: Multiple attention functions let the model focus on different aspects of the input.

5. **Simplicity**: Despite the technical details, the Transformer is built from only a few primitive operations: attention, feed-forward layers, residual connections, and layer normalization.

The impact of this paper has been enormous. Nearly every major language model since 2017—BERT, GPT, T5, PaLM, LLaMA—is built on the Transformer architecture.

---

## References

1. Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., & Polosukhin, I. (2017). [Attention Is All You Need](https://arxiv.org/abs/1706.03762). *NeurIPS 2017*.

2. Bahdanau, D., Cho, K., & Bengio, Y. (2014). Neural Machine Translation by Jointly Learning to Align and Translate. *ICLR 2015*.

3. Ba, J. L., Kiros, J. R., & Hinton, G. E. (2016). Layer Normalization. *arXiv:1607.06450*.

---

## Acknowledgments

This post is inspired by the Distill publication style. The original Transformer paper is by Vaswani et al. at Google Brain and Google Research.
