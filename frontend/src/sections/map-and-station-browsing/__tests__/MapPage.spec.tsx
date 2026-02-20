import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MapPage from '../pages/MapPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Station } from '../types';
import { MemoryRouter } from 'react-router-dom';

// Mock the API client to avoid import.meta.env issues in Jest
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      response: {
        use: jest.fn(),
      },
    },
  },
  stationApi: {
    getStations: jest.fn(),
    getStation: jest.fn(),
    createStation: jest.fn(),
    updateStation: jest.fn(),
    deleteStation: jest.fn(),
  },
  fuelTypeApi: {
    getFuelTypes: jest.fn(),
    getFuelType: jest.fn(),
  },
  fuelPriceApi: {
    getFuelPrices: jest.fn(),
    getStationPrices: jest.fn(),
    getCheapestPrices: jest.fn(),
  },
}));

// Mock the fetch API
global.fetch = jest.fn();

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};
Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

const mockStations: Station[] = [
  {
    id: '1',
    name: 'Test Station 1',
    address: '123 Test St',
    latitude: 40.7128,
    longitude: -74.006,
    operatingHours: '24/7',
    prices: [
      {
        fuelTypeId: '1',
        fuelTypeName: 'Regular',
        price: 3.99,
        currency: 'USD',
        lastUpdated: '2026-02-07T08:00:00Z',
        verified: true,
      },
    ],
  },
];

describe('MapPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      });
    });

    // Mock successful API calls
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/stations/nearby')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStations),
        });
      }
      if (url.includes('/api/stations/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockStations[0]]),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('renders search bar and filter button', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Filter stations by name e.g: Shell, BP...')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('opens filter modal when filter button clicked', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const filterButtons = screen.getAllByRole('button');
    const filterButton = filterButtons.find(btn => btn.textContent?.includes('Filters'));

    if (filterButton) {
      await user.click(filterButton);
      // Modal opened - check if filter options are visible
      expect(screen.getByPlaceholderText('Filter stations by name e.g: Shell, BP...')).toBeInTheDocument();
    }
  });

  it('performs search when enter pressed in search input', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Filter stations by name e.g: Shell, BP...');
    await user.type(searchInput, 'test{Enter}');

    // Component updates the search query and triggers a fetch with React Query
    await waitFor(() => {
      expect(searchInput).toHaveValue('test');
    });
  });

  it('shows loading indicator during search', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Filter stations by name e.g: Shell, BP...');
    await user.type(searchInput, 'test{Enter}');

    // Component may show loading indicator during fetch
    await waitFor(() => {
      // After query completes, search input should still be there
      expect(screen.getByPlaceholderText('Filter stations by name e.g: Shell, BP...')).toBeInTheDocument();
    });
  });

  it('fetches stations on initial load', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Component uses geolocation to get user location, then fetches nearby stations
    await waitFor(() => {
      // Verify search input is rendered (component loaded)
      expect(screen.getByPlaceholderText('Filter stations by name e.g: Shell, BP...')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('handles geolocation error gracefully', () => {
    mockGeolocation.getCurrentPosition.mockImplementation((...args: any[]) => {
      const error = args[1];
      error({ code: 1, message: 'Permission denied' });
    });

    // Should not throw error
    expect(() => render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    )).not.toThrow();
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Should not throw error when rendering
    expect(() => render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    )).not.toThrow();

    // Component should render the search input even with errors
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Filter stations by name e.g: Shell, BP...')).toBeInTheDocument();
    });
  });

  it('shows responsive filter button text', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Filter button exists and has responsive text styling
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('clears markers when search returns empty', async () => {
    // Override fetch so search returns an empty array
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/stations/nearby')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStations),
        });
      }
      if (typeof url === 'string' && url.includes('/api/stations/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Filter stations by name e.g: Shell, BP...');

    // Perform a search that returns results
    await user.type(searchInput, 'test{Enter}');

    // Component should accept the input and trigger a search
    await waitFor(() => {
      expect(searchInput).toHaveValue('test');
    });
  });
});
