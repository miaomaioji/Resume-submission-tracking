import { useForm } from 'react-hook-form'
import dayjs from 'dayjs'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/m3/Button'
import { Select, TextArea, TextField } from '@/components/m3/Field'
import { repo } from '@/db/repository'
import { useChannels } from '@/hooks/useData'
import { JOB_TYPES, STATUS_LABEL_ZH, STATUS_ORDER, type JobType, type Status } from '@/domain/enums'
import type { Application } from '@/domain/types'

interface FormValues {
  company: string
  position: string
  jobType: string
  channel: string
  status: Status
  salaryMin: string
  salaryMax: string
  salaryMonths: string
  salaryPeriod: 'monthly' | 'yearly'
  location: string
  appliedAt: string
  lastContactAt: string
  nextFollowUpAt: string
  nextActionLabel: string
  interviewAt: string
  sourceUrl: string
  notes: string
}

const numOrUndef = (s: string) => {
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : undefined
}
const dateToIso = (d: string) => (d ? dayjs(d).toISOString() : undefined)
const isoToDate = (iso?: string) => (iso ? dayjs(iso).format('YYYY-MM-DD') : '')
const isoToDt = (iso?: string) => (iso ? dayjs(iso).format('YYYY-MM-DDTHH:mm') : '')

function toForm(app?: Application, initial?: Partial<Application>): FormValues {
  const s = app ?? initial ?? {}
  return {
    company: s.company ?? '',
    position: s.position ?? '',
    jobType: s.jobType ?? '',
    channel: s.channel ?? '',
    status: s.status ?? 'applied',
    salaryMin: s.salaryMin?.toString() ?? '',
    salaryMax: s.salaryMax?.toString() ?? '',
    salaryMonths: s.salaryMonths?.toString() ?? '',
    salaryPeriod: s.salaryPeriod ?? 'monthly',
    location: s.location ?? '',
    appliedAt: isoToDate(s.appliedAt),
    lastContactAt: isoToDate(s.lastContactAt),
    nextFollowUpAt: isoToDate(s.nextFollowUpAt),
    nextActionLabel: s.nextActionLabel ?? '',
    interviewAt: isoToDt(s.interviewAt),
    sourceUrl: s.sourceUrl ?? '',
    notes: s.notes ?? '',
  }
}

export function EntryForm({
  editing,
  initial,
  onClose,
}: {
  editing?: Application
  initial?: Partial<Application>
  onClose: () => void
}) {
  const channels = useChannels()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: toForm(editing, initial) })

  async function onSubmit(v: FormValues) {
    const patch: Partial<Application> = {
      company: v.company.trim(),
      position: v.position.trim(),
      jobType: v.jobType ? (v.jobType as JobType) : undefined,
      channel: v.channel || undefined,
      salaryMin: numOrUndef(v.salaryMin),
      salaryMax: numOrUndef(v.salaryMax),
      salaryMonths: numOrUndef(v.salaryMonths),
      salaryPeriod: v.salaryPeriod,
      salaryCurrency: 'CNY',
      location: v.location || undefined,
      appliedAt: dateToIso(v.appliedAt),
      lastContactAt: dateToIso(v.lastContactAt),
      nextFollowUpAt: dateToIso(v.nextFollowUpAt),
      nextActionLabel: v.nextActionLabel || undefined,
      interviewAt: dateToIso(v.interviewAt),
      sourceUrl: v.sourceUrl || undefined,
      notes: v.notes || undefined,
    }
    if (editing) {
      if (v.status !== editing.status) await repo.changeStatus(editing.id, v.status)
      await repo.updateApplication(editing.id, patch)
    } else {
      await repo.createApplication({
        ...patch,
        company: v.company.trim(),
        position: v.position.trim(),
        status: v.status,
      })
    }
    onClose()
  }

  return (
    <Modal
      title={editing ? '编辑投递' : '新增投递'}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="text" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" form="entry-form" variant="filled" disabled={isSubmitting}>
            保存
          </Button>
        </>
      }
    >
      <form id="entry-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="公司名称 *"
            placeholder="如:乐鑫科技"
            error={errors.company?.message}
            {...register('company', { required: '必填' })}
          />
          <TextField
            label="岗位 *"
            placeholder="如:PCB 设计工程师"
            error={errors.position?.message}
            {...register('position', { required: '必填' })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="类型" {...register('jobType')}>
            <option value="">—</option>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select label="渠道" {...register('channel')}>
            <option value="">—</option>
            {channels.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="状态" {...register('status')}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL_ZH[s]}
              </option>
            ))}
          </Select>
          <TextField label="工作地点" placeholder="如:上海" {...register('location')} />
        </div>

        <div className="grid grid-cols-4 gap-3">
          <TextField label="薪资下限" type="number" placeholder="15000" {...register('salaryMin')} />
          <TextField label="薪资上限" type="number" placeholder="25000" {...register('salaryMax')} />
          <TextField label="几薪" type="number" placeholder="14" {...register('salaryMonths')} />
          <Select label="周期" {...register('salaryPeriod')}>
            <option value="monthly">月</option>
            <option value="yearly">年</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField label="投递日期" type="date" {...register('appliedAt')} />
          <TextField label="最近沟通" type="date" {...register('lastContactAt')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField label="下次跟进日期" type="date" {...register('nextFollowUpAt')} />
          <TextField label="下次节点说明" placeholder="如:技术一面、笔试截止" {...register('nextActionLabel')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField label="面试时间" type="datetime-local" {...register('interviewAt')} />
          <TextField label="招聘链接" type="url" placeholder="https://…" {...register('sourceUrl')} />
        </div>

        <TextArea label="备注" placeholder="面试感受、薪资细节、注意事项…" {...register('notes')} />
      </form>
    </Modal>
  )
}
