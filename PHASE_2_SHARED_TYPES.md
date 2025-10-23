# Phase 2: Shared Types Package Tests

**Objective:** Verify that the shared-types package builds correctly in both ESM and CommonJS formats and exports all types properly.

**Duration:** 10-15 minutes
**Prerequisites:** Phase 1 must be completed successfully

---

## Test 2.1: Build Shared Types Package

**Command:**
```bash
pnpm --filter @repo/shared-types build
```

**Expected Behavior:**
- Compiles TypeScript to both ESM and CJS formats
- Runs two parallel builds (build:esm and build:cjs)

**Expected Output:**
```
> @repo/shared-types@1.0.0 build /path/to/packages/shared-types
> pnpm run build:esm && pnpm run build:cjs

> @repo/shared-types@1.0.0 build:esm
> tsc --project tsconfig.esm.json

> @repo/shared-types@1.0.0 build:cjs
> tsc --project tsconfig.cjs.json
```

**Duration:** 10-30 seconds

**Success Criteria:**
- No TypeScript compilation errors
- Creates `packages/shared-types/dist/esm` directory
- Creates `packages/shared-types/dist/cjs` directory
- Exit code 0 (no errors)

**Troubleshooting:**
- **"Cannot find module" errors**: Check import paths in source files
- **Compilation errors**: Run `pnpm --filter @repo/shared-types typecheck` first to see detailed errors
- **Missing tsconfig**: Verify tsconfig.esm.json and tsconfig.cjs.json exist

---

## Test 2.2: Verify ESM Build Output

**Command:**
```bash
ls packages/shared-types/dist/esm
```

**Windows Alternative:**
```cmd
dir packages\shared-types\dist\esm /S
```

**Expected Output:**
```
index.js
index.d.ts
entities/
  index.js
  index.d.ts
  user.entity.js
  user.entity.d.ts
  session.entity.js
  session.entity.d.ts
  progress.entity.js
  progress.entity.d.ts
dtos/
  index.js
  index.d.ts
  auth.dto.js
  auth.dto.d.ts
  session.dto.js
  session.dto.d.ts
  progress.dto.js
  progress.dto.d.ts
  common.dto.js
  common.dto.d.ts
enums/
  index.js
  index.d.ts
  session-category.enum.js
  session-category.enum.d.ts
```

**Success Criteria:**
- All expected files and directories exist
- Each .ts source file has corresponding .js and .d.ts files
- Directory structure matches source structure

---

## Test 2.3: Verify CJS Build Output

**Command:**
```bash
ls packages/shared-types/dist/cjs
```

**Windows Alternative:**
```cmd
dir packages\shared-types\dist\cjs /S
```

**Expected Output:**
Same structure as ESM but with CommonJS module format:
```
index.js
index.d.ts
entities/
dtos/
enums/
```

**Success Criteria:**
- All expected files and directories exist
- Structure mirrors ESM output
- Files contain CommonJS syntax (require/module.exports)

---

## Test 2.4: Verify Type Declarations

**Command:**
```bash
find packages/shared-types/dist/esm -name "*.d.ts"
```

**Windows Alternative:**
```cmd
dir packages\shared-types\dist\esm\*.d.ts /S
```

**Expected Output:**
```
packages/shared-types/dist/esm/index.d.ts
packages/shared-types/dist/esm/entities/index.d.ts
packages/shared-types/dist/esm/entities/user.entity.d.ts
packages/shared-types/dist/esm/entities/session.entity.d.ts
packages/shared-types/dist/esm/entities/progress.entity.d.ts
[... and more]
```

**Success Criteria:**
- Type declarations (.d.ts) are generated for all modules
- Type declarations are placed alongside .js files

---

## Test 2.5: Type-Check Shared Types

**Command:**
```bash
pnpm --filter @repo/shared-types typecheck
```

**Expected Output:**
```
> @repo/shared-types@1.0.0 typecheck
> tsc --noEmit
```

**Success Criteria:**
- Compilation succeeds with no errors
- No TypeScript warnings or errors
- Exit code 0

**Troubleshooting:**
- If errors found: Review and fix TypeScript issues in source files
- Check that all imports are correctly resolved

---

## Test 2.6: Verify Package Exports

**Command:**
```bash
cat packages/shared-types/package.json
```

**Windows Alternative:**
```cmd
type packages\shared-types\package.json
```

**Expected Content (exports field):**
```json
{
  "name": "@repo/shared-types",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/esm/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/esm/index.d.ts",
        "default": "./dist/esm/index.js"
      },
      "require": {
        "types": "./dist/cjs/index.d.ts",
        "default": "./dist/cjs/index.js"
      }
    }
  }
}
```

**Success Criteria:**
- `exports["."].import` points to `dist/esm/index.js`
- `exports["."].require` points to `dist/cjs/index.js`
- `types` field points to `dist/esm/index.d.ts`
- Both import and require have types defined

---

## Test 2.7: Test ESM Import (Node.js)

**Command:**
```bash
node -e "import('@repo/shared-types').then(m => console.log(Object.keys(m)))"
```

**Expected Output:**
```
[
  'User',
  'UserWithPassword',
  'CreateUserData',
  'UpdateUserData',
  'Session',
  'SessionWithUser',
  'Progress',
  'ProgressWithSession',
  'LoginDto',
  'RegisterDto',
  'AuthResponse',
  'CreateSessionDto',
  'UpdateSessionDto',
  'SessionResponse',
  'CreateProgressDto',
  'UpdateProgressDto',
  'PaginatedResponse',
  'ApiResponse',
  'ApiError',
  'SessionCategory',
  'SESSION_CATEGORIES'
]
```

