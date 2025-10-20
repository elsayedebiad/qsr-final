import sharp from 'sharp'
import { CacheManager } from './redis'
import { JobQueue, JobType, JobPriority } from './job-queue'

// Image optimization configuration
const IMAGE_CONFIG = {
  // Maximum dimensions
  maxWidth: 1920,
  maxHeight: 1080,
  thumbnailWidth: 300,
  thumbnailHeight: 300,
  
  // Quality settings
  jpegQuality: 85,
  webpQuality: 80,
  pngCompressionLevel: 9,
  
  // File size limits (in bytes)
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxThumbnailSize: 100 * 1024, // 100KB
  
  // Cache settings
  cacheDuration: 86400, // 24 hours
  
  // Supported formats
  supportedFormats: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'svg'],
}

export class ImageOptimizer {
  // Optimize image for web display
  static async optimizeImage(
    input: Buffer | string,
    options: {
      width?: number
      height?: number
      quality?: number
      format?: 'jpeg' | 'png' | 'webp'
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
    } = {}
  ): Promise<Buffer> {
    const {
      width = IMAGE_CONFIG.maxWidth,
      height = IMAGE_CONFIG.maxHeight,
      quality = IMAGE_CONFIG.jpegQuality,
      format = 'jpeg',
      fit = 'inside',
    } = options
    
    try {
      let pipeline = sharp(input)
        .resize(width, height, { fit, withoutEnlargement: true })
      
      // Apply format-specific optimizations
      switch (format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({
            quality,
            progressive: true,
            mozjpeg: true,
          })
          break
        case 'png':
          pipeline = pipeline.png({
            compressionLevel: IMAGE_CONFIG.pngCompressionLevel,
            progressive: true,
            palette: true,
          })
          break
        case 'webp':
          pipeline = pipeline.webp({
            quality: IMAGE_CONFIG.webpQuality,
            alphaQuality: 100,
            lossless: false,
            smartSubsample: true,
            effort: 6,
          })
          break
      }
      
      return await pipeline.toBuffer()
    } catch (error) {
      console.error('Image optimization error:', error)
      throw error
    }
  }
  
  // Generate multiple sizes for responsive images
  static async generateResponsiveImages(
    input: Buffer | string,
    sizes: { name: string; width: number; height?: number }[] = [
      { name: 'thumbnail', width: 150 },
      { name: 'small', width: 320 },
      { name: 'medium', width: 768 },
      { name: 'large', width: 1024 },
      { name: 'xlarge', width: 1920 },
    ]
  ): Promise<{ [key: string]: Buffer }> {
    const results: { [key: string]: Buffer } = {}
    
    // Process all sizes in parallel
    const promises = sizes.map(async (size) => {
      const optimized = await this.optimizeImage(input, {
        width: size.width,
        height: size.height,
        format: 'webp', // Use WebP for better compression
      })
      results[size.name] = optimized
    })
    
    await Promise.all(promises)
    return results
  }
  
  // Convert image to different formats
  static async convertFormat(
    input: Buffer | string,
    targetFormat: 'jpeg' | 'png' | 'webp'
  ): Promise<Buffer> {
    return await this.optimizeImage(input, { format: targetFormat })
  }
  
  // Generate thumbnail with face detection
  static async generateSmartThumbnail(
    input: Buffer | string,
    width: number = IMAGE_CONFIG.thumbnailWidth,
    height: number = IMAGE_CONFIG.thumbnailHeight
  ): Promise<Buffer> {
    try {
      const image = sharp(input)
      
      // Get image metadata
      const metadata = await image.metadata()
      
      // Smart crop using entropy (focuses on interesting parts)
      return await image
        .resize(width, height, {
          fit: 'cover',
          position: 'entropy', // Or 'attention' for face detection
        })
        .jpeg({ quality: 90, progressive: true })
        .toBuffer()
    } catch (error) {
      console.error('Thumbnail generation error:', error)
      // Fallback to regular resize
      return await this.optimizeImage(input, { width, height, fit: 'cover' })
    }
  }
  
