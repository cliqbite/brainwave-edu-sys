# ============================================================
# Brainwave EduSys - Frontend Dockerfile (Production)
# Multi-stage: Vite build → nginx static server
# ============================================================

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Build args for Vite environment variables
ARG VITE_API_URL
ARG VITE_VAPID_PUBLIC_KEY
ARG VITE_APP_NAME

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

RUN npm ci --workspace=@brainwave/frontend --workspace=@brainwave/shared --include-workspace-root

COPY packages/shared/ ./packages/shared/
COPY apps/frontend/ ./apps/frontend/
COPY tsconfig.base.json ./

RUN npm run build -w @brainwave/shared || true
RUN npm run build -w @brainwave/frontend

# ---- Stage 2: Serve with nginx ----
FROM nginx:1.27-alpine AS production

# Security: remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config for SPA + PWA
COPY --from=builder /app/apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
