import { vi } from 'vitest'

/**
 * Creates a mock embedding vector of the specified dimension
 */
export function createMockEmbedding(dimension: number = 1024): number[] {
  return Array(dimension)
    .fill(0)
    .map(() => Math.random())
}

/**
 * Mock successful Voyage AI embedding response
 */
export function mockVoyageSuccess(embedding?: number[]) {
  return {
    data: [
      {
        embedding: embedding || createMockEmbedding(),
        index: 0,
      },
    ],
    model: 'voyage-3',
    usage: {
      total_tokens: 10,
    },
  }
}

/**
 * Mock failed Voyage AI embedding response
 */
export function mockVoyageFail(message: string = 'API Error') {
  throw new Error(message)
}

/**
 * Mock for fetch when calling Voyage AI API
 */
export function mockVoyageFetch(shouldSucceed: boolean = true, embedding?: number[]) {
  if (shouldSucceed) {
    return vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockVoyageSuccess(embedding)),
    })
  } else {
    return vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({
        error: {
          message: 'API Error',
        },
      }),
    })
  }
}
