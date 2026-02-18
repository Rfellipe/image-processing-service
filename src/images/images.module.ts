import { Module } from '@nestjs/common'
import { ImagesController } from './images.controller'
import { ImagesService } from './images.service'
import { R2Module } from 'src/storage/r2/r2.module'
import { PrismaService } from 'src/prisma.service'

@Module({
  imports: [R2Module],
  controllers: [ImagesController],
  providers: [PrismaService, ImagesService],
})
export class ImagesModule {}
