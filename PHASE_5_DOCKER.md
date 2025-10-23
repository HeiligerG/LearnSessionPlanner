# Phase 5: Docker Containerization Tests

**Objective:** Verify that all services can be containerized and orchestrated using Docker and Docker Compose.

**Duration:** 30-45 minutes
**Prerequisites:** Phase 1-4 must be completed successfully. Docker Desktop installed and running. Docker Compose 2.0+ available.

---

## Test 5.1: Verify Docker Installation

**Command:**
```bash
docker --version
```

**Expected Output:**
```
Docker version 20.10.x, build abc123
```

**Success Criteria:**
- Docker version is 20.10.0 or higher
- Docker is installed and accessible

**Troubleshooting:**
- Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
- Ensure Docker Desktop is running

---

## Test 5.2: Verify Docker Compose

**Command:**
```bash
docker-compose --version
```

**Alternative (newer syntax):**
```bash
docker compose version
```

**Expected Output:**
```
Docker Compose version v2.x.x
```

**Success Criteria:**
- Docker Compose version is 2.0.0 or higher

---

## Test 5.3: Check Docker Daemon

**Command:**
```bash
docker ps
```

**Expected Output:**
```
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

(May be empty if no containers running)

**Success Criteria:**
- Docker daemon is running
- Command executes without errors

**Troubleshooting:**
- Start Docker Desktop if not running
- Check Docker service status

---

## Test 5.4: Create Environment File

**Command:**
```bash
cp .env.docker.example .env
```

**Action:** Review and edit `.env` file if needed

**Default Configuration:**
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=learnsession
API_PORT=4000
WEB_PORT=5173
VITE_API_URL=http://localhost:4000/api
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/learnsession?schema=public
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

**Success Criteria:**
- `.env` file exists in repository root
- All required variables are set
- Default values should work for testing

---

## Test 5.5: Build Docker Images

**Command:**
```bash
docker-compose build
```

**Alternative:**
```bash
pnpm docker:build
```

**Expected Behavior:**
- Builds three images: postgres, api, web
- Shows multi-stage build progress
- Downloads base images if not cached

**Expected Output:**
```
[+] Building XXXs (3/3)
 => [postgres internal] load metadata for docker.io/library/postgres:16-alpine
 => [api internal] load metadata for docker.io/library/node:20-alpine
 => [web internal] load metadata for docker.io/library/node:20-alpine
...
[+] Building XXXs (XX/XX) FINISHED
```

**Duration:** 5-15 minutes (first build), faster on subsequent builds

**Success Criteria:**
- All images build without errors
- No build failures
- Images are created successfully

**Troubleshooting:**
- **No space left on device**: Run `docker system prune -a`
- **Build fails**: Check Dockerfile syntax and .dockerignore
- **pnpm install fails**: Check network connection, may need to retry

---

## Test 5.6: Verify Docker Images

**Command:**
```bash
docker images | grep learn
```

**Expected Output:**
```
learn-session-planner-api    latest   abc123def456   X minutes ago   XXX MB
learn-session-planner-web    latest   def456abc123   X minutes ago   XX MB
```

**Success Criteria:**
- Both api and web images exist
- Image sizes are reasonable:
  - API image: ~200-300 MB
  - Web image: ~50-100 MB (nginx-based)

---

## Test 5.7: Start Services with Docker Compose

**Command:**
```bash
docker-compose up
```

**Alternative (detached mode):**
```bash
docker-compose up -d
```

**Alternative (using pnpm script):**
```bash
pnpm docker:dev
```

**Expected Behavior:**
- Creates network "learn-session-planner_default"
- Creates volume "learn-session-planner_postgres_data"
- Starts postgres container
- Starts api container
- Starts web container
- Shows logs from all three services

**Expected Output:**
```
[+] Running 4/4
 ✔ Network learn-session-planner_default          Created
 ✔ Volume "learn-session-planner_postgres_data"   Created
 ✔ Container learn-session-planner-postgres-1     Started
 ✔ Container learn-session-planner-api-1          Started
 ✔ Container learn-session-planner-web-1          Started
