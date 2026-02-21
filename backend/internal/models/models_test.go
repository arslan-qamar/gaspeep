package models

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/go-playground/validator/v10"
)

func TestUserJSON_PasswordHashExcluded(t *testing.T) {
	u := User{
		ID:           "u1",
		Email:        "user@example.com",
		DisplayName:  "User",
		PasswordHash: "secret-hash",
		Tier:         "free",
	}

	b, err := json.Marshal(u)
	if err != nil {
		t.Fatalf("marshal failed: %v", err)
	}
	jsonStr := string(b)

	if strings.Contains(jsonStr, "secret-hash") {
		t.Fatalf("password hash leaked in json: %s", jsonStr)
	}
	if strings.Contains(jsonStr, "passwordHash") {
		t.Fatalf("passwordHash field should be excluded from json: %s", jsonStr)
	}
}

func TestUserJSON_OmitEmptyOAuthFields(t *testing.T) {
	now := time.Now().UTC()
	u := User{
		ID:          "u1",
		Email:       "user@example.com",
		DisplayName: "User",
		Tier:        "free",
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	b, err := json.Marshal(u)
	if err != nil {
		t.Fatalf("marshal failed: %v", err)
	}
	jsonStr := string(b)

	for _, field := range []string{"oauthProvider", "oauthProviderId", "avatarUrl", "emailVerified"} {
		if strings.Contains(jsonStr, field) {
			t.Fatalf("expected %s to be omitted when empty: %s", field, jsonStr)
		}
	}
}

func TestStationsNearbyRequestBindingValidation(t *testing.T) {
	validate := validator.New()
	validate.SetTagName("binding")

	valid := StationsNearbyRequest{Latitude: -33.87, Longitude: 151.21, RadiusKm: 25}
	if err := validate.Struct(valid); err != nil {
		t.Fatalf("expected valid request, got error: %v", err)
	}

	invalidZeroRadius := StationsNearbyRequest{Latitude: -33.87, Longitude: 151.21, RadiusKm: 0}
	if err := validate.Struct(invalidZeroRadius); err == nil {
		t.Fatal("expected validation error for radiusKm=0")
	}

	invalidLargeRadius := StationsNearbyRequest{Latitude: -33.87, Longitude: 151.21, RadiusKm: 201}
	if err := validate.Struct(invalidLargeRadius); err == nil {
		t.Fatal("expected validation error for radiusKm>200")
	}
}
