# ============================================================
# Brainwave EduSys - Worker Dockerfile (Production)
# ============================================================

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/
COPY apps/backend/package.json ./apps/backend/

RUN npm ci --workspace=@brainwave/worker --workspace=@brainwave/shared --include-workspace-root

COPY packages/shared/ ./packages/shared/
COPY apps/worker/ ./apps/worker/
COPY apps/backend/prisma ./apps/backend/prisma
COPY tsconfig.base.json ./

# Generate Prisma client (worker shares the same schema)
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

RUN npm run build -w @brainwave/shared || true
RUN npm run build -w @brainwave/worker

# ---- Stage 2: Production ----
FROM node:22-alpine AS production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 brainwave

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/

RUN npm ci --workspace=@brainwave/worker --workspace=@brainwave/shared --include-workspace-root --omit=dev

COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER brainwave

CMD ["node", "apps/worker/dist/index.js"]
