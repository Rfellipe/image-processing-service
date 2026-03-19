import { Body, Controller, Post, UsePipes } from '@nestjs/common'
import { ApiBody } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { RegisterSchema, type RegisterData } from './dtos/register.dto'
import { ZodValidationPipe } from 'src/general/zod.pipe'
import { type LoginData, LoginSchema, LoginResponse } from './dtos/login.dto'

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'confirmPassword'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        confirmPassword: { type: 'string', minLength: 8 },
      },
    },
  })
  async register(
    @Body()
    userData: RegisterData
  ): Promise<string> {
    return await this.authService.register(userData)
  }

  @Post('/login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
      },
    },
  })
  async login(
    @Body()
    userData: LoginData
  ): Promise<LoginResponse> {
    return await this.authService.login(userData)
  }
}
