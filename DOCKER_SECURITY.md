# Docker Security Hardening Guide
# Stitch & Style Co - Container Security Best Practices

## Table of Contents
1. [Base Image Security](#base-image-security)
2. [Container Runtime Security](#container-runtime-security)
3. [Image Build Security](#image-build-security)
4. [Secrets Management](#secrets-management)
5. [Network Security](#network-security)
6. [Vulnerability Scanning](#vulnerability-scanning)
7. [Runtime Monitoring](#runtime-monitoring)
8. [Compliance Checklist](#compliance-checklist)

---

## Base Image Security

### Recommended Base Images

| Service | Base Image | Rationale |
|---------|------------|-----------|
| Backend | `node:20-alpine` | Minimal attack surface (~5MB), musl libc |
| Frontend | `node:20-alpine` | Same as backend, consistent base |
| Database | `mongo:7.0` | Official image, regular updates |
| Cache | `redis:7-alpine` | Minimal, official |
| Proxy | `traefik:v3.0` | Official, security-focused |
| Monitoring | `prom/prometheus`, `grafana/grafana` | Official, maintained |

### Base Image Hardening

```dockerfile
# Pin specific digest (immutable reference)
FROM node:20-alpine@sha256:abc123... AS builder

# Update package index and upgrade
RUN apk update && apk upgrade --no-cache

# Install only required packages
RUN apk add --no-cache \
    dumb-init \
    tini \
    # No curl, wget, bash, etc. unless needed

# Remove package cache
RUN rm -rf /var/cache/apk/*
```

### Distroless Alternative (Maximum Security)

```dockerfile
# Use Google's distroless for production (no shell, no package manager)
FROM gcr.io/distroless/nodejs20-debian12 AS production

# Copy from builder
COPY --from=builder /app /app

# No shell access possible
USER nonroot:nonroot
```

---

## Container Runtime Security

### Non-Root User (Mandatory)

```dockerfile
# Create dedicated user/group
RUN addgroup -g 1001 -S appgroup && \
    adduser -S -u 1001 -G appgroup appuser

# Set ownership
COPY --chown=appuser:appgroup . .

# Switch user
USER appuser
```

### Capability Dropping

```yaml
# docker-compose.yml
services:
  backend:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # Only if binding to privileged ports
    security_opt:
      - no-new-privileges:true
```

### Read-Only Root Filesystem

```yaml
services:
  backend:
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
      - /app/uploads  # Writable directory
```

### Resource Limits (Prevent DoS)

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### Security Options

```yaml
services:
  backend:
    security_opt:
      - no-new-privileges:true
      - seccomp:unconfined  # Or custom profile
    sysctls:
      - net.core.somaxconn=1024
```

---

## Image Build Security

### Multi-Stage Build (Separation of Concerns)

```dockerfile
# Stage 1: Builder - Full toolchain
FROM node:20-alpine AS builder
# Install build tools, run tests, compile

# Stage 2: Production - Minimal runtime
FROM node:20-alpine AS production
# Only runtime deps, no build tools
COPY --from=builder /app/dist ./dist
```

### Build-Time Security

```dockerfile
# Use BuildKit for better security
# DOCKER_BUILDKIT=1 docker build .

# Verify checksums
RUN wget -qO- https://example.com/file.tar.gz | \
    sha256sum -c - <<< "expected_hash  -" && \
    tar xzf file.tar.gz

# Scan during build
RUN npm audit --audit-level=high
```

### Build Cache Security

```dockerfile
# Order layers by change frequency
COPY package*.json ./          # Changes rarely
RUN npm ci --only=production   # Cached if package.json unchanged
COPY . .                       # Changes frequently
```

### Signing Images

```bash
# Sign with cosign
cosign sign --key cosign.key registry.io/app:tag

# Verify in CI
cosign verify --key cosign.pub registry.io/app:tag
```

---

## Secrets Management

### Never in Images

```dockerfile
# ❌ NEVER DO THIS
ENV JWT_SECRET=mysecret
ARG DB_PASSWORD=password

# ✅ USE SECRETS AT RUNTIME
# Docker Secrets (Swarm/K8s)
# Environment variables from secret files
```

### Docker Secrets (Swarm Mode)

```yaml
services:
  backend:
    secrets:
      - prod_jwt_secret
      - prod_stripe_secret_key

secrets:
  prod_jwt_secret:
    external: true
```

```bash
# Create secret
echo "supersecret" | docker secret create prod_jwt_secret -

# In container: /run/secrets/prod_jwt_secret
```

### Environment-Specific Secrets

```yaml
# Development - .env file (gitignored)
# Staging - Docker Compose env_file or .env.staging
# Production - Docker Secrets / Vault / AWS Secrets Manager
```

### Secret Rotation

```bash
# Rotate without downtime
docker secret create jwt_secret_v2 new_secret
docker service update --secret-rm jwt_secret --secret-add jwt_secret_v2 backend
```

---

## Network Security

### Network Segmentation

```yaml
networks:
  frontend-net:
    driver: overlay
    internal: false  # Exposed to internet
  backend-net:
    driver: overlay
    internal: true   # No internet access
  database-net:
    driver: overlay
    internal: true
  monitoring-net:
    driver: overlay
    internal: true
```

### Service-to-Service Communication

```yaml
services:
  backend:
    networks:
      - backend-net
      - database-net
    # No direct internet access

  frontend:
    networks:
      - frontend-net
      - backend-net
    # Only talks to backend

  mongodb:
    networks:
      - database-net
    # Completely isolated
```

### Service Mesh (Production)

```yaml
# Use Istio/Linkerd for:
# - mTLS between services
# - Traffic encryption
# - Authorization policies
# - Observability
```

### Firewall Rules

```bash
# Host-level firewall (UFW example)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 2376/tcp   # Docker daemon
ufw deny 2375/tcp   # Docker daemon (unencrypted)
ufw enable
```

---

## Vulnerability Scanning

### CI/CD Integration

```yaml
# .github/workflows/security.yml
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Trivy - Comprehensive scanner
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      # Upload to GitHub Security
      - name: Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

      # Grype - Alternative scanner
      - name: Run Grype
        uses: anchore/grype-action@v1
        with:
          path: '.'

      # Syft - SBOM generation
      - name: Generate SBOM
        uses: anchore/syft-action@v1
        with:
          path: '.'
          format: 'spdx-json'
```

### Local Scanning

```bash
# Scan local image
trivy image stitch-style/backend:latest

# Scan filesystem
trivy fs .

# Scan for secrets
gitleaks detect --source .

# Generate SBOM
syft packages docker:image:tag -o spdx-json=sbom.json
```

### Scan Policies

```yaml
# .trivy.yaml
severity:
  - CRITICAL
  - HIGH

ignore-unfixed: true

ignore-vulnerabilities:
  - CVE-2023-1234  # False positive, documented

exit-code: 1  # Fail CI on findings
```

### Base Image Updates

```yaml
# Dependabot for base images
# .github/dependabot.yml
updates:
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "docker"
```

---

## Runtime Monitoring

### Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5006/health || exit 1
```

```yaml
# docker-compose healthcheck
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5006/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

### Logging

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
        compress: "true"
        labels: "service=backend,environment=production"
```

### Log Aggregation (Production)

```yaml
# Loki + Promtail
services:
  promtail:
    image: grafana/promtail:2.9
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml
```

### Metrics Collection

```yaml
# Prometheus
services:
  prometheus:
    image: prom/prometheus:v2.47
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:5006']
  - job_name: 'frontend'
    static_configs:
      - targets: ['frontend:3000']
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
```

### Alerting Rules

```yaml
# alerts.yml
groups:
  - name: docker-alerts
    rules:
      - alert: ContainerDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Container {{ $labels.container }} down"

      - alert: HighMemoryUsage
        expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.container }}"

      - alert: HighCPUUsage
        expr: (rate(container_cpu_usage_seconds_total[5m])) > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.container }}"
```

---

## Compliance Checklist

### Pre-Deployment Checklist

- [ ] Base image pinned to specific digest
- [ ] Non-root user configured
- [ ] Read-only root filesystem
- [ ] Capabilities dropped (ALL)
- [ ] No-new-privileges enabled
- [ ] Resource limits set (CPU, memory)
- [ ] Health checks configured
- [ ] No secrets in image
- [ ] Secrets via Docker Secrets/Vault
- [ ] Multi-stage build used
- [ ] Vulnerability scan passed (CRITICAL/HIGH = 0)
- [ ] Base image updated within 30 days
- [ ] SBOM generated
- [ ] Image signed
- [ ] Network segmentation implemented
- [ ] Internal networks marked internal
- [ ] Resource limits set
- [ ] Logging configured
- [ ] Health checks pass
- [ ] Secrets rotated in last 90 days

### Runtime Checklist

- [ ] Containers running as non-root
- [ ] No privileged containers
- [ ] No host network mode
- [ ] No host PID/IPC namespace
- [ ] Resource limits enforced
- [ ] Health checks passing
- [ ] Logs aggregated
- [ ] Metrics collected
- [ ] Alerts configured
- [ ] Backup tested
- [ ] Disaster recovery tested

### Audit Commands

```bash
# Check running containers security
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

# Inspect container security
docker inspect container_name | jq '.[0] | {User, SecurityOpt, CapAdd, CapDrop, ReadonlyRootfs, NetworkMode}'

# Check for privileged containers
docker ps --filter "label=privileged=true"

# Scan running images
trivy image $(docker images -q)

# Check for secrets in running containers
docker exec container_name env | grep -i secret

# Network inspection
docker network ls
docker network inspect network_name

# Volume inspection
docker volume ls
docker volume inspect volume_name
```

---

## Incident Response

### Compromised Container

```bash
# 1. Isolate
docker network disconnect network_name container_name

# 2. Preserve evidence
docker commit container_name forensic/image:$(date +%s)
docker save forensic/image:tag > forensic.tar

# 3. Analyze
docker run --rm -v $(pwd):/host forensic/image:tag \
    sh -c "find / -type f -name '*.sh' -o -name '*.py' | xargs grep -l 'malicious'"

# 4. Replace
docker service update --image new_image:tag service_name
```

### Image Compromise

```bash
# 1. Revoke trust
docker trust revoke registry.io/image:tag

# 2. Scan all deployments
kubectl get pods --all-namespaces -o json | jq -r '.items[].spec.containers[].image' | sort -u | xargs trivy image

# 3. Rotate all secrets
# 4. Rebuild from clean source
# 5. Re-deploy
```

---

## References

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [NIST SP 800-190](https://csrc.nist.gov/publications/detail/sp/800-190/final)
- [OWASP Docker Security](https://owasp.org/www-project-docker-security/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Cosign Keyless Signing](https://docs.sigstore.dev/cosign/overview/)

---

*Last Updated: 2026-11-12*
*Version: 1.0*
*Review: Quarterly or after security incidents*