# @repo/web - Learn Session Planner Frontend

Modern React frontend application for the Learn Session Planner, built with Vite, TypeScript, and React Router.

## Tech Stack

- **React 18** with TypeScript
- **Vite 6** - Lightning-fast build tool with HMR
- **Tailwind CSS 3** - Utility-first CSS framework
- **React Router v6** - Client-side routing with data APIs
- **SWC** - Fast TypeScript/JSX transpilation
- **Vite TSConfig Paths** - Automatic path alias resolution
- **PostCSS** with Autoprefixer - CSS processing and vendor prefixes

## Project Structure

```
src/
├── components/        # Reusable UI components
│   └── layouts/      # Layout components (RootLayout, etc.)
├── pages/            # Route/page components
├── hooks/            # Custom React hooks
├── services/         # API client and service layer
│   └── api.ts       # Base API configuration
├── types/            # TypeScript type definitions
├── router.tsx        # React Router configuration
├── main.tsx          # Application entry point
└── index.css         # Tailwind directives and custom styles
```

## Styling with Tailwind CSS

This project uses Tailwind CSS for styling with a utility-first approach.

### Configuration

- `tailwind.config.js` - Tailwind configuration with custom theme values
- `postcss.config.js` - PostCSS configuration for Tailwind processing
- `src/index.css` - Tailwind directives and custom styles

### Custom Theme

The Tailwind theme is customized to match the original design system:

**Colors:**
- Primary: `bg-blue-600`, `text-blue-600`, `border-blue-600`
- Secondary: `bg-gray-600`, `text-gray-600`
- Success: `bg-green-600`, `text-green-600`
- Error: `bg-red-600`, `text-red-600`
- Warning: `bg-yellow-500`, `text-yellow-500`
- Info: `bg-cyan-600`, `text-cyan-600`
- Neutral: `bg-gray-50`, `bg-gray-100`, `text-gray-600`, `text-gray-900`

**Typography:**
- Font sizes: `text-xs` to `text-5xl`
- Font weights: `font-normal`, `font-medium`, `font-semibold`, `font-bold`

**Spacing:**
- Use Tailwind's spacing scale: `p-4`, `m-8`, `gap-6`, etc.
- 1 unit = 0.25rem (4px)

**Border radius:**
- `rounded-sm` (4px), `rounded` (8px), `rounded-lg` (12px), `rounded-full` (9999px)

### Usage Examples

**Button:**
```tsx
<button className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-dark transition-colors">
  Click me
</button>
```

**Card:**
```tsx
<div className="rounded-lg bg-white p-6 shadow-md">
  <h3 className="text-xl font-bold text-gray-900">Card Title</h3>
  <p className="text-gray-600">Card content</p>
</div>
```

**Responsive Grid:**
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Grid items */}
</div>
```

### Best Practices

1. **Use utility classes directly in JSX** - Avoid creating custom CSS classes unless absolutely necessary
2. **Extract repeated patterns into components** - Not into CSS classes
3. **Use responsive prefixes** - `sm:`, `md:`, `lg:`, `xl:`, `2xl:` for mobile-first design
4. **Use state variants** - `hover:`, `focus:`, `active:`, `disabled:`, `group-hover:` for interactivity
5. **Use `@apply` sparingly** - Only for very complex repeated patterns in `@layer components`
6. **Leverage Tailwind's IntelliSense** - Install the official VS Code extension for autocomplete

### Adding Custom Styles

If you need custom styles not provided by Tailwind:

**1. Extend the theme in `tailwind.config.js`:**
```javascript
theme: {
  extend: {
    colors: {
      brand: '#your-color',
    },
  },
}
```

**2. Add custom utilities in `src/index.css`:**
```css
@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

### Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)
- [Tailwind UI Components](https://tailwindui.com/) (paid)
- [Headless UI](https://headlessui.com/) (free, unstyled components)

## Getting Started

### Prerequisites

- Node.js 18+ (or 20+ recommended)
- pnpm 9.x

### Installation

From the monorepo root:

```bash
pnpm install
```

### Environment Setup

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Edit `.env` with your local configuration:

```env
VITE_API_URL=http://localhost:4000/api
```

### Development

Start the development server with hot reload:

```bash
# From monorepo root
pnpm --filter @repo/web dev

# Or from this directory
pnpm dev
```

The app will open automatically at [http://localhost:5173](http://localhost:5173)

**Note:** Tailwind CSS is automatically processed via PostCSS during development. Changes to Tailwind classes trigger hot-reload.

### Building for Production

Type-check and build the application:

```bash
# From monorepo root
pnpm --filter @repo/web build

# Or from this directory
pnpm build
```

Build output will be in the `dist/` directory.

**Note:** Production builds automatically purge unused Tailwind classes, resulting in a minimal CSS bundle.

### Preview Production Build

Preview the production build locally:

```bash
pnpm --filter @repo/web preview
# or: pnpm preview
```

### Type Checking

Run TypeScript type checking without building:

```bash
pnpm typecheck
```

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@pages/*` → `src/pages/*`
- `@hooks/*` → `src/hooks/*`
- `@services/*` → `src/services/*`
- `@types/*` → `src/types/*`

**Example:**

```typescript
// Instead of: import { Button } from '../../../components/common/Button'
import { Button } from '@components/common/Button'

// Instead of: import { apiClient } from '../../services/api'
import { apiClient } from '@services/api'
```

Path aliases are automatically resolved by the `vite-tsconfig-paths` plugin.

## Environment Variables

Environment variables must be prefixed with `VITE_` to be exposed to the client:

- `VITE_API_URL` - Backend API base URL (default: `http://localhost:4000/api`)

Access in code via `import.meta.env.VITE_API_URL`.

**Note:** Never commit `.env` files. Use `.env.example` as a template.

## Available Scripts

| Script       | Description                                    |
| ------------ | ---------------------------------------------- |
| `pnpm dev`   | Start development server (http://localhost:5173) |
| `pnpm build` | Type-check and build for production           |
| `pnpm preview` | Preview production build locally             |
| `pnpm typecheck` | Run TypeScript type checking               |
| `pnpm lint`  | Run ESLint (to be configured)                  |

## Docker

The web application is containerized with a multi-stage Dockerfile using nginx for production.

### Docker Development

Run the web app with hot-reload in Docker:

```bash
# From monorepo root
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up web

# Or start all services
pnpm docker:dev
```

**Development features:**
- Vite dev server with HMR running on port 5173
- Source code mounted for hot-reload
- Shared-types changes reflected automatically
- Connected to dockerized API

### Docker Production

Build and run production image with nginx:

```bash
# Build production image (from monorepo root)
docker build -f apps/web/Dockerfile -t lsp-web:latest .

# Run production container
docker run -d -p 3000:80 lsp-web:latest

# Or use docker-compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Dockerfile Stages

1. **dependencies** - Install pnpm and project dependencies
2. **builder** - Build shared-types and Vite production bundle
3. **production** - Serve with nginx (~50MB final image)

### Build Arguments

The `VITE_API_URL` must be provided at build time:

```bash
docker build \
  --build-arg VITE_API_URL=https://api.example.com/api \
  -f apps/web/Dockerfile \
  -t lsp-web:latest .
```

In docker-compose, set via environment:

```yaml
build:
  args:
    VITE_API_URL: ${VITE_API_URL}
```

### nginx Configuration

Custom nginx configuration ([nginx.conf](nginx.conf)):
- SPA routing with fallback to index.html
- Aggressive caching for assets (1 year)
- No caching for index.html
- Gzip compression
- Security headers (X-Frame-Options, CSP, etc.)

### Health Check

The Dockerfile includes a health check:

```bash
# Check container health
docker ps
# Look for "healthy" status
```

### Image Size Optimization

Production image is ~50MB with:
- Multi-stage build (build artifacts not included)
- nginx:alpine base image
- Static files only in final stage
- Non-root user for security

## Future Enhancements

- **State Management:** Zustand, Redux Toolkit, or TanStack Query
- **UI Library:** shadcn/ui, Material-UI, or custom design system
- **Forms:** React Hook Form + Zod validation
- **Testing:** Vitest + React Testing Library
- **E2E Testing:** Playwright
- **CSS Framework:** Consider Tailwind CSS or CSS Modules
- **PWA Support:** Service workers for offline capability

## Code Style

- Use functional components with hooks
- Prefer named exports for components
- Follow the [Airbnb TypeScript style guide](https://github.com/airbnb/javascript)
- Keep components small and focused
- Extract reusable logic into custom hooks

## Learn More

- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
