# Data Model

This data model defines the core entities and relationships in Gas Peep. It establishes the "nouns" of the system and ensures consistency across all sections.

---

## Entities

### User
Represents a person using the Gas Peep application.

**Attributes:**
- Unique identifier
- Email address
- Display name
- Account tier (Free or Premium)
- Registration date
- Location preferences
- Notification preferences

**Relationships:**
- Has many PriceSubmissions
- Has many Alerts (if Premium)
- Receives many Notifications
- May be associated with a StationOwner account

---

### Station
Represents a fuel station location.

**Attributes:**
- Unique identifier
- Name
- Brand (e.g., Shell, BP, independent)
- Address
- Geographic coordinates (latitude, longitude)
- Operating hours
- Amenities (car wash, convenience store, etc.)
- Last verified date

**Relationships:**
- Has many FuelPrices (one per fuel type)
- Has many PriceSubmissions
- May have one StationOwner
- Featured in many Alerts

---

### FuelType
Represents a type of fuel available for purchase.

**Attributes:**
- Unique identifier
- Name (e.g., "E10", "Unleaded 91", "Diesel")
- Display name
- Description
- Color code (for UI display)
- Display order

**Fixed Types:**
- E10
- Unleaded 91
- Diesel
- Premium Diesel
- U95
- U98
- LPG
- Truck Diesel
- AdBlue
- E85
- Biodiesel

**Relationships:**
- Referenced by many FuelPrices
- Referenced by many PriceSubmissions
- Referenced by many Alerts

---

### FuelPrice
Represents the current price of a specific fuel type at a specific station.

**Attributes:**
- Unique identifier
- Price per unit (currency)
- Currency code
- Unit (liters, gallons)
- Last updated timestamp
- Verification status
- Number of confirmations

**Relationships:**
- Belongs to one Station
- Belongs to one FuelType
- Derived from many PriceSubmissions

---

### PriceSubmission
Represents a community-submitted fuel price update.

**Attributes:**
- Unique identifier
- Price value
- Submission timestamp
- Submission method (text, voice, photo)
- Moderation status (pending, approved, rejected)
- Verification confidence score
- Photo URL (if applicable)
- Voice recording URL (if applicable)
- OCR data (if applicable)
- Moderator notes

**Relationships:**
- Submitted by one User
- For one Station
- For one FuelType
- May update one FuelPrice

---

### Alert
Represents a custom price alert set by a Premium user.

**Attributes:**
- Unique identifier
- Price threshold
- Location (latitude, longitude)
- Radius (in km/miles)
- Alert name/description
- Active status
- Created date
- Last triggered date

**Relationships:**
- Belongs to one User (Premium)
- For one FuelType
- May reference specific Stations
- Generates many Notifications

---

### Notification
Represents a notification sent to a user.

**Attributes:**
- Unique identifier
- Notification type (price alert, broadcast, system)
- Title
- Message content
- Sent timestamp
- Read status
- Delivery status

**Relationships:**
- Sent to one User
- May be triggered by one Alert
- May be from one Broadcast

---

### StationOwner
Represents a verified station owner account.

**Attributes:**
- Unique identifier
- Business name
- Verification status
- Verification documents
- Contact information
- Verification date

**Relationships:**
- Linked to one User account
- Manages one or more Stations
- Creates many Broadcasts

---

### Broadcast
Represents a promotional message from a station owner.

**Attributes:**
- Unique identifier
- Title
- Message content
- Target radius (in km/miles)
- Start date/time
- End date/time
- Broadcast status (scheduled, active, expired)
- Target fuel types (optional filter)
- Created timestamp
- Engagement metrics (views, clicks)

**Relationships:**
- Created by one StationOwner
- For one Station
- May target specific FuelTypes
- Generates many Notifications

---

## Relationships

- User (1) has many PriceSubmission (many)
- PriceSubmission (many) belongs to Station (1)
- User (1) has many Alert (many)
- Alert (many) belongs to FuelType (1)
- Station (1) has many FuelPrice (many)
- FuelPrice (many) belongs to FuelType (1)
- StationOwner (1) manages many Station (many)
- StationOwner (1) creates many Broadcast (many)
- Broadcast (many) generates many Notification (many)
- Alert (many) generates many Notification (many)
- Notification (many) sent to User (1)

---

## Implementation Notes

- **Geographic Queries**: Stations should support efficient radius-based searches using PostGIS or similar geospatial indexing
- **Price Verification**: Multiple PriceSubmissions for the same Station/FuelType combination should increase confidence score
- **Moderation Queue**: PriceSubmissions with low confidence or flagged by automated checks should require manual review
- **Notification Delivery**: Push notifications should be queued and processed asynchronously
- **Broadcast Limits**: Station owners should have rate limits to prevent spam
- **Data Retention**: Consider archiving old PriceSubmissions and Notifications after a retention period
- **Caching Strategy**: FuelPrices should be heavily cached for map browsing performance
