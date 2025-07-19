import request from 'supertest'
import { app } from '../src/index'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

describe('Authentication Integration Tests', () => {
  let authToken: string
  let testUserId: string

  beforeAll(async () => {
    // Create a test user for integration tests
    const { data, error } = await supabase.auth.signUp({
      email: 'test-integration@example.com',
      password: 'testpassword123',
      options: {
        data: {
          name: 'Integration Test User'
        }
      }
    })

    if (error) {
      console.error('Failed to create test user:', error)
      throw error
    }

    if (data.session) {
      authToken = data.session.access_token
      testUserId = data.user!.id
    }
  })

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId)
    }
  })

  describe('Protected Routes', () => {
    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/generate/my-generations')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    it('should accept requests with valid authentication', async () => {
      const response = await request(app)
        .get('/api/generate/my-generations')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/generate/my-generations')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('User Profile', () => {
    it('should return user profile for authenticated user', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        id: testUserId,
        email: 'test-integration@example.com'
      })
    })

    it('should allow profile updates', async () => {
      const updateData = {
        name: 'Updated Integration User',
        bio: 'Test bio for integration user'
      }

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject(updateData)
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits on auth endpoints', async () => {
      // Make multiple requests to trigger rate limiting
      const requests = Array(11).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
      )

      const responses = await Promise.all(requests)
      
      // At least one request should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })
})