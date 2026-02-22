import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PhotoUploadScreen } from '../PhotoUploadScreen'
import { apiClient } from '../../../lib/api'

jest.mock('../../../lib/api', () => {
  return {
    apiClient: {
      post: jest.fn(),
    },
  }
})

describe('PhotoUploadScreen', () => {
  const createObjectURLMock = jest.fn(() => 'blob:preview-url')
  const revokeObjectURLMock = jest.fn()

  beforeEach(() => {
    ;(apiClient.post as jest.Mock).mockReset()
    createObjectURLMock.mockClear()
    revokeObjectURLMock.mockClear()

    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectURLMock,
      writable: true,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revokeObjectURLMock,
      writable: true,
    })
  })

  it('uploads a file, analyzes it, and emits parsed entries', async () => {
    const onParsed = jest.fn()
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        entries: [{ fuelType: 'E10', price: 395 }],
        photoUrl: 'https://example.com/photo.jpg',
        ocrData: 'E10 395',
      },
    })

    const { container } = render(<PhotoUploadScreen onParsed={onParsed} onCancel={jest.fn()} isModal={true} />)

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['photo-bytes'], 'price.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(await screen.findByAltText('Price board')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /analyze photo/i }))

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1))
    expect(apiClient.post).toHaveBeenCalledWith(
      '/price-submissions/analyze-photo',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
    expect(onParsed).toHaveBeenCalledWith({
      entries: [{ fuelType: 'E10', price: 395 }],
      fuelType: 'E10',
      price: 395,
      photoUrl: 'https://example.com/photo.jpg',
      ocrData: 'E10 395',
    })
  })

  it('falls back to top-level response fields when entries are missing', async () => {
    const onParsed = jest.fn()
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        fuelType: 'Diesel',
        price: 419,
        confidence: 0.82,
      },
    })

    const { container } = render(<PhotoUploadScreen onParsed={onParsed} onCancel={jest.fn()} isModal={true} />)

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, {
      target: { files: [new File(['photo-bytes'], 'price.jpg', { type: 'image/jpeg' })] },
    })

    fireEvent.click(screen.getByRole('button', { name: /analyze photo/i }))

    await waitFor(() => expect(onParsed).toHaveBeenCalledTimes(1))
    expect(onParsed).toHaveBeenCalledWith({
      entries: [{ fuelType: 'Diesel', price: 419 }],
      fuelType: 'Diesel',
      price: 419,
      photoUrl: undefined,
      ocrData: JSON.stringify({
        fuelType: 'Diesel',
        price: 419,
        confidence: 0.82,
      }),
    })
  })

  it('shows an API error message when analysis fails', async () => {
    ;(apiClient.post as jest.Mock).mockRejectedValue({
      response: {
        data: {
          error: 'Could not detect readable fuel prices',
        },
      },
    })

    const { container } = render(<PhotoUploadScreen onParsed={jest.fn()} onCancel={jest.fn()} isModal={true} />)

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, {
      target: { files: [new File(['photo-bytes'], 'price.jpg', { type: 'image/jpeg' })] },
    })

    fireEvent.click(screen.getByRole('button', { name: /analyze photo/i }))

    expect(await screen.findByText('Could not detect readable fuel prices')).toBeInTheDocument()
  })

  it('clears selected preview when retake is clicked', async () => {
    const { container } = render(<PhotoUploadScreen onParsed={jest.fn()} onCancel={jest.fn()} isModal={true} />)

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, {
      target: { files: [new File(['photo-bytes'], 'price.jpg', { type: 'image/jpeg' })] },
    })

    expect(await screen.findByAltText('Price board')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /retake/i }))

    await waitFor(() => expect(screen.queryByAltText('Price board')).not.toBeInTheDocument())
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:preview-url')
  })
})
