import { NextRequest, NextResponse } from 'next/server';

// Mock users database (in a real app, this would be in a database)
const mockUsers = [
  {
    id: '1',
    email: 'demo@culturalsoundlab.com',
    password: 'demo123', // In real app, this would be hashed
    name: 'Demo User',
    created_at: new Date().toISOString(),
  },
  {
    id: '2', 
    email: 'admin@culturalsoundlab.com',
    password: 'admin123',
    name: 'Admin User',
    created_at: new Date().toISOString(),
  }
];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user (in real app, compare hashed passwords)
    const user = mockUsers.find(u => u.email === email && u.password === password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create mock session token
    const sessionToken = btoa(JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.name,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }));

    // Return user data and session
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      session: {
        access_token: sessionToken,
        expires_at: Date.now() + (24 * 60 * 60 * 1000),
      }
    });

    // Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}