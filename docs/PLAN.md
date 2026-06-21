# 简历投递管理工具 — 细化开发方案 (v2)

> 本文档是对 `resume-tracker-plan.md` 的细化与落地版,目标是给出**可直接照着开干**的技术架构、数据模型、功能详设、里程碑与验收标准。
> 现状:仓库已有单文件原型 [`job_tracker_v2.html`](../job_tracker_v2.html),本方案在其基础上演进为正式的「本地优先(local-first)Web/PWA」开源应用。

---

## 0. 决策记录(Decision Log)

> ✅ = 你已明确选择;🔒 = 由仓库现状锁定;◽ = 暂用建议默认(可随时改,见 §11)。

| # | 决策点 | 结论 | 来源 |
|---|---|---|---|
| 1 | 产品性质 | **开源项目** | ✅ |
| 2 | 用户模型 | 单用户 / 多设备同步(同步留到后期) | ◽ |
| 3 | 首发平台 | **Web 优先**(PWA,可装到 Android) | ◽ |
| 4 | 前端框架 | **React + TypeScript + Vite + PWA** | ◽ |
| 5 | 数据存储 | **纯本地**(IndexedDB,经 Dexie) | ✅ |
| 6 | 后端策略 | 不用 BaaS;**未来自建后端**(本地优先,MVP 不联网) | ✅ |
| 7 | 薪资字段 | 完全结构化(min/max + 币种 + 月/年 + 几薪) | ◽ |
| 8 | 多版本简历 | 不做 | ◽ |
| 9 | 同公司多岗位 | 每条记录独立 | ◽ |
| 10 | 状态枚举 | **固定 8 态**(已确认,见 §3.3) | ✅ |
| 11 | 联系人信息 | 作为独立 `contacts` 表(支持多个 HR/面试官) | ◽ |
| 12 | MVP 视图 | 三视图全要,但按阶段先后实现(表格→看板→日历) | ◽ |
| 13 | 表格编辑 | **Excel 式内联单元格编辑** + 键盘导航 | ✅ |
| 14 | 超时阈值 | **按渠道分别设置**(全局默认 + 渠道覆盖) | ✅ |
| 15 | 面试冲突检测 | 第三阶段 | ◽ |
| 16 | CSV/Excel 导入 | 后续阶段(MVP 先做 JSON 导入/导出) | ◽ |
| 17 | 链接自动抓取 | 不做 | ◽ |
| 18 | 快捷录入 | 复制上一条 + 模板 | ◽ |
| 19 | 提醒渠道 | 应用内 + 系统通知(Web 受限,见 §6.7) | ◽ |
| 20 | 日历同步 | 导出 ICS / 订阅系统日历 | ◽ |
| 21 | 邮件提醒 | 不纳入(需后端) | ◽ |
| 22 | 多语言 | 后续(先中文,但工程上预埋 i18n) | ◽ |
| 23 | 深色模式 | 后续(但 token 体系一开始就支持) | ◽ |
| 24 | 配色 | 沿用规划配色(靛蓝 + 薄荷绿) | ◽ |
| 25 | 导出/备份 | 做(JSON);加密后续 | ◽ |
| — | 开源许可证 | **GPL-3.0**(仓库已有 LICENSE) | 🔒 |

---

## 1. 现状盘点:原型能复用什么

`job_tracker_v2.html` 已验证了核心闭环,值得保留的部分:

| 原型已有 | 处理方式 |
|---|---|
| 统计卡片(总投递/进行中/待处理节点/已拿offer) | **保留**,迁到统计组件 |
| 表格 + 筛选 + 新增/编辑弹窗 | **保留交互模式**,表格升级为可内联编辑的 TanStack Table |
| `localStorage['job_tracker']` 数据 | **写迁移脚本**导入新库,老数据不丢(见 §5.5) |
| 状态徽章配色(蓝/紫/琥珀/绿/红/灰) | **保留**这套好看的配色,映射到设计 token |
| `类型`(实习/校招/提前批) | plan 里漏了,**补进数据模型**(`jobType`) |
| Tabler 图标 | **继续用** `@tabler/icons-react`,保持视觉一致 |

> 处理建议:把原型移动到 `legacy/job_tracker_v2.html` 作为参考与一次性数据迁移源,README 注明新版入口。

