const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');
const { generateQrDataUrl } = require('../utils/qr');
const { generateOrderImage } = require('../utils/image');

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

async function buildDeliveryAddressSnapshot(userCid, addressData) {
	if (addressData && addressData.title && addressData.place && addressData.dzongkhag) {
		return {
			title: addressData.title,
			place: addressData.place,
			dzongkhag: addressData.dzongkhag
		}
	}
	
	// Fallback to user's default address from Address model
	const Address = require('../models/Address')
	const addresses = await Address.find({ userCid }).sort({ isDefault: -1, createdAt: -1 })
	const defaultAddress = addresses[0]
	
	if (defaultAddress) {
		return {
			title: defaultAddress.title,
			place: defaultAddress.place,
			dzongkhag: defaultAddress.dzongkhag
		}
	}
	
	// Ultimate fallback
	return {
		title: 'Default Address',
		place: 'N/A',
		dzongkhag: 'N/A'
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

// Atomically decrement stock if sufficient; returns updated product or null if insufficient
async function tryDecrementStock(productId, qty) {
	return Product.findOneAndUpdate(
		{ _id: productId, stockQuantity: { $gte: qty } },
		{ $inc: { stockQuantity: -qty } },
		{ new: true }
	)
}

// Best-effort rollback for stock decrements (used on failures after decrement)
async function rollbackStock(decrements) {
	// decrements: Array<{ productId, qty }>
	await Promise.allSettled(
		(decrements || []).map(d =>
			Product.updateOne({ _id: d.productId }, { $inc: { stockQuantity: d.qty } })
		)
	)
}

// POST /api/orders/buy -> Single product purchase (independent of cart)
// Body: { productId, quantity } or Query: ?pid=<id>
router.post('/buy', authCid, async (req, res) => {
	try {
		// Unified raw quantity extraction (body preferred, then query)
		const rawQty = req.body?.quantity ?? req.query?.quantity;
		const productId = pickProductId(req);
		// TEMP DEBUG LOGGING (can be removed once issue resolved)
		console.log('[orders/buy] incoming body.quantity=', req.body?.quantity, 'query.quantity=', req.query?.quantity, 'resolved rawQty=', rawQty, 'productId=', productId, 'cid=', req.user?.cid);
		if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
			return res.status(400).json({ error: 'Invalid productId' });
		}
		const qty = Math.floor(Number(rawQty));
		if (!Number.isFinite(qty) || qty < 1 || qty > 999) {
			return res.status(400).json({ error: 'Invalid or missing quantity' });
		}
		console.log('[orders/buy] parsed qty=', qty);

		// Fetch product first for pricing snapshot & manual stock validation (helpful for clearer errors)
		const product = await Product.findById(productId)
		if (!product) return res.status(404).json({ error: 'Product not found' })
		if (!(product.stockQuantity >= qty)) {
			return res.status(409).json({ error: 'Insufficient stock', available: product.stockQuantity })
		}

		// Atomic decrement to guard against concurrent orders
		const updated = await tryDecrementStock(product._id, qty)
		if (!updated) {
			return res.status(409).json({ error: 'Insufficient stock (race)', available: product.stockQuantity })
		}
		const userSnapshot = await buildUserSnapshot(req.user.cid)
		const deliveryAddress = await buildDeliveryAddressSnapshot(req.user.cid, req.body.deliveryAddress)

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

		let orderDoc
		try {
			// Extract base64 image data from the product
			let productImageBase64 = '';
			if (product.productImageData && product.productImageData.length) {
				try {
					productImageBase64 = Buffer.from(product.productImageData).toString('base64');
				} catch (e) {
					console.warn('Failed to extract base64 from product image:', e);
				}
			}

			orderDoc = await Order.create({
				userCid: userSnapshot.cid,
				userSnapshot,
				deliveryAddress,
				product: {
					productId: product._id,
					productName: product.productName,
					price: product.price,
					unit: product.unit,
					sellerCid: product.createdBy,
					productImageBase64: productImageBase64,
				},
				quantity: qty,
				totalPrice: Number((product.price * qty).toFixed(2)),
				qrCodeDataUrl,
				source: 'buy',
				status: 'order placed',
			})
		} catch (createErr) {
			// Rollback decrement on failure creating order
			await rollbackStock([{ productId: product._id, qty }])
			throw createErr
		}

		return res.status(201).json({
			success: true,
			order: toOrderJson(orderDoc),
			remainingStock: updated.stockQuantity,
		})
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
		const deliveryAddress = await buildDeliveryAddressSnapshot(userCid, req.body.deliveryAddress)

		// Filter valid items and pre-check stock locally
		const items = cart.items
			.map(i => ({ ...i.toObject?.() || i, product: productMap.get(String(i.productId)) || null }))
			.filter(x => x.product)

		if (!items.length) return res.status(400).json({ error: 'No valid items to order' })

		const insufficient = items
			.map(i => ({ productId: String(i.product._id), name: i.product.productName, requested: Math.floor(Number(i.quantity || 1)), available: i.product.stockQuantity }))
			.filter(it => it.requested < 1 || it.requested > 999 || it.available < it.requested)

		if (insufficient.length) {
			return res.status(409).json({ error: 'Insufficient stock for some items', details: insufficient })
		}

		// Attempt atomic decrements for each item; rollback all if any fail
		const decremented = []
		for (const it of items) {
			const qty = Math.floor(Number(it.quantity || 1))
			// eslint-disable-next-line no-await-in-loop
			const updated = await tryDecrementStock(it.product._id, qty)
			if (!updated) {
				// rollback previous and abort
				await rollbackStock(decremented.map(d => ({ productId: d.productId, qty: d.qty })))
				return res.status(409).json({ error: 'Insufficient stock due to concurrent updates', productId: String(it.product._id) })
			}
			decremented.push({ productId: it.product._id, qty })
		}

		// Build orders payload after successful decrements
		const ordersToCreate = []
		for (const it of items) {
			const p = it.product
			const qty = Math.floor(Number(it.quantity || 1))
			
			// Extract base64 image data from the product
			let productImageBase64 = '';
			if (p.productImageData && p.productImageData.length) {
				try {
					productImageBase64 = Buffer.from(p.productImageData).toString('base64');
				} catch (e) {
					console.warn('Failed to extract base64 from product image:', e);
				}
			}
			
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
				deliveryAddress,
				product: {
					productId: p._id,
					productName: p.productName,
					price: p.price,
					unit: p.unit,
					sellerCid: p.createdBy,
					productImageBase64: productImageBase64,
				},
				quantity: qty,
				totalPrice: Number((p.price * qty).toFixed(2)),
				qrCodeDataUrl,
				source: 'cart',
				status: 'order placed',
			})
		}

		let created
		try {
			created = await Order.insertMany(ordersToCreate)
		} catch (insertErr) {
			// rollback stock if order creation fails
			await rollbackStock(decremented)
			throw insertErr
		}

		// On successful checkout, clear the user's cart
		try {
			await Cart.updateOne({ userCid }, { $set: { items: [] } })
		} catch (e) {
			// Non-fatal; orders already created
			console.warn('Failed to clear cart after checkout:', e)
		}

		// Attach remaining stock information for each product (query fresh)
		const remainingMap = new Map()
		try {
			const refreshed = await Product.find({ _id: { $in: decremented.map(d => d.productId) } }).select('_id stockQuantity')
			refreshed.forEach(p => remainingMap.set(String(p._id), p.stockQuantity))
		} catch (e) { /* non-fatal */ }
		return res.status(201).json({
			success: true,
			cartCleared: true,
			orders: created.map(o => ({ ...toOrderJson(o), remainingStock: remainingMap.get(String(o.product.productId)) ?? null })),
		})
	} catch (err) {
		console.error('Cart checkout error:', err)
		return res.status(500).json({ error: 'Failed to checkout cart' })
	}
})

