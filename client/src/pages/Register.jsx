import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Card from '@/components/ui/card'
import Input from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

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
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if(!firstName) errs.firstName = 'First name is required'
    if(!lastName) errs.lastName = 'Last name is required'
  if(!isValidCID(cid)) errs.cid = 'CID must be exactly 11 digits'
    const strength = passwordStrength(password)
    if(strength < 3) errs.password = 'Password is too weak (min 8 chars, mix of letters/numbers)'
    if(password !== confirm) errs.confirm = 'Passwords do not match'
  if(!isValidPhone(phone)) errs.phone = 'Phone must be exactly 8 digits'
  if(!agree) errs.agree = 'You must agree to Terms'
    setErrors(errs)
    if(Object.keys(errs).length) return

    try {
      const payload = {
        cid,
        name: `${firstName} ${lastName}`,
        password,
        role,
        location,
        phoneNumber: phone
      }
  const res = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const err = await res.json()
        show(err.error || JSON.stringify(err))
        return
      }
      show('Account created — please login')
      navigate('/login')
    } catch (ex) {
      show(ex.message || 'Registration failed')
    }
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
                          <div>
                            <div className="font-semibold">{r.title}</div>
                            <div className="text-xs text-slate-500">{r.desc}</div>
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
