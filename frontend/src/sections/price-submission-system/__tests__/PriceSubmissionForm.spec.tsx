import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import '@testing-library/jest-dom'

jest.mock('../../../lib/api', () => {
  return {
    apiClient: {
      get: jest.fn(),
      post: jest.fn(),
    },
  }
})

import { apiClient } from '../../../lib/api'
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
        return Promise.resolve({ data: Object.assign({ id: 'ps-1', price: body.price, moderationStatus: 'pending' }, { station_name: '7-Eleven Crows Nest', fuel_type: 'Unleaded 91' }) })
      }
      return Promise.resolve({ data: {} })
    })

    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <PriceSubmissionForm />
        </QueryClientProvider>
      </MemoryRouter>
    )

    // wait for fuel types to load
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/fuel-types'))

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/stations/search-nearby',
        expect.any(Object),
        expect.any(Object)
      )
    )

    // Step 1: select station and continue
    const stationOption = await screen.findByRole('button', { name: /7-Eleven Crows Nest/i })
    fireEvent.click(stationOption)
    fireEvent.click(screen.getByRole('button', { name: /continue to price entry/i }))

    // Step 2: select fuel type and enter price
    // select fuel type
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'f-91' } })

    // enter price
    const price = screen.getByPlaceholderText(/3.79/i)
    fireEvent.change(price, { target: { value: '3.49' } })

    // click submit
    const submitBtn = screen.getByRole('button', { name: /Submit Price|Confirm & Submit|Confirm/ })
    fireEvent.click(submitBtn)

    // expect post called
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/price-submissions', expect.objectContaining({ stationId: 's-1', fuelTypeId: 'f-91' })))

    // Step 3: confirmation dialog should render
    const thanks = await screen.findByText(/Thanks for contributing!/i)
    expect(thanks).toBeInTheDocument()
    expect(screen.getByText(/Your submission has been received/i)).toBeInTheDocument()
    expect(screen.getByText(/Station:/i)).toBeInTheDocument()
    expect(screen.getByText(/Unleaded 91/)).toBeInTheDocument()
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