// POST /api/orders/checkout -> Unified checkout for explicit product list
// Body: { products: [ { productId, quantity } ], totalPrice? }
router.post('/checkout', authCid, async (req, res) => {
	try {
		const userCid = req.user.cid
		const body = req.body || {}
		const list = Array.isArray(body.products) ? body.products : []
		console.log('[orders/checkout] incoming products raw=', JSON.stringify(list))
		if (!list.length) return res.status(400).json({ error: 'No products provided' })

		// Normalize & validate inputs
		const normalized = []
		for (const raw of list) {
			if (!raw || !raw.productId) continue
			const pid = String(raw.productId).match(/[a-fA-F0-9]{24}/)?.[0]
			if (!pid) return res.status(400).json({ error: 'Invalid productId in list' })
			let qty = Math.floor(Number(raw.quantity));
			if (!Number.isFinite(qty) || qty < 1 || qty > 999) {
				// Fallback for items coming from cart where quantity might be nested
				const nestedQty = raw?.item?.quantity;
				qty = Math.floor(Number(nestedQty));
				if (!Number.isFinite(qty) || qty < 1 || qty > 999) {
					return res.status(400).json({ error: `Invalid quantity for product ${pid}` });
				}
			}
			console.log('[orders/checkout] normalized item', { productId: pid, quantity: qty })
			normalized.push({ productId: pid, quantity: qty })
		}
		if (!normalized.length) return res.status(400).json({ error: 'No valid products' })

		// Fetch all products
		const products = await Product.find({ _id: { $in: normalized.map(n => n.productId) } })
		const pMap = new Map(products.map(p => [String(p._id), p]))

		// Pre-check stock
		const insufficient = []
		for (const n of normalized) {
			const p = pMap.get(n.productId)
			if (!p || p.stockQuantity < n.quantity) {
				insufficient.push({ productId: n.productId, requested: n.quantity, available: p ? p.stockQuantity : 0 })
			}
		}
		if (insufficient.length) return res.status(409).json({ error: 'Insufficient stock', details: insufficient })

		// Atomic decrements sequentially; rollback if any failure (rare after pre-check)
		const decremented = []
		for (const n of normalized) {
			// eslint-disable-next-line no-await-in-loop
			const updated = await tryDecrementStock(n.productId, n.quantity)
			if (!updated) {
				await rollbackStock(decremented.map(d => ({ productId: d.productId, qty: d.qty })))
				return res.status(409).json({ error: 'Insufficient stock (race)', productId: n.productId })
			}
			decremented.push({ productId: n.productId, qty: n.quantity })
		}

		const userSnapshot = await buildUserSnapshot(userCid)
		const deliveryAddress = await buildDeliveryAddressSnapshot(userCid, body.deliveryAddress)
		const ordersPayload = []
		for (const n of normalized) {
			const p = pMap.get(n.productId)
			
			// Extract base64 image data from the product
			let productImageBase64 = '';
			if (p.productImageData && p.productImageData.length) {
				try {
					productImageBase64 = Buffer.from(p.productImageData).toString('base64');
				} catch (e) {
					console.warn('Failed to extract base64 from product image:', e);
				}
			}
			
			const qrPayload = { type: 'order', mode: 'batch', buyerCid: userSnapshot.cid, productId: n.productId, productName: p.productName, qty: n.quantity, ts: Date.now() }
			// eslint-disable-next-line no-await-in-loop
			const qrCodeDataUrl = await generateQrDataUrl(qrPayload)
			ordersPayload.push({
				userCid,
				userSnapshot,
				deliveryAddress,
				product: {
					productId: p._id,
					productName: p.productName,
					price: p.price,
					unit: p.unit,
					sellerCid: p.createdBy,
					productImageBase64: productImageBase64,
				},
				quantity: n.quantity,
				totalPrice: Number((p.price * n.quantity).toFixed(2)),
				qrCodeDataUrl,
				source: 'cart', // treat as cart-style batch
				status: 'order placed',
			})
		}

		let created
		try { created = await Order.insertMany(ordersPayload) } catch (e) {
			await rollbackStock(decremented)
			throw e
		}

		// Compute remaining stock map
		const refreshed = await Product.find({ _id: { $in: normalized.map(n => n.productId) } }).select('_id stockQuantity')
		const rMap = new Map(refreshed.map(r => [String(r._id), r.stockQuantity]))

		return res.status(201).json({
			success: true,
			orders: created.map(o => ({ ...toOrderJson(o), remainingStock: rMap.get(String(o.product.productId)) ?? null })),
		})
	} catch (err) {
		console.error('Unified checkout error:', err)
		return res.status(500).json({ error: 'Failed to checkout' })
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

		// Only consider orders that could require transport (shipped orders ready for pickup)
		const candidateOrders = await Order.find({ status: { $in: ['shipped', 'pending', 'paid'] } }).sort({ createdAt: -1 })

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
			qrCodeDataUrl: o.qrCodeDataUrl, // Include QR code for downloading
			product: {
				productId: String(o.product.productId),
				name: o.product.productName,
				unit: o.product.unit,
				price: o.product.price,
				productImageBase64: o.product.productImageBase64 || '',
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
				productImageBase64: o.product.productImageBase64 || '',
			},
			seller: (() => {
				const s = sMap.get(o.product?.sellerCid)
				return s ? { cid: s.cid, name: s.name, location: s.location, phoneNumber: s.phoneNumber } : { cid: o.product?.sellerCid || '' }
			})(),
			// include transporter snapshot if present so the client can render it when OUT_FOR_DELIVERY
			transporter: o.transporter ? {
				cid: o.transporter.cid,
				name: o.transporter.name,
				phoneNumber: o.transporter.phoneNumber,
			} : null,
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
		if (order.status !== 'order placed' && order.status !== 'pending') return res.status(409).json({ error: 'Only placed orders can be cancelled' })
		order.status = 'cancelled'
		await order.save()
		// Restock the product since the order is cancelled before fulfillment
		if (order?.product?.productId && order.quantity > 0) {
			try {
				await Product.updateOne({ _id: order.product.productId }, { $inc: { stockQuantity: Number(order.quantity) } })
			} catch (e) {
				console.warn('Failed to restock after cancel:', e)
			}
		}
		res.json({ success: true, order: { orderId: String(order._id), status: order.status } })
	} catch (err) {
		console.error('Cancel order error:', err)
		res.status(500).json({ error: 'Failed to cancel order' })
	}
})

