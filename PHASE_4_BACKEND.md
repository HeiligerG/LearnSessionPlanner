# Phase 4: Backend Tests

**Objective:** Verify that the NestJS backend with Prisma ORM connects to PostgreSQL and serves API endpoints correctly.

**Duration:** 30-45 minutes
**Prerequisites:** Phase 1, 2, and 3 must be completed successfully. PostgreSQL must be installed and running (local or Docker).

---

## Test 4.1: Start PostgreSQL Database

### Option A: Using Docker (Recommended)

**Command:**
```bash
docker run --name learn-planner-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=learnsession \
  -p 5432:5432 \
  -d postgres:16-alpine
```

**Expected Output:**
```
Unable to find image 'postgres:16-alpine' locally
16-alpine: Pulling from library/postgres
...
Status: Downloaded newer image for postgres:16-alpine
abc123def456...
```

**Success Criteria:**
- Container starts successfully
- Returns container ID

**Verify:**
```bash
docker ps
```

Should show running postgres container.

### Option B: Using Local PostgreSQL

**Steps:**
1. Ensure PostgreSQL service is running
2. Create database:
   ```bash
   createdb learnsession
   ```
   Or using psql:
   ```sql
   CREATE DATABASE learnsession;
   ```

**Success Criteria:**
- PostgreSQL service is running
- Database "learnsession" exists and is accessible

**Verify:**
```bash
psql -U postgres -l
```

Should list "learnsession" database.

---

## Test 4.2: Configure Environment Variables

**Command:**
```bash
cd apps/api && cp .env.example .env
```

**Action:** Edit `.env` file with correct values

**Required Configuration:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/learnsession?schema=public"
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d
```

**Success Criteria:**
- `.env` file exists in `apps/api/`
- All required variables are set
- DATABASE_URL matches your PostgreSQL configuration
- PORT is 4000 (or another available port)

**Notes:**
- Adjust DATABASE_URL if using different credentials or host
- JWT_SECRET should be changed in production
- CORS_ORIGIN should match frontend URL

---

## Test 4.3: Generate Prisma Client

**Command:**
```bash
pnpm --filter @repo/api prisma:generate
```

**Expected Output:**
```
> @repo/api@1.0.0 prisma:generate
> prisma generate

Prisma schema loaded from prisma/schema.prisma
✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client in XXXms
```

**Duration:** 5-15 seconds

**Success Criteria:**
- Generates @prisma/client in node_modules
- No errors during generation
- Exit code 0

**Troubleshooting:**
- **Cannot connect to database**: Check DATABASE_URL format
- **Syntax error in schema**: Review prisma/schema.prisma
- **Missing prisma**: Run `pnpm install` again

---

## Test 4.4: Run Database Migrations

**Command:**
```bash
pnpm --filter @repo/api prisma:migrate:dev --name init
```

**Expected Output:**
```
> @repo/api@1.0.0 prisma:migrate:dev
> prisma migrate dev --name init

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "learnsession", schema "public" at "localhost:5432"

Applying migration `20250123000000_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20250123000000_init/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client in XXXms
```

**Success Criteria:**
- Creates `apps/api/prisma/migrations` directory
- Creates migration SQL files
- Applies migration to database
- Regenerates Prisma Client
- No migration errors

**Troubleshooting:**
- **Connection error**: Verify PostgreSQL is running and DATABASE_URL is correct
- **Migration fails**: Check schema.prisma syntax
- **Already migrated**: If database already has migrations, this is expected

---

## Test 4.5: Verify Database Schema

**Command:**
```bash
pnpm --filter @repo/api prisma:studio
```

**Expected Behavior:**
- Opens Prisma Studio in browser
- URL: http://localhost:5555
- Shows database GUI

**Expected Result:**
- **"users" table** with columns:
  - id (String, @id, @default(cuid()))
  - email (String, @unique)
  - name (String, optional)
  - password (String)
  - createdAt (DateTime, @default(now()))
  - updatedAt (DateTime, @updatedAt)
