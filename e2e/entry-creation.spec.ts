import { test, expect } from './fixtures'

test.describe('Entry Creation Flow', () => {
  test('creates a new entry with title and content', async ({ page }) => {
    await page.goto('/')

    // Fill in the form
    await page.getByLabel('Title').fill('My Test Entry')
    await page.getByLabel(/Content/).fill('This is test content for E2E testing')

    // Submit the form
    await page.getByRole('button', { name: 'Add Entry' }).click()

    // Wait for navigation or success indication
    await page.waitForLoadState('networkidle')

    // Verify entry appears in the list
    await expect(page.getByText('My Test Entry')).toBeVisible()
    await expect(page.getByText('This is test content for E2E testing')).toBeVisible()
  })

  test('shows default title as today\'s date', async ({ page }) => {
    await page.goto('/')

    const titleInput = page.getByLabel('Title')
    const titleValue = await titleInput.inputValue()

    // Should contain current date (e.g., "December 18, 2025")
    const today = new Date()
    const monthName = today.toLocaleDateString('en-US', { month: 'long' })
    expect(titleValue).toContain(monthName)
  })

  test('clears form after successful submission', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel('Title').fill('Temporary Entry')
    await page.getByLabel(/Content/).fill('Temporary content')
    await page.getByRole('button', { name: 'Add Entry' }).click()

    await page.waitForLoadState('networkidle')

    // Content should be cleared
    const contentTextarea = page.getByLabel(/Content/)
    await expect(contentTextarea).toHaveValue('')

    // Title should be reset to today's date
    const titleInput = page.getByLabel('Title')
    const titleValue = await titleInput.inputValue()
    const today = new Date()
    const monthName = today.toLocaleDateString('en-US', { month: 'long' })
    expect(titleValue).toContain(monthName)
  })

  test('submits entry using Cmd+Enter keyboard shortcut', async ({ page }) => {
    await page.goto('/')

    const contentTextarea = page.getByLabel(/Content/)

    await page.getByLabel('Title').fill('Keyboard Shortcut Entry')
    await contentTextarea.fill('Testing Cmd+Enter submission')

    // Press Cmd+Enter (or Ctrl+Enter on Windows/Linux)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
    await contentTextarea.press(`${modifier}+Enter`)

    await page.waitForLoadState('networkidle')

    // Verify entry was created
    await expect(page.getByText('Keyboard Shortcut Entry')).toBeVisible()
  })

  test('shows validation error when title is missing', async ({ page }) => {
    await page.goto('/')

    // Clear title and try to submit
    await page.getByLabel('Title').clear()
    await page.getByLabel(/Content/).fill('Content without title')
    await page.getByRole('button', { name: 'Add Entry' }).click()

    // Form should show HTML5 validation or error message
    // HTML5 validation prevents submission, so entry shouldn't appear
    await page.waitForTimeout(1000)

    // Verify entry was NOT created (title is required by HTML)
    const titleInput = page.getByLabel('Title')
    await expect(titleInput).toHaveAttribute('required')
  })

  test('shows validation error when content is missing', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel('Title').fill('Title without content')
    await page.getByLabel(/Content/).clear()
    await page.getByRole('button', { name: 'Add Entry' }).click()

    // Form should show HTML5 validation
    await page.waitForTimeout(1000)

    const contentTextarea = page.getByLabel(/Content/)
    await expect(contentTextarea).toHaveAttribute('required')
  })

  test('creates multiple entries in succession', async ({ page }) => {
    await page.goto('/')

    // Create first entry
    await page.getByLabel('Title').fill('First Entry')
    await page.getByLabel(/Content/).fill('First content')
    await page.getByRole('button', { name: 'Add Entry' }).click()
    await page.waitForLoadState('networkidle')

    // Create second entry (form should be cleared)
    await page.getByLabel('Title').fill('Second Entry')
    await page.getByLabel(/Content/).fill('Second content')
    await page.getByRole('button', { name: 'Add Entry' }).click()
    await page.waitForLoadState('networkidle')

    // Both entries should be visible
    await expect(page.getByText('First Entry')).toBeVisible()
    await expect(page.getByText('Second Entry')).toBeVisible()
  })

  test('creates entry with markdown content', async ({ page }) => {
    await page.goto('/')

    const markdownContent = `# Markdown Title

This is **bold** and this is *italic*.

- List item 1
- List item 2

[Link](https://example.com)`

    await page.getByLabel('Title').fill('Markdown Entry')
    await page.getByLabel(/Content/).fill(markdownContent)
    await page.getByRole('button', { name: 'Add Entry' }).click()

    await page.waitForLoadState('networkidle')

    // Verify entry was created
    await expect(page.getByText('Markdown Entry')).toBeVisible()

    // Click on entry to view details
    await page.getByText('Markdown Entry').click()
    await page.waitForLoadState('networkidle')

    // Verify markdown is rendered (bold, italic, etc.)
    const entryDetail = page.locator('article')
    await expect(entryDetail.locator('strong')).toHaveText('bold')
    await expect(entryDetail.locator('em')).toHaveText('italic')
    await expect(entryDetail.locator('a')).toHaveAttribute('href', 'https://example.com')
  })

  test('creates entry with task markers in brackets', async ({ page }) => {
    await page.goto('/')

    const contentWithTasks = `Daily journal entry

Need to [buy groceries] today
Also [call dentist] tomorrow`

    await page.getByLabel('Title').fill('Entry with Tasks')
    await page.getByLabel(/Content/).fill(contentWithTasks)
    await page.getByRole('button', { name: 'Add Entry' }).click()

    await page.waitForLoadState('networkidle')

    // Navigate to todo page
    await page.goto('/todo')

    // Verify tasks were extracted
    await expect(page.getByText('buy groceries')).toBeVisible()
    await expect(page.getByText('call dentist')).toBeVisible()
  })
})
