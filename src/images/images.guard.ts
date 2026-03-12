import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from 'src/general/prisma.service'

@Injectable()
export class ImageGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest()
    const params = req.params
    const user = req.user

    const imageId = parseInt(params.id)
    if (isNaN(imageId))
      throw new BadRequestException('Image ID must be a number')

    const image = await this.prisma.images.findUnique({
      where: { id: Number(params.id), userId: user.sub },
      select: {
        id: true,
        url: true,
        urlExpirationDate: true,
        metadata: true,
      },
    })

    if (!image) throw new ForbiddenException('Image not found')

    req['image'] = image

    return true
  }
}
