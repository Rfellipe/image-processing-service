import {
  ApiBody,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger'
import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common'
import { ImagesService } from './images.service'
import { AuthGuard } from 'src/auth/auth.guard'
import { FileInterceptor } from '@nestjs/platform-express'
import { ZodValidationPipe } from 'src/general/zod.pipe'
import {
  type ImageEntity,
  ImageSchema,
  PaginatedImagesResponse,
} from './images.dtos'
import { ImageResponse } from 'src/storage/r2/r2.dtos'
import { User } from 'src/auth/auth.decorator'
import { type UserEntity } from 'src/auth/dtos/user.dto'
import { ImageGuard } from './images.guard'
import { Image } from './image.decorator'
import {
  ImageProcessingQuerySchema,
  type ImageProcessingQuery,
} from 'src/image-processing/image-processing.dtos'

@Controller('images')
@UseGuards(AuthGuard)
export class ImagesController {
  constructor(private readonly imageService: ImagesService) {}

  @Get()
  async getImages(
    @User() user: UserEntity,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ): Promise<PaginatedImagesResponse> {
    return await this.imageService.getImages(user, page, limit)
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadImages(
    @UploadedFile(new ZodValidationPipe(ImageSchema)) file: Express.Multer.File,
    @User() user: UserEntity
  ): Promise<ImageResponse> {
    return await this.imageService.uploadImages(file, user)
  }

  @Put(':id/transform')
  @UseGuards(ImageGuard)
  @UsePipes(new ZodValidationPipe(ImageProcessingQuerySchema))
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Image id',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['transformations'],
      properties: {
        transformations: {
          type: 'object',
          description: 'At least one transformation must be provided',
          properties: {
            resize: {
              type: 'object',
              properties: {
                width: { type: 'integer', minimum: 1, maximum: 8192 },
                height: { type: 'integer', minimum: 1, maximum: 8192 },
                fit: {
                  type: 'string',
                  enum: ['cover', 'contain', 'fill', 'inside', 'outside'],
                },
              },
            },
            crop: {
              type: 'object',
              required: ['width', 'height', 'x', 'y'],
              properties: {
                width: { type: 'integer', minimum: 1, maximum: 8192 },
                height: { type: 'integer', minimum: 1, maximum: 8192 },
                x: { type: 'integer', minimum: 0 },
                y: { type: 'integer', minimum: 0 },
              },
            },
            rotate: { type: 'integer', minimum: -360, maximum: 360 },
            flip: { type: 'boolean' },
            mirror: { type: 'boolean' },
            filters: {
              type: 'object',
              properties: {
                grayscale: { type: 'boolean' },
                sepia: { type: 'boolean' },
              },
            },
            compress: {
              type: 'object',
              properties: {
                quality: { type: 'integer', minimum: 1, maximum: 100 },
              },
            },
            format: {
              type: 'string',
              enum: ['jpeg', 'png', 'webp', 'avif'],
            },
            watermark: {
              type: 'object',
              required: ['text'],
              properties: {
                text: { type: 'string', minLength: 1 },
                fontSize: { type: 'integer', minimum: 8, maximum: 128 },
                opacity: { type: 'integer', minimum: 0, maximum: 100 },
              },
            },
          },
        },
      },
    },
  })
  async updateImage(
    @Image() image: ImageEntity,
    @User() user: UserEntity,
    @Body() body: ImageProcessingQuery
  ): Promise<ImageResponse> {
    return await this.imageService.updateImage(image, user, body)
  }

  @Get(':id')
  @UseGuards(ImageGuard)
  async getImage(
    @Param('id', ParseIntPipe) _: number,
    @Image() image: ImageEntity
  ): Promise<ImageResponse> {
    return this.imageService.getImage(image)
  }
}
