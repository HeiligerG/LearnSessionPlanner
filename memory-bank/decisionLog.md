# Decision Log - Learn Session Planner

> **Purpose:** Document important technical and architectural decisions, including context, alternatives considered, and rationale. This helps maintain consistency and provides context for future changes.

---

## How to Use This Log

### Entry Template
```markdown
### [Decision Title]
**Date:** YYYY-MM-DD
**Context:** Why this decision was needed
**Decision:** What was decided
**Alternatives Considered:**
- Alternative 1: Pros/cons
- Alternative 2: Pros/cons

**Rationale:** Why this option was chosen
**Consequences:**
- Positive impacts
- Negative impacts / trade-offs
- Technical debt incurred (if any)

**Follow-up Tasks:**
- [ ] Related tasks or future work
```

---

## Decisions

### 1. Use pnpm as Package Manager
**Date:** Project inception (2024)
**Context:** Need a package manager for monorepo with multiple TypeScript projects

**Decision:** Use pnpm 9.15.4 as the primary package manager

**Alternatives Considered:**
- **npm:** Standard, widely supported
  - Cons: Slower, larger node_modules, less efficient disk usage
- **yarn:** Good performance, popular
  - Cons: Workspace support less mature than pnpm, larger footprint
- **pnpm:** Fast, efficient, excellent workspace support
  - Pros: Symlinked node_modules saves disk space, fast install, great monorepo support
  - Cons: Slightly less common than npm/yarn

**Rationale:**
- Monorepo benefits from pnpm's efficient workspace handling
- Significant disk space savings through symlinks
- Fastest install times among package managers
- Built-in workspace protocol support (`workspace:*`)

**Consequences:**
- **Positive:** Faster CI builds, smaller Docker images, efficient local development
- **Negative:** Team members must install pnpm (documented in README)
- **Trade-off:** Slightly less common tool, but well-documented

**Follow-up Tasks:**
- ✅ Document pnpm installation in README
- ✅ Add `packageManager` field to package.json
- [ ] Add pnpm installation to CI/CD setup (when implemented)

---

### 2. Use NestJS for Backend Framework
**Date:** Project inception (2024)
**Context:** Need a Node.js backend framework for REST API

**Decision:** Use NestJS with TypeScript

**Alternatives Considered:**
- **Express.js:** Minimal, flexible, widely used
  - Pros: Lightweight, huge ecosystem, simple
  - Cons: No structure, requires manual setup for DI/validation/auth
- **Fastify:** Very fast, good plugin system
  - Pros: Better performance than Express
  - Cons: Less structure than NestJS, smaller ecosystem
- **NestJS:** Opinionated, Angular-inspired architecture
  - Pros: Built-in DI, decorators, modules, validation, testing support
  - Cons: More boilerplate, steeper learning curve

**Rationale:**
- Project benefits from structure and conventions
- Built-in support for TypeScript, decorators, and DI
- Excellent integration with Prisma, JWT, validation libraries
- Modular architecture scales well as project grows
- Good documentation and active community

**Consequences:**
- **Positive:** Clean separation of concerns, testable code, consistent patterns
- **Negative:** More boilerplate than Express, opinionated structure
- **Trade-off:** Steeper learning curve, but better maintainability

**Follow-up Tasks:**
- ✅ Set up modular structure (auth, sessions, templates, users)
- [ ] Add automated testing (leverage NestJS testing utilities)
- [ ] Document module architecture in project docs

---

### 3. Use Prisma ORM for Database Access
**Date:** Project inception (2024)
**Context:** Need type-safe database access layer for PostgreSQL

**Decision:** Use Prisma 6.1 as the ORM

**Alternatives Considered:**
- **TypeORM:** Popular, decorators-based
  - Pros: Similar syntax to NestJS, widely used
  - Cons: Less type-safe, migration workflow less smooth
- **Knex.js + manual typing:** SQL query builder
  - Pros: Full SQL control, lightweight
  - Cons: Manual type definitions, more boilerplate
- **Prisma:** Schema-first, generates types
  - Pros: Excellent type safety, great migration workflow, Prisma Studio
  - Cons: Less flexible for complex queries, learning curve

**Rationale:**
- Prisma's generated types provide end-to-end type safety
- Migration workflow is smooth and reliable
- Prisma Studio provides excellent database GUI
- Integration with NestJS is straightforward
- Schema-first approach keeps database structure visible

**Consequences:**
- **Positive:** Type errors caught at compile time, great DX, easy migrations
- **Negative:** Complex queries may require raw SQL, larger client bundle
- **Trade-off:** Less query flexibility, but much better type safety

**Follow-up Tasks:**
- ✅ Set up Prisma schema and migrations
- ✅ Create seed script for development data
- [ ] Add database indexing for performance (as needed)
- [ ] Document common query patterns

