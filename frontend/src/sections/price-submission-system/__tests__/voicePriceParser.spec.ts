import {
  normalizeFuelToken,
  parseSpokenPrice,
  parseVoiceTranscript,
  type FuelTypeLike,
} from '../voicePriceParser'

const fuelTypes: FuelTypeLike[] = [
  { id: 'f-e10', name: 'E10', displayName: 'E10' },
  { id: 'f-91', name: 'UNLEADED_91', displayName: 'Unleaded 91' },
  { id: 'f-95', name: 'PREMIUM_95', displayName: 'Premium 95' },
  { id: 'f-98', name: 'PREMIUM_98', displayName: 'Premium 98' },
  { id: 'f-diesel', name: 'DIESEL', displayName: 'Diesel' },
]

describe('voicePriceParser', () => {
  it('maps common E10 homophones to E10', () => {
    const etherMatch = normalizeFuelToken('ether', fuelTypes)
    const edenMatch = normalizeFuelToken('eden', fuelTypes)

    expect(etherMatch.fuelId).toBe('f-e10')
    expect(etherMatch.confidence).toBeGreaterThanOrEqual(0.75)
    expect(edenMatch.fuelId).toBe('f-e10')
    expect(edenMatch.confidence).toBeGreaterThanOrEqual(0.75)
  })

  it('parses spoken prices with and without decimals', () => {
    expect(parseSpokenPrice('three seventy nine')).toBe(379)
    expect(parseSpokenPrice('three point seven nine')).toBe(379)
    expect(parseSpokenPrice('4.29')).toBe(429)
  })

  it('extracts multiple fuel-price pairs from one transcript', () => {
    const parsed = parseVoiceTranscript('E10 three seventy nine and diesel four twenty nine', fuelTypes)

    expect(parsed.candidates).toHaveLength(2)
    expect(parsed.candidates[0]).toEqual(
      expect.objectContaining({
        normalizedFuelId: 'f-e10',
        price: 379,
      })
    )
    expect(parsed.candidates[1]).toEqual(
      expect.objectContaining({
        normalizedFuelId: 'f-diesel',
        price: 429,
      })
    )
  })

  it('handles fuel-number names without treating them as price', () => {
    const parsed = parseVoiceTranscript('91 is 3.59', fuelTypes)

    expect(parsed.candidates).toHaveLength(1)
    expect(parsed.candidates[0]).toEqual(
      expect.objectContaining({
        normalizedFuelId: 'f-91',
        price: 359,
      })
    )
  })

  it('keeps unknown fragments in unmatched', () => {
    const parsed = parseVoiceTranscript('rocket fuel seven seventy seven', fuelTypes)

    expect(parsed.candidates).toHaveLength(0)
    expect(parsed.unmatched).toHaveLength(1)
  })

  it('extracts repeated pairs from a noisy continuous transcript', () => {
    const parsed = parseVoiceTranscript(
      'u98 $1 u956 u95 $6 E10 $3 diesel $4 u917 u91 7 dollars',
      fuelTypes
    )

    expect(parsed.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ normalizedFuelId: 'f-e10', price: 300 }),
        expect.objectContaining({ normalizedFuelId: 'f-diesel', price: 400 }),
        expect.objectContaining({ normalizedFuelId: 'f-91', price: 700 }),
        expect.objectContaining({ normalizedFuelId: 'f-95', price: 600 }),
      ])
    )
    expect(parsed.candidates.length).toBeGreaterThanOrEqual(4)
  })
})
