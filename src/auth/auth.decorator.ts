import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { UserEntity } from './dtos/user.dto'

export const User = createParamDecorator(
  (_data: unknown, req: ExecutionContext) => {
    return req.switchToHttp().getRequest().user as UserEntity
  }
)
