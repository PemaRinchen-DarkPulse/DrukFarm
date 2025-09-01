import React from 'react'

export function Input({ label, id, type = 'text', value, onChange, placeholder, error, ...rest }) {
  const inputEl = (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`mt-1 block w-full rounded-md border px-3 py-2 bg-card border-border focus:outline-none focus:ring-2 transition ${error ? 'border-red-500' : ''}`}
      style={{ boxShadow: 'none' }}
      onFocus={(e) => {
        e.currentTarget.style.outlineColor = 'var(--ring)'
        e.currentTarget.style.boxShadow = '0 0 0 2px var(--ring)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
      {...rest}
    />
  )

  if (label) {
    return (
      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        {inputEl}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </label>
    )
  }

  return (
    <div className="block">
      {inputEl}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default Input
