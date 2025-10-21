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
│   ├── web/          # React frontend (Vite)
│   └── api/          # NestJS backend
├── packages/
│   ├── shared-types/ # Shared TypeScript types
│   └── eslint-config/# Shared linting config (optional)
├── pnpm-workspace.yaml
├── package.json
├── .npmrc
└── docker-compose.yml (coming soon)
```

## Prerequisites

- Node.js 18+ (or 20+ recommended)
- pnpm 9.x (`npm install -g pnpm`)
- Docker & Docker Compose (for containerized development)
- PostgreSQL (via Docker or local install)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Development (coming soon)

```bash
pnpm dev
```

### 3. Build all packages

```bash
pnpm build
```

### 4. Clean workspace

```bash
pnpm clean
```

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

## Development Workflow (coming soon)

Detailed instructions for:
- Hot-reload development
- Debugging frontend and backend
- Running tests
- Database migrations with Prisma

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
