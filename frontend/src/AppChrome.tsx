import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

/** Shared utility displayed on public, synthetic-demo and account views. */
export function BackToTopButton() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 360)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  if (!visible) return null
  return <button
    type="button"
    className="global-back-to-top"
    aria-label="Back to top"
    title="Back to top"
    onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
  ><ArrowUp size={18} /><span>Top</span></button>
}
