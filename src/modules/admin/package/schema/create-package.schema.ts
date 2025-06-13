import { z } from 'zod';

export const createPackageSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    price: z.number(),
    duration: z.string(),
    min_capacity: z.number().optional(),
    max_capacity: z.number(),
    package_tags: z.array(z.string()).optional(),
    package_files: z.array(z.string()).optional(),
    trip_plans: z.array(z.string()).optional(),
    trip_plans_images: z.array(z.string()).optional(),
  })
  .required();

export type CreatePackageDto = z.infer<typeof createPackageSchema>;
