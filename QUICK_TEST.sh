#!/bin/bash

# QUICK_TEST.sh - Rapid validation script for Learn Session Planner monorepo
# This script runs critical tests from all phases in sequence to validate the entire setup

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track start time
START_TIME=$(date +%s)

# Flags
SKIP_DOCKER=false
VERBOSE=false
CLEAN=false

# Docker Compose command (will be set after detection)
COMPOSE_CMD=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-docker)
      SKIP_DOCKER=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --clean)
      CLEAN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--skip-docker] [--verbose] [--clean]"
      exit 1
      ;;
  esac
done

# Helper functions
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

print_phase() {
  echo ""
  echo -e "${BLUE}================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================================${NC}"
}

# Cleanup function
cleanup() {
  if [ "$SKIP_DOCKER" = false ] && [ -n "$COMPOSE_CMD" ]; then
    print_info "Cleaning up Docker resources..."
    $COMPOSE_CMD down > /dev/null 2>&1 || true
  fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Phase 1: Prerequisites
print_phase "Phase 1: Prerequisites"

# Check Node.js version
print_info "Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
  print_success "Node.js version: $(node --version)"
else
  print_error "Node.js version must be 18 or higher (found: $(node --version))"
  exit 1
fi

# Check pnpm version
print_info "Checking pnpm version..."
if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm --version)
  print_success "pnpm version: $PNPM_VERSION"
else
  print_error "pnpm is not installed. Install with: npm install -g pnpm"
  exit 1
fi

# Check Docker (if not skipping)
if [ "$SKIP_DOCKER" = false ]; then
  print_info "Checking Docker version..."
  if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker version: $DOCKER_VERSION"
  else
    print_error "Docker is not installed"
    exit 1
  fi

  print_info "Checking Docker Compose version..."
  # Detect which docker-compose command is available
  if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
    COMPOSE_VERSION=$(docker compose version)
    print_success "Docker Compose is available (V2): $COMPOSE_VERSION"
  elif docker-compose --version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose is available (V1): $COMPOSE_VERSION"
  else
    print_error "Docker Compose is not available"
    exit 1
  fi
fi

# Phase 2: Monorepo Setup
print_phase "Phase 2: Monorepo Setup"

# Clean if requested
if [ "$CLEAN" = true ]; then
  print_info "Cleaning node_modules and build artifacts..."
  rm -rf node_modules packages/*/node_modules apps/*/node_modules
  rm -rf packages/*/dist apps/*/dist
  print_success "Cleaned successfully"
fi

# Install dependencies
print_info "Installing dependencies..."
if [ "$VERBOSE" = true ]; then
  pnpm install
else
  pnpm install > /dev/null 2>&1
fi
print_success "Dependencies installed"

# Verify workspace packages
print_info "Verifying workspace packages..."
# Check for expected workspace package directories instead of parsing pnpm list
if [ -d "apps/web" ] && [ -d "apps/api" ] && [ -d "packages/shared-types" ]; then
  print_success "All workspace packages found (3/3)"
else
  print_error "Expected workspace packages not found. Check apps/web, apps/api, and packages/shared-types directories."
  exit 1
fi

# Check for pnpm-lock.yaml
if [ -f "pnpm-lock.yaml" ]; then
  print_success "pnpm-lock.yaml exists"
else
  print_error "pnpm-lock.yaml not found"
  exit 1
fi

# Phase 3: Shared Types
print_phase "Phase 3: Shared Types"

# Build shared-types
print_info "Building shared-types package..."
if [ "$VERBOSE" = true ]; then
  pnpm --filter @repo/shared-types build
else
  pnpm --filter @repo/shared-types build > /dev/null 2>&1
fi
print_success "Shared-types built"

# Type-check shared-types
print_info "Type-checking shared-types..."
if [ "$VERBOSE" = true ]; then
  pnpm --filter @repo/shared-types typecheck
else
  pnpm --filter @repo/shared-types typecheck > /dev/null 2>&1
fi
print_success "Shared-types type-check passed"

# Verify dist directories
if [ -d "packages/shared-types/dist/esm" ] && [ -d "packages/shared-types/dist/cjs" ]; then
  print_success "Shared-types dist directories exist"
