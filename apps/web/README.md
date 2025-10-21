# @repo/web - Learn Session Planner Frontend

Modern React frontend application for the Learn Session Planner, built with Vite, TypeScript, and React Router.

## Tech Stack

- **React 18** with TypeScript
- **Vite** - Lightning-fast build tool with HMR
- **React Router v6** - Client-side routing with data APIs
- **SWC** - Fast TypeScript/JSX transpilation
- **Vite TSConfig Paths** - Automatic path alias resolution

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
└── index.css         # Global styles and CSS variables
```

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

The app will open automatically at [http://localhost:3000](http://localhost:3000)

### Building for Production

Type-check and build the application:

```bash
# From monorepo root
pnpm --filter @repo/web build

# Or from this directory
pnpm build
```

Build output will be in the `dist/` directory.

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
| `pnpm dev`   | Start development server (http://localhost:3000) |
| `pnpm build` | Type-check and build for production           |
| `pnpm preview` | Preview production build locally             |
| `pnpm typecheck` | Run TypeScript type checking               |
| `pnpm lint`  | Run ESLint (to be configured)                  |

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
