import Dexie, { type Table } from 'dexie'
import type { Application, Channel, Contact, Settings, Tag, TimelineEvent } from '@/domain/types'

export class AppDB extends Dexie {
  applications!: Table<Application, string>
  events!: Table<TimelineEvent, string>
  contacts!: Table<Contact, string>
  tags!: Table<Tag, string>
  channels!: Table<Channel, string>
  settings!: Table<Settings, string>

  constructor() {
    super('resume-tracker')
    this.version(1).stores({
      applications:
        'id, status, channel, company, appliedAt, nextFollowUpAt, interviewAt, lastContactAt, updatedAt, deletedAt',
      events: 'id, applicationId, at, type',
      contacts: 'id, applicationId',
      tags: 'id, name',
      channels: 'id, order',
      settings: 'id',
    })
  }
}

export const db = new AppDB()
