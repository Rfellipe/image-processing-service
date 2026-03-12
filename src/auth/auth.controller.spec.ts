import { Test } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { LoginSchema } from './dtos/login.dto'
import { RegisterSchema } from './dtos/register.dto'
import { PrismaService } from 'src/general/prisma.service'
import { PrismaClient } from 'src/generated/prisma/client'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import * as argon2 from 'argon2'

jest.mock('argon2')

describe('Test AuthController', () => {
  let authController: AuthController
  let authService: AuthService
  let prismaMock: DeepMockProxy<PrismaClient>

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaClient>()

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile()

    authService = moduleRef.get(AuthService)
    authController = moduleRef.get(AuthController)
  })

  describe('Auth DTO validation', () => {
    it('accepts valid registration payload', () => {
      const parsed = RegisterSchema.parse({
        email: 'test@example.com',
        password: 'P@ssw0rd!',
        confirmPassword: 'P@ssw0rd!',
      })

      expect(parsed.email).toBe('test@example.com')
    })

    it('rejects registration payload when passwords dont match', () => {
      expect(() =>
        RegisterSchema.parse({
          email: 'test@example.com',
          password: 'P@ssw0rd!',
          confirmPassword: 'P@ssw0rd',
        })
      ).toThrow('Passwords do not match')
    })

    it('accepts valid login payload', () => {
      const parsed = LoginSchema.parse({
        email: 'test@example.com',
        password: 'P@ssw0rd!',
      })

      expect(parsed.email).toBe('test@example.com')
    })
  })

  describe('User registration', () => {
    it('register hashes passwords and stores user', async () => {
      ;(argon2.hash as jest.Mock).mockResolvedValue('hashed-password')

      const result = await authService.register({
        email: 'test@example.com',
        password: 'P@ssw0rd!',
        confirmPassword: 'P@ssw0rd!',
      })

      expect(argon2.hash).toHaveBeenCalledWith(
        'P@ssw0rd!',
        expect.objectContaining({
          type: argon2.argon2id,
          secret: expect.any(Buffer),
        })
      )
      expect(prismaMock.users.create).toHaveBeenCalledWith({
        data: { email: 'test@example.com', password: 'hashed-password' },
      })
      expect(result).toBe('User created successfully')
    })
  })
})
