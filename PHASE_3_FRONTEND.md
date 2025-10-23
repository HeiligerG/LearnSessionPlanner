# Phase 3: Frontend Tests

**Objective:** Verify that the React frontend with Vite and Tailwind CSS works correctly in both development and production modes.

**Duration:** 20-30 minutes
**Prerequisites:** Phase 1 and Phase 2 must be completed successfully. Shared-types package must be built.

---

## Test 3.1: Type-Check Frontend

**Command:**
```bash
pnpm --filter @repo/web typecheck
```

**Expected Output:**
```
> @repo/web@1.0.0 typecheck
> tsc --noEmit
```

**Success Criteria:**
- Compilation succeeds with no errors
- No TypeScript errors or warnings
- Exit code 0

**Troubleshooting:**
- **Module errors**: Ensure shared-types is built (`pnpm --filter @repo/shared-types build`)
- **Import path errors**: Check tsconfig.json path aliases
- **Type errors**: Review and fix TypeScript issues in source files

---

## Test 3.2: Start Development Server

**Command:**
```bash
pnpm --filter @repo/web dev
```

**Expected Output:**
```
> @repo/web@1.0.0 dev
> vite

  VITE v6.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Duration:** Server starts in 2-5 seconds

**Success Criteria:**
- Server starts without errors
- Shows local URL (http://localhost:5173/)
- No compilation errors

**Troubleshooting:**
- **Port 5173 in use**: Change port in vite.config.ts or kill conflicting process
- **Module resolution errors**: Ensure shared-types is built and node_modules are installed
- **Cannot find @repo/shared-types**: Run `pnpm install` to link workspace packages

**Note:** Keep this server running for subsequent tests

---

## Test 3.3: Verify Landing Page

**Action:** Open browser to http://localhost:5173

**Expected Result:**
- Page loads without errors (200 OK)
- Shows "Learn Session Planner" title
- Shows tagline: "Plan, track, and optimize your learning sessions with intelligent scheduling and progress monitoring."
- Shows "Get Started" button
- Shows three feature cards:
  - Daily Planning
  - Weekly Overview
  - Progress Tracking

**Success Criteria:**
- All content renders correctly
- No visual glitches or missing elements
- Fonts load correctly
- Images/icons load (if any)

**Browser Console Check:**
- Open DevTools Console (F12)
- Should have no errors (red messages)
- May see info logs about API base URL

---

## Test 3.4: Verify Tailwind CSS Styles

**Action:** Inspect elements in browser DevTools

**Steps:**
1. Right-click on the page title
2. Select "Inspect" or "Inspect Element"
3. Review the computed styles

**Expected Result:**
- Elements have Tailwind utility classes: `flex`, `text-gray-900`, `bg-primary`, etc.
- Custom theme colors are applied:
  - Primary: #007bff (blue)
  - Hover states work on buttons
- Responsive classes are present: `md:grid-cols-2`, `lg:grid-cols-3`
- Typography classes: `text-2xl`, `font-bold`, etc.

**Success Criteria:**
- Tailwind classes are compiled and applied
- Custom theme values from tailwind.config.js are used
- No unstyled or broken layout elements

**Troubleshooting:**
- **No styles applied**: Check postcss.config.js and tailwind.config.js exist
- **Wrong colors**: Review tailwind.config.js theme.extend.colors
- **Classes not working**: Ensure @tailwind directives are in src/index.css

---

## Test 3.5: Test Navigation

**Action:** Click "Dashboard" link in header

**Expected Result:**
- URL changes to http://localhost:5173/dashboard
- Page transitions without full page reload (SPA behavior)
- Dashboard page loads showing:
  - "Dashboard" heading
  - Welcome message
  - "Coming Soon" section with feature list

**Success Criteria:**
- Navigation works without page reload
- React Router handles route change
- No console errors

---

## Test 3.6: Test Browser Back Button

**Action:** Click browser back button

**Expected Result:**
- Returns to landing page (http://localhost:5173/)
- Page content changes back to landing page
- No page reload (SPA behavior)

**Success Criteria:**
- React Router handles browser navigation
- Application state is maintained

---

## Test 3.7: Test Direct URL Access

**Action:** Navigate directly to http://localhost:5173/dashboard in a new tab

**Expected Result:**
- Dashboard page loads correctly
- Shows same content as when navigating via link
- No 404 error

**Success Criteria:**
- Deep linking works
- Vite dev server handles SPA routing

---

## Test 3.8: Test Hot Module Replacement (HMR)

**Action:**
1. Keep browser open at http://localhost:5173
2. Open `apps/web/src/pages/LandingPage.tsx` in editor
3. Change the title text (e.g., "Learn Session Planner" → "Learn Session Planner - TEST")
4. Save the file

**Expected Result:**
- Page updates automatically within 1-2 seconds
- No full page reload
- Terminal shows "[vite] hmr update /src/pages/LandingPage.tsx"
- Changed text appears in browser

**Success Criteria:**
- Changes appear automatically
- No page reload (preserves application state)
- No errors in console

**Troubleshooting:**
- **HMR not working**: Check Vite config, restart dev server
- **Full page reload**: May happen for some types of changes (expected)

---

## Test 3.9: Verify Shared Types Import

**Action:**
1. Open `apps/web/src/services/api.ts` in editor
2. Review imports from '@repo/shared-types'

**Expected Code:**
```typescript
import type { ApiResponse, /* other types */ } from '@repo/shared-types';
```

**Success Criteria:**
- TypeScript recognizes shared types
- No import errors in IDE
- Hover over imported types shows definitions
- IntelliSense works for shared types

**Test in Browser Console:**
```javascript
// This should not cause errors
fetch('http://localhost:4000/api/health')
  .then(r => r.json())
  .then(console.log)
