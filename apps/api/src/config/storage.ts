import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export interface StorageConfig {
  provider: 'supabase' | 's3' | 'minio';
  fallbackProvider?: 'supabase' | 's3' | 'minio';
  supabase?: {
    url: string;
    key: string;
    bucket: string;
  };
  s3?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    endpoint?: string; // For MinIO
    forcePathStyle?: boolean; // For MinIO
  };
  cdn?: {
    enabled: boolean;
    baseUrl: string;
    cacheTtl: number;
  };
}

export interface UploadOptions {
  filename?: string;
  contentType?: string;
  isPublic?: boolean;
  bucket?: string;
  path?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  url: string;
  key: string;
  provider: string;
  size: number;
  contentType?: string;
  cdnUrl?: string;
}

export interface SignedUrlOptions {
  expiresIn?: number; // seconds
  responseContentType?: string;
  responseContentDisposition?: string;
}

class StorageService {
  private s3Client?: S3Client;
  private supabaseClient?: SupabaseClient;
  private config: StorageConfig;

  constructor() {
    this.config = this.loadConfig();
    this.initializeClients();
  }

  private loadConfig(): StorageConfig {
    const provider = (process.env.STORAGE_PROVIDER || 'supabase') as 'supabase' | 's3' | 'minio';
    const fallbackProvider = process.env.STORAGE_FALLBACK_PROVIDER as 'supabase' | 's3' | 'minio';

    return {
      provider,
      fallbackProvider,
      supabase: {
        url: process.env.SUPABASE_URL!,
        key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        bucket: process.env.SUPABASE_AUDIO_BUCKET || 'audio-samples',
      },
      s3: {
        region: process.env.AWS_REGION || process.env.MINIO_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.MINIO_SECRET_KEY!,
        bucket: process.env.S3_BUCKET || process.env.MINIO_BUCKET || 'cultural-audio',
        endpoint: process.env.MINIO_ENDPOINT || process.env.S3_ENDPOINT,
        forcePathStyle: process.env.MINIO_FORCE_PATH_STYLE === 'true' || provider === 'minio',
      },
      cdn: {
        enabled: process.env.CDN_ENABLED === 'true',
        baseUrl: process.env.CDN_BASE_URL || '',
        cacheTtl: parseInt(process.env.CDN_CACHE_TTL || '86400'), // 24 hours
      },
    };
  }

  private initializeClients(): void {
    // Initialize S3 client (works for both AWS S3 and MinIO)
    if (this.config.s3?.accessKeyId && this.config.s3?.secretAccessKey) {
      this.s3Client = new S3Client({
        region: this.config.s3.region,
        credentials: {
          accessKeyId: this.config.s3.accessKeyId,
          secretAccessKey: this.config.s3.secretAccessKey,
        },
        endpoint: this.config.s3.endpoint,
        forcePathStyle: this.config.s3.forcePathStyle,
      });

      logger.info({ 
        provider: this.config.provider,
        endpoint: this.config.s3.endpoint,
        bucket: this.config.s3.bucket 
      }, 'S3/MinIO client initialized');
    }

    // Initialize Supabase client
    if (this.config.supabase?.url && this.config.supabase?.key) {
      this.supabaseClient = createClient(
        this.config.supabase.url,
        this.config.supabase.key,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      logger.info({ 
        bucket: this.config.supabase.bucket 
      }, 'Supabase storage client initialized');
    }
  }

  /**
   * Upload a file using the configured storage provider
   */
  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const filename = options.filename || `file_${uuidv4()}`;
    const key = options.path ? `${options.path}/${filename}` : filename;

    try {
      // Try primary provider first
      return await this.uploadWithProvider(buffer, key, options, this.config.provider);
    } catch (error) {
      logger.warn({ error, provider: this.config.provider }, 'Primary storage provider failed, trying fallback');

      // Try fallback provider if available
      if (this.config.fallbackProvider && this.config.fallbackProvider !== this.config.provider) {
        try {
          return await this.uploadWithProvider(buffer, key, options, this.config.fallbackProvider);
        } catch (fallbackError) {
          logger.error({ fallbackError, provider: this.config.fallbackProvider }, 'Fallback storage provider also failed');
          throw fallbackError;
        }
      }

      throw error;
    }
  }

