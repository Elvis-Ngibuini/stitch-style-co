# Branching Strategy

This document defines the branching model for the Stitch & Style Co project.

## Branch Types

### Main Branches (Protected)

| Branch | Purpose | Protection | Deployment |
|--------|---------|------------|------------|
| `main` | Production-ready code | Required PR, 1 review, status checks, signed commits | Manual to production |
| `develop` | Integration branch for staging | Required PR, 1 review, status checks | Auto to staging |

### Supporting Branches

| Branch | Naming Convention | Source | Target | Lifetime |
|--------|-------------------|--------|--------|----------|
| Feature | `feature/<ticket-id>-<short-description>` | `develop` | `develop` | Short (days-weeks) |
| Bugfix | `bugfix/<ticket-id>-<short-description>` | `develop` | `develop` | Short (hours-days) |
| Hotfix | `hotfix/<ticket-id>-<short-description>` | `main` | `main` + `develop` | Very short (hours) |
| Release | `release/v<major>.<minor>.<patch>` | `develop` | `main` + `develop` | Short (days) |
| Experiment | `experiment/<description>` | `develop` | `develop` (or discard) | Variable |

## Workflow

### Feature Development

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/JIRA-123-add-user-profile

# 3. Develop, commit, push
git add .
git commit -m "feat: add user profile page"
git push origin feature/JIRA-123-add-user-profile

# 4. Create PR to develop
# - Title: "feat: add user profile page"
# - Base: develop
# - Requires: 1 approval, all CI checks pass

# 5. After merge, delete branch
git branch -d feature/JIRA-123-add-user-profile
git push origin --delete feature/JIRA-123-add-user-profile
```

### Bug Fixes

```bash
# From develop
git checkout -b bugfix/JIRA-456-fix-cart-total

# Fix, test, commit
git commit -m "fix: correct cart total calculation"

# PR to develop
```

### Hotfixes (Production Issues)

```bash
# 1. Start from main
git checkout main
git pull origin main

# 2. Create hotfix branch
git checkout -b hotfix/JIRA-789-fix-payment-webhook

# 3. Fix, test, commit
git commit -m "fix: handle Stripe webhook idempotency"

# 4. PR to main (URGENT)
# - Requires: 1 approval, all CI checks pass

# 5. After merge to main, backport to develop
git checkout develop
git pull origin develop
git merge main --no-ff -m "chore: backport hotfix/JIRA-789"
git push origin develop
```

### Release Preparation

```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Update version, changelog
# - package.json version
# - CHANGELOG.md
# - Docker image tags

# 3. PR to main (release candidate)
# - Base: main
# - Title: "release: v1.2.0"

# 6. After merge to main:
# - Tag: git tag -a v1.2.0 -m "Release v1.2.0"
# - git push origin v1.2.0
# - Merge back to develop: git checkout develop && git merge main --no-ff
```

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons, etc. |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding missing tests |
| `chore` | Maintenance, build tasks, dependencies |
| `ci` | CI/CD changes |
| `security` | Security fixes |
| `revert` | Reverts a previous commit |

### Examples

```
feat(auth): add refresh token rotation
fix(cart): correct total calculation with coupons
docs: update API documentation for v2
refactor(products): extract variant selection logic
test(auth): add unit tests for login flow
chore(deps): update express to v4.18
ci: add gitleaks to security scan
security: rotate JWT secrets
```

### Scopes (Backend)

| Scope | Area |
|-------|------|
| `auth` | Authentication/Authorization |
| `products` | Product catalog |
| `cart` | Shopping cart |
| `orders` | Order processing |
| `payments` | Stripe integration |
| `users` | User management |
| `admin` | Admin panel |
| `db` | Database/migrations |

### Scopes (Frontend)

| Scope | Area |
|-------|------|
| `auth` | Auth pages/context |
| `cart` | Cart page/context |
| `checkout` | Checkout flow |
| `products` | Product pages |
| `ui` | Shared UI components |
| `admin` | Admin dashboard |

## Pull Request Requirements

### Required Checks (All Branches)

- [ ] All CI jobs pass (security, backend-test, frontend-test)
- [ ] Code review approved by at least 1 team member
- [ ] No merge conflicts
- [ ] Commit messages follow convention
- [ ] No secrets detected by gitleaks
- [ ] No high/critical vulnerabilities from npm audit

### Additional for `main`

- [ ] PR from `release/*` or `hotfix/*` branch
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] Manual approval from tech lead
- [ ] Signed commits (if configured)

### Additional for `develop`

- [ ] PR from `feature/*`, `bugfix/*`, or `release/*` branch
- [ ] No breaking changes without discussion

## Branch Protection Rules

### `main`
- Require PR before merging
- Require 1 approval
- Require status checks: `security`, `backend-test`, `frontend-test`, `backend-build`, `frontend-build`
- Require linear history (no merge commits except for releases/hotfixes)
- Require signed commits
- Restrict pushes to admins only
- Require conversation resolution before merging

### `develop`
- Require PR before merging
- Require 1 approval
- Require status checks: `security`, `backend-test`, `frontend-test`
- Allow merge commits (for feature integration)
- Restrict pushes to admins only

## Naming Conventions

### Branch Names
- Lowercase only
- Hyphens as separators
- Ticket ID prefix when applicable: `feature/JIRA-123-description`
- Descriptive but concise: `feature/add-user-wishlist` not `feature/add-wishlist-functionality-to-user-profile-page`

### Tag Names
- Semantic versioning: `v<major>.<minor>.<patch>`
- Pre-release: `v1.2.0-rc.1`, `v1.2.0-beta.2`
- Hotfix: `v1.2.1` (patch increment)

## Merge Strategies

| Source → Target | Strategy | Reason |
|-----------------|----------|--------|
| `feature/*` → `develop` | Squash and merge | Clean history, single commit per feature |
| `bugfix/*` → `develop` | Squash and merge | Clean history |
| `release/*` → `main` | Merge commit (--no-ff) | Preserve release context |
| `release/*` → `develop` | Merge commit (--no-ff) | Backport release changes |
| `hotfix/*` → `main` | Merge commit (--no-ff) | Preserve hotfix context |
| `main` → `develop` (backport) | Merge commit (--no-ff) | Sync production fixes |

## Cleanup Policy

- Feature/bugfix branches: Delete after merge (auto-delete on GitHub)
- Release branches: Keep until next release, then delete
- Hotfix branches: Delete after backport to develop
- Stale branches (>30 days no activity): Auto-delete via GitHub settings

## Emergency Procedures

### Hotfix Without PR (Extreme Cases Only)
```bash
# ONLY with explicit tech lead approval
git checkout main
git cherry-pick <commit-hash>
git push origin main
# Then create PR for backport to develop
```

### Revert a Merge
```bash
# Revert merge commit
git revert -m 1 <merge-commit-hash>
git push origin develop
```

## Tools & Automation

- **GitHub Branch Protection**: Enforced via repository settings
- **Dependabot**: Weekly dependency updates (see `.github/dependabot.yml`)
- **CI/CD**: GitHub Actions (see `.github/workflows/`)
- **Commit Linting**: Consider adding `commitlint` to CI
- **Branch Cleanup**: GitHub auto-delete merged branches + manual cleanup monthly

---

*Last updated: 2026-11-12*
*Version: 1.0*