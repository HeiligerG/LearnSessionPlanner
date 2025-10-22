# Learn Session Planner

A monorepo-based learning session planner for tracking daily, weekly, and custom learning sessions across school and programming topics.

## Tech Stack

- **Frontend:** React (Vite + TypeScript)
- **Backend:** NestJS (TypeScript)
- **Database:** PostgreSQL with Prisma ORM
- **Package Manager:** pnpm (workspaces)
- **Containerization:** Docker & Docker Compose
- **Future:** React Native for mobile support

## Project Structure

```
learn-session-planner/
├── apps/
│   ├── web/          # React frontend (Vite + TypeScript + React Router)
│   └── api/          # NestJS backend (TypeScript + Prisma + PostgreSQL)
│       ├── src/
│       │   ├── common/      # Shared utilities (Prisma service, etc.)
│       │   ├── modules/     # Feature modules
│       │   └── config/      # Configuration services
│       └── prisma/          # Database schema and migrations
├── packages/
│   ├── shared-types/ # Shared TypeScript types for API contracts
│   └── eslint-config/# Shared linting config (optional)
├── pnpm-workspace.yaml
├── package.json
├── .npmrc
└── docker-compose.yml (coming soon)
```

## Prerequisites

- Node.js 18+ (or 20+ recommended)
- pnpm 9.x (`npm install -g pnpm`)
- PostgreSQL 14+ (local installation or Docker)
- Docker & Docker Compose (for containerized development)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Database Setup

Set up the PostgreSQL database and run migrations:

```bash
# Set up environment variables
cd apps/api
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Generate Prisma Client and run migrations
cd ../..
pnpm prisma:generate
pnpm prisma:migrate

# Optional: Seed database with test data
pnpm --filter @repo/api prisma:seed
```

### 3. Development

Start the development servers:

```bash
# Start the web frontend (runs on http://localhost:5173)
pnpm dev:web

# Start the API backend (in another terminal, runs on http://localhost:4000)
pnpm dev:api

# Or run both concurrently
pnpm dev:all
```

**Web App:** http://localhost:5173
**API:** http://localhost:4000

### 4. Build all packages

```bash
pnpm build
```

### 5. Clean workspace

```bash
pnpm clean
```

## Database Management

The API uses Prisma ORM with PostgreSQL.

**Generate Prisma Client:**

```bash
pnpm prisma:generate
```

**Create and apply migrations:**

```bash
pnpm prisma:migrate
```

**Open Prisma Studio (database GUI):**

```bash
pnpm prisma:studio
```

Access at http://localhost:5555

**Seed database:**

```bash
pnpm --filter @repo/api prisma:seed
```

For more details, see `apps/api/README.md`.

## Workspace Commands

pnpm workspaces provide powerful filtering capabilities for running commands in specific packages:

- **Run command in specific package:**
  ```bash
  pnpm --filter @repo/web dev
  ```

- **Run in all apps:**
  ```bash
  pnpm --filter "./apps/*" build
  ```

- **Install dependency in specific package:**
  ```bash
  pnpm --filter @repo/api add express
  ```

- **Run command in all packages:**
  ```bash
  pnpm -r test
  ```

## Docker Setup

The project is fully containerized using Docker and Docker Compose with multi-stage builds for optimal image sizes.

### Quick Start with Docker

#### Development Mode

Start all services with hot-reload:

```bash
# Copy environment file
cp .env.docker.example .env.docker

# Start all services (postgres, api, web)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or use the npm script
pnpm docker:dev
```

**Services:**
- Web: http://localhost:5173 (Vite dev server with hot-reload)
- API: http://localhost:4000 (NestJS with hot-reload)
- PostgreSQL: localhost:5432

**Development features:**
- Source code mounted as volumes for hot-reload
- Database changes persist in named volume
- Debug port 9229 exposed for NestJS debugging

#### Production Mode

Build and run optimized production images:

```bash
# Copy environment file and set production values
cp .env.docker.example .env.docker
# Edit .env.docker with production credentials

# Start with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.docker up -d

# Or use the npm script
pnpm docker:prod
```

**Production features:**
- Multi-stage builds with minimal final images
- Health checks for all services
- Resource limits and restart policies
- Environment-based configuration (use .env.docker for production secrets)

### Docker Commands

```bash
# Build all images
pnpm docker:build

# Start development environment
pnpm docker:dev

# Start production environment
pnpm docker:prod

# Stop all services
pnpm docker:down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f api
```

### Image Sizes

- **web:** ~50MB (nginx + static files)
- **api:** ~200MB (Node.js + Prisma + built application)
- **postgres:** ~240MB (official PostgreSQL 16 Alpine)

### Environment Variables

See [.env.docker.example](.env.docker.example) for all available configuration options.

**Required variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token signing secret
- `VITE_API_URL` - API URL for web app (build-time)

### Docker Best Practices

This setup follows 2025 Docker best practices:
- Multi-stage builds for minimal image sizes
- Health checks for container orchestration
- BuildKit cache mounts for faster builds
- Separate dev/prod configurations
- Environment-based configuration for credentials
- Resource limits in production
- Auto-generated container names to avoid conflicts

## Shared Packages

### @repo/shared-types

Shared TypeScript type definitions used across frontend and backend. Provides type-safe contracts for API communication.

**Usage:**
```typescript
import { User, Session, CreateSessionDto } from '@repo/shared-types';
```

See `packages/shared-types/README.md` for details.

**Key features:**
- Type safety across the full stack
- Single source of truth for data structures
- No build step required (uses TypeScript source files directly)
- TypeScript project references for incremental builds

## Development Workflow

- **Web App** runs on http://localhost:5173
- **API** runs on http://localhost:4000
- Both support hot-reload during development
- API client is configured via `VITE_API_URL` in `apps/web/.env`
- Shared types are automatically linked via pnpm workspaces
- Changes to shared-types are immediately reflected in both apps (no build step needed)

**Type-checking:**
```bash
# Type-check all packages
pnpm typecheck

# Type-check shared-types only
pnpm typecheck:shared-types
```

**Future:**
- Debugging frontend and backend
- Running tests
- CI/CD pipeline

## Contributing

This is a personal learning project. If you're interested in contributing:

1. Follow the existing code style
2. Write meaningful commit messages
3. Test your changes before submitting
4. Create descriptive pull requests

## License

MIT

---

Built with love and a desire to learn.
