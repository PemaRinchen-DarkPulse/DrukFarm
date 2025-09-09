const express = require('express')
const Address = require('../models/Address')
const User = require('../models/User')

const router = express.Router()

// GET /api/addresses/:userCid - Get all addresses for a user
router.get('/:userCid', async (req, res) => {
	try {
		const { userCid } = req.params

		// Validate CID format
		if (!userCid || !/^\d{11}$/.test(userCid)) {
			return res.status(400).json({ error: 'Invalid CID format' })
		}

		// Check if user exists
		const user = await User.findOne({ cid: userCid })
		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		}

		// Fetch addresses for the user
		const addresses = await Address.find({ userCid }).sort({ isDefault: -1, createdAt: -1 })
		res.json(addresses)
	} catch (error) {
		console.error('Error fetching addresses:', error)
		res.status(500).json({ error: 'Server error' })
	}
})

// POST /api/addresses - Create a new address
router.post('/', async (req, res) => {
	try {
		const { userCid, title, icon, dzongkhag, place, isDefault } = req.body

		// Validate required fields
		if (!userCid || !title || !icon || !dzongkhag || !place) {
			return res.status(400).json({ 
				error: 'Missing required fields: userCid, title, icon, dzongkhag, place' 
			})
		}

		// Validate CID format
		if (!/^\d{11}$/.test(userCid)) {
			return res.status(400).json({ error: 'Invalid CID format' })
		}

		// Check if user exists
		const user = await User.findOne({ cid: userCid })
		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		}

		// Create new address
		const addressData = {
			userCid,
			title: title.trim(),
			icon,
			dzongkhag: dzongkhag.trim(),
			place: place.trim(),
			isDefault: Boolean(isDefault)
		}

		const newAddress = new Address(addressData)
		await newAddress.save()

		res.status(201).json(newAddress)
	} catch (error) {
		console.error('Error creating address:', error)
		if (error.name === 'ValidationError') {
			return res.status(400).json({ error: error.message })
		}
		res.status(500).json({ error: 'Server error' })
	}
})

// PUT /api/addresses/:id - Update an address
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params
		const { title, icon, dzongkhag, place, isDefault } = req.body

		const address = await Address.findById(id)
		if (!address) {
			return res.status(404).json({ error: 'Address not found' })
		}

		// Update fields if provided
		if (title !== undefined) address.title = title.trim()
		if (icon !== undefined) address.icon = icon
		if (dzongkhag !== undefined) address.dzongkhag = dzongkhag.trim()
		if (place !== undefined) address.place = place.trim()
		if (isDefault !== undefined) address.isDefault = Boolean(isDefault)

		await address.save()
		res.json(address)
	} catch (error) {
		console.error('Error updating address:', error)
		if (error.name === 'ValidationError') {
			return res.status(400).json({ error: error.message })
		}
		res.status(500).json({ error: 'Server error' })
	}
})

// DELETE /api/addresses/:id - Delete an address
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params

		const address = await Address.findById(id)
		if (!address) {
			return res.status(404).json({ error: 'Address not found' })
		}

		await Address.findByIdAndDelete(id)
		res.json({ message: 'Address deleted successfully' })
	} catch (error) {
		console.error('Error deleting address:', error)
		res.status(500).json({ error: 'Server error' })
	}
})

// PUT /api/addresses/:id/default - Set address as default
router.put('/:id/default', async (req, res) => {
	try {
		const { id } = req.params

		const address = await Address.findById(id)
		if (!address) {
			return res.status(404).json({ error: 'Address not found' })
		}

		// Update this address to be default
		address.isDefault = true
		await address.save()

		res.json(address)
	} catch (error) {
		console.error('Error setting default address:', error)
		res.status(500).json({ error: 'Server error' })
	}
})

module.exports = router
