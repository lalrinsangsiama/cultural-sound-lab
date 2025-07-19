/**
 * Cultural Sound Lab SDK
 * Complete TypeScript SDK for the Cultural Sound Lab API
 */

// Export the main API client
export { CulturalSoundLabApi, api } from './api-client';

// Export all types
export type {
  AudioSample,
  CreateAudioSampleInput,
  UpdateAudioSampleInput,
  GetAudioSamplesQuery,
  AudioSamplesListResponse,
  AudioPreviewResponse,
  Generation,
  CreateGenerationInput,
  GenerationsListResponse,
  JobStatusResponse,
  DownloadResponse,
  PaymentIntent,
  HealthCheck,
  ApiError,
  ApiClientConfig,
} from './api-client';

// Export all React hooks
export {
  useAudioSamples,
  useAudioSample,
  useAudioUpload,
  useGenerations,
  useGeneration,
  useCreateGeneration,
  useJobStatus,
  useHealthCheck,
  useAuth,
  useDownload,
  useInfiniteAudioSamples,
} from './hooks';

// Re-export for convenience
export { apiClient as defaultApi } from '../api/client';

// SDK version
export const SDK_VERSION = '1.0.0';