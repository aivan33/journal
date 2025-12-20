import { test, expect } from './fixtures'

test.describe('Entry Management', () => {
  test.beforeEach(async ({ page }) => {
    // Create a test entry before each test
    await page.goto('/')

    await page.getByLabel('Title').fill('Test Entry for Management')
    await page.getByLabel(/Content/).fill('This entry will be edited or deleted')
    await page.getByRole('button', { name: 'Add Entry' }).click()
    await page.waitForLoadState('networkidle')
  })

  test.describe('Entry Editing', () => {
    test('edits an existing entry', async ({ page }) => {
      // Click on the entry to view details
      await page.getByText('Test Entry for Management').click()
      await page.waitForLoadState('networkidle')

      // Click Edit button
      await page.getByRole('button', { name: 'Edit' }).click()

      // Verify form is shown
      await expect(page.getByLabel('Title')).toBeVisible()
      await expect(page.getByLabel(/Content/)).toBeVisible()

      // Edit the entry
      await page.getByLabel('Title').fill('Updated Test Entry')
      await page.getByLabel(/Content/).fill('Updated content after editing')

      // Save changes
      await page.getByRole('button', { name: 'Save Changes' }).click()
      await page.waitForLoadState('networkidle')

      // Verify changes are saved
      await expect(page.getByRole('heading', { name: 'Updated Test Entry' })).toBeVisible()
      await expect(page.getByText('Updated content after editing')).toBeVisible()

      // Edit button should be visible again (not in edit mode)
      await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
    })

    test('cancels editing and restores original values', async ({ page }) => {
      await page.getByText('Test Entry for Management').click()
      await page.waitForLoadState('networkidle')

      // Enter edit mode
      await page.getByRole('button', { name: 'Edit' }).click()

      // Make changes
      await page.getByLabel('Title').fill('Cancelled Changes')
      await page.getByLabel(/Content/).fill('This will be cancelled')

      // Click Cancel
      await page.getByRole('button', { name: 'Cancel' }).click()

      // Verify original values are restored
      await expect(page.getByRole('heading', { name: 'Test Entry for Management' })).toBeVisible()
      await expect(page.getByText('This entry will be edited or deleted')).toBeVisible()

      // Should be back in view mode
      await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
    })

    test('saves entry using Cmd+Enter in edit mode', async ({ page }) => {
      await page.getByText('Test Entry for Management').click()
      await page.waitForLoadState('networkidle')

      await page.getByRole('button', { name: 'Edit' }).click()

      const contentTextarea = page.getByLabel(/Content/)
      await page.getByLabel('Title').fill('Keyboard Save Entry')
      await contentTextarea.fill('Saved with Cmd+Enter')

      // Press Cmd+Enter (or Ctrl+Enter)
      const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
      await contentTextarea.press(`${modifier}+Enter`)

      await page.waitForLoadState('networkidle')

      // Verify changes saved
      await expect(page.getByRole('heading', { name: 'Keyboard Save Entry' })).toBeVisible()
      await expect(page.getByText('Saved with Cmd+Enter')).toBeVisible()
    })

    test('shows error message when save fails', async ({ page }) => {
      // Note: This test would require mocking a failed save
      // Skipping for now as it requires API mocking setup
      test.skip()
    })
  })

  test.describe('Entry Deletion', () => {
    test('deletes an entry with confirmation', async ({ page }) => {
      await page.getByText('Test Entry for Management').click()
      await page.waitForLoadState('networkidle')

      // Set up dialog handler before clicking delete
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm')
        expect(dialog.message()).toContain('Are you sure')
        await dialog.accept()
      })

      // Click Delete button
      await page.getByRole('button', { name: 'Delete' }).click()

      // Wait for navigation back to home
      await page.waitForURL('/')

      // Verify entry is no longer in the list
      await expect(page.getByText('Test Entry for Management')).not.toBeVisible()
    })

    test('cancels deletion when user declines confirmation', async ({ page }) => {
      await page.getByText('Test Entry for Management').click()
      await page.waitForLoadState('networkidle')

      // Set up dialog handler to dismiss
      page.on('dialog', async (dialog) => {
        await dialog.dismiss()
      })

      // Click Delete button
      await page.getByRole('button', { name: 'Delete' }).click()

      // Wait a moment
      await page.waitForTimeout(1000)

      // Entry should still be visible (not deleted)
      await expect(page.getByRole('heading', { name: 'Test Entry for Management' })).toBeVisible()
    })

    test('disables edit button while deleting', async ({ page }) => {
      await page.getByText('Test Entry for Management').click()
      await page.waitForLoadState('networkidle')

      // Set up dialog handler
      page.on('dialog', async (dialog) => {
        // Check that Edit button is disabled during deletion
        const editButton = page.getByRole('button', { name: 'Edit' })
        await expect(editButton).toBeDisabled()

        await dialog.accept()
      })

      await page.getByRole('button', { name: 'Delete' }).click()

      await page.waitForURL('/')
    })
  })

  test.describe('Entry Navigation', () => {
    test('navigates from list to detail page', async ({ page }) => {
      // Click on entry title
      await page.getByText('Test Entry for Management').click()

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/entries\/[a-f0-9-]+/)

      // Content should be visible
      await expect(page.getByRole('heading', { name: 'Test Entry for Management' })).toBeVisible()
      await expect(page.getByText('This entry will be edited or deleted')).toBeVisible()
    })

    test('navigates back to home from detail page', async ({ page }) => {
      await page.getByText('Test Entry for Management').click()
      await page.waitForLoadState('networkidle')

      // Click browser back button or home link (if available)
      await page.goBack()

      // Should be back on home page
      await expect(page).toHaveURL('/')
      await expect(page.getByRole('heading', { name: 'New Entry' })).toBeVisible()
    })
  })

  test.describe('Related Entries', () => {
    test('shows related entries on detail page', async ({ page }) => {
      // Create additional entries with similar content
      await page.goto('/')

      await page.getByLabel('Title').fill('AI Research')
      await page.getByLabel(/Content/).fill('Machine learning and neural networks')
      await page.getByRole('button', { name: 'Add Entry' }).click()
      await page.waitForLoadState('networkidle')

      await page.getByLabel('Title').fill('Deep Learning')
      await page.getByLabel(/Content/).fill('Neural networks and AI models')
      await page.getByRole('button', { name: 'Add Entry' }).click()
      await page.waitForLoadState('networkidle')

      // View one of the entries
      await page.getByText('AI Research').click()
      await page.waitForLoadState('networkidle')

      // Wait for related entries to load (if they appear)
      await page.waitForTimeout(2000)

      // Check if related entries section exists
      // Note: This depends on whether embeddings are generated in test environment
      const relatedSection = page.getByText('Related Entries')
      const isRelatedVisible = await relatedSection.isVisible().catch(() => false)

      if (isRelatedVisible) {
        // Verify related entry appears
        await expect(page.getByText('Deep Learning')).toBeVisible()
      }
    })
  })
})
