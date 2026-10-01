import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    authors: z.array(z.string()),
    affiliations: z.array(z.string()),
    published: z.string(),
    // When this post was written. Only set when `published` means something else
    // (paper explainers carry the paper's date); the date views sort by this.
    written: z.string().optional(),
    doi: z.string().optional(),
    doiUrl: z.string().optional(),
    abstract: z.string(),
    tags: z.array(z.string()).default(['explainer']),
    thumbnail: z.string().optional(),
    category: z.enum(['ml', 'dev', 'business']).default('ml'),
  }),
});

export const collections = { posts };
