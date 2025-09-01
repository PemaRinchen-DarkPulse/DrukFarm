import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import AuthImage from '@/assets/auth.jpg' // Import your image
import api from '../lib/api'

const dzongkhags = [
	'Bumthang','Chhukha','Dagana','Gasa','Haa','Lhuentse','Mongar','Paro',
	'Pemagatshel','Punakha','Samdrup Jongkhar','Samtse','Sarpang','Thimphu',
	'Trashigang','Trashiyangtse','Trongsa','Tsirang','Wangdue Phodrang','Zhemgang'
]

// Memoized form components to prevent recreation on each render
const RegisterStep1 = React.memo(({ mobile = false, formData, handleChange, handleNumericChange, nextStep }) => (
	<div className="space-y-4">
		<div>
			<label
				htmlFor={mobile ? 'cid-mobile' : 'cid'}
				className="block text-sm font-medium text-slate-700"
			>
				CID
			</label>
			<input
				id={mobile ? 'cid-mobile' : 'cid'}
				type="text"
				placeholder="Citizen ID"
				inputMode="numeric"
				maxLength={11}
				value={formData.cid}
				onChange={handleNumericChange}
				required
				className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
			/>
		</div>
		<div>
			<label
				htmlFor={mobile ? 'name-mobile' : 'name'}
				className="block text-sm font-medium text-slate-700"
			>
				Full Name
			</label>
			<input
				id={mobile ? 'name-mobile' : 'name'}
				type="text"
				placeholder="Full Name"
				value={formData.name}
				onChange={handleChange}
				autoComplete="name"
				required
				className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
			/>
		</div>
		<div>
			<label
				htmlFor={mobile ? 'location-mobile' : 'location'}
				className="block text-sm font-medium text-slate-700"
			>
				Location
			</label>
			<input
				id={mobile ? 'location-mobile' : 'location'}
				type="text"
				placeholder="Location"
				value={formData.location}
				onChange={handleChange}
				required
				className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
			/>
		</div>
		<div>
			<label
				htmlFor={mobile ? 'dzongkhag-mobile' : 'dzongkhag'}
				className="block text-sm font-medium text-slate-700"
			>
				Dzongkhag
			</label>
			<select
				id={mobile ? 'dzongkhag-mobile' : 'dzongkhag'}
				value={formData.dzongkhag}
				onChange={handleChange}
				required
				className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
			>
				<option value="" disabled>Select Dzongkhag</option>
				{dzongkhags.map(d => <option key={d} value={d}>{d}</option>)}
			</select>
		</div>
		<Button
			type="button"
			className="w-full"
			onClick={nextStep}
			disabled={!formData.cid || !formData.name || !formData.location || !formData.dzongkhag}
		>
			Next
		</Button>
	</div>
))

