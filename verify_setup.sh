#!/bin/bash

echo "🔍 VERIFYING GAS PEEP SETUP..."
echo ""

errors=0
warnings=0

# Check directories
echo "📁 Checking directory structure..."
dirs=(
  "frontend/src/shell/components"
  "frontend/src/sections"
  "frontend/src/services"
  "frontend/src/hooks"
  "backend/cmd/api"
  "backend/internal/db"
  "backend/internal/models"
  "backend/internal/repository"
  "backend/internal/handler"
  "backend/internal/middleware"
  "backend/internal/service"
  "backend/internal/auth"
  "backend/internal/payment"
  "backend/internal/migrations"
)

for dir in "${dirs[@]}"; do
  if [ -d "$dir" ]; then
    echo "  ✅ $dir"
  else
    echo "  ❌ $dir (MISSING)"
    ((errors++))
  fi
done

echo ""
echo "📄 Checking key files..."
files=(
  "frontend/package.json"
  "frontend/tsconfig.json"
  "frontend/vite.config.ts"
  "frontend/tailwind.config.js"
  "frontend/src/main.tsx"
  "frontend/src/shell/AppShell.tsx"
  "frontend/src/lib/router.tsx"
  "frontend/src/lib/api.ts"
  "frontend/Dockerfile"
  "frontend/nginx.conf"
  "backend/go.mod"
  "backend/cmd/api/main.go"
  "backend/internal/db/db.go"
  "backend/internal/models/models.go"
  "backend/Dockerfile"
  "docker compose.yml"
  "README.md"
  "SETUP_COMPLETE.md"
  "SETUP_CHECKLIST.md"
  "SETUP_STATUS.sh"
  "quickstart.sh"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MISSING)"
    ((errors++))
  fi
done

echo ""
echo "✔️  Checking environment templates..."
env_files=(
  "frontend/.env.example"
  "backend/.env.example"
)

for file in "${env_files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MISSING)"
    ((errors++))
  fi
done

echo ""
echo "📋 Checking documentation..."
docs=(
  "README.md"
  "SETUP_COMPLETE.md"
  "SETUP_CHECKLIST.md"
  "frontend/README.md"
  "backend/README.md"
)

for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    echo "  ✅ $doc"
  else
    echo "  ⚠️  $doc (OPTIONAL)"
    ((warnings++))
  fi
done

echo ""
echo "📊 Line counts..."
echo "  Frontend TypeScript: $(find frontend/src -name '*.ts' -o -name '*.tsx' | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}') lines"
echo "  Backend Go: $(find backend -name '*.go' | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}') lines"

echo ""
echo "✅ Summary:"
echo "  Directories: ${#dirs[@]} checked"
echo "  Files: ${#files[@]} checked"
echo "  Errors: $errors"
echo "  Warnings: $warnings"

if [ $errors -eq 0 ]; then
  echo ""
  echo "🎉 ✅ SETUP VERIFICATION PASSED!"
  echo ""
  echo "Next steps:"
  echo "  1. Read the implementation guide: product-plan/instructions/one-shot-instructions.md"
  echo "  2. Start Docker: ./quickstart.sh"
  echo "  3. Begin Phase 3: Map & Station Browsing"
  exit 0
else
  echo ""
  echo "⚠️  Setup verification found $errors error(s)."
  exit 1
fi
