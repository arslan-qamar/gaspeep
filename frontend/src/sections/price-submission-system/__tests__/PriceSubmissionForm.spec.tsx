import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import '@testing-library/jest-dom'

jest.mock('../../../lib/api', () => {
  return {
    apiClient: {
      get: jest.fn(),
      post: jest.fn(),
    },
    stationApi: {
      getStation: jest.fn(),
    },
  }
})

let mockVoiceParsedPayload = {
  transcript: 'E10 three seventy nine and diesel four twenty nine',
  candidates: [
    { spokenFuel: 'E10', normalizedFuelId: 'f-e10', price: 3.79, confidence: 0.96 },
    { spokenFuel: 'diesel', normalizedFuelId: 'f-diesel', price: 4.29, confidence: 0.94 },
  ],
  unmatched: [],
}

let mockPhotoParsedPayload = {
  entries: [
    { fuelType: 'E10', price: 3.95 },
    { fuelType: 'Premium 98', price: 4.11 },
    { fuelType: 'Premium 95', price: 4.01 },
  ],
  fuelType: 'E10',
  price: 3.95,
  photoUrl: 'https://example.com/price-board.jpg',
  ocrData: '{"text":"E10 3.95 Premium 98 4.11 Premium 95 4.01"}',
}

jest.mock('../VoiceInputScreen', () => {
  const React = require('react')
  return {
    VoiceInputScreen: ({ onParsed }: any) => (
      React.createElement('button', { onClick: () => onParsed(mockVoiceParsedPayload) }, 'Mock Parse Voice')
    ),
    default: ({ onParsed }: any) => (
      React.createElement('button', { onClick: () => onParsed(mockVoiceParsedPayload) }, 'Mock Parse Voice')
    ),
  }
})

jest.mock('../PhotoUploadScreen', () => {
  const React = require('react')
  return {
    PhotoUploadScreen: ({ onParsed }: any) => (
      React.createElement('button', { onClick: () => onParsed(mockPhotoParsedPayload) }, 'Mock Parse Photo')
    ),
    default: ({ onParsed }: any) => (
      React.createElement('button', { onClick: () => onParsed(mockPhotoParsedPayload) }, 'Mock Parse Photo')
    ),
  }
})

import { apiClient, stationApi } from '../../../lib/api'
import { PriceSubmissionForm } from '../PriceSubmissionForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import SubmissionConfirmation from '../SubmissionConfirmation'

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom')
  return {
    ...original,
    useNavigate: jest.fn(),
  }
})

