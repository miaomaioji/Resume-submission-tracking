import { describe, expect, it } from 'vitest'
import { findInterviewConflicts } from './conflicts'
import type { Application } from './types'

function app(id: string, interviewAt?: string): Application {
  return {
    id,
    company: id,
    position: 'p',
    status: 'interviewing',
    tagIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    version: 1,
    interviewAt,
  }
}

describe('findInterviewConflicts', () => {
  it('相隔不足 1 小时判为冲突', () => {
    const r = findInterviewConflicts([
      app('A', '2026-06-22T10:00:00.000Z'),
      app('B', '2026-06-22T10:30:00.000Z'),
    ])
    expect(r).toHaveLength(1)
  })

  it('相隔超过 1 小时不冲突', () => {
    const r = findInterviewConflicts([
      app('A', '2026-06-22T10:00:00.000Z'),
      app('B', '2026-06-22T12:00:00.000Z'),
    ])
    expect(r).toHaveLength(0)
  })

  it('没有面试时间的记录被忽略', () => {
    expect(findInterviewConflicts([app('A'), app('B')])).toHaveLength(0)
  })
})
