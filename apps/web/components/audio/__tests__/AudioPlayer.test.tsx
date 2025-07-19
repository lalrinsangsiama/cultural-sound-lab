import { render, screen, fireEvent } from '@testing-library/react'
import AudioPlayer from '../AudioPlayer'

// Mock audio metadata
const mockAudioMetadata = {
  id: 'test-audio-1',
  title: 'Test Audio',
  description: 'A test audio file',
  cultural_origin: 'Mizo',
  instrument_type: 'Flute',
  file_url: '/test-audio.mp3',
  duration: 120,
  created_at: '2023-01-01T00:00:00Z',
  cultural_context: {
    significance: 'Traditional ceremonial music',
    usage_notes: 'Used in festivals',
    cultural_story: 'Passed down through generations'
  }
}

describe('AudioPlayer Component', () => {
  it('renders audio player with metadata', () => {
    render(<AudioPlayer src={mockAudioMetadata.file_url} title={mockAudioMetadata.title} artist={mockAudioMetadata.cultural_origin} duration={mockAudioMetadata.duration} />)
    
    expect(screen.getByText('Test Audio')).toBeInTheDocument()
    expect(screen.getByText('A test audio file')).toBeInTheDocument()
    expect(screen.getByText('Mizo')).toBeInTheDocument()
    expect(screen.getByText('Flute')).toBeInTheDocument()
  })

  it('shows play button initially', () => {
    render(<AudioPlayer src={mockAudioMetadata.file_url} title={mockAudioMetadata.title} artist={mockAudioMetadata.cultural_origin} duration={mockAudioMetadata.duration} />)
    
    const playButton = screen.getByRole('button', { name: /play/i })
    expect(playButton).toBeInTheDocument()
  })

  it('handles play button click', () => {
    render(<AudioPlayer src={mockAudioMetadata.file_url} title={mockAudioMetadata.title} artist={mockAudioMetadata.cultural_origin} duration={mockAudioMetadata.duration} />)
    
    const playButton = screen.getByRole('button', { name: /play/i })
    fireEvent.click(playButton)
    
    // After clicking play, button should change to pause
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
  })

  it('displays cultural context when expanded', () => {
    render(<AudioPlayer src={mockAudioMetadata.file_url} title={mockAudioMetadata.title} artist={mockAudioMetadata.cultural_origin} duration={mockAudioMetadata.duration} />)
    
    // Find and click the cultural context toggle
    const contextButton = screen.getByRole('button', { name: /cultural context/i })
    fireEvent.click(contextButton)
    
    expect(screen.getByText('Traditional ceremonial music')).toBeInTheDocument()
    expect(screen.getByText('Used in festivals')).toBeInTheDocument()
  })

  it('formats duration correctly', () => {
    render(<AudioPlayer src={mockAudioMetadata.file_url} title={mockAudioMetadata.title} artist={mockAudioMetadata.cultural_origin} duration={mockAudioMetadata.duration} />)
    
    // 120 seconds should be displayed as 2:00
    expect(screen.getByText('2:00')).toBeInTheDocument()
  })

  it('handles volume changes', () => {
    render(<AudioPlayer src={mockAudioMetadata.file_url} title={mockAudioMetadata.title} artist={mockAudioMetadata.cultural_origin} duration={mockAudioMetadata.duration} />)
    
    const volumeSlider = screen.getByRole('slider', { name: /volume/i })
    fireEvent.change(volumeSlider, { target: { value: '50' } })
    
    expect(volumeSlider).toHaveValue('50')
  })
})