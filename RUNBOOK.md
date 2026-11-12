# Operational Runbook

This runbook provides step-by-step procedures for common operational tasks and incident response.

## Table of Contents

1. [Service Overview](#service-overview)
2. [Monitoring & Alerting](#monitoring--alerting)
3. [Common Operations](#common-operations)
4. [Incident Response](#incident-response)
5. [Runbook Procedures](#runbook-procedures)
6. [Contacts & Escalation](#contacts--escalation)

---

## Service Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                          │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
        ┌─────────────┐                 ┌─────────────┐
        │   Frontend  │                 │   Backend   │
        │  (Next.js)  │                 │  (Express)  │
        │  Port 3000  │                 │  Port 5006  │
        └─────────────┘                 └─────────────┘
                                              │
                              ┌───────────────┼───────────────┐
                                              ▼               ▼
                                        ┌─────────┐     ┌─────────┐
                                        │ MongoDB │     │  Redis  │
                                        │  Atlas  │     │ (Cache) │
                                        └─────────┘     └─────────┘
```

### Key Services

| Service | Port | Health Check | Criticality |
|---------|------|--------------|-------------|
| Frontend | 3000 | `GET /health` | High |
| Backend API | 5006 | `GET /health`, `GET /ready` | Critical |
| MongoDB | 27017 | `db.adminCommand('ping')` | Critical |
| Redis | 6379 | `PING` | Medium |

### SLAs

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Uptime | 99.9% | < 99.5% |
| API Latency (p95) | < 200ms | > 500ms |
| Error Rate | < 0.1% | > 1% |
| Deployment Success | 100% | Any failure |

---

## Monitoring & Alerting

### Dashboards

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| Grafana Overview | https://grafana.stitchstyle.co/d/overview | System health |
| API Metrics | https://grafana.stitchstyle.co/d/api | API performance |
| Business Metrics | https://grafana.stitchstyle.co/d/business | Orders, revenue |
| Infrastructure | https://grafana.stitchstyle.co/d/infra | Cluster health |

### Key Alerts

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| Service Down | Health check fails 3x | Critical | PagerDuty + Slack |
| High Error Rate | > 1% 5xx errors | Critical | PagerDuty + Slack |
| High Latency | p95 > 500ms | Warning | Slack |
| Disk Space | > 80% | Warning | Slack |
| Memory Usage | > 85% | Warning | Slack |
| DB Connections | > 80% pool | Warning | Slack |
| Failed Deploy | CI/CD failure | Critical | Slack |

### On-Call Rotation

| Week | Primary | Secondary |
|------|---------|-----------|
| Week 1 | Elvis | - |
| Week 2 | Elvis | - |
| Week 3 | Elvis | - |
| Week 4 | Elvis | - |

---

## Common Operations

### Restart Services

```bash
# Backend
kubectl rollout restart deployment/stitch-style-backend -n {{ENV}}

# Frontend
kubectl rollout restart deployment/stitch-style-frontend -n {{ENV}}

# Check status
kubectl rollout status deployment/stitch-style-backend -n {{ENV}}
```

### Scale Services

```bash
# Scale backend
kubectl scale deployment/stitch-style-backend --replicas=5 -n {{ENV}}

# Scale frontend
kubectl scale deployment/stitch-style-frontend --replicas=5 -n {{ENV}}

# Auto-scale (HPA)
kubectl autoscale deployment/stitch-style-backend --cpu-percent=70 --min=3 --max=10 -n {{ENV}}
```

### View Logs

```bash
# Backend logs
kubectl logs -n {{ENV}} -l app=stitch-style-backend --tail=100 -f

# Frontend logs
kubectl logs -n {{ENV}} -l app=stitch-style-frontend --tail=100 -f

# Previous container logs (after crash)
kubectl logs -n {{ENV}} -l app=stitch-style-backend --previous --tail=100

# All pods
kubectl logs -n {{ENV}} -l app=stitch-style-backend --all-containers --tail=50
```

### Database Operations

```bash
# Connect to MongoDB
kubectl exec -it -n {{ENV}} deploy/stitch-style-backend -- mongosh

# Run migration
kubectl exec -n {{ENV}} deploy/stitch-style-backend -- npm run migrate

# Seed data (staging only)
kubectl exec -n staging deploy/stitch-style-backend -- npm run seed

# Backup (if using managed DB)
# MongoDB Atlas: Atlas Console → Backup → Restore
```

### Cache Operations

```bash
# Clear Redis cache
kubectl exec -it -n {{ENV}} deploy/redis -- redis-cli FLUSHALL

# Check Redis info
kubectl exec -it -n {{ENV}} deploy/redis -- redis-cli INFO

# Check keys
kubectl exec -it -n {{ENV}} deploy/redis -- redis-cli KEYS "*"
```

### Secret Management

```bash
# View secret
kubectl get secret -n {{ENV}} backend-secrets -o yaml

# Update secret
kubectl create secret generic backend-secrets \
  --from-literal=JWT_SECRET=new-secret \
  --from-literal=STRIPE_SECRET_KEY=sk_test_... \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to pick up new secrets
kubectl rollout restart deployment/stitch-style-backend -n {{ENV}}
```

---

## Incident Response

### Incident Classification

| Severity | Definition | Response Time | Example |
|----------|------------|---------------|---------|
| **SEV-1** | Complete outage, data loss, security breach | 15 min | API down, DB down, data breach |
| **SEV-2** | Major feature broken, degraded performance | 30 min | Checkout broken, high latency |
| **SEV-3** | Minor feature issue, non-critical bug | 2 hours | UI glitch, minor API issue |
| **SEV-4** | Cosmetic, documentation, enhancement | Next business day | Typos, minor UI improvements |

### Incident Response Process

```
1. DETECT
   ├── Alert fires (PagerDuty/Grafana)
   ├── On-call acknowledges (15 min SEV-1, 30 min SEV-2)
   └── Create incident channel (#incident-YYYYMMDD-XXX)

2. ASSESS
   ├── Determine severity
   ├── Identify affected services
   ├── Check recent deployments
   └── Check monitoring dashboards

3. MITIGATE
   ├── Implement workaround/rollback
   ├── Communicate status
   └── Document actions in incident channel

4. RESOLVE
   ├── Fix root cause
   ├── Verify fix
   └── Close incident

5. POST-INCIDENT
   ├── Post-mortem within 48 hours
   ├── Action items assigned
   └── Update runbook
```

### Communication Templates

**Initial Acknowledgment (SEV-1/2):**
```
🚨 INCIDENT: [Title]
Severity: SEV-1/2
Status: Investigating
Affected: [Services]
Started: [Timestamp]
On-call: @oncall
Channel: #incident-YYYYMMDD-XXX
```

**Status Update:**
```
📊 UPDATE: [Title]
Status: Investigating/Mitigating/Resolved
Progress: [What we know/what we're doing]
ETA: [If known]
Next update: [Time]
```

**Resolution:**
```
✅ RESOLVED: [Title]
Root Cause: [Summary]
Fix: [What was done]
Impact: [Duration, affected users]
Post-mortem: [Link when ready]
```

---

## Runbook Procedures

### RB-001: API Service Down

**Symptoms:** Health checks failing, 5xx errors, alerts firing

**Diagnosis:**
```bash
# 1. Check pod status
kubectl get pods -n {{ENV}} -l app=stitch-style-backend

# 2. Check logs
kubectl logs -n {{ENV}} -l app=stitch-style-backend --tail=100

# 3. Check events
kubectl get events -n {{ENV}} --sort-by='.lastTimestamp'

# 4. Check dependencies
kubectl exec -n {{ENV}} deploy/stitch-style-backend -- mongosh --eval "db.adminCommand('ping')"
```

**Resolution:**
| Cause | Action |
|-------|--------|
| OOM Killed | Increase memory limits, restart |
| DB Connection Failed | Check MongoDB status, restart pods |
| Config Error | Fix config, restart |
| Code Bug | Rollback to previous version |

**Rollback:**
```bash
kubectl rollout undo deployment/stitch-style-backend -n {{ENV}}
```

### RB-002: High Error Rate (5xx > 1%)

**Symptoms:** Alert firing, error rate dashboard spike

**Diagnosis:**
```bash
# 1. Check error patterns
kubectl logs -n {{ENV}} -l app=stitch-style-backend --tail=500 | grep -i error

# 2. Check recent deployments
kubectl rollout history deployment/stitch-style-backend -n {{ENV}}

# 3. Check specific endpoints
kubectl logs -n {{ENV}} -l app=stitch-style-backend | grep "POST /api/orders"
```

**Resolution:**
| Cause | Action |
|-------|--------|
| Bad deploy | Rollback |
| DB issue | Check DB, restart if needed |
| External API | Implement circuit breaker |
| Code bug | Hotfix + deploy |

### RB-003: High Latency (p95 > 500ms)

**Symptoms:** Latency alert, user complaints

**Diagnosis:**
```bash
# 1. Check resource usage
kubectl top pods -n {{ENV}}

# 2. Check DB performance
kubectl exec -n {{ENV}} deploy/stitch-style-backend -- mongosh --eval "db.currentOp()"

# 3. Check for slow queries
kubectl logs -n {{ENV}} -l app=stitch-style-backend | grep "slow"
```

**Resolution:**
| Cause | Action |
|-------|--------|
| CPU/Memory pressure | Scale up, optimize queries |
| DB slow queries | Add indexes, optimize |
| External API slow | Cache, timeout, circuit breaker |
| Memory leak | Restart, investigate |

### RB-004: Database Connection Issues

**Symptoms:** Connection errors, timeouts, "connection refused"

**Diagnosis:**
```bash
# 1. Test connection
kubectl exec -n {{ENV}} deploy/stitch-style-backend -- mongosh --eval "db.adminCommand('ping')"

# 2. Check MongoDB Atlas status
# https://cloud.mongodb.com

# 3. Check connection pool
kubectl logs -n {{ENV}} -l app=stitch-style-backend | grep -i "pool\|connection"
```

**Resolution:**
| Cause | Action |
|-------|--------|
| Atlas maintenance | Wait, check status page |
| Network issue | Check VPC peering, security groups |
| Credentials expired | Rotate secrets, restart pods |
| Connection pool exhausted | Increase pool size, restart |

### RB-005: Payment Processing Failures

**Symptoms:** Stripe webhook failures, order creation errors

**Diagnosis:**
```bash
# 1. Check Stripe dashboard
# https://dashboard.stripe.com/webhooks

# 2. Check webhook logs
kubectl logs -n {{ENV}} -l app=stitch-style-backend | grep -i stripe

# 3. Check order collection
kubectl exec -n {{ENV}} deploy/stitch-style-backend -- mongosh --eval "db.orders.find({paymentStatus: 'Failed'}).limit(5)"
```

**Resolution:**
| Cause | Action |
|-------|--------|
| Webhook signature mismatch | Verify webhook secret |
| Stripe API down | Check status.stripe.com |
| Idempotency key conflict | Check idempotency logic |
| Insufficient funds | Notify user, retry logic |

### RB-006: Redis Cache Issues

**Symptoms:** Cache misses, slow responses, Redis errors

**Diagnosis:**
```bash
# 1. Check Redis
kubectl exec -it -n {{ENV}} deploy/redis -- redis-cli PING

# 2. Check memory
kubectl exec -it -n {{ENV}} deploy/redis -- redis-cli INFO memory

# 3. Check keys
kubectl exec -it -n {{ENV}} deploy/redis -- redis-cli DBSIZE
```

**Resolution:**
| Cause | Action |
|-------|--------|
| OOM | Increase memory, restart |
| Connection refused | Restart Redis pod |
| Too many keys | Implement TTL, cleanup |

### RB-007: Deployment Failure

**Symptoms:** CI/CD pipeline fails, deploy workflow red

**Diagnosis:**
```bash
# 1. Check GitHub Actions
# https://github.com/elvis/stitch-style-co/actions

# 2. Check specific job logs
# Click failed job → view logs

# 3. Common failures:
# - Test failures
# - Lint errors
# - Build errors
# - Docker push failures
```

**Resolution:**
| Cause | Action |
|-------|--------|
| Test flaky | Re-run, fix if persistent |
| Lint error | Fix code, re-push |
| Docker auth | Check Docker Hub credentials |
| Resource limits | Increase runner resources |

### RB-008: SSL/TLS Certificate Issues

**Symptoms:** Browser warnings, certificate expired

**Diagnosis:**
```bash
# 1. Check cert-manager
kubectl get certificates -n {{ENV}}

# 2. Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# 3. Check ingress
kubectl describe ingress -n {{ENV}}
```

**Resolution:**
| Cause | Action |
|-------|--------|
| Cert expired | cert-manager should auto-renew |
| DNS challenge failed | Check DNS records |
| Rate limited | Wait, check Let's Encrypt limits |

---

## Contacts & Escalation

### Internal Contacts

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| Tech Lead | Elvis | elvis@stitchstyle.co | 24/7 |
| Backend Lead | Elvis | elvis@stitchstyle.co | Business hours |
| Frontend Lead | Elvis | elvis@stitchstyle.co | Business hours |
| DevOps | Elvis | elvis@stitchstyle.co | 24/7 |

### External Vendors

| Vendor | Service | Support URL | Contact |
|-------|---------|-------------|---------|
| MongoDB Atlas | Database | https://support.mongodb.com | support@mongodb.com |
| Stripe | Payments | https://support.stripe.com | support@stripe.com |
| Docker Hub | Container Registry | https://support.docker.com | support@docker.com |
| GitHub | Source Control | https://support.github.com | support@github.com |
| Let's Encrypt | SSL Certificates | https://letsencrypt.org/docs/ | - |

### Escalation Matrix

| Severity | 0-15 min | 15-30 min | 30-60 min | 1+ hour |
|----------|----------|-----------|-----------|---------|
| SEV-1 | On-call | Tech Lead | VP Engineering | CTO |
| SEV-2 | On-call | Tech Lead | VP Engineering | - |
| SEV-3 | On-call | Team Lead | - | - |
| SEV-4 | Next business day | - | - | - |

### War Room

For SEV-1 incidents:
1. Create `#incident-warroom` Slack channel
2. Start Zoom call (link in channel)
3. Assign roles: Incident Commander, Scribe, Communications
4. Update status every 15 minutes
5. Post-mortem within 48 hours

---

## Quick Reference

### Useful Commands

```bash
# Get all pods
kubectl get pods -n {{ENV}}

# Describe pod
kubectl describe pod -n {{ENV}} <pod-name>

# Exec into pod
kubectl exec -it -n {{ENV}} <pod-name> -- sh

# Port forward
kubectl port-forward -n {{ENV}} svc/backend-service 5006:5006

# Check resource usage
kubectl top pods -n {{ENV}}

# Check events
kubectl get events -n {{ENV}} --sort-by='.lastTimestamp'

# View configmap
kubectl get configmap -n {{ENV}} -o yaml

# View secret
kubectl get secret -n {{ENV}} -o yaml
```

### Environment Variables

| Variable | Staging | Production |
|----------|---------|------------|
| `NODE_ENV` | development | production |
| `PORT` | 5006 | 5006 |
| `MONGO_URI` | mongodb://... | mongodb+srv://... |
| `JWT_SECRET` | [secret] | [secret] |
| `STRIPE_SECRET_KEY` | sk_test_... | sk_live_... |
| `FRONTEND_URL` | https://staging... | https://stitchstyle.co |

---

*Last updated: 2026-11-12*
*Version: 1.0*
*Review: Quarterly or after major incidents*