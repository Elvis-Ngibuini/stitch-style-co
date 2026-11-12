# Logging, Monitoring & Backup Procedures
# Stitch & Style Co - Observability & Disaster Recovery

## Table of Contents
1. [Logging Strategy](#logging-strategy)
2. [Log Collection & Aggregation](#log-collection--aggregation)
3. [Monitoring Stack](#monitoring-stack)
4. [Alerting Rules](#alerting-rules)
5. [Dashboard Design](#dashboard-design)
6. [Backup Strategy](#backup-strategy)
7. [Disaster Recovery](#disaster-recovery)
8. [Runbook Procedures](#runbook-procedures)

---

## Logging Strategy

### Log Format Standards

```json
{
  "timestamp": "2026-11-12T14:30:00.123Z",
  "level": "info",
  "service": "backend",
  "traceId": "abc123def456",
  "spanId": "span789",
  "message": "Order created successfully",
  "context": {
    "orderId": "ord_123",
    "userId": "usr_456",
    "amount": 89500
  },
  "environment": "production",
  "version": "1.2.3"
}
```

### Log Levels

| Level | Use Case | Retention |
|-------|----------|-----------|
| `error` | System errors, failed operations, exceptions | 90 days |
| `warn` | Degraded performance, retry attempts, deprecated usage | 30 days |
| `info` | Business events, API requests, state changes | 30 days |
| `debug` | Detailed flow, variable values, SQL queries | 7 days |
| `trace` | Verbose tracing, function entry/exit | 1 day |

### Structured Logging Implementation

```javascript
// backend/utils/logger.js
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'ISO' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'backend',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Elasticsearch for production
    ...(process.env.NODE_ENV === 'production' ? [
      new ElasticsearchTransport({
        level: 'info',
        clientOpts: { node: process.env.ELASTICSEARCH_URL },
        index: 'logs-backend-${NODE_ENV}-{{YYYY.MM.DD}}'
      })
    ] : [])
  ]
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: Date.now() - start,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      traceId: req.headers['x-trace-id']
    });
  });
  next();
});

module.exports = logger;
```

### Frontend Logging

```typescript
// frontend-next/src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private buffer: LogEntry[] = [];
  private flushInterval = 5000;
  private maxBufferSize = 50;

  log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.getUserId(),
      sessionId: this.getSessionId()
    };

    this.buffer.push(entry);
    if (this.buffer.length >= this.maxBufferSize) this.flush();

    // Console in development
    if (process.env.NODE_ENV === 'development') {
      console[level](`[${entry.timestamp}] ${message}`, context);
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;
    const logs = this.buffer.splice(0, this.maxBufferSize);
    
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs })
      });
    } catch (e) {
      // Fallback to localStorage
      const stored = localStorage.getItem('logs') || '[]';
      const parsed = JSON.parse(stored);
      parsed.push(...logs);
      localStorage.setItem('logs', JSON.stringify(parsed.slice(-100)));
    }
  }

  debug(msg: string, ctx?: Record<string, unknown>) { this.log('debug', msg, ctx); }
  info(msg: string, ctx?: Record<string, unknown>) { this.log('info', msg, ctx); }
  warn(msg: string, ctx?: Record<string, unknown>) { this.log('warn', msg, ctx); }
  error(msg: string, ctx?: Record<string, unknown>) { this.log('error', msg, ctx); }
}

export const logger = new Logger();
```

---

## Log Collection & Aggregation

### Loki + Promtail Stack

```yaml
# docker-compose.prod.yml
services:
  loki:
    image: grafana/loki:2.9
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - ./loki/local-config.yaml:/etc/loki/local-config.yaml:ro
      - loki-data:/loki
    ports:
      - "3100:3100"
    networks: [monitoring-net]

  promtail:
    image: grafana/promtail:2.9
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./promtail/config.yml:/etc/promtail/config.yml:ro
    command: -config.file=/etc/promtail/config.yml
    networks: [monitoring-net]
    deploy:
      mode: global  # Run on every node
```

### Loki Configuration

```yaml
# loki/local-config.yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2024-01-01
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

limits_config:
  retention_period: 30d
  chunk_target_size: 1536000
  max_entries_limit_per_query: 5000
```

### Promtail Configuration

```yaml
# promtail/config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 9081

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: containers
    static_configs:
      - targets:
          - localhost
        labels:
          job: containerlogs
          __path__: /var/lib/docker/containers/*/*log

    pipeline_stages:
      - json:
          expressions:
            timestamp: timestamp
            level: level
            message: message
            service: service
            traceId: traceId
            environment: environment
      - labels:
          level:
          service:
          environment:
      - timestamp:
          source: timestamp
          format: RFC3339Nano

  - job_name: nginx
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          __path__: /var/log/nginx/*access.log

    pipeline_stages:
      - regex:
          expression: '^(?P<ip>\S+) \S+ \S+ \[(?P<timestamp>[^\]]+)\] "(?P<method>\S+) (?P<path>\S+) HTTP/(?P<version>\S+)" (?P<status>\d+) (?P<size>\d+)'
      - labels:
          method:
          status:
```

### Log Rotation

```yaml
# docker-compose logging driver
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "20"
        compress: "true"
        labels: "service=backend,environment=production"
```

---

## Monitoring Stack

### Prometheus Configuration

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'stitch-style-prod'
    environment: 'production'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - '/etc/prometheus/rules/*.yml'

scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter (host metrics)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # cAdvisor (container metrics)
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  # Backend API
  - job_name: 'backend'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['backend:5006']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: 'backend'

  # Frontend
  - job_name: 'frontend'
    static_configs:
      - targets: ['frontend:3000']

  # Traefik
  - job_name: 'traefik'
    static_configs:
      - targets: ['traefik:8080']

  # MongoDB
  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']

  # Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Node.js App (custom metrics)
  - job_name: 'nodejs'
    static_configs:
      - targets: ['backend:5006', 'frontend:3000']
    metrics_path: '/metrics'
```

### Node.js Metrics Endpoint

```javascript
// backend/metrics.js
const promClient = require('prom-client');

// Create metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status_code']
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Active connections'
});

const ordersTotal = new promClient.Counter({
  name: 'orders_total',
  help: 'Total orders created',
  labelNames: ['status']
});

const orderValue = new promClient.Histogram({
  name: 'order_value_cents',
  help: 'Order value in cents',
  buckets: [1000, 5000, 10000, 50000, 100000, 500000]
});

// Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({ method: req.method, path: req.route?.path || req.path, status_code: res.statusCode });
    httpRequestDuration.observe({ method: req.method, path: req.route?.path || req.path, status_code: res.statusCode }, duration);
  });
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.send(await promClient.register.metrics());
});

module.exports = { httpRequestsTotal, httpRequestDuration, activeConnections, ordersTotal, orderValue };
```

---

## Alerting Rules

### Critical Alerts

```yaml
# prometheus/rules/critical.yml
groups:
  - name: critical-alerts
    interval: 30s
    rules:
      # Service Down
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Service {{ $labels.job }} on {{ $labels.instance }} is down"
          description: "{{ $labels.job }} has been down for more than 1 minute"
          runbook_url: "https://wiki.stitchstyle.co/runbooks/service-down"

      # High Error Rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (job)
          /
          sum(rate(http_requests_total[5m])) by (job)
          > 0.01
        for: 2m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High error rate on {{ $labels.job }}"
          description: "Error rate is {{ $value | humanizePercentage }} on {{ $labels.job }}"
          runbook_url: "https://wiki.stitchstyle.co/runbooks/high-error-rate"

      # Database Down
      - alert: DatabaseDown
        expr: mongodb_up == 0
        for: 30s
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "MongoDB is down"
          description: "MongoDB instance {{ $labels.instance }} is not responding"
          runbook_url: "https://wiki.stitchstyle.co/runbooks/database-down"

      # Redis Down
      - alert: RedisDown
        expr: redis_up == 0
        for: 30s
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Redis is down"
          description: "Redis instance {{ $labels.instance }} is not responding"
```

### Warning Alerts

```yaml
# prometheus/rules/warning.yml
groups:
  - name: warning-alerts
    interval: 60s
    rules:
      # High Latency
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, 
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job)
          ) > 0.5
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High latency on {{ $labels.job }}"
          description: "p95 latency is {{ $value | humanizeDuration }} on {{ $labels.job }}"

      # High Memory Usage
      - alert: HighMemoryUsage
        expr: |
          (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.85
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "High memory usage on {{ $labels.container }}"
          description: "Memory usage is {{ $value | humanizePercentage }} of limit"

      # High CPU Usage
      - alert: HighCPUUsage
        expr: |
          (rate(container_cpu_usage_seconds_total[5m]) / container_spec_cpu_quota/container_spec_cpu_period) > 0.85
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "High CPU usage on {{ $labels.container }}"
          description: "CPU usage is {{ $value | humanizePercentage }} of limit"

      # Disk Space
      - alert: DiskSpaceLow
        expr: |
          (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) < 0.15
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
          description: "Only {{ $value | humanizePercentage }} disk space remaining"

      # High Latency (Business)
      - alert: SlowCheckout
        expr: |
          histogram_quantile(0.95, 
            sum(rate(checkout_duration_seconds_bucket[5m])) by (le)
          ) > 10
        for: 2m
        labels:
          severity: warning
          team: frontend
        annotations:
          summary: "Slow checkout process"
          description: "p95 checkout time is {{ $value | humanizeDuration }}"
```

### Info Alerts

```yaml
# prometheus/rules/info.yml
groups:
  - name: info-alerts
    interval: 300s
    rules:
      # New Deployment
      - alert: NewDeployment
        expr: |
          kube_deployment_status_replicas_updated{namespace="production"} 
          != 
          kube_deployment_status_replicas{namespace="production"}
        for: 1m
        labels:
          severity: info
          team: devops
        annotations:
          summary: "New deployment detected"
          description: "Deployment {{ $labels.deployment }} updated to {{ $value }} replicas"

      # Certificate Expiry
      - alert: CertificateExpiringSoon
        expr: |
          ssl_certificate_expiration_timestamp_seconds - time() < 86400 * 30
        for: 1h
        labels:
          severity: info
          team: platform
        annotations:
          summary: "SSL certificate expiring soon"
          description: "Certificate for {{ $labels.domain }} expires in {{ $value | humanizeDuration }}"
```

---

## Dashboard Design

### Grafana Dashboards

#### 1. System Overview

```json
{
  "title": "System Overview",
  "panels": [
    {
      "title": "Service Health",
      "type": "stat",
      "targets": [
        { "expr": "up", "legendFormat": "{{job}}" }
      ],
      "fieldConfig": {
        "defaults": {
          "mappings": [
            { "type": "value", "options": { "0": { "text": "DOWN", "color": "red" }, "1": { "text": "UP", "color": "green" } } }
          ]
        }
      }
    },
    {
      "title": "Request Rate",
      "type": "graph",
      "targets": [
        { "expr": "sum(rate(http_requests_total[5m])) by (job)", "legendFormat": "{{job}}" }
      ]
    },
    {
      "title": "Error Rate",
      "type": "graph",
      "targets": [
        { "expr": "sum(rate(http_requests_total{status_code=~\"5..\"}[5m])) by (job) / sum(rate(http_requests_total[5m])) by (job)", "legendFormat": "{{job}} error rate" }
      ]
    },
    {
      "title": "Latency (p95)",
      "type": "graph",
      "targets": [
        { "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job))", "legendFormat": "{{job}} p95" }
      ]
    }
  ]
}
```

#### 2. Business Metrics

```json
{
  "title": "Business Metrics",
  "panels": [
    {
      "title": "Orders per Minute",
      "type": "graph",
      "targets": [
        { "expr": "rate(orders_total[5m])", "legendFormat": "{{status}}" }
      ]
    },
    {
      "title": "Revenue (Last Hour)",
      "type": "stat",
      "targets": [
        { "expr": "sum(rate(order_value_cents_sum[1h])) / 100" }
      ]
    },
    {
      "title": "Conversion Rate",
      "type": "gauge",
      "targets": [
        { "expr": "rate(orders_total{status=\"completed\"}[5m]) / rate(http_requests_total{path=\"/checkout\"}[5m])" }
      ]
    },
    {
      "title": "Cart Abandonment",
      "type": "graph",
      "targets": [
        { "expr": "rate(cart_created_total[5m]) - rate(orders_total[5m])", "legendFormat": "Abandoned" }
      ]
    }
  ]
}
```

#### 3. Infrastructure

```json
{
  "title": "Infrastructure",
  "panels": [
    {
      "title": "CPU Usage",
      "type": "graph",
      "targets": [
        { "expr": "sum(rate(container_cpu_usage_seconds_total[5m])) by (container)", "legendFormat": "{{container}}" }
      ]
    },
    {
      "title": "Memory Usage",
      "type": "graph",
      "targets": [
        { "expr": "container_memory_usage_bytes / container_spec_memory_limit_bytes", "legendFormat": "{{container}}" }
      ]
    },
    {
      "title": "Network I/O",
      "type": "graph",
      "targets": [
        { "expr": "rate(container_network_transmit_bytes_total[5m])", "legendFormat": "{{container}} TX" },
        { "expr": "rate(container_network_receive_bytes_total[5m])", "legendFormat": "{{container}} RX" }
      ]
    },
    {
      "title": "Disk Usage",
      "type": "gauge",
      "targets": [
        { "expr": "node_filesystem_avail_bytes{mountpoint=\"/\"} / node_filesystem_size_bytes{mountpoint=\"/\"}" }
      ]
    }
  ]
}
```

---

## Backup Strategy

### Backup Types & Schedule

| Backup Type | Frequency | Retention | Storage | RTO | RPO |
|-------------|-----------|-----------|---------|-----|-----|
| **MongoDB Full** | Daily 02:00 UTC | 30 days | S3 + Local | 4 hours | 24 hours |
| **MongoDB Incremental** | Every 6 hours | 7 days | S3 | 2 hours | 6 hours |
| **Redis RDB** | Daily 03:00 UTC | 7 days | S3 | 1 hour | 24 hours |
| **Uploads (rsync)** | Every 4 hours | 30 days | S3 + EFS | 2 hours | 4 hours |
| **Configuration** | On change | 90 days | Git + S3 | N/A | N/A |
| **Secrets** | On rotation | Permanent | Vault | N/A | N/A |

### Automated Backup Script

```bash
#!/bin/bash
# backup-daily.sh - Runs via cron at 02:00 UTC

set -euo pipefail

BACKUP_ROOT="/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="${BACKUP_ROOT}/${DATE}"
S3_BUCKET="s3://stitch-style-backups/production"

mkdir -p "${BACKUP_DIR}"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }

