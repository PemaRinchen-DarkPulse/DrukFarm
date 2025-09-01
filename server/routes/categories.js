const express = require('express')
const Category = require('../models/Category')

const router = express.Router()

// GET /api/categories -> Fetch all categories
router.get('/', async (_req, res) => {
	try {
		const categories = await Category.find().sort({ categoryName: 1 })
		// Return array of { categoryId, categoryName, description, imageBase64 }
		res.json(categories.map(c => ({
			categoryId: c.categoryId,
			categoryName: c.categoryName,
			description: c.description,
			imageBase64: c.imageBase64,
		})))
	} catch (err) {
		console.error('Fetch categories error:', err)
		res.status(500).json({ success: false, error: 'Failed to fetch categories' })
	}
})

// POST /api/categories -> Create a new category
router.post('/', async (req, res) => {
	try {
		const { categoryName, description, imageBase64 } = req.body || {}
		if (!categoryName || typeof categoryName !== 'string' || !categoryName.trim()) {
			return res.status(400).json({ success: false, error: 'categoryName is required' })
		}
		const name = categoryName.trim()

		// Validate description 15-45 chars
		if (typeof description !== 'string' || !description.trim()) {
			return res.status(400).json({ success: false, error: 'description is required' })
		}
		const desc = description.trim()
		if (desc.length < 15 || desc.length > 45) {
			return res.status(400).json({ success: false, error: 'description must be 15 to 45 characters' })
		}

		// Validate image base64 (basic check + size up to 2MB)
		if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
			return res.status(400).json({ success: false, error: 'imageBase64 is required' })
		}
		const imgB64 = imageBase64.trim()
		const base64Regex = /^[A-Za-z0-9+/=]+$/
		if (!base64Regex.test(imgB64)) {
			return res.status(400).json({ success: false, error: 'imageBase64 must be valid base64 data' })
		}
		const MAX_IMG = 2 * 1024 * 1024
		try {
			const len = Buffer.from(imgB64, 'base64').length
			if (len > MAX_IMG) return res.status(400).json({ success: false, error: 'imageBase64 exceeds 2MB' })
		} catch (e) {
			return res.status(400).json({ success: false, error: 'imageBase64 is not valid' })
		}

		const exists = await Category.findOne({ categoryName: name })
		if (exists) return res.status(409).json({ success: false, error: 'Category already exists' })

		const doc = await Category.create({ categoryName: name, description: desc, imageBase64: imgB64 })
		return res.status(201).json({
			categoryId: doc.categoryId,
			categoryName: doc.categoryName,
			description: doc.description,
			imageBase64: doc.imageBase64,
		})
	} catch (err) {
		console.error('Create category error:', err)
		if (err && err.code === 11000) {
			return res.status(409).json({ success: false, error: 'Category already exists' })
		}
		return res.status(500).json({ success: false, error: 'Failed to create category' })
	}
})

module.exports = router
