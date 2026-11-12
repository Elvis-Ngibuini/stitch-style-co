# GitHub Repository Setup Guide

This document provides step-by-step instructions for configuring the GitHub repository after pushing the code.

## Prerequisites

- GitHub repository created
- Code pushed to GitHub
- Admin access to the repository

---

## 1. Branch Protection Rules

### Navigate to: Settings → Branches → Branch protection rules

### For `main` Branch

Click **Add rule** and configure:

```
Branch name pattern: main

☑ Require a pull request before merging
  ☑ Require approvals: 1
  ☑ Dismiss stale PR approvals when new commits are pushed
  ☑ Require review from code owners (if CODEOWNERS exists)
  ☑ Require status checks to pass before merging
    Required status checks:
    - security
    - backend-test
    - frontend-test
    - backend-build
    - frontend-build
  ☑ Require branches to be up to date before merging
  ☑ Require conversation resolution before merging
  ☑ Require signed commits
  ☑ Require linear history
  ☑ Include administrators
  ☑ Restrict who can push to matching branches
    - No one (or specific team)
  ☑ Allow force pushes: NO
  ☑ Allow deletions: NO
```

### For `develop` Branch

Click **Add rule** and configure:

```
Branch name pattern: develop

☑ Require a pull request before merging
  ☑ Require approvals: 1
  ☑ Dismiss stale PR approvals when new commits are pushed
  ☑ Require status checks to pass before merging
    Required status checks:
    - security
    - backend-test
    - frontend-test
  ☑ Require branches to be up to date before merging
  ☑ Require conversation resolution before merging
  ☑ Include administrators
  ☑ Restrict who can push to matching branches
    - No one (or specific team)
  ☑ Allow force pushes: NO
  ☑ Allow deletions: NO
```

### Auto-delete Merged Branches

In **Settings → General → Pull Requests**:
- ☑ **Automatically delete head branches**

---

## 2. GitHub Environments

### Navigate to: Settings → Environments

### Create `staging` Environment

Click **New environment** → Name: `staging`

```
Environment name: staging

Deployment branch policy:
  ☑ Only allow deployments from protected branches
  Branch: develop

Environment protection rules:
  ☐ Required reviewers (optional for staging)
  ☐ Wait timer (optional)
  
Environment secrets:
  STAGING_DATABASE_URL = mongodb://staging-mongo:27017/stitch-style-staging
  STAGING_JWT_SECRET = <generated-secret>
  STAGING_STRIPE_SECRET_KEY = sk_test_...
  STAGING_STRIPE_PUBLISHABLE_KEY = pk_test_...
  STAGING_STRIPE_WEBHOOK_SECRET = whsec_...
  STAGING_FRONTEND_URL = https://staging.stitchstyle.co
  STAGING_REDIS_URL = redis://staging-redis:6379
```

### Create `production` Environment

Click **New environment** → Name: `production`

```
Environment name: production

Deployment branch policy:
  ☑ Only allow deployments from protected branches
  Branch: main

Environment protection rules:
  ☑ Required reviewers
    - @elvis (or your team)
  ☑ Wait timer: 5 minutes
  
Environment secrets:
  PROD_DATABASE_URL = mongodb+srv://prod-user:...@cluster.mongodb.net/stitch-style-prod
  PROD_JWT_SECRET = <generated-secret>
  PROD_STRIPE_SECRET_KEY = sk_live_...
  PROD_STRIPE_PUBLISHABLE_KEY = pk_live_...
  PROD_STRIPE_WEBHOOK_SECRET = whsec_...
  PROD_FRONTEND_URL = https://stitchstyle.co
  PROD_REDIS_URL = redis://prod-redis:6379
```

---

## 3. Repository Secrets

### Navigate to: Settings → Secrets and variables → Actions

### Repository Secrets (Available to all workflows)

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKERHUB_USERNAME` | Docker Hub username | `elvis` |
| `DOCKERHUB_TOKEN` | Docker Hub access token | `dckr_pat_...` |
| `AWS_ACCESS_KEY_ID` | AWS access key for deploy | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `...` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `KUBECONFIG_STAGING` | Base64 encoded kubeconfig | `YXBpVmVyc2lvbj...` |
| `KUBECONFIG_PRODUCTION` | Base64 encoded kubeconfig | `YXBpVmVyc2lvbj...` |
| `SLACK_WEBHOOK_URL` | Slack notification webhook | `https://hooks.slack.com/...` |

### Environment Secrets (Per Environment)

Configured in each environment (see above).

---

## 4. Secret Scanning & Code Security

### Navigate to: Settings → Security & analysis

Enable all:

```
☑ Dependency graph
☑ Dependabot alerts
☑ Dependabot security updates
☑ Dependabot version updates (configured via dependabot.yml)
☑ Secret scanning
☑ Secret scanning push protection
☑ Code scanning (CodeQL) - will run via workflow
☑ Private vulnerability reporting
```

---

## 5. Code Owners (Optional)

Create `.github/CODEOWNERS`:

```
# Global owners
* @elvis

# Backend
/config/ @elvis
/controllers/ @elvis
/models/ @elvis
/routes/ @elvis
/middleware/ @elvis
/utils/ @elvis

# Frontend
/frontend-next/src/ @elvis

# CI/CD
/.github/ @elvis

# Documentation
/*.md @elvis
```

---

## 6. Branch Naming & PR Templates

### PR Template

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactor
- [ ] Performance improvement
- [ ] Test

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings/errors
- [ ] Tests added/updated

## Related Issues
Closes #<issue-number>
```

### Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.md` and `feature_request.md`.

---

## 7. Notifications & Integrations

### Slack Integration

1. Create Slack App → OAuth & Permissions → Add scopes: `chat:write`, `channels:read`
2. Install to workspace
3. Add webhook URL to repository secrets: `SLACK_WEBHOOK_URL`
4. Add workflow step for notifications (see workflow)

### Dependabot Auto-merge (Optional)

In **Settings → Security & analysis → Dependabot auto-triage rules**:
- Auto-approve patch/minor updates for dev dependencies
- Require review for major updates and production dependencies

---

## 8. Verification Checklist

After setup, verify:

- [ ] Push to `develop` triggers CI
- [ ] PR to `develop` requires checks
- [ ] PR to `main` requires all checks + approval
- [ ] `gitleaks` runs on PR
- [ ] `npm audit` runs on PR
- [ ] `CodeQL` runs on PR
- [ ] Dependabot creates PRs weekly
- [ ] Staging deploys on `develop` merge
- [ ] Production requires manual approval
- [ ] Secrets not exposed in logs
- [ ] Branch protection prevents direct push

---

## 8. Next Steps After Setup

1. Push code: `git push -u origin main`
2. Create `develop` branch: `git checkout -b develop && git push -u origin develop`
3. Verify CI runs on both branches
4. Create first PR from `feature/*` to `develop`
5. Verify staging deployment
6. Create release branch and test production flow

---

*Document Version: 1.0*
*Last Updated: 2026-11-12*