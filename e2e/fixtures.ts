import { test as base, expect } from '@playwright/test'

/**
 * Custom fixtures for E2E tests
 *
 * Provides common utilities and setup for all E2E tests.
 */

type CustomFixtures = {
  // Add custom fixtures here as needed
  // Example: authenticatedPage, mockApiResponses, etc.
}

export const test = base.extend<CustomFixtures>({
  // Define custom fixtures here
})

export { expect }

/**
 * Helper functions for E2E tests
 */

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: any) {
  await page.waitForLoadState('networkidle')
}

/**
 * Fill in entry form and submit
 */
export async function createEntry(page: any, title: string, content: string) {
  await page.getByLabel('Title').fill(title)
  await page.getByLabel(/Content/).fill(content)
  await page.getByRole('button', { name: 'Add Entry' }).click()
}

/**
 * Fill in todo form and submit
 */
export async function createTodo(page: any, content: string, dueDate?: string) {
  await page.getByLabel('Task').fill(content)

  if (dueDate) {
    await page.getByLabel('Due Date').fill(dueDate)
  }

  await page.getByRole('button', { name: 'Add Todo' }).click()
}

/**
 * Check if element is visible on page
 */
export async function isVisible(page: any, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 5000 })
    return true
  } catch {
    return false
  }
}
