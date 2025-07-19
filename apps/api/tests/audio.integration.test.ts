import request from 'supertest'
import { app } from '../src/index'
import path from 'path'
import fs from 'fs'

describe('Audio API Integration Tests', () => {
  let authToken: string

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
  })

  describe('GET /api/audio/samples', () => {
    it('should return all audio samples', async () => {
      const response = await request(app)
        .get('/api/audio/samples')

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      
      // Check sample structure
      const sample = response.body[0]
      expect(sample).toHaveProperty('id')
      expect(sample).toHaveProperty('title')
      expect(sample).toHaveProperty('description')
      expect(sample).toHaveProperty('cultural_origin')
      expect(sample).toHaveProperty('instrument_type')
    })

    it('should filter samples by cultural origin', async () => {
      const response = await request(app)
        .get('/api/audio/samples?cultural_origin=Mizo')

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      
      // All returned samples should be from Mizo culture
      response.body.forEach((sample: any) => {
        expect(sample.cultural_origin).toBe('Mizo')
      })
    })

    it('should filter samples by instrument type', async () => {
      const response = await request(app)
        .get('/api/audio/samples?instrument_type=Flute')

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      
      // All returned samples should be flute instruments
      response.body.forEach((sample: any) => {
        expect(sample.instrument_type).toBe('Flute')
      })
    })

    it('should search samples by title', async () => {
      const response = await request(app)
        .get('/api/audio/samples?search=bamboo')

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      
      // All returned samples should contain 'bamboo' in title or description
      response.body.forEach((sample: any) => {
        const searchText = (sample.title + ' ' + sample.description).toLowerCase()
        expect(searchText).toContain('bamboo')
      })
    })
  })

  describe('GET /api/audio/samples/:id', () => {
    let sampleId: string

    beforeAll(async () => {
      // Get a sample ID from the list
      const response = await request(app).get('/api/audio/samples')
      sampleId = response.body[0].id
    })

    it('should return specific audio sample', async () => {
      const response = await request(app)
        .get(`/api/audio/samples/${sampleId}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', sampleId)
      expect(response.body).toHaveProperty('cultural_context')
      expect(response.body).toHaveProperty('file_url')
    })

    it('should return 404 for non-existent sample', async () => {
      const response = await request(app)
        .get('/api/audio/samples/non-existent-id')

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/audio/upload', () => {
    it('should upload audio file successfully', async () => {
      // Create a mock audio file buffer
      const mockAudioBuffer = Buffer.from('mock audio data')
      
      const response = await request(app)
        .post('/api/audio/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('audio', mockAudioBuffer, 'test.mp3')
        .field('title', 'Test Upload')
        .field('description', 'Integration test upload')
        .field('cultural_origin', 'Test Culture')
        .field('instrument_type', 'Test Instrument')

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', 'Test Upload')
    })

    it('should reject upload without authentication', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data')
      
      const response = await request(app)
        .post('/api/audio/upload')
        .attach('audio', mockAudioBuffer, 'test.mp3')

      expect(response.status).toBe(401)
    })

    it('should reject invalid file formats', async () => {
      const mockTextBuffer = Buffer.from('not audio data')
      
      const response = await request(app)
        .post('/api/audio/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('audio', mockTextBuffer, 'test.txt')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /api/audio/preview/:id', () => {
    let sampleId: string

    beforeAll(async () => {
      const response = await request(app).get('/api/audio/samples')
      sampleId = response.body[0].id
    })

    it('should return audio file stream', async () => {
      const response = await request(app)
        .get(`/api/audio/preview/${sampleId}`)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toMatch(/audio\//)
    })

    it('should support range requests', async () => {
      const response = await request(app)
        .get(`/api/audio/preview/${sampleId}`)
        .set('Range', 'bytes=0-1023')

      expect(response.status).toBe(206) // Partial Content
      expect(response.headers['content-range']).toBeDefined()
    })
  })

  describe('Analytics and Metrics', () => {
    it('should track sample play counts', async () => {
      const samples = await request(app).get('/api/audio/samples')
      const sampleId = samples.body[0].id

      // Play the sample
      await request(app).post(`/api/audio/play/${sampleId}`)

      // Check that play count increased
      const response = await request(app)
        .get(`/api/audio/samples/${sampleId}`)

      expect(response.body).toHaveProperty('play_count')
      expect(response.body.play_count).toBeGreaterThan(0)
    })

    it('should provide usage analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/audio-usage')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('totalPlays')
      expect(response.body).toHaveProperty('popularSamples')
      expect(response.body).toHaveProperty('culturalBreakdown')
    })
  })
})