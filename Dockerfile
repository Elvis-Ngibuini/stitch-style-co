# =============================================================================
# Stitch & Style Co - Backend Dockerfile
# Multi-stage build: builder -> production
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder - Install dependencies and build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Set working directory
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build/test)
RUN npm ci

# Copy source code
COPY . .

# Run tests in builder stage (fail fast if tests fail)
RUN npm test

# Run lint if available
RUN npm run lint --if-present

# -----------------------------------------------------------------------------
# Stage 2: Production - Minimal runtime image
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init \
    tini

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs appuser

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=appuser:nodejs /app .

# Create directories for uploads/logs with proper permissions
RUN mkdir -p /app/uploads /app/logs && \
    chown -R appuser:nodejs /app/uploads /app/logs

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5006

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5006/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]

# -----------------------------------------------------------------------------
# Stage 3: Development - With hot reload and dev tools
# -----------------------------------------------------------------------------
FROM node:20-alpine AS development

# Install development dependencies
RUN apk add --no-cache \
    dumb-init \
    git

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs appuser

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY --chown=appuser:nodejs . .

# Create directories
RUN mkdir -p /app/uploads /app/logs && \
    chown -R appuser:nodejs /app/uploads /app/logs

USER appuser

EXPOSE 5006

# Use nodemon for hot reload in development
CMD ["dumb-init", "--", "npx", "nodemon", "--watch", ".", "--ext", "js,json", "--ignore", "uploads/", "server.js"]