```

---

## Test 3.10: Test Responsive Design

**Action:** Resize browser window or use DevTools device emulation

**Steps:**
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Test different screen sizes:
   - Mobile: 375px width
   - Tablet: 768px width
   - Desktop: 1440px width

**Expected Result:**
- **Mobile (< 768px)**: Feature cards stack vertically (1 column)
- **Tablet (768px - 1024px)**: Feature cards in 2 columns
- **Desktop (> 1024px)**: Feature cards in 3 columns
- Header adapts to screen size
- Text remains readable at all sizes

**Success Criteria:**
- Layout adapts to screen size
- No horizontal scrollbar (except on very small screens)
- All content remains accessible
- Tailwind responsive classes work correctly

---

## Test 3.11: Check Browser Console

**Action:** Open browser DevTools console (F12 → Console tab)

**Expected Result:**
- No error messages (red)
- May see info logs:
  - "[API Client] Base URL: http://localhost:4000/api" (in development)
- No warning messages about deprecated APIs

**Success Criteria:**
- Clean console with no errors
- Application runs without warnings

---

## Test 3.12: Build for Production

**Command:**
```bash
pnpm --filter @repo/web build
```

**Expected Output:**
```
> @repo/web@1.0.0 build
> tsc && vite build

vite v6.x.x building for production...
✓ XXX modules transformed.
dist/index.html                   X.XX kB │ gzip:  X.XX kB
dist/assets/index-abc123.css     XX.XX kB │ gzip:  X.XX kB
dist/assets/index-xyz789.js     XXX.XX kB │ gzip: XX.XX kB
✓ built in XXXms
```

**Duration:** 10-30 seconds

**Success Criteria:**
- Build completes without errors
- Creates `apps/web/dist` directory
- Generates index.html
- Generates hashed asset files (CSS and JS)
- No TypeScript compilation errors
- Bundle sizes are reasonable

**Troubleshooting:**
- **TypeScript errors**: Fix errors shown, then rebuild
- **Build fails**: Check vite.config.ts configuration
- **Out of memory**: Increase Node.js heap size: `NODE_OPTIONS=--max-old-space-size=4096 pnpm build`

---

## Test 3.13: Verify Production Build Output

**Command:**
```bash
ls apps/web/dist
```

**Windows Alternative:**
```cmd
dir apps\web\dist
```

**Expected Output:**
```
index.html
assets/
  index-abc123.css
  index-xyz789.js
