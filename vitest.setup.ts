import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Create mock router functions that can be accessed
const mockRouterFunctions = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
}

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouterFunctions,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  router: mockRouterFunctions, // Export router for test access
}))

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))
