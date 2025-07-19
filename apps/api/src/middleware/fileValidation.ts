import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface FileValidationOptions {
  allowedMimeTypes?: string[];
  maxFileSize?: number;
  allowedExtensions?: string[];
  virusScanEnabled?: boolean;
  checkMagicBytes?: boolean;
  requireAudioMetadata?: boolean;
}

interface ValidatedFile extends Express.Multer.File {
  isValid?: boolean;
  validationErrors?: string[];
  audioMetadata?: {
    duration?: number;
    bitrate?: number;
    format?: string;
    channels?: number;
    sampleRate?: number;
  };
}

const DEFAULT_OPTIONS: FileValidationOptions = {
  allowedMimeTypes: [
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/x-m4a',
    'audio/ogg',
    'audio/flac',
    'audio/webm'
  ],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedExtensions: ['.mp3', '.wav', '.mp4', '.m4a', '.ogg', '.flac', '.webm'],
  virusScanEnabled: process.env.NODE_ENV === 'production',
  checkMagicBytes: true,
  requireAudioMetadata: true
};

// Magic byte signatures for audio files
const AUDIO_MAGIC_BYTES: Record<string, Buffer[]> = {
  'audio/mpeg': [
    Buffer.from([0xFF, 0xFB]), // MP3
    Buffer.from([0xFF, 0xF3]), // MP3
    Buffer.from([0xFF, 0xF2]), // MP3
    Buffer.from([0x49, 0x44, 0x33]) // ID3 tag
  ],
  'audio/wav': [
    Buffer.from([0x52, 0x49, 0x46, 0x46]) // RIFF
  ],
  'audio/mp4': [
    Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]), // ftyp
    Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70])
  ],
  'audio/ogg': [
    Buffer.from([0x4F, 0x67, 0x67, 0x53]) // OggS
  ],
  'audio/flac': [
    Buffer.from([0x66, 0x4C, 0x61, 0x43]) // fLaC
  ]
};

const checkMagicBytes = (buffer: Buffer, mimeType: string): boolean => {
  const signatures = AUDIO_MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  
  return signatures.some(signature => 
    buffer.subarray(0, signature.length).equals(signature) ||
    buffer.indexOf(signature) !== -1
  );
};

const scanFileForViruses = async (filePath: string): Promise<boolean> => {
  if (!process.env.CLAMAV_ENABLED || process.env.NODE_ENV !== 'production') {
    return true; // Skip virus scanning in development
  }
  
  try {
    // Use ClamAV if available
    const { stdout } = await execAsync(`clamscan --no-summary ${filePath}`);
    return !stdout.includes('FOUND');
  } catch (error) {
    console.warn('Virus scanning failed, allowing file:', error);
    return true; // Fail open in case virus scanner is not available
  }
};

const extractAudioMetadata = async (filePath: string): Promise<any> => {
  try {
    // Use ffprobe to extract audio metadata
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
    );
    
    const metadata = JSON.parse(stdout);
    const audioStream = metadata.streams?.find((stream: any) => stream.codec_type === 'audio');
    
    if (!audioStream) {
      throw new Error('No audio stream found');
    }
    
    return {
      duration: parseFloat(metadata.format?.duration || 0),
      bitrate: parseInt(metadata.format?.bit_rate || 0),
      format: metadata.format?.format_name,
      channels: parseInt(audioStream.channels || 0),
      sampleRate: parseInt(audioStream.sample_rate || 0),
      codec: audioStream.codec_name
    };
  } catch (error) {
    throw new Error(`Failed to extract audio metadata: ${error}`);
  }
};

