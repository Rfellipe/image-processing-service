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
import { ImageSchema } from './images.dtos'
import { User } from 'src/auth/auth.decorator'
import { type UserEntity } from 'src/auth/dtos/user.dto'
import { ImageResponse } from 'src/storage/r2/r2.dtos'

@Controller('images')
@UseGuards(AuthGuard)
export class ImagesController {
  constructor(private readonly imageService: ImagesService) {}

  @Get()
  getImages(
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

  @Put(':id')
  updateImage(@Param('id', ParseIntPipe) id: number): string {
    return this.imageService.updateImage()
  }

  @Get(':id')
  async getImage(
    @Param('id', ParseIntPipe) imageId: number,
    @User() user: UserEntity
  ): Promise<ImageResponse> {
    return this.imageService.getImage(imageId, user)
  }
}
