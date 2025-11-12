const User = require('../models/User')

/**
 * Middleware to authenticate user via CID in Authorization header
 * Expected format: "CID <11-digit-cid>"
 */
function authCid(req, res, next) {
	let cid = null
	const auth = req.headers['authorization'] || ''
	
	if (/^CID\s+\d{11}$/i.test(auth)) {
		cid = auth.split(/\s+/)[1]
	}
	
	if (!cid) {
		return res.status(401).json({ error: 'Unauthorized - CID required' })
	}
	
	// Attach CID to request for downstream use
	req.userCid = cid
	next()
}

/**
 * Middleware to verify authenticated user exists and attach user object
 */
async function requireAuth(req, res, next) {
	try {
		let cid = null
		const auth = req.headers['authorization'] || ''
		
		if (/^CID\s+\d{11}$/i.test(auth)) {
			cid = auth.split(/\s+/)[1]
		}
		
		if (!cid) {
			return res.status(401).json({ error: 'Unauthorized - CID required' })
		}
		
		const user = await User.findOne({ cid })
		if (!user) {
			return res.status(401).json({ error: 'Unauthorized - User not found' })
		}
		
		// Attach user to request
		req.user = user
		req.userCid = cid
		next()
	} catch (err) {
		console.error('Auth error:', err)
		return res.status(500).json({ error: 'Authentication failed' })
	}
}

/**
 * Middleware to require super admin role
 * Must be used after requireAuth
 */
function requireSuperAdmin(req, res, next) {
	if (!req.user) {
		return res.status(401).json({ error: 'Unauthorized' })
	}
	
	if (req.user.role !== 'superadmin') {
		return res.status(403).json({ error: 'Forbidden - Super admin access required' })
	}
	
	next()
}

/**
 * Middleware to require specific role(s)
 * Must be used after requireAuth
 */
function requireRole(...roles) {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ error: 'Unauthorized' })
		}
		
		if (!roles.includes(req.user.role)) {
			return res.status(403).json({ 
				error: `Forbidden - Requires one of: ${roles.join(', ')}` 
			})
		}
		
		next()
	}
}

module.exports = {
	authCid,
	requireAuth,
	requireSuperAdmin,
	requireRole,
}
