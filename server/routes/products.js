const express = require('express')
const mongoose = require('mongoose')
const Product = require('../models/Product')
const Category = require('../models/Category')
const User = require('../models/User')

const router = express.Router()

const MAX_IMG_BYTES = 10 * 1024 * 1024

function validateProductPayload(payload, isUpdate = false) {
	const errors = []
	const required = field => {
		if (payload[field] === undefined || payload[field] === null || (typeof payload[field] === 'string' && !payload[field].trim())) {
			errors.push(`${field} is required`)
		}
	}

	if (!isUpdate) {
		;['productName', 'categoryId', 'description', 'price', 'unit', 'stockQuantity', 'productImageBase64', 'createdBy'].forEach(required)
	}

	if (payload.description !== undefined) {
		const d = String(payload.description || '')
		if (d.length < 70 || d.length > 180) errors.push('description must be 70-180 characters')
	}
	if (payload.price !== undefined) {
		const p = Number(payload.price)
		if (!(p > 0)) errors.push('price must be greater than 0')
	}
	if (payload.stockQuantity !== undefined) {
		const s = Number(payload.stockQuantity)
		if (!(s >= 0)) errors.push('stockQuantity must be >= 0')
	}
	if (payload.productImageBase64 !== undefined && payload.productImageBase64 !== null) {
		try {
			const len = Buffer.from(payload.productImageBase64, 'base64').length
			if (len > MAX_IMG_BYTES) errors.push('productImageBase64 exceeds 10MB')
		} catch (e) {
			errors.push('productImageBase64 is not valid base64')
		}
	}
	if (payload.categoryId !== undefined) {
		if (!mongoose.Types.ObjectId.isValid(String(payload.categoryId))) errors.push('categoryId must be a valid ObjectId')
	}
	return errors
}

function buildLocationLabel(userDoc){
  const vg = (userDoc?.location || '').trim()
  const dz = (userDoc?.dzongkhag || '').trim()
  if (vg && dz) return `${vg}, ${dz}`
  return vg || dz || ''
}

function mapProduct(p, categoryDoc, sellerDoc) {
	return {
		productId: p.productId,
		productName: p.productName,
		categoryId: p.categoryId,
		categoryName: categoryDoc ? categoryDoc.categoryName : undefined,
		description: p.description,
		price: p.price,
		unit: p.unit,
		stockQuantity: p.stockQuantity,
		productImageBase64: p.productImageBase64,
		createdBy: p.createdBy,
		rating: p.rating,
		reviews: p.reviews,
		sellerCid: sellerDoc?.cid || p.createdBy,
		sellerName: sellerDoc?.name || undefined,
		sellerPhoneNumber: sellerDoc?.phoneNumber || undefined,
		sellerLocationVillageGewog: sellerDoc?.location || '',
		sellerDzongkhag: sellerDoc?.dzongkhag || '',
		sellerLocationLabel: buildLocationLabel(sellerDoc),
		createdAt: p.createdAt,
		updatedAt: p.updatedAt,
	}
}

// GET /api/products -> Fetch all products
router.get('/', async (_req, res) => {
	try {
		const products = await Product.find().sort({ createdAt: -1 })
		const categoryIds = [...new Set(products.map(p => String(p.categoryId)))]
		const categories = await Category.find({ _id: { $in: categoryIds } })
		const map = new Map(categories.map(c => [String(c._id), c]))
		const sellerCids = [...new Set(products.map(p => p.createdBy).filter(Boolean))]
		const sellers = sellerCids.length ? await User.find({ cid: { $in: sellerCids } }).select('cid name phoneNumber location dzongkhag') : []
		const sMap = new Map(sellers.map(s => [s.cid, s]))
		res.json(products.map(p => mapProduct(p, map.get(String(p.categoryId)), sMap.get(p.createdBy))))
	} catch (err) {
		console.error('Fetch products error:', err)
		res.status(500).json({ success: false, error: 'Failed to fetch products' })
	}
})

// GET /api/products/category/:categoryId -> Fetch products by category
router.get('/category/:categoryId', async (req, res) => {
	try {
		const { categoryId } = req.params
		if (!mongoose.Types.ObjectId.isValid(String(categoryId))) {
			return res.status(400).json({ success: false, error: 'Invalid category id' })
		}
		const products = await Product.find({ categoryId }).sort({ createdAt: -1 })
		const category = await Category.findById(categoryId)
		const sellerCids = [...new Set(products.map(p => p.createdBy).filter(Boolean))]
		const sellers = sellerCids.length ? await User.find({ cid: { $in: sellerCids } }).select('cid name phoneNumber location dzongkhag') : []
		const sMap = new Map(sellers.map(s => [s.cid, s]))
		res.json(products.map(p => mapProduct(p, category, sMap.get(p.createdBy))))
	} catch (err) {
		console.error('Fetch products by category error:', err)
		res.status(500).json({ success: false, error: 'Failed to fetch products by category' })
	}
})

