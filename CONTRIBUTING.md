# Contributing Guide

Thank you for considering contributing to Stitch & Style Co! This document outlines the process for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Security](#security)

---

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@stitchstyle.co.

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB 7+ (local or Atlas)
- npm 10+
- Git

### Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/elvis/stitch-style-co.git
cd stitch-style-co

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd frontend-next && npm install && cd ..

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your local configuration

# 5. Seed database (optional)
npm run seed

# 6. Start development servers
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend-next && npm run dev
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Access token secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret (32+ chars) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook secret |
| `FRONTEND_URL` | Yes | Frontend URL for CORS |

---

## Development Workflow

### Branching Strategy

We follow the [GitFlow-inspired](BRANCHING.md) workflow:

1. **`main`** - Production releases
2. **`develop`** - Integration branch (staging)
3. **`feature/*`** - New features
4. **`bugfix/*`** - Bug fixes
5. **`hotfix/*`** - Critical production fixes
6. **`release/*`** - Release preparation

### Creating a Feature

```bash
# 1. Update develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/JIRA-123-short-description

# 3. Develop with atomic commits
git add .
git commit -m "feat(scope): description"

# 4. Push and create PR
git push origin feature/JIRA-123-short-description
# Create PR to develop
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `security`, `revert`

**Example:**
```
feat(auth): add refresh token rotation

Implements refresh token rotation with 15min access tokens
and 7-day refresh tokens stored in database.

Closes #123
```

---

## Coding Standards

### Backend (Node.js/Express)

- **ESLint**: Follow project config (`npm run lint`)
- **Style**: 2 spaces, semicolons, single quotes
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Async/Await**: Preferred over promises
- **Error Handling**: Use centralized error middleware

### Frontend (Next.js/TypeScript)

- **ESLint + Prettier**: Follow project config
- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **State**: React Context for global state
- **Styling**: Tailwind CSS utility classes

### General

- **File Organization**: Feature-based folders
- **Comments**: JSDoc for public APIs
- **No console.log**: Use proper logging

---

## Testing

### Backend

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

### Frontend

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Type check
npx tsc --noEmit
```

### Requirements

- **Unit Tests**: Minimum 80% coverage for new code
- **Integration Tests**: For API endpoints
- **E2E Tests**: Critical user flows (checkout, auth)

---

## Pull Request Process

### Before Submitting

1. **Sync with target branch**
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

2. **Run all checks locally**
   ```bash
   npm run lint
   npm test
   npm run typecheck  # frontend
   ```

3. **Update documentation** if needed

### PR Requirements

- [ ] Descriptive title following convention
- [ ] Clear description of changes
- [ ] Linked to issue (Closes #123)
- [ ] All CI checks pass
- [ ] At least 1 approval
- [ ] No merge conflicts
- [ ] No secrets in code (gitleaks)
- [ ] No high/critical vulnerabilities

### Review Guidelines

- Be constructive and respectful
- Focus on code, not person
- Suggest improvements, don't demand
- Approve when confident

---

## Reporting Issues

### Bug Reports

Use the bug report template. Include:

- **Environment**: OS, Node version, browser
- **Steps to reproduce**: Clear, numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What happens
- **Screenshots**: If applicable
- **Logs**: Relevant error messages

### Feature Requests

Use the feature request template. Include:

- **Problem**: What problem does this solve?
- **Solution**: Proposed approach
- **Alternatives**: Other approaches considered
- **Priority**: Low/Medium/High/Critical

### Security Issues

**DO NOT** create public issues for security vulnerabilities.

Report to: security@stitchstyle.co

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

---

## Security

### Responsible Disclosure

We take security seriously. Please report vulnerabilities privately.

### Security Practices

- All secrets in environment variables
- JWT tokens with short expiry + rotation
- Rate limiting on all endpoints
- Input validation with Zod
- Helmet.js for HTTP headers
- CORS configured per environment
- Regular dependency updates (Dependabot)

### Secret Management

- Never commit `.env` files
- Use GitHub Environments for secrets
- Rotate secrets quarterly
- Audit with `gitleaks` in CI

---

## Getting Help

- **Documentation**: Check README.md and docs/
- **Discord**: #stitch-style-dev
- **Email**: dev@stitchstyle.co

---

*Last updated: 2026-11-12*
*Version: 1.0*