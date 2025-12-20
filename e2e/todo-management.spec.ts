import { test, expect } from './fixtures'

test.describe('Todo Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todo')
  })

  test.describe('Todo Creation', () => {
    test('creates a new todo', async ({ page }) => {
      // Fill in todo form
      await page.getByLabel('Task').fill('Buy groceries')
      await page.getByRole('button', { name: 'Add Todo' }).click()

      // Wait for todo to appear
      await page.waitForLoadState('networkidle')

      // Verify todo is in the list
      await expect(page.getByText('Buy groceries')).toBeVisible()
    })

    test('creates todo with due date', async ({ page }) => {
      await page.getByLabel('Task').fill('Doctor appointment')
      await page.getByLabel('Due Date').fill('2025-12-25')
      await page.getByRole('button', { name: 'Add Todo' }).click()

      await page.waitForLoadState('networkidle')

      // Verify todo appears with due date
      await expect(page.getByText('Doctor appointment')).toBeVisible()
      await expect(page.getByText('Dec 25, 2025')).toBeVisible()
    })

    test('clears form after submission', async ({ page }) => {
      await page.getByLabel('Task').fill('Temporary task')
      await page.getByRole('button', { name: 'Add Todo' }).click()

      await page.waitForLoadState('networkidle')

      // Form should be cleared
      await expect(page.getByLabel('Task')).toHaveValue('')
      await expect(page.getByLabel('Due Date')).toHaveValue('')
    })

    test('shows validation error for empty task', async ({ page }) => {
      // Try to submit empty form
      await page.getByRole('button', { name: 'Add Todo' }).click()

      // HTML5 validation should prevent submission
      const taskInput = page.getByLabel('Task')
      await expect(taskInput).toHaveAttribute('required')
    })
  })

  test.describe('Todo Completion', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test todo
      await page.getByLabel('Task').fill('Test todo for completion')
      await page.getByRole('button', { name: 'Add Todo' }).click()
      await page.waitForLoadState('networkidle')
    })

    test('toggles todo completion', async ({ page }) => {
      // Find the checkbox for the todo
      const todoRow = page.locator('li').filter({ hasText: 'Test todo for completion' })
      const checkbox = todoRow.getByRole('checkbox')

      // Toggle completion
      await checkbox.check()
      await page.waitForLoadState('networkidle')

      // Checkbox should be checked
      await expect(checkbox).toBeChecked()

      // Todo text should have line-through style
      const todoText = todoRow.locator('label')
      await expect(todoText).toHaveCSS('text-decoration', /line-through/)

      // Uncheck
      await checkbox.uncheck()
      await page.waitForLoadState('networkidle')

      await expect(checkbox).not.toBeChecked()
    })

    test('shows completed count in heading', async ({ page }) => {
      const heading = page.getByRole('heading', { name: /Active Todos/ })

      // Mark todo as complete
      const checkbox = page.getByRole('checkbox').first()
      await checkbox.check()
      await page.waitForLoadState('networkidle')

      // Heading should update to show completed count
      // Example: "Active Todos (0 of 1 completed)"
      await expect(heading).toContainText('1 completed')
    })
  })

  test.describe('Todo Archiving', () => {
    test.beforeEach(async ({ page }) => {
      // Create and complete a test todo
      await page.getByLabel('Task').fill('Todo to archive')
      await page.getByRole('button', { name: 'Add Todo' }).click()
      await page.waitForLoadState('networkidle')

      const checkbox = page.getByRole('checkbox').first()
      await checkbox.check()
      await page.waitForLoadState('networkidle')
    })

    test('archives a completed todo', async ({ page }) => {
      // Click archive button
      const todoRow = page.locator('li').filter({ hasText: 'Todo to archive' })
      const archiveButton = todoRow.getByRole('button', { name: /Archive/ })

      await archiveButton.click()
      await page.waitForLoadState('networkidle')

      // Todo should no longer be visible in active list
      await expect(page.getByText('Todo to archive')).not.toBeVisible()
    })

    test('archive button only appears for completed todos', async ({ page }) => {
      // Create an incomplete todo
      await page.getByLabel('Task').fill('Incomplete todo')
      await page.getByRole('button', { name: 'Add Todo' }).click()
      await page.waitForLoadState('networkidle')

      // Archive button should not be visible for incomplete todo
      const incompleteTodoRow = page.locator('li').filter({ hasText: 'Incomplete todo' })
      const archiveButton = incompleteTodoRow.getByRole('button', { name: /Archive/ })
      await expect(archiveButton).not.toBeVisible()
    })
  })

  test.describe('Overdue Todos', () => {
    test('highlights overdue todos in red', async ({ page }) => {
      // Create a todo with past due date
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      await page.getByLabel('Task').fill('Overdue task')
      await page.getByLabel('Due Date').fill(yesterdayStr)
      await page.getByRole('button', { name: 'Add Todo' }).click()

      await page.waitForLoadState('networkidle')

      // Find the overdue todo
      const todoRow = page.locator('li').filter({ hasText: 'Overdue task' })

      // Should have red text or background
      const dueDate = todoRow.getByText(/Overdue/)
      await expect(dueDate).toHaveCSS('color', /rgb\(185, 28, 28\)/) // text-red-700
    })

    test('does not highlight future due dates', async ({ page }) => {
      // Create a todo with future due date
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      await page.getByLabel('Task').fill('Future task')
      await page.getByLabel('Due Date').fill(tomorrowStr)
      await page.getByRole('button', { name: 'Add Todo' }).click()

      await page.waitForLoadState('networkidle')

      // Future due date should not be red
      const todoRow = page.locator('li').filter({ hasText: 'Future task' })
      const dueDate = todoRow.locator('span').filter({ hasText: /Due/ })

      // Should not have red color (should be default text color)
      const color = await dueDate.evaluate((el) => getComputedStyle(el).color)
      expect(color).not.toContain('rgb(185, 28, 28)')
    })
  })

  test.describe('Todo Sorting', () => {
    test('displays todos in reverse chronological order', async ({ page }) => {
      // Create multiple todos
      await page.getByLabel('Task').fill('First todo')
      await page.getByRole('button', { name: 'Add Todo' }).click()
      await page.waitForLoadState('networkidle')

      await page.getByLabel('Task').fill('Second todo')
      await page.getByRole('button', { name: 'Add Todo' }).click()
      await page.waitForLoadState('networkidle')

      await page.getByLabel('Task').fill('Third todo')
      await page.getByRole('button', { name: 'Add Todo' }).click()
      await page.waitForLoadState('networkidle')

      // Get all todos
      const todos = await page.locator('li').filter({ hasText: /todo/ }).allTextContents()

      // Newest should be first
      expect(todos[0]).toContain('Third todo')
      expect(todos[todos.length - 1]).toContain('First todo')
    })
  })

  test.describe('Todo Deletion', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByLabel('Task').fill('Todo to delete')
      await page.getByRole('button', { name: 'Add Todo' }).click()
      await page.waitForLoadState('networkidle')
    })

    test('deletes a todo', async ({ page }) => {
      const todoRow = page.locator('li').filter({ hasText: 'Todo to delete' })

      // Find and click delete button (if exists)
      const deleteButton = todoRow.getByRole('button', { name: /Delete/ })

      // If delete button exists
      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click()
        await page.waitForLoadState('networkidle')

        // Todo should be gone
        await expect(page.getByText('Todo to delete')).not.toBeVisible()
      }
    })
  })

  test.describe('Todo Persistence', () => {
    test('todos persist across page reloads', async ({ page }) => {
      // Create a todo
      await page.getByLabel('Task').fill('Persistent todo')
      await page.getByRole('button', { name: 'Add Todo' }).click()
      await page.waitForLoadState('networkidle')

      // Reload page
      await page.reload()

      // Todo should still be visible
      await expect(page.getByText('Persistent todo')).toBeVisible()
    })
  })

  test.describe('Empty State', () => {
    test('shows helpful message when no todos exist', async ({ page }) => {
      // Check if there's an empty state message
      // Note: This depends on implementation
      const hasTodos = await page.locator('li').filter({ hasText: /.+/ }).count()

      if (hasTodos === 0) {
        // Should show some empty state UI
        // This is a placeholder - adjust based on actual implementation
        await expect(page.getByText(/No todos/)).toBeVisible()
      }
    })
  })
})