⚠️ **GPL-3.0 注意**:新版所有依赖须与 GPLv3 兼容。MIT / Apache-2.0 / BSD / ISC 许可的库都可被纳入 GPLv3 作品(下面选型均满足)。整体作品对外分发时须以 GPLv3 开源。

---

## 2. 技术架构

### 2.1 架构总览(本地优先,分层)

```
┌─────────────────────────────────────────────┐
│  UI 层  React 组件 / 三视图(表格·看板·日历)   │
├─────────────────────────────────────────────┤
│  领域层 domain/  类型·枚举·状态机·超时算法     │
├─────────────────────────────────────────────┤
│  数据访问层 Repository(接口)                  │  ← 关键抽象
│    ├─ LocalRepository (Dexie/IndexedDB) ← MVP │
│    └─ RemoteRepository (自建后端)   ← 未来插入 │
└─────────────────────────────────────────────┘
```

**核心设计**:所有读写都走 `Repository` 接口。MVP 只实现本地实现;将来加同步只需补一个远端实现 + 同步层,UI 与领域层不动。这样满足「现在纯本地、将来自建后端」而不返工。

### 2.2 技术选型(均 GPL-3.0 兼容)

| 领域 | 选型 | 许可 | 理由 |
|---|---|---|---|
| 框架 | React 18 + TypeScript(strict) | MIT | 生态最大,表格/看板/日历库齐全 |
| 构建 | Vite + `vite-plugin-pwa` | MIT | 快;一键 PWA(可装到 Android) |
| 样式 | Tailwind CSS + CSS 变量 token | MIT | 主题/深色模式切换简单 |
| 组件 | Radix UI primitives(或 shadcn/ui) | MIT | 无障碍,可定制 |
| 本地库 | **Dexie.js** + `dexie-react-hooks` | Apache-2.0 | IndexedDB 最佳封装;`useLiveQuery` 天然响应式 |
| 表格 | **TanStack Table v8** + TanStack Virtual | MIT | 无头、强类型、虚拟滚动;内联编辑自定义自由度高 |
| 拖拽(看板) | **dnd-kit** | MIT | 现代、无障碍、性能好 |
| 日历 | **react-big-calendar** | MIT | 月/周/日视图开箱即用 |
| 表单 | react-hook-form + zod | MIT | 校验声明式 |
| 日期 | day.js | MIT | 体积小 |
| UI 状态 | Zustand | MIT | 轻;数据态交给 Dexie live query |
| i18n | i18next + react-i18next | MIT | 先 zh-CN,预埋 en |
| 图标 | @tabler/icons-react | MIT | 与原型一致 |
| 日历导出 | `ics` | ISC | 生成 .ics |
| 路由 | react-router | MIT | 四个视图路由 |
| 测试 | Vitest + React Testing Library(+ Playwright 可选) | MIT | — |
| 质量 | ESLint + Prettier + TypeScript | MIT | — |
| CI/部署 | GitHub Actions + **GitHub Pages** | — | 纯静态、免后端、白嫖托管,正好契合本地优先 |

> 备选:若日后表格数据量很大、想要更「Excel」的画布级体验,可把 TanStack Table 换成 **Glide Data Grid**(MIT,canvas 渲染)。MVP 先用 TanStack。

### 2.3 目录结构

```
/
├─ docs/PLAN.md                  # 本文档
├─ legacy/job_tracker_v2.html    # 原型(参考 + 迁移源)
├─ public/{manifest.webmanifest, icons/}
├─ src/
│  ├─ main.tsx  App.tsx
│  ├─ app/                       # 路由 / 布局 / Providers
│  ├─ db/
│  │  ├─ schema.ts               # Dexie 表结构
│  │  ├─ repository.ts           # Repository 接口 + 本地实现
│  │  └─ migrate-legacy.ts       # 旧 localStorage → 新库
│  ├─ domain/                    # 类型·枚举·状态机·超时算法
│  ├─ features/
│  │  ├─ table/ kanban/ calendar/ entry/ timeline/ reminders/ settings/
│  ├─ components/                # 共享 UI(徽章/统计卡/日期选择器…)
│  ├─ lib/                       # utils / ics / backup / i18n
│  └─ styles/                    # tokens.css, tailwind 入口
├─ index.html  vite.config.ts  package.json
├─ README.md  CONTRIBUTING.md  LICENSE(GPL-3.0)
```

