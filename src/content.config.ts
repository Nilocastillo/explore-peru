import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const tourSchema = z.object({
    title: z.string(),
    duration: z.string(),
    location: z.string(),
    departure: z.string(),
    category: z.array(z.string()),
    difficulty: z.string(),
    walkingTime: z.string().optional(),
    description: z.string(),
    image: z.string(),
    alt: z.string(),
    meta_title: z.string(),
    meta_description: z.string(),
    badge: z.string().optional(),
  });

const tours = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/tours" }),
  schema: tourSchema,
});

const toursEn = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/tours-en" }),
  schema: tourSchema,
});

export const collections = { tours, toursEn };
