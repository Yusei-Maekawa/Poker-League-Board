import type { SeasonPointRules } from '../types'
import { pointRulesToDisplayRows } from '../utils/seasonPointRules'

export function PointRulesDisplay({
  rules,
  compact = false,
  note = '※ 最下位は順位ポイントより最下位ペナルティが優先されます',
}: {
  rules: SeasonPointRules
  compact?: boolean
  note?: string | null
}) {
  const rows = pointRulesToDisplayRows(rules)

  return (
    <div>
      <div
        className={`grid gap-2 text-center ${
          compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'
        }`}
      >
        {rows.map(({ label, pt }) => (
          <div key={label} className="bg-white/5 rounded-lg py-2 px-1">
            <p className="text-white/70 text-xs">{label}</p>
            <p
              className={`font-mono font-bold text-sm mt-0.5 ${
                pt.startsWith('-') ? 'text-red-400' : 'text-gold-400'
              }`}
            >
              {pt}
            </p>
          </div>
        ))}
      </div>
      {note && (
        <p className="text-white/25 text-xs mt-2 text-center leading-relaxed">{note}</p>
      )}
    </div>
  )
}
