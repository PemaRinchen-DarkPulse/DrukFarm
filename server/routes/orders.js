const express = require('express')
const mongoose = require('mongoose')
const Order = require('../models/Order')
const Product = require('../models/Product')
const User = require('../models/User')
const Cart = require('../models/Cart')
const { generateQrDataUrl } = require('../utils/qr')

const router = express.Router()

// Simple CID auth (same as cart route)
function authCid(req, res, next) {
	try {
		let cid = null
		const auth = req.headers['authorization'] || ''
		if (/^CID\s+\d{11}$/i.test(auth)) cid = auth.split(/\s+/)[1]
		if (!cid && req.headers['x-cid'] && /^\d{11}$/.test(String(req.headers['x-cid']))) cid = String(req.headers['x-cid'])
		if (!cid && req.body && req.body.cid && /^\d{11}$/.test(String(req.body.cid))) cid = String(req.body.cid)
		if (!cid) return res.status(401).json({ error: 'Unauthorized' })
		req.user = { cid }
		next()
	} catch (e) {
		return res.status(401).json({ error: 'Unauthorized' })
	}
}

async function buildUserSnapshot(cid) {
	const user = await User.findOne({ cid }).select('cid name phoneNumber location')
	return {
		cid,
		name: user?.name || '',
		phoneNumber: user?.phoneNumber || '',
		location: user?.location || '',
	}
}

function toOrderJson(o) {
	const obj = o.toObject({ virtuals: true })
	obj.orderId = obj._id
	delete obj._id
	return obj
}

function pickProductId(req) {
	const cand = (req?.body?.productId ?? req?.query?.productId ?? req?.query?.pid)
	if (!cand) return null
	const s = String(cand).trim()
	const m = s.match(/[a-fA-F0-9]{24}/)
	return m ? m[0] : null
}

// POST /api/orders/buy -> Single product purchase (independent of cart)
// Body: { productId, quantity } or Query: ?pid=<id>
router.post('/buy', authCid, async (req, res) => {
	try {
		const { quantity } = req.body || {}
		const productId = pickProductId(req)
		if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
			return res.status(400).json({ error: 'Invalid productId' })
		}
		const qty = Number(quantity || 1)
		if (!(qty >= 1 && qty <= 999)) return res.status(400).json({ error: 'Invalid quantity' })

		// Load product and buyer
		const product = await Product.findById(productId)
		if (!product) return res.status(404).json({ error: 'Product not found' })
		const userSnapshot = await buildUserSnapshot(req.user.cid)

		// Compose QR payload with minimal fields
		const qrPayload = {
			type: 'order',
			mode: 'buy',
			buyerCid: userSnapshot.cid,
			productId: String(product._id),
			productName: product.productName,
			qty,
			ts: Date.now(),
		}
		const qrCodeDataUrl = await generateQrDataUrl(qrPayload)

		const orderDoc = await Order.create({
			userCid: userSnapshot.cid,
			userSnapshot,
			product: {
				productId: product._id,
				productName: product.productName,
				price: product.price,
				unit: product.unit,
				sellerCid: product.createdBy,
				productImageBase64: product.productImageBase64 || '',
			},
			quantity: qty,
			totalPrice: Number((product.price * qty).toFixed(2)),
			qrCodeDataUrl,
			source: 'buy',
			status: 'pending',
		})

		return res.status(201).json({ success: true, order: toOrderJson(orderDoc) })
	} catch (err) {
		console.error('Buy order error:', err)
		return res.status(500).json({ error: 'Failed to create order' })
	}
})

