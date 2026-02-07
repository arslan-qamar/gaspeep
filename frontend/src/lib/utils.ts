/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate search radius based on zoom level
 * Higher zoom = smaller area = smaller radius
 * @param zoom Map zoom level (typically 0-20)
 * @returns Radius in kilometers
 */
export function getRadiusFromZoom(zoom: number): number {
  // Zoom levels and approximate radius mapping:
  // zoom 20+ (street level) = 0.5km
  // zoom 15-19 (neighborhood) = 2km
  // zoom 12-14 (city) = 5km
  // zoom 9-11 (metro area) = 10km
  // zoom 6-8 (region) = 25km
  // zoom <6 (country/continent) = 50km
  
  if (zoom >= 20) return 0.5;
  if (zoom >= 15) return 2;
  if (zoom >= 12) return 5;
  if (zoom >= 9) return 10;
  if (zoom >= 6) return 25;
  return 50;
}
