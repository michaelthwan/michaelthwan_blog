import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    authors: z.array(z.string()),
    affiliations: z.array(z.string()),
    published: z.string(),
    doi: z.string().optional(),
    doiUrl: z.string().optional(),
    abstract: z.string(),
    tags: z.array(z.string()).default(['explainer']),
    thumbnail: z.string().optional(),
  }),
});

export const collections = { posts };
