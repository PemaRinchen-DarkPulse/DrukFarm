const express = require('express')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { requireAuth, requireSuperAdmin } = require('../middleware/auth')

const router = express.Router()

// All routes require super admin authentication
router.use(requireAuth)
router.use(requireSuperAdmin)

/**
 * GET /api/superadmin/users
 * List all users with filtering options
 */
router.get('/users', async (req, res) => {
	try {
		const { role, search, page = 1, limit = 50 } = req.query
		const query = {}
		
		if (role) {
			const validRoles = ['vegetable_vendor', 'farmer', 'transporter', 'superadmin']
			if (validRoles.includes(role)) {
				query.role = role
			}
		}
		
		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ cid: { $regex: search, $options: 'i' } },
				{ phoneNumber: { $regex: search, $options: 'i' } },
			]
		}
		
		const skip = (parseInt(page) - 1) * parseInt(limit)
		const users = await User.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit))
		
		const total = await User.countDocuments(query)
		
		res.json({
			users: users.map(u => u.toJSONSafe()),
			pagination: {
				total,
				page: parseInt(page),
				limit: parseInt(limit),
				pages: Math.ceil(total / parseInt(limit)),
			},
		})
	} catch (err) {
		console.error('List users error:', err)
		res.status(500).json({ error: 'Failed to fetch users' })
	}
})

/**
 * POST /api/superadmin/users
 * Create a new user (including super admin)
 */
router.post('/users', async (req, res) => {
	try {
		let { cid, name, password, role, location, dzongkhag, phoneNumber } = req.body || {}
		
		// Sanitize inputs
		cid = typeof cid === 'string' ? cid.trim().replace(/\D/g, '') : cid
		name = typeof name === 'string' ? name.trim() : name
		location = typeof location === 'string' ? location.trim() : ''
		dzongkhag = typeof dzongkhag === 'string' ? dzongkhag.trim() : ''
		phoneNumber = typeof phoneNumber === 'string' ? phoneNumber.trim() : phoneNumber
		
		// Validations
		if (!cid || !/^\d{11}$/.test(cid)) {
			return res.status(400).json({ error: 'CID must be exactly 11 digits' })
		}
		
		if (!phoneNumber || !/^\d{8}$/.test(phoneNumber)) {
			return res.status(400).json({ error: 'Phone number must be exactly 8 digits' })
		}
		
		if (!name || typeof name !== 'string' || !name.trim()) {
			return res.status(400).json({ error: 'Name is required' })
		}
		
		if (!password || password.length < 8) {
			return res.status(400).json({ error: 'Password must be at least 8 characters' })
		}
		
		const validRoles = ['vegetable_vendor', 'farmer', 'transporter', 'superadmin']
		if (!role || !validRoles.includes(role)) {
			return res.status(400).json({ 
				error: `Role must be one of: ${validRoles.join(', ')}` 
			})
		}
		
		// Check duplicates
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
		
		const user = await User.create({
			cid,
			name,
			password: hash,
			role,
			location: location || '',
			dzongkhag: dzongkhag || '',
			phoneNumber,
		})
		
		res.status(201).json({
			message: 'User created successfully',
			user: user.toJSONSafe(),
		})
	} catch (err) {
		console.error('Create user error:', err)
		
		if (err.code === 11000) {
			if (err.keyPattern.cid) {
				return res.status(409).json({ error: 'CID already exists' })
			}
			if (err.keyPattern.phoneNumber) {
				return res.status(409).json({ error: 'Phone number already exists' })
			}
		}
		
		res.status(500).json({ error: 'Failed to create user' })
	}
})

/**
 * PATCH /api/superadmin/users/:cid
 * Update any user (including role changes)
 */
router.patch('/users/:cid', async (req, res) => {
	try {
		const { cid } = req.params
		
		if (!cid || !/^\d{11}$/.test(cid)) {
			return res.status(400).json({ error: 'Invalid CID' })
		}
		
		const user = await User.findOne({ cid })
		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		}
		
		const { name, phoneNumber, location, dzongkhag, role, password } = req.body || {}
		
		// Update fields if provided
		if (name && typeof name === 'string') {
			user.name = name.trim()
		}
		
		if (phoneNumber) {
			const cleaned = phoneNumber.trim().replace(/\D/g, '')
			if (!/^\d{8}$/.test(cleaned)) {
				return res.status(400).json({ error: 'Phone number must be exactly 8 digits' })
			}
			
			if (cleaned !== user.phoneNumber) {
				const exists = await User.findOne({ phoneNumber: cleaned })
				if (exists) {
					return res.status(409).json({ error: 'Phone number already exists' })
				}
				user.phoneNumber = cleaned
			}
		}
		
		if (location !== undefined) {
			user.location = typeof location === 'string' ? location.trim() : ''
		}
		
		if (dzongkhag !== undefined) {
			user.dzongkhag = typeof dzongkhag === 'string' ? dzongkhag.trim() : ''
		}
		
		if (role) {
			const validRoles = ['vegetable_vendor', 'farmer', 'transporter', 'superadmin']
			if (!validRoles.includes(role)) {
				return res.status(400).json({ 
					error: `Role must be one of: ${validRoles.join(', ')}` 
				})
			}
			user.role = role
		}
		
		// Update password if provided
		if (password) {
			if (password.length < 8) {
				return res.status(400).json({ error: 'Password must be at least 8 characters' })
			}
			const salt = await bcrypt.genSalt(10)
			user.password = await bcrypt.hash(password, salt)
		}
		
		await user.save()
		
		res.json({
			message: 'User updated successfully',
			user: user.toJSONSafe(),
		})
	} catch (err) {
		console.error('Update user error:', err)
		res.status(500).json({ error: 'Failed to update user' })
	}
})

/**
 * DELETE /api/superadmin/users/:cid
 * Delete a user
 */
router.delete('/users/:cid', async (req, res) => {
	try {
		const { cid } = req.params
		
		if (!cid || !/^\d{11}$/.test(cid)) {
			return res.status(400).json({ error: 'Invalid CID' })
		}
		
		// Prevent self-deletion
		if (req.user.cid === cid) {
			return res.status(400).json({ error: 'Cannot delete your own account' })
		}
		
		const user = await User.findOneAndDelete({ cid })
		
		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		}
		
		res.json({
			message: 'User deleted successfully',
			user: user.toJSONSafe(),
		})
	} catch (err) {
		console.error('Delete user error:', err)
		res.status(500).json({ error: 'Failed to delete user' })
	}
})

/**
 * GET /api/superadmin/stats
 * Get system statistics
 */
router.get('/stats', async (req, res) => {
	try {
		const [totalUsers, vegetableVendors, farmers, transporters, superadmins] = await Promise.all([
			User.countDocuments(),
			User.countDocuments({ role: 'vegetable_vendor' }),
			User.countDocuments({ role: 'farmer' }),
			User.countDocuments({ role: 'transporter' }),
			User.countDocuments({ role: 'superadmin' }),
		])
		
		res.json({
			totalUsers,
			usersByRole: {
				vegetable_vendor: vegetableVendors,
				farmer: farmers,
				transporter: transporters,
				superadmin: superadmins,
			},
		})
	} catch (err) {
		console.error('Stats error:', err)
		res.status(500).json({ error: 'Failed to fetch statistics' })
	}
})

module.exports = router
