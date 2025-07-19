import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/')
    const fullPath = join(process.cwd(), '../../assets/demo-library', filePath)

    // Security check: ensure the path is within the demo-library directory
    if (!fullPath.includes('demo-library')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if file exists
    if (!existsSync(fullPath)) {
      // Try to serve from the existing demo-audio directory as fallback
      const fallbackPath = join(process.cwd(), '../../assets/demo-audio', params.path[params.path.length - 1] || '')
      
      if (existsSync(fallbackPath)) {
        const fileBuffer = await readFile(fallbackPath)
        const fileStats = await stat(fallbackPath)
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': fileStats.size.toString(),
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            'Accept-Ranges': 'bytes'
          }
        })
      }
      
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    const fileBuffer = await readFile(fullPath)
    const fileStats = await stat(fullPath)
    
    // Determine content type based on file extension
    const contentType = filePath.endsWith('.mp3') ? 'audio/mpeg' :
                       filePath.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' :
                       'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStats.size.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Accept-Ranges': 'bytes'
      }
    })

  } catch (error) {
    console.error('Error serving demo audio:', error)
    return NextResponse.json(
      { error: 'Failed to serve audio file' },
      { status: 500 }
    )
  }
}