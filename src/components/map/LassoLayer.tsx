'use client'

import {useEffect, useRef} from 'react'
import {useMap} from 'react-leaflet'
import * as L from 'leaflet'

/** Ray-casting point-in-polygon (lon=x, lat=y) */
function pointInPolygon(pt: L.LatLng, poly: L.LatLng[]): boolean {
  const x = pt.lng
  const y = pt.lat
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lng,
      yi = poly[i].lat
    const xj = poly[j].lng,
      yj = poly[j].lat
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export default function LassoLayer({
  active,
  onSelected,
  onPolygon,
  allHexes,
}: {
  active: boolean
  onSelected: (hexes: string[] | null) => void
  onPolygon: (poly: [number, number][] | null) => void
  allHexes: {hex: string; lat: number; lon: number}[]
}) {
  const map = useMap()
  const pathRef = useRef<L.Polyline | null>(null)
  const polygonRef = useRef<L.Polygon | null>(null)
  const drawingRef = useRef(false)
  const ptsRef = useRef<L.LatLng[]>([])
  const hintRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    const styleId = 'lasso-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.innerHTML = `
        .lasso-hint {
          background: var(--bg-overlay, rgba(20, 27, 45, 0.95));
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border, rgba(148, 163, 184, 0.1));
          border-radius: 8px;
          padding: 6px 12px;
          color: var(--text-primary, rgba(248, 250, 252, 0.95));
          font-size: 12px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          white-space: nowrap;
          animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .map-container.lasso-active {
          cursor: crosshair !important;
        }
        
        .leaflet-dragging .map-container.lasso-active {
          cursor: crosshair !important;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  useEffect(() => {
    if (!active) {
      drawingRef.current = false
      ptsRef.current = []
      pathRef.current?.remove()
      polygonRef.current?.remove()
      hintRef.current?.remove()
      pathRef.current = null
      polygonRef.current = null
      hintRef.current = null
      onPolygon(null)
      onSelected(null)
      map.getContainer().classList.remove('lasso-active')
      return
    }

    map.getContainer().classList.add('lasso-active')

    const showHint = () => {
      if (hintRef.current) return
      const center = map.getCenter()
      const icon = L.divIcon({
        className: 'lasso-hint-container',
        html: '<div class="lasso-hint">Click and drag to select area</div>',
        iconSize: [0, 0],
        iconAnchor: [0, -40],
      })
      hintRef.current = L.marker(center, {icon}).addTo(map)

      setTimeout(() => {
        hintRef.current?.remove()
        hintRef.current = null
      }, 3000)
    }
    showHint()

    const onDown = (e: L.LeafletMouseEvent) => {
      hintRef.current?.remove()
      hintRef.current = null

      drawingRef.current = true
      ptsRef.current = [e.latlng]
      pathRef.current?.remove()
      polygonRef.current?.remove()

      pathRef.current = L.polyline(ptsRef.current, {
        color: '#a78bfa',
        weight: 3,
        opacity: 0.9,
        dashArray: '8 4',
        className: 'lasso-path',
      }).addTo(map)

      let dashOffset = 0
      const animateDash = () => {
        if (!drawingRef.current || !pathRef.current) return
        dashOffset = (dashOffset + 1) % 12
        ;(pathRef.current as any)._path?.style.setProperty(
          'stroke-dashoffset',
          String(dashOffset),
        )
        requestAnimationFrame(animateDash)
      }
      animateDash()

      map.dragging.disable()
    }

    const onMove = (e: L.LeafletMouseEvent) => {
      if (!drawingRef.current || !pathRef.current) return
      const last = ptsRef.current[ptsRef.current.length - 1]
      if (!last) return

      const lastPt = map.latLngToContainerPoint(last)
      const curPt = map.latLngToContainerPoint(e.latlng)
      if (lastPt.distanceTo(curPt) < 4) return

      ptsRef.current.push(e.latlng)
      pathRef.current.setLatLngs(ptsRef.current)
    }

    const onUp = () => {
      if (!drawingRef.current) return
      drawingRef.current = false
      map.dragging.enable()

      const latlngs = ptsRef.current.slice()
      if (latlngs.length < 3) {
        pathRef.current?.remove()
        pathRef.current = null
        ptsRef.current = []
        onPolygon(null)
        onSelected(null)
        return
      }

      polygonRef.current?.remove()
      polygonRef.current = L.polygon(latlngs, {
        color: '#a78bfa',
        weight: 2,
        fill: true,
        fillColor: '#8b5cf6',
        fillOpacity: 0.08,
        dashArray: '6 3',
        className: 'lasso-polygon',
      }).addTo(map)

      const glowPolygon = L.polygon(latlngs, {
        color: '#8b5cf6',
        weight: 6,
        fill: false,
        opacity: 0.2,
        className: 'lasso-glow',
      }).addTo(map)

      setTimeout(() => glowPolygon.remove(), 500)

      // Emit polygon coordinates
      const polyLatLng: [number, number][] = latlngs.map((p) => [p.lat, p.lng])
      onPolygon(polyLatLng)

      // Selection: bounds precheck + precise point-in-polygon
      const bounds = L.latLngBounds(latlngs)
      const selected = allHexes
        .filter((h) => bounds.contains([h.lat, h.lon]))
        .filter((h) => pointInPolygon(L.latLng(h.lat, h.lon), latlngs))
        .map((h) => h.hex)

      onSelected(selected.length ? selected : null)

      pathRef.current?.remove()
      pathRef.current = null
      ptsRef.current = []
    }

    map.on('mousedown', onDown)
    map.on('mousemove', onMove)
    map.on('mouseup', onUp)
    map.on('mouseleave', onUp)

    return () => {
      map.off('mousedown', onDown)
      map.off('mousemove', onMove)
      map.off('mouseup', onUp)
      map.off('mouseleave', onUp)
      map.getContainer().classList.remove('lasso-active')
    }
  }, [active, map, onSelected, onPolygon, allHexes])

  return null
}
