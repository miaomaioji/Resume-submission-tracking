import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { repo } from '@/db/repository'
import { migrateLegacy } from '@/db/migrate-legacy'

export function TablePage() {
  const apps = useLiveQuery(() => repo.listApplications(), [], [])
  const [msg, setMsg] = useState('')

  async function onImport() {
    const res = await migrateLegacy()
    setMsg(res.found === 0 ? '未发现旧版(localStorage)数据' : `发现 ${res.found} 条,导入 ${res.imported} 条`)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">投递列表</h2>
        <button
          onClick={onImport}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          导入旧版数据
        </button>
      </div>
      {msg && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {msg}
        </p>
      )}
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        当前共 {apps.length} 条记录。完整的内联编辑表格将在 P1 实现。
      </p>
    </section>
  )
}