```

**Duration:** 30-60 seconds for all services to start

**Success Criteria:**
- All containers start successfully
- No error messages in logs
- Services are "Up" status

**Note:** Use Ctrl+C to stop (or `docker-compose down` if running detached)

---

## Test 5.8: Verify Container Status

**Command:**
```bash
docker-compose ps
```

**Expected Output:**
```
NAME                              COMMAND                  STATUS         PORTS
learn-session-planner-api-1       "node dist/main.js"      Up (healthy)   0.0.0.0:4000->4000/tcp
learn-session-planner-postgres-1  "docker-entrypoint.s…"   Up (healthy)   0.0.0.0:5432->5432/tcp
learn-session-planner-web-1       "nginx -g 'daemon of…"   Up (healthy)   0.0.0.0:5173->8080/tcp
```

**Success Criteria:**
- All three services show "Up" status
- postgres: Up (healthy)
- api: Up (healthy)
- web: Up (healthy)

**Troubleshooting:**
- If any service is "Exit": Check logs with `docker-compose logs [service]`
- If "Restarting": Service is crashing, check logs

---

## Test 5.9: Check Container Logs

**Command:**
```bash
docker-compose logs -f api
```

**Expected Output:**
```
learn-session-planner-api-1  | [Nest] LOG [NestFactory] Starting Nest application...
learn-session-planner-api-1  | [Nest] LOG [PrismaService] ✅ Database connected successfully
learn-session-planner-api-1  | [Nest] LOG [NestApplication] 🚀 API server is running on: http://localhost:4000
```

**Success Criteria:**
- API starts successfully
- Connects to database
- No error messages

**Note:** Press Ctrl+C to stop following logs

---

## Test 5.10: Run Database Migrations in Container

**Command:**
```bash
docker-compose exec api pnpm prisma:migrate:deploy
```

**Expected Output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "learnsession"

1 migration found in prisma/migrations

Applying migration `20250123000000_init`

The following migration(s) have been applied:

migrations/
  └─ 20250123000000_init/
    └─ migration.sql
```

**Success Criteria:**
- Migrations run successfully in container
- Database schema is created

**Note:** This is required on first run

---

## Test 5.11: Test API Health Check (Docker)

**Command:**
```bash
curl http://localhost:4000/api/health
```

**Expected Output:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-23T12:00:00.000Z"
}
```

**Success Criteria:**
- API is accessible from host machine
- Returns health check response
- HTTP 200 OK

---

## Test 5.12: Test Web App (Docker)

**Action:** Open http://localhost:5173 in browser

**Expected Result:**
- Landing page loads correctly
- All styles and assets load
- No 502/503 errors

**Success Criteria:**
- Web app is accessible
- Nginx serves static files correctly
- Application functions properly

---

## Test 5.13: Test Frontend-Backend Communication

**Action:** Open browser console at http://localhost:5173

**Command in Console:**
```javascript
fetch('http://localhost:4000/api/health')
  .then(r => r.json())
  .then(console.log)
```

**Expected Output:**
```javascript
{status: 'ok', timestamp: '2025-01-23T12:00:00.000Z'}
```

**Success Criteria:**
- No CORS errors
- API responds
- Frontend can communicate with backend

---

## Test 5.14: Verify Docker Networks

**Command:**
```bash
docker network ls | grep learn
```

**Expected Output:**
```
abc123def456   learn-session-planner_default   bridge    local
```

**Success Criteria:**
- Custom network exists
- Allows containers to communicate

---

## Test 5.15: Verify Docker Volumes

**Command:**
```bash
docker volume ls | grep learn
```

**Expected Output:**
```
local     learn-session-planner_postgres_data
```

**Success Criteria:**
- Volume exists for database persistence

---

## Test 5.16: Test Container Networking

**Command:**
```bash
docker-compose exec api ping -c 3 postgres
```

**Expected Output:**
```
PING postgres (172.x.x.x): 56 data bytes
64 bytes from 172.x.x.x: seq=0 ttl=64 time=0.XXX ms
64 bytes from 172.x.x.x: seq=1 ttl=64 time=0.XXX ms
64 bytes from 172.x.x.x: seq=2 ttl=64 time=0.XXX ms
```

**Success Criteria:**
- API can reach postgres by service name
- Docker DNS resolution works

---

## Test 5.17: Test Development Mode with Hot Reload

**Command:**
```bash
docker-compose down
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

**Expected Behavior:**
- Starts services with source code mounted
- Enables hot reload for development

**Test:**
1. Edit a source file (e.g., `apps/web/src/pages/LandingPage.tsx`)
2. Save the file

**Expected Result:**
- Changes trigger rebuild/reload
- Updates appear in browser

**Success Criteria:**
- Hot reload works in containers
- Development workflow is functional

**Note:** Development mode may be slower than local development

---

## Test 5.18: Test Production Mode

