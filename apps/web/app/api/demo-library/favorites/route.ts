import { NextRequest, NextResponse } from 'next/server'

// In a real implementation, this would use a database and user authentication
// For now, we'll use a simple in-memory store per session
const favoritesStore = new Map<string, Set<string>>()

function getSessionId(request: NextRequest): string {
  // In a real app, this would be the authenticated user ID
  // For demo purposes, we'll use a simple session identifier
  return request.headers.get('x-session-id') || 'anonymous'
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = getSessionId(request)
    const userFavorites = favoritesStore.get(sessionId) || new Set()

    return NextResponse.json({
      favorites: Array.from(userFavorites)
    })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { demoId } = await request.json()
    
    if (!demoId) {
      return NextResponse.json(
        { error: 'Demo ID is required' },
        { status: 400 }
      )
    }

    const sessionId = getSessionId(request)
    
    if (!favoritesStore.has(sessionId)) {
      favoritesStore.set(sessionId, new Set())
    }
    
    const userFavorites = favoritesStore.get(sessionId)!
    userFavorites.add(demoId)

    return NextResponse.json({
      success: true,
      message: 'Added to favorites'
    })
  } catch (error) {
    console.error('Error adding to favorites:', error)
    return NextResponse.json(
      { error: 'Failed to add to favorites' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { demoId } = await request.json()
    
    if (!demoId) {
      return NextResponse.json(
        { error: 'Demo ID is required' },
        { status: 400 }
      )
    }

    const sessionId = getSessionId(request)
    const userFavorites = favoritesStore.get(sessionId)
    
    if (userFavorites) {
      userFavorites.delete(demoId)
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from favorites'
    })
  } catch (error) {
    console.error('Error removing from favorites:', error)
    return NextResponse.json(
      { error: 'Failed to remove from favorites' },
      { status: 500 }
    )
  }
}