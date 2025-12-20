# Milestone 2: Logging Infrastructure & CI/CD Pipeline

**Date**: December 18, 2025
**Status**: ✅ Complete
**Test Coverage**: 61 tests passing (all previous tests still passing)

---

## 🎯 What We Built

### 1. Structured Logging with Pino

Replaced all `console.log` and `console.error` calls with a professional, structured logging system that:
- **Logs as JSON** in production for easy parsing by log aggregators
- **Pretty prints** in development for developer-friendly output
- **Includes context** (error details, request info, etc.)
- **Auto-disables** in test environment to keep test output clean
- **Fast & lightweight** - minimal performance overhead

### 2. CI/CD Pipeline with GitHub Actions

Created automated quality gates that run on every pull request and push:
- ✅ ESLint validation (zero warnings)
- ✅ TypeScript type checking
- ✅ Unit tests with coverage
- ✅ Production build verification
- ✅ Codecov integration (optional, requires token)

---

## 📦 Dependencies Added

```json
{
  "dependencies": {
    "pino": "^10.1.0",
    "pino-pretty": "^13.1.3"
  }
}
```

---

## 🗂️ Files Created

### Logging Infrastructure

1. **`/src/lib/logger/config.ts`** - Logger configuration
   - Environment-specific settings
   - Pretty printing in development
   - JSON output in production
   - Auto-disable in tests

2. **`/src/lib/logger/index.ts`** - Main logger module
   - `logger` - Base logger instance
   - `createLogger(context)` - Create child logger with context
   - `logError(err, message, context)` - Log errors with context
   - `logInfo(message, context)` - Log info messages
   - `logWarn(message, context)` - Log warnings
   - `logDebug(message, context)` - Log debug messages

### CI/CD

3. **`/.github/workflows/ci.yml`** - GitHub Actions workflow
   - Parallel job execution for speed
   - ESLint, TypeScript, tests, build
   - Quality gate that requires all to pass
   - Codecov integration (optional)

### Files Modified

4. **`/src/lib/ai/embeddings.ts`** - Replaced console.error
   - Now logs Voyage AI errors with context (status, error details)
   - Logs with text length for debugging

5. **`/src/app/actions.ts`** - Replaced console.error
   - Logs embedding failures with entry context (title, content length, entry ID)
   - Separate messages for create vs update failures

6. **`/src/lib/supabase/queries.ts`** - Replaced console.error
   - Logs vector similarity errors with entry ID and error code

---

## 🔧 How to Use Logging

### Basic Usage

```typescript
import { logger, logError, logInfo } from '@/lib/logger'

// Simple info log
logInfo('User logged in', { userId: '123' })

// Error logging
try {
  await somethingRisky()
} catch (error) {
  logError(
    error instanceof Error ? error : new Error(String(error)),
    'Failed to process request',
    { userId: '123', action: 'checkout' }
  )
}

// Using the base logger directly
logger.info({ userId: '123', action: 'login' }, 'User logged in')
logger.error({ err, userId: '123' }, 'Authentication failed')
```

### Child Logger with Context

```typescript
import { createLogger } from '@/lib/logger'

// Create logger with persistent context
const requestLogger = createLogger({
  requestId: '550e8400-e29b-41d4-a716-446655440000',
  userId: 'user-123',
})

// All logs from this logger include the context
requestLogger.info('Processing payment')
requestLogger.error({ amount: 99.99 }, 'Payment failed')
```

### Development vs Production

**Development** (pretty output):
```
[05:10:23.456] INFO: User logged in
    userId: "123"
    email: "user@example.com"

[05:10:24.123] ERROR: Payment failed
    err: {
      "type": "Error",
      "message": "Insufficient funds",
      "stack": "Error: Insufficient funds\n  at..."
    }
    userId: "123"
    amount: 99.99
```

**Production** (JSON):
```json
{"level":"info","time":1734537023456,"msg":"User logged in","userId":"123","email":"user@example.com"}
{"level":"error","time":1734537024123,"err":{"type":"Error","message":"Insufficient funds","stack":"Error: Insufficient funds..."},"msg":"Payment failed","userId":"123","amount":99.99}
```

### Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| **error** | Exceptions, failed operations | API errors, database failures |
| **warn** | Unexpected but handled | Rate limit warnings, deprecated features |
| **info** | Important events | User actions, system events |
| **debug** | Detailed diagnostics | Function entry/exit, variable values |

**Setting log level**:
```bash
# In development
LOG_LEVEL=debug npm run dev

# In production (default: info)
LOG_LEVEL=warn npm start
```

---

## 🚀 How to Use CI/CD

### Automatic Triggers

The CI pipeline runs automatically on:
- Every **pull request** to `main`
- Every **push** to `main`

### What Gets Checked

1. **ESLint** - Code quality and style
   - Runs: `npm run lint -- --max-warnings 0`
   - Fails if: Any warnings or errors

2. **TypeScript** - Type safety
   - Runs: `tsc --noEmit`
   - Fails if: Any type errors

3. **Unit Tests** - Test coverage
   - Runs: `npm run test:coverage`
   - Fails if: Any test fails or coverage below thresholds

4. **Build** - Production build
   - Runs: `npm run build`
   - Fails if: Build errors

### GitHub Secrets Required

For full functionality, add these secrets to your GitHub repository:

| Secret | Required | Purpose |
|--------|----------|---------|
| `CODECOV_TOKEN` | No | Upload coverage to Codecov (free for open source) |

**Note**: The build uses dummy environment variables for CI. Real values should be in your deployment environment.

### Viewing Results

1. **In Pull Requests**:
   - See checkmarks ✅ or X's ❌ next to each job
   - Click "Details" to see logs

2. **In Actions Tab**:
   - View all workflow runs
   - Download artifacts (coverage reports, etc.)

### Local Testing Before Push

```bash
# Run all checks locally
npm run lint -- --max-warnings 0  # Linting
npx tsc --noEmit                  # Type check
npm run test:coverage             # Tests
npm run build                     # Build
```

---

## 🐛 Debugging Logs

### Viewing Logs in Development

Logs automatically appear in your terminal with pretty formatting:

```bash
npm run dev
```

### Viewing Logs in Production

Logs are written as JSON to stdout. Use any log aggregator:

**Option 1: View raw logs**
```bash
npm start | grep '"level":"error"'  # Filter errors only
```

**Option 2: Use jq for pretty JSON**
```bash
npm start | jq -r '.msg'  # Show just messages
npm start | jq 'select(.level == "error")'  # Filter errors
```

**Option 3: Send to log aggregator**
- **Datadog**: Pipe to Datadog agent
- **Cloudwatch**: Use AWS CloudWatch agent
- **Papertrail**: Configure syslog forwarding
- **Logtail**: Use HTTP destination

### Enabling Logs in Tests

By default, logs are disabled during tests. To enable:

```bash
ENABLE_LOGS=true npm test
```

### Common Log Patterns

**Finding errors for a specific user**:
```bash
grep '"userId":"user-123"' logs.json | grep '"level":"error"'
```

**Counting errors in last hour**:
```bash
tail -n 10000 logs.json | jq 'select(.level == "error")' | wc -l
```

**Viewing error types**:
```bash
grep '"level":"error"' logs.json | jq -r '.err.type' | sort | uniq -c
```

---

## 📊 Current Logging Coverage

All error paths now have structured logging:

| File | Error Type | Context Logged |
|------|------------|----------------|
| `embeddings.ts` | Voyage AI API errors | status, error details, text length |
| `embeddings.ts` | General embedding errors | text length |
| `actions.ts` | Embedding failure (create) | title, content length |
| `actions.ts` | Embedding failure (update) | entry ID, title, content length |
| `queries.ts` | Vector similarity errors | entry ID, limit, error code |

---

## 🎓 Best Practices

### DO ✅

