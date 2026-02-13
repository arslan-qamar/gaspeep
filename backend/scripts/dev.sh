#!/usr/bin/env bash
set -euo pipefail
# from backend/ run Air: install if missing then run
cd "$(dirname "$0")/.."
if ! command -v air >/dev/null 2>&1; then
  echo "air not found — installing air (requires Go >= 1.25)..."
  # verify Go version is >= 1.25
  if ! command -v go >/dev/null 2>&1; then
    echo "go command not found. Please install Go 1.25+ and try again."
    exit 1
  fi
  gv=$(go version | awk '{print $3}' | sed 's/go//')
  req_major=1
  req_minor=25
  major=$(echo "$gv" | sed -E 's/^([0-9]+).*/\1/')
  minor=$(echo "$gv" | sed -E 's/^[0-9]+\.([0-9]+).*/\1/')
  if [ "$major" -lt "$req_major" ] || ( [ "$major" -eq "$req_major" ] && [ "$minor" -lt "$req_minor" ] ); then
    echo "Detected Go version $gv — Air requires Go >= 1.25."
    echo "Please upgrade Go (see README below) and retry."
    exit 1
  fi

  if go install github.com/air-verse/air@latest >/dev/null 2>&1; then
    echo "installed air (github.com/air-verse/air)"
  else
    echo "go install failed for air. Ensure your Go environment is set up and GOPATH/GOBIN are writable." 
    echo "You can install manually: 'go install github.com/air-verse/air@<version>'"
    exit 1
  fi
  export PATH="$PATH:$(go env GOPATH)/bin"
fi

echo "starting air (backend) — building ./cmd/api and running ./bin/api"
air