**Success Criteria:**
- All exported types are listed
- No import errors
- Shows all entities, DTOs, and enums

**Note:** Requires Node.js with ESM support (Node 14+)

---

## Test 2.8: Test CJS Require (Node.js)

**Command:**
```bash
node -e "const types = require('./packages/shared-types/dist/cjs/index.js'); console.log(Object.keys(types))"
```

**Expected Output:**
Same as ESM test - lists all exported types

**Success Criteria:**
- All exported types are listed
- No require errors
- CommonJS module loads correctly

---

## Test 2.9: Verify Entity Types

**Command:**
```bash
cat packages/shared-types/src/entities/index.ts
```

**Windows Alternative:**
```cmd
type packages\shared-types\src\entities\index.ts
```

**Expected Exports:**
```typescript
export * from './user.entity';
export * from './session.entity';
export * from './progress.entity';
```

**Types Defined:**
- **User**: Base user entity
- **UserWithPassword**: User with password field
- **CreateUserData**: Data for creating user
- **UpdateUserData**: Data for updating user
- **Session**: Base session entity
- **SessionWithUser**: Session with user relation
- **Progress**: Base progress entity
- **ProgressWithSession**: Progress with session relation

**Success Criteria:**
- All entity types are exported from index.ts
- All entity files are properly referenced

---

## Test 2.10: Verify DTO Types

**Command:**
```bash
cat packages/shared-types/src/dtos/index.ts
```

**Windows Alternative:**
```cmd
type packages\shared-types\src\dtos\index.ts
```

**Expected Exports:**
```typescript
export * from './auth.dto';
export * from './session.dto';
export * from './progress.dto';
export * from './common.dto';
```

**Types Defined:**
- **Auth DTOs**: LoginDto, RegisterDto, AuthResponse
- **Session DTOs**: CreateSessionDto, UpdateSessionDto, SessionResponse
- **Progress DTOs**: CreateProgressDto, UpdateProgressDto
- **Common DTOs**: PaginatedResponse, ApiResponse, ApiError

**Success Criteria:**
- All DTO types are exported from index.ts
- All DTO files are properly referenced

---

## Test 2.11: Verify Enum Types

**Command:**
```bash
cat packages/shared-types/src/enums/index.ts
```

**Windows Alternative:**
```cmd
type packages\shared-types\src\enums\index.ts
```

**Expected Exports:**
```typescript
export * from './session-category.enum';
```

**Types Defined:**
- **SessionCategory**: Enum with values (SCHOOL, PROGRAMMING, LANGUAGE, PERSONAL, OTHER)
- **SESSION_CATEGORIES**: Array of all session categories

**Success Criteria:**
- Enum is exported with all values
- SESSION_CATEGORIES array is available

---

## Test 2.12: Test Watch Mode (Optional)

**Command:**
```bash
pnpm --filter @repo/shared-types build:watch
```

**Expected Behavior:**
- Watches for file changes in src/
- Rebuilds automatically when files change
- Logs each rebuild

**Test:**
1. Start watch mode
2. Edit a source file (e.g., add a comment)
3. Save the file
4. Observe automatic rebuild in terminal

**Success Criteria:**
- Rebuild triggers automatically on file save
- No errors during rebuild

**Note:** Press Ctrl+C to stop watch mode

---

## Phase 2 Completion Checklist

Verify all items before proceeding to Phase 3:

- [ ] Shared-types builds successfully
- [ ] ESM output directory exists with all files
- [ ] CJS output directory exists with all files
- [ ] Type declarations (.d.ts) are generated for all modules
- [ ] No TypeScript compilation errors
- [ ] Package exports are configured correctly (ESM and CJS)
- [ ] ESM imports work in Node.js
- [ ] CJS requires work in Node.js
- [ ] All entity types are exported
- [ ] All DTO types are exported
- [ ] All enum types are exported

---

## Next Steps

✅ **If all tests pass**: Proceed to [PHASE_3_FRONTEND.md](PHASE_3_FRONTEND.md)

❌ **If any tests fail**: Resolve issues before continuing. Refer to [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common problems and solutions.

---

## Additional Notes

### Understanding Dual Build System

The shared-types package uses a dual build system to support both ESM and CommonJS:

**ESM (ECMAScript Modules):**
- Modern module system
- Used by Vite and modern bundlers
- Uses `import`/`export` syntax
- Configured via tsconfig.esm.json

**CJS (CommonJS):**
- Traditional Node.js module system
- Used by NestJS and older Node.js projects
- Uses `require`/`module.exports` syntax
- Configured via tsconfig.cjs.json

### Why Dual Build?

- **Frontend (Vite)** prefers ESM for tree-shaking and modern optimizations
- **Backend (NestJS)** may use CommonJS depending on configuration
- Dual build ensures compatibility with both ecosystems

### Common Issues

**Issue**: "Cannot find module '@repo/shared-types'"

**Solution**: Make sure the build has completed successfully and dist/ directories exist.

**Issue**: Type errors in consuming packages

**Solution**: Rebuild shared-types and ensure both ESM and CJS builds complete.

**Issue**: Watch mode not triggering

**Solution**: Check that file changes are being saved. Some editors may need configuration for proper file watching.