// PATCH /api/orders/:orderId/shipped -> mark order as shipped (seller only)
router.patch('/:orderId/shipped', authCid, async (req, res) => {
	try {
		const { orderId } = req.params
		if (!mongoose.Types.ObjectId.isValid(String(orderId))) return res.status(400).json({ error: 'Invalid order id' })
		
		const sellerCid = req.user.cid
		const order = await Order.findById(orderId)
		if (!order) return res.status(404).json({ error: 'Order not found' })
		
		// Verify this is the seller's product
		if (String(order.product.sellerCid) !== String(sellerCid)) {
			return res.status(403).json({ error: 'Not your product order' })
		}
		
		// Only allow shipping confirmed orders (or pending for backward compatibility)
		if (order.status !== 'order confirmed' && order.status !== 'pending') {
			return res.status(409).json({ error: `Cannot ship order with status: ${order.status}` })
		}
		
		// Update status to shipped
		order.status = 'shipped'
		await order.save()
		
		// Return the existing QR code from the database
		res.json({ 
			success: true, 
			order: { 
				orderId: String(order._id), 
				status: order.status 
			},
			qrCode: order.qrCodeDataUrl // Use existing QR code from database
		})
	} catch (err) {
		console.error('Mark shipped error:', err)
		res.status(500).json({ error: 'Failed to mark as shipped' })
	}
})

