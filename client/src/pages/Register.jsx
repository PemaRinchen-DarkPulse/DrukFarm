import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Card from '@/components/ui/card'
import Input from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

function isValidEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState('consumer')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const { show } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if(!firstName) errs.firstName = 'First name is required'
    if(!lastName) errs.lastName = 'Last name is required'
    if(!isValidEmail(email)) errs.email = 'Enter a valid email'
    const strength = passwordStrength(password)
    if(strength < 3) errs.password = 'Password is too weak (min 8 chars, mix of letters/numbers)'
    if(password !== confirm) errs.confirm = 'Passwords do not match'
    if(!agree) errs.agree = 'You must agree to Terms'
    setErrors(errs)
    if(Object.keys(errs).length) return

    // Demo register
    await new Promise(r=>setTimeout(r,700))
    show('Account created — please login')
    navigate('/login')
  }

  const strength = passwordStrength(password)
  const strengthLabels = ['Very weak','Weak','Fair','Good','Strong']

  const roleCards = [
    { key: 'consumer', title: 'Consumer', desc: 'Buy fresh produce' },
    { key: 'farmer', title: 'Farmer', desc: 'Sell my crops' },
    { key: 'restaurant', title: 'Restaurant/Hotel', desc: 'Bulk purchasing' }
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
                  <div className="grid grid-cols-3 gap-3">
                    {roleCards.map(r=> (
                      <button key={r.key} type="button" onClick={()=>setRole(r.key)} className={`rounded-lg p-4 text-left border transition-shadow shadow-sm ${role===r.key ? 'border-emerald-500 bg-emerald-50 transform scale-100' : 'border-slate-200 bg-white hover:shadow-md'}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-emerald-600 flex items-center justify-center text-white font-semibold">{r.title[0]}</div>
                          <div>
                            <div className="font-semibold">{r.title}</div>
                            <div className="text-xs text-slate-500">{r.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="First Name" id="first" value={firstName} onChange={(e)=>setFirstName(e.target.value)} error={errors.firstName} />
                    <Input label="Last Name" id="last" value={lastName} onChange={(e)=>setLastName(e.target.value)} error={errors.lastName} />
                  </div>

                  <Input label="Email Address" id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} error={errors.email} />
                  <Input label="Phone Number" id="phone" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+975 XXXX XXXX" />
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
