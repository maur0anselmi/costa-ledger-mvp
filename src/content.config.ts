import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Parsea tanto textos únicos ("Costa del Sol") como listas (["Costa del Sol", "Gibraltar"])
const stringOrArray = z.union([z.string(), z.array(z.string())])
  .transform(val => (Array.isArray(val) ? val : [val]));

const intelligence = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: 'src/content/intelligence' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    region: stringOrArray,
    pillar: stringOrArray,
    subcategory: stringOrArray,
    badgeType: z.string(),
    keyMetric: z.string().optional(),
    publishedDate: z.coerce.date(),
    readTime: z.string(),
    featured: z.boolean().default(false)
  }),
});

export const collections = { intelligence };