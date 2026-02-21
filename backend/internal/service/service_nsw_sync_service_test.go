package service

import "testing"

func TestNormalizeServiceNSWPrice(t *testing.T) {
	tests := []struct {
		name  string
		cents float64
		want  float64
	}{
		{name: "whole cents", cents: 178.900, want: 1.789},
		{name: "fractional cents", cents: 179.95, want: 1.799},
		{name: "zero", cents: 0, want: 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := normalizeServiceNSWPrice(tt.cents)
			if got != tt.want {
				t.Fatalf("normalizeServiceNSWPrice(%v) = %v, want %v", tt.cents, got, tt.want)
			}
		})
	}
}
