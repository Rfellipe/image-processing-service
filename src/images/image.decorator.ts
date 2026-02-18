import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { ImageResponse } from 'src/storage/r2/r2.dtos'

export const Image = createParamDecorator(
  (_data: unknown, req: ExecutionContext) => {
    return req.switchToHttp().getRequest().image as ImageResponse
  }
)