# 1. MongoDB Backup
log "Starting MongoDB backup..."
docker exec stitch-mongodb-prod mongodump \
  --uri="mongodb://${MONGO_USER}:${MONGO_PASS}@localhost:27017" \
  --gzip \
  --out=/dump
docker cp stitch-mongodb-prod:/dump "${BACKUP_DIR}/mongodb"
docker exec stitch-mongodb-prod rm -rf /dump
log "MongoDB backup completed"

# 2. Redis Backup
log "Starting Redis backup..."
docker exec stitch-redis-prod redis-cli --rdb /data/dump.rdb
docker cp stitch-redis-prod:/data/dump.rdb "${BACKUP_DIR}/redis/dump.rdb"
log "Redis backup completed"

# 3. Uploads (incremental rsync)
log "Syncing uploads..."
rsync -avz --delete /data/uploads/ "${BACKUP_DIR}/uploads/"
log "Uploads sync completed"

# 4. Configuration backup
log "Backing up configuration..."
tar -czf "${BACKUP_DIR}/config.tar.gz" \
  -C /etc/docker/compose . \
  --exclude='*.log' --exclude='*.tmp'
log "Configuration backup completed"

# 5. Create manifest
cat > "${BACKUP_DIR}/manifest.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "1.0",
  "components": ["mongodb", "redis", "uploads", "config"],
  "mongodb_size": "$(du -sh ${BACKUP_DIR}/mongodb | cut -f1)",
  "redis_size": "$(du -sh ${BACKUP_DIR}/redis | cut -f1)",
  "uploads_size": "$(du -sh ${BACKUP_DIR}/uploads | cut -f1)",
  "checksums": {
    "mongodb": "$(sha256sum ${BACKUP_DIR}/mongodb.tar.gz | cut -d' ' -f1)",
    "redis": "$(sha256sum ${BACKUP_DIR}/redis.tar.gz | cut -d' ' -f1)"
  }
}
EOF

