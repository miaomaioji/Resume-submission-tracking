import { type ButtonHTMLAttributes, type ReactNode } from 'react'

/** M3 图标按钮:圆形 + 圆形状态层。 */
export function IconButton({
  children,
  className = '',
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={`group relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ${className}`}
      style={{ color: 'var(--md-sys-color-on-surface-variant)', ...style }}
    >
      <span
        aria-hidden
        className="absolute inset-0 bg-current opacity-0 transition-opacity duration-150 group-hover:opacity-[0.10] group-active:opacity-[0.14]"
      />
      <span className="relative inline-flex">{children}</span>
    </button>
  )
}