// GET /api/products/:id -> Fetch one
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params
		if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, error: 'Invalid product id' })
		const prod = await Product.findById(id)
		if (!prod) return res.status(404).json({ success: false, error: 'Product not found' })
		const category = await Category.findById(prod.categoryId)
		const seller = await User.findOne({ cid: prod.createdBy }).select('cid name phoneNumber location dzongkhag')
		res.json(mapProduct(prod, category, seller))
	} catch (err) {
		console.error('Fetch product error:', err)
		res.status(500).json({ success: false, error: 'Failed to fetch product' })
	}
})

// POST /api/products -> Create
router.post('/', async (req, res) => {
	try {
		const payload = req.body || {}
		const errors = validateProductPayload(payload, false)
		if (errors.length) return res.status(400).json({ success: false, error: errors.join(', ') })

		// Ensure category exists
		const category = await Category.findById(payload.categoryId)
		if (!category) return res.status(400).json({ success: false, error: 'Invalid categoryId' })

			const capFirst = s => (s && typeof s === 'string') ? (s.trim().charAt(0).toUpperCase() + s.trim().slice(1)) : s
			const doc = await Product.create({
				productName: capFirst(payload.productName),
			categoryId: payload.categoryId,
				description: capFirst(payload.description),
			price: Number(payload.price),
			unit: String(payload.unit),
			stockQuantity: Number(payload.stockQuantity),
			productImageBase64: payload.productImageBase64,
			createdBy: String(payload.createdBy),
		})

		const seller = await User.findOne({ cid: doc.createdBy }).select('cid name phoneNumber location dzongkhag')
		const resBody = mapProduct(doc, category, seller)
		res.status(201).json({ ...resBody, success: true, message: 'Product saved successfully' })
	} catch (err) {
		console.error('Create product error:', err)
		res.status(500).json({ success: false, error: 'Failed to create product' })
	}
})

// PUT /api/products/:id -> Update
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params
		if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, error: 'Invalid product id' })
		const payload = req.body || {}
		const errors = validateProductPayload(payload, true)
		if (errors.length) return res.status(400).json({ success: false, error: errors.join(', ') })

		if (payload.categoryId) {
			const exists = await Category.findById(payload.categoryId)
			if (!exists) return res.status(400).json({ success: false, error: 'Invalid categoryId' })
		}

		const update = {}
		;['productName', 'categoryId', 'description', 'price', 'unit', 'stockQuantity', 'productImageBase64', 'createdBy'].forEach(k => {
			if (payload[k] !== undefined) update[k] = payload[k]
		})
		const capFirst2 = s => (s && typeof s === 'string') ? (s.trim().charAt(0).toUpperCase() + s.trim().slice(1)) : s
		if (update.productName) update.productName = capFirst2(update.productName)
		if (update.description) update.description = capFirst2(update.description)
		if (update.price !== undefined) update.price = Number(update.price)
		if (update.stockQuantity !== undefined) update.stockQuantity = Number(update.stockQuantity)

		const doc = await Product.findByIdAndUpdate(id, update, { new: true })
		if (!doc) return res.status(404).json({ success: false, error: 'Product not found' })
		const category = await Category.findById(doc.categoryId)
		const seller = await User.findOne({ cid: doc.createdBy }).select('cid name phoneNumber location dzongkhag')
		const resBody = mapProduct(doc, category, seller)
		res.json({ ...resBody, success: true, message: 'Product saved successfully' })
	} catch (err) {
		console.error('Update product error:', err)
		res.status(500).json({ success: false, error: 'Failed to update product' })
	}
})

// DELETE /api/products/:id -> Delete
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params
		if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, error: 'Invalid product id' })
		const doc = await Product.findByIdAndDelete(id)
		if (!doc) return res.status(404).json({ success: false, error: 'Product not found' })
		res.status(204).send()
	} catch (err) {
		console.error('Delete product error:', err)
		res.status(500).json({ success: false, error: 'Failed to delete product' })
	}
})

module.exports = router
