import { beforeAll, afterAll, beforeEach } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import { createClient } from '@supabase/supabase-js'

const execAsync = promisify(exec)

// Integration test database configuration
const TEST_DB_URL = process.env.TEST_SUPABASE_URL || 'http://localhost:54321'
const TEST_DB_KEY = process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key'

// Global test database client
let testClient: ReturnType<typeof createClient>

/**
 * Setup: Ensure test database is running and ready
 */
beforeAll(async () => {
  console.log('🔧 Setting up integration test environment...')

  // Check if Docker is running and postgres container is up
  try {
    await execAsync('docker ps | grep journal-test-db')
    console.log('✅ Test database container is running')
  } catch (error) {
    console.error('❌ Test database container is not running!')
    console.error('Run: docker-compose -f docker-compose.test.yml up -d')
    throw new Error('Test database not available')
  }

  // Create Supabase client for test database
  testClient = createClient(TEST_DB_URL, TEST_DB_KEY)

  // Wait for database to be ready
  console.log('⏳ Waiting for database to be ready...')
  let retries = 10
  while (retries > 0) {
    try {
      const { error } = await testClient.from('entries').select('count').single()
      if (!error || error.message.includes('multiple')) {
        console.log('✅ Database is ready')
        break
      }
    } catch (err) {
      retries--
      if (retries === 0) throw err
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  console.log('✅ Integration test environment ready')
}, 60000)

/**
 * Cleanup: Stop test database after all tests
 */
afterAll(async () => {
  console.log('🧹 Cleaning up integration test environment...')

  // Note: Don't automatically stop the container - let developer control this
  // To stop: docker-compose -f docker-compose.test.yml down -v
  console.log('✅ Integration tests complete')
})

/**
 * Reset database state before each test
 */
beforeEach(async () => {
  // Load seed data before each test for consistent state
  try {
    const { stdout } = await execAsync(
      `docker exec journal-test-db psql -U journal_test -d journal_test -f /docker-entrypoint-initdb.d/test-seed.sql`
    )
    console.log('🌱 Test data seeded:', stdout.substring(0, 100))
  } catch (error) {
    console.warn('⚠️  Failed to seed test data:', error)
  }
})

/**
 * Helper function to get test database client
 */
export function getTestClient() {
  if (!testClient) {
    throw new Error('Test client not initialized. Setup failed?')
  }
  return testClient
}

/**
 * Helper function to clear all data
 */
export async function clearDatabase() {
  const client = getTestClient()

  await client.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await client.from('entries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
}

/**
 * Helper function to create test entry
 */
export async function createTestEntry(data: {
  title: string
  content: string
  embedding?: number[]
}) {
  const client = getTestClient()

  const { data: entry, error } = await client
    .from('entries')
    .insert({
      title: data.title,
      content: data.content,
      embedding: data.embedding || null,
    })
    .select()
    .single()

  if (error) throw error
  return entry
}

/**
 * Helper function to create test task
 */
export async function createTestTask(data: {
  content: string
  entry_id: string
  completed?: boolean
  due_date?: string
}) {
  const client = getTestClient()

  const { data: task, error } = await client
    .from('tasks')
    .insert({
      content: data.content,
      entry_id: data.entry_id,
      completed: data.completed || false,
      due_date: data.due_date || null,
      archived: false,
    })
    .select()
    .single()

  if (error) throw error
  return task
}