// POST /api/orders/cart-checkout -> Create separate order per cart item
// Body: {} (cart is derived from user CID)
router.post('/cart-checkout', authCid, async (req, res) => {
	try {
		const userCid = req.user.cid
		const cart = await Cart.findOne({ userCid })
		if (!cart || !cart.items.length) return res.status(400).json({ error: 'Cart is empty' })

		// Load products for items
		const productIds = cart.items.map(i => i.productId)
		const products = await Product.find({ _id: { $in: productIds } })
		const productMap = new Map(products.map(p => [String(p._id), p]))

		const userSnapshot = await buildUserSnapshot(userCid)

		// Build orders
		const ordersToCreate = []
		for (const item of cart.items) {
			const p = productMap.get(String(item.productId))
			if (!p) continue
			const qty = item.quantity || 1
			const qrPayload = {
				type: 'order',
				mode: 'cart',
				buyerCid: userSnapshot.cid,
				productId: String(p._id),
				productName: p.productName,
				qty,
				ts: Date.now(),
			}
			// eslint-disable-next-line no-await-in-loop
			const qrCodeDataUrl = await generateQrDataUrl(qrPayload)
			ordersToCreate.push({
				userCid,
				userSnapshot,
				product: {
					productId: p._id,
					productName: p.productName,
					price: p.price,
					unit: p.unit,
					sellerCid: p.createdBy,
					productImageBase64: p.productImageBase64 || '',
				},
				quantity: qty,
				totalPrice: Number((p.price * qty).toFixed(2)),
				qrCodeDataUrl,
				source: 'cart',
				status: 'pending',
			})
		}

		if (!ordersToCreate.length) return res.status(400).json({ error: 'No valid items to order' })

			const created = await Order.insertMany(ordersToCreate)

			// On successful checkout, clear the user's cart
			try {
				await Cart.updateOne({ userCid }, { $set: { items: [] } })
			} catch (e) {
				// Non-fatal; orders already created
				console.warn('Failed to clear cart after checkout:', e)
			}

			return res.status(201).json({ success: true, cartCleared: true, orders: created.map(toOrderJson) })
	} catch (err) {
		console.error('Cart checkout error:', err)
		return res.status(500).json({ error: 'Failed to checkout cart' })
	}
})

// GET /api/orders/transport-search
// Query params:
//   from: seller Dzongkhag (exact match)
//   to: one or more consumer Dzongkhags (comma-separated or repeated)
// Auth: requires a valid CID (transporter or any authenticated user)
router.get('/transport-search', authCid, async (req, res) => {
	try {
		const from = String(req.query.from || '').trim()
		// normalize 'to' into an array of strings
		const rawTo = req.query.to
		let toList = []
		if (Array.isArray(rawTo)) {
			toList = rawTo.flatMap(v => String(v || '')
				.split(',')
				.map(s => s.trim())
				.filter(Boolean))
		} else if (typeof rawTo === 'string') {
			toList = rawTo.split(',').map(s => s.trim()).filter(Boolean)
		}

		if (!from || toList.length === 0) {
			return res.status(400).json({ error: 'Missing from or to dzongkhag(s)' })
		}

		// Only consider orders that could require transport (pending or paid)
		const candidateOrders = await Order.find({ status: { $in: ['pending', 'paid'] } }).sort({ createdAt: -1 })

		// Build maps of seller and buyer users to access dzongkhag and contact info
		const sellerCids = [...new Set(candidateOrders.map(o => o?.product?.sellerCid).filter(Boolean))]
		const buyerCids = [...new Set(candidateOrders.map(o => o?.userSnapshot?.cid).filter(Boolean))]

		const users = await User.find({ cid: { $in: [...new Set([...sellerCids, ...buyerCids])] } })
			.select('cid name phoneNumber location dzongkhag')

		const uMap = new Map(users.map(u => [u.cid, u]))

		const filtered = []
		for (const o of candidateOrders) {
			const s = uMap.get(o?.product?.sellerCid)
			const b = uMap.get(o?.userSnapshot?.cid)
			const sellerDz = s?.dzongkhag || ''
			const buyerDz = b?.dzongkhag || ''
			if (sellerDz === from && toList.includes(buyerDz)) {
				filtered.push({
					orderId: String(o._id),
					createdAt: o.createdAt,
					status: o.status,
					quantity: o.quantity,
					totalPrice: o.totalPrice,
					product: {
						productId: String(o.product?.productId || ''),
						name: o.product?.productName || '',
						unit: o.product?.unit || '',
						price: o.product?.price || 0,
						imageBase64: o.product?.productImageBase64 || '',
					},
					seller: s ? {
						cid: s.cid,
						name: s.name,
						phoneNumber: s.phoneNumber,
						location: s.location,
						dzongkhag: s.dzongkhag,
					} : { cid: o.product?.sellerCid || '' },
					buyer: b ? {
						cid: b.cid,
						name: b.name,
						phoneNumber: b.phoneNumber,
						location: b.location,
						dzongkhag: b.dzongkhag,
					} : {
						cid: o.userSnapshot?.cid || '',
						name: o.userSnapshot?.name || '',
						phoneNumber: o.userSnapshot?.phoneNumber || '',
						location: o.userSnapshot?.location || '',
						dzongkhag: '',
					},
				})
			}
		}

		res.json({ success: true, count: filtered.length, orders: filtered })
	} catch (err) {
		console.error('Transport search error:', err)
		res.status(500).json({ error: 'Failed to search orders' })
	}
})

