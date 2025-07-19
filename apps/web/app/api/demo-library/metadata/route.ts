import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const metadataPath = join(process.cwd(), '../../assets/demo-library/demo-metadata.json')
    const metadataContent = await readFile(metadataPath, 'utf-8')
    const metadata = JSON.parse(metadataContent)

    return NextResponse.json(metadata, {
      headers: {
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    })
  } catch (error) {
    console.error('Error loading demo metadata:', error)
    return NextResponse.json(
      { error: 'Failed to load demo metadata' },
      { status: 500 }
    )
  }
}