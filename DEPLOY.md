# Deployment Guide

This document describes the deployment process for Stitch & Style Co.

## Overview

| Environment | Branch | URL | Deploy Trigger |
|-------------|--------|-----|----------------|
| Development | `develop` | https://staging.stitchstyle.co | Auto on merge to `develop` |
| Production | `main` | https://stitchstyle.co | Manual on release tag |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │────▶│  GitHub     │────▶│  Kubernetes │
│   Actions   │     │   Registry  │     │   Cluster   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                    ┌──────▼──────┐      ┌──────▼──────┐
                    │  Docker Hub │      │  Ingress    │
                    └─────────────┘      └─────────────┘
```

## Prerequisites

- Docker Hub account with repository access
- Kubernetes cluster (staging + production)
- kubectl configured for both clusters
- AWS CLI for infrastructure (if applicable)
- Slack webhook for notifications

## Secrets Management

### Repository Secrets (GitHub)

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `KUBECONFIG_STAGING` | Base64 encoded kubeconfig for staging |
| `KUBECONFIG_PRODUCTION` | Base64 encoded kubeconfig for production |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | AWS region (e.g., us-east-1) |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications |

### Environment Secrets (Per Environment)

**Staging Environment:**
- `STAGING_DATABASE_URL`
- `STAGING_JWT_SECRET`
- `STAGING_STRIPE_SECRET_KEY`
- `STAGING_STRIPE_PUBLISHABLE_KEY`
- `STAGING_STRIPE_WEBHOOK_SECRET`
- `STAGING_FRONTEND_URL`
- `STAGING_REDIS_URL`

**Production Environment:**
- `PROD_DATABASE_URL`
- `PROD_JWT_SECRET`
- `PROD_STRIPE_SECRET_KEY`
- `PROD_STRIPE_PUBLISHABLE_KEY`
- `PROD_STRIPE_WEBHOOK_SECRET`
- `PROD_FRONTEND_URL`
- `PROD_REDIS_URL`

---

## Deployment Process

### Automatic Staging Deployment

Triggered automatically on merge to `develop`:

1. **CI Pipeline Runs**:
   - Security scan (gitleaks, npm audit)
   - Backend tests + lint
   - Frontend tests + lint + typecheck + build
   - Docker images built and pushed to Docker Hub

2. **Staging Deploy** (on `develop`):
   - Uses `staging` environment
   - Deploys to staging Kubernetes cluster
   - Runs database migrations
   - Health checks
   - Slack notification

### Manual Production Deployment

Triggered manually on release tag (`v*`):

1. **Create Release Branch**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.2.0
   # Update version in package.json
   # Update CHANGELOG.md
   git commit -am "chore: prepare release v1.2.0"
   git push origin release/v1.2.0
   ```

2. **Create PR to main**:
   - Base: `main`
   - Title: `release: v1.2.0`
   - Requires: 1 approval, all checks pass

3. **Merge to main** → Triggers release workflow:
   - Semantic release determines version
   - Generates CHANGELOG.md
   - Creates git tag `v1.2.0`
   - Creates GitHub release
   - Triggers production deploy workflow

4. **Production Deploy** (requires manual approval):
   - Uses `production` environment
   - Deploys to production Kubernetes cluster
   - Runs database migrations
   - Health checks
   - Slack notification

---

## Kubernetes Deployment

### Backend Deployment

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stitch-style-backend
  namespace: {{ENV}}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: stitch-style-backend
  template:
    metadata:
      labels:
        app: stitch-style-backend
    spec:
      containers:
      - name: backend
        image: stitch-style/backend:{{VERSION}}
        ports:
        - containerPort: 5006
        envFrom:
        - secretRef:
            name: backend-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5006
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 5006
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Frontend Deployment

```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stitch-style-frontend
  namespace: {{ENV}}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: stitch-style-frontend
  template:
    metadata:
      labels:
        app: stitch-style-frontend
    spec:
      containers:
      - name: frontend
        image: stitch-style/frontend:{{VERSION}}
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.{{ENV}}.stitchstyle.co"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

### Services & Ingress

```yaml
# k8s/services.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: {{ENV}}
spec:
  selector:
    app: stitch-style-backend
  ports:
  - port: 5006
    targetPort: 5006
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: {{ENV}}
spec:
  selector:
    app: stitch-style-frontend
  ports:
  - port: 3000
    targetPort: 3000
