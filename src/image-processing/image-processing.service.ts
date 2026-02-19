import { BadRequestException, Injectable } from '@nestjs/common'
import sharp, { Sharp } from 'sharp'
import type { ImageProcessingQuery } from './image-processing.dtos'

@Injectable()
export class ImageProcessingService {
  private readonly MAX_INPUT_PIXELS = 40_000_000
  private readonly DEFAULT_QUALITY = 80

  async transformImage(
    image: Buffer,
    query: ImageProcessingQuery
  ): Promise<Buffer> {
    if (!image?.length) throw new BadRequestException('Empty image buffer')

    const t = query.transformations
    if (!t || Object.keys(t).length === 0) {
      throw new BadRequestException(
        'At least one transformation must be provided'
      )
    }

    try {
      // Base pipeline
      let pipeline = sharp(image, {
        limitInputPixels: this.MAX_INPUT_PIXELS,
      }).withMetadata()

      // Some transforms depend on dimensions (crop bounds)
      const meta = await pipeline.metadata()

      // 1) geometry transforms
      pipeline = this.applyRotate(pipeline, t)
      pipeline = this.applyFlipMirror(pipeline, t)

      // 2) crop (needs bounds)
      pipeline = await this.applyCrop(pipeline, t, meta)

      // 3) resize
      pipeline = this.applyResize(pipeline, t)

      // 4) filters
      pipeline = this.applyFilters(pipeline, t)

      // 5) watermark
      pipeline = this.applyWatermark(pipeline, t)

      // 6) output (format/compress)
      pipeline = this.applyOutput(pipeline, t)

      return await pipeline.toBuffer()
    } catch (err) {
      const msg =
        typeof err?.message === 'string'
          ? err.message
          : 'Image transform failed'

      if (
        msg.toLowerCase().includes('extract') ||
        msg.toLowerCase().includes('crop') ||
        msg.toLowerCase().includes('width') ||
        msg.toLowerCase().includes('height')
      ) {
        throw new BadRequestException(msg)
      }

      throw err
    }
  }

  private applyRotate(
    p: Sharp,
    t: ImageProcessingQuery['transformations']
  ): Sharp {
    if (typeof t.rotate === 'number' && t.rotate !== 0) {
      return p.rotate(t.rotate)
    }
    return p
  }

  private applyFlipMirror(
    p: Sharp,
    t: ImageProcessingQuery['transformations']
  ): Sharp {
    if (t.flip) p = p.flip()
    if (t.mirror) p = p.flop()
    return p
  }

  /**
   * Crop using extract, but clamp inside image bounds to avoid runtime errors.
   * If the crop becomes invalid after clamping, throw a 400.
   */
  private async applyCrop(
    p: Sharp,
    t: ImageProcessingQuery['transformations'],
    meta: sharp.Metadata
  ): Promise<Sharp> {
    if (!t.crop) return p

    const imgW = meta.width ?? 0
    const imgH = meta.height ?? 0
    if (!imgW || !imgH)
      throw new BadRequestException('Could not read image dimensions')

    const left = clampInt(t.crop.x, 0, imgW - 1)
    const top = clampInt(t.crop.y, 0, imgH - 1)

    const maxW = imgW - left
    const maxH = imgH - top
    const width = clampInt(t.crop.width, 1, maxW)
    const height = clampInt(t.crop.height, 1, maxH)

    if (width <= 0 || height <= 0) {
      throw new BadRequestException('Invalid crop area')
    }

    return p.extract({ left, top, width, height })
  }

  private applyResize(
    p: Sharp,
    t: ImageProcessingQuery['transformations']
  ): Sharp {
    if (!t.resize) return p

    const { width, height, fit } = t.resize

    return p.resize(width, height, {
      fit: fit ?? 'cover',
      withoutEnlargement: true,
    })
  }

  private applyFilters(
    p: Sharp,
    t: ImageProcessingQuery['transformations']
  ): Sharp {
    const f = t.filters
    if (!f) return p

    if (f.grayscale) p = p.grayscale()

    if (f.sepia) {
      p = p.modulate({ saturation: 0.55 }).tint({ r: 112, g: 66, b: 20 })
    }

    return p
  }

  private applyWatermark(
    p: Sharp,
    t: ImageProcessingQuery['transformations']
  ): Sharp {
    if (!t.watermark) return p

    const fontSize = t.watermark.fontSize ?? 32
    const opacity = clampFloat((t.watermark.opacity ?? 40) / 100, 0, 1)
    const text = escapeXml(t.watermark.text)

    const svg = Buffer.from(`
      <svg width="1024" height="256" xmlns="http://www.w3.org/2000/svg">
        <style>
          .t { fill: rgba(255,255,255,${opacity}); font-size: ${fontSize}px; font-family: Arial, sans-serif; }
        </style>
        <text x="24" y="96" class="t">${text}</text>
      </svg>
    `)

    return p.composite([{ input: svg, gravity: 'southwest' }])
  }

  private applyOutput(
    p: Sharp,
    t: ImageProcessingQuery['transformations']
  ): Sharp {
    const format = t.format
    const quality = clampInt(
      t.compress?.quality ?? this.DEFAULT_QUALITY,
      1,
      100
    )

    if (!format) return p

    switch (format) {
      case 'jpeg':
        return p.jpeg({ quality })
      case 'png':
        return p.png({ compressionLevel: 9, adaptiveFiltering: true })
      case 'webp':
        return p.webp({ quality })
      case 'avif':
        return p.avif({ quality })
      default:
        throw new BadRequestException('Unsupported output format')
    }
  }
}

function clampInt(n: number, min: number, max: number) {
  const v = Math.trunc(n)
  return Math.min(Math.max(v, min), max)
}

function clampFloat(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

function escapeXml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
