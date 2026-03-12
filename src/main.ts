import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { CatchAllFilter } from './general/exception.filter'
import { ResponseInterceptor } from './general/response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const httpAdapterHost = app.get(HttpAdapterHost)
  app.useGlobalFilters(new CatchAllFilter(httpAdapterHost))
  app.useGlobalInterceptors(new ResponseInterceptor())

  const config = new DocumentBuilder()
    .setTitle('Image Processing Service')
    .setDescription('Documentation usage for Image Processing Service')
    .setVersion('1.0')
    .addTag('image-processing')
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, documentFactory)

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
