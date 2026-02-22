import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import MapPage from '../pages/MapPage'

jest.mock('@/lib/api', () => ({
  apiClient: {
    post: jest.fn(),
  },
  fuelTypeApi: {
    getFuelTypes: jest.fn(),
  },
  brandApi: {
    getBrands: jest.fn(),
  },
  mapPreferencesApi: {
    getMapFilterPreferences: jest.fn(),
    updateMapFilterPreferences: jest.fn(),
  },
}))

jest.mock('../components/MapView', () => ({
  __esModule: true,
  default: ({ onStationSelect }: { onStationSelect: (station: any) => void }) => (
    <div>
      <div data-testid="mock-map-view">Map</div>
      <button
        onClick={() =>
          onStationSelect({
            id: 'station-1',
            name: 'Demo Station',
            brand: 'Shell',
            address: '123 Demo St',
            latitude: 40.7128,
            longitude: -74.006,
            prices: [],
          })
        }
      >
        Select Station
      </button>
    </div>
  ),
}))

jest.mock('../components/StationDetailSheet', () => ({
  __esModule: true,
  default: ({
    isOpen,
    onSubmitPrice,
  }: {
    isOpen: boolean
    onSubmitPrice: (stationId: string, fuelTypeId?: string) => void
  }) =>
    isOpen ? <button onClick={() => onSubmitPrice('station-1', 'fuel-1')}>Submit For Station</button> : null,
}))

jest.mock('../../price-submission-system/PriceSubmissionForm', () => ({
  __esModule: true,
  PriceSubmissionForm: () => <div data-testid="submit-overlay-form">Submit Overlay Form</div>,
}))

const mockGeolocation = {
  getCurrentPosition: jest.fn(),
}

Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
})

const LocationSpy = () => {
  const location = useLocation()
  return (
    <div data-testid="location-spy">
      {location.pathname}
      {location.search}
    </div>
  )
}

const renderMapRoute = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={new QueryClient()}>
        <Routes>
          <Route
            path="/map"
            element={
              <>
                <MapPage />
                <LocationSpy />
              </>
            }
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )

describe('MapPage submit overlay mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { apiClient, fuelTypeApi, brandApi, mapPreferencesApi } = jest.requireMock('@/lib/api')
    apiClient.post.mockResolvedValue({ data: [] })
    fuelTypeApi.getFuelTypes.mockResolvedValue({ data: [] })
    brandApi.getBrands.mockResolvedValue({ data: [] })
    mapPreferencesApi.getMapFilterPreferences.mockResolvedValue({
      data: { fuelTypes: [], brands: [], maxPrice: 400, onlyVerified: false },
    })
    mapPreferencesApi.updateMapFilterPreferences.mockResolvedValue({ data: { message: 'ok' } })

    mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      })
    })
  })

  it('renders submit form overlay when query param overlay=submit is present', () => {
    renderMapRoute('/map?overlay=submit')

    expect(screen.getByRole('dialog', { name: /submit fuel price/i })).toBeInTheDocument()
    expect(screen.getByTestId('submit-overlay-form')).toBeInTheDocument()
  })

  it('moves focus to close button when submit overlay opens', async () => {
    renderMapRoute('/map?overlay=submit')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close submit overlay/i })).toHaveFocus()
    })
  })

  it('does not render submit overlay by default', () => {
    renderMapRoute('/map')

    expect(screen.queryByTestId('submit-overlay-form')).not.toBeInTheDocument()
  })

  it('opens overlay query param when submit is launched from station sheet action', async () => {
    const user = userEvent.setup()
    renderMapRoute('/map')

    await user.click(screen.getByRole('button', { name: 'Select Station' }))
    await user.click(screen.getByRole('button', { name: 'Submit For Station' }))

    expect(screen.getByTestId('location-spy')).toHaveTextContent('/map?overlay=submit')
  })

  it('closes submit overlay and returns to map-only query state', async () => {
    const user = userEvent.setup()
    renderMapRoute('/map?overlay=submit')

    await user.click(screen.getByRole('button', { name: /close submit overlay/i }))

    expect(screen.queryByTestId('submit-overlay-form')).not.toBeInTheDocument()
    expect(screen.getByTestId('location-spy')).toHaveTextContent('/map')
  })

  it('closes submit overlay when escape key is pressed', async () => {
    const user = userEvent.setup()
    renderMapRoute('/map?overlay=submit')

    await user.keyboard('{Escape}')

    expect(screen.queryByTestId('submit-overlay-form')).not.toBeInTheDocument()
    expect(screen.getByTestId('location-spy')).toHaveTextContent('/map')
  })
})
