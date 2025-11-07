import React from 'react'
import { FaArrowUp, FaBalanceScale, FaChartBar, FaThumbsUp, FaThumbsDown } from 'react-icons/fa'

const MetricBar = ({ value, max, label, accent = 'bg-blue-500', formatter }) => {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return null
  }

  const width = Math.max(6, Math.min(100, Math.round((value / max) * 100)))
  const formattedValue = formatter ? formatter(value) : value

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span>{formattedValue}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${accent}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

const SuitabilityPill = ({ suitability }) => {
  const map = {
    Excellent: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    Good: 'bg-sky-100 text-sky-700 border border-sky-200',
    Moderate: 'bg-amber-100 text-amber-700 border border-amber-200',
    Limited: 'bg-rose-100 text-rose-700 border border-rose-200'
  }

  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${map[suitability] || 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {suitability || 'Not rated'}
    </span>
  )
}

const formatDollars = (value) => `$${Math.round(value)}`

const JobApplicantComparison = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-gray-600">
        Click "Analyze with AI" to generate a comparative view of applicants.
      </div>
    )
  }

  if (!analysis.applicants || analysis.applicants.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <p className="text-gray-600">No applicant data available for comparison yet.</p>
      </div>
    )
  }

  const { applicants, metrics, aiInsights } = analysis
  const extremes = metrics?.extremes || {}

  const maxMatch = Math.max(...applicants.map((item) => item.matchScore || 0), 1)
  const maxSkillPercent = Math.max(...applicants.map((item) => item.skillMatchPercent || 0), 1)
  const maxRate = Math.max(...applicants.map((item) => item.proposedRate || 0), 1)
  const maxExperience = Math.max(...applicants.map((item) => item.experienceYears || 0), 1)

  const aiMap = new Map((aiInsights?.applicants || []).map((entry) => [entry.userId, entry]))
  const topMatchId = extremes.bestMatch || null

  const comparisonTableHeaders = [
    'Candidate',
    'Match',
    'Skill Match',
    'Proposed Cost',
    'Estimated Duration',
    'Experience',
    'Shared Skills',
    'Pros',
    'Cons'
  ]

  const formatCost = (value) => (value != null ? `$${Math.round(value)}` : '—')

  const renderBadges = (applicant) => {
    const badges = []
    if (topMatchId && topMatchId === applicant.userId) badges.push({ label: 'Top Match', color: 'bg-blue-100 text-blue-700 border border-blue-200' })
    if (extremes.lowestRate && extremes.lowestRate === applicant.userId) badges.push({ label: 'Best Price', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200' })
    if (extremes.fastestDelivery && extremes.fastestDelivery === applicant.userId) badges.push({ label: 'Fastest Timeline', color: 'bg-purple-100 text-purple-700 border border-purple-200' })
    if (extremes.mostExperienced && extremes.mostExperienced === applicant.userId) badges.push({ label: 'Most Experienced', color: 'bg-amber-100 text-amber-700 border border-amber-200' })
    return badges.length ? (
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span key={badge.label} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${badge.color}`}>
            {badge.label}
          </span>
        ))}
      </div>
    ) : null
  }

  return (
    <div className="space-y-6 w-full">
      <div className="bg-gradient-to-br from-white via-white to-slate-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4 flex-col xl:flex-row xl:items-start xl:justify-between">
          <div className="hidden sm:block">
            <FaChartBar className="text-3xl text-blue-500" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 uppercase tracking-wide">
              <FaArrowUp />
              Comparative Insights
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">AI Summary</h3>
              <p className="text-gray-600 leading-relaxed">
                {aiInsights?.overallSummary || 'We analysed your applicants to highlight key strengths and gaps.'}
              </p>
            </div>
            {aiInsights?.comparisonNotes?.length ? (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <ul className="list-disc list-inside text-sm text-blue-900 space-y-1">
                  {aiInsights.comparisonNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500">Average Match Score</p>
            <p className="text-2xl font-semibold text-gray-900">{Math.round(metrics.averages.matchScore || 0)}%</p>
            <p className="text-xs text-gray-500">Across {metrics.counts.applicants} applicants</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500">Average Proposed Cost</p>
            <p className="text-2xl font-semibold text-gray-900">{metrics.averages.proposedRate ? `${formatCost(metrics.averages.proposedRate)}` : 'Not Provided'}</p>
            <p className="text-xs text-gray-500">{metrics.counts.withProposedRate} cost submissions</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500">Average Experience</p>
            <p className="text-2xl font-semibold text-gray-900">{metrics.averages.experienceYears ? `${metrics.averages.experienceYears.toFixed(1)} yrs` : 'Not Provided'}</p>
            <p className="text-xs text-gray-500">{metrics.counts.withExperience} supplied estimates</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500">Average Timeline</p>
            <p className="text-2xl font-semibold text-gray-900">{metrics.counts.withDuration ? 'See table' : 'Not Provided'}</p>
            <p className="text-xs text-gray-500">{metrics.counts.withDuration} timelines submitted</p>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl shadow-sm hidden xl:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {comparisonTableHeaders.map((header) => (
                <th key={header} className="px-4 py-3 text-left whitespace-nowrap">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {applicants.map((applicant) => {
              const ai = aiMap.get(applicant.userId)
              const isTop = topMatchId === applicant.userId
              return (
                <tr key={applicant.userId} className={`${isTop ? 'bg-blue-50/60' : 'bg-white'} hover:bg-blue-50/80 transition-colors`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{applicant.name}</div>
                    <div className="text-xs text-gray-500">{applicant.headline || '—'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-800">{Math.round(applicant.matchScore || 0)}%</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{Math.round(applicant.skillMatchPercent || 0)}%</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{applicant.proposedRate != null ? formatCost(applicant.proposedRate) : '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{applicant.estimatedDuration || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{applicant.experienceYears != null ? `${applicant.experienceYears} yrs` : '—'}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {applicant.overlappingSkills?.length ? applicant.overlappingSkills.slice(0, 4).join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {(ai?.pros && ai.pros.length) ? ai.pros.slice(0, 2).join('; ') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {(ai?.cons && ai.cons.length) ? ai.cons.slice(0, 2).join('; ') : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
        {applicants.map((applicant) => {
          const ai = aiMap.get(applicant.userId)
          const coverLetterSections = Array.isArray(applicant.coverLetterStructured?.sections)
            ? applicant.coverLetterStructured.sections.slice(0, 3)
            : []

          return (
            <div key={applicant.userId} className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{applicant.name}</h4>
                  <p className="text-sm text-gray-600">{applicant.headline || 'No headline provided'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <SuitabilityPill suitability={ai?.suitability} />
                    <span className="bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">Submitted {new Date(applicant.submittedAt).toLocaleDateString()}</span>
                    {applicant.availability ? (
                      <span className="bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-blue-700">Availability: {applicant.availability}</span>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    {renderBadges(applicant)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetricBar value={applicant.matchScore || 0} max={maxMatch} label={`Match Score (${Math.round(applicant.matchScore || 0)}%)`} accent="bg-blue-500" />
                <MetricBar value={applicant.skillMatchPercent || 0} max={maxSkillPercent} label={`Skill Match (${Math.round(applicant.skillMatchPercent || 0)}%)`} accent="bg-emerald-500" />
                <MetricBar value={applicant.proposedRate || 0} max={maxRate} label="Proposed Cost" accent="bg-purple-500" formatter={(value) => value ? `${formatCost(value)}` : 'Not provided'} />
                <MetricBar value={applicant.experienceYears || 0} max={maxExperience} label="Experience" accent="bg-amber-500" formatter={(value) => value ? `${value} yrs` : 'Not provided'} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Shared Skills</p>
                  {applicant.overlappingSkills?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {applicant.overlappingSkills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 text-[11px] font-medium bg-blue-100 text-blue-700 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No direct overlap with job skill tags.</p>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold flex items-center gap-2"><FaThumbsUp /> Pros</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {(ai?.pros || []).length ? ai.pros.map((pro, idx) => <li key={idx}>• {pro}</li>) : <li className="text-xs text-gray-500">No pros identified.</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold flex items-center gap-2"><FaThumbsDown /> Cons</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {(ai?.cons || []).length ? ai.cons.map((con, idx) => <li key={idx}>• {con}</li>) : <li className="text-xs text-gray-500">No concerns raised.</li>}
                    </ul>
                  </div>
                  {ai?.recommendedFocus ? (
                    <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">Focus: {ai.recommendedFocus}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Profile Highlights</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {applicant.resumeHighlights.slice(0, 4).map((highlight, idx) => (
                      <li key={idx}>• {highlight}</li>
                    ))}
                    {applicant.resumeHighlights.length === 0 && <li className="text-xs text-gray-500">No resume highlights captured.</li>}
                  </ul>
                  {applicant.languages.length ? (
                    <p className="text-xs text-gray-500">Languages: {applicant.languages.join(', ')}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">Cost: {applicant.proposedRate != null ? formatCost(applicant.proposedRate) : 'Not provided'}</span>
                    <span className="bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">Timeline: {applicant.estimatedDuration || 'Not provided'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cover Letter Snapshot</p>
                  {coverLetterSections.length ? (
                    <ul className="text-sm text-gray-600 space-y-1">
                      {coverLetterSections.map((section, idx) => (
                        <li key={idx}>
                          <span className="font-semibold text-gray-800">{section.heading || `Section ${idx + 1}`}:</span>{' '}
                          <span>{section.text ? String(section.text).slice(0, 160) : '—'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">No structured cover letter data captured.</p>
                  )}
                  {applicant.proposalSummary ? (
                    <p className="text-xs text-gray-500">Summary: {applicant.proposalSummary}</p>
                  ) : null}
                </div>
              </div>

              {ai?.summary ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-gray-600">
                  <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2"><FaBalanceScale /> Recommendation</p>
                  <p className="leading-relaxed">{ai.summary}</p>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default JobApplicantComparison