const RegisterStep2 = React.memo(({ mobile = false, formData, handleChange, handleNumericChange, showPassword, showConfirm, togglePassword, toggleConfirm, prevStep, loading }) => (
	<div className="space-y-4">
		<div>
			<label
				htmlFor={mobile ? 'phoneNumber-mobile' : 'phoneNumber'}
				className="block text-sm font-medium text-slate-700"
			>
				Phone Number
			</label>
			<input
				id={mobile ? 'phoneNumber-mobile' : 'phoneNumber'}
				type="tel"
				placeholder="Phone Number"
				inputMode="numeric"
				maxLength={8}
				value={formData.phoneNumber}
				onChange={handleNumericChange}
				required
				className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
			/>
		</div>
		<div>
			<label
				htmlFor={mobile ? 'role-mobile' : 'role'}
				className="block text-sm font-medium text-slate-700"
			>
				Role
			</label>
			<select
				id={mobile ? 'role-mobile' : 'role'}
				value={formData.role}
				onChange={handleChange}
				required
				className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
			>
				<option value="" disabled>Select Role</option>
				<option value="Farmer">Farmer</option>
				<option value="Consumer">Consumer</option>
				<option value="Transporter">Transporter</option>
			</select>
		</div>
		<div>
			<label
				htmlFor={mobile ? 'password-mobile' : 'password'}
				className="block text-sm font-medium text-slate-700"
			>
				Password
			</label>
			<div className="relative">
				<input
					id={mobile ? 'password-mobile' : 'password'}
					type={showPassword ? 'text' : 'password'}
					placeholder="Password"
					value={formData.password}
					onChange={handleChange}
					autoComplete="new-password"
					required
					className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
				/>
				<button
					type="button"
					onClick={togglePassword}
					className="absolute inset-y-0 right-3 flex items-center text-slate-500"
				>
					{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
				</button>
			</div>
		</div>
		<div>
			<label
				htmlFor={mobile ? 'confirm-mobile' : 'confirm'}
				className="block text-sm font-medium text-slate-700"
			>
				Confirm Password
			</label>
			<div className="relative">
				<input
					id={mobile ? 'confirm-mobile' : 'confirm'}
					type={showConfirm ? 'text' : 'password'}
					placeholder="Confirm Password"
					value={formData.confirm}
					onChange={handleChange}
					autoComplete="new-password"
					required
					className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
				/>
				<button
					type="button"
					onClick={toggleConfirm}
					className="absolute inset-y-0 right-3 flex items-center text-slate-500"
				>
					{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
				</button>
			</div>
		</div>
		<Button
			type="button"
			variant="outline"
			className="w-full"
			onClick={prevStep}
		>
			Back
		</Button>
		<Button type="submit" className="w-full" disabled={loading}>
			{loading ? 'Creating Account...' : 'Create Account'}
		</Button>
	</div>
))

const LoginForm = React.memo(({ mobile = false, formData, handleChange, handleNumericChange, showPassword, togglePassword, loading }) => (
	<div className="space-y-4">
		<div>
			<label
				htmlFor={mobile ? 'phoneNumber-mobile' : 'phoneNumber'}
				className="block text-sm font-medium text-slate-700"
			>
				Phone Number
			</label>
			<input
				id={mobile ? 'phoneNumber-mobile' : 'phoneNumber'}
				type="tel"
				placeholder="Phone Number"
				inputMode="numeric"
				maxLength={8}
				value={formData.phoneNumber}
				onChange={handleNumericChange}
				required
				className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
			/>
		</div>
		<div>
			<label
				htmlFor={mobile ? 'password-mobile' : 'password'}
				className="block text-sm font-medium text-slate-700"
			>
				Password
			</label>
			<div className="relative">
				<input
					id={mobile ? 'password-mobile' : 'password'}
					type={showPassword ? 'text' : 'password'}
					placeholder="Password"
					value={formData.password}
					onChange={handleChange}
					autoComplete="current-password"
					required
					className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
				/>
				<button
					type="button"
					onClick={togglePassword}
					className="absolute inset-y-0 right-3 flex items-center text-slate-500"
				>
					{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
				</button>
			</div>
		</div>
		<div className="flex justify-end text-sm">
			<Link to="#" className="text-blue-700 hover:underline">Forgot Password?</Link>
		</div>
		<Button type="submit" className="w-full" disabled={loading}>
			{loading ? 'Logging in...' : 'Login'}
		</Button>
	</div>
))

export default function AuthLayout({ mode = 'login' }) {
	const isLogin = mode === 'login'
	const navigate = useNavigate()
	const [ready, setReady] = useState(false)
	const [step, setStep] = useState(1)
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	// Keep all form values here
	const [formData, setFormData] = useState({
		cid: '',
		name: '',
		location: '',
		dzongkhag: '',
		phoneNumber: '',
		role: '',
		password: '',
		confirm: '',
	})

	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)

	useEffect(() => {
		const t = setTimeout(() => setReady(true), 20)
		return () => clearTimeout(t)
	}, [])

	/** Handle input changes */
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
				const res = await api.loginUser({
					phoneNumber: formData.phoneNumber,
					password: formData.password,
				})
				if (res.user) {
					navigate('/management')
				}
			} catch (err) {
				setError(err?.body?.error || err.message || 'An error occurred during login.')
			} finally {
				setLoading(false)
			}
		} else {
			if (formData.password !== formData.confirm) {
				setError('Passwords do not match.')
				setLoading(false)
				return
			}
			try {
				const res = await api.registerUser({
					...formData,
					role: formData.role.toLowerCase(),
				})
				if (res.user) {
					navigate('/login')
				}
			} catch (err) {
				setError(err?.body?.error || err.message || 'An error occurred during registration.')
			} finally {
				setLoading(false)
			}
		}
	}, [isLogin, formData, navigate])

	const togglePassword = useCallback(() => {
		setShowPassword(prev => !prev)
	}, [])

	const toggleConfirm = useCallback(() => {
		setShowConfirm(prev => !prev)
	}, [])

	const nextStep = useCallback(() => {
		setStep(2)
	}, [])

	const prevStep = useCallback(() => {
		setStep(1)
	}, [])

	return (
		<div className="relative min-h-screen w-full bg-[#F5F7FB] flex items-center justify-center">
			{/* Desktop two-panel */}
			<div className="hidden md:block">
				<div className="relative h-[580px] w-[880px]">
					{/* Illustration panel */}
					<section className={[
						'absolute inset-y-0 w-1/2 overflow-hidden shadow-xl',
						'transition-transform duration-500 ease-out',
						isLogin ? 'rounded-r-3xl' : 'rounded-l-3xl',
						ready ? (isLogin ? 'translate-x-full' : 'translate-x-0') : (isLogin ? 'translate-x-full' : 'translate-x-0')
					].join(' ')} aria-hidden="true">
						<img src={AuthImage} alt="Auth Illustration" className="h-full w-full object-cover" />
					</section>

					{/* Form panel */}
					<section
						className={[
							'absolute inset-y-0 w-1/2 bg-white shadow-xl',
							'transition-transform duration-500 ease-out',
							isLogin ? 'rounded-l-3xl' : 'rounded-r-3xl',
							ready ? (isLogin ? 'translate-x-0' : 'translate-x-full') : (isLogin ? 'translate-x-0' : 'translate-x-full')
						].join(' ')}>

						<div className="flex h-full items-center justify-center p-10">
							<div className="w-full max-w-sm">
								<div className="mb-6 text-center">
									<h1 className="text-2xl font-semibold">
										{isLogin ? 'Hello Again!' : 'Create Account'}
									</h1>
									<p className="mt-1 text-sm text-slate-500">
										{isLogin
											? 'Login to continue managing your orders and products.'
											: step === 1
											? 'Step 1: Enter your basic details.'
											: 'Step 2: Set your contact and password.'}
									</p>
									{error && <div className="mt-4 text-center text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</div>}
								</div>

								<form className="space-y-4" onSubmit={handleSubmit}>
									{isLogin ? (
										<LoginForm 
											formData={formData}
											handleChange={handleChange}
											handleNumericChange={handleNumericChange}
											showPassword={showPassword}
											togglePassword={togglePassword}
											loading={loading}
										/>
									) : step === 1 ? (
										<RegisterStep1 
											formData={formData}
											handleChange={handleChange}
											handleNumericChange={handleNumericChange}
											nextStep={nextStep}
										/>
									) : (
										<RegisterStep2 
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
										<>Don't have an account? <Link to="/register" className="text-blue-700 hover:underline">Sign Up</Link></>
									) : (
										<>Already have an account? <Link to="/login" className="text-blue-700 hover:underline">Login</Link></>
									)}
								</p>
							</div>
						</div>
					</section>
				</div>
			</div>

			{/* Mobile stacked form */}
			<div className="md:hidden flex min-h-screen items-center justify-center p-6">
				<div className="w-full max-w-sm">
					<div className="mb-6 text-center">
						<h1 className="text-2xl font-semibold">
							{isLogin ? 'Hello Again!' : 'Create Account'}
						</h1>
						<p className="mt-1 text-sm text-slate-500">
							{isLogin
								? 'Login to continue managing your orders and products.'
								: step === 1
								? 'Step 1: Enter your basic details.'
								: 'Step 2: Set your contact and password.'}
						</p>
						{error && <div className="mt-4 text-center text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</div>}
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
							<>Don't have an account? <Link to="/register" className="text-blue-700 hover:underline">Sign Up</Link></>
						) : (
							<>Already have an account? <Link to="/login" className="text-blue-700 hover:underline">Login</Link></>
						)}
					</p>
				</div>
			</div>
		</div>
	)
}
