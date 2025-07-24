import axios from 'axios'

const BASE_URL =
  process.env.RELAY_BASE_URL ?? 'https://api.relaywireless.com/v1'
const API_KEY = process.env.RELAY_API_KEY

if (!API_KEY) {
  throw new Error('RELAY_API_KEY is not set')
}

export const relay = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    Accept: 'application/json',
  },
})

export type Pagination = {
  count: number
  total_pages: number
  current_page: number
  next_page: number | null
  prev_page: number | null
}

export type ListResponse<T> = {
  meta: {pagination: Pagination}
  records: T[]
}

export type IoTRewardShare = {
  id: string
  reward_type: 'gateway_reward' | 'operational_reward' | 'unallocated_reward'
  start_period: string
  end_period: string
  reward_manifest: unknown | null
  reward_detail: {
    hotspot_key?: string
    beacon_amount?: number
    witness_amount?: number
    amount?: number
    // ... add the rest as you need them
  }
}

/** Single-page fetch */
export async function listIotRewardsOnce(params: {
  from: string
  to: string
  hotspot_key?: string
  reward_type?: string
  page?: number
}) {
  const {data} = await relay.get<ListResponse<IoTRewardShare>>(
    '/helium/l2/iot-reward-shares',
    {params},
  )
  return data
}

export async function listIotRewards(
  params: {
    from: string
    to: string
    hotspot_key?: string
    reward_type?: string
  },
  maxPages = 5, // <- bump later
): Promise<ListResponse<IoTRewardShare>> {
  let page = 1
  const all: IoTRewardShare[] = []
  let lastMeta: Pagination | null = null

  while (page && page <= maxPages) {
    const resp = await listIotRewardsOnce({...params, page})
    all.push(...resp.records)
    lastMeta = resp.meta.pagination
    page = resp.meta.pagination.next_page ?? 0
  }

  return {
    records: all,
    meta: {
      pagination: lastMeta ?? {
        count: all.length,
        total_pages: 1,
        current_page: 1,
        next_page: null,
        prev_page: null,
      },
    },
  }
}