else
  print_error "Shared-types dist directories not found"
  exit 1
fi

# Phase 4: Frontend
print_phase "Phase 4: Frontend"

# Type-check frontend
print_info "Type-checking frontend..."
if [ "$VERBOSE" = true ]; then
  pnpm --filter @repo/web typecheck
else
  pnpm --filter @repo/web typecheck > /dev/null 2>&1
fi
print_success "Frontend type-check passed"

# Build frontend
print_info "Building frontend..."
if [ "$VERBOSE" = true ]; then
  pnpm --filter @repo/web build
else
  pnpm --filter @repo/web build > /dev/null 2>&1
fi
print_success "Frontend built"

# Verify dist directory
if [ -d "apps/web/dist" ]; then
  print_success "Frontend dist directory exists"
else
  print_error "Frontend dist directory not found"
  exit 1
fi

# Phase 5: Backend
print_phase "Phase 5: Backend"

# Type-check backend
print_info "Type-checking backend..."
if [ "$VERBOSE" = true ]; then
  pnpm --filter @repo/api typecheck
else
  pnpm --filter @repo/api typecheck > /dev/null 2>&1
fi
print_success "Backend type-check passed"

# Build backend
print_info "Building backend..."
if [ "$VERBOSE" = true ]; then
  pnpm --filter @repo/api build
else
  pnpm --filter @repo/api build > /dev/null 2>&1
fi
print_success "Backend built"

# Verify dist directory
if [ -d "apps/api/dist" ]; then
  print_success "Backend dist directory exists"
else
  print_error "Backend dist directory not found"
  exit 1
fi

# Phase 6: Docker (if not skipped)
if [ "$SKIP_DOCKER" = false ]; then
  print_phase "Phase 6: Docker"

  # Build Docker images
  print_info "Building Docker images..."
  if [ "$VERBOSE" = true ]; then
    $COMPOSE_CMD build
  else
    $COMPOSE_CMD build > /dev/null 2>&1
  fi
  print_success "Docker images built"

  # Start services
  print_info "Starting Docker services..."
  $COMPOSE_CMD up -d > /dev/null 2>&1
  print_success "Docker services started"

  # Wait for services to be ready
  print_info "Waiting for services to be ready (30s)..."
  sleep 30

  # Run migrations
  print_info "Running database migrations..."
  if [ "$VERBOSE" = true ]; then
    $COMPOSE_CMD exec -T api pnpm prisma:migrate:deploy
  else
    $COMPOSE_CMD exec -T api pnpm prisma:migrate:deploy > /dev/null 2>&1
  fi
  print_success "Database migrations complete"

  # Test API health check
  print_info "Testing API health check..."
  if curl -sf http://localhost:4000/api/health > /dev/null; then
    print_success "API health check passed"
  else
    print_error "API health check failed"
    $COMPOSE_CMD logs api
    exit 1
  fi

  # Test web app
  print_info "Testing web app..."
  if curl -sf http://localhost:5173 > /dev/null; then
    print_success "Web app accessible"
  else
    print_error "Web app not accessible"
    $COMPOSE_CMD logs web
    exit 1
  fi

  # Stop services
  print_info "Stopping Docker services..."
  $COMPOSE_CMD down > /dev/null 2>&1
  print_success "Docker services stopped"
else
  print_info "Skipping Docker tests (--skip-docker flag set)"
fi

# Summary
print_phase "Test Summary"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
print_success "All tests passed!"
echo ""
print_info "Total time: ${MINUTES}m ${SECONDS}s"
echo ""
echo -e "${GREEN}✓ Monorepo setup verified${NC}"
echo -e "${GREEN}✓ Shared types build and type-check passed${NC}"
echo -e "${GREEN}✓ Frontend build and type-check passed${NC}"
echo -e "${GREEN}✓ Backend build and type-check passed${NC}"
if [ "$SKIP_DOCKER" = false ]; then
  echo -e "${GREEN}✓ Docker services build and run successfully${NC}"
fi
echo ""
print_info "Next steps:"
echo "  1. Start development: pnpm dev"
echo "  2. Or use Docker: pnpm docker:dev"
echo "  3. Read detailed test plans: TEST_PLAN.md"
echo ""
print_success "Your monorepo is ready! 🚀"
