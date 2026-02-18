export type FuelTypeLike = {
  id: string
  name: string
  displayName?: string
}

export type VoiceCandidate = {
  spokenFuel: string
  normalizedFuelId?: string
  price: number
  confidence: number
}

export type VoiceParseResult = {
  transcript: string
  candidates: VoiceCandidate[]
  unmatched: string[]
}

type FuelMatch = {
  fuelId?: string
  confidence: number
  spokenFuel: string
}

const MIN_PRICE = 0.5
const MAX_PRICE = 10

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  oh: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
}

const PRICE_WORDS = new Set([
  ...Object.keys(NUMBER_WORDS),
  'point',
  'dollar',
  'dollars',
  'cent',
  'cents',
])

const STATIC_ALIASES: Record<string, string[]> = {
  e10: ['e10', 'e ten', 'eden', 'ether'],
  u91: ['u91', '91', 'regular', 'unleaded', 'unleaded 91'],
  p95: ['u95', '95', 'premium 95'],
  p98: ['u98', '98', 'premium 98'],
  diesel: ['diesel', 'd'],
}

const normalizeText = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const fuelCanonical = (fuelType: FuelTypeLike): string | undefined => {
  const text = normalizeText(`${fuelType.id} ${fuelType.name} ${fuelType.displayName || ''}`)
  if (text.includes('e10')) return 'e10'
  if (text.includes('diesel')) return 'diesel'
  if (text.includes('98')) return 'p98'
  if (text.includes('95')) return 'p95'
  if (text.includes('91') || text.includes('unleaded')) return 'u91'
  return undefined
}

const parseTwoWordNumber = (tokens: string[]): number | null => {
  if (tokens.length === 0) return null
  if (tokens.length === 1) {
    const value = NUMBER_WORDS[tokens[0]]
    return value === undefined ? null : value
  }

  const a = NUMBER_WORDS[tokens[0]]
  const b = NUMBER_WORDS[tokens[1]]
  if (a === undefined || b === undefined) return null

  if (a >= 20 && a % 10 === 0 && b < 10) return a + b
  if (a < 10 && b < 10) return a * 10 + b
  return null
}

export const parseSpokenPrice = (input: string): number | null => {
  const normalized = normalizeText(input)
  if (!normalized) return null

  const numeric = normalized.match(/\b\d+(?:\.\d{1,2})?\b/)?.[0]
  if (numeric) {
    const parsed = parseFloat(numeric)
    if (parsed >= MIN_PRICE && parsed <= MAX_PRICE) return parsed
  }

  const compact = normalized.match(/\b\d{3}\b/)?.[0]
  if (compact) {
    const parsed = parseFloat(compact) / 100
    if (parsed >= MIN_PRICE && parsed <= MAX_PRICE) return parsed
  }

  const tokens = normalized
    .split(' ')
    .filter((token) => token)
    .filter((token) => PRICE_WORDS.has(token))
    .filter((token) => token !== 'dollar' && token !== 'dollars' && token !== 'cent' && token !== 'cents')

  if (tokens.length === 0) return null

  const pointIndex = tokens.indexOf('point')
  if (pointIndex > 0) {
    const dollars = parseTwoWordNumber(tokens.slice(0, pointIndex))
    const decimals = tokens.slice(pointIndex + 1)
    if (dollars !== null && decimals.length > 0 && decimals.every((d) => NUMBER_WORDS[d] !== undefined && NUMBER_WORDS[d] < 10)) {
      const parsed = parseFloat(`${dollars}.${decimals.map((d) => NUMBER_WORDS[d]).join('')}`)
      if (parsed >= MIN_PRICE && parsed <= MAX_PRICE) return parsed
    }
  }

  if (tokens.length >= 2) {
    const dollars = NUMBER_WORDS[tokens[0]]
    const cents = parseTwoWordNumber(tokens.slice(1, 3))
    if (dollars !== undefined && dollars < 10 && cents !== null) {
      const parsed = dollars + cents / 100
      if (parsed >= MIN_PRICE && parsed <= MAX_PRICE) return parsed
    }
  }

  const whole = parseTwoWordNumber(tokens)
  if (whole !== null && whole >= MIN_PRICE && whole <= MAX_PRICE) return whole

  return null
}

