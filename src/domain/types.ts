import type { JobType, Status } from './enums'

export interface Application {
  id: string
  company: string
  position: string
  jobType?: JobType
  channel?: string // 渠道 id 或名称(MVP 用名称)
  status: Status
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string // 默认 CNY
  salaryPeriod?: 'monthly' | 'yearly'
  salaryMonths?: number // 几薪,如 13/14/16
  location?: string
  tagIds: string[]
  appliedAt?: string // ISO,投递日期
  lastContactAt?: string // ISO,最近沟通(超时计算基准)
  nextFollowUpAt?: string // ISO,下次跟进
  nextActionLabel?: string // “技术一面”“笔试截止”
  interviewAt?: string // ISO,下一场面试
  sourceUrl?: string
  notes?: string
  // —— 为未来同步预留 ——
  createdAt: string
  updatedAt: string
  deletedAt?: string | null // 软删除
  version: number
}

export type TimelineEventType = 'status_change' | 'note' | 'interview' | 'custom'

export interface TimelineEvent {
  id: string
  applicationId: string
  type: TimelineEventType
  at: string // ISO
  fromStatus?: Status
  toStatus?: Status
  label?: string // “技术一面”
  note?: string
  createdAt: string
}

export interface Contact {
  id: string
  applicationId: string
  name?: string
  role?: string // HR / 面试官
  phone?: string
  wechat?: string
  email?: string
  note?: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Channel {
  id: string
  name: string
  order: number
}

export interface TimeoutRule {
  attentionDays: number
  warnDays: number
  alertDays: number
}

export interface Settings {
  id: 'singleton'
  language: 'zh-CN' | 'en'
  theme: 'system' | 'light' | 'dark'
  timeout: { default: TimeoutRule; byChannel: Record<string, TimeoutRule> }
  reminders: {
    interviewDayBefore: boolean
    interviewHoursBefore: number
    followUpDue: boolean
    idleTimeout: boolean
  }
  table: {
    columnOrder: string[]
    hiddenColumns: string[]
    columnWidths: Record<string, number>
  }
}
