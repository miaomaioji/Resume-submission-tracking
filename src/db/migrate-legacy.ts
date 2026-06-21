import { db } from './schema'
import { JOB_TYPES, type JobType, type Status } from '@/domain/enums'
import { nowIso, uid } from '@/domain/id'
import type { Application, Contact, TimelineEvent } from '@/domain/types'

const LEGACY_KEY = 'job_tracker'

interface LegacyRecord {
  id?: string
  company?: string
  role?: string
  type?: string
  status?: string
  date?: string
  nextDate?: string
  nextLabel?: string
  hr?: string
  note?: string
}

const STATUS_MAP: Record<string, Status> = {
  投递中: 'applied',
  笔试: 'written_test',
  技术面: 'interviewing',
  HR面: 'interviewing',
  已拿offer: 'offer',
  已挂: 'rejected',
  已放弃: 'abandoned',
}

// 这些旧状态隐含一个具体轮次,迁移时额外补一条时间线事件保留信息
const ROUND_LABEL: Record<string, string> = {
  技术面: '技术面',
  HR面: 'HR 面',
  笔试: '笔试',
}

function toIso(d?: string): string | undefined {
  if (!d) return undefined
  const parsed = new Date(d + 'T00:00:00') // 旧数据为 'YYYY-MM-DD'
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

export interface MigrationResult {
  found: number
  imported: number
}

/** 读取旧 localStorage['job_tracker'] 导入新库。幂等(按 legacy id 去重)。 */
export async function migrateLegacy(): Promise<MigrationResult> {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LEGACY_KEY) : null
  if (!raw) return { found: 0, imported: 0 }

  let list: LegacyRecord[]
  try {
    list = JSON.parse(raw)
  } catch {
    return { found: 0, imported: 0 }
  }
  if (!Array.isArray(list) || list.length === 0) return { found: 0, imported: 0 }

  let imported = 0
  for (const r of list) {
    if (!r.company || !r.role) continue

    const legacyId = r.id ? `legacy-${r.id}` : uid()
    if (await db.applications.get(legacyId)) continue

    const ts = nowIso()
    const status: Status = (r.status && STATUS_MAP[r.status]) || 'applied'
    const jobType: JobType | undefined =
      r.type && (JOB_TYPES as readonly string[]).includes(r.type) ? (r.type as JobType) : undefined

    const app: Application = {
      id: legacyId,
      company: r.company,
      position: r.role,
      jobType,
      status,
      tagIds: [],
      appliedAt: toIso(r.date),
      nextFollowUpAt: toIso(r.nextDate),
      nextActionLabel: r.nextLabel || undefined,
      notes: r.note || undefined,
      createdAt: ts,
      updatedAt: ts,
      version: 1,
      deletedAt: null,
    }

    let roundEvent: TimelineEvent | undefined
    if (r.status && ROUND_LABEL[r.status]) {
      roundEvent = {
        id: uid(),
        applicationId: legacyId,
        type: r.status === '笔试' ? 'custom' : 'interview',
        at: app.appliedAt ?? ts,
        label: ROUND_LABEL[r.status],
        createdAt: ts,
      }
    }

    let contact: Contact | undefined
    if (r.hr) {
      const isEmail = r.hr.includes('@')
      contact = {
        id: uid(),
        applicationId: legacyId,
        role: 'HR',
        email: isEmail ? r.hr : undefined,
        wechat: isEmail ? undefined : r.hr,
      }
    }

    await db.transaction('rw', db.applications, db.events, db.contacts, async () => {
      await db.applications.add(app)
      if (roundEvent) await db.events.add(roundEvent)
      if (contact) await db.contacts.add(contact)
    })
    imported++
  }

  return { found: list.length, imported }
}
