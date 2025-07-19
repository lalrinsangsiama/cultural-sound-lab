import request from 'supertest'
import express from 'express'
import { getAudioSamples, getAudioSample } from '../audio'

// Mock the Supabase client
jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
        order: jest.fn(),
      })),
    })),
  },
}))

describe('Audio Controller', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.get('/api/audio/samples', getAudioSamples)
    app.get('/api/audio/samples/:id', getAudioSample)
  })

  describe('GET /api/audio/samples', () => {
    it('returns audio samples successfully', async () => {
      const mockSamples = [
        {
          id: '1',
          title: 'Test Sample 1',
          description: 'A test sample',
          cultural_origin: 'Mizo',
          instrument_type: 'Flute',
        },
        {
          id: '2',
          title: 'Test Sample 2',
          description: 'Another test sample',
          cultural_origin: 'Mizo',
          instrument_type: 'String',
        },
      ]

      // Mock Supabase response
      const { supabase } = require('../../config/supabase')
      supabase.from().select().order.mockResolvedValue({
        data: mockSamples,
        error: null,
      })

      const response = await request(app).get('/api/audio/samples')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSamples)
    })

    it('handles database errors', async () => {
      const { supabase } = require('../../config/supabase')
      supabase.from().select().order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const response = await request(app).get('/api/audio/samples')

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /api/audio/samples/:id', () => {
    it('returns a specific audio sample', async () => {
      const mockSample = {
        id: '1',
        title: 'Test Sample',
        description: 'A test sample',
        cultural_origin: 'Mizo',
        instrument_type: 'Flute',
      }

      const { supabase } = require('../../config/supabase')
      supabase.from().select().eq().single.mockResolvedValue({
        data: mockSample,
        error: null,
      })

      const response = await request(app).get('/api/audio/samples/1')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSample)
    })

    it('returns 404 for non-existent sample', async () => {
      const { supabase } = require('../../config/supabase')
      supabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // PostgREST not found error
      })

      const response = await request(app).get('/api/audio/samples/999')

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'Audio sample not found')
    })
  })
})