  private async uploadWithProvider(
    buffer: Buffer,
    key: string,
    options: UploadOptions,
    provider: 'supabase' | 's3' | 'minio'
  ): Promise<UploadResult> {
    switch (provider) {
      case 'supabase':
        return this.uploadToSupabase(buffer, key, options);
      case 's3':
      case 'minio':
        return this.uploadToS3(buffer, key, options);
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  }

  private async uploadToSupabase(buffer: Buffer, key: string, options: UploadOptions): Promise<UploadResult> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    const bucket = options.bucket || this.config.supabase!.bucket;

    const { data, error } = await this.supabaseClient.storage
      .from(bucket)
      .upload(key, buffer, {
        contentType: options.contentType,
        upsert: true,
        metadata: options.metadata,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data: urlData } = this.supabaseClient.storage
      .from(bucket)
      .getPublicUrl(key);

    const result: UploadResult = {
      url: urlData.publicUrl,
      key,
      provider: 'supabase',
      size: buffer.length,
      contentType: options.contentType,
    };

    // Add CDN URL if enabled
    if (this.config.cdn?.enabled && this.config.cdn.baseUrl) {
      result.cdnUrl = `${this.config.cdn.baseUrl}/${bucket}/${key}`;
    }

    return result;
  }

  private async uploadToS3(buffer: Buffer, key: string, options: UploadOptions): Promise<UploadResult> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const bucket = options.bucket || this.config.s3!.bucket;

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: options.contentType,
        ACL: options.isPublic ? 'public-read' : 'private',
        Metadata: options.metadata,
      },
    });

    const result = await upload.done();

    const baseUrl = this.config.s3?.endpoint 
      ? `${this.config.s3.endpoint}/${bucket}`
      : `https://${bucket}.s3.${this.config.s3?.region}.amazonaws.com`;

    const url = `${baseUrl}/${key}`;

    const uploadResult: UploadResult = {
      url,
      key,
      provider: this.config.provider === 'minio' ? 'minio' : 's3',
      size: buffer.length,
      contentType: options.contentType,
    };

    // Add CDN URL if enabled
    if (this.config.cdn?.enabled && this.config.cdn.baseUrl) {
      uploadResult.cdnUrl = `${this.config.cdn.baseUrl}/${key}`;
    }

    return uploadResult;
  }

  /**
   * Generate a signed URL for private file access
   */
  async getSignedUrl(key: string, options: SignedUrlOptions = {}): Promise<string> {
    const expiresIn = options.expiresIn || 3600; // 1 hour default

    try {
      return await this.getSignedUrlWithProvider(key, options, this.config.provider);
    } catch (error) {
      logger.warn({ error, provider: this.config.provider }, 'Primary provider failed for signed URL, trying fallback');

      if (this.config.fallbackProvider && this.config.fallbackProvider !== this.config.provider) {
        return this.getSignedUrlWithProvider(key, options, this.config.fallbackProvider);
      }

      throw error;
    }
  }

  private async getSignedUrlWithProvider(
    key: string,
    options: SignedUrlOptions,
    provider: 'supabase' | 's3' | 'minio'
  ): Promise<string> {
    switch (provider) {
      case 'supabase':
        return this.getSupabaseSignedUrl(key, options);
      case 's3':
      case 'minio':
        return this.getS3SignedUrl(key, options);
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  }

  private async getSupabaseSignedUrl(key: string, options: SignedUrlOptions): Promise<string> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await this.supabaseClient.storage
      .from(this.config.supabase!.bucket)
      .createSignedUrl(key, options.expiresIn || 3600);

    if (error) {
      throw new Error(`Supabase signed URL generation failed: ${error.message}`);
    }

    return data.signedUrl;
  }

  private async getS3SignedUrl(key: string, options: SignedUrlOptions): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const command = new GetObjectCommand({
      Bucket: this.config.s3!.bucket,
      Key: key,
      ResponseContentType: options.responseContentType,
      ResponseContentDisposition: options.responseContentDisposition,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: options.expiresIn || 3600,
    });
  }

  /**
   * Delete a file from storage
   */
  async delete(key: string, bucket?: string): Promise<void> {
    try {
      await this.deleteWithProvider(key, bucket, this.config.provider);
    } catch (error) {
      logger.warn({ error, provider: this.config.provider }, 'Primary provider failed for delete, trying fallback');

      if (this.config.fallbackProvider && this.config.fallbackProvider !== this.config.provider) {
        await this.deleteWithProvider(key, bucket, this.config.fallbackProvider);
      } else {
        throw error;
      }
    }
  }

  private async deleteWithProvider(key: string, bucket: string | undefined, provider: 'supabase' | 's3' | 'minio'): Promise<void> {
    switch (provider) {
      case 'supabase':
        return this.deleteFromSupabase(key, bucket);
      case 's3':
      case 'minio':
        return this.deleteFromS3(key, bucket);
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  }

  private async deleteFromSupabase(key: string, bucket?: string): Promise<void> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    const bucketName = bucket || this.config.supabase!.bucket;
    const { error } = await this.supabaseClient.storage
      .from(bucketName)
      .remove([key]);

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  private async deleteFromS3(key: string, bucket?: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const bucketName = bucket || this.config.s3!.bucket;
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Check if a file exists
   */
  async exists(key: string, bucket?: string): Promise<boolean> {
    try {
      return await this.existsWithProvider(key, bucket, this.config.provider);
    } catch (error) {
      if (this.config.fallbackProvider && this.config.fallbackProvider !== this.config.provider) {
        return this.existsWithProvider(key, bucket, this.config.fallbackProvider);
      }
      return false;
    }
  }

  private async existsWithProvider(key: string, bucket: string | undefined, provider: 'supabase' | 's3' | 'minio'): Promise<boolean> {
    switch (provider) {
      case 'supabase':
        return this.existsInSupabase(key, bucket);
      case 's3':
      case 'minio':
        return this.existsInS3(key, bucket);
      default:
        return false;
    }
  }

  private async existsInSupabase(key: string, bucket?: string): Promise<boolean> {
    if (!this.supabaseClient) {
      return false;
    }

    const bucketName = bucket || this.config.supabase!.bucket;
    const { data, error } = await this.supabaseClient.storage
      .from(bucketName)
      .list(path.dirname(key), {
        search: path.basename(key),
      });

    return !error && data && data.length > 0;
  }

  private async existsInS3(key: string, bucket?: string): Promise<boolean> {
    if (!this.s3Client) {
      return false;
    }

    try {
      const bucketName = bucket || this.config.s3!.bucket;
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get storage configuration
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * Generate a unique filename
   */
  generateUniqueFilename(originalName: string, prefix?: string): string {
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uuid = uuidv4();
    const filename = `${sanitizedBaseName}_${uuid}${extension}`;
    
    return prefix ? `${prefix}_${filename}` : filename;
  }

  /**
   * Get CDN URL if available
   */
  getCdnUrl(key: string): string | null {
    if (!this.config.cdn?.enabled || !this.config.cdn.baseUrl) {
      return null;
    }

    return `${this.config.cdn.baseUrl}/${key}`;
  }

  /**
   * Health check for storage providers
   */
  async healthCheck(): Promise<{
    primary: boolean;
    fallback: boolean;
    provider: string;
    fallbackProvider?: string;
  }> {
    const result = {
      primary: false,
      fallback: false,
      provider: this.config.provider,
      fallbackProvider: this.config.fallbackProvider,
    };

    // Test primary provider
    try {
      const testKey = `health-check-${Date.now()}.txt`;
      const testBuffer = Buffer.from('health check');
      await this.uploadWithProvider(testBuffer, testKey, { contentType: 'text/plain' }, this.config.provider);
      await this.deleteWithProvider(testKey, undefined, this.config.provider);
      result.primary = true;
    } catch (error) {
      logger.warn({ error, provider: this.config.provider }, 'Primary storage provider health check failed');
    }

    // Test fallback provider
    if (this.config.fallbackProvider && this.config.fallbackProvider !== this.config.provider) {
      try {
        const testKey = `health-check-fallback-${Date.now()}.txt`;
        const testBuffer = Buffer.from('health check fallback');
        await this.uploadWithProvider(testBuffer, testKey, { contentType: 'text/plain' }, this.config.fallbackProvider);
        await this.deleteWithProvider(testKey, undefined, this.config.fallbackProvider);
        result.fallback = true;
      } catch (error) {
        logger.warn({ error, provider: this.config.fallbackProvider }, 'Fallback storage provider health check failed');
      }
    } else {
      result.fallback = true; // No fallback configured
    }

    return result;
  }
}

// Export singleton instance
export const storageService = new StorageService();

// Types are already exported above as interfaces