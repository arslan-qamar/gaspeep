export type Station = {
  id: string
  name: string
  address?: string
  brand?: string
  distance?: number
  latitude?: number
  longitude?: number
}

export type FuelType = {
  id: string
  name: string
  displayName?: string
}

export type SubmissionStep = 'station' | 'submit' | 'confirm'

export type FuelSubmissionEntry = {
  fuelTypeId: string
  fuelTypeName: string
  price: number
}

export type VoiceReviewEntry = {
  id: string
  selected: boolean
  spokenFuel: string
  fuelTypeId: string
  price: string
  confidence: number
}

export type ConfirmedSubmission = {
  station_name?: string
  stationName?: string
  fuel_type?: string
  fuelTypeName?: string
  price?: number | string
  submittedEntries?: FuelSubmissionEntry[]
}

export type StepMeta = {
  number: number
  label: string
}

export type UserLocation = {
  lat: number
  lng: number
}

export type MapViewport = {
  latitude: number
  longitude: number
  zoom: number
}
