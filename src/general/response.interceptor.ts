import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface SuccessResponseBody<T> {
  ok: boolean
  statusCode: number
  timestamp: string
  path: string
  data: T
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponseBody<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<SuccessResponseBody<T>> {
    const ctx = context.switchToHttp()
    const req = ctx.getRequest<Request>()
    const res = ctx.getResponse<any>()

    return next.handle().pipe(
      map(data => ({
        ok: true,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString(),
        path: (req as any).url,
        data,
      }))
    )
  }
}