// PATCH /api/orders/:orderId/confirm -> mark order as confirmed (farmer/tshogpas accept order)
router.patch('/:orderId/confirm', authCid, async (req, res) => {
	try {
		const { orderId } = req.params
		if (!mongoose.Types.ObjectId.isValid(String(orderId))) return res.status(400).json({ error: 'Invalid order id' })
		
		const sellerCid = req.user.cid
		const order = await Order.findById(orderId)
		if (!order) return res.status(404).json({ error: 'Order not found' })
		
		// Verify this is the seller's product
		if (String(order.product.sellerCid) !== String(sellerCid)) {
			return res.status(403).json({ error: 'Not your product order' })
		}
		
		// Only allow confirming orders that are placed
		if (order.status !== 'order placed') {
			return res.status(409).json({ error: `Cannot confirm order with status: ${order.status}` })
		}
		
		// Update status to confirmed
		order.status = 'order confirmed'
		await order.save()
		
		res.json({ 
			success: true, 
			order: { 
				orderId: String(order._id), 
				status: order.status 
			}
		})
	} catch (err) {
		console.error('Mark confirmed error:', err)
		res.status(500).json({ error: 'Failed to mark as confirmed' })
	}
})

// GET /api/orders/:orderId/download-image -> Download order details as PNG image (seller only)
router.get('/:orderId/download-image', authCid, async (req, res) => {
	try {
		const { orderId } = req.params
		const { format } = req.query // ?format=base64 for mobile app
		
		console.log('[Image Download] Request received:', { 
			orderId, 
			format, 
			sellerCid: req.user.cid 
		});
		
		if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
			console.log('[Image Download] Invalid order ID:', orderId);
			return res.status(400).json({ error: 'Invalid order id' })
		}
		
		const sellerCid = req.user.cid
		const order = await Order.findById(orderId)
		
		console.log('[Image Download] Order found:', !!order);
		if (!order) {
			console.log('[Image Download] Order not found for ID:', orderId);
			return res.status(404).json({ error: 'Order not found' })
		}
		
		// Verify this is the seller's product
		if (String(order.product.sellerCid) !== String(sellerCid)) {
			console.log('[Image Download] Access denied. Order seller:', order.product.sellerCid, 'Request from:', sellerCid);
			return res.status(403).json({ error: 'Not your product order' })
		}
		
		console.log('[Image Download] Access verified. Preparing order data...');
		
		// Prepare order data for image generation
		const orderData = {
			orderId: String(order._id),
			buyerName: order.userSnapshot?.name || 'N/A',
			buyerPhone: order.userSnapshot?.phoneNumber || 'N/A',
			deliveryAddress: {
				place: order.deliveryAddress?.place || 'Not specified',
				dzongkhag: order.deliveryAddress?.dzongkhag || 'Not specified'
			},
			qrCode: order.qrCodeDataUrl
		}
		
		console.log('[Image Download] Order data prepared:', {
			orderId: orderData.orderId,
			buyerName: orderData.buyerName,
			hasDeliveryAddress: !!order.deliveryAddress,
			hasQrCode: !!orderData.qrCode
		});
		
		// Generate PNG image
		console.log('[Image Download] Starting image generation...');
		const imageBuffer = await generateOrderImage(orderData)
		console.log('[Image Download] Image generated successfully. Size:', imageBuffer.length, 'bytes');
		
		if (format === 'base64') {
			// Return base64 encoded PNG for mobile app
			const base64Image = imageBuffer.toString('base64')
			console.log('[Image Download] Returning base64 PNG. Length:', base64Image.length);
			return res.json({
				success: true,
				data: base64Image,
				filename: `DrukFarm_Order_${orderId.slice(-6)}_${Date.now()}.png`
			})
		} else {
			// Return PNG file directly for web browsers
			const filename = `DrukFarm_Order_${orderId.slice(-6)}_${Date.now()}.png`
			console.log('[Image Download] Returning binary PNG:', filename);
			res.setHeader('Content-Type', 'image/png')
			res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
			res.setHeader('Content-Length', imageBuffer.length)
			res.send(imageBuffer)
		}
		
	} catch (err) {
		console.error('[Image Download] Error:', err);
		console.error('[Image Download] Error details:', {
			name: err.name,
			message: err.message,
			stack: err.stack
		});
		res.status(500).json({ error: 'Failed to generate order image' })
	}
})

