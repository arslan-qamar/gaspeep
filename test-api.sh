#!/bin/bash

# Station Owner Dashboard - API Integration Testing Script
# This script tests all implemented endpoints

set -e

# Configuration
API_URL="${1:-http://api.gaspeep.com/api}"
EMAIL="${2:-test@example.com}"
PASSWORD="${3:-password123}"

echo "════════════════════════════════════════════════════════════════"
echo "  Station Owner Dashboard - API Integration Testing"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "API URL: $API_URL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoints
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5

    echo -e "${BLUE}Testing:${NC} $description"
    echo "  $method $endpoint"

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    fi

    # Extract status code (last line) and body (all but last line)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "$expected_status" ]; then
        echo -e "  ${GREEN}✓ Status: $http_code${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "  ${RED}✗ Expected: $expected_status, Got: $http_code${NC}"
        echo "  Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    # Pretty print JSON response if available
    if [ ! -z "$body" ] && [[ "$body" == "{"* ]]; then
        echo "  Response:"
        echo "$body" | jq '.' 2>/dev/null | sed 's/^/    /' || echo "    (Invalid JSON)"
    fi
    echo ""
}

# Step 1: Get Authentication Token
echo -e "${YELLOW}Step 1: Obtaining JWT Token${NC}"
echo "─────────────────────────────────────────────────────────────────"

# Try to get token (this assumes a user exists)
token_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
    "$API_URL/auth/signin" 2>/dev/null || echo "")

if [ -z "$token_response" ]; then
    echo -e "${YELLOW}Note: Could not authenticate. Testing with bearer token placeholder.${NC}"
    echo "To get a real token, sign up/login first:"
    echo ""
    echo "  curl -X POST -H 'Content-Type: application/json' \\"
    echo "    -d '{\"email\":\"your@email.com\",\"password\":\"yourpass\"}' \\"
    echo "    http://api.gaspeep.com/api/auth/signin"
    echo ""
    TOKEN="test-token-placeholder"
else
    TOKEN=$(echo "$token_response" | jq -r '.token' 2>/dev/null || echo "test-token")
fi

if [ "$TOKEN" == "test-token-placeholder" ] || [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠ No valid token obtained. Using placeholder for tests.${NC}"
else
    echo -e "${GREEN}✓ Token obtained${NC}"
fi
echo "  Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Test Station Owner Endpoints
echo -e "${YELLOW}Step 2: Testing Station Owner Endpoints${NC}"
echo "─────────────────────────────────────────────────────────────────"

test_endpoint "GET" "/station-owners/profile" "" "200" "Get Owner Profile"
test_endpoint "GET" "/station-owners/stats" "" "200" "Get Dashboard Statistics"
test_endpoint "GET" "/station-owners/fuel-prices" "" "200" "Get Fuel Prices"
test_endpoint "GET" "/station-owners/stations" "" "200" "List Owned Stations"

# Note: These might return 404 if no stations exist
test_endpoint "GET" "/station-owners/stations/station_101" "" "200" "Get Station Details (if exists)"
test_endpoint "GET" "/station-owners/search-stations?query=shell&lat=-33.8688&lon=151.2093&radius=5" "" "200" "Search Available Stations"

echo ""

# Step 3: Test Broadcast Endpoints
echo -e "${YELLOW}Step 3: Testing Broadcast Endpoints${NC}"
echo "─────────────────────────────────────────────────────────────────"

test_endpoint "GET" "/broadcasts" "" "200" "List All Broadcasts"

# Create a test broadcast
broadcast_payload='{
  "stationId": "station_test_001",
  "title": "Test Broadcast",
  "message": "This is a test broadcast",
  "targetRadiusKm": 10,
  "startDate": "2026-02-18T00:00:00Z",
  "endDate": "2026-02-20T23:59:59Z",
  "targetFuelTypes": "fuel_diesel"
}'

test_endpoint "POST" "/broadcasts" "$broadcast_payload" "201" "Create New Broadcast"

# Get broadcast ID from previous response (if available)
test_endpoint "GET" "/broadcasts/test_broadcast_001" "" "200" "Get Single Broadcast (if exists)"

test_endpoint "POST" "/broadcasts/draft" "$broadcast_payload" "201" "Save Broadcast as Draft"

echo ""

# Step 4: Test Error Handling
echo -e "${YELLOW}Step 4: Testing Error Handling${NC}"
echo "─────────────────────────────────────────────────────────────────"

test_endpoint "GET" "/broadcasts/nonexistent_id" "" "404" "Get Non-existent Broadcast (404 expected)"

test_endpoint "DELETE" "/broadcasts/nonexistent_id" "" "404" "Delete Non-existent Broadcast (404 expected)"

echo ""

# Step 5: Summary
echo "════════════════════════════════════════════════════════════════"
echo -e "${YELLOW}Test Summary:${NC}"
echo "─────────────────────────────────────────────────────────────────"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed.${NC}"
    exit 1
fi
