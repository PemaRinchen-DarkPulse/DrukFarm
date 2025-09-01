import React from 'react'

export function Card({ children, className = '' }) {
  return (
  <div className={`bg-card text-card-foreground border border-border shadow-sm rounded-lg p-6 ${className}`}>
      {children}
    </div>
  )
}

export default Card
