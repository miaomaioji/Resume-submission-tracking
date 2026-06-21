import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  forwardRef,
} from 'react'

const base =
  'w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-2'

function fieldStyle(error?: boolean) {
  return {
    borderColor: error ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-outline)',
    color: 'var(--md-sys-color-on-surface)',
    background: 'var(--md-sys-color-surface)',
  }
}

function Label({ label, error, children }: { label?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      {label && (
        <span
          className="mb-1 block text-xs font-medium"
          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {label}
        </span>
      )}
      {children}
      {error && (
        <span className="mt-1 block text-xs" style={{ color: 'var(--md-sys-color-error)' }}>
          {error}
        </span>
      )}
    </label>
  )
}

export const TextField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(({ label, error, className = '', ...props }, ref) => (
  <Label label={label} error={error}>
    <input ref={ref} {...props} className={`${base} ${className}`} style={fieldStyle(!!error)} />
  </Label>
))
TextField.displayName = 'TextField'

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: ReactNode }
>(({ label, className = '', children, ...props }, ref) => (
  <Label label={label}>
    <select ref={ref} {...props} className={`${base} ${className}`} style={fieldStyle(false)}>
      {children}
    </select>
  </Label>
))
Select.displayName = 'Select'

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
>(({ label, className = '', ...props }, ref) => (
  <Label label={label}>
    <textarea
      ref={ref}
      {...props}
      className={`${base} ${className}`}
      style={{ ...fieldStyle(false), minHeight: 72, resize: 'vertical' }}
    />
  </Label>
))
TextArea.displayName = 'TextArea'
