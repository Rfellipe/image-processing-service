import { Module } from '@nestjs/common'
import { ImagesController } from './images.controller'
import { ImagesService } from './images.service'
import { R2Module } from 'src/storage/r2/r2.module'
import { PrismaService } from 'src/prisma.service'
import { ImageProcessingService } from 'src/image-processing/image-processing.service'
import { ImageGuard } from './images.guard'

@Module({
  imports: [R2Module],
  controllers: [ImagesController],
  providers: [PrismaService, ImagesService, ImageProcessingService, ImageGuard],
})
export class ImagesModule {}
