.PHONY: dev install-go install-air build install-dlv dlv-headless

dev:
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
	@echo "Starting Delve in headless mode on :2345 (builds ./cmd/api)"
	dlv debug ./cmd/api --headless --listen=:2345 --api-version=2 --accept-multiclient