---

## 3. 数据模型

### 3.1 TypeScript 类型

```ts
// domain/types.ts
export interface Application {
  id: string                      // uuid
  company: string
  position: string
  jobType?: JobType               // 实习/校招/提前批/社招/其他
  channel?: string                // 渠道 id(见 channels 表)
  status: Status
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string         // 默认 'CNY'
  salaryPeriod?: 'monthly' | 'yearly'
  salaryMonths?: number           // 几薪,如 13 / 14 / 16
  location?: string
  tagIds: string[]
  appliedAt?: string              // ISO,投递日期
  lastContactAt?: string          // ISO,最近沟通(超时计算基准)
  nextFollowUpAt?: string         // ISO,下次跟进
  nextActionLabel?: string        // “技术一面”“笔试截止”(继承原型 nextLabel)
  interviewAt?: string            // ISO,下一场面试时间
  sourceUrl?: string
  notes?: string
  // —— 为同步预留 ——
  createdAt: string
  updatedAt: string
  deletedAt?: string | null       // 软删除
  version: number
}

export interface TimelineEvent {
  id: string
  applicationId: string
  type: 'status_change' | 'note' | 'interview' | 'custom'
  at: string                      // ISO
  fromStatus?: Status
  toStatus?: Status
  label?: string                  // “技术一面”
  note?: string
  createdAt: string
}

export interface Contact {
  id: string; applicationId: string
  name?: string; role?: string    // role: HR / 面试官
  phone?: string; wechat?: string; email?: string; note?: string
}

export interface Tag { id: string; name: string; color: string }
export interface Channel { id: string; name: string; order: number }

export interface TimeoutRule { attentionDays: number; warnDays: number; alertDays: number }
export interface Settings {
  id: 'singleton'
  language: 'zh-CN' | 'en'
  theme: 'system' | 'light' | 'dark'
  timeout: { default: TimeoutRule; byChannel: Record<string, TimeoutRule> }
  reminders: { interviewDayBefore: boolean; interviewHoursBefore: number; followUpDue: boolean; idleTimeout: boolean }
  table: { columnOrder: string[]; hiddenColumns: string[]; columnWidths: Record<string, number> }
}
```

### 3.2 Dexie(IndexedDB)表结构

```ts
// db/schema.ts
import Dexie, { Table } from 'dexie'
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
      applications: 'id, status, channel, company, appliedAt, nextFollowUpAt, interviewAt, lastContactAt, updatedAt, deletedAt',
      events:   'id, applicationId, at, type',
      contacts: 'id, applicationId',
      tags:     'id, name',
      channels: 'id, order',
      settings: 'id',
    })
  }
}
export const db = new AppDB()
```

### 3.3 枚举:状态(已确认 ✅)

原型有 7 态(校招向),plan 有 9 态(通用)。两者打架。建议**合并为 8 个"主状态"**(用作看板列与筛选),把"技术一面/二面/HR面"等**具体轮次放进时间线事件**,既保留校招的细粒度,又不让状态枚举爆炸:

```ts
export const STATUS = {
  CREATED: 'created',            // 已创建(草稿,未投)
  APPLIED: 'applied',           // 已投递
  WRITTEN_TEST: 'written_test', // 笔试中
  INTERVIEWING: 'interviewing', // 面试中(具体轮次记入时间线)
  AWAITING: 'awaiting_result',  // 待结果
  OFFER: 'offer',               // 已 OC
  REJECTED: 'rejected',         // 已拒绝/已挂
  ABANDONED: 'abandoned',       // 已放弃
} as const
export type Status = typeof STATUS[keyof typeof STATUS]

export const STATUS_LABEL_ZH: Record<Status, string> = {
  created: '已创建', applied: '已投递', written_test: '笔试中',
  interviewing: '面试中', awaiting_result: '待结果',
  offer: '已 OC', rejected: '已拒绝', abandoned: '已放弃',
}
```

> ✅ **已确认(2026-06-21)**:采用这套 8 态。具体面试轮次(技术一面/二面/HR面…)记入**时间线事件**,不进状态枚举。

