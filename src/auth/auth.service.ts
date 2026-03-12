import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/general/prisma.service'
import { type RegisterData } from './dtos/register.dto'
import * as argon2 from 'argon2'
import { LoginResponse, type LoginData } from './dtos/login.dto'
import { JwtService } from '@nestjs/jwt'
import { UserEntity } from './dtos/user.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(userData: RegisterData): Promise<string> {
    const { email, password } = userData

    try {
      const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        secret: this.argon2Secret(),
      })

      await this.prisma.users.create({
        data: {
          email,
          password: hash,
        },
      })
    } catch (error) {
      throw error
    }

    return 'User created successfully'
  }

  async login(userData: LoginData): Promise<LoginResponse> {
    const { email, password } = userData

    try {
      const user = await this.prisma.users.findUnique({
        where: { email },
      })

      if (!user) throw this.returnBadReq()

      const isPasswordCorrect = await argon2.verify(user.password, password, {
        secret: this.argon2Secret(),
      })

      if (!isPasswordCorrect) throw this.returnBadReq()

      const payload: UserEntity = {
        sub: user.id,
        email: user.email,
        createdAt: user.createdAt,
      }

      return {
        access_token: await this.jwtService.signAsync(payload),
      }
    } catch (error) {
      throw error
    }
  }

  private returnBadReq(): HttpException {
    return new HttpException('Email or password wrong', HttpStatus.UNAUTHORIZED)
  }

  private argon2Secret(): Buffer<ArrayBuffer> {
    const secret = process.env.ARGON_SECRET
    const encoder = new TextEncoder()
    const arrBuff = encoder.encode(secret)

    return Buffer.from(arrBuff)
  }
}
