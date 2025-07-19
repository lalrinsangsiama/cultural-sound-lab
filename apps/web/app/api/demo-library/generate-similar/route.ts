import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { demoId } = await request.json()

    if (!demoId) {
      return NextResponse.json(
        { error: 'Demo ID is required' },
        { status: 400 }
      )
    }

    // In a real implementation, this would trigger the AI generation service
    // For now, we'll simulate the process
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generate/similar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_demo_id: demoId,
        style: 'similar',
        duration: '30s'
      })
    })

    if (!response.ok) {
      throw new Error('Generation service unavailable')
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Similar track generation started',
      trackId: result.track_id || `generated_${Date.now()}`
    })

  } catch (error) {
    console.error('Error generating similar track:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to generate similar track. Please try again later.'
    }, { status: 500 })
  }
}