import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://xandria-ai-rag.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    let endpoint = '';
    let method = 'POST';

    switch (action) {
      case 'chat':
        endpoint = '/api/chat';
        break;
      case 'regenerate':
        endpoint = '/api/chat/regenerate';
        break;
      case 'rate':
        endpoint = '/api/chat/rate';
        method = 'PATCH';
        break;
      case 'history':
        endpoint = `/api/history/${data.session_id}`;
        method = 'GET';
        break;
      case 'sessions':
        endpoint = `/api/sessions/${data.wallet_address}`;
        method = 'GET';
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    // Handle non-JSON responses or errors
    let result;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      return NextResponse.json(
        { success: false, error: `Invalid response: ${text}` },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.detail || result.error || 'API request failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sessionId = searchParams.get('session_id');
    const walletAddress = searchParams.get('wallet_address');

    let endpoint = '';

    if (action === 'history' && sessionId) {
      endpoint = `/api/history/${sessionId}`;
    } else if (action === 'sessions' && walletAddress) {
      endpoint = `/api/sessions/${walletAddress}`;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    let result;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      return NextResponse.json(
        { success: false, error: `Invalid response: ${text}` },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.detail || result.error || 'API request failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
