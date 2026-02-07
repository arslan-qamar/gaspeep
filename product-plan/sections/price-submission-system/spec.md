# Price Submission System

## Overview

The Price Submission System enables users to report fuel prices through multiple convenient methods: manual text entry, voice input (speech-to-text), or photo upload (OCR). All submissions go through validation and moderation workflows to ensure data quality. This community-driven approach keeps prices current and accurate.

## User Stories

### As a user, I want to:
- Quickly submit a fuel price I see at a station
- Use voice input while driving for hands-free submission
- Take a photo of the price board instead of typing
- See confirmation that my submission was received
- Know when my submission is verified and published
- Understand how my contributions help the community

### As a free user, I want to:
- Submit prices to earn contribution points
- See basic feedback on my submission status

### As a premium user, I want to:
- Submit prices without ads interrupting the flow
- Get priority review for my submissions
- See detailed statistics on my contributions

## Screen Designs

### 1. Price Submission Form

**Purpose**: Main entry point for submitting fuel prices with manual input

**Layout**:
- Station selector (search or from recent/nearby)
- Fuel type dropdown (all 11 types)
- Price input field (numeric keypad optimized)
- Date/time selector (defaults to current time)
- Optional notes field
- Three submission method buttons:
  - "Submit" (primary action)
  - "Use Voice" (microphone icon)
  - "Take Photo" (camera icon)
- Previous submissions list at bottom (for context)

**Interactions**:
- Auto-complete station search with geolocation
- Smart fuel type suggestions based on station history
- Real-time validation (price range checks)
- Quick access to recently submitted stations
- Tap photo/voice buttons to switch input methods

**States**:
- Empty state: "Spot a good price? Share it!"
- Loading state: "Searching stations..."
- Validation error: "Price seems unusual. Double-check?"
- Success: Brief confirmation toast

### 2. Voice Input Screen

**Purpose**: Hands-free price submission using speech-to-text

**Layout**:
- Large microphone icon (pulsing when listening)
- Live transcription text display
- Detected values highlighted:
  - Station name (blue)
  - Fuel type (green)
  - Price (accent color)
- "Listening..." status with waveform animation
- "Tap to speak" instruction
- Edit/confirm buttons once transcription complete
- "Cancel" button to return to form

**Interactions**:
- Tap microphone to start/stop listening
- Real-time speech-to-text transcription
- NLP parsing to extract station, fuel type, price
- Visual feedback on detected values
- Allow manual correction of misheard values
- Confirm button to submit parsed data

**Voice Commands** (examples):
- "Shell on Market Street, regular unleaded, three seventy nine"
- "Chevron Mission Bay, diesel, four thirty nine per gallon"
- "E10 at Valero Castro is three sixty five"

**States**:
- Idle: "Tap to start voice submission"
- Listening: Pulsing mic + waveform
- Processing: "Analyzing..."
- Parsed: Highlighted values with edit option
- Error: "Couldn't understand. Try again?"

### 3. Photo Capture Screen

**Purpose**: OCR-based price submission by photographing price boards

**Layout**:
- Full-screen camera viewfinder
- Station selector at top (must be selected first)
- Fuel type selector (overlay, defaults to E10)
- Center frame guide for price board alignment
- Tips overlay: "Center price in frame"
- Capture button (large, bottom center)
- Flash toggle button
- Gallery button (use existing photo)
- Cancel button

**Interactions**:
- Must select station before photo (prompt if not)
- Camera preview with focus indicators
- Tap to focus on price area
- Capture photo, then show preview with detected text
- OCR processing with confidence indicators
- Allow manual correction if OCR uncertain
- Pinch to zoom in viewfinder

**OCR Processing**:
- Detect price digits and decimal point
- Show confidence level (high/medium/low)
- Highlight detected text regions on image
- Multiple prices detected? Show all with fuel type selectors
- Fallback to manual entry if OCR fails

**States**:
- Camera loading: "Initializing camera..."
- Ready: Frame guide + tips
- Processing: "Reading prices..." with spinner
- Results: Image with highlighted prices
- Error: "Camera not available" / "OCR failed"

### 4. Submission Confirmation

**Purpose**: Confirm submission received and show status/rewards

**Layout**:
- Large checkmark icon
- "Thanks for contributing!" heading
- Submission details card:
  - Station name and address
  - Fuel type and price
  - Timestamp
  - Submission method badge (manual/voice/photo)
- Status indicator:
  - "Pending review" (for new users)
  - "Published immediately" (for trusted users)
  - "Verification in progress" (for photo submissions)
- Contribution stats:
  - "Your 23rd contribution this month"
  - Points earned (if gamification enabled)
  - Community impact: "Helped 156 users today"
- Action buttons:
  - "Submit Another Price"
  - "View on Map"
  - "Done"

**Free User Experience**:
- Contribution count visible
- Encouragement to upgrade: "Premium users earn 2x points!"
- Ad may display after multiple submissions

