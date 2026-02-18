import z from 'zod'

export const ImageSchema = z
  .custom<Express.Multer.File>(
    f => !!f && typeof f === 'object' && 'mimetype' in (f as any),
    {
      message: 'File is required',
    }
  )
  .refine(f => ['image/png', 'image/jpeg'].includes(f.mimetype), {
    message: 'Only PNG or JPEG allowed',
  })

export type ImageEntity = {
  metadata: PrismaJson.ImageMetadata
  id: number
  url: string
  urlExpirationDate: Date
}
