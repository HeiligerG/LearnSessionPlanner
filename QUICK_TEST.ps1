# QUICK_TEST.ps1 - Rapid validation script for Learn Session Planner monorepo (PowerShell)
# This script runs critical tests from all phases in sequence to validate the entire setup

param(
    [switch]$SkipDocker,
    [switch]$Verbose,
    [switch]$Clean
)

# Error handling
$ErrorActionPreference = "Stop"

# Track start time
$StartTime = Get-Date

# Docker Compose command (will be set after detection)
$ComposeCmd = ""

# Helper functions
function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Yellow
}

function Print-Phase {
    param([string]$Message)
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "================================================" -ForegroundColor Blue
}

# Cleanup function
function Cleanup {
    if (-not $SkipDocker -and $ComposeCmd) {
        Print-Info "Cleaning up Docker resources..."
        & $ComposeCmd down 2>&1 | Out-Null
    }
}

# Register cleanup on exit
trap { Cleanup; break }

# Phase 1: Prerequisites
Print-Phase "Phase 1: Prerequisites"

# Check Node.js version
Print-Info "Checking Node.js version..."
try {
    $NodeVersion = node --version
    $NodeMajorVersion = [int]($NodeVersion -replace 'v(\d+)\..*', '$1')
    if ($NodeMajorVersion -ge 18) {
        Print-Success "Node.js version: $NodeVersion"
    } else {
        Print-Error "Node.js version must be 18 or higher (found: $NodeVersion)"
        exit 1
    }
} catch {
    Print-Error "Node.js is not installed"
    exit 1
}

# Check pnpm version
Print-Info "Checking pnpm version..."
try {
    $PnpmVersion = pnpm --version
    Print-Success "pnpm version: $PnpmVersion"
} catch {
    Print-Error "pnpm is not installed. Install with: npm install -g pnpm"
    exit 1
}

# Check Docker (if not skipping)
if (-not $SkipDocker) {
    Print-Info "Checking Docker version..."
    try {
        $DockerVersion = docker --version
        Print-Success "Docker version: $DockerVersion"
    } catch {
        Print-Error "Docker is not installed"
        exit 1
    }

    Print-Info "Checking Docker Compose version..."
    # Detect which docker-compose command is available
    try {
        $null = docker compose version 2>&1
        $ComposeCmd = "docker", "compose"
        $ComposeVersion = docker compose version
        Print-Success "Docker Compose is available (V2): $ComposeVersion"
    } catch {
        try {
            $null = docker-compose --version 2>&1
            $ComposeCmd = "docker-compose"
            $ComposeVersion = docker-compose --version
            Print-Success "Docker Compose is available (V1): $ComposeVersion"
        } catch {
            Print-Error "Docker Compose is not available"
            exit 1
        }
    }
}

# Phase 2: Monorepo Setup
Print-Phase "Phase 2: Monorepo Setup"

# Clean if requested
if ($Clean) {
    Print-Info "Cleaning node_modules and build artifacts..."
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules, packages\*\node_modules, apps\*\node_modules
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue packages\*\dist, apps\*\dist
    Print-Success "Cleaned successfully"
}

# Install dependencies
Print-Info "Installing dependencies..."
if ($Verbose) {
    pnpm install
} else {
    pnpm install 2>&1 | Out-Null
}
Print-Success "Dependencies installed"

# Verify workspace packages
Print-Info "Verifying workspace packages..."
if ((Test-Path "apps\web") -and (Test-Path "apps\api") -and (Test-Path "packages\shared-types")) {
    Print-Success "All workspace packages found (3/3)"
} else {
    Print-Error "Expected workspace packages not found. Check apps\web, apps\api, and packages\shared-types directories."
    exit 1
}

# Check for pnpm-lock.yaml
if (Test-Path "pnpm-lock.yaml") {
    Print-Success "pnpm-lock.yaml exists"
} else {
    Print-Error "pnpm-lock.yaml not found"
    exit 1
}

# Phase 3: Shared Types
Print-Phase "Phase 3: Shared Types"

# Build shared-types
Print-Info "Building shared-types package..."
if ($Verbose) {
    pnpm --filter @repo/shared-types build
} else {
    pnpm --filter @repo/shared-types build 2>&1 | Out-Null
}
Print-Success "Shared-types built"

# Type-check shared-types
Print-Info "Type-checking shared-types..."
if ($Verbose) {
    pnpm --filter @repo/shared-types typecheck
} else {
    pnpm --filter @repo/shared-types typecheck 2>&1 | Out-Null
}
Print-Success "Shared-types type-check passed"

# Verify dist directories
if ((Test-Path "packages\shared-types\dist\esm") -and (Test-Path "packages\shared-types\dist\cjs")) {
    Print-Success "Shared-types dist directories exist"
} else {
    Print-Error "Shared-types dist directories not found"
    exit 1
}

