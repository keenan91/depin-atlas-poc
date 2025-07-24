export type SimulationResponse = {
  latitude: number
  longitude: number
  estimatedHNT_monthly: number
  estimatedUSD_monthly: number
  confidenceScore: string
  contributingFactors: {
    nearbyHotspots: number
    avgEarningsNearby_HNT: number
    hexDensity: string
  }
}
