import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Card from '@/components/ui/card'
import Input from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Alert from '@/components/ui/alert'
import ForgotPasswordModal from '@/components/ForgotPasswordModal'
import { useToast } from '@/components/ui/toast'
import { loginUser } from '@/lib/api'

function isValidCID(cid){
  return /^\d{11}$/.test(cid)
}

function onlyDigits(value, maxLen){
  if(!value) return ''
  return value.replace(/\D/g,'').slice(0, maxLen)
}

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()
  const { show } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
  setError('')
  if(!isValidCID(email)) return setError('Please provide a valid 11-digit CID')
    if(!password) return setError('Password cannot be empty')

    setLoading(true)
    try {
      const payload = { cid: email, password }
      const user = await loginUser(payload)
      setLoading(false)
  // persist minimal user for navbar and notify other components
  try { localStorage.setItem('currentUser', JSON.stringify(user)); window.dispatchEvent(new Event('authChanged')) } catch(e) {}
  show('Logged in successfully')
  navigate(`/management?tab=overview`, { state: { role: user.role } })
    } catch (ex) {
      setLoading(false)
      setError(ex.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 md:p-10 bg-white dark:bg-slate-900">
          <div className="mb-4 text-center">
            <h2 className="text-3xl font-semibold">Login to DruKFarm</h2>
            <p className="text-sm text-slate-500">Connect with Bhutanese farmers, restaurants and hotels.</p>
          </div>

          {error && <Alert title="Error" description={error} variant="destructive" onClose={() => setError('')} />}

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <Input label="CID" id="email" type="text" value={email} onChange={(e)=>setEmail(onlyDigits(e.target.value, 11))} placeholder="11 digit CID" />
            <Input label="Password" id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter your password" />

            <div className="flex items-center justify-between">
              <button type="button" className="text-sm text-emerald-600 hover:underline" onClick={()=>setModalOpen(true)}>Forgot Password?</button>
              <Button type="submit" disabled={loading}>{loading ? 'Logging...' : 'Login'}</Button>
            </div>
          </form>

          <div className="mt-6 text-sm text-center text-slate-600">
            Don't have an account? <Link to="/register" className="text-emerald-600 font-medium">Register</Link>
          </div>
        </div>
      </Card>

      <ForgotPasswordModal open={modalOpen} onClose={()=>setModalOpen(false)} />
    </div>
  )
}
