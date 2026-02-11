import { Controller, Get, Post, Put, Query } from '@nestjs/common';
import { ImagesService } from './images.service';

@Controller('images')
export class ImagesController {
  constructor(private readonly imageService: ImagesService) {}

  @Get()
  getImages(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): string {
    return this.imageService.getImages(page, limit);
  }

  @Post()
  uploadImages(): string {
    return this.imageService.uploadImages();
  }

  @Put(':id')
  updateImage(): string {
    return this.imageService.updateImage();
  }

  @Get(':id')
  getImage(): string {
    return this.imageService.getImage();
  }
}
