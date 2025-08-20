'use client'
import NextDynamic from 'next/dynamic'
import {useEffect} from 'react'
import DePINLogo from '@/components/brand/DePINLogo'
export const dynamic = 'force-dynamic'

const MapCanvas = NextDynamic(
  () => import('../../../components/map/MapCanvas'),
  {ssr: false},
)

export default function Page() {
  useEffect(() => {
    document.documentElement.classList.add('theme-aurora')
  }, [])

  return (
    <div className="p-6 space-y-4">
      <DePINLogo />
      {/* Map */}
      <MapCanvas />
    </div>
  )
}
