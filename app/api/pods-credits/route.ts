import { NextResponse } from 'next/server';

export async function GET() {
  try {

    // environment variable
    const devnetEndpoint = process.env.NEXT_PUBLIC_XANDEUM_DEVNET_CREDIT_ENDPOINT;

    if (!devnetEndpoint) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_XANDEUM_DEVNET_CREDIT_ENDPOINT not configured' },
        { status: 500 }
      );
    }
    const response = await fetch(devnetEndpoint, {
      method: 'GET', 
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from upstream API' },
      { status: 500 }
    );
  }
}