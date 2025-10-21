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
# Start the web frontend (runs on http://localhost:3000)
pnpm dev:web

# Start the API backend (in another terminal, runs on http://localhost:4000)
pnpm dev:api

# Or run both concurrently
pnpm dev:all
```

**Web App:** http://localhost:3000
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

## Docker Setup (coming in later phase)

Docker Compose will orchestrate the following services:
- PostgreSQL database
- NestJS API server
- React web application

Configuration and setup instructions will be added once the applications are scaffolded.

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

- **Web App** runs on http://localhost:3000
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
