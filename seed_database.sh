#!/bin/bash
# Script to seed the database with test data for Phase 3

set -e

echo "🌱 Seeding database with test data..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Default database connection
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-gaspeep}"
DB_USER="${DB_USER:-postgres}"

echo "Connecting to database: $DB_NAME at $DB_HOST:$DB_PORT"

# Check if PostgreSQL is accessible
if ! docker compose ps postgres | grep -q "Up"; then
    echo "❌ PostgreSQL container is not running"
    echo "Run: docker compose up -d postgres"
    exit 1
fi

# Execute seed data
echo "Loading seed data..."
docker compose exec -T postgres psql -U "$DB_USER" -d gas_peep < backend/seed_data.sql

echo "✅ Seed data loaded successfully!"
echo ""
echo "Summary:"
echo "- 11 fuel types"
echo "- 15 gas stations (Sydney area)"
echo "- 50+ fuel prices"
echo ""
echo "🚀 You can now test the Map interface at https://dev.gaspeep.com"
