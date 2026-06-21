// 主状态(= 看板列 / 筛选维度)。具体面试轮次记入时间线事件,不进此枚举。
export const STATUS = {
  CREATED: 'created',
  APPLIED: 'applied',
  WRITTEN_TEST: 'written_test',
  INTERVIEWING: 'interviewing',
  AWAITING: 'awaiting_result',
  OFFER: 'offer',
  REJECTED: 'rejected',
  ABANDONED: 'abandoned',
} as const

export type Status = (typeof STATUS)[keyof typeof STATUS]

export const STATUS_ORDER: Status[] = [
  'created',
  'applied',
  'written_test',
  'interviewing',
  'awaiting_result',
  'offer',
  'rejected',
  'abandoned',
]

export const STATUS_LABEL_ZH: Record<Status, string> = {
  created: '已创建',
  applied: '已投递',
  written_test: '笔试中',
  interviewing: '面试中',
  awaiting_result: '待结果',
  offer: '已 OC',
  rejected: '已拒绝',
  abandoned: '已放弃',
}

// 看板列顺序(= 主状态全集)
export const KANBAN_COLUMNS: Status[] = STATUS_ORDER

// 状态徽章配色(沿用原型配色,映射到语义)
export const STATUS_COLORS: Record<Status, { bg: string; fg: string }> = {
  created: { bg: '#f1f5f9', fg: '#475569' },
  applied: { bg: '#e6f1fb', fg: '#185fa5' },
  written_test: { bg: '#eeedfe', fg: '#3c3489' },
  interviewing: { bg: '#faeeda', fg: '#633806' },
  awaiting_result: { bg: '#fef3c7', fg: '#92400e' },
  offer: { bg: '#e1f5ee', fg: '#085041' },
  rejected: { bg: '#fcebeb', fg: '#791f1f' },
  abandoned: { bg: '#f1efe8', fg: '#444441' },
}

// 活跃状态:参与「投递无响应」超时计算
export const ACTIVE_STATUSES: Status[] = ['applied', 'written_test', 'interviewing', 'awaiting_result']

// 允许的状态流转(UI 可警告后强制覆盖,求职流程不总线性)
export const ALLOWED_TRANSITIONS: Record<Status, Status[]> = {
  created: ['applied', 'abandoned'],
  applied: ['written_test', 'interviewing', 'awaiting_result', 'rejected', 'abandoned'],
  written_test: ['interviewing', 'awaiting_result', 'rejected', 'abandoned'],
  interviewing: ['interviewing', 'awaiting_result', 'offer', 'rejected', 'abandoned'],
  awaiting_result: ['interviewing', 'offer', 'rejected', 'abandoned'],
  offer: ['abandoned'],
  rejected: [],
  abandoned: [],
}

export function canTransition(from: Status, to: Status): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

export const JOB_TYPES = ['实习', '校招', '提前批', '社招', '其他'] as const
export type JobType = (typeof JOB_TYPES)[number]

export const DEFAULT_CHANNELS = ['BOSS直聘', '猎聘', '内推', '官网', '智联招聘', '前程无忧', '其他']

export const DEFAULT_TIMEOUT = { attentionDays: 3, warnDays: 7, alertDays: 14 } as const
