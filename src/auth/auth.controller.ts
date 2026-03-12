import { Body, Controller, Post, UsePipes } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterSchema, type RegisterData } from './dtos/register.dto'
import { ZodValidationPipe } from 'src/general/zod.pipe'
import { type LoginData, LoginSchema, LoginResponse } from './dtos/login.dto'

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(
    @Body()
    userData: RegisterData
  ): Promise<string> {
    return await this.authService.register(userData)
  }

  @Post('/login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(
    @Body()
    userData: LoginData
  ): Promise<LoginResponse> {
    return await this.authService.login(userData)
  }
}
