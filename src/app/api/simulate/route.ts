// src/app/api/simulate/route.ts

import {NextResponse} from 'next/server'

/**
 * This is our main simulation API endpoint.
 * For the PoC, it will take a latitude and longitude and return a hardcoded
 * JSON response to prove that the frontend and backend are communicating.
 *
 * Example URL: /api/simulate?lat=40.7128&lon=-74.0060
 */
export async function GET(request: Request) {
  const {searchParams} = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  // Basic validation to ensure we received the coordinates
  if (!lat || !lon) {
    return NextResponse.json(
      {error: 'Latitude and longitude are required'},
      {status: 400},
    )
  }

  // --- In the future, this is where our real logic will go ---
  // 1. Call Hotspotty API to get hex data for the lat/lon.
  // 2. Call Helius API to get on-chain reward data for that area.
  // 3. Run the data through our V1 simulation model.
  // -----------------------------------------------------------

  // For now, we return a hardcoded "dummy" response for testing.
  const dummyResponse = {
    latitude: parseFloat(lat),
    longitude: parseFloat(lon),
    estimatedHNT_monthly: 15.5,
    estimatedUSD_monthly: 75.3,
    confidenceScore: 'High',
    contributingFactors: {
      nearbyHotspots: 7,
      avgEarningsNearby_HNT: 16.2,
      hexDensity: 'Optimal',
    },
  }

  return NextResponse.json(dummyResponse)
}
