# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.15.4

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=dependencies /app/packages/shared-types/node_modules ./packages/shared-types/node_modules

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared-types ./packages/shared-types
COPY pnpm-workspace.yaml package.json ./

# Build argument for API URL
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL

# Install pnpm and build
RUN npm install -g pnpm@9.15.4
RUN pnpm --filter @repo/shared-types build
RUN pnpm --filter @repo/web build

# Stage 3: Production (nginx)
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Run as non-root user
USER nginx

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
