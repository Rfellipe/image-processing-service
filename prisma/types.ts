declare global {
  namespace PrismaJson {
    type ImageMetadata = {
      ETag: string
      originalName: string
      path: string
      attempts?: number
      httpStatusCode?: number
      totalRetryDelay?: number
      requestId?: string
      extendedRequestId?: string
      cfId?: string
    }
  }
}

export {}
