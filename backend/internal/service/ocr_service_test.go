package service

import "testing"

func TestExtractFuelEntries_CostcoSample(t *testing.T) {
	input := "COSTCO\nWHOLESALE\nUNLEADED\nE10 94\n158.7\nPREMIUM\nUNLEADED 98 180.7\nPREMIUM 174.7\nDIESEL"

	entries := extractFuelEntries(input)
	if len(entries) < 3 {
		t.Fatalf("expected at least 3 entries, got %d (%v)", len(entries), entries)
	}

	assertHasFuelWithPrice(t, entries, "E10", 158.7)
	assertHasFuelWithPrice(t, entries, "Premium 98", 180.7)
	assertHasFuelWithPrice(t, entries, "Premium 95", 174.7)
}

func TestExtractFuelEntries_CaltexSample(t *testing.T) {
	input := "5\n5\nCALTEX\nCALTEX\nrewards\nE10\n1589\nULP\n1559\nVortex\n95\n1689\nVortex\nDiesel\n1499"

	entries := extractFuelEntries(input)
	if len(entries) < 4 {
		t.Fatalf("expected at least 4 entries, got %d (%v)", len(entries), entries)
	}

	assertHasFuelWithPrice(t, entries, "E10", 158.9)
	assertHasFuelWithPrice(t, entries, "Unleaded 91", 155.9)
	assertHasFuelWithPrice(t, entries, "Premium 95", 168.9)
	assertHasFuelWithPrice(t, entries, "Diesel", 149.9)
}

func TestExtractFuelEntries_SevenElevenSample_PreservesTenthCentPrecision(t *testing.T) {
	input := "Unleaded E10\n1519\nUnleaded\n1539\nDiesel Efficient\n1619"

	entries := extractFuelEntries(input)
	if len(entries) < 3 {
		t.Fatalf("expected at least 3 entries, got %d (%v)", len(entries), entries)
	}

	assertHasFuelWithPrice(t, entries, "E10", 151.9)
	assertHasFuelWithPrice(t, entries, "Unleaded 91", 153.9)
	assertHasFuelWithPrice(t, entries, "Diesel", 161.9)
}

func TestExtractFuelEntries_PremiumDiesel_DifferentiatesFromDiesel(t *testing.T) {
	input := "Premium 98\n1697\nDiesel\n165.1\nPremium Diesel\n165"

	entries := extractFuelEntries(input)
	if len(entries) < 3 {
		t.Fatalf("expected at least 3 entries, got %d (%v)", len(entries), entries)
	}

	assertHasFuelWithPrice(t, entries, "Premium 98", 169.7)
	assertHasFuelWithPrice(t, entries, "Diesel", 165.1)
	assertHasFuelWithPrice(t, entries, "Premium Diesel", 165.0)
}

func assertHasFuelWithPrice(t *testing.T, entries []OCRPriceEntry, fuelType string, expected float64) {
	t.Helper()
	for _, entry := range entries {
		if entry.FuelType == fuelType && approx(entry.Price, expected, 0.05) {
			return
		}
	}
	t.Fatalf("missing expected entry %s=%.1f in %#v", fuelType, expected, entries)
}

func approx(a, b, eps float64) bool {
	if a > b {
		return a-b <= eps
	}
	return b-a <= eps
}
