import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  IconCalendarEvent,
  IconDeviceDesktop,
  IconLayoutKanban,
  IconMoon,
  IconPlus,
  IconSettings,
  IconSun,
  IconTable,
} from '@tabler/icons-react'
import { useSettings } from '@/hooks/useData'
import { repo } from '@/db/repository'
import { ReminderBell } from '@/components/ReminderBell'
import { watchAndApplyTheme } from '@/app/m3-theme'
import { useUiStore } from '@/app/uiStore'
import type { Settings } from '@/domain/types'

const NAV = [
  { to: '/table', key: 'table', Icon: IconTable },
  { to: '/kanban', key: 'kanban', Icon: IconLayoutKanban },
  { to: '/calendar', key: 'calendar', Icon: IconCalendarEvent },
  { to: '/settings', key: 'settings', Icon: IconSettings },
] as const

const THEMES: Settings['theme'][] = ['system', 'light', 'dark']
const THEME_ICON = { system: IconDeviceDesktop, light: IconSun, dark: IconMoon }
const THEME_LABEL = { system: '跟随系统', light: '浅色', dark: '深色' }

export function Layout() {
  const { t } = useTranslation()
  const settings = useSettings()
  const theme = settings.theme
  const navigate = useNavigate()
  const requestAdd = useUiStore((s) => s.requestAdd)

  // 应用 M3 配色(system 跟随系统切换)
  useEffect(() => watchAndApplyTheme(theme), [theme])

  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
    void repo.saveSettings({ theme: next })
  }
  const ThemeIcon = THEME_ICON[theme]

  return (
    <div className="flex h-full flex-col">
      {/* M3 Top App Bar */}
      <header
        className="flex shrink-0 items-center justify-between gap-2 px-4"
        style={{
          height: 64,
          background: 'var(--md-sys-color-surface)',
          color: 'var(--md-sys-color-on-surface)',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        }}
      >
        <h1 className="text-lg font-medium tracking-tight">{t('app.title')}</h1>
        <div className="flex items-center gap-1">
          {/* 桌面端:顶栏内联导航;移动端隐藏(改用底部导航) */}
          <nav className="mr-1 hidden gap-1 md:flex">
            {NAV.map(({ to, key, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
                style={({ isActive }) => ({
                  background: isActive ? 'var(--md-sys-color-secondary-container)' : 'transparent',
                  color: isActive
                    ? 'var(--md-sys-color-on-secondary-container)'
                    : 'var(--md-sys-color-on-surface-variant)',
                })}
              >
                <Icon size={18} />
                {t(`nav.${key}`)}
              </NavLink>
            ))}
          </nav>
          <ReminderBell />
          <button
            type="button"
            onClick={cycleTheme}
            className="rounded-full p-2"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            aria-label="切换主题"
            title={`主题:${THEME_LABEL[theme]}`}
          >
            <ThemeIcon size={20} />
          </button>
        </div>
      </header>

      {/* 内容区(底部留白避开底部导航与 FAB) */}
      <main
        className="min-h-0 flex-1 overflow-auto p-4 pb-28 md:pb-6"
        style={{ background: 'var(--md-sys-color-background)' }}
      >
        <Outlet />
      </main>

      {/* M3 Extended FAB:主操作「新增投递」(右下,拇指热区) */}
      <button
        type="button"
        onClick={() => {
          requestAdd()
          navigate('/table')
        }}
        className="fixed bottom-24 right-4 z-30 flex h-14 items-center gap-2 rounded-2xl px-5 text-sm font-medium shadow-lg md:bottom-6 md:right-6"
        style={{
          background: 'var(--md-sys-color-primary-container)',
          color: 'var(--md-sys-color-on-primary-container)',
        }}
        aria-label="新增投递"
      >
        <IconPlus size={22} />
        新增
      </button>

      {/* M3 Bottom Navigation Bar(移动端) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex h-20 items-stretch justify-around md:hidden"
        style={{
          background: 'var(--md-sys-color-surface)',
          borderTop: '1px solid var(--md-sys-color-outline-variant)',
        }}
      >
        {NAV.map(({ to, key, Icon }) => (
          <NavLink key={to} to={to} className="flex flex-1 flex-col items-center gap-1 pt-3">
            {({ isActive }) => (
              <>
                <span
                  className="flex h-8 w-16 items-center justify-center rounded-full transition-colors"
                  style={{
                    background: isActive ? 'var(--md-sys-color-secondary-container)' : 'transparent',
                    color: isActive
                      ? 'var(--md-sys-color-on-secondary-container)'
                      : 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  <Icon size={22} />
                </span>
                <span
                  className="text-xs"
                  style={{
                    color: isActive
                      ? 'var(--md-sys-color-on-surface)'
                      : 'var(--md-sys-color-on-surface-variant)',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {t(`nav.${key}`)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
