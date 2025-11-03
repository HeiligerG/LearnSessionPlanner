# Phase 6: Integration Tests

**Objective:** Verify that all components work together correctly in a full-stack integration scenario.

**Duration:** 30-45 minutes
**Prerequisites:** All previous phases (1-5) must be completed successfully. Services should be running (either locally or in Docker).

---

## Test 6.1: Full Stack Startup Test

### Option A: Local Development

**Terminal 1 - Start API:**
```bash
pnpm --filter @repo/api start:dev
```

**Terminal 2 - Start Frontend:**
```bash
pnpm --filter @repo/web dev
```

**Success Criteria:**
- Both services start without errors
- API listening on http://localhost:4000
- Frontend listening on http://localhost:5173

### Option B: Docker

**Command:**
```bash
docker-compose up -d

# Initialize database schema (choose based on whether migrations exist)
# If migrations exist:
docker-compose exec api pnpm prisma:migrate:deploy

# If no migrations (first-time setup):
docker-compose exec api pnpm prisma db push
```

**Success Criteria:**
- All containers running
- Database schema initialized
- No errors in logs

---

## Test 6.2: Verify All Services Are Accessible

**Test 1 - API Health Check:**
```bash
curl http://localhost:4000/api/health
```

**Expected:** HTTP 200 OK with health status

**Test 2 - Web Server:**
```bash
curl http://localhost:5173
```

**Expected:** HTTP 200 OK with HTML content

**Test 3 - Browser:**
Open http://localhost:5173 in browser

**Expected:** Landing page loads

**Success Criteria:**
- All services respond
- No connection errors

---

## Test 6.3: Test Cross-Origin Communication

**Action:** Open http://localhost:5173 in browser

**Steps:**
1. Open browser DevTools Console (F12)
2. Run the following command:
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
- Response is logged to console

**Troubleshooting:**
- **CORS error**: Check CORS_ORIGIN in API .env matches frontend URL
- **Network error**: Verify API is running

---

## Test 6.4: Verify Shared Types Across Stack

**Frontend Check:**
1. Open `apps/web/src/services/api.ts` in editor
2. Verify imports from '@repo/shared-types'
3. Hover over imported types to see definitions

**Backend Check:**
1. Open `apps/api/src/main.ts` or any service file
2. Check for shared-types imports (if any)

**Success Criteria:**
- Both frontend and backend import from '@repo/shared-types'
- No import errors
- TypeScript recognizes types

**Test Type Safety:**
```typescript
// In frontend, try using a shared type
import type { ApiResponse } from '@repo/shared-types';

const response: ApiResponse = {
  success: true,
  data: null,
  error: null,
  timestamp: new Date().toISOString()
};
```

---

## Test 6.5: Test Complete User Flow

**Action:** Open http://localhost:5173 in browser

**Steps:**
1. Verify landing page loads with all content
2. Click "Get Started" button
3. Verify navigation to /dashboard
4. Observe URL change to http://localhost:5173/dashboard
5. Verify dashboard content loads
6. Click "Home" link in header
7. Verify return to landing page

**Success Criteria:**
- All navigation works smoothly
- No page reloads (SPA behavior)
- No console errors
- Content loads correctly on each page

---

## Test 6.6: Test API Error Handling

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
- Returns HTTP 404
- Returns JSON error response
- Errors are handled gracefully

---

## Test 6.7: Test Frontend Error Handling

**Steps:**
1. Stop API server:
   - Local: Ctrl+C in API terminal
   - Docker: `docker-compose stop api`

2. In browser console at http://localhost:5173:
   ```javascript
   fetch('http://localhost:4000/api/health')
     .then(r => r.json())
     .then(console.log)
     .catch(err => console.error('Network error:', err))
   ```

**Expected Result:**
- Network error is caught
- Error is logged to console
- Frontend handles API unavailability

**Success Criteria:**
- Frontend doesn't crash
- Error is caught by .catch()

3. Restart API server:
   - Local: `pnpm --filter @repo/api start:dev`
   - Docker: `docker-compose start api`

---

## Test 6.8: Test Database Query from API

**Command:**
```bash
docker-compose exec api pnpm prisma:studio
```

**Or for local:**
```bash
pnpm --filter @repo/api prisma:studio
```

**Action:** Open http://localhost:5555

**Steps:**
1. View "users" table
2. Verify table exists
3. Check schema matches Prisma schema

**Expected Result:**
- Table exists (may be empty)
- Schema is correct

**Success Criteria:**
- API can query database
- Prisma Client works correctly

---

## Test 6.9: Test Environment Variable Propagation

**API Check:**
```bash
# For Docker
docker-compose logs api | grep CORS

# For local, check terminal output
```

**Expected:** Should show CORS_ORIGIN configured as http://localhost:5173

**Frontend Check:**
Open browser console at http://localhost:5173 and run:
```javascript
console.log(import.meta.env.VITE_API_URL)
```

**Expected Output:**
```
http://localhost:4000/api
```

**Success Criteria:**
- Environment variables are correctly set
- Frontend knows API URL
- API knows allowed CORS origin

---