const validateFileContent = async (file: ValidatedFile, options: FileValidationOptions): Promise<void> => {
  const errors: string[] = [];
  
  // 1. Check file size
  if (options.maxFileSize && file.size > options.maxFileSize) {
    errors.push(`File size (${file.size} bytes) exceeds maximum allowed size (${options.maxFileSize} bytes)`);
  }
  
  // 2. Check MIME type
  if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
    errors.push(`MIME type '${file.mimetype}' is not allowed`);
  }
  
  // 3. Check file extension
  if (options.allowedExtensions) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!options.allowedExtensions.includes(ext)) {
      errors.push(`File extension '${ext}' is not allowed`);
    }
  }
  
  // 4. Check magic bytes if buffer is available
  if (options.checkMagicBytes && file.buffer) {
    if (!checkMagicBytes(file.buffer, file.mimetype)) {
      errors.push('File content does not match declared MIME type (magic byte mismatch)');
    }
  }
  
  // 5. Virus scanning
  if (options.virusScanEnabled && file.path) {
    const isClean = await scanFileForViruses(file.path);
    if (!isClean) {
      errors.push('File failed virus scan');
    }
  }
  
  // 6. Extract and validate audio metadata
  if (options.requireAudioMetadata && file.path) {
    try {
      const metadata = await extractAudioMetadata(file.path);
      
      // Validate audio properties
      if (metadata.duration > 3600) { // 1 hour max
        errors.push('Audio duration exceeds maximum allowed length (1 hour)');
      }
      
      if (metadata.duration < 0.1) { // 100ms minimum
        errors.push('Audio duration is too short (minimum 100ms)');
      }
      
      if (metadata.channels < 1 || metadata.channels > 8) {
        errors.push('Invalid number of audio channels');
      }
      
      if (metadata.sampleRate < 8000 || metadata.sampleRate > 192000) {
        errors.push('Invalid sample rate');
      }
      
      file.audioMetadata = metadata;
    } catch (error) {
      errors.push(`Audio validation failed: ${error}`);
    }
  }
  
  file.validationErrors = errors;
  file.isValid = errors.length === 0;
};

// Create multer configuration with security settings
export const createSecureMulterConfig = (options: FileValidationOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return multer({
    storage: multer.diskStorage({
      destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
        try {
          await fs.mkdir(uploadDir, { recursive: true });
          cb(null, uploadDir);
        } catch (error) {
          cb(error as Error, '');
        }
      },
      filename: (req, file, cb) => {
        // Generate secure filename
        const ext = path.extname(file.originalname);
        const basename = crypto.randomBytes(16).toString('hex');
        cb(null, `${basename}-${Date.now()}${ext}`);
      }
    }),
    limits: {
      fileSize: opts.maxFileSize,
      files: 1, // Only allow one file per upload
      fields: 10, // Limit form fields
      fieldNameSize: 100, // Limit field name size
      fieldSize: 1024 * 1024 // 1MB field size limit
    },
    fileFilter: (req, file, cb) => {
      // Basic validation before upload
      if (opts.allowedMimeTypes && !opts.allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error(`Invalid file type: ${file.mimetype}`));
      }
      
      const ext = path.extname(file.originalname).toLowerCase();
      if (opts.allowedExtensions && !opts.allowedExtensions.includes(ext)) {
        return cb(new Error(`Invalid file extension: ${ext}`));
      }
      
      // Check for suspicious filenames
      if (/[<>:"|?*\x00-\x1f]/.test(file.originalname)) {
        return cb(new Error('Filename contains invalid characters'));
      }
      
      cb(null, true);
    }
  });
};

// Middleware for comprehensive file validation
export const validateUploadedFile = (options: FileValidationOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const file = req.file as ValidatedFile;
    
    if (!file) {
      return res.status(400).json({
        error: 'No file uploaded',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      await validateFileContent(file, { ...DEFAULT_OPTIONS, ...options });
      
      if (!file.isValid) {
        // Clean up uploaded file
        if (file.path) {
          try {
            await fs.unlink(file.path);
          } catch (cleanupError) {
            console.error('Failed to cleanup invalid file:', cleanupError);
          }
        }
        
        return res.status(400).json({
          error: 'File validation failed',
          details: file.validationErrors,
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
      }
      
      // Add file info to request for later use
      req.validatedFile = file;
      next();
    } catch (error) {
      // Clean up file on error
      if (file.path) {
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          console.error('Failed to cleanup file after error:', cleanupError);
        }
      }
      
      console.error('File validation error:', error);
      return res.status(500).json({
        error: 'File validation failed',
        message: 'An error occurred during file validation',
        statusCode: 500,
        timestamp: new Date().toISOString()
      });
    }
  };
};

// Middleware to clean up temporary files after processing
export const cleanupTempFile = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Schedule file cleanup after response
      const file = req.validatedFile || req.file;
      if (file?.path) {
        setImmediate(async () => {
          try {
            await fs.unlink(file.path);
          } catch (error) {
            console.error('Failed to cleanup temporary file:', error);
          }
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      validatedFile?: ValidatedFile;
    }
  }
}