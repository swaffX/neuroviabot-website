import Image, { ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  fallbackSrc?: string
  aspectRatio?: '1:1' | '16:9' | '4:3' | '21:9' | '3:2'
  containerClassName?: string
  onLoadingComplete?: () => void
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder.png',
  aspectRatio,
  containerClassName,
  className,
  onLoadingComplete,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const aspectRatioClasses = {
    '1:1': 'aspect-square',
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '21:9': 'aspect-[21/9]',
    '3:2': 'aspect-[3/2]',
  }

  const handleLoad = () => {
    setIsLoading(false)
    onLoadingComplete?.()
  }

  const handleError = () => {
    setHasError(true)
    setImgSrc(fallbackSrc)
    setIsLoading(false)
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        aspectRatio && aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      <Image
        src={imgSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          hasError && 'blur-sm',
          className
        )}
        {...props}
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 via-slate-700/50 to-slate-800/50 bg-[length:200%_100%] animate-shimmer" />
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <svg
            className="w-12 h-12 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  )
}

// Preset image components for common use cases
export function HeroImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      priority
      quality={90}
      sizes="100vw"
      className={cn('object-cover', props.className)}
    />
  )
}

export function CardImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      quality={85}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className={cn('object-cover', props.className)}
    />
  )
}

export function ThumbnailImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      quality={75}
      sizes="(max-width: 768px) 50vw, 25vw"
      className={cn('object-cover', props.className)}
    />
  )
}

export function AvatarImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      quality={80}
      aspectRatio="1:1"
      className={cn('object-cover rounded-full', props.className)}
    />
  )
}

export function BackgroundImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      fill
      priority
      quality={75}
      sizes="100vw"
      className={cn('object-cover', props.className)}
    />
  )
}
