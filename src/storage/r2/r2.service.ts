import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { ConfigService } from '@nestjs/config'
import { StorePayload, ImageResponse } from './r2.dtos'
import { PrismaService } from 'src/prisma.service'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'

@Injectable()
export class R2Service {
  private s3: S3Client
  private Bucket: string
  private readonly DAY_IN_SECONDS = 86400

  constructor(
    readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.Bucket = config.get<string>('CLOUDFLARE_BUCKET') as string
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: config.get<string>('CLOUDFLARE_URL'),
      credentials: {
        accessKeyId: config.get<string>('CLOUDFLARE_KEY_ID') as string,
        secretAccessKey: config.get<string>('CLOUDFLARE_ACCESS_KEY') as string,
      },
    })
  }

  async storeImage(payload: StorePayload): Promise<ImageResponse> {
    try {
      const [userId, originalName] = payload.Key.split('/')
      const object = await this.s3.send(
        new PutObjectCommand({
          Bucket: this.Bucket,
          Key: payload.Key,
          Body: payload.Body,
        })
      )
      const signedUrlInfo = await this.generateSignedUrl(payload.Key)

      const image = await this.prisma.images.create({
        data: {
          metadata: {
            ETag: JSON.parse(object.ETag as string),
            originalName,
            path: payload.Key,
            ...object.$metadata,
          },
          userId,
          url: signedUrlInfo.url,
          urlExpirationDate: signedUrlInfo.expirationDate,
        },
      })

      return {
        imageUrl: image.url,
        imageId: image.id,
        imageMetadata: image.metadata,
      }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        await this.deleteImage(payload.Key)
      }
      throw error
    }
  }

  async getImageBody(
    filePath: string
  ): Promise<GetObjectCommandOutput['Body']> {
    try {
      const test = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.Bucket,
          Key: filePath,
        })
      )

      if (!test.Body)
        throw new InternalServerErrorException(
          'Image object not found or corrupted, try uploading it again'
        )

      return test.Body
    } catch (error) {
      throw error
    }
  }

  async renewSignedUrl(imageId: number, Key: string): Promise<ImageResponse> {
    try {
      const newSignedUrl = await this.generateSignedUrl(Key)

      const image = await this.prisma.images.update({
        where: { id: imageId },
        data: {
          url: newSignedUrl.url,
          urlExpirationDate: newSignedUrl.expirationDate,
        },
      })

      return {
        imageId: image.id,
        imageUrl: image.url,
        imageMetadata: image.metadata,
      }
    } catch (error) {
      throw error
    }
  }

  private async generateSignedUrl(
    Key: string
  ): Promise<{ url: string; expirationDate: Date }> {
    const command = new GetObjectCommand({
      Bucket: this.Bucket,
      Key,
    })

    const url = await getSignedUrl(this.s3, command, {
      expiresIn: this.DAY_IN_SECONDS,
    })
    const expirationDate = new Date()
    expirationDate.setSeconds(expirationDate.getSeconds() + this.DAY_IN_SECONDS)

    return { url, expirationDate }
  }

  private async deleteImage(Key: string) {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.Bucket,
          Key,
        })
      )
    } catch (error) {
      throw error
    }
  }
}
