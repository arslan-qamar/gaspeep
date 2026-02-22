import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MapPage from '../pages/MapPage';

const mockMapViewPropsSpy = jest.fn();

jest.mock('../components/MapView', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockMapViewPropsSpy(props);
    return <div data-testid="mapview-props-mock" />;
  },
}));

jest.mock('../components/StationDetailSheet', () => ({
  __esModule: true,
  default: () => null,
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
      <MemoryRouter>
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
  });
});
