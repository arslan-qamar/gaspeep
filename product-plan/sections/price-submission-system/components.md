# Price Submission System — Component Structure

## Components to Implement

### 1. PriceSubmissionForm.tsx
Main form for manual text-based price submission.

**Props:**
```typescript
interface PriceSubmissionFormProps {
  onSubmit: (payload: PriceSubmissionPayload) => void;
  isSubmitting?: boolean;
  recentStations?: Station[];
}
```

**Features:**
- Station search/autocomplete
- Fuel type dropdown
- Price input with validation
- Date/time selector
- Optional notes field
- Voice/Photo input buttons
- Previous submissions list

### 2. VoiceInputScreen.tsx
Speech-to-text interface for hands-free submission.

**Props:**
```typescript
interface VoiceInputScreenProps {
  selectedStation?: Station;
  onSubmit: (payload: PriceSubmissionPayload) => void;
  onCancel: () => void;
  isRecording?: boolean;
}
```

**Features:**
- Large microphone button
- Live transcription display
- Detected values highlighting (station, fuel type, price)
- Waveform animation during recording
- Edit/confirm buttons
- Fallback to manual entry

### 3. PhotoUploadScreen.tsx
Camera/photo upload with OCR processing.

**Props:**
```typescript
interface PhotoUploadScreenProps {
  selectedStation?: Station;
  onSubmit: (payload: PriceSubmissionPayload) => void;
  onCancel: () => void;
}
```

**Features:**
- Camera access (mobile)
- File upload (desktop)
- Photo preview
- OCR results display
- Price extraction highlighting
- Manual correction option

### 4. SubmissionConfirmation.tsx
Success feedback and next steps.

**Props:**
```typescript
interface SubmissionConfirmationProps {
  submission: PriceSubmission;
  onDone: () => void;
  onSubmitAnother: () => void;
}
```

**Features:**
- Success message
- Submission details summary
- Moderation status indicator
- Contribution points display
- "Submit Another" button
- "View on Map" button

---

## Data Flow

```
SubmissionContainer
├── Tabs/Selection:
│   ├── Text Tab → PriceSubmissionForm
│   ├── Voice Tab → VoiceInputScreen
│   └── Photo Tab → PhotoUploadScreen
│
└── Flow:
    1. User selects station + fuel type + price
    2. Form validates inputs
    3. On submit → SubmissionConfirmation
    4. Optional: Submit another or navigate away
```

---

## Integration Checklist

- [ ] Station search autocompletes correctly
- [ ] Fuel type list shows all 11 types
- [ ] Price validation prevents invalid entries
- [ ] Form has at least 3 submission methods
- [ ] Voice input transcribes correctly
- [ ] Photo upload accepts JPEG/PNG
- [ ] OCR extracts prices from images
- [ ] Submission success shows confirmation
- [ ] Recent submissions tracked
- [ ] Error messages helpful and actionable
- [ ] Loading states shown during submission
- [ ] Responsive on mobile < 768px
- [ ] Responsive on tablet/desktop ≥ 768px
- [ ] Dark mode fully functional
- [ ] Form data preserved if navigation away and return

---

## Styling (Tailwind CSS v4)

```css
/* Form container */
.submission-form {
  @apply max-w-2xl mx-auto p-4 md:p-6;
}

/* Input fields */
.submission-input {
  @apply w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg;
  @apply bg-white dark:bg-slate-800 text-slate-900 dark:text-white;
  @apply focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

/* Submission buttons */
.method-button {
  @apply flex-1 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg;
  @apply hover:border-blue-500 cursor-pointer transition-colors;
}

.method-button.active {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900/20;
}

/* Voice recording visualization */
.recording-waveform {
  @apply h-12 flex items-center gap-1;
}

.waveform-bar {
  @apply bg-blue-500 rounded-full animate-pulse;
}
```

---

## See Also
- Specification: [spec.md](spec.md)
- Types: [types.ts](types.ts)
- Sample Data: [sample-data.json](sample-data.json)
- Tests: [tests.md](tests.md)
