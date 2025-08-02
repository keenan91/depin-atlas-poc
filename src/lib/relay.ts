import axios from 'axios'

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
  }
}

export type MobileRewardShare = {
  id: string
  reward_type: string
  start_period: string // "YYYY-MM-DD 00:00:00 UTC"
  end_period: string // "YYYY-MM-DD 00:00:00 UTC"
  reward_manifest: unknown | null
  reward_detail: {
    hotspot_key?: string
    modeled_coverage_amount?: number
    data_transfer_amount?: number
    amount?: number
    formatted_modeled_coverage_amount?: string
    formatted_data_transfer_amount?: string
    [k: string]: unknown
  }
}

export function createRelay(apiKey: string) {
  const BASE_URL =
    process.env.RELAY_BASE_URL ?? 'https://api.relaywireless.com/v1'

  if (!apiKey) {
    throw new Error('RELAY_API_KEY is required')
  }

  return axios.create({
    baseURL: BASE_URL,
    timeout: 15_000,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  })
}

export async function listIotRewardsOnce(
  params: {
    from: string
    to: string
    hotspot_key?: string
    reward_type?: string
    page?: number
  },
  relayInstance: ReturnType<typeof createRelay>,
) {
  const {data} = await relayInstance.get<ListResponse<IoTRewardShare>>(
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
  maxPages = 5,
  relayInstance: ReturnType<typeof createRelay>,
): Promise<ListResponse<IoTRewardShare>> {
  let page = 1
  const all: IoTRewardShare[] = []
  let lastMeta: Pagination | null = null

  while (page && page <= maxPages) {
    const resp = await listIotRewardsOnce({...params, page}, relayInstance)
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

/* ----------------------------- MOBILE helpers ----------------------------- */

/**
 * Single-page fetch (MOBILE).
 * Tries a few likely paths and returns the first one that responds.
 */
export async function listMobileRewardsOnce(
  params: {
    from: string
    to: string
    hotspot_key?: string
    reward_type?: string
    page?: number
  },
  relayInstance: ReturnType<typeof createRelay>,
) {
  const candidatePaths = [
    '/helium/l2/mobile-reward-shares',
    '/helium/l2/rewards/mobile',
    '/helium/l2/mobile/rewards',
  ]

  let lastErr: unknown = null

  for (const p of candidatePaths) {
    try {
      const {data} = await relayInstance.get<ListResponse<MobileRewardShare>>(
        p,
        {
          params,
        },
      )
      if (data && Array.isArray((data as any).records)) {
        return data
      }

      const rows = (data as any)?.rows
      if (Array.isArray(rows)) {
        return {
          records: rows as MobileRewardShare[],
          meta: {
            pagination: {
              count: rows.length,
              total_pages: 1,
              current_page: params.page ?? 1,
              next_page: null,
              prev_page: null,
            },
          },
        }
      }
      if (Array.isArray(data)) {
        return {
          records: data as MobileRewardShare[],
          meta: {
            pagination: {
              count: (data as any[]).length,
              total_pages: 1,
              current_page: params.page ?? 1,
              next_page: null,
              prev_page: null,
            },
          },
        }
      }

      return {
        records: [],
        meta: {
          pagination: {
            count: 0,
            total_pages: 1,
            current_page: params.page ?? 1,
            next_page: null,
            prev_page: null,
          },
        },
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        lastErr = err
        continue
      }
      throw err
    }
  }

  throw lastErr ?? new Error('No MOBILE rewards endpoint matched')
}

export async function listMobileRewards(
  params: {
    from: string
    to: string
    hotspot_key?: string
    reward_type?: string
  },
  maxPages = 5,
  relayInstance: ReturnType<typeof createRelay>,
): Promise<ListResponse<MobileRewardShare>> {
  let page = 1
  const all: MobileRewardShare[] = []
  let lastMeta: Pagination | null = null

  while (page && page <= maxPages) {
    const resp = await listMobileRewardsOnce({...params, page}, relayInstance)
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
