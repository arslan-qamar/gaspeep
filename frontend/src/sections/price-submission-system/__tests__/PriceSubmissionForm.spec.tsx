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
  })

  it('loads fuel types, autocompletes station, submits and shows confirmation', async () => {
    // mock fuel types
    ;(apiClient.get as jest.Mock).mockImplementation((...args: any[]) => {
      const url = args[0] as string;
      // const opts = args[1];
      if (url === '/fuel-types') {
        return Promise.resolve({ data: [
          { id: 'f-e10', name: 'E10', displayName: 'E10' },
          { id: 'f-91', name: 'UNLEADED_91', displayName: 'Unleaded 91' },
        ] })
      }
      if (url === '/stations/search') {
        return Promise.resolve({ data: [ { id: 's-1', name: '7-Eleven Crows Nest', address: '85 Willoughby Rd' } ] })
      }
      return Promise.resolve({ data: [] })
    })

    ;(apiClient.post as jest.Mock).mockImplementation((url: string, body: any) => {
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

    // type station query
    const station = screen.getByRole('textbox', { name: /station/i })
    fireEvent.change(station, { target: { value: '7-Eleven' } })

    // wait for suggestions
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/stations/search', expect.any(Object)))

    // click suggestion item (rendered as listitem)
    const suggestion = await screen.findByText('7-Eleven Crows Nest')
    fireEvent.mouseDown(suggestion)

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

    // confirmation should render via component state
    const thanks = await screen.findByText(/Thanks for contributing!/i)
    expect(thanks).toBeInTheDocument()
    expect(screen.getByText(/7-Eleven Crows Nest/)).toBeInTheDocument()
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