```typescript
// Include context
logError(err, 'Failed to process payment', {
  userId,
  amount,
  paymentMethod
})

// Use structured data
logger.info({ userId, action: 'login', ip }, 'User authenticated')

// Log before throwing
logError(err, 'Database connection failed', { table: 'users' })
throw err
```

### DON'T ❌

```typescript
// Don't use console.log/error
console.error('Something failed')  // ❌

// Don't log sensitive data
logger.info({ password, creditCard })  // ❌

// Don't log in tight loops
for (const item of millionItems) {
  logger.debug('Processing item')  // ❌ Too many logs
}

// Don't swallow errors silently
try {
  await risky()
} catch (err) {
  // ❌ No logging!
}
```

### Sensitive Data

Never log:
- Passwords
- API keys / secrets
- Credit card numbers
- Social Security numbers
- Personal health information

Be careful with:
- Email addresses
- IP addresses (GDPR concerns)
- User names

---

## 🔍 CI/CD Troubleshooting

### Issue: "ESLint Failed"

**Solution**: Fix linting errors locally
```bash
npm run lint
# Fix reported issues, then:
npm run lint -- --max-warnings 0
```

### Issue: "TypeScript Failed"

**Solution**: Fix type errors
```bash
npx tsc --noEmit
# Fix reported type errors
```

### Issue: "Tests Failed"

**Solution**: Run tests locally
```bash
npm test
# Debug failing tests
npm test -- failing-test.test.ts
```

### Issue: "Build Failed with Env Var Error"

**Cause**: CI uses dummy env vars
**Solution**: This is expected for CI builds. Real values are in deployment.

### Issue: "Codecov Upload Failed"

**Cause**: Missing `CODECOV_TOKEN` secret
**Solution**:
1. Sign up at codecov.io
2. Get token for your repo
3. Add as GitHub secret
4. Or ignore - it's optional

---

## 📈 Next Steps

### Week 2 Remaining:
- [ ] Set up Codecov (optional)
- [ ] Configure branch protection rules on GitHub
- [ ] Add more component tests (EntryForm, EntryDetail)
- [ ] Increase test coverage to 70%+

### Week 3-4 (Integration & E2E Testing):
- [ ] Docker Compose for test database
- [ ] Integration tests with real PostgreSQL
- [ ] Playwright for E2E tests
- [ ] Visual regression tests
- [ ] Reach 80%+ coverage

### Week 5 (Observability):
- [ ] Sentry error tracking
- [ ] Web Vitals monitoring
- [ ] Performance marks for critical paths

### Week 6 (Developer Experience):
- [ ] Husky + lint-staged (pre-commit hooks)
- [ ] Prettier configuration
- [ ] Commitlint (conventional commits)
- [ ] Local Docker environment

---

## ✅ Verification Checklist

After implementing logging and CI:

- [ ] Run `npm run dev` - see pretty logs in terminal
- [ ] Trigger an error - see structured error log with context
- [ ] Run `npm test` - no logs appear (clean output)
- [ ] Run `ENABLE_LOGS=true npm test` - logs appear
- [ ] Push to GitHub - see CI workflow run
- [ ] Create PR - see CI checks appear
- [ ] All CI checks pass ✅

---

## 💡 Tips

### Logging Tips

1. **Add request IDs**: Track a request through your entire stack
2. **Use child loggers**: Maintain context without repetition
3. **Log before and after**: Log entry/exit of critical functions
4. **Include timing**: Add duration to understand performance
5. **Aggregate errors**: Group similar errors to avoid noise

### CI/CD Tips

1. **Run checks locally**: Don't wait for CI to find issues
2. **Small commits**: Easier to debug when CI fails
3. **Watch for patterns**: Repeated failures indicate systemic issues
4. **Cache dependencies**: CI uses `npm ci` with cache for speed
5. **Parallel jobs**: Jobs run in parallel for faster feedback

---

**Generated**: December 18, 2025
**Previous Milestone**: MILESTONE-01-testing-foundation.md
**Next**: Integration Testing & E2E
**Tool**: Claude Code
**Plan**: `/Users/imi/.claude/plans/starry-gliding-orbit.md`
