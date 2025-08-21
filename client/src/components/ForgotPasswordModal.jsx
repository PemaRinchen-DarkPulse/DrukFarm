import React from 'react'

export default function ForgotPasswordModal({ open, onClose }){
  if(!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold">Reset your password</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Enter your email and we'll send reset instructions.</p>
        <form className="mt-4" onSubmit={(e)=>{e.preventDefault(); alert('Password reset link sent (demo)'); onClose()}}>
          <input type="email" placeholder="you@example.com" className="w-full rounded-md border px-3 py-2" required />
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={onClose} className="mr-2 px-4 py-2 rounded-md border">Cancel</button>
            <button className="px-4 py-2 rounded-md bg-emerald-600 text-white">Send</button>
          </div>
        </form>
      </div>
    </div>
  )
}