```

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: stitch-style-ingress
  namespace: {{ENV}}
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - {{ENV}}.stitchstyle.co
    secretName: stitch-style-tls
  rules:
  - host: {{ENV}}.stitchstyle.co
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 5006
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 3000
```

---

## Database Migrations

```bash
# Run migrations on deploy
kubectl exec -n {{ENV}} deploy/stitch-style-backend -- npm run migrate

# Or use init container in deployment
```

### Seeding (Staging Only)

```bash
kubectl exec -n staging deploy/stitch-style-backend -- npm run seed
```

---

## Rollback Procedures

### Quick Rollback (Kubernetes)

```bash
# Rollback to previous revision
kubectl rollout undo deployment/stitch-style-backend -n {{ENV}}
kubectl rollout undo deployment/stitch-style-frontend -n {{ENV}}

# Check rollout status
kubectl rollout status deployment/stitch-style-backend -n {{ENV}}
```

### Rollback to Specific Version

```bash
# Rollback to specific revision
kubectl rollout undo deployment/stitch-style-backend -n {{ENV}} --to-revision=3

# Or update image tag
kubectl set image deployment/stitch-style-backend backend=stitch-style/backend:v1.1.5 -n {{ENV}}
```

### Database Rollback

```bash
# If migration was run, rollback manually
kubectl exec -n {{ENV}} deploy/stitch-style-backend -- npm run migrate:down
```

---

## Health Checks

### Backend Endpoints

- `GET /health` - Liveness probe
- `GET /ready` - Readiness probe
- `GET /api/health` - Detailed health info

### Frontend Endpoints

- `GET /` - Home page
- `GET /health` - Health check

### Monitoring

- Prometheus metrics: `/metrics`
- Logs: `kubectl logs -n {{ENV}} -l app=stitch-style-backend`
- Alerting: Prometheus + Grafana

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Pods stuck in `Pending` | Resource limits | Increase cluster capacity or adjust requests |
| `ImagePullBackOff` | Wrong image tag | Check Docker Hub tag exists |
| `CrashLoopBackOff` | App crash on start | Check logs: `kubectl logs` |
| 502 Bad Gateway | Ingress misconfig | Check service/ingress config |
| DB connection failed | Wrong secret | Verify `DATABASE_URL` secret |

### Debug Commands

```bash
# Get pod logs
kubectl logs -n {{ENV}} -l app=stitch-style-backend --tail=100

# Exec into pod
kubectl exec -it -n {{ENV}} deploy/stitch-style-backend -- sh

# Check events
kubectl get events -n {{ENV}} --sort-by='.lastTimestamp'

# Describe pod
kubectl describe pod -n {{ENV}} -l app=stitch-style-backend

# Check secrets
kubectl get secret -n {{ENV}} backend-secrets -o yaml
```

---

## Emergency Procedures

### Full Rollback (Production)

```bash
# 1. Rollback deployments
kubectl rollout undo deployment/stitch-style-backend -n production
kubectl rollout undo deployment/stitch-style-frontend -n production

# 2. Verify
kubectl rollout status deployment/stitch-style-backend -n production

# 3. If DB migration, rollback
kubectl exec -n production deploy/stitch-style-backend -- npm run migrate:down

# 4. Notify team
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 Production rolled back to previous version"}' \
  ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Database Recovery

```bash
# Restore from backup (if using managed DB)
# AWS RDS: AWS Console → Restore to point in time
# MongoDB Atlas: Atlas Console → Restore

# Verify data integrity
kubectl exec -n production deploy/stitch-style-backend -- npm run db:verify
```

---

## Checklists

### Pre-Deploy Checklist

- [ ] All CI checks pass
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Docker images built and pushed
- [ ] Database migrations ready
- [ ] Environment secrets verified
- [ ] Team notified of deployment window

### Post-Deploy Checklist

- [ ] Health checks pass
- [ ] Smoke tests pass
- [ ] Error rates normal
- [ ] Performance metrics normal
- [ ] Team notified of completion
- [ ] Rollback plan confirmed

---

*Last updated: 2026-11-12*
*Version: 1.0*