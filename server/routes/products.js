const express = require('express')
const mongoose = require('mongoose')
const Product = require('../models/Product')
const Category = require('../models/Category')
const User = require('../models/User')
// Cloudinary removed; storing data URI directly.

const router = express.Router()

const MAX_IMG_BYTES = 10 * 1024 * 1024

function extractBase64(dataUriOrRaw){
	if (!dataUriOrRaw) return ''
	const s = String(dataUriOrRaw)
	if (s.includes(',')) return s.split(',').pop()
	return s
}

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
			const base = extractBase64(payload.productImageBase64)
			const len = Buffer.from(base, 'base64').length
			if (len > MAX_IMG_BYTES) errors.push('productImageBase64 exceeds 10MB')
		} catch (e) {
			errors.push('productImageBase64 is not valid base64')
		}
	}
	// categoryId can arrive as ObjectId or category name (we'll resolve name later). Only flag if it looks like an ObjectId but invalid pattern.
	if (payload.categoryId !== undefined) {
		const cid = String(payload.categoryId)
		if (!(mongoose.Types.ObjectId.isValid(cid) || /^[A-Za-z0-9 _-]{2,40}$/.test(cid))) {
			errors.push('categoryId must be a valid ObjectId or category name')
		}
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
	// Resolve image from current or legacy fields
	function resolveImage(doc){
		let raw = doc.productImage
		// attempt legacy fields if missing (older docs may have productImageBase64 not in schema now)
		if (!raw) raw = doc.productImageBase64 || (doc._doc && doc._doc.productImageBase64)
		if (!raw) return undefined
		// If already a data URI or http(s) URL just return
		if (/^(data:image\/(png|jpe?g|webp);base64,)/i.test(raw)) return raw
		if (/^https?:\/\//i.test(raw)) return raw
		// If it looks like bare base64 (no spaces, only base64 charset) prefix a data URI
		if (/^[A-Za-z0-9+/=]+$/.test(raw.trim()) && raw.length > 40) {
			return `data:image/jpeg;base64,${raw}`
		}
		return raw // fallback (maybe a relative path)
	}
	const img = resolveImage(p)
	const hasBlob = p.productImageData && p.productImageData.length
	const imageUrl = hasBlob ? `/api/products/${p._id}/image` : (img && /^https?:/i.test(img) ? img : (img && img.startsWith('data:') ? img : img))

	// Provide a base64 representation for backward compatibility (many clients expect productImageBase64)
	let productImageBase64
	if (hasBlob) {
		try { productImageBase64 = Buffer.from(p.productImageData).toString('base64') } catch (_) {}
	} else if (img && img.startsWith('data:image/')) {
		const m = img.match(/^data:image\/[^;]+;base64,(.+)$/i)
		if (m) productImageBase64 = m[1]
	} else if (img && /^[A-Za-z0-9+/=]+$/.test(img.trim()) && img.length > 40) {
		// raw base64 without data URI
		productImageBase64 = img.trim()
	}
	// Provide both new API shape & legacy fields the mobile UI currently expects
	return {
		productId: p.productId,
		productName: p.productName,
		categoryId: p.categoryId,
		categoryName: categoryDoc ? categoryDoc.categoryName : undefined,
		description: p.description,
		price: p.price,
		unit: p.unit,
		stockQuantity: p.stockQuantity,
		productImage: img, // raw (could be data URI)
		productImageUrl: imageUrl, // preferred URL for blob or direct
		productImageBase64, // backward compatibility field expected by existing frontend code
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
		// Legacy fields consumed by current mobile list renderer
		id: p.productId,
		name: p.productName,
		category: categoryDoc ? categoryDoc.categoryName : undefined,
		stock: p.stockQuantity > 0,
		stockUnit: p.unit,
		image: imageUrl || img,
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

// POST /api/products -> Create (single implementation)
router.post('/', async (req, res) => {
	try {
		const incoming = { ...(req.body || {}) }
		// Resolve category by name if not a valid ObjectId
		if (incoming.categoryId && !mongoose.Types.ObjectId.isValid(String(incoming.categoryId))) {
			const name = String(incoming.categoryId).trim()
			if (name) {
				const cat = await Category.findOne({ categoryName: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
				if (cat) incoming.categoryId = cat._id
			}
		}
		const errors = validateProductPayload(incoming, false)
		if (errors.length) return res.status(400).json({ success: false, errors })

		const [category, user] = await Promise.all([
			Category.findById(incoming.categoryId),
			User.findOne({ cid: incoming.createdBy }),
		])
		if (!category) return res.status(400).json({ success: false, error: 'Category not found' })
		if (!user) return res.status(400).json({ success: false, error: 'User not found' })

		const rawB64 = incoming.productImageBase64
		const base = extractBase64(rawB64)
		const dataUri = rawB64 && rawB64.startsWith('data:') ? rawB64 : `data:image/jpeg;base64,${base}`
		let mime = 'image/jpeg'
		let basePart = base
		if (rawB64.startsWith('data:')) {
			const m = rawB64.match(/^data:(image\/[^;]+);base64,(.+)$/i)
			if (m) { mime = m[1]; basePart = m[2] }
		}
		const buffer = Buffer.from(basePart, 'base64')
		const newProduct = await Product.create({
			productName: incoming.productName,
			categoryId: incoming.categoryId,
			description: incoming.description,
			price: Number(incoming.price),
			unit: incoming.unit,
			stockQuantity: Number(incoming.stockQuantity),
			// Store blob
			productImageData: buffer,
			productImageMime: mime,
			createdBy: incoming.createdBy,
		})

		return res.status(201).json({ success: true, message: 'Product created successfully', product: mapProduct(newProduct, category, user) })
	} catch (err) {
		console.error('Create product error:', err)
		return res.status(500).json({ success: false, error: 'Failed to create product' })
	}
})

// GET /api/products/:productId -> Fetch a single product by ID
router.get('/:productId', async (req, res) => {
	try {
		const { productId } = req.params
		if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ success: false, error: 'Invalid product id' })
		const prod = await Product.findById(productId)
		if (!prod) return res.status(404).json({ success: false, error: 'Product not found' })
		const category = await Category.findById(prod.categoryId)
		const seller = await User.findOne({ cid: prod.createdBy }).select('cid name phoneNumber location dzongkhag')
		res.json(mapProduct(prod, category, seller))
	} catch (err) {
		console.error('Fetch product error:', err)
		res.status(500).json({ success: false, error: 'Failed to fetch product' })
	}
})

// GET /api/products/:productId/image -> Serve binary image blob
router.get('/:productId/image', async (req, res) => {
	try {
		const { productId } = req.params
		if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).send('Invalid id')
		const prod = await Product.findById(productId).select('productImageData productImageMime productImage')
		if (!prod) return res.status(404).send('Not found')
		if (prod.productImageData && prod.productImageData.length) {
			res.setHeader('Content-Type', prod.productImageMime || 'image/jpeg')
			return res.send(prod.productImageData)
		}
		// Fallback redirect if legacy string image present
		if (prod.productImage && /^https?:/i.test(prod.productImage)) {
			return res.redirect(prod.productImage)
		}
		if (prod.productImage && prod.productImage.startsWith('data:image/')) {
			// Extract and send
			const m = prod.productImage.match(/^data:(image\/[^;]+);base64,(.+)$/i)
			if (m) {
				res.setHeader('Content-Type', m[1])
				return res.send(Buffer.from(m[2], 'base64'))
			}
		}
		return res.status(404).send('Image not available')
	} catch (e) {
		console.error('Serve image error', e)
		res.status(500).send('Server error')
	}
})

// (Removed duplicate POST route implementation above)

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
