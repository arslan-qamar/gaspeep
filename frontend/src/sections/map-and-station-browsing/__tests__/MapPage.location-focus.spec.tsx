import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MapPage from '../pages/MapPage';

const mockMapViewPropsSpy = jest.fn();
const mockStationDetailSheetPropsSpy = jest.fn();

jest.mock('../components/MapView', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockMapViewPropsSpy(props);
    return <div data-testid="mapview-props-mock" />;
  },
}));

jest.mock('../components/StationDetailSheet', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockStationDetailSheetPropsSpy(props);
    return null;
  },
}));

jest.mock('@/lib/api', () => ({
  apiClient: {
    post: jest.fn(),
  },
  fuelTypeApi: {
    getFuelTypes: jest.fn().mockResolvedValue({ data: [] }),
  },
  brandApi: {
    getBrands: jest.fn().mockResolvedValue({ data: [] }),
    getBrand: jest.fn(),
  },
  mapPreferencesApi: {
    getMapFilterPreferences: jest.fn().mockResolvedValue({
      data: { fuelTypes: [], brands: [], maxPrice: 400, onlyVerified: false },
    }),
    updateMapFilterPreferences: jest.fn().mockResolvedValue({ data: { message: 'ok' } }),
  },
}));

describe('MapPage location focus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as unknown as typeof fetch;

    const { apiClient } = jest.requireMock('@/lib/api');
    apiClient.post.mockResolvedValue({
      data: [
        {
          id: 's1',
          name: 'Shell Test',
          brand: 'Shell',
          address: '123 Test St',
          latitude: 40.7128,
          longitude: -74.006,
          prices: [],
        },
      ],
    });

    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success: (position: { coords: { latitude: number; longitude: number } }) => void) =>
          success({ coords: { latitude: 40.7128, longitude: -74.006 } }),
      },
      writable: true,
    });

    (global.fetch as jest.Mock).mockImplementation((url) => {
      const requestUrl = typeof url === 'string' ? url : String(url);
      if (requestUrl.includes('nominatim.openstreetmap.org/search')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                lat: '34.0522',
                lon: '-118.2437',
                display_name: 'Los Angeles, California, USA',
              },
            ]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  it('passes selected location to MapView focusLocation', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search location');
    await user.type(searchInput, 'los');

    await waitFor(() => {
      expect(screen.getByTestId('map-unified-search-dropdown')).toBeInTheDocument();
      expect(
        within(screen.getByTestId('map-unified-search-dropdown')).getByRole('button', {
          name: 'Los Angeles, California, USA',
        })
      ).toBeInTheDocument();
    });

    await user.click(
      within(screen.getByTestId('map-unified-search-dropdown')).getByRole('button', {
        name: 'Los Angeles, California, USA',
      })
    );

    await waitFor(() => {
      expect(mockMapViewPropsSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          focusLocation: expect.objectContaining({
            lat: 34.0522,
            lng: -118.2437,
          }),
        })
      );
    });

    expect(searchInput).toHaveValue('');
  });

  it('shows both Locations and Stations sections in search dropdown, including 1-character queries', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search location');
    await user.type(searchInput, 's');

    await waitFor(() => {
      expect(screen.getByTestId('map-unified-search-dropdown')).toBeInTheDocument();
    });

    const dropdown = screen.getByTestId('map-unified-search-dropdown');
    expect(within(dropdown).getByText('Locations')).toBeInTheDocument();
    expect(within(dropdown).getByText('Stations')).toBeInTheDocument();
    expect(within(dropdown).getByRole('button', { name: /Shell Test/i })).toBeInTheDocument();
  });

  it('shows all matching stations in search results without limiting the list', async () => {
    const { apiClient } = jest.requireMock('@/lib/api');
    const manyStations = Array.from({ length: 12 }, (_, index) => ({
      id: `bulk-${index + 1}`,
      name: `Bulk Station ${index + 1}`,
      brand: 'Bulk Brand',
      address: `${index + 1} Bulk St`,
      latitude: 40.7128 + index * 0.001,
      longitude: -74.006 - index * 0.001,
      prices: [],
    }));
    apiClient.post.mockResolvedValue({ data: manyStations });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search location');
    await user.type(searchInput, 'bulk');

    await waitFor(() => {
      const stationButtons = screen.getAllByRole('button', { name: /Bulk Station/i });
      expect(stationButtons).toHaveLength(12);
    });
  });

  it('pans map and highlights station marker without opening detail sheet when a station search result is clicked', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <MapPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search location');
    await user.type(searchInput, 'shell');

    const stationButton = await screen.findByRole('button', { name: /Shell Test/i });
    await user.click(stationButton);

    await waitFor(() => {
      expect(mockMapViewPropsSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          selectedStationId: 's1',
          focusLocation: expect.objectContaining({
            lat: 40.7128,
            lng: -74.006,
          }),
        })
      );
    });

    expect(searchInput).toHaveValue('shell');

    await waitFor(() => {
      expect(mockStationDetailSheetPropsSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: false,
          station: null,
        })
      );
    });
  });
});