## Test 6.10: Test Hot Reload Across Stack

### Frontend Hot Reload

**Steps:**
1. Keep browser open at http://localhost:5173
2. Edit `apps/web/src/pages/LandingPage.tsx`
3. Change title text
4. Save file

**Expected Result:**
- Browser updates automatically within 1-2 seconds
- No page reload

**Success Criteria:**
- HMR works

### Backend Hot Reload

**Steps:**
1. Keep API server running
2. Edit `apps/api/src/app.service.ts`
3. Change return message
4. Save file

**Expected Result:**
- Server restarts automatically
- New message takes effect

**Verify:**
```bash
curl http://localhost:4000/api
```

**Success Criteria:**
- Watch mode works
- Changes are reflected

---

## Test 6.11: Test TypeScript Type Safety

**Action:** Modify shared types and see propagation

**Steps:**
1. Edit `packages/shared-types/src/entities/user.entity.ts`
2. Add a new field:
   ```typescript
   export interface User {
     id: string;
     email: string;
     name?: string;
     avatar?: string; // NEW FIELD
     createdAt: Date;
     updatedAt: Date;
   }
   ```
3. Rebuild shared-types:
   ```bash
   pnpm --filter @repo/shared-types build
   ```
4. Check TypeScript in both apps:
   ```bash
   pnpm --filter @repo/web typecheck
   pnpm --filter @repo/api typecheck
   ```

**Expected Result:**
- New field is available in both frontend and backend
- Type completions show new field
- No type errors

**Success Criteria:**
- Type changes propagate correctly
- Monorepo type sharing works

---

## Test 6.12: Test Monorepo Scripts

**Type-Check All Packages:**
```bash
pnpm typecheck
```

**Expected Output:**
- Type-checks all packages in parallel
- No TypeScript errors

**Build All Packages:**
```bash
pnpm build
```

**Expected Output:**
- Builds packages in correct order:
  1. shared-types
  2. api
  3. web
- All builds succeed

**Success Criteria:**
- No errors
- All packages build successfully

---

## Test 6.13: Test Workspace Dependencies

**Command:**
```bash
pnpm list @repo/shared-types --depth 0
```

**Expected Output:**
```
@repo/api
dependencies:
@repo/shared-types 1.0.0 <- ../../packages/shared-types

@repo/web
dependencies:
@repo/shared-types 1.0.0 <- ../../packages/shared-types
```

**Success Criteria:**
- Workspace links are correct
- Both apps depend on shared-types

---

## Test 6.14: Test Production Build Integration

**Command:**
```bash
pnpm build
```

**Expected Behavior:**
- Builds all packages sequentially
- Shared-types builds first
- Then api and web build in parallel

**Success Criteria:**
- All production builds succeed
- Verify dist directories exist:
  - `packages/shared-types/dist/`
  - `apps/api/dist/`
  - `apps/web/dist/`

---

## Test 6.15: Test Docker Production Stack

**Command:**
```bash
docker-compose down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Initialize database schema
# If migrations exist:
docker-compose exec api pnpm prisma:migrate:deploy
# If no migrations:
docker-compose exec api pnpm prisma db push
```

**Action:** Open http://localhost:5173 in browser

**Expected Result:**
- Production-optimized app loads
- All features work
- Assets are minified

**Success Criteria:**
- Full stack works in production mode
- No errors

---

## Test 6.16: Test Performance

**Action:** Open browser DevTools Network tab

**Steps:**
1. Open http://localhost:5173
2. Observe network waterfall
3. Note load times

**Expected Metrics:**
- Initial page load: < 2 seconds
- API health check: < 100ms
- Assets cached on subsequent loads

**Success Criteria:**
- Performance is acceptable
- No slow requests (> 5s)

---

## Test 6.17: Test Browser Compatibility

**Action:** Test in multiple browsers

**Browsers to Test:**
- Chrome/Chromium
- Firefox
- Safari (if on macOS)
- Edge

**Expected Result:**
- App works in all modern browsers
- No browser-specific issues

**Success Criteria:**
- Consistent behavior across browsers

---

## Test 6.18: Test Responsive Design

**Action:** Test on different screen sizes

**Screen Sizes:**
- Mobile: 375px width
- Tablet: 768px width
- Desktop: 1440px width

**Expected Result:**
- Layout adapts correctly
- No horizontal scrollbar
- Content remains accessible

**Success Criteria:**
- Responsive design works

---

## Test 6.19: Test Database Persistence

**Steps:**
1. Create test data (if seed script exists):
   ```bash
   docker-compose exec api pnpm prisma:seed
   ```
2. Restart containers:
   ```bash
   docker-compose restart
   ```
3. Check data:
   ```bash
   docker-compose exec api pnpm prisma:studio
   ```

**Expected Result:**
- Data persists across restarts

**Success Criteria:**
- Database volume works correctly

---

## Test 6.20: Test Graceful Shutdown

**Steps:**
1. Run services with `docker-compose up` (without -d)
2. Press Ctrl+C to stop

**Expected Result:**
- Clean shutdown messages
- No errors
- All connections close properly

**Success Criteria:**
- Graceful shutdown works

