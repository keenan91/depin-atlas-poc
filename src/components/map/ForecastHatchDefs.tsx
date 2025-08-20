'use client'

import {useEffect} from 'react'
import {useMap} from 'react-leaflet'

export default function ForecastHatchDefs() {
  const map = useMap()
  useEffect(() => {
    const ensureDefs = () => {
      const svg: SVGSVGElement | null =
        (map as any)?._panes?.overlayPane?.querySelector('svg') || null
      if (!svg) return
      if (svg.querySelector('#forecastHatch')) return

      const defs = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'defs',
      )
      defs.setAttribute('id', 'forecastHatchDefs')
      defs.innerHTML = `
        <pattern id="forecastHatch" width="6" height="6"
          patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="transparent"/>
          <line x1="0" y1="0" x2="0" y2="6"
            stroke="white" stroke-opacity="0.18" stroke-width="1"/>
        </pattern>`
      svg.prepend(defs)
    }

    ensureDefs()
    map.on('zoomend moveend resize', ensureDefs)
    return () => {
      map.off('zoomend moveend resize', ensureDefs)
    }
  }, [map])

  return null
}
