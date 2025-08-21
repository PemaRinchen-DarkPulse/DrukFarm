import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, opts = {}) => {
    const id = Date.now() + Math.random()
    setToasts((s) => [...s, { id, message, ...opts }])
    if (!opts.persistent) setTimeout(() => setToasts((s) => s.filter(t => t.id !== id)), opts.duration || 3000)
  }, [])

  const remove = useCallback((id) => setToasts((s) => s.filter(t => t.id !== id)), [])

  return (
    <ToastContext.Provider value={{ show, remove }}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className="bg-emerald-600 text-white px-4 py-2 rounded shadow">{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(){
  const ctx = useContext(ToastContext)
  if(!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default ToastProvider
