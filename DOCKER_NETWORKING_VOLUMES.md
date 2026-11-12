# Docker Networking & Volumes Strategy
# Stitch & Style Co - Container Infrastructure Design

## Table of Contents
1. [Network Architecture](#network-architecture)
2. [Network Types & Configurations](#network-types--configurations)
3. [Service Discovery](#service-discovery)
4. [Volume Strategy](#volume-strategy)
4. [Volume Types & Configurations](#volume-types--configurations)
5. [Backup & Restore](#backup--restore)
6. [Multi-Environment Strategy](#multi-environment-strategy)
7. [Troubleshooting](#troubleshooting)

---

## Network Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL TRAFFIC                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     TRAEFIK / NGINX (L7)                                │
│                  TLS Termination, Rate Limiting                         │
└─────────────────────────────────────────────────────────────────────────┘
                    │                          │
                    ▼                          ▼
┌──────────────────────────┐      ┌──────────────────────────────────┐
│      FRONTEND NET        │      │           BACKEND NET            │
│  (stitch-frontend-net)   │      │      (stitch-backend-net)        │
│                          │      │                                  │
│  ┌──────────────────┐    │      │  ┌──────────┐  ┌────────────┐   │
│  │  Frontend x3     │    │      │  │ Backend  │  │  Backend   │   │
│  │  (Port 3000)     │    │      │  │  x4      │  │  x4        │   │
│  └──────────────────┘    │      │  │ (5006)   │  │ (5006)     │   │
└──────────────────────────┘      │  └────┬─────┘  └─────┬──────┘   │
                                  │       │            │          │
                                  ▼       ▼            ▼          ▼
                         ┌─────────────────────────────────────────────┐
                         │           DATABASE NET                      │
                         │         (stitch-database-net)               │
                         │                                             │
                         │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
                         │  │ MongoDB  │  │  Redis   │  │  MinIO   │  │
                         │  │  Primary │  │ Cluster  │  │ (S3)     │  │
                         │  │ Replica  │  │ (3 nodes)│  │          │  │
                         │  └──────────┘  └──────────┘  └──────────┘  │
                         └─────────────────────────────────────────────┘
```

---

## Network Types & Configurations

### 1. Overlay Networks (Swarm Mode - Production)

```yaml
# docker-compose.prod.yml
networks:
  stitch-frontend-net:
    driver: overlay
    name: stitch-frontend-prod
    attachable: false
    driver_opts:
      com.docker.network.driver.mtu: "1500"
      encrypted: "true"  # Encrypt inter-node traffic

  stitch-backend-net:
    driver: overlay
    name: stitch-backend-prod
    attachable: false
    internal: true  # No external access
    driver_opts:
      com.docker.network.driver.mtu: "1500"
      encrypted: "true"

  stitch-database-net:
    driver: overlay
    name: stitch-database-prod
    attachable: false
    internal: true
    driver_opts:
      com.docker.network.driver.mtu: "1500"
      encrypted: "true"
```

### 2. Bridge Networks (Development/Staging)

```yaml
# docker-compose.yml (development)
networks:
  stitch-network:
    driver: bridge
    name: stitch-dev-network
    driver_opts:
      com.docker.network.bridge.name: br-dev
      com.docker.network.bridge.enable_icc: "true"
      com.docker.network.bridge.enable_ip_masquerade: "true"
```

### Network Policies (Kubernetes)

```yaml
# NetworkPolicy - Deny all by default
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

---
# Allow frontend -> backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 5006

---
# Allow backend -> database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-to-database
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: mongodb
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 27017
```

---

## Service Discovery

### DNS-Based (Docker Compose / Swarm)

```yaml
# Services automatically discover each other via DNS
# backend connects to: mongodb://mongodb:27017
# frontend connects to: http://backend:5006/api

services:
  backend:
    networks:
      - backend-net
      - database-net
    # Can resolve: mongodb, redis, minio

  frontend:
    networks:
      - frontend-net
      - backend-net
    # Can resolve: backend
```

### Service Mesh (Production - Istio)

```yaml
# Istio VirtualService
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: backend
spec:
  hosts:
  - backend
  http:
  - match:
    - headers:
        x-canary:
          exact: "true"
    route:
    - destination:
        host: backend
        subset: canary
      weight: 10
    - destination:
        host: backend
        subset: stable
      weight: 90

---
# DestinationRule for load balancing
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: backend
spec:
  host: backend
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
    loadBalancer:
      simple: LEAST_REQUEST
    tls:
      mode: ISTIO_MUTUAL
  subsets:
  - name: stable
    labels:
      version: stable
  - name: canary
    labels:
      version: canary
```

### External Service Discovery (Consul)

```yaml
# Register services with Consul
services:
  backend:
    environment:
      CONSUL_HTTP_ADDR: consul:8500
      SERVICE_NAME: backend
      SERVICE_TAGS: "api,production"
      SERVICE_PORT: 5006
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro

  # Registrator auto-registers containers
  registrator:
    image: gliderlabs/registrator:latest
    command: -internal consul://consul:8500
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - consul-net
```

---

## Volume Strategy

### Volume Categories

| Category | Purpose | Backup | Retention | Performance |
|----------|---------|--------|-----------|-------------|
| **Database** | MongoDB data, WAL | Critical | 30 days | High (SSD) |
| **Cache** | Redis AOF/RDB | Optional | 1 day | High (RAM) |
| **Uploads** | User files, assets | Critical | 90 days | Medium (SSD) |
| **Logs** | Application logs | 30 days | 30 days | Medium |
| **Config** | Certs, configs | Versioned | Permanent | Low |
| **Secrets** | Keys, tokens | Encrypted | Rotated | N/A |
| **Monitoring** | Prometheus, Grafana | 30 days | 30 days | Medium |

### Volume Drivers

| Use Case | Driver | Configuration |
|----------|--------|---------------|
| Local Dev | `local` | Bind mounts |
| Staging | `local` | Named volumes |
| Production (Single Node) | `local` | Bind to `/data/*` |
| Production (Cluster) | `rexray` / `csi` | Cloud provider |
| Production (K8s) | `csi` | CSI driver |
| Shared Config | `local` | Read-only bind |

### Volume Configuration Examples

#### Database Volumes (Production)

```yaml
volumes:
  mongodb-prod-data:
    name: stitch-mongodb-prod-data
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/mongodb  # Pre-provisioned SSD
  mongodb-prod-config:
    name: stitch-mongodb-prod-config
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/mongodb-config

# MongoDB deployment
volumes:
  - mongodb-prod-data:/data/db
  - mongodb-prod-config:/data/configdb
```

#### Redis with Persistence

```yaml
volumes:
  redis-prod-data:
    name: stitch-redis-prod-data
    driver: local
    driver_opts:
      type: tmpfs  # In-memory for performance
      device: tmpfs
      o: size=2g,noatime

# Redis with AOF
command: redis-server --appendonly yes --appendfsync everysec --maxmemory 2gb
volumes:
  - redis-prod-data:/data
```

#### Uploads (User Files)

```yaml
volumes:
  uploads-prod:
    name: stitch-uploads-prod
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/uploads  # Network mount (NFS/EFS)

# Backend
volumes:
  - uploads-prod:/app/uploads
```

#### Logs (Structured)

```yaml
volumes:
  logs-prod:
    name: stitch-logs-prod
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/logs/backend

# Logging driver config
logging:
  driver: "json-file"
  options:
    max-size: "100m"
    max-file: "20"
    compress: "true"
    labels: "service=backend,environment=production"
```

---

## Volume Types & Configurations

### 1. Named Volumes (Recommended)

```yaml
volumes:
  mongodb-data:
    name: stitch-mongodb-data
    driver: local
    labels:
      com.stitch.environment: production
      com.stitch.backup: "true"
      com.stitch.retention: "30d"

# Usage
services:
  mongodb:
    volumes:
      - mongodb-data:/data/db
```

### 2. Bind Mounts (Development)

```yaml
services:
  backend:
    volumes:
      - .:/app                    # Source code
      - /app/node_modules         # Anonymous volume (exclude from bind)
      - ./uploads:/app/uploads    # Persistent uploads
      - ./logs:/app/logs          # Logs
```

### 3. Anonymous Volumes (Ephemeral)

```yaml
services:
  backend:
    volumes:
      - /app/node_modules         # Prevents host pollution
      - /app/.next                # Next.js build cache
      - /tmp                      # Temp files
```

### 4. tmpfs (In-Memory)

```yaml
services:
  redis:
    tmpfs:
      - /data:size=2g,mode=1777   # In-memory, lost on restart
      - /tmp:size=100m

  backend:
    tmpfs:
      - /tmp:size=100m
      - /var/run:size=10m
```

### 5. Read-Only Volumes

```yaml
services:
  backend:
    volumes:
      - ./config:/app/config:ro   # Read-only config
      - certs:/etc/ssl/certs:ro   # SSL certs
```

---

## Backup & Restore

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh - Run via cron daily

set -euo pipefail

BACKUP_DIR="/backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# MongoDB Backup
echo "Backing up MongoDB..."
docker exec stitch-mongodb-prod mongodump \
  --uri="mongodb://${MONGO_USER}:${MONGO_PASS}@localhost:27017" \
  --out=/dump
docker cp stitch-mongodb-prod:/dump "$BACKUP_DIR/mongodb"
docker exec stitch-mongodb-prod rm -rf /dump

# Redis Backup
echo "Backing up Redis..."
docker exec stitch-redis-prod redis-cli --rdb /data/dump.rdb
docker cp stitch-redis-prod:/data/dump.rdb "$BACKUP_DIR/redis/dump.rdb"

# Uploads (rsync for efficiency)
rsync -avz /data/uploads/ "$BACKUP_DIR/uploads/"

# Compress and encrypt
tar -czf "$BACKUP_DIR.tar.gz" -C "$(dirname "$BACKUP_DIR")" "$(basename "$BACKUP_DIR")"
gpg --symmetric --cipher-algo AES256 "$BACKUP_DIR.tar.gz"

# Upload to S3
aws s3 cp "$BACKUP_DIR.tar.gz.gpg" s3://stitch-backups/$(date +%Y/%m/%d)/

# Cleanup local
rm -rf "$BACKUP_DIR" "$BACKUP_DIR.tar.gz" "$BACKUP_DIR.tar.gz.gpg"

# Retention: Keep 30 days locally, 1 year in S3
find /backups -type f -mtime +30 -delete
aws s3api put-bucket-lifecycle-configuration --bucket stitch-backups --lifecycle-configuration file://lifecycle.json
```

### Restore Procedures

```bash
#!/bin/bash
# restore.sh - Restore from backup

BACKUP_DATE="${1:-latest}"
BACKUP_FILE="s3://stitch-backups/${BACKUP_DATE}/backup.tar.gz.gpg"

# Download and decrypt
aws s3 cp "$BACKUP_FILE" /tmp/backup.tar.gz.gpg
gpg --decrypt /tmp/backup.tar.gz.gpg > /tmp/backup.tar.gz
tar -xzf /tmp/backup.tar.gz -C /tmp/restore

# Stop services
docker service scale stitch-backend=0 stitch-frontend=0

# Restore MongoDB
docker run --rm -v stitch-mongodb-prod-data:/data/db \
  mongo:7.0 mongorestore --uri="mongodb://..." /tmp/restore/mongodb

# Restore Redis
docker cp /tmp/restore/redis/dump.rdb stitch-redis-prod:/data/dump.rdb
docker exec stitch-redis-prod redis-cli SHUTDOWN NOSAVE
docker start stitch-redis-prod

# Restore Uploads
rsync -avz /tmp/restore/uploads/ /data/uploads/

# Restart services
docker service scale stitch-backend=4 stitch-frontend=4

# Verify
sleep 30
curl -f https://api.stitchstyle.co/health || exit 1
```

### Point-in-Time Recovery (MongoDB Atlas)

```bash
# If using MongoDB Atlas
# 1. Go to Atlas Console → Clusters → Backup
# 2. Select "Restore" → "Point in Time"
# 3. Choose timestamp
# 4. Download or restore to cluster

# Verify
mongosh "mongodb://..." --eval "db.orders.countDocuments()"
```

### Volume Backup (Generic)

```bash
# Backup any volume
docker run --rm \
  -v stitch-mongodb-prod-data:/source:ro \
  -v /backups:/backup \
  alpine tar czf /backup/mongodb-$(date +%Y%m%d).tar.gz -C /source .

# Restore volume
docker run --rm \
  -v stitch-mongodb-prod-data:/target \
  -v /backups:/backup \
  alpine tar xzf /backup/mongodb-20261112.tar.gz -C /target
```

---

## Multi-Environment Strategy

### Environment-Specific Compose Files

```
docker-compose.yml              # Base (shared)
docker-compose.override.yml     # Local dev (auto-loaded)
docker-compose.staging.yml      # Staging
docker-compose.prod.yml         # Production
```

### Environment Variables

```bash
# .env.development
NODE_ENV=development
MONGO_URI=mongodb://devuser:devpassword@mongodb:27017/dev

# .env.staging
NODE_ENV=production
MONGO_URI=mongodb://staginguser:${STAGING_MONGO_PASS}@mongodb:27017/staging

# .env.production (secrets in Docker Secrets)
NODE_ENV=production
MONGO_URI_FILE=/run/secrets/prod_mongo_uri
```

### Build Arguments

```yaml
# docker-compose.yml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: ${BUILD_TARGET:-production}
      args:
        NODE_VERSION: ${NODE_VERSION:-20}
        BUILD_DATE: ${BUILD_DATE}
        VCS_REF: ${VCS_REF}
        VERSION: ${VERSION}
```

### Environment-Specific Networks

| Environment | Network Driver | Encryption | Isolation |
|-------------|----------------|------------|-----------|
| Development | Bridge | No | None |
| Staging | Bridge | Optional | Service-level |
| Production | Overlay | AES-GCM | Strict (internal) |

---

## Troubleshooting

### Network Issues

```bash
# Check network connectivity
docker exec -it backend ping mongodb
docker exec -it backend nslookup mongodb

# Check network details
docker network inspect stitch-network-prod

# Check container IPs
docker inspect -f '{{.Name}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker ps -q)

# Test port connectivity
docker exec -it backend nc -zv mongodb 27017
docker exec -it backend nc -zv redis 6379
```

### Volume Issues

```bash
# Check volume usage
docker system df -v

# Check volume permissions
docker exec -it backend ls -la /app/uploads

# Fix permissions
docker run --rm -v stitch-uploads-prod-data:/data alpine chown -R 1001:1001 /data

# Check volume mount
docker inspect backend | jq '.[0].Mounts'

# Clean up unused volumes
docker volume prune -f
```

### Performance Tuning

```yaml
# Network tuning
sysctls:
  net.core.somaxconn: 65535
  net.core.netdev_max_backlog: 5000
  net.ipv4.tcp_max_syn_backlog: 65535

# Volume performance
volumes:
  mongodb-data:
    driver_opts:
      type: none
      o: bind,noatime,nodiratime
      device: /data/mongodb  # NVMe SSD
```

### Debugging Network Issues

```bash
# Capture traffic
docker run --rm --net=container:backend nicolaka/netshoot tcpdump -i any -n port 27017

# Check DNS
docker exec -it backend cat /etc/resolv.conf
docker exec -it backend dig mongodb

# Check iptables
iptables -L DOCKER-USER -n -v
```

### Volume Backup Verification

```bash
#!/bin/bash
# verify-backup.sh

# Test MongoDB restore
docker run --rm -v stitch-mongodb-prod-data:/data/db mongo:7.0 \
  mongorestore --dryRun /backup/mongodb

# Test Redis
docker run --rm -v stitch-redis-prod-data:/data redis:7-alpine \
  redis-check-rdb /data/dump.rdb

# Verify uploads
find /data/uploads -type f | wc -l
du -sh /data/uploads
```

---

## Monitoring Volumes & Networks

### Prometheus Metrics

```promql
# Volume usage
container_fs_usage_bytes{container="mongodb"} / container_fs_limit_bytes{container="mongodb"} > 0.85

# Network I/O
rate(container_network_receive_bytes_total[5m])
rate(container_network_transmit_bytes_total[5m])

# Volume latency
histogram_quantile(0.95, rate(container_fs_read_seconds_bucket[5m]))
```

### Alert Rules

```yaml
# Volume alerts
- alert: VolumeUsageHigh
  expr: container_fs_usage_bytes / container_fs_limit_bytes > 0.85
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Volume {{ $labels.volume }} on {{ $labels.instance }} is {{ $value | humanizePercentage }} full"

# Network alerts
- alert: HighNetworkErrors
  expr: rate(container_network_receive_errors_total[5m]) > 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Network errors on {{ $labels.container }}"
```

---

*Last Updated: 2026-11-12*
*Version: 1.0*
*Review: Quarterly*