# Phase 4: Frontend
Print-Phase "Phase 4: Frontend"

# Type-check frontend
Print-Info "Type-checking frontend..."
if ($Verbose) {
    pnpm --filter @repo/web typecheck
} else {
    pnpm --filter @repo/web typecheck 2>&1 | Out-Null
}
Print-Success "Frontend type-check passed"

# Build frontend
Print-Info "Building frontend..."
if ($Verbose) {
    pnpm --filter @repo/web build
} else {
    pnpm --filter @repo/web build 2>&1 | Out-Null
}
Print-Success "Frontend built"

# Verify dist directory
if (Test-Path "apps\web\dist") {
    Print-Success "Frontend dist directory exists"
} else {
    Print-Error "Frontend dist directory not found"
    exit 1
}

# Phase 5: Backend
Print-Phase "Phase 5: Backend"

# Type-check backend
Print-Info "Type-checking backend..."
if ($Verbose) {
    pnpm --filter @repo/api typecheck
} else {
    pnpm --filter @repo/api typecheck 2>&1 | Out-Null
}
Print-Success "Backend type-check passed"

# Build backend
Print-Info "Building backend..."
if ($Verbose) {
    pnpm --filter @repo/api build
} else {
    pnpm --filter @repo/api build 2>&1 | Out-Null
}
Print-Success "Backend built"

# Verify dist directory
if (Test-Path "apps\api\dist") {
    Print-Success "Backend dist directory exists"
} else {
    Print-Error "Backend dist directory not found"
    exit 1
}

# Phase 6: Docker (if not skipped)
if (-not $SkipDocker) {
    Print-Phase "Phase 6: Docker"

    # Build Docker images
    Print-Info "Building Docker images..."
    if ($Verbose) {
        & $ComposeCmd build
    } else {
        & $ComposeCmd build 2>&1 | Out-Null
    }
    Print-Success "Docker images built"

    # Start services
    Print-Info "Starting Docker services..."
    & $ComposeCmd up -d 2>&1 | Out-Null
    Print-Success "Docker services started"

    # Wait for services to be ready
    Print-Info "Waiting for services to be ready (30s)..."
    Start-Sleep -Seconds 30

    # Run migrations
    Print-Info "Running database migrations..."
    if ($Verbose) {
        & $ComposeCmd exec -T api pnpm prisma:migrate:deploy
    } else {
        & $ComposeCmd exec -T api pnpm prisma:migrate:deploy 2>&1 | Out-Null
    }
    Print-Success "Database migrations complete"

    # Test API health check
    Print-Info "Testing API health check..."
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -UseBasicParsing -ErrorAction Stop
        if ($Response.StatusCode -eq 200) {
            Print-Success "API health check passed"
        } else {
            throw "Unexpected status code: $($Response.StatusCode)"
        }
    } catch {
        Print-Error "API health check failed"
        & $ComposeCmd logs api
        exit 1
    }

    # Test web app
    Print-Info "Testing web app..."
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -ErrorAction Stop
        if ($Response.StatusCode -eq 200) {
            Print-Success "Web app accessible"
        } else {
            throw "Unexpected status code: $($Response.StatusCode)"
        }
    } catch {
        Print-Error "Web app not accessible"
        & $ComposeCmd logs web
        exit 1
    }

    # Stop services
    Print-Info "Stopping Docker services..."
    & $ComposeCmd down 2>&1 | Out-Null
    Print-Success "Docker services stopped"
} else {
    Print-Info "Skipping Docker tests (-SkipDocker flag set)"
}

# Summary
Print-Phase "Test Summary"

$EndTime = Get-Date
$Duration = $EndTime - $StartTime
$Minutes = [math]::Floor($Duration.TotalMinutes)
$Seconds = $Duration.Seconds

Write-Host ""
Print-Success "All tests passed!"
Write-Host ""
Print-Info "Total time: ${Minutes}m ${Seconds}s"
Write-Host ""
Write-Host "✓ Monorepo setup verified" -ForegroundColor Green
Write-Host "✓ Shared types build and type-check passed" -ForegroundColor Green
Write-Host "✓ Frontend build and type-check passed" -ForegroundColor Green
Write-Host "✓ Backend build and type-check passed" -ForegroundColor Green
if (-not $SkipDocker) {
    Write-Host "✓ Docker services build and run successfully" -ForegroundColor Green
}
Write-Host ""
Print-Info "Next steps:"
Write-Host "  1. Start development: pnpm dev"
Write-Host "  2. Or use Docker: pnpm docker:dev"
Write-Host "  3. Read detailed test plans: TEST_PLAN.md"
Write-Host ""
Print-Success "Your monorepo is ready! 🚀"
