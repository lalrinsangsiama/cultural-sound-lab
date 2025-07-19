import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Map audio IDs to actual file paths
    const audioFiles: Record<string, string> = {
      'mizo-khuang-01': 'mizo-khuang-01.mp4',
      'mizo-khuang-02': 'mizo-khuang-02.mp4',
      'mizo-khuang-03': 'mizo-khuang-03.mp4',
      'mizo-darbu-01': 'mizo-darbu-01.mp4',
      'mizo-darbu-02': 'mizo-darbu-02.mp4',
      'mizo-darbu-03': 'mizo-darbu-03.mp4',
      'mizo-bengbung-01': 'mizo-bengbung-01.mp4',
      'mizo-bengbung-02': 'mizo-bengbung-02.mp4',
    };

    const fileName = audioFiles[id];
    if (!fileName) {
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 }
      );
    }

    // Get the file path - audio files are in the assets directory
    const filePath = path.join(process.cwd(), 'assets', 'sample-audio', fileName);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Audio file not found on disk' },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Set appropriate headers for audio streaming
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mp4');
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=3600');
    
    // Handle range requests for audio seeking
    const range = request.headers.get('range');
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0] || '0', 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileBuffer.length - 1;
      const chunksize = (end - start) + 1;
      const chunk = fileBuffer.slice(start, end + 1);
      
      headers.set('Content-Range', `bytes ${start}-${end}/${fileBuffer.length}`);
      headers.set('Content-Length', chunksize.toString());
      
      return new NextResponse(chunk, {
        status: 206,
        headers
      });
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error serving audio file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}