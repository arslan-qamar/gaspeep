import '@testing-library/jest-dom';

// Mock import.meta.env for Jest (Vite uses import.meta.env at runtime)
// Note: React is not imported here as we use the automatic JSX runtime
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: process.env.VITE_API_URL || '',
      },
    },
  },
  writable: true,
});

// Mock react-map-gl/maplibre to avoid ESM dynamic import issues in Jest and
// to prevent test noise from the real MapLibre implementation.
jest.mock('react-map-gl/maplibre', () => {
  const React = require('react');

  const MapMock = React.forwardRef(({ children }: { children: any }, ref: any) => {
    return React.createElement('div', { 'data-testid': 'map-mock', ref }, children);
  });
  MapMock.displayName = 'MapMock';

  const Marker: React.FC<any> = ({ children }) => {
    return React.createElement('div', { 'data-testid': 'marker-mock' }, children);
  };

  const Popup: React.FC<any> = ({ children }) => {
    // Intentionally do not forward unknown props to DOM to avoid React warnings
    return React.createElement('div', { 'data-testid': 'popup-mock' }, children);
  };

  const NavigationControl = () => React.createElement('div', { 'data-testid': 'navcontrol-mock' });
  const FullscreenControl = () => React.createElement('div', { 'data-testid': 'fullscreen-mock' });
  const GeolocateControl = () => React.createElement('div', { 'data-testid': 'geolocate-mock' });
  const ScaleControl = () => React.createElement('div', { 'data-testid': 'scale-mock' });
  const Source: React.FC<any> = ({ children }) => React.createElement('div', { 'data-testid': 'source-mock' }, children);
  const Layer: React.FC<any> = () => React.createElement('div', { 'data-testid': 'layer-mock' });

  return {
    __esModule: true,
    default: MapMock,
    Map: MapMock,
    Marker,
    Popup,
    NavigationControl,
    FullscreenControl,
    GeolocateControl,
    ScaleControl,
    Source,
    Layer,
  };
});

// Also mock @vis.gl/react-maplibre (some imports in dependencies trigger this)
jest.mock('@vis.gl/react-maplibre', () => {
  const React = require('react');
  const Map = ({ children }: any) => React.createElement('div', { 'data-testid': 'vis-map-mock' }, children);
  const Marker = ({ children }: any) => React.createElement('div', { 'data-testid': 'vis-marker-mock' }, children);
  const Popup = ({ children }: any) => React.createElement('div', { 'data-testid': 'vis-popup-mock' }, children);
  return {
    __esModule: true,
    default: Map,
    Map,
    Marker,
    Popup,
  };
});

// Mock navigator.geolocation for tests that call it
const mockGeolocation = {
  getCurrentPosition: jest.fn().mockImplementation((success) =>
    success({ coords: { latitude: 40.7128, longitude: -74.0060 } }),
  ),
  watchPosition: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Silence specific console noise in tests (optional)
const originalError = console.error.bind(console);
console.error = (...args: any[]) => {
  const first = args[0] && String(args[0]);
  if (first && (first.includes('A dynamic import callback was invoked') || first.includes('Warning: React does not recognize the') || first.includes('Error getting location:'))) {
    return;
  }
  originalError(...args);
};
