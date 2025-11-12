/**
 * Utility script to create the first super admin user
 * Usage: node server/utils/createSuperAdmin.js (from project root)
 *    OR: node utils/createSuperAdmin.js (from server directory)
 */

const path = require('path')
const fs = require('fs')

// Ensure .env is loaded from server directory
const serverDir = path.join(__dirname, '..')
const envPath = path.join(serverDir, '.env')

if (fs.existsSync(envPath)) {
	require('dotenv').config({ path: envPath })
	console.log('📄 Loaded .env from:', envPath)
} else {
	console.warn('⚠️  .env file not found at:', envPath)
	console.warn('⚠️  Will use default connection settings')
}

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

async function createSuperAdmin() {
	try {
		// Connect to database - use the same connection logic as server.js
		const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drukfarm'
		const MONGODB_NOSRV_URI = process.env.MONGODB_NOSRV_URI || ''
		const MONGODB_FALLBACK_URI = process.env.MONGODB_FALLBACK_URI || 'mongodb://127.0.0.1:27017/drukfarm'
		
		console.log('Connecting to MongoDB...')
		const isSrv = /^mongodb\+srv:/i.test(MONGODB_URI)
		
		try {
			await mongoose.connect(MONGODB_URI)
			console.log('✅ Connected to MongoDB')
		} catch (err) {
			// Handle DNS SRV lookup failures
			const srvFailure = isSrv && (
				err?.code === 'ESERVFAIL' ||
				/querySrv/i.test(String(err?.syscall || '')) ||
				/ENOTFOUND|EAI_AGAIN/i.test(String(err?.code || ''))
			)
			
			if (srvFailure) {
				if (MONGODB_NOSRV_URI) {
					console.warn('⚠️  DNS SRV lookup failed. Trying non-SRV URI...')
					try {
						await mongoose.connect(MONGODB_NOSRV_URI)
						console.log('✅ Connected to MongoDB (non-SRV)')
					} catch (e2) {
						console.warn('Non-SRV URI failed. Trying fallback...')
						await mongoose.connect(MONGODB_FALLBACK_URI)
						console.log('✅ Connected to MongoDB (fallback)')
					}
				} else {
					console.warn('⚠️  Falling back to local MongoDB...')
					await mongoose.connect(MONGODB_FALLBACK_URI)
					console.log('✅ Connected to MongoDB (fallback)')
				}
			} else {
				throw err
			}
		}

		// Super admin details - CHANGE THESE!
		const superAdminData = {
			cid: '12345678901', // 11-digit CID
			name: 'Super Admin',
			password: 'Admin@123456', // Strong password
			role: 'superadmin',
			location: 'Thimphu',
			dzongkhag: 'Thimphu',
			phoneNumber: '17000000', // 8-digit phone
		}

		// Check if super admin already exists
		const existing = await User.findOne({ 
			$or: [
				{ cid: superAdminData.cid },
				{ phoneNumber: superAdminData.phoneNumber },
				{ role: 'superadmin' }
			]
		})

		if (existing) {
			console.log('⚠️  Super admin user already exists:')
			console.log('   CID:', existing.cid)
			console.log('   Name:', existing.name)
			console.log('   Role:', existing.role)
			console.log('\nTo create a different super admin, update the script with different CID/phone.')
			await mongoose.disconnect()
			return
		}

		// Hash password
		const salt = await bcrypt.genSalt(10)
		const hashedPassword = await bcrypt.hash(superAdminData.password, salt)

		// Create super admin
		const superAdmin = await User.create({
			...superAdminData,
			password: hashedPassword,
		})

		console.log('\n✅ Super Admin created successfully!')
		console.log('─────────────────────────────────────')
		console.log('CID:', superAdmin.cid)
		console.log('Name:', superAdmin.name)
		console.log('Phone:', superAdmin.phoneNumber)
		console.log('Role:', superAdmin.role)
		console.log('─────────────────────────────────────')
		console.log('\n⚠️  IMPORTANT: Save these credentials securely!')
		console.log('Login with:')
		console.log('  Phone Number:', superAdminData.phoneNumber)
		console.log('  Password:', superAdminData.password)
		console.log('\nAuthorization Header for API calls:')
		console.log(`  Authorization: CID ${superAdmin.cid}`)
		console.log('─────────────────────────────────────\n')

		await mongoose.disconnect()
		console.log('✅ Disconnected from MongoDB')
	} catch (err) {
		console.error('❌ Error creating super admin:', err)
		await mongoose.disconnect()
		process.exit(1)
	}
}

// Run the script
createSuperAdmin()
