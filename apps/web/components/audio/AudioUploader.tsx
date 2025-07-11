"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileAudio, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AudioUploaderProps, AudioUploadProgress } from "@/lib/types/audio";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const isValidAudioFile = (file: File, allowedExtensions: string[]): boolean => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return allowedExtensions.includes(extension || '');
};

const generateFileId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export default function AudioUploader({
  onUpload,
  acceptedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  maxFiles = 5,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  allowedExtensions = ['mp3', 'wav', 'ogg', 'm4a'],
  disabled = false,
  className,
}: AudioUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<AudioUploadProgress[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((files: FileList): { validFiles: File[]; errors: string[] } => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      // Check file type
      if (!isValidAudioFile(file, allowedExtensions)) {
        errors.push(`${file.name}: Invalid file type. Supported formats: ${allowedExtensions.join(', ')}`);
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File size exceeds ${formatFileSize(maxFileSize)} limit`);
        return;
      }

      validFiles.push(file);
    });

    // Check max files limit
    if (validFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return { validFiles: validFiles.slice(0, maxFiles), errors };
    }

    return { validFiles, errors };
  }, [allowedExtensions, maxFileSize, maxFiles]);

  const simulateUpload = async (file: File): Promise<void> => {
    const fileId = generateFileId();
    const progress: AudioUploadProgress = {
      fileId,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    };

    setUploadProgress(prev => [...prev, progress]);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(prev => 
        prev.map(p => 
          p.fileId === fileId 
            ? { ...p, progress: i, status: i === 100 ? 'processing' : 'uploading' }
            : p
        )
      );
    }

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));
    setUploadProgress(prev => 
      prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'completed' }
          : p
      )
    );
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (disabled) return;

    setErrors([]);
    const { validFiles, errors } = validateFiles(files);

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    setIsUploading(true);

    try {
      // Simulate uploading each file
      await Promise.all(validFiles.map(file => simulateUpload(file)));
      
      // Call the onUpload callback with valid files
      onUpload(validFiles);
    } catch (error) {
      console.error('Upload failed:', error);
      setErrors(['Upload failed. Please try again.']);
    } finally {
      setIsUploading(false);
    }
  }, [disabled, validateFiles, onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [disabled, handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const removeUploadedFile = useCallback((fileId: string) => {
    setUploadProgress(prev => prev.filter(p => p.fileId !== fileId));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "relative border-2 border-dashed transition-colors",
          isDragOver && !disabled ? "border-primary bg-primary/5" : "border-gray-300",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50",
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-gray-400" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold mb-2">
            {isUploading ? 'Uploading...' : 'Upload Audio Files'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            Drag and drop your audio files here, or click to browse
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {allowedExtensions.map((ext) => (
              <Badge key={ext} variant="secondary" className="text-xs">
                .{ext}
              </Badge>
            ))}
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Max {maxFiles} files • {formatFileSize(maxFileSize)} per file</p>
          </div>
        </div>
      </Card>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearErrors}
              className="mt-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Upload Progress</h4>
          <div className="space-y-3">
            {uploadProgress.map((progress) => (
              <div key={progress.fileId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileAudio className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium truncate">
                      {progress.fileName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {progress.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {progress.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    {progress.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadedFile(progress.fileId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Progress value={progress.progress} className="flex-1" />
                  <span className="text-xs text-gray-500 w-12">
                    {progress.status === 'completed' ? 'Done' : 
                     progress.status === 'processing' ? 'Processing' : 
                     progress.status === 'error' ? 'Error' : 
                     `${progress.progress}%`}
                  </span>
                </div>
                
                {progress.error && (
                  <p className="text-xs text-red-500">{progress.error}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}