# 6. Compress and encrypt
log "Compressing and encrypting..."
tar -czf "${BACKUP_DIR}.tar.gz" -C "$(dirname "${BACKUP_DIR}")" "$(basename "${BACKUP_DIR}")"
gpg --symmetric --cipher-algo AES256 --batch --yes --passphrase "${BACKUP_ENCRYPTION_KEY}" "${BACKUP_DIR}.tar.gz"

# 7. Upload to S3
log "Uploading to S3..."
aws s3 cp "${BACKUP_DIR}.tar.gz.gpg" "${S3_BUCKET}/${DATE}/backup.tar.gz.gpg" \
  --storage-class STANDARD_IA \
  --metadata "environment=production,date=$(date -u +%Y-%m-%d)"

# 8. Cleanup
log "Cleaning up local files..."
rm -rf "${BACKUP_DIR}" "${BACKUP_DIR}.tar.gz" "${BACKUP_DIR}.tar.gz.gpg"

# 9. Cleanup old local backups (keep 7 days)
find "${BACKUP_ROOT}" -type f -name "*.tar.gz.gpg" -mtime +7 -delete

# 10. Notify
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"✅ Daily backup completed: ${DATE}\"}" \
  "${SLACK_WEBHOOK_URL}"

log "Backup completed successfully"
```

### Incremental Backup (Every 6 Hours)

```bash
#!/bin/bash
# backup-incremental.sh - Runs every 6 hours

