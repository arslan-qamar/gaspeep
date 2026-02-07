# Phase 4: Price Submission System

**Duration:** 2-3 days  
**Goal:** Build the price submission interface with text, voice, and photo options

---

## Overview

Users (both free and premium) can submit fuel prices via:
- **Text**: Manual price entry
- **Voice**: Speech-to-text transcription
- **Photo**: OCR extraction from gas pump photos

Each submission is moderated before updating station prices.

---

## Step 1: Backend - Price Submission API

### 1.1 Price Submission Model

`internal/models/submission.go`:

```go
package models

import "time"

type PriceSubmission struct {
  ID                   string    `json:"id"`
  UserID               string    `json:"userId"`
  StationID            string    `json:"stationId"`
  FuelTypeID           string    `json:"fuelTypeId"`
  Price                float64   `json:"price"`
  SubmissionMethod     string    `json:"submissionMethod"` // text, voice, photo
  SubmittedAt          time.Time `json:"submittedAt"`
  ModerationStatus     string    `json:"moderationStatus"` // pending, approved, rejected
  VerificationConfidence float64  `json:"verificationConfidence"`
  PhotoURL             string    `json:"photoUrl,omitempty"`
  VoiceRecordingURL    string    `json:"voiceRecordingUrl,omitempty"`
  OCRData              string    `json:"ocrData,omitempty"`
  ModeratorNotes       string    `json:"moderatorNotes,omitempty"`
}

type SubmitPriceRequest struct {
  StationID        string  `json:"stationId" binding:"required,uuid"`
  FuelTypeID       string  `json:"fuelTypeId" binding:"required"`
  Price            float64 `json:"price" binding:"required,gt=0"`
  SubmissionMethod string  `json:"submissionMethod" binding:"required,oneof=text voice photo"`
  PhotoURL         string  `json:"photoUrl,omitempty"`
  VoiceRecordingURL string `json:"voiceRecordingUrl,omitempty"`
  OCRData          string  `json:"ocrData,omitempty"`
}
```

### 1.2 Price Submission Repository

`internal/repository/submission_repository.go`:

