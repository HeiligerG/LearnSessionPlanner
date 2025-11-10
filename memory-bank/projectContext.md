# Learn Session Planner - Project Context

## Overview

**Project Name:** `learn-session-planner`

**Description:** A monorepo-based learning session planner for tracking daily, weekly, and custom learning sessions across school and programming topics. This entire project was created with AI assistance (Claude Code) - not a single line was written manually.

**Philosophy:** The project explores AI capabilities by building something useful, demonstrating that learning to use AI tools effectively is as valuable as traditional programming skills.

---

## Tech Stack

### Architecture
- **Monorepo Structure:** pnpm workspaces with clear separation of concerns
  - `apps/web` - React Frontend
  - `apps/api` - NestJS Backend
  - `packages/shared-types` - Shared TypeScript types for end-to-end type safety

### Frontend (`apps/web`)
- **Framework:** React 18.3 with TypeScript
- **Build Tool:** Vite 6.0
- **Styling:** Tailwind CSS 3.4
- **Routing:** React Router 6.28
- **State Management:** React Query (@tanstack/react-query 5.62) with optimistic updates
- **UI Components:** Lucide React icons, Recharts for data visualization, Sonner for toasts
- **Features:**
  - Gamification system (achievements, streaks, XP levels)
  - Smart session suggestions based on learning patterns
  - Bulk operations for sessions
  - Statistics with insights and export (CSV/JSON)
  - Dark mode support

### Backend (`apps/api`)
- **Framework:** NestJS 10.4 with TypeScript
- **Database:** PostgreSQL 14+ with Prisma ORM 6.1
- **Authentication:** JWT with refresh tokens (Passport, argon2 for hashing)
- **Security:** Helmet, CSRF protection, rate limiting (Throttler)
- **Validation:** class-validator, class-transformer
- **File Processing:** CSV parsing, XML parsing (for import features)
- **Features:**
  - User authentication & authorization
  - Session management with CRUD operations
  - Gamification endpoints (achievements, streaks, levels)
  - Smart suggestions based on user patterns
  - Template system
  - Statistics and analytics
  - Bulk operations and export

### Shared Packages
- **`@repo/shared-types`:** Type-safe contracts between frontend and backend
  - DTOs for API requests/responses
  - Entity types
  - No build step (uses TypeScript source directly via project references)

### Infrastructure
- **Package Manager:** pnpm 9.15.4 (required)
- **Node.js:** 18+ (20+ recommended)
- **Database:** PostgreSQL 14+ (local or Docker)
- **Containerization:** Docker & Docker Compose with multi-stage builds
  - Separate dev/prod configurations
  - Health checks and resource limits
  - Optimized image sizes (~50MB web, ~200MB api)

---

## Build & Run

### Package Manager
- **Primary:** `pnpm` (version 9.15.4)
- **Why pnpm:** Efficient disk usage, fast, built-in workspace support

### Development Commands
```bash
# Install all dependencies
pnpm install

# Frontend dev server (http://localhost:5173)
pnpm dev:web

# Backend dev server (http://localhost:4000)
pnpm dev:api

# Run both frontend and backend concurrently
pnpm dev:all

# Watch mode for shared types (auto-rebuild on changes)
pnpm dev:shared-types
```

### Build Commands
```bash
# Build entire monorepo (shared-types first, then all apps)
pnpm build

# Build only shared types
pnpm build:shared-types

# Build only API
pnpm build:api
```

### Type Checking
```bash
# Type-check all packages
pnpm typecheck

# Type-check only shared-types
pnpm typecheck:shared-types
```

### Database Management (Prisma)
```bash
# Generate Prisma Client (after schema changes)
pnpm prisma:generate

# Create and apply migrations
pnpm prisma:migrate

# Open Prisma Studio (database GUI at http://localhost:5555)
pnpm prisma:studio

# Seed database with test data
pnpm --filter @repo/api prisma:seed
```

### Docker Commands
```bash
# Build all Docker images
pnpm docker:build

# Start development environment (hot-reload enabled)
pnpm docker:dev

# Start development in detached mode
pnpm docker:dev:detach

# Start production environment
pnpm docker:prod

# Stop all containers
pnpm docker:down

# View logs (all services)
pnpm docker:logs

# Clean up (remove volumes, images)
pnpm docker:clean
```

---

## Architecture (High-Level)