- Table is empty (no data yet)

**Success Criteria:**
- Database schema matches Prisma schema
- All tables and columns exist
- Prisma Studio loads without errors

**Note:** Press Ctrl+C in terminal to stop Prisma Studio

---

## Test 4.6: Type-Check Backend

**Command:**
```bash
pnpm --filter @repo/api typecheck
```

**Expected Output:**
```
> @repo/api@1.0.0 typecheck
> tsc --noEmit
```

**Success Criteria:**
- Compilation succeeds with no errors
- No TypeScript errors or warnings
- Exit code 0

**Troubleshooting:**
- **Import errors**: Check shared-types is built
- **Prisma Client errors**: Run `pnpm prisma:generate`
- **Type errors**: Review and fix TypeScript issues

---

## Test 4.7: Start API Development Server

**Command:**
```bash
pnpm --filter @repo/api start:dev
```

**Expected Output:**
```
> @repo/api@1.0.0 start:dev
> nest start --watch

[Nest] 12345  - 01/23/2025, 12:00:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/23/2025, 12:00:00 PM     LOG [InstanceLoader] AppModule dependencies initialized +XX ms
[Nest] 12345  - 01/23/2025, 12:00:00 PM     LOG [InstanceLoader] ConfigModule dependencies initialized +X ms
[Nest] 12345  - 01/23/2025, 12:00:00 PM     LOG [InstanceLoader] PrismaModule dependencies initialized +X ms
[Nest] 12345  - 01/23/2025, 12:00:00 PM     LOG [InstanceLoader] AppModule dependencies initialized +X ms
[Nest] 12345  - 01/23/2025, 12:00:00 PM     LOG [PrismaService] ✅ Database connected successfully
[Nest] 12345  - 01/23/2025, 12:00:00 PM     LOG [NestApplication] Nest application successfully started +X ms
[Nest] 12345  - 01/23/2025, 12:00:00 PM     LOG [NestApplication] 🚀 API server is running on: http://localhost:4000
[Nest] 12345  - 01/23/2025, 12:00:00 PM     LOG [NestApplication] 📚 Health check available at: http://localhost:4000/api/health
```

**Duration:** Server starts in 3-10 seconds

**Success Criteria:**
- Server starts without errors
- Database connection succeeds ("✅ Database connected successfully")
- Listens on http://localhost:4000
- Shows health check endpoint
- No error messages

**Troubleshooting:**
- **Port 4000 in use**: Change PORT in .env or kill conflicting process
- **Database connection fails**: Check DATABASE_URL and PostgreSQL status
- **Prisma Client errors**: Run `pnpm prisma:generate` again
- **Module not found**: Run `pnpm install`

**Note:** Keep this server running for subsequent tests

---

## Test 4.8: Test Health Check Endpoint

**Command:**
```bash
curl http://localhost:4000/api/health
```

**Alternative:** Open http://localhost:4000/api/health in browser

**Expected Output:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-23T12:00:00.000Z"
}
```

**Success Criteria:**
- Returns HTTP 200 OK
- Returns JSON response
- Contains "status": "ok"
- Contains "timestamp" with ISO date

**Troubleshooting:**
- **Connection refused**: Ensure API server is running
- **404 Not Found**: Check URL includes /api prefix

---

## Test 4.9: Test Root Endpoint

**Command:**
```bash
curl http://localhost:4000/api
```

**Alternative:** Open http://localhost:4000/api in browser

**Expected Output:**
```json
"Learn Session Planner API - v1.0"
```

**Success Criteria:**
- Returns HTTP 200 OK
- Returns welcome message as JSON string

---

## Test 4.10: Test Non-Existent Endpoint

**Command:**
```bash
curl http://localhost:4000/api/nonexistent
```

**Expected Output:**
```json
{
  "statusCode": 404,
  "message": "Cannot GET /api/nonexistent",
  "error": "Not Found"
}
```

**Success Criteria:**
- Returns HTTP 404 Not Found
- Returns JSON error response
- NestJS handles 404s gracefully

---

## Test 4.11: Verify CORS Configuration

**Command:**
```bash
curl -H "Origin: http://localhost:5173" -I http://localhost:4000/api/health
```

**Expected Output (headers):**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
Content-Type: application/json
...
```

