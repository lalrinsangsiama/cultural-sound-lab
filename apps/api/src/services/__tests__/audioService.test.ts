import { AudioService } from '../audioService'

// Mock external dependencies
jest.mock('../../config/supabase')
jest.mock('fluent-ffmpeg')

describe('AudioService', () => {
  let audioService: AudioService

  beforeEach(() => {
    audioService = new AudioService()
    jest.clearAllMocks()
  })

  describe('validateAudioFile', () => {
    it('accepts valid audio formats', () => {
      const validFormats = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
      
      validFormats.forEach(format => {
        const result = audioService.validateAudioFile({ mimetype: format } as any)
        expect(result.isValid).toBe(true)
      })
    })

    it('rejects invalid audio formats', () => {
      const invalidFormats = ['video/mp4', 'image/jpeg', 'text/plain']
      
      invalidFormats.forEach(format => {
        const result = audioService.validateAudioFile({ mimetype: format } as any)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Invalid file format')
      })
    })

    it('rejects files that are too large', () => {
      const largeFile = { 
        mimetype: 'audio/mp3', 
        size: 100 * 1024 * 1024 + 1 // 100MB + 1 byte
      } as any
      
      const result = audioService.validateAudioFile(largeFile)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('File too large')
    })

    it('accepts files within size limit', () => {
      const validFile = { 
        mimetype: 'audio/mp3', 
        size: 50 * 1024 * 1024 // 50MB
      } as any
      
      const result = audioService.validateAudioFile(validFile)
      expect(result.isValid).toBe(true)
    })
  })

  describe('extractMetadata', () => {
    it('extracts basic audio metadata', async () => {
      // Mock ffprobe response
      const mockMetadata = {
        format: {
          duration: '120.5',
          bit_rate: '320000',
          format_name: 'mp3'
        }
      }

      // Mock the ffprobe function
      jest.doMock('fluent-ffmpeg', () => ({
        ffprobe: jest.fn((file, callback) => {
          callback(null, mockMetadata)
        })
      }))

      const metadata = await audioService.extractMetadata('/path/to/test.mp3')
      
      expect(metadata).toMatchObject({
        duration: 120.5,
        bitRate: 320000,
        format: 'mp3'
      })
    })

    it('handles metadata extraction errors', async () => {
      jest.doMock('fluent-ffmpeg', () => ({
        ffprobe: jest.fn((file, callback) => {
          callback(new Error('FFprobe error'), null)
        })
      }))

      await expect(audioService.extractMetadata('/invalid/path.mp3'))
        .rejects.toThrow('FFprobe error')
    })
  })

  describe('generateWaveform', () => {
    it('generates waveform data for audio file', async () => {
      const mockWaveformData = [0.1, 0.3, 0.8, 0.5, 0.2, 0.9, 0.4]
      
      // Mock waveform generation
      jest.spyOn(audioService, 'generateWaveform').mockResolvedValue(mockWaveformData)
      
      const waveform = await audioService.generateWaveform('/path/to/test.mp3')
      
      expect(waveform).toEqual(mockWaveformData)
      expect(waveform.length).toBeGreaterThan(0)
      expect(waveform.every(val => val >= 0 && val <= 1)).toBe(true)
    })
  })

  describe('processAudioUpload', () => {
    it('processes valid audio upload successfully', async () => {
      const mockFile = {
        originalname: 'test-audio.mp3',
        mimetype: 'audio/mp3',
        size: 5 * 1024 * 1024, // 5MB
        buffer: Buffer.from('mock audio data')
      } as any

      const mockMetadata = {
        duration: 180,
        bitRate: 256000,
        format: 'mp3'
      }

      const mockWaveform = [0.1, 0.3, 0.8, 0.5]

      jest.spyOn(audioService, 'extractMetadata').mockResolvedValue(mockMetadata)
      jest.spyOn(audioService, 'generateWaveform').mockResolvedValue(mockWaveform)

      const result = await audioService.processAudioUpload(mockFile)
      
      expect(result).toMatchObject({
        filename: 'test-audio.mp3',
        fileSize: 5 * 1024 * 1024,
        duration: 180,
        bitRate: 256000,
        format: 'mp3',
        waveform: mockWaveform
      })
    })

    it('rejects invalid audio uploads', async () => {
      const invalidFile = {
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 1024
      } as any

      await expect(audioService.processAudioUpload(invalidFile))
        .rejects.toThrow('Invalid file format')
    })
  })
})