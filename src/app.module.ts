import { Module } from '@nestjs/common'
import { ImagesModule } from './images/images.module'
import { AuthModule } from './auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import Joi from 'joi'

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        ARGON_SECRET: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        CLOUDFLARE_BUCKET: Joi.string().required(),
        CLOUDFLARE_TOKEN: Joi.string().required(),
        CLOUDFLARE_KEY_ID: Joi.string().required(),
        CLOUDFLARE_ACCESS_KEY: Joi.string().required(),
        CLOUDFLARE_URL: Joi.string().required(),
        CLOUDFLARE_ACCOUNT_ID: Joi.string().required(),
      }),
    }),
    ImagesModule,
    AuthModule,
  ],
})
export class AppModule {}