# MongoDB oplog-based incremental
docker exec stitch-mongodb-prod mongodump \
  --uri="mongodb://..." \
  --oplog \
  --gzip \
  --out=/dump/incremental

# Upload only changes
rsync -avz --link-dest="/backups/latest" /backups/current/ /backups/incremental/
```

### Point-in-Time Recovery (MongoDB Atlas)

```bash
# If using MongoDB Atlas
# 1. Go to Atlas Console → Clusters → Backup
# 2. Select "Restore" → "Point in Time"
# 3. Choose timestamp
# 4. Download or restore to cluster

# Verify restore
mongosh "mongodb://..." --eval "db.orders.countDocuments()"
```

---

## Disaster Recovery

### Recovery Time Objectives (RTO)

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| Single container crash | 30 seconds | 0 | Auto-restart |
| Node failure | 2 minutes | 0 | Auto-failover |
| Database corruption | 4 hours | 24 hours | Restore from backup |
| Region outage | 30 minutes | 1 hour | Failover to DR region |
| Ransomware | 24 hours | 24 hours | Restore from immutable backup |
| Data center loss | 2 hours | 1 hour | DNS failover + DR deployment |

### DR Region Setup

```yaml
# Secondary region (us-west-2)
# Warm standby - minimal resources running
# Auto-scale on failover

