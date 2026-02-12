import z from 'zod'

export const LoginSchema = z.object({
  email: z.email({ error: 'Please enter a valid email.' }).trim(),
  password: z.string().trim(),
})

export type LoginData = z.infer<typeof LoginSchema>

export type LoginResponse = {
  access_token: string
}
