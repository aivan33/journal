# Milestone 1: Testing Foundation Setup

**Date**: December 18, 2025
**Status**: ✅ Complete
**Test Coverage**: 30 passing tests across 3 component test files

---

## 🎯 What We Built

A comprehensive testing infrastructure for the journal application using Vitest, React Testing Library, and proper mocking strategies. This foundation enables:

- **Fast unit testing** (10x faster than Jest)
- **Component testing** with user interaction simulation
- **Server action testing** with mocked dependencies
- **Code coverage tracking** with 80% thresholds
- **CI/CD ready** configuration

---

## 📦 Installed Dependencies

```json
{
  "devDependencies": {
    "vitest": "^4.0.16",
    "@vitejs/plugin-react": "^5.1.2",
    "@testing-library/react": "^16.3.1",
    "@testing-library/user-event": "^14.6.1",
    "@testing-library/jest-dom": "^6.9.1",
    "jsdom": "^27.3.0",
    "@vitest/coverage-v8": "^4.0.16"
  }
}
```

---

## 🗂️ Files Created

### Configuration Files

1. **`vitest.config.ts`** - Main Vitest configuration
   - Sets up jsdom environment for React components
   - Configures path aliases (`@/*` → `./src/*`)
   - Sets coverage thresholds (80% lines, functions, statements; 75% branches)
   - Excludes build artifacts and test utilities from coverage

2. **`vitest.setup.ts`** - Global test setup
   - Imports jest-dom matchers for better assertions
   - Mocks Next.js `useRouter`, `usePathname`, `useSearchParams`
   - Mocks Next.js cache functions (`revalidatePath`, `revalidateTag`)
   - Cleans up after each test automatically

### Test Utilities

3. **`/src/test/utils/test-helpers.tsx`** - Reusable test helpers
   - `renderWithProviders()` - Custom render function for React components
   - `createFormData()` - Helper to create FormData for server action tests
   - `mockDate()` / `resetDateMock()` - Date mocking utilities
   - Re-exports all Testing Library functions

4. **`/src/test/utils/mock-supabase.ts`** - Supabase mocking utilities
   - `createMockSupabaseClient()` - Complete mocked Supabase client
   - `mockSuccessfulQuery()` / `mockFailedQuery()` - Query result helpers
   - `mockCreateClient()` - Mock factory for server-side client

5. **`/src/test/utils/mock-voyage.ts`** - Voyage AI mocking utilities
   - `createMockEmbedding()` - Generate mock 1024-dim embedding vectors
   - `mockVoyageSuccess()` / `mockVoyageFail()` - API response mocks
   - `mockVoyageFetch()` - Fetch mock for embedding API calls

### Component Tests

6. **`/src/components/__tests__/auto-textarea.test.tsx`** (6 tests)
   - Rendering with default props
   - minRows calculation and styling
   - Value and onChange handling
   - HTML attribute pass-through
   - Custom styles preservation

7. **`/src/components/__tests__/todo-form.test.tsx`** (10 tests)
   - Form rendering and field presence
   - Submission with content only
   - Submission with content and due date
   - Error display on failure
   - Form reset on success
   - Input state management after submission
   - Router.refresh() integration
   - Error clearing on new submission

8. **`/src/components/__tests__/todo-list.test.tsx`** (14 tests)
   - Todo rendering and empty state
   - Checkbox states (checked/unchecked)
   - Completed todo styling (line-through)
   - Due date display
   - Overdue highlighting (red text)
   - Entry link rendering
   - **Optimistic updates** for toggling completion
   - **Optimistic updates** for archiving
   - **Rollback on failure** for both operations
   - Multiple rapid interactions

### Package.json Scripts

9. **Updated `package.json`** with test scripts:
   ```json
   {
     "test": "vitest",
     "test:ui": "vitest --ui",
     "test:coverage": "vitest run --coverage",
     "test:watch": "vitest --watch"
   }
   ```

---

## 🧪 How to Run Tests

### Run all tests once
```bash
npm test -- --run
```

### Run tests in watch mode
```bash
npm test
# or
npm run test:watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- auto-textarea.test.tsx
```

### Run tests matching pattern
```bash
npm test -- --grep "TodoForm"
```

---

