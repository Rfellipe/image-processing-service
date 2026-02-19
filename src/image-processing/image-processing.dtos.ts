import { z } from 'zod'

export const OutputFormatSchema = z.enum(['jpeg', 'png', 'webp', 'avif'])

export const FitModeSchema = z.enum([
  'cover',
  'contain',
  'fill',
  'inside',
  'outside',
])

export const ResizeSchema = z
  .object({
    width: z.number().int().min(1).max(8192).optional(),
    height: z.number().int().min(1).max(8192).optional(),
    fit: FitModeSchema.optional(),
  })
  .refine(data => data.width || data.height, {
    message: 'resize requires width and/or height',
  })

export const CropSchema = z.object({
  width: z.number().int().min(1).max(8192),
  height: z.number().int().min(1).max(8192),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
})

export const FiltersSchema = z
  .object({
    grayscale: z.boolean().optional(),
    sepia: z.boolean().optional(),
  })
  .partial()

export const CompressSchema = z.object({
  quality: z.number().int().min(1).max(100).optional(),
})

export const WatermarkSchema = z.object({
  text: z.string().min(1),
  fontSize: z.number().int().min(8).max(128).optional(),
  opacity: z.number().int().min(0).max(100).optional(),
})

export const TransformationsSchema = z
  .object({
    resize: ResizeSchema.optional(),
    crop: CropSchema.optional(),
    rotate: z.number().int().min(-360).max(360).optional(),
    flip: z.boolean().optional(),
    mirror: z.boolean().optional(),
    filters: FiltersSchema.optional(),
    compress: CompressSchema.optional(),
    format: OutputFormatSchema.optional(),
    watermark: WatermarkSchema.optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one transformation must be provided',
  })

export const ImageProcessingQuerySchema = z.object({
  transformations: TransformationsSchema,
})

export type ImageProcessingQuery = z.infer<typeof ImageProcessingQuerySchema>

export type ImageProcessingResponse = {}
