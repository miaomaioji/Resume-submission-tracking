import { ACTIVE_STATUSES } from './enums'
import type { Application, Settings } from './types'

export type TimeoutLevel = 'none' | 'attention' | 'warn' | 'alert'

const DAY_MS = 86_400_000

/** 投递无响应天数:以最近沟通时间为准,否则投递时间;都没有则返回 null。 */
export function idleDays(app: Application, now: Date = new Date()): number | null {
  const base = app.lastContactAt ?? app.appliedAt
  if (!base) return null
  return Math.floor((now.getTime() - new Date(base).getTime()) / DAY_MS)
}

/** 计算超时档位:终态不计;支持按渠道覆盖阈值。 */
export function timeoutLevel(
  app: Application,
  settings: Settings,
  now: Date = new Date(),
): TimeoutLevel {
  if (!ACTIVE_STATUSES.includes(app.status)) return 'none'
  const days = idleDays(app, now)
  if (days === null) return 'none'
  const rule = (app.channel && settings.timeout.byChannel[app.channel]) || settings.timeout.default
  if (days >= rule.alertDays) return 'alert'
  if (days >= rule.warnDays) return 'warn'
  if (days >= rule.attentionDays) return 'attention'
  return 'none'
}

export const TIMEOUT_COLORS: Record<TimeoutLevel, string> = {
  none: 'transparent',
  attention: 'var(--info)',
  warn: 'var(--warn)',
  alert: 'var(--alert)',
}
