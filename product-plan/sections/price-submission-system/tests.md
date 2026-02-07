# Price Submission System — Test Specifications

Test these scenarios to ensure the Price Submission System section meets requirements.

---

## User Flow Tests

### Flow 1: Submit Price via Text (Free User)
**Given:** Free user on price submission screen  
**When:** User enters station, fuel type, and price  
**Then:**
- [ ] Station search autocompletes
- [ ] Fuel type dropdown shows all 11 types
- [ ] Price field accepts numeric input
- [ ] Validation prevents negative prices
- [ ] Validation prevents prices > $100/unit
- [ ] "Submit" button enabled when required fields filled
- [ ] Submission succeeds
- [ ] Confirmation screen shows
- [ ] Submission appears in history

### Flow 2: Submit Price via Voice
**Given:** User on voice input screen  
**When:** User taps microphone and speaks "Shell Market Street, Diesel, three dollars thirty-nine"  
**Then:**
- [ ] Recording starts with visual feedback
- [ ] Waveform animation displays
- [ ] "Listening..." status shown
- [ ] Transcription appears in real-time
- [ ] Station "Shell" detected and highlighted
- [ ] Fuel type "Diesel" detected and highlighted
- [ ] Price "3.39" detected and highlighted
- [ ] User can edit detected values before submitting
- [ ] Can submit or cancel

### Flow 3: Submit Price via Photo
**Given:** User on photo upload screen  
**When:** User takes photo of price board  
**Then:**
- [ ] Camera opens (mobile) or file upload (desktop)
- [ ] Photo preview displays
- [ ] OCR processes image
- [ ] Detected prices highlighted
- [ ] Station pre-selected (if available)
- [ ] Can confirm extracted values or edit
- [ ] Can submit or retake photo

### Flow 4: Multi-Method Flow
**Given:** User switching between submission methods  
**When:** User starts with text, switches to voice, then to photo  
**Then:**
- [ ] Tab/button selection switches views
- [ ] Previously entered data may or may not persist (design choice)
- [ ] Can switch back to previous method
- [ ] All methods functional

### Flow 5: Invalid Price Submission
**Given:** User enters price outside valid range  
**When:** User tries to submit $0.50 or $99.99  
**Then:**
- [ ] Validation message appears
- [ ] "This price seems unusual. Double-check?" shown
- [ ] Can still submit (user overrides validation)
- [ ] Or can edit and resubmit

### Flow 6: Submission Confirmation
**Given:** User successfully submits price  
**When:** Server processes submission  
**Then:**
- [ ] Confirmation screen displays
- [ ] Submission details shown (station, fuel type, price)
- [ ] Status: "Pending Moderation" shown
- [ ] "Submit Another" button available
- [ ] "View on Map" button available
- [ ] "Done" button returns to main screen

---

## Premium User Experience Tests

### Premium Flow 1: No Ads During Submission
**Given:** Premium user on submission form  
**When:** User fills and submits form  
**Then:**
- [ ] No ads appear
- [ ] Form interaction smooth
- [ ] Submission completes faster (if applicable)

### Premium Flow 2: Priority Review
**Given:** Premium user submits price  
**When:** Moderation queue processes submissions  
**Then:**
- [ ] Premium submissions flagged for priority
- [ ] Faster approval time (implementation detail)
- [ ] User can see priority status (optional)

---

## Form Validation Tests

### Validation 1: Empty Form
**Given:** User on form with no fields filled  
**When:** User tries to click "Submit"  
**Then:**
- [ ] Submit button disabled or shows error
- [ ] Required field indicators visible
- [ ] Cannot submit empty form

### Validation 2: Missing Station
**Given:** User fills fuel type and price but no station  
**When:** User tries to submit  
**Then:**
- [ ] Error message: "Please select a station"
- [ ] Station field highlighted
- [ ] Submit blocked

### Validation 3: Missing Fuel Type
**Given:** User fills station and price but no fuel type  
**When:** User tries to submit  
**Then:**
- [ ] Error message: "Please select a fuel type"
- [ ] Fuel type field highlighted
- [ ] Submit blocked

### Validation 4: Invalid Price Format
**Given:** User enters text in price field (e.g., "abc")  
**When:** User tries to submit  
**Then:**
- [ ] Error message: "Price must be a number"
- [ ] Price field cleared or highlighted
- [ ] Submit blocked

