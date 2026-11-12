# CI/CD Docker Integration Guide
# Stitch & Style Co - Container Build & Deployment Pipeline

## Table of Contents
1. [Pipeline Overview](#pipeline-overview)
2. [Build Strategy](#build-strategy)
3. [GitHub Actions Workflows](#github-actions-workflows)
4. [Image Tagging & Versioning](#image-tagging--versioning)
5. [Security Scanning in CI](#security-scanning-in-ci)
6. [Multi-Architecture Builds](#multi-architecture-builds)
7. [Registry Management](#registry-management)
8. [Deployment Strategies](#deployment-strategies)
9. [Rollback Procedures](#rollback-procedures)
10. [Cost Optimization](#cost-optimization)

---

## Pipeline Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   COMMIT    │───▶│    BUILD    │───▶│   SCAN      │───▶│   TEST      │
│   (push/PR) │    │ (multi-stage)│   │ (trivy/grype)│   │ (unit/int)  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                    │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  DEPLOY     │◀───│  RELEASE    │◀───│   BUILD     │◀─────────────┘
│ (staging/   │    │  (semantic) │    │  (prod img) │
│  prod)      │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## Build Strategy

### Multi-Stage Dockerfiles (Already Created)

- **Backend**: `Dockerfile` with `builder` → `production` → `development` targets
- **Frontend**: `frontend-next/Dockerfile` with `builder` → `production` → `development` targets

### Build Arguments

```dockerfile
# Dockerfile
ARG NODE_VERSION=20
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

FROM node:${NODE_VERSION}-alpine AS builder

LABEL org.opencontainers.image.title="Stitch & Style Backend" \
      org.opencontainers.image.description="E-commerce API" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.source="https://github.com/elvis/stitch-style-co"
```

### Build Context Optimization

```yaml
# .dockerignore (critical for build speed)
# Exclude: node_modules, .git, .github, tests, docs, *.md, .env, etc.
```

### Build Cache Strategy

```yaml
# GitHub Actions cache
- name: Build backend
  uses: docker/build-push-action@v5
  with:
    context: .
    target: production
    tags: ${{ env.REGISTRY }}/backend:${{ env.TAG }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    build-args: |
      BUILD_DATE=${{ env.BUILD_DATE }}
      VCS_REF=${{ github.sha }}
      VERSION=${{ env.VERSION }}

# Local development
# DOCKER_BUILDKIT=1 docker build --cache-from type=local,src=/tmp/build-cache .
```

---

## GitHub Actions Workflows

### 1. Main CI Workflow (`.github/workflows/ci.yml`)

```yaml
# Key features:
# - Security scan first (fail fast)
# - Parallel backend/frontend builds
# - Multi-stage Docker builds with cache
# - Security scanning (Trivy, Grype, Gitleaks)
# - Unit/Integration tests
# - Docker image build & push
# - Staging auto-deploy on develop
# - Production manual deploy on main
```

### 2. Release Workflow (`.github/workflows/release.yml`)

```yaml
# Semantic Release automation:
# - Triggered on push to main/develop/release/*
# - Analyzes commit messages (conventional commits)
# - Determines version bump (major/minor/patch)
# - Generates CHANGELOG.md
# - Creates Git tag
# - Creates GitHub Release
# - Publishes Docker images
# - Notifies Slack
```

### 3. Security Scanning Workflow (`.github/workflows/security.yml`)

```yaml
# Scheduled + PR scans:
# - Trivy filesystem + image scan
# - Grype vulnerability scan
# - Gitleaks secret detection
# - CodeQL static analysis
# - npm audit
# - Dependency review
# - SBOM generation (Syft)
```

### 4. Dependency Updates (Dependabot)

```yaml
# .github/dependabot.yml
# - Weekly npm updates (backend + frontend)
# - GitHub Actions updates
# - Docker base image updates
# - Grouped PRs (dev vs prod deps)
# - Auto-merge for patch/minor
```

---

## Image Tagging & Versioning

### Tagging Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    IMAGE TAGS                               │
├─────────────────────────────────────────────────────────────┤
│ registry.io/app:latest              │ Latest stable        │
│ registry.io/app:v1.2.3              │ Semantic version     │
│ registry.io/app:v1.2                │ Minor version        │
│ registry.io/app:v1                  │ Major version        │
│ registry.io/app:sha-abc123          │ Commit SHA (dev)     │
│ registry.io/app:pr-123              │ PR preview           │
│ registry.io/app:develop             │ Staging              │
│ registry.io/app:main                │ Production           │
└─────────────────────────────────────────────────────────────┘
```

### Tagging Implementation

```yaml
# GitHub Actions
env:
  REGISTRY: ghcr.io
  NAMESPACE: ${{ github.repository_owner }}
  IMAGE_NAME: ${{ github.event.repository.name }}

jobs:
  build:
    outputs:
      tags: ${{ steps.meta.outputs.tags }}
    steps:
      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.NAMESPACE }}/${{ env.IMAGE_NAME }}-backend
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha
            type=raw,value=latest,enable={{is_default_branch}}
            type=raw,value=develop,enable=${{ github.ref == 'refs/heads/develop' }}

  push:
    needs: build
    steps:
      - name: Push
        uses: docker/build-push-action@v5
        with:
          tags: ${{ needs.build.outputs.tags }}
          push: true
```

### Image Promotion Flow

```
DEVELOP BRANCH                    MAIN BRANCH
─────────────────                 ────────────
│                                 │
▼                                 ▼
Build & Test                   Build & Test
│                                 │
▼                                 ▼
Tag: sha-abc123                 Tag: v1.2.3
│                                 │
▼                                 ▼
Push to Registry                Push to Registry
│                                 │
▼                                 ▼
Deploy to Staging               Manual Approval
│                                 │
▼                                 ▼
Auto                           Deploy to Prod
```

---

## Security Scanning in CI

### Trivy Integration

```yaml
# .github/workflows/ci.yml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: '.'
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'
    ignore-unfixed: true

- name: Upload Trivy results
  uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: 'trivy-results.sarif'
```

### Image Scanning (Post-Build)

```yaml
- name: Scan built image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: '${{ env.REGISTRY }}/${{ env.NAMESPACE }}/backend:${{ steps.meta.outputs.tags }}'
    format: 'sarif'
    output: 'trivy-image.sarif'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'
    ignore-unfixed: true

- name: Upload image scan
  uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: 'trivy-image.sarif'
```

### Grype (Alternative Scanner)

```yaml
- name: Run Grype
  uses: anchore/grype-action@v1
  with:
    path: '.'
    fail-build: true
    severity-cutoff: high
```

### SBOM Generation

```yaml
- name: Generate SBOM
  uses: anchore/syft-action@v1
  with:
    path: '.'
    format: 'spdx-json=sbom.spdx.json'

- name: Upload SBOM
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: sbom.spdx.json
    category: sbom
```

### Gitleaks (Secrets)

```yaml
- name: Run Gitleaks
  uses: gitleaks/gitleaks-action@v2
  with:
    config: .gitleaks.toml
    args: --verbose
```

---

## Multi-Architecture Builds

### BuildKit Configuration

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
  with:
    version: latest
    driver-opts: |
      network=host

- name: Build and push multi-arch
  uses: docker/build-push-action@v5
  with:
    context: .
    platforms: linux/amd64,linux/arm64
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Platform-Specific Considerations

```dockerfile
# Handle platform differences
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

# Install platform-specific deps
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# For ARM64 specific
RUN if [ "$TARGETPLATFORM" = "linux/arm64" ]; then \
      apk add --no-cache gcc gfortran; \
    fi
```

### Testing Multi-Arch Locally

```bash
# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t registry.io/app:tag \
  --push .

# Test locally with QEMU
docker run --rm --platform linux/arm64 registry.io/app:tag
```

---

## Registry Management

### Registry Options

| Registry | Pros | Cons | Best For |
|----------|------|------|----------|
| **GHCR** | Free, integrated, 50GB | Public by default | Open source |
| **Docker Hub** | Familiar, auto-build | Rate limits, paid | Small teams |
| **AWS ECR** | IAM integration, scanning | AWS only | AWS shops |
| **GCP Artifact Registry** | GCP integration | GCP only | GCP shops |
| **Harbor** | On-prem, scanning, replication | Self-hosted | Enterprise |
| **JFrog Artifactory** | Universal, replication | Expensive | Large orgs |

### GHCR Configuration (Recommended)

```yaml
# Push to GHCR
- name: Login to GHCR
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

# Image name format
# ghcr.io/owner/repo/backend:v1.2.3
# ghcr.io/owner/repo/frontend:v1.2.3
```

### Image Retention Policy

```yaml
# GitHub Settings → Packages → Package settings
# Retention: 90 days for untagged, keep 10 latest per tag pattern
# Or use GitHub Actions:
- name: Cleanup old images
  uses: actions/delete-package-versions@v4
  with:
    package-name: backend
    package-type: container
    min-versions-to-keep: 10
    delete-only-untagged: true
```

### Image Promotion

```bash
# Promote staging → production
docker pull ghcr.io/org/app/backend:develop
docker tag ghcr.io/org/app/backend:develop ghcr.io/org/app/backend:v1.2.3
docker push ghcr.io/org/app/backend:v1.2.3

# Or use GitHub API
gh api repos/owner/repo/packages/container/backend/versions -X POST \
  -f tag_name=v1.2.3 \
  -f target_commitish=main
```

---

## Deployment Strategies

### 1. Blue-Green (Zero Downtime)

```yaml
# Two identical environments
services:
  backend-blue:
    image: app:blue
    deploy:
      replicas: 4
    networks: [backend]
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.example.com`)"

  backend-green:
    image: app:green
    deploy:
      replicas: 4
    networks: [backend]
    # Same labels, different router priority
```

```bash
# Switch traffic
# 1. Deploy green
docker service update --image app:v1.2.4 backend-green

# 2. Verify green
curl -f https://api.example.com/health

# 3. Switch Traefik
# Update router to point to green

# 4. Decommission blue
docker service scale backend-blue=0
```

### 2. Rolling Update (Default)

```yaml
deploy:
  replicas: 4
  update_config:
    parallelism: 2
    delay: 15s
    failure_action: rollback
    monitor: 60s
    max_failure_ratio: 0.1
  rollback_config:
    parallelism: 1
    delay: 10s
    failure_action: pause
    monitor: 60s
```

### 3. Canary Deployment

```yaml
# Traefik weighted routing
labels:
  - "traefik.http.routers.backend.rule=Host(`api.example.com`)"
  - "traefik.http.services.backend.loadbalancer.server.port=5006"

# Canary service
  backend-canary:
    image: app:v1.3.0-rc1
    deploy:
      replicas: 1
    labels:
      - "traefik.http.routers.backend-canary.rule=Host(`api.example.com`) && Header(`X-Canary`, `true`)"
      - "traefik.http.services.backend-canary.loadbalancer.server.port=5006"
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
  selector:
    matchLabels:
      app: backend
  template:
    spec:
      containers:
      - name: backend
        image: registry.io/app/backend:v1.2.3
        ports:
        - containerPort: 5006
        readinessProbe:
          httpGet:
            path: /ready
            port: 5006
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 5006
          initialDelaySeconds: 30
          periodSeconds: 10
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

---

## Rollback Procedures

### Docker Swarm Rollback

```bash
# Quick rollback
docker service rollback backend

# Rollback to specific version
docker service update --image app:v1.2.2 backend

# Check rollout status
docker service ps backend --no-trunc
```

### Kubernetes Rollback

```bash
# Quick rollback
kubectl rollout undo deployment/backend

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=3

# Check rollout status
kubectl rollout status deployment/backend
```

### Automated Rollback in CI

```yaml
# In deployment workflow
- name: Deploy to production
  run: |
    docker service update --image ${{ env.REGISTRY }}/backend:${{ env.TAG }} backend
    
- name: Verify deployment
  run: |
    sleep 30
    curl -f https://api.example.com/health || exit 1

- name: Rollback on failure
  if: failure()
  run: |
    docker service rollback backend
    echo "Deployment failed, rolled back"
```

### Database Migration Rollback

```bash
# In deployment
- name: Run migrations
  run: |
    docker exec backend npm run migrate

# Rollback script
- name: Rollback migration
  if: failure()
  run: |
    docker exec backend npm run migrate:down
```

---

## Cost Optimization

### Build Optimization

```yaml
# 1. Use BuildKit cache
- name: Build
  uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max

# 2. Multi-stage (smaller final image)
# 3. Minimize layers
# 4. Use .dockerignore

# 4. Cache node_modules
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
      frontend-next/node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json', 'frontend-next/package-lock.json') }}
```

### Image Size Optimization

```dockerfile
# Use distroless for production
FROM gcr.io/distroless/nodejs20-debian12 AS production
COPY --from=builder /app/dist ./dist
USER nonroot:nonroot
CMD ["dist/server.js"]
```

### Registry Costs

```bash
# GHCR: Free for public, 500MB private
# Clean up untagged images weekly
# Delete old versions (keep 10)

# Registry size monitoring
curl -H "Authorization: Bearer $TOKEN" \
  "https://ghcr.io/v2/org/repo/tags/list" | jq '.tags | length'
```

### Build Time Optimization

```yaml
# Parallel jobs
jobs:
  backend-build:
    runs-on: ubuntu-latest
  frontend-build:
    runs-on: ubuntu-latest
  # Run in parallel

# Self-hosted runners for large builds
# runs-on: self-hosted
```

---

## Complete CI/CD Pipeline Summary

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
    tags: ['v*']
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  NODE_VERSION: '20'

jobs:
  # 1. Security Scan (fast, fail fast)
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
      - uses: aquasecurity/trivy-action@master
        with: { scan-type: 'fs', severity: 'CRITICAL,HIGH' }

  # 2. Backend Build & Test
  backend:
    needs: security
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ env.NODE_VERSION }}, cache: 'npm' }
      - run: npm ci
      - run: npm test
      - run: npm run lint --if-present

  # 3. Frontend Build & Test
  frontend:
    needs: security
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ env.NODE_VERSION }}, cache: 'npm', cache-dependency-path: frontend-next/package-lock.json }
      - run: npm ci
        working-directory: ./frontend-next
      - run: npm run lint
        working-directory: ./frontend-next
      - run: npx tsc --noEmit
        working-directory: ./frontend-next
      - run: npm run build
        working-directory: ./frontend-next

  # 4. Docker Build & Push
  docker:
    needs: [backend, frontend]
    runs-on: ubuntu-latest
    outputs:
      backend-tag: ${{ steps.meta-backend.outputs.tags }}
      frontend-tag: ${{ steps.meta-frontend.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with: { registry: ghcr.io, username: ${{ github.actor }}, password: ${{ secrets.GITHUB_TOKEN }} }
      
      - uses: docker/metadata-action@v5
        id: meta-backend
        with:
          images: ghcr.io/${{ github.repository_owner }}/${{ github.event.repository.name }}-backend
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha
      
      - uses: docker/build-push-action@v5
        with:
          context: .
          target: production
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta-backend.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=${{ env.BUILD_DATE }}
            VCS_REF=${{ github.sha }}

      # Repeat for frontend...

  # 5. Security Scan Images
  image-scan:
    needs: docker
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ needs.docker.outputs.backend-tag }}
          format: sarif
          output: trivy.sarif
          severity: CRITICAL,HIGH
          exit-code: '1'
      - uses: github/codeql-action/upload-sarif@v3
        with: { sarif_file: trivy.sarif }

  # 6. Deploy Staging
  deploy-staging:
    needs: [docker, image-scan]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: |
          # Deploy to staging
          kubectl set image deployment/backend backend=${{ needs.docker.outputs.backend-tag }} -n staging
          kubectl set image deployment/frontend frontend=${{ needs.docker.outputs.frontend-tag }} -n staging

  # 7. Deploy Production
  deploy-production:
    needs: [docker, image-scan]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: |
          # Manual approval required in GitHub Environment
          kubectl set image deployment/backend backend=${{ needs.docker.outputs.backend-tag }} -n production
          kubectl set image deployment/frontend frontend=${{ needs.docker.outputs.frontend-tag }} -n production

  # 8. Release (on tag)
  release:
    needs: [docker, image-scan]
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - uses: cycjimmy/semantic-release-action@v4
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

*Last Updated: 2026-11-12*
*Version: 1.0*
*Review: Quarterly*