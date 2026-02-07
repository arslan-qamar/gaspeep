# Gas Peep — Product Overview

## Product Summary

**Gas Peep** is a cross-platform fuel price monitoring application that provides real-time, community-driven fuel pricing information through an interactive map-based interface. The app aggregates prices for 11 fuel types across multiple stations, enabling drivers to find competitive prices and save money on fuel.

## Core Value Proposition

Gas Peep solves the **fuel price transparency problem** by:
1. Providing real-time, community-verified pricing data
2. Enabling geospatial discovery through an interactive map
3. Offering flexible submission methods (text, voice, photo) for data collection
4. Creating monetization opportunities for station owners through promotional broadcasts

## Problems Solved

| Problem | Solution |
|---------|----------|
| Lack of fuel price transparency | Community-driven price submissions with moderation |
| Information asymmetry between stations and drivers | Real-time price comparison on interactive map |
| Limited data freshness | Multiple submission methods to encourage participation |
| No station-to-customer communication channel | Station owner broadcast system for promotions |

## Key Features

### For Free Users
- **Map-Based Station Browsing** — View fuel stations geospatially with real-time pricing
- **Fuel Type Filtering** — Filter by one or more of 11 fuel types
- **Price Range Filtering** — Find the cheapest options in your area
- **Community Submissions** — Submit prices via text, voice, or photo
- **Ad-Supported Experience** — Limited map scrolling with advertisements

### For Premium Users
- **All Free Features** — Complete map functionality ad-free
- **Unlimited Map Interaction** — No ad interruptions
- **Custom Price Alerts** — Set thresholds for specific fuel types and locations
- **Push Notifications** — Real-time alerts when prices drop below threshold
- **Station Owner Broadcasts** — Receive promotional messages from nearby stations

### For Station Owners
- **Station Ownership Verification** — Claim stations through identity verification
- **Broadcast System** — Create and send promotional messages to Premium users
- **Engagement Analytics** — Track broadcast reach and user engagement
- **Anti-Spam Safeguards** — Rate-limiting and moderation to prevent abuse

## User Tiers

### Free Tier
- Map browsing with ads
- Community price submissions
- Basic station information
- Ad-supported scrolling experience

### Premium Tier ($4.99/month)
- Ad-free map experience
- Unlimited map interaction
- Custom price alerts
- Push notifications
- Early access to new features

## Fuel Types Supported

1. **E10** — 10% ethanol blend
2. **Unleaded 91** — Regular unleaded gasoline
3. **Diesel** — Standard diesel fuel
4. **Premium Diesel** — High-quality diesel
5. **U95** — European 95 octane unleaded
6. **U98** — European 98 octane premium unleaded
7. **LPG** — Liquefied Petroleum Gas
8. **Truck Diesel** — Heavy-duty diesel
9. **AdBlue** — Diesel emissions reduction fluid
10. **E85** — 85% ethanol fuel
11. **Biodiesel** — Renewable diesel blend

## User Flows at a Glance

### New User Flow
1. Install app → Sign up (Free or Premium) → Grant location access → Explore map → Submit price (optional)

### Free User Flow
1. Open app → View map → Browse stations → View prices → Submit price or upgrade to Premium

### Premium User Flow
1. Open app → View map → Create price alert → Receive notifications → Tap notification to view alert details

### Station Owner Flow
1. Verify station ownership → Claim station → Create broadcast → Set targeting radius → Launch broadcast

## Technology Stack

### Frontend
- **Framework**: React / React Native (cross-platform)
- **Build**: Vite
- **Styling**: Tailwind CSS v4
- **Mapping**: Mapbox GL JS or Google Maps API

### Backend
- **Language**: Go
- **API**: REST or GraphQL
- **Database**: PostgreSQL with PostGIS extension
- **Authentication**: OAuth 2.0 + JWT

### Infrastructure
- **Containerization**: Docker
- **Deployment**: Kubernetes or managed cloud service
- **Observability**: Prometheus, Grafana, structured logging

## Development Sections

Gas Peep is built in 5 independent sections, each representing a self-contained feature area:

### 1. Map & Station Browsing
Core interface — Interactive map showing fuel stations with real-time prices, filtering by fuel type and price range.

### 2. Price Submission System
Community data collection — Text input, voice (speech-to-text), and photo (OCR) submission methods.

### 3. User Authentication & Tiers
Account management — Sign up, login, tier selection, profile management.

### 4. Alerts & Notifications
Premium feature — Custom price threshold alerts with push notification delivery.

### 5. Station Owner Dashboard
Business tools — Station verification, broadcast creation, engagement analytics.

## Design System

### Color Palette (Tailwind Colors)
- **Primary**: Blue — Action buttons, links, interactive elements
- **Secondary**: Green — Positive states, low prices, confirmations
- **Neutral**: Slate — Text, backgrounds, borders

### Typography
- **Headings**: Inter (web), system fonts (mobile)
- **Body**: Inter (web), system fonts (mobile)
- **Monospace**: JetBrains Mono (code, prices)

### Layout Principles
- **Mobile-First** — Optimized for on-the-go usage
- **Responsive** — Adapts seamlessly from mobile to desktop
- **Dark Mode** — Full dark mode support for night driving
- **Accessible** — WCAG 2.1 AA compliance

## Monetization Model

### Freemium Model
- **Free Tier**: Limited features, ad-supported
- **Premium Tier**: $4.99/month, full feature access, no ads

### Future Revenue Streams
- Premium tier subscription (primary)
- Station owner broadcast platform (secondary)
- Data licensing to automotive/energy companies (tertiary)

## Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Average session duration
- Price submission rate per user

### Data Quality
- Average price submission frequency per station
- Data accuracy (percentage of verified submissions)
- Community participation growth

### Business
- Conversion rate (Free → Premium)
- Premium subscriber retention
- Station owner adoption
- Revenue per user

## Competitive Advantages

1. **Community-Driven Data** — Real-time, community-verified prices (not corporate partnerships)
2. **Multi-Modal Input** — Voice and photo submissions reduce friction
3. **Station Owner Tools** — New monetization channel through broadcast platform
4. **Geographic Optimization** — PostGIS for efficient geospatial queries
5. **Privacy-First Design** — Optional location sharing, no tracking across sessions

## Constraints & Assumptions

### Constraints
- Limited by community participation (data quality depends on user engagement)
- Regulatory compliance varies by region (fuel pricing may be regulated)
- Payment processing fees reduce margin on Premium subscriptions
- Map provider costs scale with usage

### Assumptions
- Users have smartphones with GPS capabilities
- Users are willing to contribute pricing information
- Market exists for Premium features ($4.99/month willingness to pay)
- Station owners see value in promotional messaging

## Future Roadmap (Phase 2+)

- **International Expansion** — Support for additional fuel types and countries
- **Advanced Analytics** — Trend analysis and price prediction for users
- **Loyalty Integration** — Partner with fuel chains for rewards
- **Fleet Management** — B2B tools for fleet optimization
- **API for Third-Parties** — Licensing fuel price data to ride-sharing and delivery apps

---

**Product Completed**: February 2026  
**Status**: Ready for implementation  
**Next Step**: Review [prompts/one-shot-prompt.md](../prompts/one-shot-prompt.md) or [instructions/one-shot-instructions.md](../instructions/one-shot-instructions.md)