  // Lazy loading placeholder generator
  static async generatePlaceholder(
    input: Buffer | string,
    options: {
      width?: number
      height?: number
      blur?: number
    } = {}
  ): Promise<{ placeholder: string; dominantColor: string }> {
    const { width = 20, height = 20, blur = 10 } = options
    
    try {
      const pipeline = sharp(input)
      
      // Get dominant color
      const { dominant } = await pipeline.stats()
      const dominantColor = `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`
      
      // Generate tiny blurred image
      const placeholderBuffer = await pipeline
        .resize(width, height, { fit: 'fill' })
        .blur(blur)
        .jpeg({ quality: 50 })
        .toBuffer()
      
      // Convert to base64 data URL
      const placeholder = `data:image/jpeg;base64,${placeholderBuffer.toString('base64')}`
      
      return { placeholder, dominantColor }
    } catch (error) {
      console.error('Placeholder generation error:', error)
      return { placeholder: '', dominantColor: '#f0f0f0' }
    }
  }
  
  // Process and cache image
  static async processAndCache(
    imageKey: string,
    input: Buffer | string,
    options: any = {}
  ): Promise<Buffer> {
    // Check cache first
    const cacheKey = `image:${imageKey}:${JSON.stringify(options)}`
    const cached = await CacheManager.get<Buffer>(cacheKey)
    
    if (cached) {
      console.log(`Image cache hit for ${imageKey}`)
      return cached
    }
    
    // Process image
    const processed = await this.optimizeImage(input, options)
    
    // Cache the result
    await CacheManager.set(cacheKey, processed, IMAGE_CONFIG.cacheDuration)
    
    return processed
  }
  
  // Batch image processing
  static async batchProcess(
    images: Array<{ id: string; input: Buffer | string; options?: any }>,
    concurrent: number = 5
  ): Promise<Map<string, Buffer>> {
    const results = new Map<string, Buffer>()
    
    // Process in batches
    for (let i = 0; i < images.length; i += concurrent) {
      const batch = images.slice(i, i + concurrent)
      
      const promises = batch.map(async ({ id, input, options }) => {
        try {
          const processed = await this.optimizeImage(input, options)
          results.set(id, processed)
        } catch (error) {
          console.error(`Failed to process image ${id}:`, error)
        }
      })
      
      await Promise.all(promises)
    }
    
    return results
  }
  
  // Queue image for background processing
  static async queueImageProcessing(
    imageId: string,
    imagePath: string,
    operations: Array<{
      type: 'resize' | 'format' | 'thumbnail'
      options: any
    }>
  ): Promise<string> {
    const jobId = await JobQueue.addJob(
      JobType.IMAGE_OPTIMIZE,
      {
        imageId,
        imagePath,
        operations,
      },
      {
        priority: JobPriority.NORMAL,
      }
    )
    
    return jobId
  }
  
