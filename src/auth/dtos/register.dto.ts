import z from 'zod'

export const RegisterSchema = z
  .object({
    email: z.email({ error: 'Please enter a valid email.' }).trim(),
    password: z
      .string()
      .min(8, { error: 'Be at least 8 characters long' })
      .regex(/[a-zA-Z]/, { error: 'Contain at least one letter.' })
      .regex(/[0-9]/, { error: 'Contain at least one number.' })
      .regex(/[^a-zA-Z0-9]/, {
        error: 'Contain at least one special character.',
      })
      .trim(),
    confirmPassword: z
      .string()
      .min(8, { error: 'Be at least 8 characters long' })
      .regex(/[a-zA-Z]/, { error: 'Contain at least one letter.' })
      .regex(/[0-9]/, { error: 'Contain at least one number.' })
      .regex(/[^a-zA-Z0-9]/, {
        error: 'Contain at least one special character.',
      })
      .trim(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type RegisterData = z.infer<typeof RegisterSchema>
