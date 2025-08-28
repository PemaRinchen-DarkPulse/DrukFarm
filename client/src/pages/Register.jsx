import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Card from '@/components/ui/card'
import Input from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { registerUser } from '@/lib/api'

function isValidCID(cid){
  // CID must be exactly 11 digits
  return /^\d{11}$/.test(cid)
}

function isValidPhone(phone){
  // Phone must be exactly 8 digits
  return /^\d{8}$/.test(phone)
}

function onlyDigits(value, maxLen){
  if(!value) return ''
  return value.replace(/\D/g,'').slice(0, maxLen)
}

function passwordStrength(pw){
  let score = 0
  if(pw.length >= 8) score++
  if(/[A-Z]/.test(pw)) score++
  if(/[0-9]/.test(pw)) score++
  if(/[^A-Za-z0-9]/.test(pw)) score++
  return score // 0..4
}

export default function Register(){
  const dropdownRef = useRef(null)
  const [roleOpen, setRoleOpen] = useState(false)
  const [name, setName] = useState('')
  const [cid, setCid] = useState('')
    const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState('consumer')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const { show } = useToast()
  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleDocPointer(e){
      if (!roleOpen) return
      const el = dropdownRef.current
      if (el && !el.contains(e.target)) setRoleOpen(false)
    }
    function handleKey(e){ if (e.key === 'Escape') setRoleOpen(false) }
    document.addEventListener('mousedown', handleDocPointer)
    document.addEventListener('touchstart', handleDocPointer, { passive: true })
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleDocPointer)
      document.removeEventListener('touchstart', handleDocPointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [roleOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
  if(!name) errs.name = 'Name is required'
  if(!isValidCID(cid)) errs.cid = 'CID must be exactly 11 digits'
    const strength = passwordStrength(password)
    if(strength < 3) errs.password = 'Password is too weak (min 8 chars, mix of letters/numbers)'
    if(password !== confirm) errs.confirm = 'Passwords do not match'
  if(!isValidPhone(phone)) errs.phone = 'Phone must be exactly 8 digits'
  if(!agree) errs.agree = 'You must agree to Terms'
    setErrors(errs)
    if(Object.keys(errs).length) return

    try {
      const roleOptions = [
        { key: 'consumer', title: 'Consumer', desc: 'Buy fresh produce' },
        { key: 'farmer', title: 'Farmer', desc: 'Sell my crops' },
        { key: 'transporter', title: 'Transporter', desc: 'Provide transport/logistics' }
      ]
      const roleDesc = (roleOptions.find(r=>r.key===role)?.desc) || ''
      const payload = {
        cid,
        name: name.trim(),
        password,
        role,
        roleDesc,
        location,
        phoneNumber: phone
      }
  await registerUser(payload)
      show('Account created — please login')
      navigate('/login')
    } catch (ex) {
      const srv = ex?.body?.error
      show(srv || ex.message || 'Registration failed', { variant: 'error' })
    }
  }

  const strength = passwordStrength(password)
  const strengthLabels = ['Very weak','Weak','Fair','Good','Strong']

  const roleCards = [
    { key: 'consumer', title: 'Consumer', desc: 'Buy fresh produce' },
    { key: 'farmer', title: 'Farmer', desc: 'Sell my crops' },
    { key: 'transporter', title: 'Transporter', desc: 'Provide transport/logistics' }
  ]

  return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
          <div className="w-full max-w-2xl">
            <Card className="w-full rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 md:p-8 bg-white dark:bg-slate-900">
                <div className="mb-4 text-center">
                  <h2 className="text-2xl font-semibold">Create Your Account</h2>
                  <p className="text-sm text-slate-500">Join our platform and start connecting with local agriculture.</p>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-medium mb-3">I am a...</div>
                  {/* Mobile: dropdown without descriptions */}
                  <div className="md:hidden">
                    <label className="block">
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          aria-haspopup="listbox"
                          aria-expanded={roleOpen}
                          onClick={() => setRoleOpen(v => !v)}
                          className={`mt-1 w-full rounded-xl border-2 px-4 py-3 pr-10 text-left bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-sm hover:border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 transition ${roleOpen ? 'ring-emerald-100 border-emerald-500' : ''}`}
                        >
                          {(roleCards.find(r=>r.key===role)?.title) || 'Select role'}
                        </button>
                        {/* Custom chevron */}
                        <svg
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                        </svg>

                        {roleOpen && (
                          <div
                            role="listbox"
                            tabIndex={-1}
                            className="absolute z-20 left-0 right-0 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl"
                          >
                            <ul className="py-1">
                              {roleCards.map((r) => (
                                <li key={r.key} role="option" aria-selected={role===r.key}>
                                  <button
                                    type="button"
                                    onClick={() => { setRole(r.key); setRoleOpen(false) }}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${role===r.key ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                  >
                                    {r.title}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                  {/* Desktop: card choices with descriptions */}
                  <div className="hidden md:grid grid-cols-3 gap-3">
                    {roleCards.map(r=> (
                      <button key={r.key} type="button" onClick={()=>setRole(r.key)} className={`rounded-lg p-4 text-left border transition-shadow shadow-sm ${role===r.key ? 'border-emerald-500 bg-emerald-50 transform scale-100' : 'border-slate-200 bg-white hover:shadow-md'}`}>
                        <div>
                          <div className="font-semibold">{r.title}</div>
                          <div className="text-xs text-slate-500">{r.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input label="Name" id="name" value={name} onChange={(e)=>setName(e.target.value)} error={errors.name} />

                  <Input label="CID" id="cid" type="text" value={cid} onChange={(e)=>setCid(onlyDigits(e.target.value, 11))} placeholder="11 digit CID" error={errors.cid} />
                  <Input label="Phone Number" id="phone" value={phone} onChange={(e)=>setPhone(onlyDigits(e.target.value, 8))} placeholder="8 digit phone (no country code)" error={errors.phone} />
                  <Input label="Location" id="location" value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="City/District" />

                  <Input label="Password" id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} error={errors.password} />

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Password strength</label>
                      <span className="text-xs text-slate-500">{strengthLabels[strength]}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded overflow-hidden">
                      <div style={{width: `${(strength/4)*100}%`}} className={`h-2 bg-emerald-500 transition-all`}></div>
                    </div>
                  </div>

                  <Input label="Confirm Password" id="confirm" type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} error={errors.confirm} />

                  <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" checked={agree} onChange={(e)=>setAgree(e.target.checked)} className="mt-1" />
                    <span>I agree to the <a href="#terms" className="text-emerald-600 hover:underline">Terms of Service</a> and <a href="#privacy" className="text-emerald-600 hover:underline">Privacy Policy</a></span>
                  </label>
                  {errors.agree && <div className="text-sm text-red-600">{errors.agree}</div>}

                  <div>
                    <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-600">Create Account</Button>
                  </div>
                </form>

                <p className="text-sm text-slate-600 mt-4 text-center">Already have an account? <Link to="/login" className="text-emerald-600 hover:underline font-medium">Login</Link></p>
              </div>
            </Card>
          </div>
        </div>
  )
}
