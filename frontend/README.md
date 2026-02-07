# Gas Peep Frontend

React + TypeScript + Vite application for the Gas Peep real-time gas price tracking platform.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

### Testing

```bash
npm run test
npm run test:ui
npm run test:coverage
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── main.tsx              # Entry point
├── shell/                # App layout shell
│   ├── AppShell.tsx      # Main app wrapper
│   └── components/       # Header, nav, etc.
├── sections/             # Feature sections
│   ├── map-and-station-browsing/
│   ├── price-submission-system/
│   ├── user-authentication-and-tiers/
│   ├── alerts-and-notifications/
│   └── station-owner-dashboard/
├── services/             # API calls
├── hooks/                # Custom React hooks
├── lib/                  # Utilities
├── components/           # Shared components
├── styles/               # Global styles
└── __tests__/            # Test files
```

## Environment Variables

Create a `.env.local` file:

```
VITE_API_URL=http://localhost:8080/api
```

## Key Dependencies

- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Zustand** - State management
- **Leaflet** - Map rendering

## API Integration

API calls are made through `src/lib/api.ts` which includes:
- Base URL configuration
- Request/response interceptors
- Token-based authentication
- Error handling

## Dark Mode

The app supports dark mode using Tailwind's `dark:` class prefix. Toggle dark mode by adding the `dark` class to the `<html>` element.

## Contributing

See main repository for contributing guidelines.
