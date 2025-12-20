# Quick Start Guide

**Last Updated**: December 18, 2025

---

## 🎯 Current Status

### ✅ Completed (Weeks 1-4)

- **Week 1**: Testing foundation (61 tests, ~60% coverage)
- **Week 2**: Component tests + Prettier (103 tests, 93.61% coverage)
- **Week 3**: Integration testing (125 tests total)
- **Week 4**: E2E testing with Playwright (155+ tests total)

### ⏳ Remaining Work

**Week 5 - Observability** (Not Started):
- [ ] Sentry error tracking
- [ ] Web Vitals monitoring
- [ ] Performance marks

**Week 6 - Developer Experience** (Not Started):
- [ ] Husky pre-commit hooks
- [ ] lint-staged
- [ ] commitlint (conventional commits)
- [ ] Local Docker dev environment

---

## 🧪 How to Run Tests

### Unit Tests (103 tests, 93.61% coverage)

```bash
# Run all unit tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode (auto-rerun on changes)
npm run test:watch

# Interactive UI mode
npm run test:ui

# Run specific test file
npm test entry-form.test.tsx
```

### Integration Tests (22 tests)

```bash
# 1. Start test database (PostgreSQL + pgvector)
npm run test:db:up

# 2. Wait ~10 seconds for database to initialize

# 3. Run integration tests
npm run test:integration

# 4. Watch mode
npm run test:integration:watch

# 5. View database logs (if needed)
npm run test:db:logs

# 6. Stop database when done
npm run test:db:down
```

**Note**: Integration tests require Docker to be running.

### E2E Tests (30+ tests, 5 browsers)

```bash
# First time only: Install browsers
npx playwright install

# Run all E2E tests (all browsers)
npm run test:e2e

# Interactive UI mode (best for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode with inspector
npm run test:e2e:debug

# View HTML report (after running tests)
npm run test:e2e:report

# Run specific browser only
npx playwright test --project=chromium
npx playwright test --project=firefox

# Run specific test file
npx playwright test entry-creation.spec.ts
```

### All Tests Together

```bash
# Unit tests
npm test

# Start DB → Integration tests → Stop DB
npm run test:db:up && npm run test:integration && npm run test:db:down

# E2E tests
npm run test:e2e
```

---

## 🔧 Code Quality Checks

```bash
# Format code
npm run format

# Check formatting (doesn't modify)
npm run format:check

# Lint code
npm run lint

# Type check
npx tsc --noEmit

# Build production
npm run build
```

---

## 📊 Test Breakdown

| Type | Count | What It Tests | Location |
|------|-------|---------------|----------|
| **Unit** | 103 | Components, actions | `src/**/__tests__/*.test.tsx` |
| **Integration** | 22 | Database, embeddings | `src/test/integration/*.test.ts` |
| **E2E** | 30+ | User flows, browsers | `e2e/*.spec.ts` |
| **Total** | **155+** | Everything | All levels |

---

## 🚀 Quick CI Check

Run what CI runs locally:

```bash
# Format check
npm run format:check

# Lint
npm run lint -- --max-warnings 0

# Type check
npx tsc --noEmit

# Unit tests with coverage
npm run test:coverage

# Build
npm run build
```

If all pass, your PR will pass CI! ✅

---

## 📚 Full Documentation

Detailed guides in `/user` folder:

**Milestones**:
- `MILESTONE-01-testing-foundation.md` - Week 1
- `MILESTONE-02-logging-and-ci.md` - Logging/CI
- `MILESTONE-03-complete-test-coverage.md` - Week 2
- `MILESTONE-04-integration-testing.md` - Week 3
- `MILESTONE-05-e2e-testing.md` - Week 4

**Guides**:
- `GUIDE-integration-testing.md` - Integration testing
- `SESSION-SUMMARY-FINAL.md` - Complete session summary

---

## 🐛 Troubleshooting

### Integration Tests Fail: "Database not running"

```bash
# Start the database
npm run test:db:up

# Check if it's running
docker ps | grep journal-test-db

# View logs
npm run test:db:logs

# Wait for "database system is ready to accept connections"
```

### E2E Tests Fail: "Browsers not installed"

```bash
# Install Playwright browsers
npx playwright install
```

### E2E Tests Fail: "Cannot connect to localhost:3000"

Make sure no other app is running on port 3000. Playwright will start the dev server automatically.

---

## ⚡ Pro Tips

**Fastest Development Flow**:
```bash
# Terminal 1: Watch unit tests
npm run test:watch

# Terminal 2: E2E UI mode
npm run test:e2e:ui

# Make changes, tests auto-rerun!
```

**Before Committing**:
```bash
# Quick check (< 30 seconds)
npm run format && npm test

# Full check (~ 2 minutes)
npm run format:check && npm run lint && npm test:coverage && npm run build
```

**Debugging Failed E2E Test**:
```bash
# Run in headed mode to see what's happening
npm run test:e2e:headed

# Or use debug mode with inspector
npm run test:e2e:debug -- entry-creation.spec.ts
```

---

## 📋 Next Steps Checklist

When you're ready to continue:

**Week 5 - Observability**:
1. [ ] Create Sentry account (free tier)
2. [ ] `npm install @sentry/nextjs`
3. [ ] Configure Sentry (client, server, edge)
4. [ ] Install web-vitals: `npm install web-vitals`
5. [ ] Create WebVitalsReporter component
6. [ ] Test error tracking in development

**Week 6 - Developer Experience**:
1. [ ] `npm install --save-dev husky lint-staged @commitlint/cli @commitlint/config-conventional`
2. [ ] Configure Husky hooks
3. [ ] Set up lint-staged
4. [ ] Configure commitlint
5. [ ] Create local Docker dev environment
6. [ ] Update documentation

---

## 🎉 Summary

**Current State**: 155+ tests passing, 93.61% coverage, multi-browser validation

**To Run Everything**:
1. `npm test` - Unit tests (instant)
2. `npm run test:db:up && npm run test:integration` - Integration (30s)
3. `npm run test:e2e` - E2E tests (2 min)

**All tests passing** = Ready to ship! 🚀
