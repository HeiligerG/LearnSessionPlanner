# Troubleshooting Guide

This guide provides solutions to common issues encountered during development, testing, and deployment of the Learn Session Planner monorepo.

---

## Table of Contents

1. [Monorepo Issues](#1-monorepo-issues)
2. [Shared Types Issues](#2-shared-types-issues)
3. [Frontend Issues](#3-frontend-issues)
4. [Backend Issues](#4-backend-issues)
5. [Docker Issues](#5-docker-issues)
6. [Integration Issues](#6-integration-issues)
7. [Performance Issues](#7-performance-issues)
8. [Common Error Messages](#8-common-error-messages)

---

## 1. Monorepo Issues

### Issue: pnpm install fails

**Symptoms:**
- Error during `pnpm install`
- Missing dependencies
- Network errors

**Solutions:**

**A. Clear cache and retry:**
```bash
pnpm store prune
pnpm install
```

**B. Delete lock file and reinstall:**
```bash
rm pnpm-lock.yaml
pnpm install
```

**C. Check network connection:**
```bash
# Test npm registry access
curl https://registry.npmjs.org
```

**D. Use a different registry:**
```bash
# In .npmrc, add:
registry=https://registry.npmmirror.com/
```

---

### Issue: Workspace packages not linked

**Symptoms:**
- Import errors for @repo/shared-types
- TypeScript cannot find module
- `pnpm list` doesn't show workspace packages

**Solutions:**

**A. Verify pnpm-workspace.yaml:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**B. Reinstall dependencies:**
```bash
pnpm install
```

**C. Check package.json dependencies use workspace:* protocol:**
```json
{
  "dependencies": {
    "@repo/shared-types": "workspace:*"
  }
}
```

**D. Verify .npmrc settings:**
```
link-workspace-packages=true
save-workspace-protocol=true
```

---

### Issue: "only-allow pnpm" error when using npm/yarn

**Symptoms:**
- Error: "Use pnpm instead"
- Installation blocked

**Solution:**

This is intentional. The project enforces pnpm usage via preinstall script.

**Options:**
1. Install pnpm: `npm install -g pnpm`
2. Remove the preinstall script from root package.json (not recommended)

---

### Issue: Symlinks not working on Windows

**Symptoms:**
- Workspace packages not linked
- Permission errors
- Junction points not created

**Solutions:**

**A. Run terminal as Administrator**

**B. Enable Developer Mode in Windows:**
1. Open Settings → Update & Security → For developers
2. Enable "Developer Mode"

**C. Use WSL2 (Windows Subsystem for Linux):**
```bash
# Install WSL2 and use Linux environment
wsl --install
```

---

## 2. Shared Types Issues

### Issue: "Cannot find module '@repo/shared-types'"

**Symptoms:**
- Import errors in frontend or backend
- TypeScript compilation fails
- Module not found errors

**Solutions:**

**A. Build shared-types:**
```bash
pnpm --filter @repo/shared-types build
```

**B. Verify dist directories exist:**
```bash
ls packages/shared-types/dist/esm
ls packages/shared-types/dist/cjs
```

**C. Reinstall dependencies:**
```bash
pnpm install
```

**D. Check package.json exports field:**
```json
{
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    }
  }
}
```

---

### Issue: Type errors after building shared-types

**Symptoms:**
- TypeScript shows errors for shared types
- Type definitions not updated
- Intellisense not working

**Solutions:**

**A. Rebuild shared-types:**
```bash
pnpm --filter @repo/shared-types build
```

**B. Restart TypeScript server in IDE:**
- VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
- Other IDEs: Restart IDE

**C. Clear TypeScript cache:**
```bash
# Delete .tsbuildinfo files
find . -name "*.tsbuildinfo" -delete
```

---

### Issue: Dual build (ESM/CJS) fails

**Symptoms:**
- Build fails for one format
- Missing output directory
- Compilation errors

**Solutions:**

**A. Check tsconfig files exist:**
```bash
ls packages/shared-types/tsconfig.esm.json
ls packages/shared-types/tsconfig.cjs.json
```

**B. Verify tsconfig extends base:**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ESNext", // or "CommonJS" for CJS
    "outDir": "./dist/esm" // or "./dist/cjs"
  }
}
```

**C. Build individually to isolate issue:**
```bash
pnpm --filter @repo/shared-types build:esm
pnpm --filter @repo/shared-types build:cjs
```

---

## 3. Frontend Issues

### Issue: Vite dev server won't start

**Symptoms:**
- Port 5173 already in use
- Server crashes immediately
- Module resolution errors

**Solutions:**

**A. Change port:**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3000 // Use different port
  }
})
```

**B. Kill process using port 5173:**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

**C. Clear Vite cache:**
```bash
rm -rf apps/web/node_modules/.vite
```

---

### Issue: Tailwind CSS styles not applying

**Symptoms:**
- No styles on page
- Plain unstyled HTML
- Tailwind classes not working

**Solutions:**

**A. Verify @tailwind directives in index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**B. Check tailwind.config.js content patterns:**
```javascript
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // ...
}
```

**C. Verify postcss.config.js exists:**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**D. Restart dev server:**
```bash
# Ctrl+C to stop, then:
pnpm --filter @repo/web dev
```

---

### Issue: Hot Module Replacement (HMR) not working

**Symptoms:**
- Changes don't appear in browser
- Full page reload instead of HMR
- No updates at all

**Solutions:**

**A. Check Vite configuration:**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    hmr: true
  }
})
```

**B. Restart dev server**

**C. Clear browser cache (Ctrl+Shift+R)**

**D. Check file watcher limits (Linux):**
```bash
# Increase limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

### Issue: Production build fails

**Symptoms:**
- Build command fails
- TypeScript errors during build
- Out of memory errors

**Solutions:**

**A. Fix TypeScript errors:**
```bash
pnpm --filter @repo/web typecheck
```

**B. Increase Node.js memory:**
```bash
NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter @repo/web build
```

**C. Clear build cache:**
```bash
rm -rf apps/web/dist
rm -rf apps/web/node_modules/.vite
```

---

## 4. Backend Issues

### Issue: Cannot connect to database

**Symptoms:**
- "Connection refused" error
- "Database does not exist" error
- API won't start

**Solutions:**

**A. Verify PostgreSQL is running:**
```bash
# Docker
docker ps | grep postgres

# Local
# Linux
sudo systemctl status postgresql
# Mac
brew services list | grep postgresql
# Windows
# Check Services app for PostgreSQL
```

**B. Check DATABASE_URL format:**
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

**C. Test connection:**
```bash
psql -U postgres -h localhost -p 5432 -d learnsession
```

**D. Start PostgreSQL if not running:**
```bash
# Docker
docker run --name learn-planner-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=learnsession \
  -p 5432:5432 \
  -d postgres:16-alpine

# Local
sudo systemctl start postgresql  # Linux
brew services start postgresql   # Mac
```

---

### Issue: Prisma Client not generated

**Symptoms:**
- "Cannot find module '@prisma/client'" error
- Import errors for PrismaClient
- Runtime errors

**Solutions:**

**A. Generate Prisma Client:**
```bash
pnpm --filter @repo/api prisma:generate
```

**B. After schema changes, regenerate:**
```bash
pnpm --filter @repo/api prisma:generate
```

**C. Verify schema.prisma exists:**
```bash
cat apps/api/prisma/schema.prisma
```

---

### Issue: Migration fails

**Symptoms:**
- "Migration failed" error
- Schema conflicts
- Cannot apply migration

**Solutions:**

**A. Reset database (development only!):**
```bash
pnpm --filter @repo/api prisma:migrate:reset
```

**B. Resolve migration conflicts:**
```bash
# Delete migrations directory
rm -rf apps/api/prisma/migrations

# Create new migration
pnpm --filter @repo/api prisma:migrate:dev --name init
```

**C. Fix schema.prisma syntax errors**

**D. Ensure database is empty (for initial migration):**
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Drop and recreate database
DROP DATABASE learnsession;
CREATE DATABASE learnsession;
```

---

### Issue: CORS errors from frontend

**Symptoms:**
- "Access-Control-Allow-Origin" error in browser
- Frontend cannot fetch API
- CORS policy blocks requests

**Solutions:**

**A. Verify CORS_ORIGIN in .env:**
```env
CORS_ORIGIN=http://localhost:5173
```

**B. Check CORS configuration in main.ts:**
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
});
```

**C. Ensure API is running on correct port**

**D. For multiple origins:**
```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
});
```

---

### Issue: Port 4000 already in use

**Symptoms:**
- "EADDRINUSE: address already in use"
- API won't start

**Solutions:**

**A. Change port in .env:**
```env
PORT=4001
```

**B. Kill process using port 4000:**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

---

## 5. Docker Issues

### Issue: Docker build fails

**Symptoms:**
- Build errors
- Cannot find dependencies
- Out of disk space

**Solutions:**

**A. Clear Docker cache:**
```bash
docker builder prune -a
```

**B. Free up disk space:**
```bash
docker system prune -a --volumes
```

**C. Check .dockerignore:**
```
node_modules
dist
.git
.env
*.log
```

**D. Increase Docker resources:**
- Open Docker Desktop → Settings → Resources
- Increase CPU, Memory, and Disk

---

### Issue: Container keeps restarting

**Symptoms:**
- Container status shows "Restarting"
- Service unavailable
- Repeated startup logs

**Solutions:**

**A. Check container logs:**
```bash
docker-compose logs api
docker-compose logs web
```

**B. Common causes:**
- Database not ready (add depends_on with health check)
- Missing environment variables
- Port conflicts
- Application crashes

**C. Disable restart policy temporarily:**
```yaml
# docker-compose.yml
services:
  api:
    restart: "no"  # Temporarily disable
```

**D. Run container interactively:**
```bash
docker-compose run --rm api sh
```

---

### Issue: Volumes not persisting data

**Symptoms:**
- Database data lost after restart
- Migrations need to rerun
- Container state not saved

**Solutions:**

**A. Verify volume in docker-compose.yml:**
```yaml
volumes:
  postgres_data:

services:
  postgres:
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

**B. Check volume exists:**
```bash
docker volume ls | grep postgres
```

**C. Inspect volume:**
```bash
docker volume inspect learn-session-planner_postgres_data
```

**D. Don't use `docker-compose down -v` (removes volumes)**

---

### Issue: Cannot connect between containers

**Symptoms:**
- API cannot reach postgres
- Connection refused between services
- Network errors

**Solutions:**

**A. Verify services are on same network:**
```bash
docker network inspect learn-session-planner_default
```

**B. Use service names in connection strings:**
```env
# ✓ Correct
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/learnsession"

# ✗ Wrong
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/learnsession"
```

**C. Check health status:**
```bash
docker-compose ps
```

---

### Issue: Docker Compose command not found

**Symptoms:**
- "docker-compose: command not found"
- Cannot run docker-compose

**Solutions:**

**A. Use new syntax:**
```bash
# Old
docker-compose up

# New (Docker Compose V2)
docker compose up
```

**B. Install Docker Compose:**
```bash
# Linux
sudo apt-get install docker-compose-plugin

# Mac (Docker Desktop includes it)
# Windows (Docker Desktop includes it)
```

---

## 6. Integration Issues

### Issue: Frontend cannot reach API

**Symptoms:**
- Network errors in browser console
- API requests fail
- CORS errors

**Solutions:**

**A. Verify API is running:**
```bash
curl http://localhost:4000/api/health
```

**B. Check VITE_API_URL:**
```env
VITE_API_URL=http://localhost:4000/api
```

**C. Restart both services**

**D. Check CORS configuration (see CORS section above)**

---

### Issue: Shared types not syncing

**Symptoms:**
- Type errors after updating shared-types
- Changes not reflected
- IntelliSense outdated

**Solutions:**

**A. Rebuild shared-types:**
```bash
pnpm --filter @repo/shared-types build
```

**B. Restart TypeScript server in IDE**

**C. Rebuild consuming packages:**
```bash
pnpm --filter @repo/api build
pnpm --filter @repo/web build
```

---

## 7. Performance Issues

### Issue: Slow pnpm install

**Solutions:**

**A. Use shamefully-hoist:**
```
# .npmrc
shamefully-hoist=true
```

**B. Enable frozen-lockfile in CI:**
```
# .npmrc (for CI only)
frozen-lockfile=true
```

**C. Clear store and reinstall:**
```bash
pnpm store prune
pnpm install
```

---

### Issue: Slow Docker builds

**Solutions:**

**A. Use BuildKit:**
```bash
DOCKER_BUILDKIT=1 docker-compose build
```

**B. Cache dependencies in separate layer:**
```dockerfile
# Copy package files first
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Then copy source
COPY . .
```

**C. Use .dockerignore to exclude unnecessary files**

---

### Issue: Large bundle sizes

**Solutions:**

**A. Analyze bundle:**
```bash
# Install analyzer
pnpm add -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  visualizer({ open: true })
]
```

**B. Enable code splitting**

**C. Lazy load components:**
```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

**D. Verify Tailwind purge is working:**
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // ...
}
```

---

## 8. Common Error Messages

### "ERR_PNPM_NO_MATCHING_VERSION"

**Solution:** Update package version in package.json or use compatible version range.

---

### "EACCES: permission denied"

**Solutions:**
- Run with sudo (Linux/Mac)
- Run terminal as Administrator (Windows)
- Fix npm permissions: `sudo chown -R $USER:$GROUP ~/.npm`

---

### "Cannot find module" (TypeScript)

**Solutions:**
1. Build dependencies: `pnpm build`
2. Check path aliases in tsconfig.json
3. Verify imports use correct paths
4. Restart TypeScript server

---

### "Module not found: Can't resolve '@repo/shared-types'"

**Solutions:**
1. Build shared-types: `pnpm --filter @repo/shared-types build`
2. Verify workspace links: `pnpm list @repo/shared-types`
3. Reinstall: `pnpm install`

---

### "listen EADDRINUSE: address already in use"

**Solution:** Kill process using the port (see Port Issues sections above)

---

### "Prisma schema not found"

**Solution:** Run from correct directory or specify schema path:
```bash
pnpm prisma generate --schema=./apps/api/prisma/schema.prisma
```

---

### "Docker: no space left on device"

**Solution:**
```bash
docker system prune -a --volumes
```

---

## Getting More Help

If you encounter an issue not covered here:

1. **Check logs:** Always start by examining logs for error messages
2. **Search GitHub Issues:** Check if others have encountered the same issue
3. **Enable verbose mode:** Add `--loglevel verbose` to commands
4. **Isolate the problem:** Test components individually
5. **Ask for help:** Create a GitHub issue with:
   - Detailed error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)
   - What you've tried

---

## Debugging Tips

**Enable debug logs:**
```bash
# pnpm
pnpm install --loglevel debug

# Node.js
NODE_DEBUG=* node script.js

# Vite
DEBUG=vite:* pnpm dev
```

**Check environment:**
```bash
node --version
pnpm --version
docker --version
docker-compose --version
```

**Verify configuration:**
```bash
# Check all environment files
find . -name ".env*" -type f

# Check all package.json files
find . -name "package.json" -type f
```

**Clean everything (nuclear option):**
```bash
# Delete all node_modules
find . -name "node_modules" -type d -exec rm -rf {} +

# Delete all dist directories
find . -name "dist" -type d -exec rm -rf {} +

# Delete pnpm lock
rm pnpm-lock.yaml

# Reinstall
pnpm install
pnpm build
```

---

**Remember:** Most issues can be resolved by:
1. Reading error messages carefully
2. Checking logs
3. Verifying configuration
4. Rebuilding dependencies
5. Restarting services

Good luck! 🚀
