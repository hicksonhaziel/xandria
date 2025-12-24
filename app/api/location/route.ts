// app/api/location/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LocationService } from '@/app/lib/location-service';

export const runtime = 'nodejs';

// GET /api/location?ip=1.2.3.4 - Get single location
// GET /api/location?ips=1.2.3.4,5.6.7.8 - Get multiple locations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ip = searchParams.get('ip');
    const ipsParam = searchParams.get('ips');

    // Single IP request
    if (ip) {
      const location = await LocationService.getLocation(ip);
      
      if (!location) {
        return NextResponse.json(
          { error: 'Failed to fetch location' },
          { status: 404 }
        );
      }

      return NextResponse.json(location);
    }

    // Multiple IPs request
    if (ipsParam) {
      const ips = ipsParam.split(',').map(s => s.trim()).filter(Boolean);
      
      if (ips.length === 0) {
        return NextResponse.json(
          { error: 'No valid IPs provided' },
          { status: 400 }
        );
      }

      if (ips.length > 50) {
        return NextResponse.json(
          { error: 'Maximum 50 IPs per request' },
          { status: 400 }
        );
      }

      const locations = await LocationService.getLocations(ips);
      
      // Convert Map to object for JSON response
      const result: Record<string, any> = {};
      locations.forEach((value, key) => {
        result[key] = value;
      });

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Missing ip or ips parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Location API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/location - Batch request with body
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ips } = body;

    if (!Array.isArray(ips) || ips.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ips must be a non-empty array' },
        { status: 400 }
      );
    }

    if (ips.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 IPs per request' },
        { status: 400 }
      );
    }

    const locations = await LocationService.getLocations(ips);
    
    // Convert Map to object
    const result: Record<string, any> = {};
    locations.forEach((value, key) => {
      result[key] = value;
    });

    return NextResponse.json({
      count: locations.size,
      locations: result,
    });
  } catch (error) {
    console.error('Location API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/location - Clear cache (admin only - add auth as needed)
export async function DELETE(req: NextRequest) {
  try {
    // TODO: Add authentication check here
    
    const cleared = await LocationService.clearLocationCache();
    
    return NextResponse.json({
      success: true,
      cleared,
      message: `Cleared ${cleared} cached locations`,
    });
  } catch (error) {
    console.error('Location API DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}