```

**Success Criteria:**
- index.html exists
- assets/ directory exists
- CSS file with content hash exists
- JS file with content hash exists
- Files have proper content hashes for cache busting

---

## Test 3.14: Check Bundle Sizes

**Command:**
```bash
ls -lh apps/web/dist/assets
```

**Windows Alternative:** Check file sizes in File Explorer

**Expected Result:**
- **Main JS bundle**: < 500 KB uncompressed (< 150 KB gzipped)
- **CSS bundle**: < 50 KB uncompressed (< 10 KB gzipped)

**Success Criteria:**
- Bundle sizes are reasonable for a React SPA
- Tailwind CSS is purged (only used classes included)
- No unexpectedly large files

**Note:** Exact sizes depend on dependencies and features

**Troubleshooting:**
- **Large bundle**: Use `vite-bundle-visualizer` to analyze
- **CSS not purged**: Check tailwind.config.js content patterns

---

## Test 3.15: Preview Production Build

**Command:**
```bash
pnpm --filter @repo/web preview
```

**Expected Output:**
```
> @repo/web@1.0.0 preview
> vite preview

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Success Criteria:**
- Production build serves correctly
- Application works as expected
- No console errors

**Test:**
1. Navigate to http://localhost:5173
2. Verify landing page loads
3. Test navigation to dashboard
4. Check that all features work

**Note:** This serves the built files from dist/, not source files

---

## Test 3.16: Verify Production Optimizations

**Action:** Open browser DevTools Network tab while previewing production build

**Expected Observations:**
- **Assets are minified**: No whitespace, variables renamed
- **Content hashing**: Filenames include content hashes
- **Compression**: Files are served compressed (if using nginx)
- **Caching**: Assets have long cache headers (when deployed)

**Success Criteria:**
- Production optimizations are applied
- Bundle is minified and optimized
- Ready for deployment

**Troubleshooting:**
- **Not minified**: Check vite.config.ts build settings
- **Source maps in production**: Verify build.sourcemap is false or 'hidden'

---

## Phase 3 Completion Checklist

Verify all items before proceeding to Phase 4:

- [ ] Frontend type-checks successfully
- [ ] Dev server starts without errors
- [ ] Landing page renders correctly with all content
- [ ] Tailwind CSS styles are applied correctly
- [ ] Custom theme colors are working
- [ ] Navigation works (React Router)
- [ ] Browser back/forward buttons work
- [ ] Direct URL access works (deep linking)
- [ ] HMR works (hot reload on file changes)
- [ ] Shared types import correctly from @repo/shared-types
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] No browser console errors
- [ ] Production build succeeds
- [ ] Build output structure is correct
- [ ] Bundle sizes are reasonable
- [ ] Production preview works

---

## Next Steps

✅ **If all tests pass**: Proceed to [PHASE_4_BACKEND.md](PHASE_4_BACKEND.md)

❌ **If any tests fail**: Resolve issues before continuing. Refer to [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common problems and solutions.

**Note:** Keep the dev server running if you want to test integration with the backend later (Phase 6).

---

## Additional Notes

### Understanding Vite

Vite is a modern build tool that provides:
- **Fast Dev Server**: Uses native ES modules, no bundling in dev
- **Hot Module Replacement**: Instant updates without page reload
- **Optimized Production Builds**: Uses Rollup for efficient bundling
- **Built-in TypeScript Support**: No additional configuration needed

### Tailwind CSS Integration

Tailwind is processed via PostCSS:
1. PostCSS reads `postcss.config.js`
2. Tailwind plugin processes `@tailwind` directives in `src/index.css`
3. Vite includes PostCSS automatically
4. In production, unused classes are purged based on `tailwind.config.js` content patterns

### Common Issues

**Issue**: "Failed to resolve import '@repo/shared-types'"

**Solution**: Build shared-types package first, ensure workspace links are correct

**Issue**: Tailwind styles not applying

**Solution**: Check that `@tailwind` directives are in `src/index.css` and PostCSS is configured

**Issue**: HMR not working

**Solution**: Restart dev server, check Vite configuration, ensure file watcher has permissions