// GET /api/orders/shipped -> All orders with status 'shipped' (for transporter dashboard)
router.get('/shipped', authCid, async (req, res) => {
	try {
		// Fetch ONLY orders with status 'shipped' from MongoDB
		const shippedOrders = await Order.find({ 
			status: 'shipped' 
		}).sort({ createdAt: -1 })
		
		// Get user details for sellers and buyers
		const sellerCids = [...new Set(shippedOrders.map(o => o?.product?.sellerCid).filter(Boolean))]
		const buyerCids = [...new Set(shippedOrders.map(o => o?.userSnapshot?.cid).filter(Boolean))]
		const allCids = [...new Set([...sellerCids, ...buyerCids])]
		
		const users = await User.find({ cid: { $in: allCids } }).select('cid name phoneNumber location dzongkhag')
		const userMap = new Map(users.map(u => [u.cid, u]))
		
		const orders = shippedOrders.map(order => {
			const seller = userMap.get(order?.product?.sellerCid)
			const buyer = userMap.get(order?.userSnapshot?.cid)
			
			return {
				orderId: String(order._id),
				orderNumber: String(order._id).slice(-6),
				status: order.status,
				customerName: order.userSnapshot?.name || buyer?.name || 'Unknown',
				customerPhone: order.userSnapshot?.phoneNumber || buyer?.phoneNumber || '',
				customerCid: order.userSnapshot?.cid || '',
				pickupLocation: seller?.location || 'Unknown',
				deliveryLocation: order.deliveryAddress?.place || buyer?.location || 'Unknown',
				deliveryAddress: {
					title: order.deliveryAddress?.title || 'Default Address',
					place: order.deliveryAddress?.place || buyer?.location || 'Unknown',
					dzongkhag: order.deliveryAddress?.dzongkhag || buyer?.dzongkhag || 'Unknown'
				},
				totalAmount: order.totalPrice || 0,
				quantity: order.quantity || 0,
				transportFee: calculateTransportFee(order.totalPrice),
				createdAt: order.createdAt,
				updatedAt: order.updatedAt,
				product: {
					productId: String(order.product?.productId || ''),
					name: order.product?.productName || 'Unknown Product',
					price: order.product?.price || 0,
					unit: order.product?.unit || 'piece',
					sellerCid: order.product?.sellerCid || '',
					image: order.product?.productImageBase64 || ''
				},
				seller: {
					cid: order.product?.sellerCid || '',
					name: seller?.name || '',
					phoneNumber: seller?.phoneNumber || '',
					location: seller?.location || ''
				},
				qrCode: order.qrCodeDataUrl || '',
				source: order.source || 'buy'
			}
		})
		
		res.json({ 
			success: true, 
			orders,
			count: orders.length,
			message: `Found ${orders.length} shipped orders`
		})
	} catch (err) {
		console.error('Fetch shipped orders error:', err)
		res.status(500).json({ error: 'Failed to fetch shipped orders' })
	}
})

