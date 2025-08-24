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
		const { cid, name, password, role, location, phoneNumber } = req.body || {}

		// Basic validations
		if (!cid || !/^\d{11}$/.test(cid)) {
			return res.status(400).json({ error: 'CID must be exactly 11 digits' })
		}
		if (!phoneNumber || !/^\d{8}$/.test(phoneNumber)) {
			return res.status(400).json({ error: 'Phone number must be exactly 8 digits' })
		}
		if (!password || !isStrongPassword(password)) {
			return res.status(400).json({ error: 'Password is too weak (min 8 chars, include upper, lower, number, special)' })
		}
		if (!name || typeof name !== 'string' || !name.trim()) {
			return res.status(400).json({ error: 'Name is required' })
		}
		const validRoles = ['consumer', 'farmer', 'restaurant']
		const userRole = validRoles.includes(role) ? role : 'consumer'

		// Check duplicate
		const exists = await User.findOne({ cid })
		if (exists) {
			return res.status(409).json({ error: 'CID already exists' })
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
			phoneNumber,
		})

		return res.status(201).json({ message: 'Registration successful', user: doc.toJSONSafe() })
	} catch (err) {
		console.error('Register error:', err)
		// Handle duplicate key error
		if (err && err.code === 11000) {
			return res.status(409).json({ error: 'CID already exists' })
		}
		return res.status(500).json({ error: 'Failed to register user' })
	}
})

// POST /api/users/login
router.post('/login', async (req, res) => {
	try {
		const { cid, password } = req.body || {}
		if (!cid || !/^\d{11}$/.test(cid) || !password) {
			return res.status(400).json({ error: 'Invalid CID or password' })
		}

		const user = await User.findOne({ cid })
		if (!user) return res.status(401).json({ error: 'Invalid CID or password' })

		const match = await bcrypt.compare(password, user.password)
		if (!match) return res.status(401).json({ error: 'Invalid CID or password' })

		return res.json(user.toJSONSafe())
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

