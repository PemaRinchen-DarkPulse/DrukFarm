import React from 'react'

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-lg p-6 ${className}`}>
      {children}
    </div>
  )
}

export default Card