### Monorepo Structure
```
learn-session-planner/
├── apps/
│   ├── web/              # React SPA (Vite + TypeScript + Tailwind)
│   │   ├── src/
│   │   │   ├── components/   # Reusable UI components
│   │   │   │   ├── calendar/
│   │   │   │   ├── common/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── gamification/
│   │   │   │   ├── sessions/
│   │   │   │   ├── statistics/
│   │   │   │   ├── suggestions/
│   │   │   │   └── templates/
│   │   │   ├── contexts/     # React Context providers
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── pages/        # Route components
│   │   │   ├── services/     # API client
│   │   │   └── utils/        # Helper functions
│   │   └── public/
│   │
│   └── api/              # NestJS REST API
│       ├── src/
│       │   ├── common/       # Shared utilities (Prisma service, guards, decorators)
│       │   ├── modules/      # Feature modules (sessions, auth, templates, users)
│       │   └── config/       # Configuration services
│       └── prisma/           # Database schema, migrations, seed
│
├── packages/
│   ├── shared-types/     # Shared TypeScript types (DTOs, entities)
│   └── eslint-config/    # (Future) Shared ESLint config
│
├── memory-bank/          # AI Agent context and decision logs
├── docker-compose.yml    # Base Docker Compose config
├── docker-compose.dev.yml    # Development overrides
├── docker-compose.prod.yml   # Production overrides
├── pnpm-workspace.yaml   # Workspace configuration
└── package.json          # Root package with workspace scripts
```

### Key Architectural Patterns
- **Monorepo Benefits:** Shared code, consistent tooling, atomic commits across stack
- **Type Safety:** End-to-end TypeScript with shared types package
- **Separation of Concerns:** Clear boundaries between apps and packages
- **Modular Backend:** NestJS modules for each feature domain
- **React Query:** Client-side caching with optimistic updates for instant UX
- **Prisma ORM:** Type-safe database access with automatic migrations

---

## Important Commands

### Linting & Formatting
```bash
# Lint all packages
pnpm lint:all

# Lint and auto-fix all packages
pnpm lint:fix

# Lint only web app
pnpm --filter @repo/web lint
```

**Note:** Currently using ESLint for web app. Consistent formatting rules to be added later.

### Testing
**Status:** ⚠️ **No test suites currently configured**

**Future TODO:**
- Add Jest/Vitest for unit tests
- Add Testing Library for React component tests
- Add E2E tests (Playwright/Cypress)
- Configure test scripts in package.json

### Cleanup
```bash
# Remove all node_modules, dist, build artifacts
pnpm clean
```

### Workspace Commands (pnpm)
```bash
# Run command in specific package
pnpm --filter @repo/web <command>
pnpm --filter @repo/api <command>

# Install dependency in specific package
pnpm --filter @repo/web add <package>

# Run command in all packages
pnpm -r <command>

# Run in all apps only
pnpm --filter "./apps/*" <command>
```

---

## Development Workflow

1. **Start Development:**
   - Option A: Run frontend and backend separately in different terminals
     ```bash
     pnpm dev:web    # Terminal 1
     pnpm dev:api    # Terminal 2
     ```
   - Option B: Run both concurrently
     ```bash
     pnpm dev:all
     ```
   - Option C: Use Docker for full environment
     ```bash
     pnpm docker:dev
     ```

2. **Database Changes:**
   - Edit `apps/api/prisma/schema.prisma`
   - Generate client: `pnpm prisma:generate`
   - Create migration: `pnpm prisma:migrate`

3. **Shared Types Changes:**
   - Edit files in `packages/shared-types/src/`
   - Changes are immediately reflected in both apps (no build step)
   - Run `pnpm typecheck` to verify

4. **Before Committing:**
   - Run `pnpm typecheck` to catch type errors
   - Run `pnpm lint:all` to check code style
   - Verify both frontend and backend compile without errors

---

## Project Status

### Recent Major Features (Latest Commit)
- ✅ React Query integration with optimistic UI updates
- ✅ Gamification system (achievements, streaks, XP levels)
- ✅ Smart session suggestions based on learning patterns
- ✅ Bulk operations (select, update, delete, export)
- ✅ Enhanced statistics with InsightsPanel
- ✅ CSV/JSON export for sessions and statistics
- ✅ Fixed NestJS route ordering bug (specific routes before `:id` param routes)

### Known Limitations
- No automated tests yet
- No CI/CD pipeline configured
- Mobile app (React Native) planned but not started

---

## Key Decisions & Trade-offs

See `memory-bank/decisionLog.md` for detailed decision history.

**Major Choices:**
- **pnpm over npm/yarn:** Better performance, disk efficiency, and monorepo support
- **NestJS over Express:** Structure, TypeScript support, built-in DI and modules
- **Prisma over TypeORM:** Better DX, type safety, migrations workflow
- **React Query:** Client-side caching reduces server load, optimistic updates improve UX
- **Monorepo:** Share types and tooling, but increased complexity in setup

---

## Useful Resources

- **Frontend:** http://localhost:5173 (dev)
- **Backend:** http://localhost:4000 (dev)
- **Prisma Studio:** http://localhost:5555 (when running)
- **Docker Web:** http://localhost:5173 (when using Docker)
- **Docker API:** http://localhost:4000 (when using Docker)

---

*Last Updated: 2025-01-10*
