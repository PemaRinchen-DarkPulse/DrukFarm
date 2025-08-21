import React, { useState } from 'react'

export default function ForgotPasswordModal({ open, onClose }){
  const [cid, setCid] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({})

  if(!open) return null

  function onlyDigits(v, maxLen){
    if(!v) return ''
    return v.replace(/\D/g,'').slice(0, maxLen)
  }

  function isValidCID(v){ return /^\d{11}$/.test(v) }
  function isValidPhone(v){ return /^\d{8}$/.test(v) }

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if(!isValidCID(cid)) errs.cid = 'CID must be exactly 11 digits'
    if(!isValidPhone(phone)) errs.phone = 'Phone must be exactly 8 digits'
    setErrors(errs)
    if(Object.keys(errs).length) return
    alert('Password reset instructions sent (demo)')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold">Reset your password</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Enter your CID and phone number to receive reset instructions.</p>
        <form className="mt-4" onSubmit={submit}>
          <label className="block">
            <span className="text-sm font-medium">CID</span>
            <input type="text" placeholder="11 digit CID" className={`w-full rounded-md border px-3 py-2 mt-1 ${errors.cid ? 'border-red-500' : ''}`} value={cid} onChange={(e)=>setCid(onlyDigits(e.target.value,11))} />
            {errors.cid && <p className="text-xs text-red-600 mt-1">{errors.cid}</p>}
          </label>

          <label className="block mt-3">
            <span className="text-sm font-medium">Phone Number</span>
            <input type="text" placeholder="8 digit phone" className={`w-full rounded-md border px-3 py-2 mt-1 ${errors.phone ? 'border-red-500' : ''}`} value={phone} onChange={(e)=>setPhone(onlyDigits(e.target.value,8))} />
            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
          </label>

          <div className="mt-4 flex justify-end">
            <button type="button" onClick={onClose} className="mr-2 px-4 py-2 rounded-md border">Cancel</button>
            <button className="px-4 py-2 rounded-md bg-emerald-600 text-white">Send</button>
          </div>
        </form>
      </div>
    </div>
  )
}
