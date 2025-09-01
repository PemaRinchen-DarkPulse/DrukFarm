const express = require('express')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

const router = express.Router()

function isStrongPassword(pw) {
	if (typeof pw !== 'string') return false
	return (
		pw.length >= 8 &&
		/[A-Z]/.test(pw) &&
		/[a-z]/.test(pw) &&
		/\d/.test(pw) &&
		/[^A-Za-z0-9]/.test(pw)
	)
}

// POST /api/users/register
router.post('/register', async (req, res) => {
	try {
		let { cid, name, password, role, location, dzongkhag, phoneNumber } =
			req.body || {}
		cid = typeof cid === 'string' ? cid.trim().replace(/\D/g, '') : cid
		name = typeof name === 'string' ? name.trim() : name
		location = typeof location === 'string' ? location.trim() : ''
		dzongkhag = typeof dzongkhag === 'string' ? dzongkhag.trim() : ''
		phoneNumber =
			typeof phoneNumber === 'string' ? phoneNumber.trim() : phoneNumber

		// Basic validations
		if (!cid || !/^\d{11}$/.test(cid)) {
			return res.status(400).json({ error: 'CID must be exactly 11 digits' })
		}
		if (!phoneNumber || !/^\d{8}$/.test(phoneNumber)) {
			return res
				.status(400)
				.json({ error: 'Phone number must be exactly 8 digits' })
		}
		if (!password || !isStrongPassword(password)) {
			return res.status(400).json({
				error:
					'Password is too weak (min 8 chars, include upper, lower, number, special)',
			})
		}
		if (!name || typeof name !== 'string' || !name.trim()) {
			return res.status(400).json({ error: 'Name is required' })
		}
		const validRoles = ['consumer', 'farmer', 'transporter']
		const validDzongkhags = new Set([
			'Bumthang',
			'Chhukha',
			'Dagana',
			'Gasa',
			'Haa',
			'Lhuentse',
			'Mongar',
			'Paro',
			'Pemagatshel',
			'Punakha',
			'Samdrup Jongkhar',
			'Samtse',
			'Sarpang',
			'Thimphu',
			'Trashigang',
			'Trashiyangtse',
			'Trongsa',
			'Tsirang',
			'Wangdue Phodrang',
			'Zhemgang',
		])
		if (dzongkhag && !validDzongkhags.has(dzongkhag)) {
			return res.status(400).json({ error: 'Invalid Dzongkhag' })
		}
		// Map legacy roles to the new one for backward-compatibility
		if (role === 'restaurant' || role === 'transported') role = 'transporter'
		const userRole = validRoles.includes(role) ? role : 'consumer'

		// Check duplicate
		const existingUser = await User.findOne({
			$or: [{ cid }, { phoneNumber }],
		})
		if (existingUser) {
			if (existingUser.cid === cid) {
				return res.status(409).json({ error: 'CID already exists' })
			}
			if (existingUser.phoneNumber === phoneNumber) {
				return res.status(409).json({ error: 'Phone number already exists' })
			}
		}

		// Hash password
		const salt = await bcrypt.genSalt(10)
		const hash = await bcrypt.hash(password, salt)

		const doc = await User.create({
			cid,
			name: name.trim(),
			password: hash,
			role: userRole,
			location: location || '',
			dzongkhag: dzongkhag || '',
			phoneNumber,
		})

		return res
			.status(201)
			.json({ message: 'Registration successful', user: doc.toJSONSafe() })
	} catch (err) {
		console.error('Register error:', err)
		// Handle duplicate key error
		if (err && err.code === 11000) {
			if (err.keyPattern.cid) {
				return res.status(409).json({ error: 'CID already exists' })
			}
			if (err.keyPattern.phoneNumber) {
				return res.status(409).json({ error: 'Phone number already exists' })
			}
		}
		return res.status(500).json({ error: 'Failed to register user' })
	}
})

// POST /api/users/login
router.post('/login', async (req, res) => {
	try {
		let { phoneNumber, password } = req.body || {}
		phoneNumber =
			typeof phoneNumber === 'string'
				? phoneNumber.trim().replace(/\D/g, '')
				: phoneNumber
		if (!phoneNumber || !/^\d{8}$/.test(phoneNumber) || !password) {
			return res.status(400).json({ error: 'Invalid phone number or password' })
		}

		const user = await User.findOne({ phoneNumber })
		if (!user) return res.status(401).json({ error: 'Invalid credentials' })

		let match = false
		try {
			match = await bcrypt.compare(password, user.password)
		} catch (e) {
			match = false
		}

		// Backward-compatibility: if stored password is plaintext (not a bcrypt hash),
		// and it matches, then upgrade it to a hash
		if (!match && password === user.password) {
			match = true
			// Upgrade password to hash
			const salt = await bcrypt.genSalt(10)
			user.password = await bcrypt.hash(password, salt)
			await user.save()
		}

		if (!match) {
			return res.status(401).json({ error: 'Invalid credentials' })
		}

		// Don't send back the password hash
		return res
			.status(200)
			.json({ message: 'Login successful', user: user.toJSONSafe() })
	} catch (err) {
		console.error('Login error:', err)
		return res.status(500).json({ error: 'Failed to login' })
	}
})

// (Optional) list users - for admin/debug only (do not expose in production without auth)
router.get('/', async (_req, res) => {
	const users = await User.find().sort({ createdAt: -1 })
	res.json(users.map(u => u.toJSONSafe()))
})

module.exports = router

