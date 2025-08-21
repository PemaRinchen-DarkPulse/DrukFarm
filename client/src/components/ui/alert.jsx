import React from 'react'

export function Alert({ title, description, variant = 'destructive', onClose }) {
  const base = 'p-3 rounded-md flex items-start gap-3 border';
  const styles = variant === 'destructive' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
  return (
    <div className={`${base} ${styles}`} role="alert">
      <div className="flex-1">
        {title && <div className="font-semibold">{title}</div>}
        {description && <div className="text-sm">{description}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} className="text-sm underline opacity-80">Close</button>
      )}
    </div>
  )
}

export default Alert
