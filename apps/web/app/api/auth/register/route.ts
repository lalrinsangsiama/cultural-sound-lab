import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Register endpoint available. Use POST with email, password, and optional name.' 
  });
}

// Mock users database (in a real app, this would be in a database)
let mockUsers = [
  {
    id: '1',
    email: 'demo@culturalsoundlab.com',
    password: 'demo123',
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
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = {
      id: String(Date.now()), // Simple ID generation
      email,
      password, // In real app, this would be hashed
      name: name || email.split('@')[0],
      created_at: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    // Create mock session token
    const sessionToken = btoa(JSON.stringify({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }));

    // Return user data and session
    const response = NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}