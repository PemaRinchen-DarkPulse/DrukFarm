import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Card from '@/components/ui/card'
import Input from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Alert from '@/components/ui/alert'
import ForgotPasswordModal from '@/components/ForgotPasswordModal'
import { useToast } from '@/components/ui/toast'

function isValidEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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
    if(!isValidEmail(email)) return setError('Please provide a valid email')
    if(!password) return setError('Password cannot be empty')

    setLoading(true)
    // Demo auth: infer role from email
    await new Promise(r => setTimeout(r, 700))
    setLoading(false)
    let role = 'consumer'
    const le = email.toLowerCase()
    if(le.includes('farm')) role = 'farmer'
    else if(le.includes('rest')) role = 'restaurant'
    else if(le.includes('hotel')) role = 'hotel'
    else if(le.includes('admin')) role = 'admin'

    show('Logged in successfully')
    // Redirect to dashboard with role
    navigate('/dashboard', { state: { role } })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 md:p-8 bg-white dark:bg-slate-900">
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-semibold">Login to DruKFarm</h2>
            <p className="text-sm text-slate-500">Connect with Bhutanese farmers, restaurants and hotels.</p>
          </div>

          {error && <Alert title="Error" description={error} variant="destructive" onClose={() => setError('')} />}

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <Input label="Email" id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@domain.com" />
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
