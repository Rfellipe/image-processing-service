import { ImageSchema } from './images.dtos'

describe('Image DTO validation', () => {
  it('accepts png file upload', () => {
    const parsed = ImageSchema.parse({
      mimetype: 'image/png',
      originalName: 'image.png',
    })

    expect(parsed.mimetype).toBe('image/png')
  })

  it('rejects unsupported file mimetype', () => {
    expect(() =>
      ImageSchema.parse({
        mimetype: 'image/gif',
        originalname: 'animated.gif',
      })
    ).toThrow('Only PNG or JPEG allowed')
  })
})
