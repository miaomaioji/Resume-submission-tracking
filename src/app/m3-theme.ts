import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
  type Scheme,
} from '@material/material-color-utilities'

// 品牌种子色:靛蓝(主)+ 薄荷绿(作为协调后的强调/第三色)
const SEED = '#1E293B'
const MINT = '#10B981'

const theme = themeFromSourceColor(argbFromHex(SEED), [
  { name: 'mint', value: argbFromHex(MINT), blend: true },
])

export type Mode = 'light' | 'dark'

// 取出本应用需要的 M3 颜色角色(ARGB)
function roleMap(s: Scheme): Record<string, number> {
  return {
    primary: s.primary,
    'on-primary': s.onPrimary,
    'primary-container': s.primaryContainer,
    'on-primary-container': s.onPrimaryContainer,
    secondary: s.secondary,
    'on-secondary': s.onSecondary,
    'secondary-container': s.secondaryContainer,
    'on-secondary-container': s.onSecondaryContainer,
    tertiary: s.tertiary,
    'on-tertiary': s.onTertiary,
    'tertiary-container': s.tertiaryContainer,
    'on-tertiary-container': s.onTertiaryContainer,
    error: s.error,
    'on-error': s.onError,
    'error-container': s.errorContainer,
    'on-error-container': s.onErrorContainer,
    background: s.background,
    'on-background': s.onBackground,
    surface: s.surface,
    'on-surface': s.onSurface,
    'surface-variant': s.surfaceVariant,
    'on-surface-variant': s.onSurfaceVariant,
    outline: s.outline,
    'outline-variant': s.outlineVariant,
    'inverse-surface': s.inverseSurface,
    'inverse-on-surface': s.inverseOnSurface,
    'inverse-primary': s.inversePrimary,
  }
}

/**
 * 把 M3 配色注入 :root(同时写 --md-sys-color-* 与重映射旧语义变量),
 * 全站组件无需逐个改动即可换成 M3 配色。
 */
export function applyMd3Theme(mode: Mode): void {
  const scheme = mode === 'dark' ? theme.schemes.dark : theme.schemes.light
  const roles = roleMap(scheme)
  const root = document.documentElement.style
  const hex = (name: string) => hexFromArgb(roles[name])

  for (const [name, argb] of Object.entries(roles)) {
    root.setProperty(`--md-sys-color-${name}`, hexFromArgb(argb))
  }

  // 协调后的薄荷绿(自定义色)作为强调色
  const mint = theme.customColors[0]
  const mintColor = hexFromArgb(mode === 'dark' ? mint.dark.color : mint.light.color)
  root.setProperty('--md-sys-color-mint', mintColor)

  // —— 旧语义变量重映射到 M3 角色 ——
  root.setProperty('--bg', hex('background'))
  root.setProperty('--surface', hex('surface'))
  root.setProperty('--surface-variant', hex('surface-variant'))
  root.setProperty('--text', hex('on-surface'))
  root.setProperty('--text-muted', hex('on-surface-variant'))
  root.setProperty('--border', hex('outline-variant'))
  root.setProperty('--primary', hex('primary'))
  root.setProperty('--on-primary', hex('on-primary'))
  root.setProperty('--accent', mintColor)
  root.setProperty('--info', hex('primary'))
  root.setProperty('--alert', hex('error'))
  // M3 无“警告”角色,保留琥珀色用于超时中段
  root.setProperty('--warn', '#f59e0b')
}

/** 根据 system/light/dark 解析并应用,返回清理函数(监听系统切换)。 */
export function watchAndApplyTheme(pref: 'system' | 'light' | 'dark'): () => void {
  if (pref !== 'system') {
    applyMd3Theme(pref)
    document.documentElement.dataset.theme = pref
    return () => {}
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = (dark: boolean) => {
    const mode: Mode = dark ? 'dark' : 'light'
    applyMd3Theme(mode)
    document.documentElement.dataset.theme = mode
  }
  apply(mq.matches)
  const handler = (e: MediaQueryListEvent) => apply(e.matches)
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}
