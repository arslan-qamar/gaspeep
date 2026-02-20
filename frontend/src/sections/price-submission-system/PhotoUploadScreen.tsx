import React, { useEffect, useRef, useState } from 'react'
import { Camera, Upload, X, ChevronLeft } from 'lucide-react'
import { apiClient } from '../../lib/api'

export type PhotoAnalysisEntry = {
  fuelType: string
  price: number
}

export type PhotoAnalysisResult = {
  entries: PhotoAnalysisEntry[]
  fuelType: string
  price: number
  photoUrl?: string
  ocrData?: string
}

interface PhotoUploadScreenProps {
  onParsed: (p: PhotoAnalysisResult) => void
  onCancel: () => void
  isModal?: boolean
}

export const PhotoUploadScreen: React.FC<PhotoUploadScreenProps> = ({ onParsed, onCancel, isModal = false }) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUsingCamera, setIsUsingCamera] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  const clearObjectUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }

  const setPreviewFromFile = (file: File) => {
    clearObjectUrl()
    const nextPreview = URL.createObjectURL(file)
    previewUrlRef.current = nextPreview
    setSelectedFile(file)
    setPreview(nextPreview)
  }

  const normalizeAnalysisResponse = (raw: any): PhotoAnalysisResult => {
    const listCandidate =
      (Array.isArray(raw?.entries) && raw.entries) ||
      (Array.isArray(raw?.prices) && raw.prices) ||
      (Array.isArray(raw?.detections) && raw.detections) ||
      (Array.isArray(raw?.candidates) && raw.candidates) ||
      []

    const parsedEntries = (listCandidate as any[])
      .map((entry) => {
        const fuelType =
          entry?.fuelType ||
          entry?.fuel_type ||
          entry?.fuel ||
          entry?.type ||
          entry?.name ||
          ''
        const numericPrice = Number(entry?.price ?? entry?.value ?? entry?.amount)

        if (!fuelType || !Number.isFinite(numericPrice) || numericPrice <= 0) return null
        return {
          fuelType: String(fuelType),
          price: Number(numericPrice.toFixed(3)),
        }
      })
      .filter((entry): entry is PhotoAnalysisEntry => Boolean(entry))

    if (parsedEntries.length === 0) {
      const topFuelType = raw?.fuelType || raw?.fuel_type || raw?.fuel || ''
      const topPrice = Number(raw?.price ?? raw?.value ?? raw?.amount)
      if (!topFuelType || !Number.isFinite(topPrice) || topPrice <= 0) {
        throw new Error('No valid price was detected in this image.')
      }
      parsedEntries.push({
        fuelType: String(topFuelType),
        price: Number(topPrice.toFixed(3)),
      })
    }

    return {
      entries: parsedEntries,
      fuelType: parsedEntries[0].fuelType,
      price: parsedEntries[0].price,
      photoUrl: typeof raw?.photoUrl === 'string' ? raw.photoUrl : undefined,
      ocrData: typeof raw?.ocrData === 'string' ? raw.ocrData : JSON.stringify(raw),
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setError(null)
      setPreviewFromFile(file)
    }
  }

  const startCamera = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream
        setIsUsingCamera(true)
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access.')
      console.error('Failed to access camera:', err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsUsingCamera(false)
  }

  const takePhoto = () => {
    if (canvasRef.current && cameraRef.current) {
      const video = cameraRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setError('Unable to capture photo. Please try again.')
              return
            }
            const capturedFile = new File([blob], `price-board-${Date.now()}.jpg`, {
              type: 'image/jpeg',
            })
            setPreviewFromFile(capturedFile)
            stopCamera()
          },
          'image/jpeg',
          0.9
        )
      }
    }
  }

  const analyzePhoto = async () => {
    if (!selectedFile) {
      setError('Select or capture a photo before analysis.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('photo', selectedFile)
      formData.append('image', selectedFile)

      const response = await apiClient.post('/price-submissions/analyze-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      onParsed(normalizeAnalysisResponse(response.data))
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Photo analysis failed. Try another photo or enter price manually.'
      setError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const clearPreview = () => {
    clearObjectUrl()
    setPreview(null)
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
      clearObjectUrl()
    }
  }, [])

  return (
    <div className={isModal ? '' : 'min-h-screen bg-slate-50 dark:bg-slate-950'}>
      {/* Header - only show if not in modal */}
      {!isModal && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center gap-2">
          <button
            onClick={() => {
              stopCamera()
              onCancel()
            }}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Photo Submission</h1>
        </div>
      )}

      {/* Content */}
      <div className={isModal ? '' : 'max-w-md mx-auto p-6'}>
        <div className={isModal ? 'p-0' : 'bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6'}>
          {preview ? (
            // Photo preview with analysis
            <div className="space-y-4">
              <div className="relative">
                <img src={preview} alt="Price board" className="w-full rounded-lg" />
                <button
                  onClick={clearPreview}
                  className="absolute top-2 right-2 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X size={20} className="text-slate-900 dark:text-white" />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={clearPreview}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-slate-900 dark:text-white"
                >
                  Retake
                </button>
                <button
                  onClick={analyzePhoto}
                  disabled={isProcessing || !selectedFile}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isProcessing || !selectedFile
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isProcessing ? 'Analyzing...' : 'Analyze Photo'}
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Photo will be analyzed with OCR to extract the price
              </p>
            </div>
          ) : isUsingCamera ? (
            // Camera viewfinder
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={cameraRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                  style={{ minHeight: '300px' }}
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white border-dashed w-48 h-32 rounded-lg" />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={stopCamera}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-slate-900 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={takePhoto}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Camera size={20} />
                  Capture
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Center the price in the frame and tap Capture
              </p>
            </div>
          ) : (
            // Method selection
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Take or Upload Photo
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Get a clear photo of the price board
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={startCamera}
                className="w-full p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col items-center gap-3"
              >
                <Camera size={40} className="text-slate-400 dark:text-slate-500" />
                <span className="font-medium text-slate-900 dark:text-white">Take Photo</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">Use your camera</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors flex flex-col items-center gap-3"
              >
                <Upload size={40} className="text-blue-500 dark:text-blue-400" />
                <span className="font-medium text-slate-900 dark:text-white">Upload Photo</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">From your gallery</span>
              </button>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
                Take a clear photo of the gas pump price display or receipt
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PhotoUploadScreen
