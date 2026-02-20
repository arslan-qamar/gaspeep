package service

import "testing"

func TestExtractFuelEntries_CostcoSample(t *testing.T) {
	input := "COSTCO\nWHOLESALE\nUNLEADED\nE10 94\n158.7\nPREMIUM\nUNLEADED 98 180.7\nPREMIUM 174.7\nDIESEL"

	entries := extractFuelEntries(input)
	if len(entries) < 3 {
		t.Fatalf("expected at least 3 entries, got %d (%v)", len(entries), entries)
	}

	assertHasFuelWithPrice(t, entries, "E10", 1.587)
	assertHasFuelWithPrice(t, entries, "Premium 98", 1.807)
	assertHasFuelWithPrice(t, entries, "Premium 95", 1.747)
}

func TestExtractFuelEntries_CaltexSample(t *testing.T) {
	input := "5\n5\nCALTEX\nCALTEX\nrewards\nE10\n1589\nULP\n1559\nVortex\n95\n1689\nVortex\nDiesel\n1499"

	entries := extractFuelEntries(input)
	if len(entries) < 4 {
		t.Fatalf("expected at least 4 entries, got %d (%v)", len(entries), entries)
	}

	assertHasFuelWithPrice(t, entries, "E10", 1.589)
	assertHasFuelWithPrice(t, entries, "Unleaded 91", 1.559)
	assertHasFuelWithPrice(t, entries, "Premium 95", 1.689)
	assertHasFuelWithPrice(t, entries, "Diesel", 1.499)
}

func assertHasFuelWithPrice(t *testing.T, entries []OCRPriceEntry, fuelType string, expected float64) {
	t.Helper()
	for _, entry := range entries {
		if entry.FuelType == fuelType && approx(entry.Price, expected, 0.001) {
			return
		}
	}
	t.Fatalf("missing expected entry %s=%.3f in %#v", fuelType, expected, entries)
}

func approx(a, b, eps float64) bool {
	if a > b {
		return a-b <= eps
	}
	return b-a <= eps
}