### Validation 5: Negative Price
**Given:** User enters negative price  
**When:** User tries to submit  
**Then:**
- [ ] Error message: "Price must be positive"
- [ ] Price field highlighted
- [ ] Submit blocked

---

## Empty State Tests

### Empty State 1: No Recent Submissions
**Given:** New user first time on submission form  
**When:** Form loads  
**Then:**
- [ ] "Previous submissions" section shows empty state
- [ ] "Spot a good price? Share it!" message shown
- [ ] Can proceed to submit first price

### Empty State 2: No Nearby Stations
**Given:** User in remote area with no stations  
**When:** Station search dropdown opens  
**Then:**
- [ ] "No stations found" message
- [ ] Can still search by name/address
- [ ] Suggestion to add new station (optional)

---

## Error State Tests

### Error 1: Microphone Permission Denied
**Given:** User on voice input screen  
**When:** Browser denies microphone access  
**Then:**
- [ ] Error message: "Microphone access required"
- [ ] Button to retry permission request
- [ ] Fallback to manual text entry

### Error 2: Camera Permission Denied
**Given:** User on photo input screen (mobile)  
**When:** Browser denies camera access  
**Then:**
- [ ] Error message: "Camera access required"
- [ ] Button to change permissions
- [ ] Fallback to file upload

### Error 3: Submission Network Error
**Given:** User submits price  
**When:** Network request fails  
**Then:**
- [ ] Error message displayed
- [ ] "Retry" button available
- [ ] Form data preserved
- [ ] User doesn't lose entered data

### Error 4: OCR Processing Failed
**Given:** User uploads photo  
**When:** OCR service fails or returns no results  
**Then:**
- [ ] Error message: "Couldn't extract prices from image. Try again?"
- [ ] Can retake photo
- [ ] Can manually enter price instead

### Error 5: Voice Recognition Failed
**Given:** User tries voice input  
**When:** Speech-to-text service fails  
**Then:**
- [ ] Error message: "Couldn't understand. Try again?"
- [ ] Can retry recording
- [ ] Can type manually instead

---

## Responsive Design Tests

### Mobile (< 768px)
**When:** Viewing form on phone  
**Then:**
- [ ] Form takes full width with padding
- [ ] Input fields large enough for touch
- [ ] Keyboard doesn't hide submit button
- [ ] Method buttons (Voice, Photo) prominent
- [ ] Price input has numeric keypad

### Tablet (768px - 1024px)
**When:** Viewing form on tablet  
**Then:**
- [ ] Form centers or uses reasonable width
- [ ] Touch targets adequate for touch
- [ ] Layout adapts

### Desktop (> 1024px)
**When:** Viewing form on desktop  
**Then:**
- [ ] Form max-width applied (e.g., 600px)
- [ ] All controls visible and usable
- [ ] Method buttons displayed horizontally (optional)

---

## Dark Mode Tests

### Dark Mode 1: Form Inputs
**When:** Dark mode enabled  
**Then:**
- [ ] Input fields dark background
- [ ] Text light and readable
- [ ] Placeholders visible
- [ ] Input focus state visible

### Dark Mode 2: Confirmation Screen
**When:** Dark mode and showing confirmation  
**Then:**
- [ ] Confirmation card dark background
- [ ] All text readable
- [ ] Buttons visible and contrasting

### Dark Mode 3: Voice Waveform
**When:** Dark mode during voice recording  
**Then:**
- [ ] Waveform bars visible
- [ ] Pulsing animation visible
- [ ] Colors not same as background

---

## Voice Input Tests

### Voice 1: Clear Audio Input
**Given:** User with clear microphone input  
**When:** User says "Shell Market Street, Diesel, three thirty-nine"  
**Then:**
- [ ] Transcription captures entire phrase
- [ ] All values detected (station, fuel type, price)
- [ ] Can submit directly

### Voice 2: Unclear Audio
**Given:** User in noisy environment  
**When:** User speaks price  
**Then:**
- [ ] Best-effort transcription shown
- [ ] User can edit misheard values
- [ ] Can rerecord if too many errors

### Voice 3: Different Accents
**Given:** User with accent or speech variation  
**When:** User speaks price in their natural accent  
**Then:**
- [ ] Transcription attempts to understand
- [ ] User can correct if needed

