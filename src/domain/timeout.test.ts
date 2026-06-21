import { describe, expect, it } from 'vitest'
import { timeoutLevel } from './timeout'
import { DEFAULT_TIMEOUT } from './enums'
import type { Application, Settings } from './types'

const settings: Settings = {
  id: 'singleton',
  language: 'zh-CN',
  theme: 'system',
  timeout: {
    default: { ...DEFAULT_TIMEOUT },
    byChannel: { 内推: { attentionDays: 1, warnDays: 2, alertDays: 3 } },
  },
  reminders: { interviewDayBefore: true, interviewHoursBefore: 2, followUpDue: true, idleTimeout: true },
  table: { columnOrder: [], hiddenColumns: [], columnWidths: {} },
}

function makeApp(partial: Partial<Application>): Application {
  return {
    id: 'a',
    company: 'C',
    position: 'P',
    status: 'applied',
    tagIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    version: 1,
    ...partial,
  }
}

const now = new Date('2026-01-20T00:00:00.000Z')

describe('timeoutLevel', () => {
  it('终态不计', () => {
    expect(timeoutLevel(makeApp({ status: 'offer', appliedAt: '2026-01-01T00:00:00.000Z' }), settings, now)).toBe(
      'none',
    )
  })

  it('无基准日期返回 none', () => {
    expect(timeoutLevel(makeApp({}), settings, now)).toBe('none')
  })

  it('默认阈值 4 天 -> attention', () => {
    expect(timeoutLevel(makeApp({ appliedAt: '2026-01-16T00:00:00.000Z' }), settings, now)).toBe('attention')
  })

  it('默认阈值 9 天 -> warn', () => {
    expect(timeoutLevel(makeApp({ appliedAt: '2026-01-11T00:00:00.000Z' }), settings, now)).toBe('warn')
  })

  it('默认阈值 15 天 -> alert', () => {
    expect(timeoutLevel(makeApp({ appliedAt: '2026-01-05T00:00:00.000Z' }), settings, now)).toBe('alert')
  })

  it('lastContactAt 覆盖 appliedAt', () => {
    expect(
      timeoutLevel(
        makeApp({ appliedAt: '2026-01-01T00:00:00.000Z', lastContactAt: '2026-01-19T00:00:00.000Z' }),
        settings,
        now,
      ),
    ).toBe('none')
  })

  it('按渠道覆盖更严格(内推 4 天即 alert)', () => {
    expect(timeoutLevel(makeApp({ appliedAt: '2026-01-16T00:00:00.000Z', channel: '内推' }), settings, now)).toBe(
      'alert',
    )
  })
})
