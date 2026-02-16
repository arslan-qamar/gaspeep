.PHONY: help setup-https docker-https docker-dev dev up down logs

help:
	@echo "Gas Peep - Development Commands"
	@echo ""
	@echo "Local Development:"
	@echo "  make dev                   # Start backend with hot-reload"
	@echo "  make setup-https           # Setup Nginx, /etc/hosts, and certificates for HTTPS development"
	@echo ""
	@echo "Docker Development:"
	@echo "  make docker-https          # Start full stack with Nginx (HTTPS)"
	@echo "  make docker-dev            # Start full stack without Nginx (HTTP)"
	@echo "  make down                  # Stop Docker containers"
	@echo "  make logs                  # View Docker logs"
	@echo ""
	@echo "Notes:"
	@echo "  - setup-https requires Let's Encrypt certificates to be generated first"
	@echo "  - Frontend: https://dev.gaspeep.com (with Nginx)"
	@echo "  - Backend:  https://api.gaspeep.com (with Nginx)"
	@echo ""

setup-https:
	@./scripts/setup-https.sh

dev:
	@cd backend && make dev

docker-https:
	@echo "Starting Docker Compose with Nginx and HTTPS..."
	@docker compose -f docker-compose.https.yml up --build

docker-dev:
	@echo "Starting Docker Compose without Nginx (HTTP)..."
	@docker compose up --build

down:
	@docker compose down

logs:
	@docker compose logs -f

# Alias for docker-https
up: docker-https
