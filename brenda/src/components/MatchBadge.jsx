import React, { useEffect, useState } from 'react'

const getVisualClasses = (score) => {
  if (score >= 85) {
    return {
      frame: 'from-emerald-300 via-emerald-200 to-emerald-400',
      badge: 'border-emerald-300 bg-emerald-50/95 text-emerald-800 shadow-[0_12px_32px_-20px_rgba(16,185,129,0.7)]'
    }
  }

  if (score >= 70) {
    return {
      frame: 'from-sky-300 via-sky-200 to-blue-400',
      badge: 'border-sky-300 bg-sky-50/95 text-sky-800 shadow-[0_12px_32px_-20px_rgba(2,132,199,0.6)]'
    }
  }

  if (score >= 50) {
    return {
      frame: 'from-amber-300 via-yellow-200 to-orange-400',
      badge: 'border-amber-300 bg-amber-50/95 text-amber-800 shadow-[0_12px_32px_-20px_rgba(217,119,6,0.55)]'
    }
  }

  return {
    frame: 'from-rose-300 via-rose-200 to-orange-300',
    badge: 'border-rose-300 bg-rose-50/95 text-rose-800 shadow-[0_12px_32px_-20px_rgba(244,63,94,0.5)]'
  }
}

const MatchBadge = ({ match, placement = 'right', className = '' }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice(('ontouchstart' in window) || navigator.maxTouchPoints > 0)
    }
  }, [])

  if (!match || typeof match.score !== 'number') {
    return null
  }

  const { frame, badge } = getVisualClasses(match.score)
  const reasoningText = match.reasoning && match.reasoning.trim().length > 0
    ? match.reasoning
    : 'We could not generate additional context. Review the job details manually.'

  const tooltipBase = placement === 'left' ? 'left-0 md:left-auto md:right-0' : 'right-0'
  const tooltipVisibility = isTouchDevice ? (expanded ? 'block' : 'hidden') : 'hidden md:group-hover:block'

  const handleToggle = () => {
    if (!isTouchDevice) return
    setExpanded(prev => !prev)
  }

  return (
    <div
      className={`relative group ${isTouchDevice ? 'cursor-pointer' : 'cursor-default'} ${className}`.trim()}
      onClick={handleToggle}
    >
      <div className={`rounded-2xl bg-gradient-to-r ${frame} p-[1.5px] transition-transform duration-200 group-hover:scale-[1.015]`}>
        <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2 backdrop-blur-sm ${badge}`}>
          <span className="text-[13px] font-semibold tracking-wide uppercase">{match.score}% match</span>
          <span className="text-[11px] font-medium text-gray-500/80 uppercase">Insight</span>
        </div>
      </div>

      <div
        className={`absolute z-30 mt-3 w-72 max-w-xs ${tooltipBase} ${tooltipVisibility}`.trim()}
      >
        <div className="rounded-2xl border border-gray-200 bg-white/95 shadow-xl backdrop-blur-sm p-4 text-sm text-gray-700">
          <p className="text-gray-900 font-semibold mb-2">Why this job fits</p>
          <p className="text-gray-600 leading-relaxed">{reasoningText}</p>

          {match.skills?.length ? (
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Shared strengths</p>
              <div className="flex flex-wrap gap-1.5">
                {match.skills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-3 text-[11px] text-gray-400 flex items-center justify-between gap-2">
            <span className="italic">
              {match.source === 'fallback' ? 'Quick estimate from your skill overlap.' : 'AI-powered evaluation using your profile and resume.'}
            </span>
            {match.cached && match.generatedAt && (
              <span className="uppercase tracking-wide">{new Date(match.generatedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchBadge


