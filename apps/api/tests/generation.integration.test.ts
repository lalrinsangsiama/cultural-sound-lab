import request from 'supertest'
import { app } from '../src/index'

describe('Generation API Integration Tests', () => {
  let authToken: string
  let sampleId: string

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@culturalsoundlab.com',
        password: 'user123456'
      })

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.token
    }

    // Get a sample ID for generation tests
    const samplesResponse = await request(app).get('/api/audio/samples')
    sampleId = samplesResponse.body[0].id
  })

  describe('POST /api/generate/sound-logo', () => {
    it('should create sound logo generation job', async () => {
      const generationRequest = {
        sourceId: sampleId,
        parameters: {
          duration: 5,
          mood: 'energetic',
          style: 'modern',
          fadeIn: true,
          fadeOut: true
        }
      }

      const response = await request(app)
        .post('/api/generate/sound-logo')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationRequest)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('status', 'queued')
      expect(response.body).toHaveProperty('type', 'sound_logo')
      expect(response.body.parameters).toMatchObject(generationRequest.parameters)
    })

    it('should reject generation without authentication', async () => {
      const response = await request(app)
        .post('/api/generate/sound-logo')
        .send({
          sourceId: sampleId,
          parameters: { duration: 5 }
        })

      expect(response.status).toBe(401)
    })

    it('should validate generation parameters', async () => {
      const invalidRequest = {
        sourceId: sampleId,
        parameters: {
          duration: 100, // Too long for sound logo
          mood: 'invalid-mood'
        }
      }

      const response = await request(app)
        .post('/api/generate/sound-logo')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/generate/playlist', () => {
    it('should create playlist generation job', async () => {
      const generationRequest = {
        sourceIds: [sampleId],
        parameters: {
          duration: 300, // 5 minutes
          mood: 'chill',
          crossfade: true,
          shuffle: false
        }
      }

      const response = await request(app)
        .post('/api/generate/playlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationRequest)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('status', 'queued')
      expect(response.body).toHaveProperty('type', 'playlist')
    })

    it('should handle multiple source samples', async () => {
      // Get multiple samples
      const samplesResponse = await request(app).get('/api/audio/samples?limit=3')
      const sourceIds = samplesResponse.body.map((s: any) => s.id)

      const response = await request(app)
        .post('/api/generate/playlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceIds,
          parameters: {
            duration: 600,
            mood: 'ceremonial'
          }
        })

      expect(response.status).toBe(201)
      expect(response.body.sourceIds).toEqual(sourceIds)
    })
  })

  describe('GET /api/generate/status/:id', () => {
    let generationId: string

    beforeAll(async () => {
      // Create a generation to check status
      const response = await request(app)
        .post('/api/generate/sound-logo')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceId: sampleId,
          parameters: { duration: 3, mood: 'ambient' }
        })

      generationId = response.body.id
    })

    it('should return generation status', async () => {
      const response = await request(app)
        .get(`/api/generate/status/${generationId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', generationId)
      expect(response.body).toHaveProperty('status')
      expect(['queued', 'processing', 'completed', 'failed']).toContain(response.body.status)
    })

    it('should return 404 for non-existent generation', async () => {
      const response = await request(app)
        .get('/api/generate/status/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })

    it('should prevent access to other users generations', async () => {
      // Login as different user
      const otherUserResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'contributor@culturalsoundlab.com',
          password: 'contributor123456'
        })

      const otherUserToken = otherUserResponse.body.token

      const response = await request(app)
        .get(`/api/generate/status/${generationId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)

      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/generate/my-generations', () => {
    it('should return user generations', async () => {
      const response = await request(app)
        .get('/api/generate/my-generations')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      
      if (response.body.length > 0) {
        const generation = response.body[0]
        expect(generation).toHaveProperty('id')
        expect(generation).toHaveProperty('type')
        expect(generation).toHaveProperty('status')
        expect(generation).toHaveProperty('created_at')
      }
    })

    it('should filter generations by type', async () => {
      const response = await request(app)
        .get('/api/generate/my-generations?type=sound_logo')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      response.body.forEach((gen: any) => {
        expect(gen.type).toBe('sound_logo')
      })
    })

    it('should filter generations by status', async () => {
      const response = await request(app)
        .get('/api/generate/my-generations?status=completed')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      response.body.forEach((gen: any) => {
        expect(gen.status).toBe('completed')
      })
    })
  })

  describe('GET /api/generate/download/:id', () => {
    // Note: This test would require a completed generation
    // In a real scenario, you might need to wait for generation completion
    // or mock the generation service

    it('should download completed generation', async () => {
      // This test assumes there's a completed generation
      const generationsResponse = await request(app)
        .get('/api/generate/my-generations?status=completed')
        .set('Authorization', `Bearer ${authToken}`)

      if (generationsResponse.body.length > 0) {
        const completedGeneration = generationsResponse.body[0]
        
        const response = await request(app)
          .get(`/api/generate/download/${completedGeneration.id}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
        expect(response.headers['content-type']).toMatch(/audio\//)
        expect(response.headers['content-disposition']).toContain('attachment')
      }
    })

    it('should reject download of incomplete generation', async () => {
      // Get a queued or processing generation
      const generationsResponse = await request(app)
        .get('/api/generate/my-generations?status=queued')
        .set('Authorization', `Bearer ${authToken}`)

      if (generationsResponse.body.length > 0) {
        const incompleteGeneration = generationsResponse.body[0]
        
        const response = await request(app)
          .get(`/api/generate/download/${incompleteGeneration.id}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error')
      }
    })
  })

  describe('Queue Health and Monitoring', () => {
    it('should provide queue statistics', async () => {
      const response = await request(app)
        .get('/api/generate/queue/stats')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('waiting')
      expect(response.body).toHaveProperty('active')
      expect(response.body).toHaveProperty('completed')
      expect(response.body).toHaveProperty('failed')
    })

    it('should show queue health', async () => {
      const response = await request(app).get('/health')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('queue')
      expect(response.body.queue).toHaveProperty('status')
    })
  })
})