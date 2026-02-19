import { Injectable, Scope } from '@nestjs/common'
import { UserEntity } from 'src/auth/dtos/user.dto'
import { ImageProcessingService } from 'src/image-processing/image-processing.service'
import { R2Service } from 'src/storage/r2/r2.service'
import { ImageResponse } from 'src/storage/r2/r2.dtos'
import { ImageEntity } from './images.dtos'
import { ImageProcessingQuery } from 'src/image-processing/image-processing.dtos'

@Injectable({ scope: Scope.REQUEST })
export class ImagesService {
  constructor(
    private readonly r2: R2Service,
    private readonly imageProcessing: ImageProcessingService
  ) {}

  getImages(page?: number, limit?: number): string {
    return 'Hello from images route'
  }

  async uploadImages(
    file: Express.Multer.File,
    user: UserEntity
  ): Promise<ImageResponse> {
    try {
      const imageData = await this.r2.storeImage({
        Key: `${user.sub}/${file.originalname}`,
        Body: file.buffer,
      })

      return imageData
    } catch (error) {
      throw error
    }
  }

  async updateImage(
    image: ImageEntity,
    user: UserEntity,
    query: ImageProcessingQuery
  ): Promise<ImageResponse> {
    const imageBody = await this.r2.getImageBody(image.metadata.path)

    const newImageBody = await this.imageProcessing.transformImage(
      imageBody,
      query
    )

    const newImageData = await this.r2.storeImage({
      Key: `${user.sub}/resized_${image.metadata.originalName}`,
      Body: newImageBody,
    })

    return newImageData
  }

  async getImage(image: ImageEntity): Promise<ImageResponse> {
    try {
      const currentDate = new Date()

      if (image.urlExpirationDate < currentDate) {
        return this.r2.renewSignedUrl(image.id, image.metadata.path)
      }

      return {
        imageId: image.id,
        imageMetadata: image.metadata,
        imageUrl: image.url,
      }
    } catch (error) {
      throw error
    }
  }
}
