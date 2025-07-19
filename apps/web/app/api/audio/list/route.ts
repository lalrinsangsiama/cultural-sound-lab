import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const audioDir = path.join(process.cwd(), 'assets', 'sample-audio');
    
    if (!fs.existsSync(audioDir)) {
      return NextResponse.json({
        error: 'Audio directory not found',
        path: audioDir
      }, { status: 404 });
    }

    const files = fs.readdirSync(audioDir);
    const audioFiles = files.filter(file => 
      file.endsWith('.mp4') || file.endsWith('.mp3') || file.endsWith('.wav')
    );

    return NextResponse.json({
      audioDirectory: audioDir,
      files: audioFiles,
      count: audioFiles.length
    });

  } catch (error) {
    console.error('Error listing audio files:', error);
    return NextResponse.json({
      error: 'Failed to list audio files',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}