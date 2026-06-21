import { type ButtonHTMLAttributes, type ReactNode } from 'react'

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text'

const STYLES: Record<ButtonVariant, { background: string; color: string; border: string }> = {
  filled: {
    background: 'var(--md-sys-color-primary)',
    color: 'var(--md-sys-color-on-primary)',
    border: 'none',
  },
  tonal: {
    background: 'var(--md-sys-color-secondary-container)',
    color: 'var(--md-sys-color-on-secondary-container)',
    border: 'none',
  },
  outlined: {
    background: 'transparent',
    color: 'var(--md-sys-color-primary)',
    border: '1px solid var(--md-sys-color-outline)',
  },
  text: { background: 'transparent', color: 'var(--md-sys-color-primary)', border: 'none' },
}

/** M3 按钮:pill 形 + 状态层(hover 8% / active 12%)。 */
export function Button({
  variant = 'filled',
  icon,
  children,
  className = '',
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; icon?: ReactNode }) {
  return (
    <button
      {...props}
      className={`group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-full px-5 text-sm font-medium disabled:pointer-events-none disabled:opacity-50 ${className}`}
      style={{ ...STYLES[variant], ...style }}
    >
      <span
        aria-hidden
        className="absolute inset-0 bg-current opacity-0 transition-opacity duration-150 group-hover:opacity-[0.08] group-active:opacity-[0.12]"
      />
      <span className="relative inline-flex items-center gap-2">
        {icon}
        {children}
      </span>
    </button>
  )
}
