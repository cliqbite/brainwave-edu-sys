# ============================================================
# Brainwave EduSys - Backend Dockerfile (Production)
# Multi-stage build for minimal image size
# ============================================================

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json* ./

# Copy workspace package.json files
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN npm ci --workspace=@brainwave/backend --workspace=@brainwave/shared --include-workspace-root

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY apps/backend/ ./apps/backend/
COPY tsconfig.base.json ./

# Generate Prisma client
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Build shared package
RUN npm run build -w @brainwave/shared || true

# Build backend
RUN npm run build -w @brainwave/backend

# ---- Stage 2: Production ----
FROM node:22-alpine AS production

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 brainwave

WORKDIR /app

# Copy package files for production install
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install production dependencies only
RUN npm ci --workspace=@brainwave/backend --workspace=@brainwave/shared --include-workspace-root --omit=dev

# Copy built files
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create upload directory
RUN mkdir -p /app/data/uploads && chown -R brainwave:nodejs /app/data

USER brainwave

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/api/v1/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma && node apps/backend/dist/server.js"]
