# @repo/api - Learn Session Planner Backend

NestJS REST API with Prisma ORM and PostgreSQL for the Learn Session Planner application.

## Tech Stack

- **NestJS 10** - Node.js framework for scalable server-side applications
- **Prisma 6** - Next-generation ORM for TypeScript & Node.js
- **PostgreSQL** - Powerful, open-source relational database
- **TypeScript 5.6** - Strongly typed JavaScript
- **class-validator & class-transformer** - DTO validation and transformation

## Project Structure

```
src/
├── main.ts              # Application entry point
├── app.module.ts        # Root module
├── app.controller.ts    # Root controller (health check)
├── app.service.ts       # Root service
├── common/              # Shared utilities, guards, interceptors
│   └── prisma/          # Prisma service and module
├── modules/             # Feature modules (users, sessions, etc.)
└── config/              # Configuration services

prisma/
├── schema.prisma        # Database schema
├── migrations/          # Migration history (committed to git)
└── seed.ts              # Database seeding script
```

## Prerequisites

- Node.js 18+ (or 20+ recommended)
- PostgreSQL 14+ (local installation or Docker)
- pnpm 9.x

## Getting Started

### 1. Install dependencies

From monorepo root:

```bash
pnpm install
```

### 2. Set up environment variables

```bash
cd apps/api
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

Example `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/learn_session_planner?schema=public"
PORT=4000
NODE_ENV=development
```

### 3. Set up the database

```bash
# Generate Prisma Client
pnpm --filter @repo/api prisma:generate

# Run migrations
pnpm --filter @repo/api prisma:migrate:dev

# Seed database (optional)
pnpm --filter @repo/api prisma:seed
```

### 4. Run development server

```bash
pnpm --filter @repo/api start:dev
# Or from this directory: pnpm start:dev
```

API will be available at `http://localhost:4000/api`

### 5. Build for production

```bash
pnpm --filter @repo/api build
```

### 6. Run production build

```bash
pnpm --filter @repo/api start:prod
```

## Available Scripts

| Script                    | Description                                  |
| ------------------------- | -------------------------------------------- |
| `pnpm start:dev`          | Start dev server with hot-reload             |
| `pnpm start:debug`        | Start in debug mode                          |
| `pnpm build`              | Build for production                         |
| `pnpm start:prod`         | Run production build                         |
| `pnpm typecheck`          | Type-check without building                  |
| `pnpm prisma:generate`    | Generate Prisma Client                       |
| `pnpm prisma:migrate:dev` | Create and apply migrations                  |
| `pnpm prisma:migrate:deploy` | Apply migrations (production)             |
| `pnpm prisma:studio`      | Open Prisma Studio (database GUI)            |
| `pnpm prisma:seed`        | Seed database with test data                 |

## Environment Variables

| Variable          | Description                                  | Default                  |
| ----------------- | -------------------------------------------- | ------------------------ |
| `DATABASE_URL`    | PostgreSQL connection string                 | Required                 |
| `PORT`            | API server port                              | 4000                     |
| `NODE_ENV`        | Environment (development, production, test)  | development              |
| `JWT_SECRET`      | JWT signing secret (for future auth)         | Required in production   |
| `JWT_EXPIRES_IN`  | Token expiration (e.g., 7d, 24h)             | 7d                       |
| `CORS_ORIGIN`     | Allowed frontend origin                      | http://localhost:3000    |

## Database Migrations

### Development Workflow

1. Modify `prisma/schema.prisma`
2. Run `pnpm prisma:migrate:dev --name <migration_name>`
3. Prisma generates SQL migration and applies it
4. Commit the migration files to git

### Production Deployment

1. Migrations are committed to git
2. CI/CD runs `pnpm prisma:migrate:deploy`
3. **Never** run `migrate:dev` in production

## API Endpoints

All endpoints are prefixed with `/api`.

### Health Check

- `GET /api` - Welcome message
- `GET /api/health` - Health status (for Docker/K8s probes)

### Future Endpoints

- `/api/users` - User management
- `/api/sessions` - Learning sessions CRUD
- `/api/progress` - Progress tracking
- `/api/auth` - Authentication (login, register, refresh)

## Path Aliases

- `@modules/*` → `src/modules/*`
- `@common/*` → `src/common/*`
- `@config/*` → `src/config/*`
- `@/*` → `src/*`

Example:

```typescript
import { PrismaService } from '@common/prisma/prisma.service';
```

## Prisma Studio

Open a visual database editor:

```bash
pnpm prisma:studio
```

Access at `http://localhost:5555`

## Docker

The API is containerized with a multi-stage Dockerfile optimized for production.

### Docker Development

Run the API with hot-reload in Docker:

```bash
# From monorepo root
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up api

# Or start all services
pnpm docker:dev
```

**Development features:**
- Source code mounted for hot-reload
- Prisma migrations run automatically
- Debug port 9229 exposed
- Connected to dockerized PostgreSQL

### Docker Production

Build and run production image:

```bash
# Build production image
docker build -f Dockerfile -t lsp-api:latest .

# Run production container
docker run -d \
  -p 4000:4000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="your-secret" \
  lsp-api:latest

# Or use docker-compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Dockerfile Stages

1. **dependencies** - Install pnpm and project dependencies
2. **builder** - Build shared-types, generate Prisma Client, build NestJS
3. **production** - Minimal runtime image with built application (~200MB)

### Docker Environment Variables

See root [.env.docker.example](../../.env.docker.example) for all configuration options.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret

### Health Check

The Dockerfile includes a health check that verifies:
- HTTP server is responding on port 4000
- `/api/health` endpoint returns 200 OK

```bash
# Check container health
docker ps
# Look for "healthy" status
```

### Database Migrations in Docker

**Development:**
Migrations run automatically via `pnpm prisma:migrate:dev` on startup.

**Production:**
The Prisma Client is pre-generated and copied from the builder stage. Migrations should be run separately as an init job or manually before deploying:

```bash
# Run migrations as a one-off command
docker-compose -f docker-compose.yml -f docker-compose.prod.yml run --rm api sh -c "cd apps/api && pnpm prisma:migrate:deploy"
```

### Prisma in Docker

Prisma requires OpenSSL, which is installed in the Dockerfile:

```dockerfile
RUN apk add --no-cache openssl
```

The Prisma Client is generated during the build stage and copied to the production image for optimal performance.

## Future Enhancements

- Authentication & authorization (JWT, Passport.js)
- Role-based access control (RBAC)
- API documentation (Swagger/OpenAPI)
- Testing (Jest, Supertest)
- Logging (Winston, Pino)
- Rate limiting
- Caching (Redis)
- File uploads (AWS S3, local storage)
- WebSockets (for real-time features)

## Troubleshooting

### Prisma Client not found

```bash
pnpm prisma:generate
```

### Migration errors

```bash
# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset
```

### Connection errors

- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify credentials and database exists
- Create database if needed: `createdb learn_session_planner`

## Learn More

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