**Command:**
```bash
docker-compose down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Alternative:**
```bash
pnpm docker:prod
```

**Expected Behavior:**
- Starts optimized production containers
- Uses production builds
- No source code mounted

**Success Criteria:**
- All services start in production mode
- NODE_ENV=production in API logs
- Optimized builds are used

**Verify:**
```bash
docker-compose logs api | grep NODE_ENV
```

---

## Test 5.19: Test Container Health Checks

**Command:**
```bash
docker inspect learn-session-planner-api-1 | grep -A 10 Health
```

**Expected Output:**
```json
"Health": {
  "Status": "healthy",
  "FailingStreak": 0,
  "Log": [
    {
      "Start": "2025-01-23T12:00:00Z",
      "End": "2025-01-23T12:00:01Z",
      "ExitCode": 0,
      "Output": ""
    }
  ]
}
```

**Success Criteria:**
- Health check is configured
- Status is "healthy"
- Health checks are passing

---

## Test 5.20: Test Container Restart Policies

**Action:**
1. Stop API container manually:
   ```bash
   docker stop learn-session-planner-api-1
   ```
2. Wait a few seconds
3. Check status:
   ```bash
   docker-compose ps
   ```

**Expected Result:**
- Container restarts automatically
- Restart policy works

**Success Criteria:**
- Container comes back up
- Restart policy: "unless-stopped"

---

## Test 5.21: Test Database Persistence

**Steps:**
1. Stop all containers:
   ```bash
   docker-compose down
   ```
2. Start containers again:
   ```bash
   docker-compose up -d
   ```
3. Check database:
   ```bash
   docker-compose exec api pnpm prisma:studio
   ```

**Expected Result:**
- Database data persists
- Migrations don't need to re-run
- Schema still exists

**Success Criteria:**
- Volume persists data across restarts

---

## Test 5.22: Test Prisma Studio in Container

**Command:**
```bash
docker-compose exec api pnpm prisma:studio
```

**Expected Behavior:**
- Opens Prisma Studio
- URL: http://localhost:5555

**Success Criteria:**
- Can view database schema and data from container

**Note:** Press Ctrl+C to stop Prisma Studio

---

## Test 5.23: Test Container Resource Usage

**Command:**
```bash
docker stats
```

**Expected Output:**
```
CONTAINER ID   NAME                   CPU %     MEM USAGE / LIMIT     MEM %     NET I/O
abc123         ...postgres-1          X.XX%     XXX MiB / X.XX GiB    X.XX%     XXX kB / XXX kB
def456         ...api-1               X.XX%     XXX MiB / X.XX GiB    X.XX%     XXX kB / XXX kB
ghi789         ...web-1               X.XX%     XX MiB / X.XX GiB     X.XX%     XXX kB / XXX kB
```

**Success Criteria:**
- Resource usage is reasonable
- No containers using excessive CPU/memory

**Note:** Press Ctrl+C to exit

---

## Test 5.24: Test Container Logs

**Command:**
```bash
docker-compose logs --tail=50 api
```

**Expected Output:**
Last 50 log lines from API container

**Success Criteria:**
- Logs are accessible and readable
- Shows application output

---

## Test 5.25: Clean Up Docker Resources

**Command:**
```bash
docker-compose down
```

**Expected Behavior:**
- Stops all containers
- Removes containers
- Keeps volumes and images

**Success Criteria:**
- All containers stopped
- Network removed
- Volumes persist

**Note:** Volumes are not removed with `docker-compose down`

---

## Test 5.26: Test Full Cleanup

**Command:**
```bash
docker-compose down -v --rmi all
```

**Alternative:**
```bash
pnpm docker:clean
```

**Expected Behavior:**
- Stops and removes containers
- Removes volumes (⚠️ deletes all data)
- Removes images

**Success Criteria:**
- All resources cleaned up
- Useful for fresh start

**Warning:** This deletes all database data!

---

## Phase 5 Completion Checklist

Verify all items before proceeding to Phase 6:

- [ ] Docker and Docker Compose installed and running
- [ ] Environment file configured (.env)
- [ ] All Docker images build successfully
- [ ] All containers start successfully
- [ ] Database migrations run in containers
- [ ] API health check works from host
- [ ] Web app loads in browser
- [ ] Frontend-backend communication works (no CORS errors)
- [ ] Docker networks are configured correctly
- [ ] Docker volumes persist data
- [ ] Container networking works (api can ping postgres)
- [ ] Development mode works with hot reload
- [ ] Production mode works with optimized builds
- [ ] Health checks are passing
- [ ] Restart policies work (containers auto-restart)
- [ ] Database persistence works across restarts
- [ ] Prisma Studio works in container
- [ ] Resource usage is reasonable

---

## Next Steps

✅ **If all tests pass**: Proceed to [PHASE_6_INTEGRATION.md](PHASE_6_INTEGRATION.md)

❌ **If any tests fail**: Resolve issues before continuing. Refer to [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common problems and solutions.

---

## Additional Notes

### Docker Multi-Stage Builds

The Dockerfiles use multi-stage builds for optimization:

**API Dockerfile:**
1. **dependencies**: Install pnpm and dependencies
2. **builder**: Build shared-types and API
3. **production**: Copy production files only (~200-300 MB)

**Web Dockerfile:**
1. **dependencies**: Install pnpm and dependencies
2. **builder**: Build shared-types and Vite production bundle
3. **production**: nginx serves static files (~50-100 MB)

### Docker Compose Profiles

- **docker-compose.yml**: Base configuration
- **docker-compose.dev.yml**: Development overrides (mounts, watch mode)
- **docker-compose.prod.yml**: Production overrides (optimizations)

### Common Issues

**Issue**: "Cannot connect to Docker daemon"

**Solution**: Start Docker Desktop, ensure Docker service is running

**Issue**: "Port already in use"

**Solution**: Change ports in .env or stop conflicting processes

**Issue**: "No space left on device"

**Solution**: Run `docker system prune -a` to clean up unused images/containers

**Issue**: Container keeps restarting

**Solution**: Check logs with `docker-compose logs [service]` to identify the issue
