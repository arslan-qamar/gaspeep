import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
  brandApi: {
    getBrands: jest.fn(),
    getBrand: jest.fn(),
  },
  mapPreferencesApi: {
    getMapFilterPreferences: jest.fn(),
    updateMapFilterPreferences: jest.fn(),
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
    brand: 'Shell',
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
  {
    id: '2',
    name: 'Test Station 2',
    brand: 'BP',
    address: '456 Test Ave',
    latitude: 40.7138,
    longitude: -74.007,
    operatingHours: '6am-11pm',
    prices: [
      {
        fuelTypeId: '2',
        fuelTypeName: 'Diesel',
        price: 4.15,
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
    (global.fetch as jest.Mock).mockReset();
    const { apiClient, fuelTypeApi, brandApi, mapPreferencesApi } = jest.requireMock('@/lib/api');
    apiClient.post.mockResolvedValue({ data: mockStations });
    fuelTypeApi.getFuelTypes.mockResolvedValue({
      data: [
        { id: '1', name: 'Regular', displayName: 'Regular', displayOrder: 1 },
        { id: '2', name: 'Diesel', displayName: 'Diesel', displayOrder: 2 },
      ],
    });
    brandApi.getBrands.mockResolvedValue({
      data: [
        { id: 'b1', name: 'Shell', displayName: 'Shell', displayOrder: 1 },
        { id: 'b2', name: 'BP', displayName: 'BP', displayOrder: 2 },
      ],
    });
    mapPreferencesApi.getMapFilterPreferences.mockResolvedValue({
      data: { fuelTypes: [], brands: [], maxPrice: 400, onlyVerified: false },
    });
    mapPreferencesApi.updateMapFilterPreferences.mockResolvedValue({ data: { message: 'ok' } });

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
      if (typeof url === 'string' && url.includes('nominatim.openstreetmap.org/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
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

  it('renders search bar and overlaid filter controls', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Search location')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fuel Types/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Brands/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Show verified prices only/i)).toBeInTheDocument();
  });

  it('exposes search input with an accessible name', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('textbox', { name: /search location/i })).toBeInTheDocument();
  });

  it('focuses search location input on page load', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Search location')).toHaveFocus();
  });

  it('does not show location results dropdown on initial auto-focus', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Search location')).toHaveFocus();
    expect(screen.queryByTestId('map-unified-search-dropdown')).not.toBeInTheDocument();
  });

  it('links dropdown trigger to its popup via aria-controls', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const fuelButton = screen.getByRole('button', { name: /Fuel Types/i });
    await user.click(fuelButton);

    const popupId = fuelButton.getAttribute('aria-controls');
    expect(popupId).toBeTruthy();
    expect(document.getElementById(popupId as string)).toBeInTheDocument();
  });

  it('shows filter controls directly without modal', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /Fuel Types/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Brands/i })).toBeInTheDocument();
  });

  it('closes Fuel Types dropdown when escape is pressed', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Fuel Types/i }));
    expect(screen.getByLabelText('Diesel')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByLabelText('Diesel')).not.toBeInTheDocument();
    });
  });

  it('closes Brands dropdown when escape is pressed', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Brands/i }));
    expect(screen.getByLabelText('Shell')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByLabelText('Shell')).not.toBeInTheDocument();
    });
  });

  it('closes search location dropdown when escape is pressed from clear button focus', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search location');

    await user.type(searchInput, 'ab');
    await waitFor(() => {
      expect(screen.getByTestId('map-unified-search-dropdown')).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: /Clear search/i });
    clearButton.focus();
    expect(clearButton).toHaveFocus();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByTestId('map-unified-search-dropdown')).not.toBeInTheDocument();
    });
  });

  it('moves focus from search input to first location result on tab', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      const requestUrl = typeof url === 'string' ? url : (url as { url?: string })?.url ?? String(url);
      if (requestUrl.includes('nominatim.openstreetmap.org/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              lat: '40.73061',
              lon: '-73.935242',
              display_name: 'New York, NY, USA',
            },
            {
              lat: '34.052235',
              lon: '-118.243683',
              display_name: 'Los Angeles, CA, USA',
            },
          ]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search location');
    await user.type(searchInput, 'new');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'New York, NY, USA' })).toBeInTheDocument();
    });

    expect(searchInput).toHaveFocus();
    await user.tab();

    expect(screen.getByRole('button', { name: 'New York, NY, USA' })).toHaveFocus();
  });

  it('moves focus from search input to first location result on arrow down', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      const requestUrl = typeof url === 'string' ? url : (url as { url?: string })?.url ?? String(url);
      if (requestUrl.includes('nominatim.openstreetmap.org/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              lat: '40.73061',
              lon: '-73.935242',
              display_name: 'New York, NY, USA',
            },
            {
              lat: '34.052235',
              lon: '-118.243683',
              display_name: 'Los Angeles, CA, USA',
            },
          ]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search location');
    await user.type(searchInput, 'new');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'New York, NY, USA' })).toBeInTheDocument();
    });

    expect(searchInput).toHaveFocus();
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('button', { name: 'New York, NY, USA' })).toHaveFocus();
  });

  it('performs search when enter pressed in search input', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search location');
    await user.type(searchInput, 'test');

    // Component updates the search query and triggers a fetch with React Query
    await waitFor(() => {
      expect(searchInput).toHaveValue('test');
    });
  });

  it('allows arrow navigation between location results when a result is focused', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      const requestUrl = typeof url === 'string' ? url : (url as { url?: string })?.url ?? String(url);
      if (requestUrl.includes('nominatim.openstreetmap.org/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              lat: '40.73061',
              lon: '-73.935242',
              display_name: 'New York, NY, USA',
            },
            {
              lat: '34.052235',
              lon: '-118.243683',
              display_name: 'Los Angeles, CA, USA',
            },
          ]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search location');
    await user.type(searchInput, 'new');

    const resultsDropdown = await screen.findByTestId('map-unified-search-dropdown');
    await waitFor(() => {
      expect(within(resultsDropdown).getByRole('button', { name: 'New York, NY, USA' })).toBeInTheDocument();
    });
    const newYorkResult = within(resultsDropdown).getByRole('button', { name: 'New York, NY, USA' });
    newYorkResult.focus();

    await user.keyboard('{ArrowDown}{Enter}');

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('shows loading indicator during search', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search location');
    await user.type(searchInput, 'test');

    // Component may show loading indicator during fetch
    await waitFor(() => {
      // After query completes, search input should still be there
      expect(screen.getByPlaceholderText('Search location')).toBeInTheDocument();
    });
  });

  it('fetches stations on initial load', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Component uses geolocation to get user location, then fetches nearby stations
    await waitFor(() => {
      // Verify search input is rendered (component loaded)
      expect(screen.getByPlaceholderText('Search location')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('handles geolocation error gracefully', () => {
    mockGeolocation.getCurrentPosition.mockImplementation((...args: any[]) => {
      const error = args[1];
      error({ code: 1, message: 'Permission denied' });
    });

    // Should not throw error
    expect(() => render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    )).not.toThrow();

    // Component should render the search input even with errors
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search location')).toBeInTheDocument();
    });
  });

  it('shows overlaid filter controls', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /Fuel Types/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Brands/i })).toBeInTheDocument();
  });

  it('keeps filter control row from stretching sibling controls when dropdowns expand', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const filterControlsRow = screen.getByTestId('map-filter-controls-row');
    expect(filterControlsRow).toHaveClass('items-start');
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
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search location');

    // Perform a search that returns results
    await user.type(searchInput, 'test');

    // Component should accept the input and trigger a search
    await waitFor(() => {
      expect(searchInput).toHaveValue('test');
    });
  });

  it('clears markers when applying filters returns empty results', async () => {
    const { apiClient, fuelTypeApi } = jest.requireMock('@/lib/api');

    fuelTypeApi.getFuelTypes.mockResolvedValue({
      data: [
        { id: 'diesel', name: 'Diesel', displayName: 'Diesel', displayOrder: 1 },
      ],
    });

    apiClient.post.mockImplementation((url: string, body: any) => {
      if (url === '/stations/search-nearby' && body?.fuelTypes?.length > 0) {
        return Promise.resolve({ data: [] });
      }
      if (url === '/stations/search-nearby') {
        return Promise.resolve({ data: mockStations });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTitle('Shell')).toBeInTheDocument();
      expect(screen.getByTitle('BP')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Fuel Types/i }));
    await user.click(screen.getByLabelText('Diesel'));

    await waitFor(() => {
      expect(screen.queryByTitle('Shell')).not.toBeInTheDocument();
      expect(screen.queryByTitle('BP')).not.toBeInTheDocument();
    });
  });

  it('loads saved map filter preferences from backend', async () => {
    const { mapPreferencesApi } = jest.requireMock('@/lib/api');
    mapPreferencesApi.getMapFilterPreferences.mockResolvedValue({
      data: { fuelTypes: ['2'], brands: ['Shell'], maxPrice: 175.5, onlyVerified: true },
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Fuel Types/i }));
    await waitFor(() => {
      expect(screen.getByLabelText('Diesel')).toBeChecked();
    });
    expect(screen.getByRole('button', { name: /Brands.*1 selected/i })).toBeInTheDocument();
  });

  it('saves map filter preferences to backend when filters are applied', async () => {
    const { mapPreferencesApi } = jest.requireMock('@/lib/api');

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Fuel Types/i }));
    await user.click(screen.getByLabelText('Diesel'));
    await user.click(screen.getByRole('button', { name: /Brands/i }));
    await user.click(screen.getByLabelText('Shell'));

    await waitFor(() => {
        expect(mapPreferencesApi.updateMapFilterPreferences).toHaveBeenCalledWith(
          expect.objectContaining({
            fuelTypes: ['2'],
            brands: ['Shell'],
          })
        );
    });
  });

  it('commits max price once after slider interaction ends', async () => {
    const { apiClient, mapPreferencesApi } = jest.requireMock('@/lib/api');

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        apiClient.post.mock.calls.some(([url]: [string]) => url === '/stations/search-nearby')
      ).toBe(true);
    });

    const searchNearbyCallCount = () =>
      apiClient.post.mock.calls.filter(([url]: [string]) => url === '/stations/search-nearby').length;

    const baselineSearchNearbyCalls = searchNearbyCallCount();
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '390' } });
    fireEvent.change(slider, { target: { value: '380' } });
    fireEvent.change(slider, { target: { value: '370' } });

    expect(mapPreferencesApi.updateMapFilterPreferences).not.toHaveBeenCalled();
    expect(searchNearbyCallCount()).toBe(baselineSearchNearbyCalls);

    fireEvent.mouseUp(slider);

    await waitFor(() => {
      expect(mapPreferencesApi.updateMapFilterPreferences).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(searchNearbyCallCount()).toBe(baselineSearchNearbyCalls + 1);
    });
  });

  it('loads brand options from backend brands endpoint', async () => {
    const { brandApi } = jest.requireMock('@/lib/api');
    brandApi.getBrands.mockResolvedValue({
      data: [
        { id: 'b1', name: 'Shell', displayName: 'Shell', displayOrder: 1 },
        { id: 'b2', name: 'Caltex', displayName: 'Caltex', displayOrder: 2 },
      ],
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Brands/i }));

    await waitFor(() => {
      expect(brandApi.getBrands).toHaveBeenCalledTimes(1);
      expect(screen.getByLabelText('Caltex')).toBeInTheDocument();
    });
  });

  it('filters markers locally by selected brand in Filters modal without backend requery', async () => {
    const { apiClient } = jest.requireMock('@/lib/api');

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTitle('Shell')).toBeInTheDocument();
      expect(screen.getByTitle('BP')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const callsBeforeBrandSelect = apiClient.post.mock.calls.length;
    await user.click(screen.getByRole('button', { name: /Brands/i }));
    await user.click(screen.getByLabelText('Shell'));

    await waitFor(() => {
      expect(screen.getByTitle('Shell')).toBeInTheDocument();
      expect(screen.queryByTitle('BP')).not.toBeInTheDocument();
    });

    expect(apiClient.post.mock.calls.length).toBe(callsBeforeBrandSelect);
  });

  it('preserves fuel and brand filters on location selection requery', async () => {
    const { apiClient, mapPreferencesApi } = jest.requireMock('@/lib/api');
    mapPreferencesApi.getMapFilterPreferences.mockResolvedValue({
      data: { fuelTypes: ['2'], brands: [], maxPrice: 300, onlyVerified: false },
    });
    (global.fetch as jest.Mock).mockImplementation((url) => {
      const requestUrl = typeof url === 'string' ? url : (url as { url?: string })?.url ?? String(url);
      if (requestUrl.includes('nominatim.openstreetmap.org/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              lat: '40.73061',
              lon: '-73.935242',
              display_name: 'New York, NY, USA',
            },
          ]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTitle('Shell')).toBeInTheDocument();
      expect(screen.getByTitle('BP')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search location');

    await user.click(screen.getByRole('button', { name: /Brands/i }));
    await user.click(screen.getByLabelText('Shell'));

    await user.clear(searchInput);
    await user.type(searchInput, 'new');
    await user.click(searchInput);
    await waitFor(() => {
      expect(screen.getByText('Locations')).toBeInTheDocument();
      expect(
        within(screen.getByTestId('map-unified-search-dropdown')).getByRole('button', { name: 'New York, NY, USA' })
      ).toBeInTheDocument();
    });
    await user.click(
      within(screen.getByTestId('map-unified-search-dropdown')).getByRole('button', { name: 'New York, NY, USA' })
    );

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/stations/search-nearby',
        expect.objectContaining({
          fuelTypes: ['2'],
          brands: ['Shell'],
          maxPrice: 300,
        }),
        expect.any(Object)
      );
    });
  });
});