**Success Criteria:**
- Response includes `Access-Control-Allow-Origin: http://localhost:5173`
- CORS headers are present
- Frontend can communicate with backend

**Troubleshooting:**
- **CORS headers missing**: Check CORS_ORIGIN in .env and main.ts configuration
- **Wrong origin**: Verify CORS_ORIGIN matches frontend URL

---

## Test 4.12: Test Global Prefix

**Command:**
```bash
curl http://localhost:4000/health
```

(Note: without /api prefix)

**Expected Output:**
```json
{
  "statusCode": 404,
  "message": "Cannot GET /health",
  "error": "Not Found"
}
```

**Success Criteria:**
- Returns HTTP 404 Not Found
- Confirms endpoints require /api prefix
- Global prefix configuration is working

---

## Test 4.13: Verify Shared Types Import

**Action:** Check server logs during startup

**Expected Result:**
- No import errors for @repo/shared-types
- Server starts successfully
- All modules initialize

**Success Criteria:**
- Server starts without module resolution errors
- Shared types are accessible from backend

**Verify in Code:**
Open `apps/api/src/main.ts` and check for shared-types imports (if any).

---

## Test 4.14: Test Hot Reload (Watch Mode)

**Action:**
1. Keep API server running
2. Open `apps/api/src/app.service.ts` in editor
3. Change the return message:
   ```typescript
   return 'Learn Session Planner API - v1.0 - UPDATED';
   ```
4. Save the file

**Expected Result:**
- Terminal shows compilation messages
- Server restarts automatically
- New message takes effect within 2-5 seconds

**Verify:**
```bash
curl http://localhost:4000/api
```

Should show updated message.

**Success Criteria:**
- Changes trigger automatic restart
- No need to manually restart server
- Watch mode works correctly

---

## Test 4.15: Check Server Logs

**Action:** Review terminal output from API server

**Expected Observations:**
- All modules initialized successfully
- Database connection confirmed: "✅ Database connected successfully"
- No error messages
- CORS configuration logged (if enabled)
- Listening on correct port

**Success Criteria:**
- Clean startup with no errors
- All expected log messages present

---

## Test 4.16: Build for Production

**Command:**
```bash
pnpm --filter @repo/api build
```

**Expected Output:**
```
> @repo/api@1.0.0 build
> nest build

[... compilation output ...]
```

**Duration:** 10-30 seconds

**Success Criteria:**
- Build completes successfully
- Creates `apps/api/dist` directory
- No compilation errors
- Exit code 0

**Troubleshooting:**
- **TypeScript errors**: Fix errors and rebuild
- **Build fails**: Check nest-cli.json and tsconfig.json

---

## Test 4.17: Verify Production Build Output

**Command:**
```bash
ls apps/api/dist
```

**Windows Alternative:**
```cmd
dir apps\api\dist
```

**Expected Output:**
```
main.js
app.module.js
app.controller.js
app.service.js
common/
  prisma/
    prisma.module.js
    prisma.service.js
```

**Success Criteria:**
- All compiled JavaScript files exist
- Directory structure mirrors source structure
- No .ts files (only .js)

---

## Test 4.18: Test Production Build

**Command:**
```bash
pnpm --filter @repo/api start:prod
```

