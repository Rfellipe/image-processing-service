import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(req)
    if (!token)
      throw new HttpException('Not logged in', HttpStatus.UNAUTHORIZED)

    try {
      const payload = await this.jwtService.verifyAsync(token)

      req['user'] = payload
    } catch (error) {
      throw new HttpException('Not logged in', HttpStatus.UNAUTHORIZED)
    }

    return true
  }

  private extractTokenFromHeader(req: Request): string | undefined {
    const [type, token] = req.headers?.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