# DNS Failover (Route 53)
# Primary: api.stitchstyle.co → ALB us-east-1
# Secondary: api.stitchstyle.co → ALB us-west-2
# Health checks: /health endpoint
# Failover: 30 second TTL, evaluate target health
```

### DR Runbook

```markdown
# Disaster Recovery Runbook

## Scenario: Primary Region Outage

### Detection
- Alert: ServiceDown (critical)
- Manual: Unable to access services

### Assessment (5 min)
1. Check AWS Health Dashboard
2. Verify DNS resolution
3. Test from multiple regions
4. Check CloudWatch metrics

### Decision (5 min)
- If isolated to one AZ: Wait for AWS recovery
- If region-wide: Initiate failover

### Failover Procedure (20 min)
1. **Update DNS** (Route 53)
   ```bash
   aws route53 change-resource-record-sets --hosted-zone-id Z123 \
     --change-batch file://failover.json
   ```

2. **Scale DR resources**
   ```bash
   # Scale up DR region
   aws ecs update-service --cluster prod-dr --service backend --desired-count 4
   aws ecs update-service --cluster prod-dr --service frontend --desired-count 4
   ```

3. **Verify services**
   ```bash
   curl -f https://api.stitchstyle.co/health
   curl -f https://stitchstyle.co/health
   ```

4. **Notify stakeholders**
   - Slack #incidents
   - PagerDuty
   - Status page update

