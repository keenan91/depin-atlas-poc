'use client'
import NextDynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const MapCanvas = NextDynamic(() => import('./MapCanvas'), {ssr: false})

export default function Page() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-3">IoT Hex Map (H3)</h1>
      <MapCanvas />
    </div>
  )
}
