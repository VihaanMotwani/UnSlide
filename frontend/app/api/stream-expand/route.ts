import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendBaseUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    const backendUrl = `${backendBaseUrl}/api/v1/expand`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // Important: disable caching for the fetch itself
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Backend error: ${errorText}` }, { status: response.status });
    }

    if (!response.body) {
        return NextResponse.json({ error: 'No response body from backend' }, { status: 500 });
    }

    // Pass the stream directly
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
