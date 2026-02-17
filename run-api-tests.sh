#!/bin/bash

# Complete API Testing Script with Authentication Setup
# This script handles authentication and tests all endpoints

set -e

# Configuration
API_URL="https://api.gaspeep.com/api"
EMAIL="testowner@gaspeep.local"
PASSWORD="TestPassword123!"
BACKEND_URL="${API_URL%/api}"  # Remove /api to get base URL

echo "════════════════════════════════════════════════════════════════════════════════"
echo "           STATION OWNER DASHBOARD - API INTEGRATION TEST SUITE"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Test Email: $EMAIL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

# Helper function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5

    echo -e "${BLUE}→${NC} $description"

    if [ -z "$data" ]; then
        response=$(curl -k -s -w "\n%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "$API_URL$endpoint")
    else
        response=$(curl -k -s -w "\n%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "$expected_status" ]; then
        echo -e "  ${GREEN}✓ Status $http_code${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))

        # Show response preview for successful responses
        if [ ! -z "$body" ] && [[ "$body" == "{"* ]]; then
            echo "  Response: $(echo "$body" | jq -c '.' 2>/dev/null | cut -c1-80)..."
        fi
    else
        echo -e "  ${RED}✗ Expected $expected_status, got $http_code${NC}"
        if [ ! -z "$body" ]; then
            echo "  Response: $(echo "$body" | cut -c1-100)"
        fi
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

# Step 1: Check backend connectivity
echo -e "${YELLOW}Step 1: Checking Backend Connectivity${NC}"
echo "─────────────────────────────────────────────────────────────────────────────────"

health=$(curl -k -s -w "%{http_code}" -o /dev/null $BACKEND_URL/health)
if [ "$health" == "200" ]; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not responding (got status $health)${NC}"
    echo "  Start backend with: docker compose up api"
    exit 1
fi
echo ""

# Step 2: Authenticate
echo -e "${YELLOW}Step 2: Authentication${NC}"
echo "─────────────────────────────────────────────────────────────────────────────────"

echo "Attempting to sign in as: $EMAIL"

auth_response=$(curl -k -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
    "$API_URL/auth/signin")

TOKEN=$(echo "$auth_response" | jq -r '.token // empty' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo -e "${YELLOW}⚠ Authentication failed${NC}"
    echo ""
    echo "Attempting to create test user..."

    signup_response=$(curl -k -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"displayName\":\"Test Owner\"}" \
        "$API_URL/auth/signup")

    TOKEN=$(echo "$signup_response" | jq -r '.token // empty' 2>/dev/null)

    if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
        echo -e "${RED}✗ Could not authenticate or create user${NC}"
        echo "Response: $signup_response"
        exit 1
    else
        echo -e "${GREEN}✓ Test user created and authenticated${NC}"
    fi
else
    echo -e "${GREEN}✓ Authenticated successfully${NC}"
fi

echo "  Token: ${TOKEN:0:20}..."
echo ""

# Step 3: Test Profile Endpoints
echo -e "${YELLOW}Step 3: Testing Profile Endpoints${NC}"
echo "─────────────────────────────────────────────────────────────────────────────────"

test_endpoint "GET" "/station-owners/profile" "" "200" "Get Owner Profile"
test_endpoint "GET" "/station-owners/stats" "" "200" "Get Dashboard Statistics"
test_endpoint "GET" "/station-owners/fuel-prices" "" "200" "Get Fuel Prices"

# Step 4: Test Station Endpoints
echo -e "${YELLOW}Step 4: Testing Station Endpoints${NC}"
echo "─────────────────────────────────────────────────────────────────────────────────"

test_endpoint "GET" "/station-owners/stations" "" "200" "List Owned Stations"
test_endpoint "GET" "/station-owners/search-stations?query=shell&lat=-33.8688&lon=151.2093&radius=5" "" "200" "Search Available Stations"

# Step 5: Test Broadcast Endpoints
echo -e "${YELLOW}Step 5: Testing Broadcast Endpoints${NC}"
echo "─────────────────────────────────────────────────────────────────────────────────"

test_endpoint "GET" "/broadcasts" "" "200" "List All Broadcasts"

# Create a test broadcast
broadcast_payload='{
  "stationId": "test_station_001",
  "title": "API Test Broadcast",
  "message": "This is an API test",
  "targetRadiusKm": 10,
  "startDate": "2026-02-21T00:00:00Z",
  "endDate": "2026-02-23T23:59:59Z",
  "targetFuelTypes": "fuel_diesel"
}'

echo -e "${BLUE}→${NC} Create Broadcast"
create_response=$(curl -k -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$broadcast_payload" \
    "$API_URL/broadcasts")

create_code=$(echo "$create_response" | tail -n1)
create_body=$(echo "$create_response" | sed '$d')

if [ "$create_code" == "201" ]; then
    echo -e "  ${GREEN}✓ Status 201${NC}"
    BROADCAST_ID=$(echo "$create_body" | jq -r '.id // empty' 2>/dev/null)
    if [ ! -z "$BROADCAST_ID" ]; then
        echo "  Created broadcast: $BROADCAST_ID"
    fi
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "  ${RED}✗ Expected 201, got $create_code${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test other broadcast operations if we have a broadcast ID
if [ ! -z "$BROADCAST_ID" ] && [ "$BROADCAST_ID" != "null" ]; then
    test_endpoint "GET" "/broadcasts/$BROADCAST_ID" "" "200" "Get Broadcast Details"
    test_endpoint "PUT" "/broadcasts/$BROADCAST_ID" "{\"title\":\"Updated Title\"}" "200" "Update Broadcast"
    test_endpoint "POST" "/broadcasts/$BROADCAST_ID/duplicate" "" "201" "Duplicate Broadcast"
fi

# Step 6: Test Draft Endpoint
echo -e "${YELLOW}Step 6: Testing Draft Broadcast${NC}"
echo "─────────────────────────────────────────────────────────────────────────────────"

test_endpoint "POST" "/broadcasts/draft" "$broadcast_payload" "201" "Save Broadcast as Draft"

# Step 7: Test Error Handling
echo -e "${YELLOW}Step 7: Testing Error Handling${NC}"
echo "─────────────────────────────────────────────────────────────────────────────────"

echo -e "${BLUE}→${NC} Test 401 Unauthorized (no token)"
no_token=$(curl -k -s -w "%{http_code}" -o /dev/null "$API_URL/broadcasts")
if [ "$no_token" == "401" ]; then
    echo -e "  ${GREEN}✓ Status 401${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "  ${RED}✗ Expected 401, got $no_token${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

test_endpoint "GET" "/broadcasts/nonexistent_id" "" "404" "Test 404 Not Found"

# Summary
echo "════════════════════════════════════════════════════════════════════════════════"
echo -e "${YELLOW}Test Summary${NC}"
echo "─────────────────────────────────────────────────────────────────────────────────"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo "  Total:  $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Summary:"
    echo "  • Profile endpoints working"
    echo "  • Station endpoints working"
    echo "  • Broadcast CRUD operations working"
    echo "  • Error handling working"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed${NC}"
    echo ""
    echo "Possible issues:"
    echo "  • Test data may not exist yet"
    echo "  • Database schema may not be applied"
    echo "  • Backend may have errors in logs"
    echo ""
    echo "Check logs with: docker compose logs -f api"
    exit 1
fi