**Premium User Experience**:
- No ads
- Priority verification badge
- Detailed contribution analytics
- "Your submissions are trusted" message

**States**:
- Success: Immediate confirmation
- Pending: "We'll verify this within 2 hours"
- Published: "Now live on the map!"

## User Flows

### Manual Price Submission Flow
1. User opens Price Submission from nav
2. Search/select station (or use current location)
3. Select fuel type from dropdown
4. Enter price using numeric keypad
5. Optional: Add notes
6. Tap "Submit"
7. Brief validation check
8. Show confirmation screen
9. Return to map or submit another

### Voice Submission Flow
1. User taps "Use Voice" from submission form
2. Grant microphone permission (first time)
3. Tap microphone icon to start listening
4. Speak submission: "Station, fuel type, price"
5. View live transcription and parsed values
6. Correct any errors (tap to edit)
7. Tap "Confirm & Submit"
8. Show confirmation screen

### Photo Submission Flow
1. User taps "Take Photo" from submission form
2. Select station first (required)
3. Grant camera permission (first time)
4. Frame price board in guide
5. Tap capture button
6. OCR processes image
7. Review detected prices
8. Select correct fuel type for each price (if multiple)
9. Confirm or manually correct
10. Submit all prices
11. Show confirmation screen

### Rapid Multi-Price Submission
1. User at station with multiple fuel types
2. Enter station once
3. Use photo method to capture entire price board
4. OCR detects all visible prices
5. User confirms fuel type mapping
6. Submit all prices at once
7. Bulk confirmation

## Edge Cases

### Location/Station Issues
- **GPS unavailable**: Allow manual station search
- **Station not in database**: "Request to add station" button
- **Closed station**: Warning banner if hours indicate closed
- **Wrong location**: "Not at this station?" with nearby alternatives

### Input Validation
- **Price too high/low**: "Unusual price. Is this correct?" confirmation
- **Duplicate submission**: "You submitted this 5 min ago. Update?"
- **Conflicting recent reports**: Show other recent prices for comparison
- **Invalid format**: Real-time format correction

### Voice Input Challenges
- **Noisy environment**: "Background noise detected. Find quieter spot?"
- **Accent/unclear speech**: Show transcription, allow editing
- **Ambiguous station names**: Show list of matches
- **Missing information**: Prompt for missing fields

### Photo/OCR Issues
- **Blurry photo**: "Photo unclear. Retake or enter manually?"
- **Low light**: Suggest using flash or manual entry
- **Multiple stations visible**: "Which station is this?"
- **No prices detected**: "Couldn't read prices. Try manual entry?"
- **OCR confidence low**: Show detected value with "Verify this" prompt

### Submission Status
- **Offline submission**: Queue for later, show "Will submit when online"
- **Verification delay**: "Pending review. Check back later."
- **Submission rejected**: "This price couldn't be verified. Reason: [X]"
- **Account suspended**: "Submission privileges temporarily suspended"

### Free User Limits
- **Daily submission cap reached**: "Upgrade to Premium for unlimited submissions"
- **Ad fatigue**: Show ad every 3-5 submissions
- **Slow verification**: Free users get standard review time

## Empty States

### First Submission
- Welcome message: "Make your first contribution!"
- Tutorial tips on how to submit
- Suggestion: "Start with a station near you"

### No Recent Stations
- "No recent submissions"
- Search prompt with location icon
- Popular nearby stations list

### Camera Permission Denied
- Clear message: "Camera access needed for photo submissions"
- "Open Settings" button
- Alternative: "Use manual or voice entry"

### No Internet Connection
- "You're offline"
- "Submissions will be sent when connected"
- Show queue count

### Voice Permission Denied
- "Microphone access needed"
- Alternative methods highlighted
- "Open Settings" option

## Success Metrics

### Engagement
- Submission completion rate (start to finish)
- Average time per submission by method
- Method preference distribution
- Repeat submission rate

### Quality
- First-time acceptance rate
- Accuracy of voice/photo vs manual
- Time to verification
- User trust score improvement

### Growth
- New submitters per week
- Submissions per active user
- Conversion from first submission to regular contributor
- Premium upgrade rate among active submitters

## Technical Considerations

### Voice Recognition
- Use device native speech-to-text APIs
- Support multiple languages/locales
- Parse natural language for structured data
- Handle various phrasings and accents

### OCR Implementation
- On-device OCR for speed and privacy
- Cloud OCR fallback for complex images
- Support for various price board formats
- Confidence scoring for detected text

### Validation Rules
- Price range checks by fuel type and region
- Time-based duplicate detection
- User reputation scoring
- Cross-reference with other recent submissions

### Offline Support
- Queue submissions when offline
- Sync when connection restored
- Show queue status to user
- Handle conflicts on sync

### Privacy
- Photo submissions: strip EXIF data
- Store voice temporarily, delete after processing
- Optional anonymous submission mode