### 3.4 状态机(允许的流转)

```ts
export const ALLOWED_TRANSITIONS: Record<Status, Status[]> = {
  created:         ['applied', 'abandoned'],
  applied:         ['written_test', 'interviewing', 'awaiting_result', 'rejected', 'abandoned'],
  written_test:    ['interviewing', 'awaiting_result', 'rejected', 'abandoned'],
  interviewing:    ['interviewing', 'awaiting_result', 'offer', 'rejected', 'abandoned'], // 自指=新一轮
  awaiting_result: ['interviewing', 'offer', 'rejected', 'abandoned'],
  offer:           ['abandoned'],
  rejected:        [],
  abandoned:       [],
}
```
UI 规则:不在允许集内的流转给出**警告但仍可手动强改**(求职现实里流程不总线性)。每次状态变化自动写一条 `status_change` 时间线事件。

### 3.5 其他枚举与默认值

```ts
export const JOB_TYPE = ['实习', '校招', '提前批', '社招', '其他'] as const
export type JobType = typeof JOB_TYPE[number]

// 默认渠道(可在设置里增删改;每个渠道可单独设超时阈值)
export const DEFAULT_CHANNELS = ['BOSS直聘', '猎聘', '内推', '官网', '智联招聘', '前程无忧', '其他']

// 默认超时阈值(沿用 plan 的 3/7/14)
export const DEFAULT_TIMEOUT: TimeoutRule = { attentionDays: 3, warnDays: 7, alertDays: 14 }
```

### 3.6 旧数据迁移映射

```ts
// db/migrate-legacy.ts —— 读取 localStorage['job_tracker'] 一次性导入
const STATUS_MAP: Record<string, Status> = {
  '投递中': 'applied', '笔试': 'written_test',
  '技术面': 'interviewing', 'HR面': 'interviewing',
  '已拿offer': 'offer', '已挂': 'rejected', '已放弃': 'abandoned',
}
// 字段:company→company, role→position, type→jobType, date→appliedAt,
//       nextDate→nextFollowUpAt, nextLabel→nextActionLabel,
//       hr→新建一条 contact, note→notes
// 注意:技术面/HR面 都并入 interviewing,但额外补一条 timeline 事件(label='技术面'/'HR面')以保留轮次信息。
```

---

## 4. UI / UX 与设计 token

### 4.1 设计 token(替换原型里宿主环境的 `--color-*`)

```css
:root{
  --bg:#F8FAFC; --surface:#FFFFFF; --text:#0F172A; --text-muted:#64748B;
  --border:#E2E8F0; --primary:#1E293B; --accent:#10B981;
  --info:#3B82F6; --warn:#F59E0B; --alert:#EF4444;
  --radius-md:8px; --radius-lg:12px;
}
[data-theme="dark"]{
  --bg:#0F172A; --surface:#1E293B; --text:#F1F5F9; --text-muted:#94A3B8;
  --border:#334155; --primary:#E2E8F0; /* accent/告警色保持 */
}
```
状态徽章沿用原型那套配色(投递=蓝、笔试=紫、面试=琥珀、OC=薄荷绿、拒绝=红、放弃=灰)。

### 4.2 交互原则(继承 plan §5.3)
- 首屏即数据,少跳转;表格内联编辑、键盘可达。
- 重要状态用颜色 + 图标双重区分(色盲友好)。
- 三视图共享同一份数据,选中态互通(见 §6.4)。

---

## 5. 功能详设(关键模块)

### 5.1 主表格 + 内联编辑(决策 #13)
- 列:公司 / 岗位 / 类型 / 渠道 / 状态 / 薪资 / 地点 / 标签 / 投递日期 / 最近沟通 / 下次跟进 / 备注 / 操作。
- **内联编辑器**(按列类型):文本框、数字、下拉(状态/渠道/类型)、日期选择、标签多选 chips、URL。
- **键盘导航**:`↑↓←→` 移动单元格,`Enter` 进入/确认,`Esc` 取消,`Tab` 下一格。
- **批量**:Shift 连选 → 批量改状态 / 批量打标签 / 批量删除。
- 列显隐、拖动排序、列宽 → 持久化到 `settings.table`。
- 行展开 → 时间线 + 联系人 + 详情。
- 搜索(全字段)/ 筛选(状态、渠道、标签、超时档位)/ 排序。

