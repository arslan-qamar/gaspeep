import { fireEvent, render, screen } from '@testing-library/react'
import { EntryMethodModal } from '../components/EntryMethodModal'
import type { VoiceParseResult } from '../voicePriceParser'
import type { VoiceReviewEntry } from '../PriceSubmissionForm.types'

jest.mock('../VoiceInputScreen', () => {
  const React = require('react')
  return {
    VoiceInputScreen: ({ onParsed, onCancel, isModal, fuelTypes }: any) =>
      React.createElement(
        'div',
        null,
        React.createElement('p', null, `voice-modal:${String(isModal)}`),
        React.createElement('p', null, `fuel-count:${fuelTypes.length}`),
        React.createElement('button', { onClick: () => onParsed({ transcript: 'mock transcript', candidates: [], unmatched: [] }) }, 'Mock Voice Parsed'),
        React.createElement('button', { onClick: onCancel }, 'Mock Voice Cancel')
      ),
  }
})

jest.mock('../PhotoUploadScreen', () => {
  const React = require('react')
  return {
    PhotoUploadScreen: ({ onParsed, onCancel, isModal }: any) =>
      React.createElement(
        'div',
        null,
        React.createElement('p', null, `photo-modal:${String(isModal)}`),
        React.createElement('button', { onClick: () => onParsed({ entries: [], fuelType: 'E10', price: 3.99 }) }, 'Mock Photo Parsed'),
        React.createElement('button', { onClick: onCancel }, 'Mock Photo Cancel')
      ),
  }
})

const voiceParseResult: VoiceParseResult = {
  transcript: 'diesel two twenty, e10 one ninety, u98 three ten',
  candidates: [],
  unmatched: [],
}

const voiceReviewEntries: VoiceReviewEntry[] = [
  {
    id: 'entry-1',
    selected: true,
    spokenFuel: 'Diesel',
    fuelTypeId: 'diesel',
    price: '2.20',
    confidence: 0.95,
  },
  {
    id: 'entry-2',
    selected: true,
    spokenFuel: 'E10',
    fuelTypeId: 'e10',
    price: '1.90',
    confidence: 0.85,
  },
  {
    id: 'entry-3',
    selected: false,
    spokenFuel: 'U98',
    fuelTypeId: 'u98',
    price: '3.10',
    confidence: 0.7,
  },
]

function renderModal(overrides: Partial<React.ComponentProps<typeof EntryMethodModal>> = {}) {
  const setVoiceReviewEntries = jest.fn()
  const props: React.ComponentProps<typeof EntryMethodModal> = {
    showModal: true,
    method: 'voice',
    voiceParseResult: null,
    voiceReviewEntries,
    setVoiceReviewEntries,
    voiceReviewError: null,
    fuelTypesList: [
      { id: 'diesel', name: 'Diesel', displayName: 'Diesel' },
      { id: 'e10', name: 'E10', displayName: 'E10' },
      { id: 'u98', name: 'U98', displayName: 'U98' },
    ],
    applyVoiceSelections: jest.fn(),
    resetVoiceFlow: jest.fn(),
    onClose: jest.fn(),
    onVoiceParsed: jest.fn(),
    onPhotoParsed: jest.fn(),
    ...overrides,
  }

  render(<EntryMethodModal {...props} />)
  return { props, setVoiceReviewEntries }
}

describe('EntryMethodModal', () => {
  it('renders nothing when modal is hidden', () => {
    renderModal({ showModal: false })

    expect(screen.queryByRole('heading', { name: /voice entry/i })).not.toBeInTheDocument()
  })

  it('renders voice input screen when no parsed voice data exists', () => {
    const { props } = renderModal({ method: 'voice', voiceParseResult: null })

    expect(screen.getByRole('heading', { name: /voice entry/i })).toBeInTheDocument()
    expect(screen.getByText('voice-modal:true')).toBeInTheDocument()
    expect(screen.getByText('fuel-count:3')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mock Voice Parsed' }))
    expect(props.onVoiceParsed).toHaveBeenCalledWith({
      transcript: 'mock transcript',
      candidates: [],
      unmatched: [],
    })

    fireEvent.click(screen.getByRole('button', { name: 'Mock Voice Cancel' }))
    expect(props.onClose).toHaveBeenCalled()
  })

  it('renders photo upload screen in photo mode', () => {
    const { props } = renderModal({ method: 'photo' })

    expect(screen.getByRole('heading', { name: /camera \/ photo entry/i })).toBeInTheDocument()
    expect(screen.getByText('photo-modal:true')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mock Photo Parsed' }))
    expect(props.onPhotoParsed).toHaveBeenCalledWith({ entries: [], fuelType: 'E10', price: 3.99 })

    fireEvent.click(screen.getByRole('button', { name: 'Mock Photo Cancel' }))
    expect(props.onClose).toHaveBeenCalled()
  })

  it('renders parsed voice review UI and allows editing entries', () => {
    const { props, setVoiceReviewEntries } = renderModal({
      method: 'voice',
      voiceParseResult,
      voiceReviewError: 'Pick at least one entry',
    })

    expect(screen.getByRole('heading', { name: /confirm detected prices/i })).toBeInTheDocument()
    expect(screen.getByText(/diesel two twenty, e10 one ninety, u98 three ten/i)).toBeInTheDocument()

    expect(screen.getByText('High confidence')).toBeInTheDocument()
    expect(screen.getByText('Medium confidence')).toBeInTheDocument()
    expect(screen.getByText('Low confidence')).toBeInTheDocument()
    expect(screen.getByText('Pick at least one entry')).toBeInTheDocument()

    fireEvent.click(screen.getAllByLabelText('Apply this entry')[0])
    const toggleUpdater = setVoiceReviewEntries.mock.calls[0][0]
    const toggled = toggleUpdater(voiceReviewEntries)
    expect(toggled[0].selected).toBe(false)
    expect(toggled[1].selected).toBe(true)

    fireEvent.change(screen.getByLabelText('Fuel type for Diesel'), { target: { value: 'u98' } })
    const fuelUpdater = setVoiceReviewEntries.mock.calls[1][0]
    const withFuelUpdate = fuelUpdater(voiceReviewEntries)
    expect(withFuelUpdate[0].fuelTypeId).toBe('u98')

    fireEvent.change(screen.getByLabelText('Price for Diesel'), { target: { value: '2.39' } })
    const priceUpdater = setVoiceReviewEntries.mock.calls[2][0]
    const withPriceUpdate = priceUpdater(voiceReviewEntries)
    expect(withPriceUpdate[0].price).toBe('2.39')

    fireEvent.click(screen.getByRole('button', { name: /apply selected/i }))
    expect(props.applyVoiceSelections).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /record again/i }))
    expect(props.resetVoiceFlow).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(props.onClose).toHaveBeenCalled()
  })

  it('closes modal using header close button', () => {
    const { props } = renderModal({ method: 'photo' })

    fireEvent.click(screen.getByRole('button', { name: '✕' }))

    expect(props.onClose).toHaveBeenCalled()
  })
})