## 📊 Current Test Coverage

**Total Tests**: 30 passing

| Component | Tests | Coverage Focus |
|-----------|-------|----------------|
| **AutoTextarea** | 6 | Props, styling, user input |
| **TodoForm** | 10 | Form submission, validation, router integration |
| **TodoList** | 14 | Optimistic updates, error handling, UI states |

### What's NOT Tested Yet
- EntryForm component
- EntryDetail component
- Markdown component
- Server actions (`/src/app/actions.ts`)
- Server actions (`/src/app/todo/actions.ts`)
- Integration with real database
- E2E user flows

---

## 🔍 How to Review Tests

### 1. Understanding Test Structure

All tests follow this pattern:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils/test-helpers'
import userEvent from '@testing-library/user-event'
import { ComponentToTest } from '../component-to-test'
import * as dependencies from '@/path/to/dependencies'

// Mock external dependencies
vi.mock('@/path/to/dependencies')

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks() // Clear mock call history before each test
  })

  it('does something specific', async () => {
    // 1. Arrange: Set up mocks and data
    const mockFn = vi.mocked(dependencies.someFunction)
    mockFn.mockResolvedValue({ success: true })

    // 2. Act: Render component and simulate user interactions
    const user = userEvent.setup()
    render(<ComponentToTest />)
    await user.click(screen.getByRole('button'))

    // 3. Assert: Verify expected behavior
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalled()
    })
    expect(screen.getByText('Success')).toBeInTheDocument()
  })
})
```

### 2. Reading Test Output

**Success**:
```
✓ src/components/__tests__/todo-form.test.tsx (10 tests) 447ms
```

**Failure**:
```
❯ src/components/__tests__/todo-form.test.tsx > TodoForm > submits form
  Error: expect(element).toBeInTheDocument()

  Expected element to be in the document but it was not found.
```

### 3. Debugging Failed Tests

**Run single test file**:
```bash
npm test -- todo-form.test.tsx
```

**Add debug output**:
```typescript
import { screen } from '@/test/utils/test-helpers'

// See current DOM state
screen.debug()

// See specific element
screen.debug(screen.getByRole('button'))
```

**Add console logs**:
```typescript
it('test name', () => {
  render(<Component />)
  console.log('Current state:', someValue)
})
```

---

## 🎓 Testing Patterns and Best Practices

### Pattern 1: Mocking Server Actions

```typescript
import * as todoActions from '@/app/todo/actions'

vi.mock('@/app/todo/actions')

// In your test:
const mockAddTodo = vi.mocked(todoActions.addTodo)
mockAddTodo.mockResolvedValue({ success: true })
```

### Pattern 2: Testing User Interactions

```typescript
const user = userEvent.setup()

// Type in an input
await user.type(screen.getByLabelText('Todo'), 'Buy milk')

// Click a button
await user.click(screen.getByRole('button', { name: 'Submit' }))

// Select a checkbox
await user.click(screen.getByRole('checkbox'))
```

### Pattern 3: Testing Async Behavior

```typescript
// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})

// Or wait for function to be called
await waitFor(() => {
  expect(mockFunction).toHaveBeenCalled()
})
```

### Pattern 4: Testing Optimistic Updates

```typescript
// 1. Set up mock to resolve slowly
mockToggleTodo.mockResolvedValue({ success: true })

// 2. Perform action
await user.click(checkbox)

// 3. Verify immediate (optimistic) update
expect(checkbox).toBeChecked()

// 4. Verify server call happened
await waitFor(() => {
  expect(mockToggleTodo).toHaveBeenCalledWith('todo-id', true)
})
```

### Pattern 5: Testing Error Handling

```typescript
// Mock failure
mockAddTodo.mockResolvedValue({ error: 'Database error' })

// Perform action
await user.click(submitButton)

// Verify error is displayed
await waitFor(() => {
  expect(screen.getByText('Database error')).toBeInTheDocument()
})
```

---

## 🐛 Common Issues and Solutions

### Issue 1: "Cannot find module"
**Problem**: Import path incorrect or alias not configured
**Solution**: Check `vitest.config.ts` path aliases match `tsconfig.json`

```typescript
// vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Issue 2: "useRouter is not a function"
**Problem**: Next.js router not mocked
**Solution**: Already handled in `vitest.setup.ts`, but if you see this:

