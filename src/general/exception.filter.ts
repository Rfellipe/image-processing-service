import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { HttpArgumentsHost } from '@nestjs/common/interfaces'
import { HttpAdapterHost } from '@nestjs/core'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'
import { Request, Response } from 'express'
import { ZodError, z } from 'zod'

type ExceptionResponseBody = {
  ok: boolean
  message: string
  cause: string | object | unknown
  statusCode: number
  timestamp: string
  path: string
}

@Catch()
export class CatchAllFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost

    const ctx = host.switchToHttp()
    const responseBody: ExceptionResponseBody = this.initResponseBody(ctx)

    if (exception instanceof HttpException) {
      responseBody.message = exception.message
      responseBody.cause = responseBody.cause
      responseBody.statusCode = exception.getStatus()
    } else if (exception instanceof ZodError) {
      responseBody.message = 'Error validating fields'
      responseBody.cause = z.treeifyError(exception)
      responseBody.statusCode = HttpStatus.BAD_REQUEST
    } else if (exception instanceof PrismaClientKnownRequestError) {
      const message = this.handlePrismaErrorCode(exception.code)
      if (!message) {
        console.error(exception.code)
      } else {
        responseBody.message = message
      }

      responseBody.cause = exception.cause
      responseBody.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    } else {
      console.log(exception)
      responseBody.message = 'Server error'
      responseBody.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    }

    httpAdapter.reply(
      ctx.getResponse<Response>(),
      responseBody,
      responseBody.statusCode
    )
  }

  private initResponseBody(ctx: HttpArgumentsHost): ExceptionResponseBody {
    const { httpAdapter } = this.httpAdapterHost

    return {
      ok: false,
      message: '',
      cause: {},
      statusCode: 0,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest<Request>()),
    }
  }

  private handlePrismaErrorCode(code: string): string | null {
    switch (code) {
      case 'P2002':
        return 'Account alredy registred with this email'
      default:
        return null
    }
  }
}
