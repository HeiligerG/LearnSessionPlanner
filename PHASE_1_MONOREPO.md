# Phase 1: Monorepo Foundation Tests

**Objective:** Verify that the pnpm workspace is correctly configured and all dependencies are properly installed and linked.

**Duration:** 10-15 minutes
**Prerequisites:** None (this is the first phase)

---

## Test 1.1: Verify pnpm Installation

**Command:**
```bash
pnpm --version
```

**Expected Output:**
```
9.15.4
```

**Success Criteria:**
- Version matches or exceeds 9.0.0

**Troubleshooting:**
- If pnpm is not installed: `npm install -g pnpm@9.15.4`
- If version is too old: `npm update -g pnpm`

---

## Test 1.2: Verify Node.js Version

**Command:**
```bash
node --version
```

**Expected Output:**
```
v18.x.x or v20.x.x
```

**Success Criteria:**
- Version is 18.0.0 or higher

**Troubleshooting:**
- Install Node.js 20 LTS from [nodejs.org](https://nodejs.org/)
- Consider using nvm (Node Version Manager) for multiple Node versions

---

## Test 1.3: Install All Dependencies

**Command:**
```bash
pnpm install
```

**Expected Behavior:**
- Downloads and installs all packages from npm registry
- Links workspace packages together
- Creates node_modules directories in root and all packages

**Expected Output:**
```
Lockfile is up to date, resolution step is skipped
Packages: +XXX
+++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved XXX, reused XXX, downloaded XXX, added XXX, done

dependencies:
+ @repo/api 1.0.0 <- apps/api
+ @repo/shared-types 1.0.0 <- packages/shared-types
+ @repo/web 1.0.0 <- apps/web

Done in XXXs
```

**Duration:** 2-5 minutes depending on internet speed

**Success Criteria:**
- No error messages in output
- Creates node_modules in root and all packages
- Creates or updates pnpm-lock.yaml

**Troubleshooting:**
- **EACCES permission errors**: Run with appropriate permissions (may need sudo on Linux/Mac)
- **Network errors**: Check internet connection, try again, or configure npm registry mirror
- **Peer dependency warnings**: These are expected with `strict-peer-dependencies=false` in .npmrc

---

## Test 1.4: Verify Workspace Configuration

**Command:**
```bash
cat pnpm-workspace.yaml
```

**Windows Alternative:**
```cmd
type pnpm-workspace.yaml
```

**Expected Content:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Success Criteria:**
- File exists in repository root
- Contains correct package patterns
- Includes both apps/* and packages/*

---

## Test 1.5: List Workspace Packages

**Command:**
```bash
pnpm list --depth 0
```

**Expected Output:**
```
Legend: production dependency, optional only, dev only

<root> /path/to/LearnSessionPlanner

dependencies:
@repo/api 1.0.0 <- apps/api
@repo/shared-types 1.0.0 <- packages/shared-types
@repo/web 1.0.0 <- apps/web
```

**Success Criteria:**
- Lists all three workspace packages: @repo/web, @repo/api, @repo/shared-types
- Shows correct symlink paths

**Troubleshooting:**
- If packages missing: Check pnpm-workspace.yaml patterns
- If not listed: Run `pnpm install` again

---

## Test 1.6: Verify Workspace Links

**Command:**
```bash
pnpm list @repo/shared-types --depth 0
```

**Expected Output:**
```
<root> /path/to/LearnSessionPlanner

@repo/api
dependencies:
@repo/shared-types 1.0.0 <- ../../packages/shared-types

@repo/web
dependencies:
@repo/shared-types 1.0.0 <- ../../packages/shared-types
```

**Success Criteria:**
- Both @repo/web and @repo/api show @repo/shared-types as a dependency
- Dependency uses workspace:* protocol (resolved to local path)

**Troubleshooting:**
- If not linked: Run `pnpm install` again
- If version mismatch: Check package.json files use workspace:*

---

## Test 1.7: Verify .npmrc Configuration

**Command:**
```bash
cat .npmrc
```

**Windows Alternative:**
```cmd
type .npmrc
```

**Expected Content:**
```
auto-install-peers=true
save-workspace-protocol=true
strict-peer-dependencies=false
link-workspace-packages=true
```

**Success Criteria:**
- File exists in repository root
- Contains workspace configuration settings
- `auto-install-peers=true` (automatically install peer dependencies)
- `save-workspace-protocol=true` (use workspace:* in package.json)
- `link-workspace-packages=true` (link local packages instead of installing from registry)

---

## Test 1.8: Check for node_modules Hoisting

**Command:**
```bash
ls -la node_modules/@repo
```

**Windows Alternative:**
```cmd
dir node_modules\@repo
```

**Expected Output:**
```
api -> ../apps/api
shared-types -> ../packages/shared-types
web -> ../apps/web
```

**Success Criteria:**
- Shows symlinks (or junctions on Windows) to workspace packages
- Symlinks point to correct package directories

**Note:** On Windows, these may appear as `<JUNCTION>` or `<SYMLINKD>` in directory listings

---

## Test 1.9: Verify Package Manager Lock

**Command:**
```bash
ls -la pnpm-lock.yaml
```

**Windows Alternative:**
```cmd
dir pnpm-lock.yaml
```

**Expected Output:**
- File exists and is not empty
- File size > 0 bytes

**Success Criteria:**
- pnpm-lock.yaml is present in repository root
- Contains dependency tree with resolved versions

**Troubleshooting:**
- If missing: Run `pnpm install` to generate
- If outdated: Run `pnpm install` to update

---

## Test 1.10: Test Root Scripts

**Command:**
```bash
pnpm run
```

**Expected Output:**
```
Lifecycle scripts:
  preinstall
    npx only-allow pnpm

Commands available via "pnpm run":
  dev
    pnpm --parallel --filter \"@repo/*\" dev
  build
    pnpm --filter \"@repo/shared-types\" build && pnpm --filter \"@repo/api\" build && pnpm --filter \"@repo/web\" build
  typecheck
    pnpm --parallel -r typecheck
  docker:build
    docker-compose build
  docker:dev
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
  docker:prod
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
  docker:down
    docker-compose down
  docker:clean
    docker-compose down -v --rmi all
```

**Success Criteria:**
- Shows all available root-level scripts
- Includes dev, build, typecheck, and docker:* scripts

---

## Phase 1 Completion Checklist

Verify all items before proceeding to Phase 2:

- [ ] pnpm version is 9.0.0 or higher
- [ ] Node.js version is 18.0.0 or higher
- [ ] All dependencies installed successfully
- [ ] pnpm-workspace.yaml exists and is correct
- [ ] Workspace packages are listed correctly (@repo/web, @repo/api, @repo/shared-types)
- [ ] Shared-types is linked in both web and api packages
- [ ] .npmrc configuration is correct
- [ ] node_modules/@repo shows symlinks to workspace packages
- [ ] pnpm-lock.yaml exists and is not empty
- [ ] Root scripts are available

---

## Next Steps

✅ **If all tests pass**: Proceed to [PHASE_2_SHARED_TYPES.md](PHASE_2_SHARED_TYPES.md)

❌ **If any tests fail**: Resolve issues before continuing. Refer to [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common problems and solutions.

---

## Additional Notes

### Understanding pnpm Workspaces

pnpm workspaces provide several advantages:

1. **Efficient Disk Usage**: Shared dependencies are stored once in a content-addressable store
2. **Fast Installs**: pnpm reuses packages across projects
3. **Strict Dependency Resolution**: Packages only have access to declared dependencies
4. **Workspace Protocol**: Use `workspace:*` to link local packages

### Common Issues

**Issue**: "only-allow pnpm" error when using npm or yarn

**Solution**: This is intentional. The project enforces pnpm usage via a preinstall script.

**Issue**: Symlinks not working on Windows

**Solution**: Run terminal as Administrator, or enable Developer Mode in Windows settings.

**Issue**: pnpm-lock.yaml conflicts in git

**Solution**: Always run `pnpm install` after pulling changes to regenerate the lock file.
