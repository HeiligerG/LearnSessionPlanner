# @repo/shared-types

Shared TypeScript type definitions for the Learn Session Planner monorepo.

## Purpose

This package provides type-safe contracts between the frontend (`@repo/web`) and backend (`@repo/api`). By sharing types, we ensure:
- Type safety across the full stack
- Single source of truth for data structures
- Reduced duplication and maintenance burden
- Compile-time validation of API contracts

## Structure

```
src/
├── entities/        # Domain models (User, Session, Progress)
├── dtos/            # API request/response types
├── enums/           # Shared enumerations
└── index.ts         # Main entry point
```

## Usage

**In the API (NestJS):**
```typescript
import { User, CreateSessionDto, SessionCategory } from '@repo/shared-types';

// Use in controllers, services, etc.
```

**In the Web app (React):**
```typescript
import { User, Session, LoginDto } from '@repo/shared-types';

// Use in components, API client, etc.
```

## Type Categories

**Entities:** Domain models representing database tables (User, Session, Progress). These match Prisma schema but exclude sensitive fields (e.g., password) from public-facing types.

**DTOs:** Data Transfer Objects for API requests and responses (CreateSessionDto, LoginDto, etc.). These define the shape of data sent over HTTP.

**Enums:** Shared enumerations for type-safe categorization (SessionCategory, etc.).

## Adding New Types

1. Create a new file in the appropriate directory (entities/, dtos/, enums/)
2. Define your types/interfaces/enums
3. Export from the directory's index.ts
4. The main index.ts will automatically re-export

## Best Practices

- **Never include sensitive data** (passwords, tokens) in public-facing types
- Use **string enums** for better serialization
- Keep types **pure** (no runtime code, no dependencies)
- Use **utility types** (Partial, Omit, Pick) to derive related types
- Add **JSDoc comments** for complex types
- Use **Date** type for timestamps (serialized as ISO strings in JSON)

## TypeScript Project References

This package uses TypeScript project references (`composite: true`) for optimal monorepo integration. Both apps reference this package in their tsconfig for incremental builds and better IDE performance.

## No Build Step

This package exports TypeScript source files directly (no build step). TypeScript resolves types from source, which is simpler and works perfectly for type-only packages.