---

### 4. Use React Query for Client-Side State Management
**Date:** 2025-01-10
**Context:** Need efficient data fetching and caching for frontend, reduce server load and improve UX

**Decision:** Integrate React Query (@tanstack/react-query) with optimistic updates

**Alternatives Considered:**
- **Redux + RTK Query:** Centralized state management
  - Pros: Powerful, well-established, great DevTools
  - Cons: More boilerplate, overkill for this app's complexity
- **SWR:** Similar to React Query, by Vercel
  - Pros: Simpler API, smaller bundle
  - Cons: Less feature-rich than React Query, smaller ecosystem
- **React Query:** Focused on async state
  - Pros: Excellent caching, optimistic updates, automatic refetching, great DevTools
  - Cons: Learning curve for optimistic updates pattern

**Rationale:**
- React Query is specifically designed for server state
- Optimistic updates provide instant feedback to users
- Automatic background refetching keeps data fresh
- Built-in loading and error states reduce boilerplate
- DevTools help debug cache and queries

**Consequences:**
- **Positive:** Faster perceived performance, less boilerplate, better UX
- **Negative:** Added dependency, need to understand query invalidation patterns
- **Trade-off:** More complex than simple fetch, but much better DX and UX

**Follow-up Tasks:**
- ✅ Convert `useSessions` and `useTemplates` to React Query
- ✅ Implement optimistic updates for creates, updates, deletes
- [ ] Fine-tune cache settings (staleTime, cacheTime) based on usage
- [ ] Document query key conventions for team

---

### 5. Fix NestJS Route Ordering (Literal Before Parameterized)
**Date:** 2025-01-10
**Context:** `/api/sessions/gamification` and `/api/sessions/suggestions` returning 400 errors due to being matched by `/:id` route

**Decision:** Move literal routes before parameterized routes in controller

**Alternatives Considered:**
- **Use route prefixes:** Create separate controller for special routes
  - Pros: Complete separation
  - Cons: Unnecessary complexity, harder to maintain
- **Use custom route guards:** Add validation logic to skip literal paths
  - Pros: Keep routes in same order
  - Cons: Hacky, adds unnecessary complexity
- **Reorder routes:** Place literal routes first (standard practice)
  - Pros: Simple, follows NestJS conventions, no extra code
  - Cons: Must remember ordering when adding new routes

**Rationale:**
- NestJS matches routes sequentially from top to bottom
- Parameterized routes act as catch-alls and should always come last
- This is standard NestJS practice documented in official docs
- No additional code or complexity needed

**Consequences:**
- **Positive:** Bug fixed, follows best practices, future-proof
- **Negative:** Must be mindful of route order when adding new endpoints
- **Trade-off:** None - this is the correct approach

**Follow-up Tasks:**
- ✅ Move `/gamification` and `/suggestions` before `/:id`
- ✅ Remove duplicate route definitions
- [ ] Add comment in controller about route ordering
- [ ] Document this pattern in `.clinerules`

---

### 6. Build Entire Project with AI (Claude Code)
**Date:** Project inception (2024)
**Context:** Explore AI-assisted development capabilities and demonstrate AI as a valid learning tool

**Decision:** Create the entire project using Claude Code without writing code manually

**Alternatives Considered:**
- **Traditional development:** Write code manually
  - Pros: Full control, learning by doing
  - Cons: Slower, may miss patterns, standard learning path
- **AI-assisted development:** Use AI as co-pilot
  - Pros: Faster, learn AI tools, see patterns, create something useful
  - Cons: Less "hands-on keyboard" experience

**Rationale:**
- Learning to effectively use AI tools is increasingly valuable
- AI can demonstrate best practices and patterns
- Creates a useful product while exploring AI capabilities
- Shows that AI development is a valid learning path
- Quote from creator: "Learning AI exploration is as valuable as learning a new programming language, if not more so in today's world"

**Consequences:**
- **Positive:** Faster development, consistent patterns, complete project
- **Negative:** Less "manual coding" practice, reliance on AI quality
- **Trade-off:** Different learning approach, but aligned with modern development

**Follow-up Tasks:**
- ✅ Document AI-assisted nature in README
- ✅ Make project open source
- [ ] Share insights about AI-assisted development process
- [ ] Document lessons learned for others exploring AI tools

---

## Future Decisions to Document

As the project evolves, document decisions about:
- Testing strategy and framework choices
- CI/CD pipeline setup
- Deployment strategy (cloud provider, hosting)
- Monitoring and observability tools
- Mobile app architecture (React Native)
- API versioning strategy (if needed)
- Authentication enhancements (OAuth, SSO)
- Data backup and recovery procedures

---

*Last Updated: 2025-01-10*
