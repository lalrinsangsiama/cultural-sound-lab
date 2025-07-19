import { apiClient } from '../api-client'

// Mock fetch globally
global.fetch = jest.fn()

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('makes GET requests correctly', async () => {
    const mockResponse = { data: 'test' }
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await apiClient.get('/test')
    
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    expect(result).toEqual(mockResponse)
  })

  it('makes POST requests with data', async () => {
    const mockResponse = { success: true }
    const postData = { name: 'test' }
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await apiClient.post('/test', postData)
    
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    })
    expect(result).toEqual(mockResponse)
  })

  it('handles API errors', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    await expect(apiClient.get('/nonexistent')).rejects.toThrow('HTTP error! status: 404')
  })

  it('includes auth token when provided', async () => {
    const mockResponse = { data: 'authenticated' }
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    await apiClient.get('/protected', { 
      headers: { Authorization: 'Bearer test-token' } 
    })
    
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/protected', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
    })
  })
})