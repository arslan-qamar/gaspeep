import { useEffect, useRef, useState } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Station, FuelPrice } from '../lib/api'

interface MapProps {
  stations: Station[]
  prices?: FuelPrice[]
  center?: [number, number]
  zoom?: number
  onStationClick?: (station: Station) => void
  selectedStationId?: string
}

export function Map({
  stations,
  prices = [],
  center = [-33.8688, 151.2093], // Sydney default
  zoom = 12,
  onStationClick,
  selectedStationId,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const element = mapContainerRef.current
    const map = L.map(element).setView(center, zoom)

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map
    setIsMapReady(true)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update markers when stations or prices change
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return

    // Clear existing markers
    if (markersRef.current) {
      markersRef.current.clearLayers()
    } else {
      markersRef.current = L.layerGroup().addTo(mapRef.current)
    }

    // Create a map of station prices for quick lookup
    const stationPriceMap = new globalThis.Map<string, FuelPrice[]>()
    prices.forEach((price: FuelPrice) => {
      const existing = stationPriceMap.get(price.stationId) || []
      stationPriceMap.set(price.stationId, [...existing, price])
    })

    // Add markers for each station
    stations.forEach((station) => {
      const stationPrices = stationPriceMap.get(station.id) || []
      
      // Determine marker color based on average price
      let markerColor = '#4F46E5' // Default blue
      if (stationPrices.length > 0) {
        const avgPrice = stationPrices.reduce((sum: number, p: FuelPrice) => sum + p.price, 0) / stationPrices.length
        
        // Color code: green (low), yellow (medium), red (high)
        if (avgPrice < 1.5) {
          markerColor = '#10B981' // green
        } else if (avgPrice < 1.8) {
          markerColor = '#F59E0B' // yellow
        } else {
          markerColor = '#EF4444' // red
        }
      }

      // Custom marker icon
      const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${markerColor};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ${selectedStationId === station.id ? 'box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.5);' : ''}
          "></div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })

      const marker = L.marker([station.latitude, station.longitude], {
        icon: markerIcon,
      })

      // Build popup content
      let popupContent = `
        <div class="p-2">
          <h3 class="font-bold text-lg">${station.name}</h3>
          <p class="text-sm text-gray-600">${station.brand}</p>
          <p class="text-xs text-gray-500 mt-1">${station.address}</p>
      `

      if (stationPrices.length > 0) {
        popupContent += '<div class="mt-2 space-y-1">'
        stationPrices.forEach((price: FuelPrice) => {
          popupContent += `
            <div class="flex justify-between text-sm">
              <span>${price.fuelType?.displayName || price.fuelTypeId}</span>
              <span class="font-bold">${price.currency} ${price.price.toFixed(2)}/${price.unit}</span>
            </div>
          `
        })
        popupContent += '</div>'
      } else {
        popupContent += '<p class="text-xs text-gray-400 mt-2">No prices available</p>'
      }

      popupContent += '</div>'

      marker.bindPopup(popupContent)

      // Handle click event
      marker.on('click', () => {
        if (onStationClick) {
          onStationClick(station)
        }
      })

      markersRef.current?.addLayer(marker)
    })
  }, [stations, prices, isMapReady, selectedStationId, onStationClick])

  // Update map center when center prop changes
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setView(center, zoom)
    }
  }, [center, zoom])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  )
}