```typescript
// In your test file
const navigation = await import('next/navigation')
const mockRouter = navigation.useRouter()
```

### Issue 3: "Element not found"
**Problem**: Element not rendered or selector is wrong
**Solution**: Use `screen.debug()` to see actual DOM

```typescript
render(<Component />)
screen.debug() // Prints entire DOM
```

### Issue 4: "Test times out waiting for element"
**Problem**: Async operation not completing
**Solution**: Check if mock is configured correctly

```typescript
// Make sure mock returns a resolved promise
mockFn.mockResolvedValue({ success: true })
// NOT mockFn.mockReturnValue({ success: true })
```

### Issue 5: "Multiple elements with same text"
**Problem**: Using `getByText` when multiple elements have same text
**Solution**: Use more specific queries

```typescript
// Instead of:
screen.getByText('Submit')

// Use:
screen.getByRole('button', { name: 'Submit' })
// or
screen.getByRole('heading', { name: 'Submit' })
```

---

## 📝 How to Add New Tests

### Step 1: Create test file
```bash
touch src/components/__tests__/my-component.test.tsx
```

### Step 2: Set up test structure
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-helpers'
import { MyComponent } from '../my-component'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Step 3: Run tests
```bash
npm test -- my-component.test.tsx
```

### Step 4: Add more test cases
Focus on:
- **User interactions** (clicks, typing, form submission)
- **Edge cases** (empty states, errors, loading states)
- **Integration points** (API calls, router navigation)

---

## 🚀 Next Steps

### Immediate (Week 1 remaining):
- [ ] Write tests for `EntryForm` component
- [ ] Write tests for `EntryDetail` component
- [ ] Write tests for `Markdown` component
- [ ] Write tests for server actions in `/src/app/actions.ts`
- [ ] Write tests for server actions in `/src/app/todo/actions.ts`
- [ ] Implement Pino logging infrastructure
- [ ] Create basic CI/CD workflow with GitHub Actions

### Week 2-4:
- [ ] Integration tests with real database (Docker + PostgreSQL)
- [ ] E2E tests with Playwright
- [ ] Visual regression tests
- [ ] Reach 80%+ code coverage

### Week 5-6:
- [ ] Sentry error tracking
- [ ] Web Vitals monitoring
- [ ] Pre-commit hooks (Husky + lint-staged)
- [ ] Prettier configuration

---

## 💡 Tips for Developers

### Writing Good Tests

1. **Test behavior, not implementation**
   - ✅ "User can submit form with valid data"
   - ❌ "Component state updates when handleSubmit is called"

2. **Use Testing Library queries in this order**:
   1. `getByRole` (best - accessible)
   2. `getByLabelText` (good for forms)
   3. `getByPlaceholderText` (okay)
   4. `getByText` (okay, but can be brittle)
   5. `getByTestId` (last resort)

3. **Keep tests isolated**
   - Each test should be independent
   - Use `beforeEach` to reset state
   - Don't rely on test execution order

4. **Test the unhappy path**
   - Error states
   - Network failures
   - Edge cases (empty data, max limits)

5. **Make tests readable**
   - Use descriptive test names
   - Follow Arrange-Act-Assert pattern
   - Add comments for complex setups

### Maintaining Tests

- **Update tests when features change** - Failing tests might indicate outdated tests, not broken code
- **Refactor duplicated test code** - Extract common setup to helpers
- **Review coverage reports** - Run `npm run test:coverage` regularly
- **Fix flaky tests immediately** - Unreliable tests are worse than no tests

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## ✅ Checklist: Is Your Test Good?

- [ ] Test name describes expected behavior
- [ ] Test is independent (doesn't rely on other tests)
- [ ] Uses accessible queries (`getByRole`, `getByLabelText`)
- [ ] Tests user-facing behavior, not implementation details
- [ ] Handles async operations with `waitFor`
- [ ] Mocks external dependencies
- [ ] Has clear assertions with good error messages
- [ ] Runs quickly (< 100ms for unit tests)

---

**Generated**: December 18, 2025
**Tool**: Claude Code
**Plan**: `/Users/imi/.claude/plans/starry-gliding-orbit.md`
