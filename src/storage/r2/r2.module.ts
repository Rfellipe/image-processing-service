import { Module } from '@nestjs/common'
import { R2Service } from './r2.service'
import { PrismaService } from 'src/prisma.service'

@Module({
  providers: [PrismaService, R2Service],
  exports: [R2Service],
})
export class R2Module {}
