import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, User, ChevronDown, Check } from 'lucide-react'
import AuthImage from '@/assets/auth.jpg' // Import your image
import api from '../lib/api'

const dzongkhags = [
  'Bumthang','Chhukha','Dagana','Gasa','Haa','Lhuentse','Mongar','Paro',
  'Pemagatshel','Punakha','Samdrup Jongkhar','Samtse','Sarpang','Thimphu',
  'Trashigang','Trashiyangtse','Trongsa','Tsirang','Wangdue Phodrang','Zhemgang'
]

const CustomDropdown = ({ options, value, onChange, placeholder, mobile = false, name }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleSelect = (option) => {
    onChange({ target: { id: name, value: option } })
    setIsOpen(false)
  }

  const rect = dropdownRef.current?.getBoundingClientRect?.()
  const spaceBelow = typeof window !== 'undefined' && rect ? (window.innerHeight - rect.bottom) : 0

  // ✅ On small devices (mobile), always open downward. On larger screens, prefer downward and only open upward if not enough space.
  const openUp = !mobile && spaceBelow < 300

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`
          w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white
          focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600
          transition-colors cursor-pointer
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="truncate text-gray-700">
          {value || <span className="text-gray-400">{placeholder}</span>}
        </div>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown
            className={`h-4 w-4 text-emerald-600 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div
          className={`
          absolute left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg overflow-hidden
          ${openUp ? 'bottom-full mb-2' : 'top-full mt-2'}
        `}
        >
          {/* Options List */}
          <div
            style={{ maxHeight: '200px' }} // ✅ show only 5 items
            className={`overflow-y-auto ${mobile ? 'dropdown-hide-scrollbar' : ''}`}
          >
            {options.length > 0 ? (
              options.map((option) => (
                <div
                  key={option}
                  className={`
                    px-3 py-2 cursor-pointer transition-colors duration-100 flex items-center justify-between
                    hover:bg-emerald-50 ${value === option ? 'bg-emerald-50' : ''} text-gray-700
                  `}
                  style={{ minHeight: '40px' }}
                  onClick={() => handleSelect(option)}
                >
                  <span className="text-sm">{option}</span>
                  {value === option && <Check className="h-4 w-4 text-emerald-600" />}
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-gray-500 text-center">No options available</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const RegisterStep1 = React.memo(({ mobile = false, formData, handleChange, handleNumericChange, nextStep }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-700" htmlFor={mobile ? 'cid-mobile' : 'cid'}>CID</label>
      <input
        id={mobile ? 'cid-mobile' : 'cid'}
        type="text"
        placeholder="Citizen ID"
        inputMode="numeric"
        maxLength={11}
        value={formData.cid}
        onChange={handleNumericChange}
        required
        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700" htmlFor={mobile ? 'name-mobile' : 'name'}>Full Name</label>
      <input
        id={mobile ? 'name-mobile' : 'name'}
        type="text"
        placeholder="Full Name"
        value={formData.name}
        onChange={handleChange}
        autoComplete="name"
        required
        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700" htmlFor={mobile ? 'location-mobile' : 'location'}>Location</label>
      <input
        id={mobile ? 'location-mobile' : 'location'}
        type="text"
        placeholder="Location"
        value={formData.location}
        onChange={handleChange}
        required
        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor={mobile ? 'dzongkhag-mobile' : 'dzongkhag'}>Dzongkhag</label>
      <CustomDropdown
        options={dzongkhags}
        value={formData.dzongkhag}
        onChange={handleChange}
        placeholder="Select Dzongkhag"
        mobile={mobile}
        name={mobile ? 'dzongkhag-mobile' : 'dzongkhag'}
      />
    </div>
    <Button
      type="button"
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors mt-4"
      onClick={nextStep}
      disabled={!formData.cid || !formData.name || !formData.location || !formData.dzongkhag}
    >
      Next
    </Button>
  </div>
))

const RegisterStep2 = React.memo(({ mobile = false, formData, handleChange, handleNumericChange, showPassword, showConfirm, togglePassword, toggleConfirm, prevStep, loading }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-700" htmlFor={mobile ? 'phoneNumber-mobile' : 'phoneNumber'}>Phone Number</label>
      <input
        id={mobile ? 'phoneNumber-mobile' : 'phoneNumber'}
        type="tel"
        placeholder="Phone Number"
        inputMode="numeric"
        maxLength={8}
        value={formData.phoneNumber}
        onChange={handleNumericChange}
        required
        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor={mobile ? 'role-mobile' : 'role'}>Role</label>
      <CustomDropdown
        options={['Farmer', 'Consumer', 'Transporter']}
        value={formData.role}
        onChange={handleChange}
        placeholder="Select Role"
        icon={User}
        mobile={mobile}
        name={mobile ? 'role-mobile' : 'role'}
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700" htmlFor={mobile ? 'password-mobile' : 'password'}>Password</label>
      <div className="relative">
        <input
          id={mobile ? 'password-mobile' : 'password'}
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
        />
        <button type="button" onClick={togglePassword} className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700">
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700" htmlFor={mobile ? 'confirm-mobile' : 'confirm'}>Confirm Password</label>
      <div className="relative">
        <input
          id={mobile ? 'confirm-mobile' : 'confirm'}
          type={showConfirm ? 'text' : 'password'}
          placeholder="Confirm Password"
          value={formData.confirm}
          onChange={handleChange}
          autoComplete="new-password"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
        />
        <button type="button" onClick={toggleConfirm} className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700">
          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
    <div className="flex space-x-2 mt-4">
      <Button type="button" variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-lg font-medium transition-colors" onClick={prevStep}>Back</Button>
      <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</Button>
    </div>
  </div>
))

const LoginForm = React.memo(({ mobile = false, formData, handleChange, handleNumericChange, showPassword, togglePassword, loading }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-700" htmlFor={mobile ? 'phoneNumber-mobile' : 'phoneNumber'}>Phone Number</label>
      <input
        id={mobile ? 'phoneNumber-mobile' : 'phoneNumber'}
        type="tel"
        placeholder="Phone Number"
        inputMode="numeric"
        maxLength={8}
        value={formData.phoneNumber}
        onChange={handleNumericChange}
        required
        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700" htmlFor={mobile ? 'password-mobile' : 'password'}>Password</label>
      <div className="relative">
        <input
          id={mobile ? 'password-mobile' : 'password'}
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
        />
        <button type="button" onClick={togglePassword} className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700">
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
    <div className="flex justify-end text-xs">
      <Link to="#" className="text-blue-600 hover:underline font-medium">Forgot Password?</Link>
    </div>
    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors mt-4" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>
  </div>
))

export default function AuthLayout({ mode = 'login' }) {
  const isLogin = mode === 'login'
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ cid:'', name:'', location:'', dzongkhag:'', phoneNumber:'', role:'', password:'', confirm:'' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => { 
    const t = setTimeout(() => setReady(true), 20); 
    
    // Add mobile viewport meta tag optimization for better dropdown behavior
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && window.innerWidth <= 768) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    return () => {
      clearTimeout(t);
      // Restore original viewport on cleanup
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    }
  }, [])

  // Hide vertical scrollbar on both Login and Sign Up pages
  useEffect(() => {
    const prevOverflowY = document.body.style.overflowY
    document.body.style.overflowY = 'hidden'
    return () => {
      document.body.style.overflowY = prevOverflowY || ''
    }
  }, [])

  const handleChange = useCallback((e) => {
    const { id, value } = e.target
    const key = id.endsWith('-mobile') ? id.slice(0, -7) : id
    setFormData(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleNumericChange = useCallback((e) => {
    const { id, value } = e.target
    const key = id.endsWith('-mobile') ? id.slice(0, -7) : id
    const numericValue = value.replace(/\D/g, '')
    setFormData(prev => ({ ...prev, [key]: numericValue }))
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (isLogin) {
      try {
        const res = await api.loginUser({ phoneNumber: formData.phoneNumber, password: formData.password })
        if (res?.user) {
          // Persist authenticated user so Navbar and pages can detect login state/role/CID
          try {
            localStorage.setItem('currentUser', JSON.stringify(res.user))
          } catch (e) { /* ignore storage errors */ }
          // Notify listeners (Navbar, etc.) that auth state changed
          try { window.dispatchEvent(new Event('authChanged')) } catch (e) { /* noop */ }
          navigate('/management')
        }
      } catch (err) { setError(err?.body?.error || err.message || 'An error occurred during login.') }
      finally { setLoading(false) }
    } else {
      if (formData.password !== formData.confirm) { setError('Passwords do not match.'); setLoading(false); return }
      try {
        const res = await api.registerUser({ ...formData, role: formData.role.toLowerCase() })
        if (res.user) navigate('/login')
      } catch (err) { setError(err?.body?.error || err.message || 'An error occurred during registration.') }
      finally { setLoading(false) }
    }
  }, [isLogin, formData, navigate])

  const togglePassword = useCallback(() => setShowPassword(prev => !prev), [])
  const toggleConfirm = useCallback(() => setShowConfirm(prev => !prev), [])
  const nextStep = useCallback(() => setStep(2), [])
  const prevStep = useCallback(() => setStep(1), [])

  return (
    <div className="relative min-h-screen w-full bg-[#F5F7FB] flex items-center justify-center">
      {/* Desktop */}
      <div className="hidden md:block">
        <div className="relative h-[580px] w-[880px]">
          {/* Illustration panel */}
          <section className={[
            'absolute inset-y-0 w-1/2 overflow-hidden shadow-xl transition-transform duration-500 ease-out',
            isLogin ? 'rounded-r-3xl translate-x-full' : 'rounded-l-3xl translate-x-0'
          ].join(' ')} aria-hidden="true">
            <img src={AuthImage} alt="Auth Illustration" className="h-full w-full object-cover" />
          </section>

          {/* Form panel */}
          <section className={[
            'absolute inset-y-0 w-1/2 bg-white shadow-xl transition-transform duration-500 ease-out',
            isLogin ? 'rounded-l-3xl translate-x-0' : 'rounded-r-3xl translate-x-full'
          ].join(' ')}>
            <div className="flex h-full items-center justify-center p-10">
              <div className="w-full max-w-sm">
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-semibold">{isLogin ? 'Hello Again!' : 'Create Account'}</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {isLogin ? 'Login to continue managing your orders and products.'
                      : step === 1 ? 'Step 1: Enter your basic details.'
                      : 'Step 2: Set your contact and password.'}
                  </p>
                  {error && <div className="mt-4 text-center text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</div>}
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {isLogin
                    ? <LoginForm formData={formData} handleChange={handleChange} handleNumericChange={handleNumericChange} showPassword={showPassword} togglePassword={togglePassword} loading={loading} />
                    : step === 1
                      ? <RegisterStep1 formData={formData} handleChange={handleChange} handleNumericChange={handleNumericChange} nextStep={nextStep} />
                      : <RegisterStep2 formData={formData} handleChange={handleChange} handleNumericChange={handleNumericChange} showPassword={showPassword} showConfirm={showConfirm} togglePassword={togglePassword} toggleConfirm={toggleConfirm} prevStep={prevStep} loading={loading} />}
                </form>
                <p className="mt-6 text-center text-sm text-slate-500">
                  {isLogin ? <>Don't have an account? <Link to="/register" className="text-blue-700 hover:underline">Sign Up</Link></> : <>Already have an account? <Link to="/login" className="text-blue-700 hover:underline">Login</Link></>}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden w-full px-4 py-8">
        <div className="mx-auto max-w-sm bg-white rounded-2xl shadow-xl p-6">
          <div className="mb-5 text-center">
            <h1 className="text-2xl font-semibold">{isLogin ? 'Hello Again!' : 'Create Account'}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {isLogin
                ? 'Login to continue managing your orders and products.'
                : step === 1
                  ? 'Step 1: Enter your basic details.'
                  : 'Step 2: Set your contact and password.'}
            </p>
            {error && (
              <div className="mt-4 text-center text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</div>
            )}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isLogin ? (
              <LoginForm
                mobile
                formData={formData}
                handleChange={handleChange}
                handleNumericChange={handleNumericChange}
                showPassword={showPassword}
                togglePassword={togglePassword}
                loading={loading}
              />
            ) : step === 1 ? (
              <RegisterStep1
                mobile
                formData={formData}
                handleChange={handleChange}
                handleNumericChange={handleNumericChange}
                nextStep={nextStep}
              />
            ) : (
              <RegisterStep2
                mobile
                formData={formData}
                handleChange={handleChange}
                handleNumericChange={handleNumericChange}
                showPassword={showPassword}
                showConfirm={showConfirm}
                togglePassword={togglePassword}
                toggleConfirm={toggleConfirm}
                prevStep={prevStep}
                loading={loading}
              />
            )}
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-700 hover:underline">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="text-blue-700 hover:underline">
                  Login
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

    </div>
  )
}
