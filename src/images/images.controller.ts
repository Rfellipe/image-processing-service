import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ImagesService } from './images.service'
import { AuthGuard } from 'src/auth/auth.guard'
import { FileInterceptor } from '@nestjs/platform-express'
import { ZodValidationPipe } from 'src/zod.pipe'
import { type ImageEntity, ImageSchema } from './images.dtos'
import { ImageResponse } from 'src/storage/r2/r2.dtos'
import { User } from 'src/auth/auth.decorator'
import { type UserEntity } from 'src/auth/dtos/user.dto'
import { ImageGuard } from './images.guard'
import { Image } from './image.decorator'

@Controller('images')
@UseGuards(AuthGuard)
export class ImagesController {
  constructor(private readonly imageService: ImagesService) {}

  @Get()
  getImages(
    @User() user: UserEntity,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number
  ): string {
    return this.imageService.getImages(page, limit)
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
  async updateImage(
    @Param('id', ParseIntPipe) _: number,
    @Image() image: ImageEntity
  ): Promise<string> {
    return await this.imageService.updateImage(image)
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
