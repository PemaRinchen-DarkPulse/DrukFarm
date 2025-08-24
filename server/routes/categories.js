const express = require('express')
const Category = require('../models/Category')

const router = express.Router()

// GET /api/categories -> Fetch all categories
router.get('/', async (_req, res) => {
	try {
		const categories = await Category.find().sort({ categoryName: 1 })
		// Return array of { categoryId, categoryName }
		res.json(categories.map(c => ({ categoryId: c.categoryId, categoryName: c.categoryName })))
	} catch (err) {
		console.error('Fetch categories error:', err)
		res.status(500).json({ success: false, error: 'Failed to fetch categories' })
	}
})

// POST /api/categories -> Create a new category
router.post('/', async (req, res) => {
	try {
		const { categoryName } = req.body || {}
		if (!categoryName || typeof categoryName !== 'string' || !categoryName.trim()) {
			return res.status(400).json({ success: false, error: 'categoryName is required' })
		}
		const name = categoryName.trim()
		const exists = await Category.findOne({ categoryName: name })
		if (exists) return res.status(409).json({ success: false, error: 'Category already exists' })

		const doc = await Category.create({ categoryName: name })
		return res.status(201).json({ categoryId: doc.categoryId, categoryName: doc.categoryName })
	} catch (err) {
		console.error('Create category error:', err)
		if (err && err.code === 11000) {
			return res.status(409).json({ success: false, error: 'Category already exists' })
		}
		return res.status(500).json({ success: false, error: 'Failed to create category' })
	}
})

module.exports = router