### Verification (10 min)
- [ ] API responding
- [ ] Frontend loading
- [ ] Orders processing
- [ ] Payments working
- [ ] Email notifications sending

### Communication
- Internal: #incidents Slack channel
- External: status.stitchstyle.co
- Customers: Email if > 30 min downtime

### Post-Incident (within 48 hours)
1. Root cause analysis
2. Update runbook
3. Action items for prevention
```

---

## Runbook Procedures

### RB-001: Service Not Responding

```bash
# 1. Check container status
docker ps -f "name=backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. Check logs
docker logs backend --tail 100 -f

# 3. Check health endpoint
curl -v http://localhost:5006/health

# 4. Check dependencies
curl -v http://mongodb:27017/
curl -v redis://redis:6379/

# 5. Restart if needed
docker restart backend

# 6. If persistent, check resources
docker stats backend --no-stream
```

### RB-002: High Error Rate

```bash
# 1. Check error patterns
docker logs backend --tail 500 | grep -i error | head -20

# 2. Check recent deployments
docker service ps backend --no-trunc

# 3. Check specific endpoints
grep "POST /api/orders" /var/log/nginx/access.log | tail -20

# 4. Rollback if needed
docker service rollback backend
```

### RB-003: Database Connection Issues

```bash
# 1. Test connection
docker exec backend mongosh --eval "db.adminCommand('ping')"

# 2. Check MongoDB status
docker exec mongodb mongosh --eval "rs.status()"

# 3. Check connection pool
docker logs backend | grep -i "pool\|connection" | tail -20

# 4. Restart if needed
docker restart backend mongodb
```

### RB-004: High Latency

```bash
# 1. Check resource usage
docker stats --no-stream

# 2. Check slow queries
docker exec mongodb mongosh --eval "db.currentOp({'secs_running': {$gt: 5}})"

# 3. Check for memory leaks
docker exec backend node -e "console.log(process.memoryUsage())"

# 4. Scale if needed
docker service scale backend=6
```

### RB-005: Certificate Expiry

```bash
# 1. Check certificate
openssl x509 -in /etc/ssl/certs/stitchstyle.co.crt -text -noout | grep "Not After"

# 2. Renew (Let's Encrypt)
certbot renew --dry-run
certbot renew

# 3. Reload nginx/traefik
docker exec traefik traefik reload
docker exec nginx nginx -s reload
```

### RB-006: Disk Space Critical

```bash
# 1. Check disk usage
df -h /

# 2. Find large files
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null | head -20

# 3. Clean Docker
docker system prune -af --volumes

# 4. Clean logs
find /var/log -name "*.log" -mtime +7 -delete

# 5. Compress old logs
find /var/log -name "*.log" -mtime +1 -exec gzip {} \;
```

### RB-007: Payment Processing Failures

```bash
# 1. Check Stripe dashboard
# https://dashboard.stripe.com/webhooks

# 2. Check webhook logs
docker logs backend | grep -i stripe | tail -20

# 3. Check failed orders
docker exec mongodb mongosh --eval "db.orders.find({paymentStatus: 'Failed'}).sort({createdAt: -1}).limit(10)"

# 4. Retry failed payments
docker exec backend node -e "
  const Order = require('./models/Order');
  const orders = await Order.find({ paymentStatus: 'Failed', createdAt: { \$gt: new Date(Date.now() - 3600000) } });
  for (const order of orders) { await retryPayment(order); }
"
```

---

## Testing Procedures

### Chaos Engineering

```yaml
# Chaos Mesh experiment
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: backend-pod-failure
spec:
  action: pod-failure
  mode: one
  duration: '30s'
  selector:
    namespaces:
      - production
    labelSelectors:
      app: backend
```

### Load Testing

```bash
# k6 load test
k6 run --vus 100 --duration 5m \
  -e BASE_URL=https://api.stitchstyle.co \
  load-test.js
```

### Failover Testing

```bash
# Monthly DR test
# 1. Schedule maintenance window
# 2. Simulate region failure
aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch file://failover.json

# 3. Verify DR region
curl -f https://api.stitchstyle.co/health

# 4. Run smoke tests
npm run test:smoke

# 5. Failback
aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch file://failback.json
```

---

*Last Updated: 2026-11-12*
*Version: 1.0*
*Review: Quarterly or after major incidents*