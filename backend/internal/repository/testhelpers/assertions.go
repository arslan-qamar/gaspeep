package testhelpers

import (
	"math"
	"testing"

	"gaspeep/backend/internal/models"
	"github.com/stretchr/testify/assert"
)

// AssertDistanceWithin checks if two geographic points are within a specified distance
func AssertDistanceWithin(t *testing.T, lat1, lon1, lat2, lon2, expectedKm, toleranceKm float64) {
	actualKm := haversineDistance(lat1, lon1, lat2, lon2)
	if math.Abs(actualKm-expectedKm) > toleranceKm {
		t.Errorf("Distance mismatch: expected %.2f±%.2f km, got %.2f km",
			expectedKm, toleranceKm, actualKm)
	}
}

// AssertStationInRadius checks if a station is within a specified radius from a center point
func AssertStationInRadius(t *testing.T, station *models.Station, centerLat, centerLon, radiusKm float64) {
	distance := haversineDistance(centerLat, centerLon, station.Latitude, station.Longitude)
	assert.LessOrEqual(t, distance, radiusKm,
		"Station %s should be within %.2f km of center (%.2f, %.2f), but is %.2f km away",
		station.ID, radiusKm, centerLat, centerLon, distance)
}

// AssertStationNotInRadius checks if a station is outside a specified radius from a center point
func AssertStationNotInRadius(t *testing.T, station *models.Station, centerLat, centerLon, radiusKm float64) {
	distance := haversineDistance(centerLat, centerLon, station.Latitude, station.Longitude)
	assert.Greater(t, distance, radiusKm,
		"Station %s should be outside %.2f km of center (%.2f, %.2f), but is %.2f km away",
		station.ID, radiusKm, centerLat, centerLon, distance)
}

// haversineDistance calculates the great-circle distance between two points on Earth
// using the Haversine formula (in kilometers)
func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusKm = 6371.0

	// Convert degrees to radians
	lat1Rad := toRadians(lat1)
	lon1Rad := toRadians(lon1)
	lat2Rad := toRadians(lat2)
	lon2Rad := toRadians(lon2)

	// Haversine formula
	dlat := lat2Rad - lat1Rad
	dlon := lon2Rad - lon1Rad

	a := math.Sin(dlat/2)*math.Sin(dlat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(dlon/2)*math.Sin(dlon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	distance := earthRadiusKm * c

	return distance
}

// toRadians converts degrees to radians
func toRadians(degrees float64) float64 {
	return degrees * math.Pi / 180.0
}
