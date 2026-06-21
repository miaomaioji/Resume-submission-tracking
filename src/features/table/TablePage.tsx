import { Fragment, type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import {
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconDownload,
  IconEdit,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react'
import { useApplications, useChannels, useSettings, useTags } from '@/hooks/useData'
import { repo } from '@/db/repository'
import { migrateLegacy } from '@/db/migrate-legacy'
import { downloadBackup, exportBackup, importBackup } from '@/lib/backup'
import { StatsCards } from './StatsCards'
import { EntryForm } from '@/features/entry/EntryForm'
import { EditableCell } from './EditableCell'
import { Button } from '@/components/m3/Button'
import { IconButton } from '@/components/m3/IconButton'
import { DetailPanel } from './DetailPanel'
import { TagChips } from '@/components/TagChips'
import { EDITABLE_IDS, GridContext, type EditPos, type GridApi } from './grid'
import { formatSalary } from '@/lib/format'
import { TIMEOUT_COLORS, timeoutLevel } from '@/domain/timeout'
import { STATUS_LABEL_ZH, STATUS_ORDER, type Status } from '@/domain/enums'
import type { Application } from '@/domain/types'
import { useUiStore } from '@/app/uiStore'

const columnHelper = createColumnHelper<Application>()

const selStyle = { accentColor: 'var(--primary)' }

export function TablePage() {
  const apps = useApplications()
  const settings = useSettings()
  const channels = useChannels()
  const tags = useTags()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | ''>('')
  const [tagFilter, setTagFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<Application | undefined>()
  const [initial, setInitial] = useState<Partial<Application> | undefined>()
  const [importMsg, setImportMsg] = useState('')
  const [edit, setEdit] = useState<EditPos | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const focusAppId = useUiStore((s) => s.focusAppId)
  const setFocusAppId = useUiStore((s) => s.setFocusAppId)
  const addNonce = useUiStore((s) => s.addNonce)

  // 从日历/看板跳转过来时,自动展开对应记录
  useEffect(() => {
    if (!focusAppId) return
    setExpanded((prev) => new Set(prev).add(focusAppId))
    setFocusAppId(null)
  }, [focusAppId, setFocusAppId])

  // 外壳 FAB 触发「新增投递」
  useEffect(() => {
    if (addNonce > 0) {
      setEditingApp(undefined)
      setInitial(undefined)
      setFormOpen(true)
    }
  }, [addNonce])

  const data = useMemo(
    () =>
      apps.filter(
        (a) =>
          (!statusFilter || a.status === statusFilter) &&
          (!tagFilter || a.tagIds.includes(tagFilter)),
      ),
    [apps, statusFilter, tagFilter],
  )

  const selectedIds = Object.keys(rowSelection)

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function onAdd() {
    setEditingApp(undefined)
    setInitial(undefined)
    setFormOpen(true)
  }
  function onCopyLast() {
    const last = apps[0]
    setEditingApp(undefined)
    setInitial(
      last
        ? {
            jobType: last.jobType,
            channel: last.channel,
            location: last.location,
            salaryMin: last.salaryMin,
            salaryMax: last.salaryMax,
            salaryMonths: last.salaryMonths,
            salaryPeriod: last.salaryPeriod,
          }
        : undefined,
    )
    setFormOpen(true)
  }
  function onEditRow(app: Application) {
    setEditingApp(app)
    setInitial(undefined)
    setFormOpen(true)
  }
  async function onDelete(app: Application) {
    if (!confirm(`确认删除「${app.company} · ${app.position}」?`)) return
    await repo.softDeleteApplication(app.id)
  }
  async function onImportLegacy() {
    const res = await migrateLegacy()
    setImportMsg(res.found === 0 ? '未发现旧版数据' : `导入旧版 ${res.imported}/${res.found} 条`)
  }
  async function onExport() {
    downloadBackup(await exportBackup())
  }
  async function onImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await importBackup(await file.text(), 'merge')
      setImportMsg(`已合并导入 ${res.applications} 条`)
    } catch (err) {
      setImportMsg('导入失败:' + (err as Error).message)
    }
    e.target.value = ''
  }

  async function onBulkStatus(e: ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as Status
    if (!v) return
    await repo.bulkSetStatus(selectedIds, v)
    setRowSelection({})
  }
  async function onBulkTag(e: ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    if (!id) return
    await repo.bulkAddTag(selectedIds, id)
    setRowSelection({})
  }
  async function onBulkDelete() {
    if (!confirm(`确认删除选中的 ${selectedIds.length} 条记录?`)) return
    await repo.bulkSoftDelete(selectedIds)
    setRowSelection({})
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            style={selStyle}
            checked={table.getIsAllRowsSelected()}
            ref={(el) => {
              if (el) el.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
            }}
            onChange={table.getToggleAllRowsSelectedHandler()}
            aria-label="全选"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            style={selStyle}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label="选择行"
          />
        ),
      }),
      columnHelper.display({
        id: 'expander',
        header: '',
        cell: ({ row }) => (
          <IconButton
            onClick={() => toggleExpand(row.original.id)}
            aria-label="展开详情"
            className="h-8 w-8"
          >
            {expanded.has(row.original.id) ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )}
          </IconButton>
        ),
      }),
      columnHelper.accessor('company', {
        header: '公司',
        cell: (i) => <EditableCell app={i.row.original} field="company" type="text" />,
      }),
      columnHelper.accessor('position', {
        header: '岗位',
        cell: (i) => <EditableCell app={i.row.original} field="position" type="text" />,
      }),
      columnHelper.accessor('jobType', {
        header: '类型',
        cell: (i) => <EditableCell app={i.row.original} field="jobType" type="jobType" />,
      }),
      columnHelper.accessor('channel', {
        header: '渠道',
        cell: (i) => <EditableCell app={i.row.original} field="channel" type="channel" />,
      }),
      columnHelper.accessor('status', {
        header: '状态',
        cell: (i) => <EditableCell app={i.row.original} field="status" type="status" />,
      }),
      columnHelper.display({ id: 'salary', header: '薪资', cell: ({ row }) => formatSalary(row.original) }),
      columnHelper.accessor('location', {
        header: '地点',
        cell: (i) => <EditableCell app={i.row.original} field="location" type="text" />,
      }),
      columnHelper.accessor('appliedAt', {
        header: '投递',
        cell: (i) => <EditableCell app={i.row.original} field="appliedAt" type="date" />,
      }),
      columnHelper.accessor('nextFollowUpAt', {
        header: '下次跟进',
        cell: (i) => <EditableCell app={i.row.original} field="nextFollowUpAt" type="date" />,
      }),
      columnHelper.accessor('notes', {
        header: '备注',
        cell: (i) => <EditableCell app={i.row.original} field="notes" type="text" />,
      }),
      columnHelper.display({
        id: 'tags',
        header: '标签',
        cell: ({ row }) => <TagChips tagIds={row.original.tagIds} tags={tags} />,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <IconButton onClick={() => onEditRow(row.original)} aria-label="编辑详情" className="h-8 w-8">
              <IconEdit size={16} />
            </IconButton>
            <IconButton onClick={() => onDelete(row.original)} aria-label="删除" className="h-8 w-8">
              <IconTrash size={16} />
            </IconButton>
          </div>
        ),
      }),
    ],
    [expanded, tags],
  )

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const gridApi: GridApi = useMemo(() => {
    function neighbor(rowId: string, colId: string, move: 'tab' | 'shiftTab' | 'down'): EditPos | null {
      const rows = table.getRowModel().rows
      const r = rows.findIndex((x) => x.original.id === rowId)
      const c = EDITABLE_IDS.indexOf(colId)
      if (r < 0 || c < 0) return null
      if (move === 'tab') {
        if (c < EDITABLE_IDS.length - 1) return { rowId, colId: EDITABLE_IDS[c + 1] }
        if (r < rows.length - 1) return { rowId: rows[r + 1].original.id, colId: EDITABLE_IDS[0] }
        return null
      }
      if (move === 'shiftTab') {
        if (c > 0) return { rowId, colId: EDITABLE_IDS[c - 1] }
        if (r > 0) return { rowId: rows[r - 1].original.id, colId: EDITABLE_IDS[EDITABLE_IDS.length - 1] }
        return null
      }
      if (r < rows.length - 1) return { rowId: rows[r + 1].original.id, colId }
      return null
    }
    return {
      edit,
      channels,
      startEdit: (rowId, colId) => setEdit({ rowId, colId }),
      cancel: () => setEdit(null),
      commitMove: async (app, field, type, raw, move) => {
        try {
          if (type === 'status') {
            if (raw && raw !== app.status) await repo.changeStatus(app.id, raw as Status)
          } else if ((field === 'company' || field === 'position') && !raw.trim()) {
            // 必填项不允许清空,忽略本次提交
          } else {
            const patch: Record<string, unknown> = {}
            if (type === 'number') {
              const n = parseFloat(raw)
              patch[field] = Number.isFinite(n) ? n : undefined
            } else if (type === 'date') {
              patch[field] = raw ? dayjs(raw).toISOString() : undefined
            } else {
              patch[field] = raw.trim() || undefined
            }
            await repo.updateApplication(app.id, patch as Partial<Application>)
          }
        } finally {
          if (move === 'none') {
            setEdit((prev) => (prev?.rowId === app.id && prev?.colId === field ? null : prev))
          } else {
            setEdit(neighbor(app.id, field, move))
          }
        }
      },
    }
  }, [edit, channels, table])

  return (
    <div className="space-y-4">
      <StatsCards apps={apps} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="搜索公司 / 岗位 / 备注…"
            className="h-10 rounded-full border-0 pl-9 pr-4 text-sm outline-none"
            style={{
              background: 'var(--md-sys-color-surface-variant)',
              color: 'var(--md-sys-color-on-surface)',
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | '')}
          className="rounded-md border px-2 py-1.5 text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <option value="">全部状态</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL_ZH[s]}
            </option>
          ))}
        </select>
        {tags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="rounded-md border px-2 py-1.5 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <option value="">全部标签</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outlined" onClick={onExport} icon={<IconDownload size={16} />}>
            导出备份
          </Button>
          <Button
            variant="outlined"
            onClick={() => fileRef.current?.click()}
            icon={<IconUpload size={16} />}
          >
            导入备份
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImportFile}
          />
          <Button variant="text" onClick={onImportLegacy}>
            导入旧版
          </Button>
          <Button variant="tonal" onClick={onCopyLast} icon={<IconCopy size={16} />}>
            复制上一条
          </Button>
          <Button variant="filled" onClick={onAdd} icon={<IconPlus size={16} />}>
            新增投递
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm"
          style={{ borderColor: 'var(--info)', background: 'var(--surface)' }}
        >
          <span className="font-medium">已选 {selectedIds.length} 项</span>
          <select
            value=""
            onChange={onBulkStatus}
            className="rounded-md border px-2 py-1 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <option value="">批量改状态…</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL_ZH[s]}
              </option>
            ))}
          </select>
          {tags.length > 0 && (
            <select
              value=""
              onChange={onBulkTag}
              className="rounded-md border px-2 py-1 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <option value="">批量打标签…</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          <Button
            variant="outlined"
            onClick={onBulkDelete}
            className="h-9 px-4"
            style={{ borderColor: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-error)' }}
          >
            批量删除
          </Button>
          <Button variant="text" onClick={() => setRowSelection({})} className="ml-auto h-9 px-3">
            取消选择
          </Button>
        </div>
      )}

      {importMsg && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {importMsg}
        </p>
      )}
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        提示:点击单元格可直接编辑,Enter 下移、Tab 右移、Esc 取消;勾选行可批量操作;点箭头展开时间线与联系人;薪资等结构化字段用右侧
        <IconEdit size={12} className="mx-1 inline" /> 详情编辑。
      </p>

      <GridContext.Provider value={gridApi}>
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg)' }}>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      onClick={h.column.getToggleSortingHandler()}
                      className="select-none px-3 py-2 text-left text-xs font-medium uppercase tracking-wide"
                      style={{
                        color: 'var(--text-muted)',
                        borderBottom: '1px solid var(--border)',
                        cursor: h.column.getCanSort() ? 'pointer' : 'default',
                      }}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted() as string] ?? ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => {
                const level = timeoutLevel(row.original, settings)
                return (
                  <Fragment key={row.id}>
                    <tr
                      style={{
                        borderBottom: '1px solid var(--border)',
                        borderLeft: `3px solid ${TIMEOUT_COLORS[level]}`,
                        background: row.getIsSelected() ? 'var(--bg)' : undefined,
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {expanded.has(row.original.id) && (
                      <tr>
                        <td colSpan={columns.length} style={{ borderBottom: '1px solid var(--border)' }}>
                          <DetailPanel app={row.original} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-12 text-center text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    暂无记录,点击「新增投递」开始记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GridContext.Provider>

      {formOpen && <EntryForm editing={editingApp} initial={initial} onClose={() => setFormOpen(false)} />}
    </div>
  )
}
