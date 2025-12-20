import { render, RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options })
}

/**
 * Helper to create FormData for testing server actions
 */
export function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

/**
 * Helper to create mock dates for testing
 */
export function mockDate(date: string | Date) {
  const mockNow = new Date(date)
  vi.setSystemTime(mockNow)
  return mockNow
}

/**
 * Helper to reset date mocks
 */
export function resetDateMock() {
  vi.useRealTimers()
}

// Re-export everything from Testing Library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
