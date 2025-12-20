import { vi } from 'vitest'

/**
 * Creates a mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  const mockSelect = vi.fn().mockReturnThis()
  const mockInsert = vi.fn().mockReturnThis()
  const mockUpdate = vi.fn().mockReturnThis()
  const mockDelete = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockNeq = vi.fn().mockReturnThis()
  const mockOrder = vi.fn().mockReturnThis()
  const mockSingle = vi.fn()
  const mockRpc = vi.fn()
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    neq: mockNeq,
    order: mockOrder,
    single: mockSingle,
  })

  const mockClient = {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
  }

  return {
    client: mockClient,
    mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      neq: mockNeq,
      order: mockOrder,
      single: mockSingle,
      rpc: mockRpc,
    },
  }
}

/**
 * Helper to mock a successful Supabase query
 */
export function mockSuccessfulQuery(data: any) {
  return {
    data,
    error: null,
  }
}

/**
 * Helper to mock a failed Supabase query
 */
export function mockFailedQuery(message: string) {
  return {
    data: null,
    error: { message },
  }
}

/**
 * Mock for the createClient function from @/lib/supabase/server
 */
export function mockCreateClient() {
  const { client, mocks } = createMockSupabaseClient()
  return {
    mockClient: client,
    mockResolvedValue: (value: any) => {
      vi.mocked(mocks.single).mockResolvedValue(value)
      vi.mocked(mocks.select).mockResolvedValue(value)
      vi.mocked(mocks.insert).mockResolvedValue(value)
      vi.mocked(mocks.update).mockResolvedValue(value)
      vi.mocked(mocks.delete).mockResolvedValue(value)
      vi.mocked(mocks.rpc).mockResolvedValue(value)
      return client
    },
  }
}
