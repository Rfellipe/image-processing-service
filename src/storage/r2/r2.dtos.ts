export type StorePayload = {
  Key: string
  Body: Buffer<ArrayBufferLike>
}

export type ImageResponse = {
  imageUrl: string
  imageId: number
  imageMetadata: PrismaJson.ImageMetadata
}