```go
package repository

import (
  "database/sql"
  "github.com/google/uuid"
  "time"
  "yourmodule/internal/models"
)

type SubmissionRepository struct {
  db *sql.DB
}

func NewSubmissionRepository(db *sql.DB) *SubmissionRepository {
  return &SubmissionRepository{db: db}
}

func (r *SubmissionRepository) CreateSubmission(req *models.SubmitPriceRequest, userID string) (*models.PriceSubmission, error) {
  id := uuid.New().String()

  _, err := r.db.Exec(`
    INSERT INTO price_submissions (
      id, user_id, station_id, fuel_type_id, price,
      submission_method, moderation_status, photo_url, voice_recording_url, ocr_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `,
    id, userID, req.StationID, req.FuelTypeID, req.Price,
    req.SubmissionMethod, "pending", req.PhotoURL, req.VoiceRecordingURL, req.OCRData,
  )

  if err != nil {
    return nil, err
  }

  return &models.PriceSubmission{
    ID:               id,
    UserID:           userID,
    StationID:        req.StationID,
    FuelTypeID:       req.FuelTypeID,
    Price:            req.Price,
    SubmissionMethod: req.SubmissionMethod,
    SubmittedAt:      time.Now(),
    ModerationStatus: "pending",
  }, nil
}

func (r *SubmissionRepository) GetUserSubmissions(userID string, limit int) ([]models.PriceSubmission, error) {
  rows, err := r.db.Query(`
    SELECT id, user_id, station_id, fuel_type_id, price,
           submission_method, submitted_at, moderation_status, verification_confidence
    FROM price_submissions
    WHERE user_id = $1
    ORDER BY submitted_at DESC
    LIMIT $2
  `, userID, limit)

  if err != nil {
    return nil, err
  }
  defer rows.Close()

  var submissions []models.PriceSubmission
  for rows.Next() {
    var s models.PriceSubmission
    err := rows.Scan(
      &s.ID, &s.UserID, &s.StationID, &s.FuelTypeID, &s.Price,
      &s.SubmissionMethod, &s.SubmittedAt, &s.ModerationStatus, &s.VerificationConfidence,
    )
    if err != nil {
      return nil, err
    }
    submissions = append(submissions, s)
  }

  return submissions, nil
}

func (r *SubmissionRepository) ApproveSubmission(submissionID string) error {
  // Get submission and update fuel price
  // Then update submission status to approved
  _, err := r.db.Exec(`
    UPDATE price_submissions
    SET moderation_status = $1
    WHERE id = $2
  `, "approved", submissionID)
  return err
}

func (r *SubmissionRepository) RejectSubmission(submissionID, reason string) error {
  _, err := r.db.Exec(`
    UPDATE price_submissions
    SET moderation_status = $1, moderator_notes = $2
    WHERE id = $3
  `, "rejected", reason, submissionID)
  return err
}
```

### 1.3 File Upload Service (for photos and voice recordings)

For production, use AWS S3, Azure Blob Storage, or similar. For now:

`internal/services/file_service.go`:

```go
package services

import (
  "fmt"
  "io"
  "os"
  "path/filepath"
  "time"
  "github.com/google/uuid"
)

type FileService struct {
  uploadDir string
}

func NewFileService(uploadDir string) *FileService {
  os.MkdirAll(uploadDir, 0755)
  return &FileService{uploadDir: uploadDir}
}

// UploadPhoto saves an uploaded photo and returns the URL
func (s *FileService) UploadPhoto(file io.ReadCloser) (string, error) {
  defer file.Close()

  filename := fmt.Sprintf("photo-%s-%d.jpg", uuid.New().String(), time.Now().Unix())
  filepath := filepath.Join(s.uploadDir, filename)

  f, err := os.Create(filepath)
  if err != nil {
    return "", err
  }
  defer f.Close()

  _, err = io.Copy(f, file)
  if err != nil {
    return "", err
  }

  return "/uploads/" + filename, nil
}

// UploadVoiceRecording saves a voice recording
func (s *FileService) UploadVoiceRecording(file io.ReadCloser) (string, error) {
  defer file.Close()

  filename := fmt.Sprintf("voice-%s-%d.wav", uuid.New().String(), time.Now().Unix())
  filepath := filepath.Join(s.uploadDir, filename)

  f, err := os.Create(filepath)
  if err != nil {
    return "", err
  }
  defer f.Close()

  _, err = io.Copy(f, file)
  return "/uploads/" + filename, err
}
```

### 1.4 Submission Handler

`internal/handlers/submission_handler.go`:

```go
package handlers

import (
  "github.com/gin-gonic/gin"
  "yourmodule/internal/middleware"
  "yourmodule/internal/models"
  "yourmodule/internal/repository"
  "yourmodule/internal/services"
)

type SubmissionHandler struct {
  submissionRepo *repository.SubmissionRepository
  fileService    *services.FileService
}

func NewSubmissionHandler(
  submissionRepo *repository.SubmissionRepository,
  fileService *services.FileService,
) *SubmissionHandler {
  return &SubmissionHandler{
    submissionRepo: submissionRepo,
    fileService:    fileService,
  }
}

// POST /api/submissions
func (h *SubmissionHandler) SubmitPrice(c *gin.Context) {
  userID := c.GetString("user_id")

  var req models.SubmitPriceRequest
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(400, gin.H{"error": "Invalid request"})
    return
  }

  submission, err := h.submissionRepo.CreateSubmission(&req, userID)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to create submission"})
    return
  }

  c.JSON(201, submission)
}

// GET /api/submissions/my-submissions
func (h *SubmissionHandler) GetMySubmissions(c *gin.Context) {
  userID := c.GetString("user_id")

  submissions, err := h.submissionRepo.GetUserSubmissions(userID, 50)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to fetch submissions"})
    return
  }

  c.JSON(200, submissions)
}

// POST /api/submissions/:id/upload-photo
func (h *SubmissionHandler) UploadPhoto(c *gin.Context) {
  file, err := c.FormFile("photo")
  if err != nil {
    c.JSON(400, gin.H{"error": "Photo required"})
    return
  }

  openFile, err := file.Open()
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to read photo"})
    return
  }

  url, err := h.fileService.UploadPhoto(openFile)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to upload photo"})
    return
  }

  c.JSON(200, gin.H{"url": url})
}

// POST /api/submissions/:id/upload-voice
func (h *SubmissionHandler) UploadVoiceRecording(c *gin.Context) {
  file, err := c.FormFile("recording")
  if err != nil {
    c.JSON(400, gin.H{"error": "Recording required"})
    return
  }

  openFile, err := file.Open()
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to read recording"})
    return
  }

  url, err := h.fileService.UploadVoiceRecording(openFile)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to upload recording"})
    return
  }

  c.JSON(200, gin.H{"url": url})
}
```

Register routes in main.go with auth middleware:

```go
submissionHandler := handlers.NewSubmissionHandler(submissionRepo, fileService)

api := router.Group("/api")
api.Use(middleware.AuthRequired())
{
  submissions := api.Group("/submissions")
  {
    submissions.POST("", submissionHandler.SubmitPrice)
    submissions.GET("/my-submissions", submissionHandler.GetMySubmissions)
    submissions.POST("/:id/upload-photo", submissionHandler.UploadPhoto)
    submissions.POST("/:id/upload-voice", submissionHandler.UploadVoiceRecording)
  }
}
```

---

## Step 2: Frontend - Price Submission Components

### 2.1 PriceSubmissionForm (Text Entry)

`src/sections/price-submission-system/components/PriceSubmissionForm.tsx`:

```tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const submissionSchema = z.object({
  stationId: z.string().min(1, 'Station is required'),
  fuelTypeId: z.string().min(1, 'Fuel type is required'),
  price: z.coerce.number().positive('Price must be positive'),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface PriceSubmissionFormProps {
  stationId?: string;
  fuelTypeId?: string;
  onSubmit?: (data: SubmissionFormData) => void;
}

export const PriceSubmissionForm: React.FC<PriceSubmissionFormProps> = ({
  stationId = '',
  fuelTypeId = '',
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { stationId, fuelTypeId },
  });

  return (
    <form onSubmit={handleSubmit((data) => onSubmit?.(data))} className="space-y-4">
      {/* Station Selection */}
      <div>
        <label className="block text-sm font-medium mb-1">Station</label>
        <input
          type="text"
          {...register('stationId')}
          placeholder="Select station"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
        />
        {errors.stationId && (
          <p className="text-sm text-red-600 mt-1">{errors.stationId.message}</p>
        )}
      </div>

      {/* Fuel Type Selection */}
      <div>
        <label className="block text-sm font-medium mb-1">Fuel Type</label>
        <select
          {...register('fuelTypeId')}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
        >
          <option value="">Choose fuel type</option>
          <option value="unleaded-91">Unleaded 91</option>
          <option value="diesel">Diesel</option>
          <option value="u95">U95</option>
          <option value="u98">U98</option>
          <option value="lpg">LPG</option>
        </select>
        {errors.fuelTypeId && (
          <p className="text-sm text-red-600 mt-1">{errors.fuelTypeId.message}</p>
        )}
      </div>

      {/* Price Input */}
      <div>
        <label className="block text-sm font-medium mb-1">Price</label>
        <div className="flex items-center">
          <span className="text-xl font-bold mr-2">$</span>
          <input
            type="number"
            step="0.01"
            {...register('price')}
            placeholder="3.45"
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
          />
          <span className="text-slate-600 dark:text-slate-400 ml-2">/L</span>
        </div>
        {errors.price && (
          <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        Submit Price
      </button>
    </form>
  );
};

export default PriceSubmissionForm;
```

### 2.2 VoiceInputScreen

`src/sections/price-submission-system/components/VoiceInputScreen.tsx`:

```tsx
import React, { useState, useRef } from 'react';
import { Mic, Square } from 'lucide-react';

interface VoiceInputScreenProps {
  onRecordingComplete?: (audioBlob: Blob) => void;
}

export const VoiceInputScreen: React.FC<VoiceInputScreenProps> = ({
  onRecordingComplete,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        onRecordingComplete?.(e.data);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Timer
      const timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Voice Price Entry</h3>
        <p className="text-slate-600 dark:text-slate-400">
          Say the fuel type and price
        </p>
      </div>

      {/* Recording Display */}
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl transition-all ${
          isRecording
            ? 'bg-red-500 animate-pulse'
            : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        {formatTime(recordingTime)}
      </div>

      {/* Recording Time */}
      {isRecording && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Recording in progress...
        </p>
      )}

      {/* Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors text-white w-full ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-lime-500 hover:bg-lime-600'
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
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
        Hold down the button and speak clearly. We'll use AI to extract the price.
      </p>
    </div>
  );
};

export default VoiceInputScreen;
```

### 2.3 PhotoUploadScreen

`src/sections/price-submission-system/components/PhotoUploadScreen.tsx`:

```tsx
import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface PhotoUploadScreenProps {
  onPhotoSelected?: (file: File) => void;
}

export const PhotoUploadScreen: React.FC<PhotoUploadScreenProps> = ({
  onPhotoSelected,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isUsingCamera, setIsUsingCamera] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
        onPhotoSelected?.(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        setIsUsingCamera(true);
      }
    } catch (error) {
      console.error('Failed to access camera:', error);
    }
  };

  const takePhoto = () => {
    if (canvasRef.current && cameraRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(cameraRef.current, 0, 0);
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(blob);
            onPhotoSelected?.(file);
            setIsUsingCamera(false);
            if (cameraRef.current?.srcObject) {
              const tracks = (cameraRef.current.srcObject as MediaStream).getTracks();
              tracks.forEach((track) => track.stop());
            }
          }
        });
      }
    }
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (preview) {
    return (
      <div className="space-y-4">
        <img src={preview} alt="Selected photo" className="w-full rounded-lg" />
        <div className="flex gap-2">
          <button
            onClick={clearPreview}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => {}}
            className="flex-1 px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg font-medium transition-colors"
          >
            Analyze Photo
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Photo will be analyzed with OCR to extract the price.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isUsingCamera ? (
        <>
          <video
            ref={cameraRef}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-black"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-2">
            <button
              onClick={() => setIsUsingCamera(false)}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={takePhoto}
              className="flex-1 px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              Take Photo
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            onClick={startCamera}
            className="w-full p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col items-center gap-2"
          >
            <Camera size={40} className="text-slate-400" />
            <span className="font-medium">Take Photo</span>
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
            className="w-full p-8 border-2 border-dashed border-lime-300 dark:border-lime-700 rounded-lg hover:bg-lime-50 dark:hover:bg-lime-950 transition-colors flex flex-col items-center gap-2"
          >
            <Upload size={40} className="text-lime-500" />
            <span className="font-medium">Upload Photo</span>
          </button>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Take a clear photo of the gas pump price display or receipt
          </p>
        </>
      )}
    </div>
  );
};

export default PhotoUploadScreen;
```

### 2.4 Main Submission Page

`src/sections/price-submission-system/pages/SubmitPricePage.tsx`:

```tsx
import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import PriceSubmissionForm from '../components/PriceSubmissionForm';
import VoiceInputScreen from '../components/VoiceInputScreen';
import PhotoUploadScreen from '../components/PhotoUploadScreen';

type SubmissionMethod = 'text' | 'voice' | 'photo';

export const SubmitPricePage: React.FC = () => {
  const [method, setMethod] = useState<SubmissionMethod | null>(null);

  if (method) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center gap-2">
          <button
            onClick={() => setMethod(null)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold capitalize">{method} Submission</h1>
        </div>

        {/* Content */}
        <div className="p-4">
          {method === 'text' && <PriceSubmissionForm />}
          {method === 'voice' && <VoiceInputScreen />}
          {method === 'photo' && <PhotoUploadScreen />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Submit Fuel Price</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Help the community by sharing current prices. Choose your method:
        </p>

        {/* Method Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Text Entry */}
          <button
            onClick={() => setMethod('text')}
            className="p-6 border-2 border-slate-200 dark:border-slate-800 rounded-lg hover:border-lime-500 dark:hover:border-lime-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-center space-y-2"
          >
            <div className="text-3xl font-bold">📝</div>
            <h3 className="font-semibold">Manual Entry</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Type the price directly
            </p>
          </button>

          {/* Voice */}
          <button
            onClick={() => setMethod('voice')}
            className="p-6 border-2 border-slate-200 dark:border-slate-800 rounded-lg hover:border-lime-500 dark:hover:border-lime-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-center space-y-2"
          >
            <div className="text-3xl font-bold">🎤</div>
            <h3 className="font-semibold">Voice Entry</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Speak the price
            </p>
          </button>

          {/* Photo */}
          <button
            onClick={() => setMethod('photo')}
            className="p-6 border-2 border-slate-200 dark:border-slate-800 rounded-lg hover:border-lime-500 dark:hover:border-lime-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-center space-y-2"
          >
            <div className="text-3xl font-bold">📸</div>
            <h3 className="font-semibold">Photo Upload</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Take a photo of pump/receipt
            </p>
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Tips</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Submit accurate prices to help the community</li>
            <li>• Photos are analyzed with AI for accuracy</li>
            <li>• All submissions are reviewed before going live</li>
            <li>• You earn points for verified submissions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubmitPricePage;
```

---

## Checklist for Phase 4

- [ ] Backend submission API endpoints created
- [ ] File upload service implemented
- [ ] Submission repository and handlers working
- [ ] Text entry form with validation
- [ ] Voice recording interface
- [ ] Photo upload / camera interface
- [ ] Form submission to API
- [ ] Moderation status tracking
- [ ] User submission history
- [ ] Error handling and validation
- [ ] Responsive design tested
- [ ] Dark mode working

---

## Testing Price Submission

```bash
npm run dev

# Visit http://localhost3000/submit
# Should see three submission method options
# Select "Manual Entry" to test text form
# Test voice recording (needs mic permission)
# Test photo upload (camera access)
```

---

## Next Phase

→ Continue to **Phase 5: User Authentication & Tier System** to add secure auth and premium features.

Prices can now be submitted; next implement secure authentication and tier management.
