// Audio-related TypeScript types for Cultural Sound Lab

export interface AudioSample {
  id: string;
  title: string;
  description: string;
  culturalOrigin: string;
  instrumentType: string;
  fileUrl: string;
  duration: number;
  fileSize: number;
  sampleRate: number;
  tags: string[];
  metadata: {
    key?: string;
    tempo?: number;
    genre?: string;
    mood?: string;
    uploadedBy?: string;
    uploadedAt?: string;
  };
  thumbnailUrl?: string;
  waveformData?: number[];
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  isBuffering: boolean;
  playbackRate: number;
}

export interface AudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  duration?: number;
  autoPlay?: boolean;
  loop?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onError?: (error: string) => void;
  className?: string;
}

export interface WaveformDisplayProps {
  audioUrl: string;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  cursorColor?: string;
  responsive?: boolean;
  normalize?: boolean;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onFinish?: () => void;
  onSeek?: (time: number) => void;
  className?: string;
}

export interface AudioUploaderProps {
  onUpload: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  allowedExtensions?: string[];
  disabled?: boolean;
  className?: string;
}

export interface AudioGridProps {
  samples: AudioSample[];
  columns?: number;
  onSampleSelect?: (sample: AudioSample) => void;
  onSamplePlay?: (sample: AudioSample) => void;
  onUseInGeneration?: (sample: AudioSample) => void;
  selectedSamples?: string[];
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface AudioUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface AudioVisualization {
  waveform: number[];
  peaks: number[];
  frequencies: number[];
  spectogram?: number[][];
}

export interface AudioAnalysis {
  tempo?: number;
  key?: string;
  mode?: 'major' | 'minor';
  loudness?: number;
  energy?: number;
  valence?: number;
  danceability?: number;
  speechiness?: number;
  acousticness?: number;
  instrumentalness?: number;
  liveness?: number;
}

export interface AudioGeneration {
  id: string;
  title: string;
  sourceSamples: string[];
  parameters: {
    mood: string;
    tempo: number;
    duration: number;
    style: string;
    key?: string;
    genre?: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  outputUrl?: string;
  createdAt: string;
  updatedAt?: string;
  error?: string;
}

export interface AudioLicense {
  id: string;
  audioId: string;
  userId: string;
  type: 'personal' | 'commercial' | 'enterprise';
  price: number;
  currency: string;
  usage: string;
  restrictions?: string[];
  validFrom: string;
  validUntil?: string;
  downloadLimit?: number;
  downloadCount: number;
  status: 'active' | 'expired' | 'cancelled';
}

export interface AudioPlaylist {
  id: string;
  title: string;
  description?: string;
  samples: AudioSample[];
  duration: number;
  createdAt: string;
  updatedAt?: string;
  isPublic: boolean;
  tags: string[];
}