// GET /api/orders/transporter -> Orders available/assigned to transporters
router.get('/transporter', authCid, async (req, res) => {
	try {
		const transporterId = req.headers['x-transporter-id'] || req.user.cid
		
		// Fetch orders that are available for transport or assigned to this transporter
		const availableOrders = await Order.find({ 
			status: { $in: ['shipped', 'out for delivery', 'OUT_FOR_DELIVERY', 'delivered'] }, 
			$or: [
				{ transporter: { $exists: false } }, // Available orders
				{ 'transporter.cid': transporterId } // Orders assigned to this transporter
			]
		}).sort({ createdAt: -1 })
		
		// Get user details for sellers and buyers
		const sellerCids = [...new Set(availableOrders.map(o => o?.product?.sellerCid).filter(Boolean))]
		const buyerCids = [...new Set(availableOrders.map(o => o?.userSnapshot?.cid).filter(Boolean))]
		const allCids = [...new Set([...sellerCids, ...buyerCids])]
		
		const users = await User.find({ cid: { $in: allCids } }).select('cid name phoneNumber location dzongkhag')
		const userMap = new Map(users.map(u => [u.cid, u]))
		
		const orders = availableOrders.map(order => {
			const seller = userMap.get(order?.product?.sellerCid)
			const buyer = userMap.get(order?.userSnapshot?.cid)
			
			return {
				id: String(order._id),
				orderNumber: String(order._id).slice(-6),
				status: getTransporterStatus(order.status, order.transporter, transporterId),
				customerName: order.userSnapshot?.name || buyer?.name || 'Unknown',
				pickupLocation: seller?.location || 'Unknown',
				deliveryLocation: order.deliveryAddress?.place || buyer?.location || 'Unknown',
				totalAmount: order.totalPrice || 0,
				transportFee: calculateTransportFee(order.totalPrice), // Helper function to calculate transport fee
				transporterId: order.transporter?.cid || null,
				createdAt: order.createdAt,
				product: {
					name: order.product?.productName || 'Unknown Product',
					quantity: order.quantity || 0,
					unit: order.product?.unit || 'piece'
				}
			}
		})
		
		res.json({ success: true, orders })
	} catch (err) {
		console.error('Fetch transporter orders error:', err)
		res.status(500).json({ error: 'Failed to fetch transporter orders' })
	}
})

