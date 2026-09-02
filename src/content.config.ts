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
    featured: z.boolean().default(false),
    // CAMPOS DE IMAGEN:
    image: z.string().optional(),
    imageCaption: z.string().optional(),
  }),
});

export const collections = { intelligence };