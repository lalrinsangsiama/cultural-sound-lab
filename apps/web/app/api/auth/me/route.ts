import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    try {
      // Decode session token
      const sessionData = JSON.parse(atob(sessionToken));
      
      // Check if session is expired
      if (Date.now() > sessionData.expires) {
        return NextResponse.json(
          { error: 'Session expired' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        user: {
          id: sessionData.userId,
          email: sessionData.email,
          name: sessionData.name,
        }
      });
    } catch (decodeError) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}