---

## Test 6.21: Test Logging

**Action:** Review logs from all services

**Commands:**
```bash
docker-compose logs api
docker-compose logs web
docker-compose logs postgres
```

**Expected Observations:**
- API logs requests and responses
- Database connection logs
- No unexpected errors
- Timestamps are present

**Success Criteria:**
- Logging is comprehensive and useful

---

## Test 6.22: Test Error Recovery

### Scenario 1: Database Goes Down

**Steps:**
1. Stop postgres:
   ```bash
   docker-compose stop postgres
   ```
2. Observe API logs

**Expected:** API logs errors but doesn't crash

3. Restart postgres:
   ```bash
   docker-compose start postgres
   ```

**Expected:** API reconnects automatically

### Scenario 2: API Goes Down

**Steps:**
1. Stop API:
   ```bash
   docker-compose stop api
   ```
2. Try accessing API from frontend

**Expected:** Frontend shows error or loading state

3. Restart API:
   ```bash
   docker-compose start api
   ```

**Expected:** Frontend recovers

**Success Criteria:**
- Services handle failures gracefully
- Automatic recovery works

---

## Test 6.23: Test Security Headers

**Command:**
```bash
curl -I http://localhost:5173
```

**Expected Headers (if using nginx):**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

**Success Criteria:**
- Security headers are present
- Headers configured in nginx.conf

---

## Test 6.24: Test API Validation

**Command:**
```bash
curl -X POST http://localhost:4000/api/test \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}'
```

**Expected:** Validation error response (if validation pipe is configured)

**Success Criteria:**
- Global validation pipe works
- Validates incoming requests

**Note:** This endpoint may not exist yet, but demonstrates validation configuration

---

## Test 6.25: Final Integration Checklist

Verify all integration points:

- [ ] All services start successfully
- [ ] Frontend loads in browser
- [ ] API responds to requests
- [ ] Database is accessible
- [ ] CORS is configured correctly
- [ ] Shared types work across stack
- [ ] Navigation works (React Router)
- [ ] Hot reload works (development)
- [ ] Production builds work
- [ ] Docker orchestration works
- [ ] Environment variables propagate
- [ ] Type safety is maintained
- [ ] Performance is acceptable
- [ ] Error handling works
- [ ] Logging is comprehensive
- [ ] Security headers present
- [ ] Browser compatibility confirmed
- [ ] Responsive design verified
- [ ] Database persistence works
- [ ] Graceful shutdown works

---

## Phase 6 Completion Checklist

Verify all items:

- [ ] Full stack starts successfully (local or Docker)
- [ ] All services are accessible
- [ ] Cross-origin communication works
- [ ] Shared types work across frontend and backend
- [ ] User flows work end-to-end
- [ ] Error handling works (API and frontend)
- [ ] Hot reload works across stack
- [ ] Type safety is maintained
- [ ] Production mode works
- [ ] Performance is acceptable
- [ ] Browser compatibility verified
- [ ] Responsive design works
- [ ] Database persistence works
- [ ] Graceful shutdown works
- [ ] Security headers present
- [ ] Logging is comprehensive

---

## Final Recommendations

🎉 **Congratulations!** If all tests pass, your monorepo is production-ready!

### Next Steps

**1. Add Testing Framework**
- **Frontend**: Vitest + React Testing Library
- **Backend**: Jest + Supertest
- **E2E**: Playwright or Cypress

**2. Add Linting and Formatting**
- ESLint for code quality
- Prettier for code formatting
- Husky for pre-commit hooks
- lint-staged for staged file linting

**3. Set Up CI/CD**
- GitHub Actions or GitLab CI
- Automated testing on every commit
- Automated Docker builds
- Deployment pipelines

**4. Implement Core Features**
- Authentication system (JWT-based)
- Session CRUD operations
- Progress tracking
- User dashboard with real data

**5. Add Monitoring and Logging**
- Structured logging (Winston, Pino)
- Error tracking (Sentry)
- Performance monitoring (New Relic, DataDog)
- APM integration

**6. Deploy to Production**
- Choose hosting provider (AWS, Azure, DigitalOcean, Vercel, Railway)
- Set up production database (managed PostgreSQL)
- Configure production environment variables
- Set up domain and SSL certificates
- Configure CDN for static assets

**7. Security Enhancements**
- Rate limiting
- Input sanitization
- SQL injection prevention (Prisma handles this)
- XSS protection
- CSRF protection
- Helmet.js for security headers
- Regular dependency updates

**8. Performance Optimization**
- Database indexing
- Query optimization
- Caching (Redis)
- CDN for static assets
- Image optimization
- Code splitting
- Lazy loading

---

## Troubleshooting

If you encounter issues, refer to [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common problems and solutions.

---

## Summary

You have successfully:

✅ Tested monorepo configuration and workspace setup
✅ Verified shared types build and export correctly
✅ Tested frontend development and production builds
✅ Tested backend API and database integration
✅ Verified Docker containerization and orchestration
✅ Confirmed full-stack integration works end-to-end

Your Learn Session Planner monorepo is ready for feature development! 🚀