### Voice 4: Specific Fuel Type Names
**Given:** User says fuel type (e.g., "Regular Unleaded")  
**When:** Voice processing interprets input  
**Then:**
- [ ] Correctly maps to fuel type
- [ ] E10, Diesel, U95, etc. recognized
- [ ] Can show user detected type for confirmation

---

## Photo Input Tests

### Photo 1: Clear Price Board Photo
**Given:** User takes clear photo of price board  
**When:** OCR processes image  
**Then:**
- [ ] All prices detected accurately
- [ ] Station name (if visible) detected
- [ ] Fuel types matched to prices

### Photo 2: Blurry Photo
**Given:** User uploads blurry photo  
**When:** OCR processes image  
**Then:**
- [ ] Best-effort extraction shown
- [ ] User can correct values
- [ ] Can retake photo if needed

### Photo 3: Multiple Price Boards
**Given:** Photo contains multiple price boards  
**When:** OCR processes image  
**Then:**
- [ ] Extracts all visible prices (implementation choice)
- [ ] User selects relevant price
- [ ] Can clarify which fuel type

---

## Performance Tests

### Performance 1: Station Search
**When:** User types in station search  
**Then:**
- [ ] Results appear within 300ms
- [ ] Autocomplete responsive
- [ ] No lag with 1000+ stations in database

### Performance 2: Voice Processing
**When:** User stops recording  
**Then:**
- [ ] Transcription completes within 2 seconds
- [ ] Processing state shown to user

### Performance 3: Photo Upload
**When:** User selects photo  
**Then:**
- [ ] Upload completes quickly (< 10 seconds)
- [ ] OCR processes within 5 seconds
- [ ] Progress indicator shown

---

## Accessibility Tests

### Accessibility 1: Keyboard Navigation
**When:** Using keyboard only  
**Then:**
- [ ] Tab key navigates through fields
- [ ] Enter submits form
- [ ] Escape cancels operation
- [ ] All buttons accessible

### Accessibility 2: Screen Reader
**When:** Using screen reader  
**Then:**
- [ ] Form fields labeled
- [ ] Input purposes announced
- [ ] Error messages announced
- [ ] Button purposes clear

### Accessibility 3: Color Contrast
**When:** Viewing form  
**Then:**
- [ ] Labels readable (min 4.5:1 contrast)
- [ ] Input fields readable
- [ ] Error text readable

---

## Integration Tests

### Integration 1: User History
**Given:** User submits multiple prices  
**When:** User views "Previous submissions"  
**Then:**
- [ ] All submissions appear in list
- [ ] Most recent first
- [ ] Can view status (pending/approved/rejected)

### Integration 2: Map Integration
**Given:** User submits price  
**When:** User navigates to map  
**Then:**
- [ ] Newly submitted price appears (after moderation)
- [ ] Map updates to show new data

### Integration 3: Moderation System
**Given:** User submits suspicious price  
**When:** Moderation system reviews submission  
**Then:**
- [ ] Submission enters queue
- [ ] Moderator can approve/reject
- [ ] User notified of status

---

## Edge Cases

### Edge Case 1: Station Not in Database
**Given:** User wants to submit price for station not in system  
**When:** Station not found in search  
**Then:**
- [ ] "Station not found" message
- [ ] Option to request station be added (optional)
- [ ] Or create new station with name

### Edge Case 2: Rare Fuel Type
**Given:** User submits price for E85 (rare fuel type)  
**When:** Submission processed  
**Then:**
- [ ] Correctly categorized
- [ ] Appears in system correctly

### Edge Case 3: Very Old Price Data
**Given:** User submits price from 24+ hours ago  
**When:** Submission received  
**Then:**
- [ ] Warning: "This price may be outdated"
- [ ] Can still submit
- [ ] Confidence score reflects age

### Edge Case 4: Duplicate Submission
**Given:** Same user submits same price twice in 1 hour  
**When:** Second submission received  
**Then:**
- [ ] Warning: "You submitted this recently"
- [ ] Can still submit (user overrides)
- [ ] Or system prevents duplicate

---

## Success Criteria

✅ All submission methods (text, voice, photo) functional  
✅ Form validation prevents invalid data  
✅ Confirmation feedback provided  
✅ Error messages helpful and actionable  
✅ UI responsive across all screen sizes  
✅ Dark mode fully functional  
✅ Accessibility standards met (WCAG 2.1 AA)  
✅ Performance acceptable for user experience  
