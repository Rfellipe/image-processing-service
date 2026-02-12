import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { CatchAllFilter } from './exception.filter'
import { ResponseInterceptor } from './response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const httpAdapterHost = app.get(HttpAdapterHost)
  app.useGlobalFilters(new CatchAllFilter(httpAdapterHost))
  app.useGlobalInterceptors(new ResponseInterceptor())

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
