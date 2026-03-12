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
  async uploadImages(
    @UploadedFile(new ZodValidationPipe(ImageSchema)) file: Express.Multer.File,
    @User() user: UserEntity
  ): Promise<ImageResponse> {
    return await this.imageService.uploadImages(file, user)
  }

  @Put(':id/transform')
  @UseGuards(ImageGuard)
  @UsePipes(new ZodValidationPipe(ImageProcessingQuerySchema))
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
