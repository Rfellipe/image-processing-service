import { Injectable, Scope } from '@nestjs/common'
import { UserEntity } from 'src/auth/dtos/user.dto'
import { ImageProcessingService } from 'src/image-processing/image-processing.service'
import { R2Service } from 'src/storage/r2/r2.service'
import { ImageResponse } from 'src/storage/r2/r2.dtos'
import { ImageEntity, PaginatedImagesResponse } from './images.dtos'
import { ImageProcessingQuery } from 'src/image-processing/image-processing.dtos'
import { PrismaService } from 'src/general/prisma.service'

@Injectable({ scope: Scope.REQUEST })
export class ImagesService {
  constructor(
    private readonly r2: R2Service,
    private readonly prisma: PrismaService,
    private readonly imageProcessing: ImageProcessingService
  ) {}

  async getImages(
    user: UserEntity,
    page = 1,
    limit = 20
  ): Promise<PaginatedImagesResponse> {
    const safeLimit = Math.min(Math.max(limit, 1), 100)
    const safePage = Math.max(page, 1)
    const skip = (safePage - 1) * safeLimit

    const [total, images] = await Promise.all([
      this.prisma.images.count({ where: { userId: user.sub } }),
      this.prisma.images.findMany({
        where: { userId: user.sub },
        orderBy: { id: 'desc' },
        skip,
        take: safeLimit,
        select: {
          id: true,
          url: true,
          urlExpirationDate: true,
          metadata: true,
        },
      }),
    ])

    const now = new Date()
    const renewedImages: ImageResponse[] = await Promise.all(
      images.map(async img => {
        const defImg = {
          imageUrl: img.url,
          imageId: img.id,
          imageMetadata: img.metadata,
        }
        if (img.urlExpirationDate >= now) return defImg
        try {
          const renewed = await this.r2.renewSignedUrl(
            img.id,
            img.metadata.path
          )
          return renewed
        } catch {
          return defImg
        }
      })
    )

    const totalPages = Math.max(Math.ceil(total / safeLimit), 1)

    return {
      images: renewedImages,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    }
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
      Key: `${user.sub}/transformed_${image.metadata.originalName}`,
      Body: newImageBody,
    })

    return newImageData
  }

  async getImage(image: ImageEntity): Promise<ImageResponse> {
    try {
      const currentDate = new Date()

      if (image.urlExpirationDate <= currentDate) {
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
