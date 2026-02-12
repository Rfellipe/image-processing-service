import { Injectable } from '@nestjs/common'

@Injectable()
export class ImagesService {
  /// TODO: Accept optional queries, (page?: int, limit?: int)
  getImages(page?: number, limit?: number): string {
    return 'Hello from images route'
  }

  uploadImages(): string {
    return 'Hello from POST images route'
  }

  updateImage(): string {
    return 'Hello from PUT image/:id route'
  }

  getImage(): string {
    return 'Hello from GET image/:id route'
  }
}
