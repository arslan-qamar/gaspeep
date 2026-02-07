export interface Station {
  id: string;
  name: string;
  brand?: string;
  address: string;
  latitude: number;
  longitude: number;
  operatingHours?: string;
  amenities?: string[];
  lastVerifiedAt?: string;
  prices: FuelPrice[];
}

export interface FuelPrice {
  fuelTypeId: string;
  fuelTypeName: string;
  price: number;
  currency: string;
  lastUpdated: string;
  verified: boolean;
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}
