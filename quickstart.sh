#!/bin/bash

# Gas Peep - Quick Start Script
# This script helps you get the project running locally

set -e

echo "🚀 Gas Peep - Quick Start"
echo "========================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Desktop."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Setup environment files
echo "📝 Setting up environment files..."

if [ ! -f "frontend/.env.local" ]; then
    cp frontend/.env.example frontend/.env.local
    echo "✅ Created frontend/.env.local"
fi

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
fi

echo ""
echo "🐳 Starting services with Docker Compose..."
echo ""

docker compose up --build

echo ""
echo "✅ Services are running!"
echo ""
echo "📍 Access the applications at:"
echo "   • Frontend: http://0.0.0.0:3000"
echo "   • Backend API: http://0.0.0.0:8080"
echo "   • Database: localhost:5432"
echo ""
echo "📚 Documentation:"
echo "   • Main README: ./README.md"
echo "   • Frontend README: ./frontend/README.md"
echo "   • Backend README: ./backend/README.md"
echo "   • Setup Guide: ./SETUP_COMPLETE.md"
echo "   • Product Specs: ./product-plan/instructions/one-shot-instructions.md"
echo ""