// PATCH /api/orders/:orderId/status -> Update order status (transporter actions)
router.patch('/:orderId/status', authCid, async (req, res) => {
	try {
		const { orderId } = req.params
		const { status } = req.body
		
		if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
			return res.status(400).json({ error: 'Invalid order id' })
		}
		
		const transporterCid = req.user.cid
		const order = await Order.findById(orderId)
		
		if (!order) {
			return res.status(404).json({ error: 'Order not found' })
		}
		
		// Verify user is a transporter
		const transporter = await User.findOne({ cid: transporterCid }).select('role name phoneNumber')
		if (!transporter || transporter.role?.toLowerCase() !== 'transporter') {
			return res.status(403).json({ error: 'Only transporters can update order status' })
		}
		
		// Handle different status updates
		switch (status) {
			case 'accept':
				if (order.status !== 'shipped') {
					return res.status(409).json({ error: 'Order cannot be accepted in current status' })
				}
				order.status = 'OUT_FOR_DELIVERY'
				order.transporter = {
					cid: transporterCid,
					name: transporter.name || '',
					phoneNumber: transporter.phoneNumber || ''
				}
				break
				
			case 'pickup':
				if (order.status !== 'OUT_FOR_DELIVERY' || order.transporter?.cid !== transporterCid) {
					return res.status(409).json({ error: 'Cannot mark as picked up' })
				}
				order.status = 'PICKED_UP'
				break
				
			case 'deliver':
				if (order.status !== 'PICKED_UP' || order.transporter?.cid !== transporterCid) {
					return res.status(409).json({ error: 'Cannot mark as delivered' })
				}
				order.status = 'delivered'
				break
				
			default:
				return res.status(400).json({ error: 'Invalid status action' })
		}
		
		await order.save()
		
		res.json({ 
			success: true, 
			order: { 
				orderId: String(order._id), 
				status: order.status,
				transporter: order.transporter 
			} 
		})
	} catch (err) {
		console.error('Update order status error:', err)
		res.status(500).json({ error: 'Failed to update order status' })
	}
})

// Helper function to determine transporter-specific status
function getTransporterStatus(orderStatus, transporter, transporterId) {
	if (!transporter) {
		// Orders without transporter assignment - available for pickup
		switch (orderStatus) {
			case 'shipped':
				return 'Shipped' // Ready for transport
			case 'order confirmed':
				return 'Confirmed' // Not yet shipped
			case 'order placed':
				return 'Placed' // Not yet confirmed
			case 'paid':
				return 'Paid' // Ready for transport
			case 'pending':
				return 'Pending' // Legacy status
			default:
				return 'Available'
		}
	}
	
	if (transporter.cid === transporterId) {
		switch (orderStatus) {
			case 'shipped':
				return 'Shipped' // Show as shipped for assigned transporter too
			case 'out for delivery':
			case 'OUT_FOR_DELIVERY':
				return 'Accepted'
			case 'PICKED_UP':
				return 'PickedUp'
			case 'delivered':
				return 'Delivered'
			default:
				return orderStatus
		}
	}
	
	return 'Assigned' // Assigned to another transporter
}

// GET /api/orders/tshogpas -> Orders confirmed and ready for Tshogpas to ship
router.get('/tshogpas', authCid, async (req, res) => {
	try {
		// Fetch orders with 'order confirmed' status - ready for Tshogpas to handle
		const docs = await Order.find({ status: 'order confirmed' }).sort({ createdAt: -1 })
		const mapped = docs.map(o => ({
			orderId: String(o._id),
			status: o.status,
			createdAt: o.createdAt,
			totalPrice: o.totalPrice,
			quantity: o.quantity,
			qrCodeDataUrl: o.qrCodeDataUrl,
			product: {
				productId: String(o.product.productId),
				name: o.product.productName,
				unit: o.product.unit,
				price: o.product.price,
				sellerCid: o.product.sellerCid,
				productImageBase64: o.product.productImageBase64 || '',
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
		console.error('Fetch tshogpas orders error:', err)
		res.status(500).json({ error: 'Failed to fetch confirmed orders' })
	}
})

// Helper function to calculate transport fee
function calculateTransportFee(totalAmount) {
	// Simple calculation: 10% of order value with minimum 20 and maximum 200
	const fee = Math.max(20, Math.min(200, totalAmount * 0.1))
	return Math.round(fee * 100) / 100 // Round to 2 decimal places
}

module.exports = router