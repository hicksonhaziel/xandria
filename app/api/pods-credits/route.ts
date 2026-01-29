import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const network = searchParams.get('network') || 'devnet';

    // Get the appropriate endpoint
    const endpoint = network === 'mainnet'
      ? process.env.NEXT_PUBLIC_XANDEUM_MAINNET_CREDIT_ENDPOINT
      : process.env.NEXT_PUBLIC_XANDEUM_DEVNET_CREDIT_ENDPOINT;

    if (!endpoint) {
      return NextResponse.json(
        { error: `${network.toUpperCase()} credit endpoint not configured` },
        { status: 500 }
      );
    }

    const response = await fetch(endpoint, {
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
    
    return NextResponse.json(
      { ...data, network },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from upstream API' },
      { status: 500 }
    );
  }
}