**Expected Output:**
Similar to dev mode but faster startup:
```
[Nest] 12345  - 01/23/2025, 12:00:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/23/2025, 12:00:00 PM     LOG [PrismaService] ✅ Database connected successfully
[Nest] 12345  - 01/23/2025, 12:00:00 PM     LOG [NestApplication] 🚀 API server is running on: http://localhost:4000
```

**Success Criteria:**
- Production build runs correctly
- Server starts faster than dev mode
- All endpoints work

**Test:**
```bash
curl http://localhost:4000/api/health
```

Should return health check response.

**Note:** Press Ctrl+C to stop, restart in dev mode if needed

---

## Test 4.19: Test Database Connection Resilience

**Test Scenario:** Temporarily losing database connection

**Steps:**
1. Keep API server running
2. Stop PostgreSQL:
   ```bash
   docker stop learn-planner-postgres
   ```
   Or stop local PostgreSQL service

3. Observe API logs

**Expected Result:**
- API logs connection errors
- API doesn't crash (graceful error handling)

**Steps to Recover:**
1. Restart PostgreSQL:
   ```bash
   docker start learn-planner-postgres
   ```
2. Observe API logs

**Expected Result:**
- API reconnects automatically
- No need to restart API server

**Success Criteria:**
- Graceful handling of database issues
- API remains running
- Automatic reconnection works

---

## Test 4.20: Verify Prisma Service

**Action:** Confirm PrismaService is properly initialized

**Expected Behavior:**
- PrismaService.onModuleInit() connects to database
- Log message: "✅ Database connected successfully"
- PrismaService.enableShutdownHooks() is configured

**Success Criteria:**
- Database connection is established during module initialization
- Prisma Client is ready to use
- Shutdown hooks are enabled for graceful shutdown

**Verify in Code:**
Review `apps/api/src/common/prisma/prisma.service.ts`

---

## Phase 4 Completion Checklist

Verify all items before proceeding to Phase 5:

- [ ] PostgreSQL is running (Docker or local)
- [ ] Environment variables configured in .env
- [ ] Prisma Client generated successfully
- [ ] Database migrations applied
- [ ] Database schema verified in Prisma Studio
- [ ] Backend type-checks successfully
- [ ] API server starts without errors
- [ ] Database connection succeeds
- [ ] Health check endpoint works (/api/health)
- [ ] Root endpoint works (/api)
- [ ] 404 handling works for non-existent endpoints
- [ ] CORS is configured correctly
- [ ] Global prefix (/api) works
- [ ] Shared types import correctly
- [ ] Hot reload works in watch mode
- [ ] Server logs are clean (no errors)
- [ ] Production build succeeds
- [ ] Production build output is correct
- [ ] Production mode runs successfully
- [ ] Database connection resilience tested

---

## Next Steps

✅ **If all tests pass**: Proceed to [PHASE_5_DOCKER.md](PHASE_5_DOCKER.md)

❌ **If any tests fail**: Resolve issues before continuing. Refer to [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common problems and solutions.

**Note:** Keep the API server running if you want to test integration with the frontend (Phase 6).

---

## Additional Notes

### Understanding NestJS Architecture

NestJS uses a modular architecture:
- **Modules**: Organize code into cohesive units (AppModule, PrismaModule)
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and data access
- **Providers**: Injectable dependencies

### Prisma ORM

Prisma provides:
- **Type-safe database access**: Generated types based on schema
- **Migration system**: Track and apply schema changes
- **Query builder**: Fluent API for database queries
- **Studio**: Visual database browser

### Common Issues

**Issue**: "Cannot connect to database"

**Solution**: Check DATABASE_URL format, verify PostgreSQL is running, check network/firewall

**Issue**: "Prisma Client not found"

**Solution**: Run `pnpm --filter @repo/api prisma:generate`

**Issue**: "Port 4000 already in use"

**Solution**: Change PORT in .env or kill the process using port 4000

**Issue**: CORS errors from frontend

**Solution**: Verify CORS_ORIGIN in .env matches frontend URL (http://localhost:5173)
