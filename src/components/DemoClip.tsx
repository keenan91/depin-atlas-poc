'use client'
import {useEffect, useRef} from 'react'

export default function DemoClip() {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) {
      el.pause()
      return
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (!el) return
        e.isIntersecting ? el.play().catch(() => {}) : el.pause()
      },
      {threshold: 0.2},
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <video
      ref={ref}
      className="w-full h-auto rounded-2xl"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster="/home.png"
    >
      <source src="/demo-lasso.webm" type="video/webm" />
      <source src="/demo-lasso.mp4" type="video/mp4" />
    </video>
  )
}
