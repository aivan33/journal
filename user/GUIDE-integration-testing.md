# Integration Testing Guide

**Status**: 🚧 Ready for Use
**Database**: PostgreSQL with pgvector
**Test Runner**: Vitest
**Created**: December 18, 2025

---

## 📚 Overview

Integration tests validate that components work correctly with **real external dependencies** like PostgreSQL, rather than mocks. These tests ensure:

✅ Database schema is correct
✅ Queries work as expected
✅ Vector embeddings store and retrieve properly
✅ Relationships between tables function correctly
✅ Database constraints are enforced

---

## 🐳 Test Database Setup

### Quick Start

```bash
# Start the test database
npm run test:db:up

# Wait for database to be ready (~5-10 seconds)
# Check logs to confirm
npm run test:db:logs

# Run integration tests
npm run test:integration

# When done, stop and clean up
npm run test:db:down
```

### Test Database Configuration

**Docker Compose**: `docker-compose.test.yml`
- **Image**: `ankane/pgvector:latest` (PostgreSQL + pgvector extension)
- **Port**: `5433` (to avoid conflicts with local PostgreSQL on 5432)
- **User**: `journal_test`
- **Password**: `test_password`
- **Database**: `journal_test`

**Environment Variables** (optional):
```bash
# .env.test (create if needed)
TEST_SUPABASE_URL=http://localhost:54321
TEST_SUPABASE_ANON_KEY=test-anon-key
```

---

## 🗂️ File Structure

```
/
├── docker-compose.test.yml         # Test database configuration
├── vitest.integration.config.ts    # Integration test configuration
├── supabase/
│   ├── migrations/                 # Database migrations (auto-run on startup)
│   └── test-seed.sql               # Test seed data
└── src/test/integration/
    ├── setup.ts                    # Test setup and helpers
    ├── entries.test.ts             # Entry CRUD integration tests
    ├── tasks.test.ts               # Task CRUD integration tests (TODO)
    └── embeddings.test.ts          # Vector search integration tests (TODO)
```

---

## 🧪 Writing Integration Tests

### Basic Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { getTestClient, createTestEntry, clearDatabase } from './setup'

describe('Feature Integration Tests', () => {
  beforeEach(async () => {
    // Clean database before each test for isolation
    await clearDatabase()
  })

  it('performs database operation', async () => {
    const client = getTestClient()

    // Create test data
    const entry = await createTestEntry({
      title: 'Test Entry',
      content: 'Test Content',
    })

    // Perform operation
    const { data, error } = await client
      .from('entries')
      .select('*')
      .eq('id', entry.id)
      .single()

    // Assert results
    expect(error).toBeNull()
    expect(data?.title).toBe('Test Entry')
  })
})
```

### Helper Functions

The `setup.ts` file provides several helper functions:

**getTestClient()**
```typescript
const client = getTestClient()
// Returns authenticated Supabase client for test database
```

**clearDatabase()**
```typescript
await clearDatabase()
// Deletes all data from entries and tasks tables
```

**createTestEntry()**
```typescript
const entry = await createTestEntry({
  title: 'My Entry',
  content: 'Entry content',
  embedding: [0.1, 0.2, ...], // Optional
})
// Creates and returns an entry in the test database
```

**createTestTask()**
```typescript
const task = await createTestTask({
  content: 'My Task',
  entry_id: 'entry-uuid',
  completed: false,
  due_date: '2025-12-20',
})
// Creates and returns a task in the test database
```

---

## 📝 Example Integration Tests

### Test: Create Entry

```typescript
it('creates an entry with title and content', async () => {
  const client = getTestClient()

  const { data, error } = await client
    .from('entries')
    .insert({
      title: 'Integration Test Entry',
      content: 'This is created by an integration test',
    })
    .select()
    .single()

  expect(error).toBeNull()
  expect(data).toBeDefined()
  expect(data?.title).toBe('Integration Test Entry')
  expect(data?.id).toBeDefined()
  expect(data?.created_at).toBeDefined()
})
```

### Test: Vector Similarity Search

```typescript
it('finds similar entries using vector similarity', async () => {
  const client = getTestClient()

  // Create test embeddings (1024 dimensions for voyage-3)
  const embedding1 = Array.from({ length: 1024 }, () => 0.5)
  const embedding2 = Array.from({ length: 1024 }, () => 0.5)
  const embedding3 = Array.from({ length: 1024 }, () => 0.9)

  // Create entries with similar embeddings
  const entry1 = await createTestEntry({
    title: 'AI Article',
    content: 'About machine learning',
    embedding: embedding1,
  })

  await createTestEntry({
    title: 'ML Article',
    content: 'About neural networks',
    embedding: embedding2, // Similar to embedding1
  })

  await createTestEntry({
    title: 'Cooking Recipe',
    content: 'How to make pasta',
    embedding: embedding3, // Different from embedding1
  })

  // Search for similar entries
  const { data, error } = await client.rpc('match_entries', {
    query_embedding: embedding1,
    match_threshold: 0.1,
    match_count: 5,
    exclude_id: entry1.id,
  })

  expect(error).toBeNull()
  expect(data.length).toBeGreaterThan(0)
  // First result should be the similar AI/ML article
  expect(data[0].title).toContain('ML')
})
```

### Test: Database Constraints

```typescript
it('requires title field', async () => {
  const client = getTestClient()

  const { data, error } = await client
    .from('entries')
    .insert({
      content: 'Content without title',
    })
    .select()
    .single()

  expect(error).toBeDefined()
  expect(error?.message).toContain('title')
  expect(data).toBeNull()
})
```

---

## ⚙️ Configuration

### Vitest Integration Config

**File**: `vitest.integration.config.ts`

```typescript
export default defineConfig({
  test: {
    name: 'integration',
    environment: 'node',          // Node environment (not jsdom)
    setupFiles: ['./src/test/integration/setup.ts'],
    testTimeout: 30000,            // 30s for database operations
    include: ['src/test/integration/**/*.test.ts'],
  },
})
```

### Test Database Initialization

The test database automatically runs migrations on startup:

1. Docker starts PostgreSQL with pgvector
2. Migrations from `/supabase/migrations/` are executed
3. Tables (`entries`, `tasks`) are created
4. RPC functions (`match_entries`) are created
5. Test seed data can be loaded manually or per-test

---

## 🔄 Test Lifecycle

### Setup (beforeAll)
- Check Docker container is running
- Create Supabase client
- Wait for database to be ready
- Verify basic connectivity

### Before Each Test (beforeEach)
- Load seed data for consistent state
- Or call `clearDatabase()` for clean slate

### Test Execution
- Run database operations
- Assert results
- Test passes or fails

### Cleanup (afterAll)
- Database container continues running
- Developer manually stops with `npm run test:db:down`

---

## 🚀 Running Integration Tests

### Commands

```bash
# Start test database
npm run test:db:up

