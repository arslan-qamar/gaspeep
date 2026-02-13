import React, { useState, useEffect } from 'react'
import { Mic, Square, ChevronLeft } from 'lucide-react'

type Parsed = { station: { id: string; name: string }; fuelType: string; price: number }

interface VoiceInputScreenProps {
  onParsed: (p: Parsed) => void
  onCancel: () => void
}

export const VoiceInputScreen: React.FC<VoiceInputScreenProps> = ({ onParsed, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    // Check for Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-AU'

      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          }
        }
        if (finalTranscript) {
          setTranscription((prev) => prev + finalTranscript)
        }
      }

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setError('Could not understand. Please try again.')
        setIsRecording(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [])

  useEffect(() => {
    let timer: number | undefined
    if (isRecording) {
      timer = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (timer) window.clearInterval(timer)
    }
  }, [isRecording])

  const startRecording = async () => {
    setError(null)
    setTranscription('')
    setRecordingTime(0)

    if (recognition) {
      try {
        recognition.start()
        setIsRecording(true)
      } catch (err) {
        setError('Microphone access denied. Please allow microphone access.')
      }
    } else {
      setError('Voice recognition not supported in this browser.')
    }
  }

  const stopRecording = () => {
    if (recognition) {
      recognition.stop()
    }
    setIsRecording(false)

    // Parse the transcription (simple demo parsing)
    if (transcription) {
      // Demo: just simulate parsing
      onParsed({
        station: { id: 'demo', name: 'Demo Station' },
        fuelType: 'E10',
        price: 3.79,
      })
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center gap-2">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Voice Submission</h1>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-8">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Voice Price Entry</h3>
            <p className="text-slate-600 dark:text-slate-400">Say the fuel type and price</p>
          </div>

          {/* Recording Display */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center font-bold text-3xl transition-all ${
                isRecording
                  ? 'bg-red-500 animate-pulse text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {formatTime(recordingTime)}
            </div>

            {isRecording && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 animate-pulse">
                Listening...
              </p>
            )}
          </div>

          {/* Transcription */}
          {transcription && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Heard:</p>
              <p className="text-slate-700 dark:text-slate-300">{transcription}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-colors text-white w-full ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRecording ? (
              <>
                <Square size={20} fill="currentColor" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic size={20} />
                Start Recording
              </>
            )}
          </button>

          {/* Info */}
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
            Example: "Shell Market Street, Diesel, three dollars seventy-nine"
          </p>
        </div>
      </div>
    </div>
  )
}

export default VoiceInputScreen
