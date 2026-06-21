import type { Application } from './types'

const HOUR = 60 * 60 * 1000

/**
 * 找出面试时间互相冲突的记录对(默认认定开始时间相差不足 1 小时即冲突)。
 * 输入按面试时间排序后两两比较,利用有序性提前跳出。
 */
export function findInterviewConflicts(
  apps: Application[],
  windowMs = HOUR,
): [Application, Application][] {
  const list = apps
    .filter((a) => a.interviewAt)
    .sort((a, b) => +new Date(a.interviewAt!) - +new Date(b.interviewAt!))
  const out: [Application, Application][] = []
  for (let i = 0; i < list.length - 1; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const diff = +new Date(list[j].interviewAt!) - +new Date(list[i].interviewAt!)
      if (diff < windowMs) out.push([list[i], list[j]])
      else break
    }
  }
  return out
}
