# =============================================================================
# Stitch & Style Co - Frontend Dockerfile (Next.js)
# Multi-stage build: builder -> production
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder - Install dependencies and build Next.js app
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

WORKDIR /app

# Copy package files for caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production - Minimal runtime with standalone output
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs appuser

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder (standalone output)
COPY --from=builder --chown=appuser:nodejs /app/public ./public
COPY --from=builder --chown=appuser:nodejs /app/.next/standalone ./
COPY --from=builder --chown=appuser:nodejs /app/.next/static ./.next/static

# Create directories
RUN mkdir -p /app/logs && \
    chown -R appuser:nodejs /app/logs

USER appuser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js in production mode
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["node", "server.js"]

# -----------------------------------------------------------------------------
# Stage 3: Development - With hot reload
# -----------------------------------------------------------------------------
FROM node:20-alpine AS development

RUN apk add --no-cache \
    dumb-init \
    git

RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs appuser

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY --chown=appuser:nodejs . .

USER appuser

EXPOSE 3000

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV WATCHPACK_POLLING=true

CMD ["dumb-init", "--", "npm", "run", "dev"]