### 5.2 时间线(里程碑)
- 每条记录一条事件流;状态变化自动留痕,也可手动加"备注/面试"事件。
- 展示:进度历史、**当前节点已停留天数**(= now − 最近一次 `status_change.at`)、下一步动作(`nextActionLabel`)。

### 5.3 超时变色(决策 #14,按渠道)
```ts
export type TimeoutLevel = 'none' | 'attention' | 'warn' | 'alert'
const ACTIVE: Status[] = ['applied', 'written_test', 'interviewing', 'awaiting_result']

export function timeoutLevel(app: Application, s: Settings, now: Date): TimeoutLevel {
  if (!ACTIVE.includes(app.status)) return 'none'          // 终态不计
  const base = app.lastContactAt ?? app.appliedAt
  if (!base) return 'none'
  const days = Math.floor((now.getTime() - new Date(base).getTime()) / 86_400_000)
  const r = s.timeout.byChannel[app.channel ?? ''] ?? s.timeout.default
  if (days >= r.alertDays) return 'alert'                  // 红
  if (days >= r.warnDays) return 'warn'                    // 黄/橙
  if (days >= r.attentionDays) return 'attention'          // 提示
  return 'none'
}
```
- 行/单元格按档位着色;可选「达到 warn 自动打 `待跟进` 标签」。
- 设置页:全局默认阈值 + 每个渠道单独覆盖。

### 5.4 看板(Kanban)
- 列 = 8 个主状态;dnd-kit 拖拽改状态,**拖拽即写一条 `status_change` 时间线事件**,并同步表格/日历。
- 列可折叠;卡片显示公司/岗位/超时档位色条/下次节点。

### 5.5 日历 + 三视图联动(决策 #12)
- react-big-calendar 展示 `interviewAt`(面试)与 `nextFollowUpAt`(跟进)。
- **联动**:表格/看板选中某条 → 日历跳到对应日期并高亮;日历点某天 → 表格筛出当天相关记录。三视图共享一个"选中/筛选"状态(Zustand)。

### 5.6 录入(决策 #18)
- 简洁表单(react-hook-form + zod);**复制上一条**、**保存为模板/从模板新建**;快捷键 `n` 新增。
- 薪资输入做结构化(min–max + 币种 + 月/年 + 几薪),自动格式化展示(如 `15–25K·14薪`)。

### 5.7 面试防撞车(决策 #15,第三阶段)
- 新增/改 `interviewAt` 时,检测与既有面试时间窗(默认时长可配)重叠 → 提示「仍然保留 / 调整时间」。

### 5.8 提醒(决策 #19,Web 能力边界要诚实说明)
- **应用内提醒中心**:从数据实时算出"到期跟进 / 面试临近 / 超时未回",始终可用。
- **系统通知**:Web Notifications API,需用户授权;**应用打开 / PWA 在前台时可靠**。
- ⚠️ **关掉应用后的定时后台通知,在纯 Web 下不可靠**(Notification Triggers / Periodic Background Sync 支持有限)。要真正稳的定时推送,需要 ① 未来后端 + Push API,或 ② 用 Capacitor/TWA 包成 Android 原生壳拿本地通知。MVP 不承诺后台推送。

### 5.9 日历导出(决策 #20)
- 用 `ics` 生成 `.ics`(单场面试或批量),用户导入系统日历。可订阅式 webcal 需后端,留待后期。

### 5.10 备份/导出(决策 #25)
- 全量导出 JSON / 从 JSON 导入(覆盖或合并)。含旧 `localStorage` 一键迁移。加密留后期。

---

## 6. 开源工程化

- `README.md`:中文为主,含截图、在线 Demo(GitHub Pages)、本地开发说明。
- `CONTRIBUTING.md` + Issue/PR 模板;Conventional Commits。
- 源码文件头加 GPL-3.0 简短声明。
- CI(GitHub Actions):typecheck → lint → test → build;推 main 自动部署 Pages。
- 测试:领域层(状态机、超时算法、迁移映射)优先单测覆盖。

---

