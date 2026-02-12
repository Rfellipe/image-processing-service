import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { type RegisterData } from './dtos/register.dto'
import * as argon2 from 'argon2'
import { type LoginData } from './dtos/login.dto'

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(userData: RegisterData): Promise<string> {
    const { email, password } = userData

    const hash = await argon2.hash(password, { type: argon2.argon2id })

    try {
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

  async login(userData: LoginData): Promise<string> {
    return 'Login path working'
  }
}