// PATCH /api/orders/:orderId/out-for-delivery
// Marks an order as OUT_FOR_DELIVERY and assigns the current transporter (by CID)
router.patch('/:orderId/out-for-delivery', authCid, async (req, res) => {
	try {
		const { orderId } = req.params
		if (!mongoose.Types.ObjectId.isValid(String(orderId))) return res.status(400).json({ error: 'Invalid order id' })

		// Verify requester is a transporter (or legacy 'transported')
		const me = await User.findOne({ cid: req.user.cid }).select('cid role name phoneNumber')
		if (!me) return res.status(401).json({ error: 'Unauthorized' })
		const role = (me.role || '').toLowerCase()
		if (!(role === 'transporter' || role === 'transported')) return res.status(403).json({ error: 'Only transporters can perform this action' })

		const order = await Order.findById(orderId)
		if (!order) return res.status(404).json({ error: 'Order not found' })
		if (['cancelled', 'delivered'].includes(order.status)) return res.status(409).json({ error: `Cannot deliver an order with status ${order.status}` })
		if (order.status === 'OUT_FOR_DELIVERY' || order.status === 'Out for Delivery') return res.status(409).json({ error: 'Order already out for delivery' })

		// Transporter snapshot: prefer explicit body if provided, else user doc
		const body = req.body || {}
		const transporter = {
			cid: me.cid,
			name: (body.name || me.name || ''),
			phoneNumber: (body.phoneNumber || me.phoneNumber || ''),
		}

		order.status = 'OUT_FOR_DELIVERY'
		order.transporter = transporter
		await order.save()

		return res.json({ success: true, order: { orderId: String(order._id), status: order.status, transporter: order.transporter } })
	} catch (err) {
		console.error('Out-for-delivery error:', err)
		return res.status(500).json({ error: 'Failed to mark as out for delivery' })
	}
})

// GET /api/orders/my-transports -> Orders assigned to current transporter
router.get('/my-transports', authCid, async (req, res) => {
	try {
		const me = await User.findOne({ cid: req.user.cid }).select('cid role')
		if (!me) return res.status(401).json({ error: 'Unauthorized' })
		const role = (me.role || '').toLowerCase()
		if (!(role === 'transporter' || role === 'transported')) return res.status(403).json({ error: 'Only transporters can view transports' })

		const docs = await Order.find({ 'transporter.cid': me.cid }).sort({ createdAt: -1 })
		const sellerCids = [...new Set(docs.map(o => o?.product?.sellerCid).filter(Boolean))]
		const buyerCids = [...new Set(docs.map(o => o?.userSnapshot?.cid).filter(Boolean))]
		const sellers = sellerCids.length ? await User.find({ cid: { $in: sellerCids } }).select('cid name phoneNumber') : []
		const buyers = buyerCids.length ? await User.find({ cid: { $in: buyerCids } }).select('cid dzongkhag') : []
		const sMap = new Map(sellers.map(u => [u.cid, u]))
		const bMap = new Map(buyers.map(u => [u.cid, u]))

		const mapped = docs.map(o => ({
			orderId: String(o._id),
			status: o.status,
			createdAt: o.createdAt,
			totalPrice: o.totalPrice,
			quantity: o.quantity,
			product: {
				productId: String(o.product.productId),
				name: o.product.productName,
				unit: o.product.unit,
				price: o.product.price,
			},
			seller: (() => {
				const scid = o?.product?.sellerCid
				const su = scid ? sMap.get(scid) : null
				return {
					cid: scid || '',
					name: su?.name || '',
					phoneNumber: su?.phoneNumber || '',
				}
			})(),
			buyer: {
			cid: o.userSnapshot?.cid,
			name: o.userSnapshot?.name,
			phoneNumber: o.userSnapshot?.phoneNumber,
			location: o.userSnapshot?.location || '',
			dzongkhag: (() => { const bu = bMap.get(o?.userSnapshot?.cid); return bu?.dzongkhag || '' })(),
			},
			transporter: o.transporter || null,
		}))
		res.json({ success: true, orders: mapped })
	} catch (err) {
		console.error('Fetch my transports error:', err)
		res.status(500).json({ error: 'Failed to fetch transports' })
	}
})