# Run all integration tests (one-time)
npm run test:integration

# Run integration tests in watch mode
npm run test:integration:watch

# View database logs
npm run test:db:logs

# Stop test database and delete data
npm run test:db:down
```

### Watch Specific Tests

```bash
# Watch specific test file
npm run test:integration:watch -- entries.test.ts
```

---

## 🐛 Troubleshooting

### Error: "Test database container is not running!"

**Solution**:
```bash
# Start the database
npm run test:db:up

# Wait ~10 seconds, then retry tests
npm run test:integration
```

### Error: "Connection timeout"

**Cause**: Database not fully initialized

**Solution**:
```bash
# Check database logs
npm run test:db:logs

# Look for "database system is ready to accept connections"
# Once ready, retry tests
```

### Error: "Failed to seed test data"

**Cause**: Seed SQL file has syntax errors or missing migrations

**Solution**:
```bash
# Check seed file syntax
cat supabase/test-seed.sql

# Restart database with fresh state
npm run test:db:down
npm run test:db:up

# Check logs for errors
npm run test:db:logs
```

### Error: "Port 5433 already in use"

**Cause**: Previous test database still running

**Solution**:
```bash
# Stop existing container
docker stop journal-test-db
docker rm journal-test-db

# Start fresh
npm run test:db:up
```

### Tests are slow

**Optimization**:
```typescript
// Use transactions for faster cleanup
beforeEach(async () => {
  const client = getTestClient()

  // Delete only, don't re-seed unless needed
  await client.from('tasks').delete().neq('id', '00000000')
  await client.from('entries').delete().neq('id', '00000000')
})
```

---

## 📊 Coverage

Integration tests are tracked separately from unit tests:

```bash
# Run integration tests with coverage
npm run test:integration -- --coverage

# Coverage report will include:
# - src/lib/supabase/queries.ts
# - src/app/actions.ts (database interactions)
# - Database schema validation
```

---

## 🎯 What to Test

### ✅ DO Test in Integration Tests

- **Database operations**: INSERT, UPDATE, DELETE, SELECT
- **Data validation**: NOT NULL constraints, foreign keys
- **Vector operations**: Embedding storage, similarity search
- **RPC functions**: Custom database functions
- **Transactions**: Multi-step operations
- **Relationships**: Entry-task associations
- **Real embeddings**: Generate with actual Voyage AI (optional)

### ❌ DON'T Test in Integration Tests

- **UI components**: Use unit tests with React Testing Library
- **Pure functions**: Use unit tests
- **Mocked data**: Integration tests use real database
- **Authentication**: Test with auth integration tests (separate)

---

##  Next Steps

### Week 3 Tasks

- [ ] Create `tasks.test.ts` for task CRUD operations
- [ ] Create `embeddings.test.ts` for vector search
- [ ] Test task extraction from `[bracket]` syntax
- [ ] Test overdue task queries
- [ ] Test archived task filtering

### Week 4 Tasks

- [ ] Add integration tests to CI pipeline
- [ ] Test database migrations
- [ ] Test data consistency across operations
- [ ] Performance benchmarks (vector search speed)

---

## 📚 References

- **Docker Compose Docs**: https://docs.docker.com/compose/
- **pgvector**: https://github.com/pgvector/pgvector
- **Vitest**: https://vitest.dev/guide/
- **Supabase JS Client**: https://supabase.com/docs/reference/javascript

---

**Last Updated**: December 18, 2025
**Status**: Ready for use - database and example tests created
**Next**: Write additional integration test files
