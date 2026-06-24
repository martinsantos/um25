import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.union([z.string(), z.date()]).optional(),
    updatedDate: z.union([z.string(), z.date()]).optional(),
    heroImage: z.string().optional(),
  }).passthrough(),
});

export const collections = { blog };
