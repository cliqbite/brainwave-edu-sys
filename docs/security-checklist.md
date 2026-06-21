# Brainwave EduSys — Production Security Checklist

## Authentication & Authorization

- [x] Password hashing with bcrypt (salt rounds = 12)
- [x] JWT access token with 15-minute expiry
- [x] JWT refresh token with 7-day expiry
- [x] Refresh token rotation (single-use)
- [x] Revoked token reuse detection (invalidates all user tokens)
- [x] Role-based access control (RBAC)
- [x] Permission-based access control (PBAC)
- [x] Backend enforces all role/permission checks (not frontend-only)
- [x] Master role has superuser bypass
- [x] Moderator permissions are dynamic and database-driven

## API Security

- [x] Rate limiting on auth endpoints (5 req/min)
- [x] General API rate limiting (100 req/min)
- [x] CORS whitelist (only allowed origins)
- [x] Helmet security headers (CSP, HSTS, X-Frame-Options, etc.)
- [x] Input validation with Zod on every endpoint
- [x] SQL injection protection via Prisma ORM (parameterized queries)
- [x] Request body size limit (10MB for API, 5MB for file uploads)
- [x] File upload type validation (CSV/XLSX only)

## Data Protection

- [x] Sensitive fields redacted in logs (authorization headers, passwords)
- [x] No hardcoded secrets — all via environment variables
- [x] Database credentials not exposed to frontend
- [x] UUID used for external-facing identifiers
- [x] Soft delete for users and groups (data retention)
- [x] Audit logging for all write operations

## Infrastructure

- [x] HTTPS via Caddy automatic SSL (Let's Encrypt)
- [x] Docker containers run as non-root user
- [x] Minimal Docker images (Alpine-based)
- [x] Internal Docker network (services not exposed to host)
- [x] Resource limits on Docker containers
- [x] Separate containers for each service
- [x] Health checks on all services

## Before Going Live

- [ ] Change all default passwords in `.env`
- [ ] Generate unique JWT secrets (use `openssl rand -hex 32`)
- [ ] Generate VAPID keys for push notifications
- [ ] Set NODE_ENV=production
- [ ] Remove Prisma Studio access in production
- [ ] Set up automated database backups
- [ ] Configure log rotation
- [ ] Set up server monitoring (uptime, resource usage)
- [ ] Review and restrict CORS origins to actual domain
- [ ] Enable firewall (ufw) — only allow ports 80, 443, 22
- [ ] Set up fail2ban for SSH brute force protection
- [ ] Consider implementing Content Security Policy (CSP) headers
