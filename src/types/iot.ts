export type H3Row = {
  date: string
  hex: string
  poc_rewards: number
  dc_rewards: number
  total_rewards: number
  hotspot_count: number
  density_k1: number
  ma_3d_total: number
  ma_3d_poc: number
  transmit_scale_approx: number
  lat?: number
  lon?: number
  forecasted_poc?: number
  forecasted_dc?: number
  forecasted_total?: number
  lower_band?: number
  upper_band?: number
}

export type ApiResponse = {
  ok: boolean
  rows: H3Row[]
  totals?: {
    rows: number
    poc_rewards: number
    dc_rewards: number
    total_rewards: number
  }
}

export type Mode = 'observed' | 'forecast'