describe('PriceSubmissionForm', () => {
  const renderForm = () =>
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={new QueryClient()}>
          <PriceSubmissionForm />
        </QueryClientProvider>
      </MemoryRouter>
    )

  beforeEach(() => {
    ;(apiClient.get as jest.Mock).mockReset()
    ;(apiClient.post as jest.Mock).mockReset()
    jest
      .spyOn(global.navigator.geolocation, 'getCurrentPosition')
      .mockImplementation((success: any) =>
        success({ coords: { latitude: -33.86, longitude: 151.2 } })
      )
  })

  it('loads nearby stations, completes 3-step submission flow, and shows confirmation dialog', async () => {
    // mock fuel types
    ;(apiClient.get as jest.Mock).mockImplementation((...args: any[]) => {
      const url = args[0] as string;
      if (url === '/fuel-types') {
        return Promise.resolve({ data: [
          { id: 'f-e10', name: 'E10', displayName: 'E10' },
          { id: 'f-91', name: 'UNLEADED_91', displayName: 'Unleaded 91' },
        ] })
      }
      return Promise.resolve({ data: [] })
    })

    ;(apiClient.post as jest.Mock).mockImplementation((url: string, body: any) => {
      if (url === '/stations/search-nearby') {
        return Promise.resolve({
          data: [{ id: 's-1', name: '7-Eleven Crows Nest', address: '85 Willoughby Rd', brand: '7-Eleven', latitude: -33.861, longitude: 151.201 }],
        })
      }
      if (url === '/price-submissions') {
        const submissions = (body.entries || []).map((entry: any, index: number) => ({
          id: `ps-${index + 1}`,
          price: entry.price,
          moderationStatus: 'pending',
          station_name: '7-Eleven Crows Nest',
          fuel_type: index === 0 ? 'E10' : 'Unleaded 91',
        }))
        return Promise.resolve({ data: { submissions, count: submissions.length } })
      }
      return Promise.resolve({ data: {} })
    })

    renderForm()

    // wait for fuel types to load
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/fuel-types'))

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/stations/search-nearby',
        expect.objectContaining({ radiusKm: 150 }),
        expect.any(Object)
      )
    )

    // Step 1: select station and continue
    fireEvent.focus(screen.getByPlaceholderText(/search station by name or address/i))
    const stationOption = await screen.findByRole('button', { name: /7-Eleven Crows Nest/i })
    fireEvent.click(stationOption)
    fireEvent.click(screen.getByRole('button', { name: /continue to price entry/i }))

    // Step 2: enter price in specific fuel type input
    const fuelInput = screen.getByLabelText(/Unleaded 91/i)
    fireEvent.change(fuelInput, { target: { value: '3.49' } })

    // click submit
    const submitBtn = screen.getByRole('button', { name: /Submit Price|Confirm & Submit|Confirm/ })
    fireEvent.click(submitBtn)

    // expect post called
    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/price-submissions',
        expect.objectContaining({
          stationId: 's-1',
          submissionMethod: 'text',
          entries: [{ fuelTypeId: 'f-91', price: 3.49 }],
        })
      )
    )

    // Step 3: confirmation dialog should render
    const thanks = await screen.findByText(/Thanks for contributing!/i)
    expect(thanks).toBeInTheDocument()
    expect(screen.getByText(/Your submission has been received/i)).toBeInTheDocument()
    expect(screen.getByText(/Station:/i)).toBeInTheDocument()
    expect(screen.getByText(/Unleaded 91/)).toBeInTheDocument()
  })

  it('shows a clear button for station search and clears the text when clicked', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({ data: [{ id: 'f-91', name: 'UNLEADED_91', displayName: 'Unleaded 91' }] })
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      data: [{ id: 's-1', name: '7-Eleven Crows Nest', address: '85 Willoughby Rd', brand: '7-Eleven', latitude: -33.861, longitude: 151.201 }],
    })

    renderForm()
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/fuel-types'))

    const searchInput = screen.getByPlaceholderText(/search station by name or address/i) as HTMLInputElement
    fireEvent.change(searchInput, { target: { value: 'Crows' } })

    const clearButton = screen.getByRole('button', { name: /clear station search/i })
    fireEvent.click(clearButton)

    expect(searchInput).toHaveValue('')
  })

  it('renders submit page wrapper with map-style glass UI classes', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({ data: [{ id: 'f-91', name: 'UNLEADED_91', displayName: 'Unleaded 91' }] })
    ;(apiClient.post as jest.Mock).mockResolvedValue({ data: [] })

    const { container } = renderForm()
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/fuel-types'))

    const glassWrapper = container.querySelector('div.rounded-xl.border.border-white\\/35')
    expect(glassWrapper).toBeInTheDocument()
    expect(glassWrapper).toHaveClass('bg-transparent')
    expect(glassWrapper).toHaveClass('backdrop-blur-md')
    expect(glassWrapper).toHaveClass('shadow-[0_10px_30px_rgba(15,23,42,0.25)]')
  })

  it('requires review before applying voice candidates and submits selected entries as voice method', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      data: [
        { id: 'f-e10', name: 'E10', displayName: 'E10' },
        { id: 'f-diesel', name: 'DIESEL', displayName: 'Diesel' },
      ],
    })
    ;(apiClient.post as jest.Mock).mockImplementation((url: string, body: any) => {
      if (url === '/stations/search-nearby') {
        return Promise.resolve({
          data: [{ id: 's-1', name: '7-Eleven Crows Nest', address: '85 Willoughby Rd', brand: '7-Eleven', latitude: -33.861, longitude: 151.201 }],
        })
      }
      if (url === '/price-submissions') {
        return Promise.resolve({
          data: {
            submissions: (body.entries || []).map((entry: any) => ({
              id: `ps-${entry.fuelTypeId}`,
              price: entry.price,
              moderationStatus: 'pending',
            })),
          },
        })
      }
      return Promise.resolve({ data: {} })
    })

    renderForm()

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/fuel-types'))
    fireEvent.focus(screen.getByPlaceholderText(/search station by name or address/i))
    const stationOption = await screen.findByRole('button', { name: /7-Eleven Crows Nest/i })
    fireEvent.click(stationOption)
    fireEvent.click(screen.getByRole('button', { name: /continue to price entry/i }))

    fireEvent.click(screen.getByTitle('Voice Entry'))
    fireEvent.click(screen.getByRole('button', { name: /mock parse voice/i }))

    expect(await screen.findByRole('heading', { name: /Confirm Detected Prices/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /apply selected/i }))

    expect(screen.getByLabelText('E10')).toHaveValue('3.79')
    expect(screen.getByLabelText('Diesel')).toHaveValue('4.29')

    fireEvent.click(screen.getByRole('button', { name: /submit price/i }))

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/price-submissions',
        expect.objectContaining({
          stationId: 's-1',
          submissionMethod: 'voice',
          entries: [
            { fuelTypeId: 'f-e10', price: 3.79 },
            { fuelTypeId: 'f-diesel', price: 4.29 },
          ],
        })
      )
    )
  })

  it('applies analyzed photo entries and submits with photo metadata', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      data: [
        { id: 'f-e10', name: 'E10', displayName: 'E10' },
        { id: 'f-u98', name: 'U98', displayName: 'U98' },
        { id: 'f-u95', name: 'U95', displayName: 'U95' },
      ],
    })
    ;(apiClient.post as jest.Mock).mockImplementation((url: string, body: any) => {
      if (url === '/stations/search-nearby') {
        return Promise.resolve({
          data: [{ id: 's-1', name: '7-Eleven Crows Nest', address: '85 Willoughby Rd', brand: '7-Eleven', latitude: -33.861, longitude: 151.201 }],
        })
      }
      if (url === '/price-submissions') {
        return Promise.resolve({
          data: {
            submissions: (body.entries || []).map((entry: any) => ({
              id: `ps-${entry.fuelTypeId}`,
              price: entry.price,
              moderationStatus: 'pending',
            })),
          },
        })
      }
      return Promise.resolve({ data: {} })
    })

    renderForm()

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/fuel-types'))
    fireEvent.focus(screen.getByPlaceholderText(/search station by name or address/i))
    const stationOption = await screen.findByRole('button', { name: /7-Eleven Crows Nest/i })
    fireEvent.click(stationOption)
    fireEvent.click(screen.getByRole('button', { name: /continue to price entry/i }))

    fireEvent.click(screen.getByTitle('Camera / Photo Entry'))
    fireEvent.click(screen.getByRole('button', { name: /mock parse photo/i }))

    expect(screen.getByLabelText('E10')).toHaveValue('3.95')
    expect(screen.getByLabelText('U98')).toHaveValue('4.11')
    expect(screen.getByLabelText('U95')).toHaveValue('4.01')
    fireEvent.click(screen.getByRole('button', { name: /submit price/i }))

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/price-submissions',
        expect.objectContaining({
          stationId: 's-1',
          submissionMethod: 'photo',
          photoUrl: 'https://example.com/price-board.jpg',
          ocrData: '{"text":"E10 3.95 Premium 98 4.11 Premium 95 4.01"}',
          entries: expect.arrayContaining([
            { fuelTypeId: 'f-e10', price: 3.95 },
            { fuelTypeId: 'f-u95', price: 4.01 },
            { fuelTypeId: 'f-u98', price: 4.11 },
          ]),
        })
      )
    )
  })

  it('starts on step 2 when arriving with preselected station from map', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      data: [{ id: 'f-91', name: 'UNLEADED_91', displayName: 'Unleaded 91' }],
    })
    ;(apiClient.post as jest.Mock).mockResolvedValue({ data: [] })
    ;(stationApi.getStation as jest.Mock).mockResolvedValue({
      data: {
        id: 's-99',
        name: 'Map Selected Station',
        address: '123 Map Rd',
        latitude: -33.86,
        longitude: 151.2,
      },
    })

    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/submit', state: { stationId: 's-99', fuelTypeId: 'f-91' } },
        ]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <QueryClientProvider client={new QueryClient()}>
          <PriceSubmissionForm />
        </QueryClientProvider>
      </MemoryRouter>
    )

    expect(await screen.findByText(/Step 2 of 3: Submit Price/i)).toBeInTheDocument()
    expect(await screen.findByText(/Map Selected Station/i)).toBeInTheDocument()
  })
})

describe('SubmissionConfirmation', () => {
  it('renders resolved names and status', () => {
    const submission = { station_name: 'Demo Station', fuel_type: 'Diesel', price: 4.2, moderationStatus: 'published' }
    render(<SubmissionConfirmation submission={submission} onDone={() => {}} />)
    expect(screen.getByText('Demo Station')).toBeInTheDocument()
    expect(screen.getByText('Diesel')).toBeInTheDocument()
    expect(screen.getByText(/4\.2/)).toBeInTheDocument()
    expect(screen.getByText(/published/i)).toBeInTheDocument()
  })

  it('calls onDone and navigates to /map when Done clicked', async () => {
    const submission = { station_name: 'Demo Station', fuel_type: 'Diesel', price: 4.2, moderationStatus: 'pending' }
    const onDone = jest.fn()

    const navigateMock = jest.fn()
    const { useNavigate } = require('react-router-dom') as { useNavigate: jest.Mock }
    useNavigate.mockReturnValue(navigateMock)

    render(<SubmissionConfirmation submission={submission} onDone={onDone} />)

    const doneBtn = screen.getByRole('button', { name: /done/i })
    fireEvent.click(doneBtn)

    expect(onDone).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith('/map')
  })
})