// PATCH /api/orders/:orderId/delivered -> mark an assigned transport as delivered
router.patch('/:orderId/delivered', authCid, async (req, res) => {
	try {
		const { orderId } = req.params
		if (!mongoose.Types.ObjectId.isValid(String(orderId))) return res.status(400).json({ error: 'Invalid order id' })

		const me = await User.findOne({ cid: req.user.cid }).select('cid role')
		if (!me) return res.status(401).json({ error: 'Unauthorized' })
		const role = (me.role || '').toLowerCase()
		if (!(role === 'transporter' || role === 'transported')) return res.status(403).json({ error: 'Only transporters can perform this action' })

		const order = await Order.findById(orderId)
		if (!order) return res.status(404).json({ error: 'Order not found' })
		if (!order.transporter || String(order.transporter.cid) !== String(me.cid)) return res.status(403).json({ error: 'Not your delivery' })
		if (order.status === 'delivered') return res.status(409).json({ error: 'Order already delivered' })

		order.status = 'delivered'
		await order.save()
		res.json({ success: true, order: { orderId: String(order._id), status: order.status } })
	} catch (err) {
		console.error('Mark delivered error:', err)
		res.status(500).json({ error: 'Failed to mark as delivered' })
	}
})

module.exports = router

// GET /api/orders/seller -> Orders for products created by the current seller (by CID)
router.get('/seller', authCid, async (req, res) => {
	try {
		const sellerCid = req.user.cid
		const docs = await Order.find({ 'product.sellerCid': sellerCid }).sort({ createdAt: -1 })
		const mapped = docs.map(o => ({
			orderId: String(o._id),
			status: o.status,
			createdAt: o.createdAt,
			totalPrice: o.totalPrice,
			quantity: o.quantity,
			product: {
				productId: String(o.product.productId),
				name: o.product.productName,
				unit: o.product.unit,
				price: o.product.price,
			},
			buyer: {
				cid: o.userSnapshot?.cid,
				name: o.userSnapshot?.name,
				location: o.userSnapshot?.location,
				phoneNumber: o.userSnapshot?.phoneNumber,
			},
		}))
		res.json({ success: true, orders: mapped })
	} catch (err) {
		console.error('Fetch seller orders error:', err)
		res.status(500).json({ error: 'Failed to fetch orders' })
	}
})

// GET /api/orders/my -> Orders placed by the current consumer (buyer)
router.get('/my', authCid, async (req, res) => {
	try {
		const userCid = req.user.cid
		const docs = await Order.find({ userCid }).sort({ createdAt: -1 })
		// collect seller CIDs to enrich seller info
		const sellerCids = [...new Set(docs.map(d => d?.product?.sellerCid).filter(Boolean))]
		const sellers = sellerCids.length ? await User.find({ cid: { $in: sellerCids } }).select('cid name location phoneNumber') : []
		const sMap = new Map(sellers.map(s => [s.cid, s]))
		const mapped = docs.map(o => ({
			orderId: String(o._id),
			status: o.status,
			createdAt: o.createdAt,
			totalPrice: o.totalPrice,
			quantity: o.quantity,
			product: {
				productId: String(o.product.productId),
				name: o.product.productName,
				unit: o.product.unit,
				price: o.product.price,
			},
			seller: (() => {
				const s = sMap.get(o.product?.sellerCid)
				return s ? { cid: s.cid, name: s.name, location: s.location, phoneNumber: s.phoneNumber } : { cid: o.product?.sellerCid || '' }
			})(),
		}))
		res.json({ success: true, orders: mapped })
	} catch (err) {
		console.error('Fetch my orders error:', err)
		res.status(500).json({ error: 'Failed to fetch orders' })
	}
})

router.patch('/:orderId/cancel', authCid, async (req, res) => {
	try {
		const { orderId } = req.params
		if (!mongoose.Types.ObjectId.isValid(String(orderId))) return res.status(400).json({ error: 'Invalid order id' })
		const userCid = req.user.cid
		const order = await Order.findById(orderId)
		if (!order) return res.status(404).json({ error: 'Order not found' })
		if (String(order.userCid) !== String(userCid)) return res.status(403).json({ error: 'Forbidden' })
		if (order.status !== 'pending') return res.status(409).json({ error: 'Only pending orders can be cancelled' })
		order.status = 'cancelled'
		await order.save()
		res.json({ success: true, order: { orderId: String(order._id), status: order.status } })
	} catch (err) {
		console.error('Cancel order error:', err)
		res.status(500).json({ error: 'Failed to cancel order' })
	}
})

