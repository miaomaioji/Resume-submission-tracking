import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconCalendarEvent, IconLayoutKanban, IconSettings, IconTable } from '@tabler/icons-react'

const NAV = [
  { to: '/table', key: 'table', Icon: IconTable },
  { to: '/kanban', key: 'kanban', Icon: IconLayoutKanban },
  { to: '/calendar', key: 'calendar', Icon: IconCalendarEvent },
  { to: '/settings', key: 'settings', Icon: IconSettings },
] as const

export function Layout() {
  const { t } = useTranslation()
  return (
    <div className="flex h-full flex-col">
      <header
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h1 className="text-sm font-semibold">{t('app.title')}</h1>
        <nav className="flex gap-1">
          {NAV.map(({ to, key, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm"
              style={({ isActive }) => ({
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'var(--bg)' : 'var(--text-muted)',
              })}
            >
              <Icon size={16} />
              {t(`nav.${key}`)}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="min-h-0 flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
