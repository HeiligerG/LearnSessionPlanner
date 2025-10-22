# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl

# Install pnpm
RUN npm install -g pnpm@9.15.4

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=dependencies /app/packages/shared-types/node_modules ./packages/shared-types/node_modules

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared-types ./packages/shared-types
COPY pnpm-workspace.yaml package.json ./

# Install pnpm and build
RUN npm install -g pnpm@9.15.4

# Build shared-types first
RUN pnpm --filter @repo/shared-types build

# Generate Prisma Client
RUN pnpm --filter @repo/api prisma:generate

# Build API
RUN pnpm --filter @repo/api build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl

# Install pnpm
RUN npm install -g pnpm@9.15.4

# Copy package files
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma Client in production
RUN cd apps/api && pnpm prisma:generate

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run database migrations and start application
CMD ["sh", "-c", "cd apps/api && pnpm prisma:migrate:deploy && node dist/main.js"]
