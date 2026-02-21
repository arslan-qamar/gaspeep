.PHONY: dev install-go install-air build install-dlv dlv-headless dlv-stop setup-https https-dev

DLV := $(shell command -v dlv 2>/dev/null || echo "$$(go env GOPATH)/bin/dlv")
DLV_PORT ?= 2345

dev:
	./scripts/dev.sh

setup-https:
	@../scripts/setup-https.sh

https-dev: setup-https
	@echo "Starting backend with HTTPS development setup..."
	@echo "Make sure Nginx is running and /etc/hosts is configured"
	./scripts/dev.sh

install-air:
	@echo "Installing air watcher (requires Go >=1.25)"
	@go install github.com/air-verse/air@latest

install-go:
	@echo "Installing Go 1.25.7 to /usr/local (requires sudo)"
	@set -e; \
	TGZ=go1.25.7.linux-amd64.tar.gz; \
	URL="https://go.dev/dl/$$TGZ"; \
	TMPDIR=$$(mktemp -d); \
	cd $$TMPDIR; \
	echo "Downloading $$URL"; \
	curl -fsSLO $$URL; \
	echo "Removing existing /usr/local/go (requires sudo)"; \
	sudo rm -rf /usr/local/go; \
	echo "Extracting $$TGZ to /usr/local"; \
	sudo tar -C /usr/local -xzf $$TGZ; \
	echo "Cleaning up"; \
	rm -rf $$TMPDIR; \
	echo "Go 1.25.7 installed to /usr/local/go"; \
	echo "Add /usr/local/go/bin to your PATH if necessary: export PATH=\"$$PATH:/usr/local/go/bin\""

build:
	go build ./...

install-dlv:
	go install github.com/go-delve/delve/cmd/dlv@latest

dlv-headless:
	@echo "Starting Delve in headless mode on :$(DLV_PORT) (builds ./cmd/api)"
	@if [ ! -x "$(DLV)" ]; then \
		echo "Delve not found. Run: make -C backend install-dlv"; \
		exit 1; \
	fi
	@if ss -ltn "sport = :$(DLV_PORT)" 2>/dev/null | grep -q LISTEN; then \
		echo "Port $(DLV_PORT) is already in use."; \
		echo "If Delve is already running, attach to it instead of starting a new instance."; \
		echo "Otherwise, use another port, e.g. make -C backend DLV_PORT=2346 dlv-headless"; \
		exit 1; \
	fi
	"$(DLV)" debug ./cmd/api --headless --listen=:$(DLV_PORT) --api-version=2 --accept-multiclient

dlv-stop:
	@echo "Stopping Delve listeners on :$(DLV_PORT) if present"
	@pkill -f "^$(DLV) debug ./cmd/api --headless --listen=:$(DLV_PORT)( |$$)" >/dev/null 2>&1 || true
