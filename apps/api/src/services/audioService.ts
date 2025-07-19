import { supabaseAdmin } from '@/config/supabase';
import ffprobe from 'ffprobe';
import ffmpeg from 'fluent-ffmpeg';
import { WaveFile } from 'wavefile';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

export interface AudioMetadata {
  duration: number;
  sample_rate: number;
  bitrate?: number;
  channels: number;
  format: string;
  codec?: string;
  file_size: number;
}

export interface WaveformData {
  peaks: number[];
  length: number;
  bits: number;
  sample_rate: number;
}

export interface UploadResult {
  file_url: string;
  file_path: string;
  metadata: AudioMetadata;
  waveform_url?: string;
}

class AudioService {
  private readonly bucketName = process.env.SUPABASE_AUDIO_BUCKET || 'audio-samples';
  private readonly waveformBucket = process.env.SUPABASE_WAVEFORM_BUCKET || 'waveforms';
  private readonly tempDir = process.env.TEMP_DIR || '/tmp';

  /**
   * Upload audio file to Supabase Storage
   */
  async uploadAudio(
    buffer: Buffer,
    filename: string,
    metadata?: Partial<AudioMetadata>
  ): Promise<UploadResult> {
    try {
      const uniqueFilename = this.generateUniqueFilename(filename);
      const filePath = `uploads/${uniqueFilename}`;

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .upload(filePath, buffer, {
          contentType: this.getMimeType(filename),
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload audio: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      // Extract metadata
      const audioMetadata = await this.extractMetadata(buffer, filename);

      // Generate waveform thumbnail
      let waveform_url: string | undefined;
      try {
        waveform_url = await this.generateWaveformThumbnail(buffer, uniqueFilename);
      } catch (waveformError) {
        console.warn('Failed to generate waveform:', waveformError);
      }

      return {
        file_url: publicUrl,
        file_path: filePath,
        metadata: { ...audioMetadata, ...metadata },
        waveform_url,
      };
    } catch (error) {
      console.error('Audio upload failed:', error);
      throw new Error(`Audio upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate signed URL for secure audio playback
   */
  async generateSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Failed to generate signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract audio metadata using ffprobe
   */
  async extractMetadata(buffer: Buffer, filename: string): Promise<AudioMetadata> {
    const tempFilePath = path.join(this.tempDir, `temp_${uuidv4()}_${filename}`);

    try {
      // Write buffer to temporary file
      await fs.writeFile(tempFilePath, buffer);

      // Use ffprobe to extract metadata
      const metadata = await ffprobe(tempFilePath, { path: 'ffprobe' });

      const audioStream = metadata.streams.find((stream: any) => stream.codec_type === 'audio');
      if (!audioStream) {
        throw new Error('No audio stream found in file');
      }

      const result: AudioMetadata = {
        duration: parseFloat(audioStream.duration || '0'),
        sample_rate: parseInt(String(audioStream.sample_rate || '0')),
        bitrate: parseInt(String(audioStream.bit_rate || '0')),
        channels: audioStream.channels || 0,
        format: (metadata as any).format.format_name || 'unknown',
        codec: audioStream.codec_name,
        file_size: buffer.length,
      };

      return result;
    } catch (error) {
      console.error('Metadata extraction failed:', error);
      throw new Error(`Failed to extract metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clean up temporary file
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to clean up temp file:', cleanupError);
      }
    }
  }

  /**
   * Generate waveform thumbnail and upload to storage
   */
  async generateWaveformThumbnail(buffer: Buffer, filename: string): Promise<string> {
    const tempAudioPath = path.join(this.tempDir, `temp_audio_${uuidv4()}.wav`);
    const tempWaveformPath = path.join(this.tempDir, `temp_waveform_${uuidv4()}.dat`);
    const waveformImagePath = path.join(this.tempDir, `waveform_${uuidv4()}.png`);

    try {
      // Write audio buffer to temp file
      await fs.writeFile(tempAudioPath, buffer);

      // Convert to WAV format for waveform generation
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempAudioPath)
          .toFormat('wav')
          .audioChannels(1) // Mono for waveform
          .audioFrequency(8000) // Lower sample rate for thumbnail
          .save(tempWaveformPath)
          .on('end', () => resolve())
          .on('error', reject);
      });

      // Read WAV file and extract waveform data
      const wavBuffer = await fs.readFile(tempWaveformPath);
      const waveform = this.extractWaveformData(wavBuffer);

      // Generate waveform image
      await this.createWaveformImage(waveform, waveformImagePath);

      // Upload waveform image to storage
      const waveformBuffer = await fs.readFile(waveformImagePath);
      const waveformFilename = `${path.parse(filename).name}_waveform.png`;
      const waveformPath = `waveforms/${waveformFilename}`;

      const { error } = await supabaseAdmin.storage
        .from(this.waveformBucket)
        .upload(waveformPath, waveformBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        throw new Error(`Failed to upload waveform: ${error.message}`);
      }

      // Get public URL for waveform
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(this.waveformBucket)
        .getPublicUrl(waveformPath);

      return publicUrl;
    } catch (error) {
      console.error('Waveform generation failed:', error);
      throw new Error(`Failed to generate waveform: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clean up temporary files
      const tempFiles = [tempAudioPath, tempWaveformPath, waveformImagePath];
      for (const file of tempFiles) {
        try {
          await fs.unlink(file);
        } catch (cleanupError) {
          console.warn(`Failed to clean up temp file ${file}:`, cleanupError);
        }
      }
    }
  }

  /**
   * Extract waveform data from WAV buffer
   */
  private extractWaveformData(wavBuffer: Buffer): WaveformData {
    try {
      const wav = new WaveFile(wavBuffer);
      const samples = wav.getSamples(false, Int16Array);
      
      // Downsample for thumbnail (take every nth sample)
      const targetLength = 800; // Target number of peaks for thumbnail
      const step = Math.max(1, Math.floor(samples.length / targetLength));
      
      const peaks: number[] = [];
      for (let i = 0; i < samples.length; i += step) {
        const chunk = samples.slice(i, i + step);
        const max = Math.max(...Array.from(chunk).map(Math.abs));
        peaks.push(max / 32768); // Normalize to 0-1 range
      }

      return {
        peaks,
        length: peaks.length,
        bits: (wav as any).bitDepth || 16,
        sample_rate: (wav as any).fmt?.sampleRate || 44100,
      };
    } catch (error) {
      console.error('Failed to extract waveform data:', error);
      throw new Error('Failed to extract waveform data');
    }
  }

  /**
   * Create waveform image using Sharp
   */
  private async createWaveformImage(waveform: WaveformData, outputPath: string): Promise<void> {
    const width = 800;
    const height = 200;
    const backgroundColor = '#1a1a1a';
    const waveColor = '#00ff88';

    try {
      // Create SVG waveform
      const peakWidth = width / waveform.peaks.length;
      let svgPaths = '';

      waveform.peaks.forEach((peak, index) => {
        const x = index * peakWidth;
        const peakHeight = peak * height * 0.8; // 80% of height for peak
        const y1 = (height - peakHeight) / 2;
        const y2 = y1 + peakHeight;

        svgPaths += `<rect x="${x}" y="${y1}" width="${Math.max(1, peakWidth - 1)}" height="${peakHeight}" fill="${waveColor}" opacity="0.8"/>`;
      });

      const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
          ${svgPaths}
        </svg>
      `;

      // Convert SVG to PNG using Sharp
      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);
    } catch (error) {
      console.error('Failed to create waveform image:', error);
      throw new Error('Failed to create waveform image');
    }
  }

  /**
   * Delete audio file from storage
   */
  async deleteAudio(filePath: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Failed to delete audio: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to delete audio:', error);
      throw new Error(`Failed to delete audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete waveform image from storage
   */
  async deleteWaveform(waveformPath: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin.storage
        .from(this.waveformBucket)
        .remove([waveformPath]);

      if (error) {
        console.warn(`Failed to delete waveform: ${error.message}`);
      }
    } catch (error) {
      console.warn('Failed to delete waveform:', error);
    }
  }

  /**
   * Get audio file info without downloading
   */
  async getAudioInfo(filePath: string): Promise<{ size: number; lastModified: Date }> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .list('', {
          search: path.basename(filePath),
        });

      if (error || !data || data.length === 0) {
        throw new Error('Audio file not found');
      }

      const fileInfo = data[0];
      return {
        size: fileInfo.metadata?.size || 0,
        lastModified: new Date(fileInfo.updated_at || fileInfo.created_at),
      };
    } catch (error) {
      console.error('Failed to get audio info:', error);
      throw new Error(`Failed to get audio info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get audio stream with range request support for efficient streaming
   */
  async getAudioStream(fileUrl: string, range?: string): Promise<{
    stream: NodeJS.ReadableStream;
    fileSize: number;
    contentRange: string;
    statusCode: number;
  } | null> {
    try {
      // Extract file path from URL
      const url = new URL(fileUrl);
      const filePath = url.pathname.replace('/storage/v1/object/public/audio-samples/', '');

      // Get file info first
      const fileInfo = await this.getAudioInfo(filePath);
      const fileSize = fileInfo.size;

      if (!range) {
        // No range requested, return full file stream
        const { data, error } = await supabaseAdmin.storage
          .from(this.bucketName)
          .download(filePath);

        if (error || !data) {
          throw new Error('Failed to download audio file');
        }

        // Convert Blob to ReadableStream
        const stream = data.stream();
        return {
          stream: stream as NodeJS.ReadableStream,
          fileSize,
          contentRange: `bytes 0-${fileSize - 1}/${fileSize}`,
          statusCode: 200
        };
      }

      // Parse range header
      const rangeMatch = range.match(/bytes=(\d*)-(\d*)/);
      if (!rangeMatch) {
        throw new Error('Invalid range header');
      }

      const start = parseInt(rangeMatch[1]) || 0;
      const end = parseInt(rangeMatch[2]) || fileSize - 1;

      // Validate range
      if (start >= fileSize || end >= fileSize || start > end) {
        throw new Error('Range not satisfiable');
      }

      const chunkSize = end - start + 1;
      const contentRange = `bytes ${start}-${end}/${fileSize}`;

      // For range requests, we need to handle this differently
      // Since Supabase doesn't directly support range downloads,
      // we'll download the full file and create a partial stream
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .download(filePath);

      if (error || !data) {
        throw new Error('Failed to download audio file');
      }

      // Convert to buffer and slice the range
      const buffer = await data.arrayBuffer();
      const rangeBuffer = buffer.slice(start, end + 1);
      
      // Create readable stream from buffer slice
      const { Readable } = await import('stream');
      const stream = Readable.from(Buffer.from(rangeBuffer));

      return {
        stream,
        fileSize: chunkSize,
        contentRange,
        statusCode: 206 // Partial Content
      };

    } catch (error) {
      console.error('Failed to get audio stream:', error);
      return null;
    }
  }

  /**
   * Generate unique filename with timestamp and UUID
   */
  private generateUniqueFilename(originalFilename: string): string {
    const extension = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, extension)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50); // Limit length

    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);

    return `${baseName}_${timestamp}_${uuid}${extension}`;
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(filename: string): string {
    const extension = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
    };

    return mimeTypes[extension] || 'audio/mpeg';
  }
}

export const audioService = new AudioService();