  // Validate image
  static async validateImage(input: Buffer | string): Promise<{
    valid: boolean
    format?: string
    width?: number
    height?: number
    size?: number
    error?: string
  }> {
    try {
      const image = sharp(input)
      const metadata = await image.metadata()
      
      // Check format
      if (!IMAGE_CONFIG.supportedFormats.includes(metadata.format || '')) {
        return {
          valid: false,
          error: `Unsupported format: ${metadata.format}`,
        }
      }
      
      // Check dimensions
      if ((metadata.width || 0) > IMAGE_CONFIG.maxWidth * 2) {
        return {
          valid: false,
          error: `Image width exceeds limit: ${metadata.width}px`,
        }
      }
      
      if ((metadata.height || 0) > IMAGE_CONFIG.maxHeight * 2) {
        return {
          valid: false,
          error: `Image height exceeds limit: ${metadata.height}px`,
        }
      }
      
      // Check file size
      const stats = await image.stats()
      const size = metadata.size || 0
      
      if (size > IMAGE_CONFIG.maxFileSize) {
        return {
          valid: false,
          error: `File size exceeds limit: ${(size / 1024 / 1024).toFixed(2)}MB`,
        }
      }
      
      return {
        valid: true,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size,
      }
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Invalid image',
      }
    }
  }
  
  // Extract metadata
  static async extractMetadata(input: Buffer | string): Promise<{
    format: string
    width: number
    height: number
    channels: number
    hasAlpha: boolean
    orientation?: number
    density?: number
    space?: string
    isProgressive?: boolean
  }> {
    const metadata = await sharp(input).metadata()
    
    return {
      format: metadata.format || 'unknown',
      width: metadata.width || 0,
      height: metadata.height || 0,
      channels: metadata.channels || 0,
      hasAlpha: metadata.hasAlpha || false,
      orientation: metadata.orientation,
      density: metadata.density,
      space: metadata.space,
      isProgressive: metadata.isProgressive,
    }
  }
  
  // Auto-rotate based on EXIF orientation
  static async autoRotate(input: Buffer | string): Promise<Buffer> {
    return await sharp(input)
      .rotate() // Auto-rotate based on EXIF
      .toBuffer()
  }
  
  // Remove metadata for privacy
  static async stripMetadata(input: Buffer | string): Promise<Buffer> {
    return await sharp(input)
      .withMetadata({
        // Keep only essential metadata
        orientation: undefined,
        exif: undefined,
        icc: undefined,
        iptc: undefined,
        xmp: undefined,
      })
      .toBuffer()
  }
  
  // Generate WebP version for modern browsers
  static async generateWebP(
    input: Buffer | string,
    quality: number = IMAGE_CONFIG.webpQuality
  ): Promise<Buffer> {
    return await sharp(input)
      .webp({ quality, effort: 6 })
      .toBuffer()
  }
  
  // Progressive image loading
  static async generateProgressive(input: Buffer | string): Promise<{
    tiny: string // Base64 placeholder
    small: Buffer // Low quality
    medium: Buffer // Medium quality
    full: Buffer // Full quality
  }> {
    const [placeholder, small, medium, full] = await Promise.all([
      this.generatePlaceholder(input),
      this.optimizeImage(input, { width: 400, quality: 60 }),
      this.optimizeImage(input, { width: 800, quality: 75 }),
      this.optimizeImage(input, { quality: 90 }),
    ])
    
    return {
      tiny: placeholder.placeholder,
      small,
      medium,
      full,
    }
  }
  
  // Clean up cached images
  static async cleanupCache(pattern: string = 'image:*'): Promise<void> {
    await CacheManager.clearByPattern(pattern)
    console.log(`Cleared image cache for pattern: ${pattern}`)
  }
}

// CDN URL generator for optimized images
export class ImageCDN {
  private static baseUrl = process.env.CDN_URL || '/api/images'
  
  static getOptimizedUrl(
    imageId: string,
    options: {
      width?: number
      height?: number
      format?: 'jpeg' | 'webp' | 'png'
      quality?: number
    } = {}
  ): string {
    const params = new URLSearchParams()
    
    if (options.width) params.set('w', String(options.width))
    if (options.height) params.set('h', String(options.height))
    if (options.format) params.set('f', options.format)
    if (options.quality) params.set('q', String(options.quality))
    
    return `${this.baseUrl}/${imageId}?${params.toString()}`
  }
  
  static getResponsiveUrls(imageId: string): {
    thumbnail: string
    small: string
    medium: string
    large: string
    original: string
  } {
    return {
      thumbnail: this.getOptimizedUrl(imageId, { width: 150, format: 'webp' }),
      small: this.getOptimizedUrl(imageId, { width: 320, format: 'webp' }),
      medium: this.getOptimizedUrl(imageId, { width: 768, format: 'webp' }),
      large: this.getOptimizedUrl(imageId, { width: 1024, format: 'webp' }),
      original: this.getOptimizedUrl(imageId),
    }
  }
}

export default ImageOptimizer
