import { ForbiddenException, Injectable, Scope } from '@nestjs/common'
import { UserEntity } from 'src/auth/dtos/user.dto'
import { PrismaService } from 'src/prisma.service'
import { ImageResponse } from 'src/storage/r2/r2.dtos'
import { R2Service } from 'src/storage/r2/r2.service'

@Injectable({ scope: Scope.REQUEST })
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2Service
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

  updateImage(): string {
    return 'Hello from PUT image/:id route'
  }

  async getImage(imageId: number, user: UserEntity): Promise<ImageResponse> {
    try {
      const currentDate = new Date()
      const image = await this.prisma.images.findUnique({
        where: { id: imageId, AND: { userId: user.sub } },
        select: {
          id: true,
          url: true,
          urlExpirationDate: true,
          metadata: true,
        },
      })

      if (!image) throw new ForbiddenException('Image not found')

      if (image.urlExpirationDate < currentDate) {
        return this.r2.renewSignedUrl(imageId, image.metadata.path)
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
