'use client'

import { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onCropComplete: (croppedImageBlob: Blob) => void
  aspectRatio?: number
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imgRef = useRef<HTMLImageElement>(null)
  
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspectRatio))
  }, [aspectRatio])
  
  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('No 2d context')
      }
      
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      
      canvas.width = crop.width
      canvas.height = crop.height
      
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height,
      )
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          }
        }, 'image/jpeg', 0.9)
      })
    },
    []
  )
  
  const handleCropComplete = useCallback(async () => {
    if (completedCrop && imgRef.current) {
      try {
        const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop)
        onCropComplete(croppedImageBlob)
        onOpenChange(false)
      } catch (error) {
        console.error('Error cropping image:', error)
      }
    }
  }, [completedCrop, getCroppedImg, onCropComplete, onOpenChange])
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            minWidth={100}
            minHeight={100}
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageSrc}
              onLoad={onImageLoad}
              className="max-h-96 max-w-full"
            />
          </ReactCrop>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCropComplete} disabled={!completedCrop}>
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}