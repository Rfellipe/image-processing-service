import { JsonValue } from '@prisma/client/runtime/client'

export type StorePayload = {
  Key: string
  Body: Buffer<ArrayBufferLike>
}

export type ImageResponse = {
  imageUrl: string
  imageId: number
  imageMetadata: JsonValue
}