export const normalizeFuelToken = (token: string, fuelTypes: FuelTypeLike[]): FuelMatch => {
  const normalized = normalizeText(token)
  if (!normalized) return { spokenFuel: token, confidence: 0 }

  const canonicalToFuelId = new Map<string, string>()
  fuelTypes.forEach((fuelType) => {
    const canonical = fuelCanonical(fuelType)
    if (canonical) canonicalToFuelId.set(canonical, fuelType.id)
  })

  let best: FuelMatch = { spokenFuel: token, confidence: 0 }

  Object.entries(STATIC_ALIASES).forEach(([canonical, aliases]) => {
    const fuelId = canonicalToFuelId.get(canonical)
    aliases.forEach((alias) => {
      const normalizedAlias = normalizeText(alias)
      if (!normalizedAlias) return

      if (normalized === normalizedAlias) {
        best = { spokenFuel: token, fuelId, confidence: 0.98 }
        return
      }

      if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
        if (best.confidence < 0.9) {
          best = { spokenFuel: token, fuelId, confidence: 0.9 }
        }
      }
    })
  })

  fuelTypes.forEach((fuelType) => {
    const candidates = [fuelType.id, fuelType.name, fuelType.displayName || ''].map(normalizeText).filter(Boolean)
    candidates.forEach((candidate) => {
      if (normalized === candidate && best.confidence < 0.99) {
        best = { spokenFuel: token, fuelId: fuelType.id, confidence: 0.99 }
      }
    })
  })

  if (best.confidence < 0.75 || !best.fuelId) {
    return { spokenFuel: token, confidence: best.confidence }
  }

  return best
}

const expandCompactToken = (token: string): string[] => {
  const normalized = normalizeText(token).replace(/\s+/g, '')
  const compact = normalized.match(/^(u91|u95|u98|e10|diesel)(\d{1,2}(?:\.\d{1,2})?)$/)
  if (!compact) return [normalizeText(token)]
  return [compact[1], compact[2]]
}

const dedupe = (items: VoiceCandidate[]): VoiceCandidate[] => {
  const seen = new Set<string>()
  const output: VoiceCandidate[] = []
  items.forEach((candidate) => {
    const key = `${candidate.normalizedFuelId || candidate.spokenFuel}:${candidate.price.toFixed(2)}`
    if (seen.has(key)) return
    seen.add(key)
    output.push(candidate)
  })
  return output
}

const isPriceToken = (token: string): boolean => {
  if (!token) return false
  if (/^\d+(?:\.\d+)?$/.test(token)) return true
  return PRICE_WORDS.has(token)
}

const parsePriceAt = (
  tokens: string[],
  index: number
): { price: number; consumed: number } | null => {
  for (let length = 3; length >= 1; length -= 1) {
    const chunk = tokens.slice(index, index + length)
    if (chunk.length === 0) continue
    if (!chunk.every((token) => isPriceToken(token))) continue
    const parsed = parseSpokenPrice(chunk.join(' '))
    if (parsed !== null) {
      return { price: parsed, consumed: length }
    }
  }
  return null
}

export const parseVoiceTranscript = (
  transcript: string,
  fuelTypes: FuelTypeLike[]
): VoiceParseResult => {
  const normalized = normalizeText(transcript)
  if (!normalized) {
    return { transcript: '', candidates: [], unmatched: [] }
  }

  const tokens = normalized.split(' ').filter(Boolean).flatMap(expandCompactToken).filter(Boolean)
  const candidates: VoiceCandidate[] = []
  const unmatchedTokens: string[] = []

  let expected: 'fuel' | 'price' = 'fuel'
  let pendingFuel: FuelMatch | null = null

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]

    if (expected === 'fuel') {
      const fuelMatch = normalizeFuelToken(token, fuelTypes)
      if (fuelMatch.confidence >= 0.75 && fuelMatch.fuelId) {
        pendingFuel = fuelMatch
        expected = 'price'
      } else {
        unmatchedTokens.push(token)
      }
      continue
    }

    const parsedPrice = parsePriceAt(tokens, i)
    if (parsedPrice && pendingFuel?.fuelId) {
      candidates.push({
        spokenFuel: pendingFuel.spokenFuel,
        normalizedFuelId: pendingFuel.fuelId,
        price: parsedPrice.price,
        confidence: Number(Math.min(0.99, pendingFuel.confidence).toFixed(2)),
      })
      i += parsedPrice.consumed - 1

      expected = 'fuel'
      pendingFuel = null
      continue
    }

    unmatchedTokens.push(token)
  }

  const dedupedCandidates = dedupe(candidates)
  const unmatched =
    dedupedCandidates.length === 0 && unmatchedTokens.length > 0
      ? [normalized]
      : unmatchedTokens

  return {
    transcript: transcript.trim(),
    candidates: dedupedCandidates,
    unmatched,
  }
}