## 7. 里程碑与验收标准

> 周数为单人兼职的粗估,按相对顺序看即可。

| 阶段 | 内容 | 验收标准 |
|---|---|---|
| **P0 脚手架**(~1周) | Vite+React+TS+Tailwind+PWA 初始化;CI;设计 token;路由/布局壳;Dexie schema;旧数据迁移脚本 | 空应用可跑、可装为 PWA、CI 绿、能导入旧 `localStorage` 数据 |
| **P1 表格+录入(核心MVP)**(~2周) | Repository(本地);TanStack 表格(搜索/筛选/排序/列显隐);**内联编辑+键盘导航**;录入表单 + 复制上一条/模板;行展开;批量;统计卡片;JSON 导入导出 | 增删改查 + 内联编辑 + 搜索/筛选/排序 + 批量全部可用且持久化 |
| **P2 状态+时间线+超时+标签**(~1.5周) | 状态机;切状态自动写时间线;时间线视图 + 停留时长;标签 CRUD/着色;超时(全局+按渠道)变色 + 自动「待跟进」;设置页(渠道管理+阈值) | 改状态留痕;按渠道阈值正确变色;标签可用;设置持久化 |
| **P3 看板+日历+联动+防撞车**(~2周) | 看板拖拽改状态(写时间线);日历展示面试/跟进;三视图联动;面试冲突检测 | 三视图数据一致、联动正确;拖拽更新并留痕;冲突有提示 |
| **P4 提醒+ICS+i18n+深色+Android**(~2周) | 提醒中心 + Web 通知;ICS 导出;中/英 i18n;深/浅主题;PWA 安装到 Android 优化;(可选)Capacitor/TWA 壳 | 到期提醒可见;.ics 可导入系统日历;中英可切;深浅色可切并记忆;Android PWA 可装可用 |
| **P5 自建后端同步(未来)** | RemoteRepository;同步层;软删除/版本号/冲突策略;鉴权 | 多设备同步、离线编辑、冲突可解 |

---

## 8. 未来:自建后端与同步(决策 #6,留到 P5)

MVP 不联网。将来要同步时,在 `Repository` 抽象后接入,二选一(均自托管、非 BaaS):

- **路线 A(全控,推荐契合"自建后端")**:Node(Hono/Fastify)+ SQLite/Postgres + 自定义同步 API。每条记录带 `updatedAt/version/deletedAt`,冲突默认"最后写入优先",必要时弹框让用户选。
- **路线 B(省事)**:PouchDB(浏览器)↔ 自托管 CouchDB,复制与冲突处理开箱即用。

> 现在不必决定;只要 MVP 坚持走 Repository 抽象,两条路都开着。

---

## 9. 风险与对策

- **数据全在浏览器**:清缓存/换设备即丢 → 显著位置提供导出/备份,首次使用引导导出习惯;P5 上同步。
- **大数据量表格性能** → 虚拟滚动(TanStack Virtual)。
- **Web 后台通知不可靠** → 已在 §5.8 诚实标注,必要时走原生壳。
- **GPL 依赖合规** → 选型已限定为 GPL 兼容许可。
- **状态枚举已定**(§3.3,8 态)→ 可安全开 P2。

---

## 10. 成功指标(承接 plan §12)
日打开次数、每条记录平均跟进次数、面试冲突率、无响应岗位平均处理时长、提醒满意度。本地优先下可做**匿名本地统计**,不外传。

---

## 11. 待确认问题(请逐条拍板)

- ~~**Q-A 状态枚举**~~ → ✅ 已定(2026-06-21):§3.3 的 8 态,轮次进时间线。
- **Q-B 其余 ◽ 默认项**:§0 表里所有 ◽ 我都按建议默认了。**要改哪条,直接报编号 + 新选择**即可(如「#12 改成只先做表格」)。
- **Q-C `jobType` 取值**:`实习/校招/提前批/社招/其他` 够用吗?(你像是校招/实习为主)
- **Q-D 原型去留**:同意把 `job_tracker_v2.html` 移到 `legacy/` 并写一次性迁移脚本吗?
- **Q-E 同步后端路线**(可暂不决定):倾向 A(自建 Node+SQLite)还是 B(CouchDB)?
```
