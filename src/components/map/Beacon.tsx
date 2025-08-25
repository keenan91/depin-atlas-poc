'use client'

import {useEffect, useState} from 'react'
import {useMap} from 'react-leaflet'

export default function Beacon({
  lat,
  lon,
}: {
  lat: number | null
  lon: number | null
}) {
  const map = useMap()
  const [p, setP] = useState<{x: number; y: number} | null>(null)

  // Inject styles once
  useEffect(() => {
    const styleId = 'beacon-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.innerHTML = `
        .beacon-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 800;
        }
        .beacon {
          position: absolute;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
        }
        .beacon::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background: radial-gradient(circle, #8b5cf6 0%, #7c3aed 100%);
          border: 2px solid white;
          border-radius: 50%;
          box-shadow:
            0 0 0 1px rgba(139, 92, 246, 0.4),
            0 2px 8px rgba(139, 92, 246, 0.5),
            0 4px 20px rgba(139, 92, 246, 0.3);
          animation: beacon-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .beacon::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          border: 2px solid rgba(139, 92, 246, 0.4);
          border-radius: 50%;
          animation: beacon-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes beacon-glow {
          0%, 100% {
            box-shadow:
              0 0 0 1px rgba(139, 92, 246, 0.4),
              0 2px 8px rgba(139, 92, 246, 0.5),
              0 4px 20px rgba(139, 92, 246, 0.3);
          }
          50% {
            box-shadow:
              0 0 0 1px rgba(139, 92, 246, 0.6),
              0 2px 12px rgba(139, 92, 246, 0.7),
              0 4px 30px rgba(139, 92, 246, 0.5);
          }
        }
        @keyframes beacon-pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.6);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  // Track pixel position for the given lat/lon
  useEffect(() => {
    if (lat == null || lon == null) {
      setP(null)
      return
    }

    const update = () => {
      const pt = map.latLngToContainerPoint([lat, lon])
      setP({x: pt.x, y: pt.y})
    }

    update()
    map.on('move', update)
    map.on('zoom', update)
    map.on('resize', update)

    // IMPORTANT: do not return the Map; just perform side effects
    return () => {
      map.off('move', update)
      map.off('zoom', update)
      map.off('resize', update)
    }
  }, [map, lat, lon])

  if (!p) return null

  return (
    <div className="beacon-layer">
      <span className="beacon" style={{left: p.x, top: p.y}} />
    </div>
  )
}
