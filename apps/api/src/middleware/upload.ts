import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure storage
const storage = multer.memoryStorage();

// File filter for audio files
const audioFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'audio/mpeg',
    'audio/wav',
    'audio/flac',
    'audio/aac',
    'audio/ogg',
    'audio/mp3',
    'audio/x-wav',
    'audio/x-flac'
  ];

  const allowedExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'));
  }
};

// Configure multer
export const uploadAudio = multer({
  storage: storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1, // Only one file at a time
  },
});

// Generate unique filename for uploads
export const generateUniqueFilename = (originalName: string): string => {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const uuid = uuidv4();
  return `${sanitizedBaseName}_${uuid}${extension}`;
};

// Helper function to get file metadata
export const getAudioMetadata = (file: Express.Multer.File) => {
  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    buffer: file.buffer,
  };
};