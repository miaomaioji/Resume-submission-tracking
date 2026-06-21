/** 生成唯一 id(优先 crypto.randomUUID)。 */
export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

/** 当前时间 ISO 字符串。 */
export function nowIso(): string {
  return new Date().toISOString()
}
