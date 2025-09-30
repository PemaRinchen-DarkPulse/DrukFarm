const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');
const { UserDispatchAddress } = require('../models/UserDispatchAddress');
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
	// Ensure quantity is a positive integer
	const quantity = Math.floor(Number(qty))
	if (!Number.isFinite(quantity) || quantity < 1) {
		throw new Error('Invalid quantity for stock decrement')
	}
	
	return Product.findOneAndUpdate(
		{ _id: productId, stockQuantity: { $gte: quantity } },
		{ $inc: { stockQuantity: -quantity } },
		{ new: true }
	)
}

// Best-effort rollback for stock decrements (used on failures after decrement)
async function rollbackStock(decrements) {
	// decrements: Array<{ productId, qty }>
	if (!Array.isArray(decrements) || decrements.length === 0) return
	
	await Promise.allSettled(
		decrements.map(async d => {
			const quantity = Math.floor(Number(d.qty))
			if (!Number.isFinite(quantity) || quantity < 1) return Promise.resolve()
			
			const result = await Product.updateOne(
				{ _id: d.productId }, 
				{ $inc: { stockQuantity: quantity } }
			)
			
			// Log rollback for debugging
			if (result.modifiedCount > 0) {
				console.log(`[Stock Rollback] Product ID: ${d.productId}, Restored: ${quantity}`)
			}
			
			return result
		})
	)
}

// Validate product availability and stock for ordering
async function validateProductForOrder(productId, requestedQty) {
	const product = await Product.findById(productId)
	if (!product) {
		return { valid: false, error: 'Product not found', code: 404 }
	}
	
	if (product.price <= 0) {
		return { valid: false, error: 'Product is not available for purchase', code: 400 }
	}
	
	if (product.stockQuantity < requestedQty) {
		return { 
			valid: false, 
			error: 'Insufficient stock', 
			code: 409,
			details: {
				requested: requestedQty,
				available: product.stockQuantity,
				productName: product.productName
			}
		}
	}
	
	return { valid: true, product }
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

		// Validate product availability and stock
		const validation = await validateProductForOrder(productId, qty)
		if (!validation.valid) {
			return res.status(validation.code).json({ 
				error: validation.error, 
				...validation.details 
			})
		}
		const product = validation.product

		// Atomic decrement to guard against concurrent orders
		const updated = await tryDecrementStock(product._id, qty)
		if (!updated) {
			// Re-fetch current stock for accurate reporting
			const currentProduct = await Product.findById(productId).select('stockQuantity')
			console.log(`[Stock Deduction Failed] Product: ${product.productName}, Requested: ${qty}, Available: ${currentProduct?.stockQuantity || 0}`)
			return res.status(409).json({ 
				error: 'Insufficient stock due to concurrent orders', 
				requested: qty,
				available: currentProduct?.stockQuantity || 0,
				productName: product.productName 
			})
		}
		
		// Log successful stock deduction
		console.log(`[Stock Deducted] Product: ${product.productName}, Quantity: ${qty}, Remaining: ${updated.stockQuantity}`)
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

		// Verify stock integrity (optional but good for monitoring)
		if (updated.stockQuantity < 0) {
			console.error(`[Stock Integrity Error] Product ${product.productName} has negative stock: ${updated.stockQuantity}`)
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
		const items = cart.itemsInFarmer
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
			
			// Log successful order creation with stock deduction details
			console.log(`[Orders Created] ${created.length} orders created from cart checkout for user: ${userCid}`)
		} catch (insertErr) {
			// rollback stock if order creation fails
			console.error('[Order Creation Failed] Rolling back stock decrements:', insertErr)
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
		try { 
			created = await Order.insertMany(ordersPayload)
			
			// Log successful order creation with stock deduction details
			console.log(`[Orders Created] ${created.length} orders created from unified checkout for user: ${userCid}`)
		} catch (e) {
			// rollback stock if order creation fails
			console.error('[Order Creation Failed] Rolling back stock decrements:', e)
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

		order.status = 'Out for Delivery'  // Use correct enum value
		order.transporter = transporter
		
		// Add to status history
		order.statusHistory.push({
			status: 'Out for Delivery',
			changedBy: {
				cid: me.cid,
				role: me.role || 'transporter',
				name: me.name || ''
			},
			timestamp: new Date(),
			notes: 'Order accepted by transporter and set for delivery'
		})
		
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
		// Get seller info for the current seller (since they're viewing their own orders)
		const sellerInfo = await User.findOne({ cid: sellerCid }).select('cid name phoneNumber location')
		
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
				sellerCid: o.product.sellerCid, // Include sellerCid for reference
			},
			buyer: {
				cid: o.userSnapshot?.cid,
				name: o.userSnapshot?.name,
				location: o.userSnapshot?.location,
				phoneNumber: o.userSnapshot?.phoneNumber,
			},
			// Include seller information (the current user viewing the orders)
			seller: sellerInfo ? {
				cid: sellerInfo.cid,
				name: sellerInfo.name,
				phoneNumber: sellerInfo.phoneNumber,
				location: sellerInfo.location,
			} : { cid: sellerCid },
			// Include delivery address if it exists
			deliveryAddress: o.deliveryAddress ? {
				title: o.deliveryAddress.title,
				place: o.deliveryAddress.place,
				dzongkhag: o.deliveryAddress.dzongkhag,
			} : null,
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
		
		// Get user information for status history
		const sellerUser = await User.findOne({ cid: sellerCid }).select('name role')
		
		// Update status to shipped
		order.status = 'shipped'
		
		// Add status history entry
		order.statusHistory.push({
			status: 'shipped',
			changedBy: {
				cid: sellerCid,
				role: sellerUser?.role || 'unknown',
				name: sellerUser?.name || 'Unknown User'
			},
			timestamp: new Date(),
			notes: 'Order marked as shipped by seller'
		})
		
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
		
		// Get user information for status history
		const sellerUser = await User.findOne({ cid: sellerCid }).select('name role')
		const userRole = (sellerUser?.role || '').toLowerCase()
		
		// Determine new status based on user role
		let newStatus = 'order confirmed'
		let statusNote = 'Order confirmed by seller'
		
		if (userRole === 'tshogpas') {
			// For Tshogpas, check if they have at least one dispatch address
			const dispatchAddresses = await UserDispatchAddress.find({ userCid: sellerCid })
			
			if (dispatchAddresses.length === 0) {
				return res.status(400).json({ error: 'Please add your dispatch address' })
			}
			
			// Find the default dispatch address or use the first one
			const defaultAddress = dispatchAddresses.find(addr => addr.isDefault) || dispatchAddresses[0]
			
			// Update order status to shipped and add tshogpas info
			newStatus = 'shipped'
			statusNote = 'Order confirmed and marked as shipped by Tshogpas'
			
			// Update order with tshogpas CID and dispatch address
			order.tshogpasCid = sellerCid
			order.dispatchAddress = {
				title: defaultAddress.title,
				dzongkhag: defaultAddress.dzongkhag,
				gewog: defaultAddress.gewog,
				place: defaultAddress.place
			}
		}
		
		// Update status
		order.status = newStatus
		
		// Add status history entry
		order.statusHistory.push({
			status: newStatus,
			changedBy: {
				cid: sellerCid,
				role: sellerUser?.role || 'unknown',
				name: sellerUser?.name || 'Unknown User'
			},
			timestamp: new Date(),
			notes: statusNote
		})
		
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
			status: { $in: ['shipped', 'Out for Delivery', 'delivered'] }, 
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
				orderId: String(order._id), // Add orderId for consistency
				orderNumber: String(order._id).slice(-6),
				status: getTransporterStatus(order.status, order.transporter, transporterId),
				customerName: order.userSnapshot?.name || buyer?.name || 'Unknown',
				pickupLocation: seller?.location || 'Unknown',
				deliveryLocation: order.deliveryAddress?.place || buyer?.location || 'Unknown',
				totalAmount: order.totalPrice || 0,
				transportFee: calculateTransportFee(order.totalPrice), // Helper function to calculate transport fee
				transporterId: order.transporter?.cid || null,
				transporter: order.transporter || null, // Add full transporter object
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
		
		const userCid = req.user.cid
		const order = await Order.findById(orderId)
		
		if (!order) {
			return res.status(404).json({ error: 'Order not found' })
		}
		
		// Get user details
		const user = await User.findOne({ cid: userCid }).select('role name phoneNumber')
		if (!user) {
			return res.status(403).json({ error: 'User not found' })
		}
		
		const userRole = user.role?.toLowerCase()
		
		// Handle different status updates based on role and requirements
		if (userRole === 'transporter') {
			// Original transporter logic
			switch (status) {
				case 'accept':
					if (order.status !== 'shipped') {
						return res.status(409).json({ error: 'Order cannot be accepted in current status' })
					}
					order.status = 'Out for Delivery'
					order.transporter = {
						cid: userCid,
						name: user.name || '',
						phoneNumber: user.phoneNumber || ''
					}
					break
					
				case 'deliver':
				case 'delivered':
					if (!['Out for Delivery', 'delivered'].includes(order.status) || order.transporter?.cid !== userCid) {
						return res.status(409).json({ error: 'Cannot mark as delivered' })
					}
					order.status = 'delivered'
					break
					
				default:
					return res.status(400).json({ error: 'Invalid status action for transporter' })
			}
		} else {
			// General status updates for QR scanning and other purposes
			const allowedStatuses = ['delivered', 'shipped', 'Out for Delivery', 'order confirmed', 'cancelled']
			
			if (!allowedStatuses.includes(status)) {
				return res.status(400).json({ error: 'Invalid status' })
			}
			
			// Verify user has permission to update this order
			const hasPermission = (
				order.userCid === userCid || // Order owner
				order.product?.sellerCid === userCid || // Product seller
				order.tshogpasCid === userCid || // Assigned tshogpas
				order.transporter?.cid === userCid || // Assigned transporter
				userRole === 'tshogpas' // Tshogpas can update any order
			)
			
			if (!hasPermission) {
				return res.status(403).json({ error: 'Permission denied to update this order' })
			}
			
			order.status = status
		}
		
		// Add to status history
		order.statusHistory.push({
			status: order.status,
			changedBy: {
				cid: userCid,
				role: userRole,
				name: user.name || ''
			},
			timestamp: new Date(),
			notes: `Status updated via ${userRole === 'transporter' ? 'transport system' : 'QR scan'}`
		})
		
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
			case 'Out for Delivery':
				return 'Out for Delivery'
			case 'delivered':
				return 'Delivered'
			default:
				return orderStatus
		}
	}
	
	return 'Assigned' // Assigned to another transporter
}

// GET /api/orders/tshogpas -> Orders for Tshogpas to manage (placed, confirmed)
router.get('/tshogpas', authCid, async (req, res) => {
	try {
		const tshogpasCid = req.user.cid
		
		// Fetch orders in two categories:
		// 1. Orders for products created by this Tshogpas user (for selling their own products)
		// 2. Orders that this Tshogpas has shipped (for dispatch tracking)
		const [ownProductOrders, dispatchedOrders] = await Promise.all([
			// Orders for products they created/sell
			Order.find({ 
				'product.sellerCid': tshogpasCid
			}).sort({ createdAt: -1 }),
			
			// Orders they have dispatched (shipped)
			Order.find({ 
				tshogpasCid: tshogpasCid
			}).sort({ createdAt: -1 })
		]);
		
		// Combine and deduplicate orders (some orders might appear in both queries)
		const allOrdersMap = new Map();
		
		// Add own product orders
		ownProductOrders.forEach(o => {
			allOrdersMap.set(String(o._id), o);
		});
		
		// Add dispatched orders (this will overwrite if same order exists)
		dispatchedOrders.forEach(o => {
			allOrdersMap.set(String(o._id), o);
		});
		
		// Convert map back to array and sort by creation date
		const docs = Array.from(allOrdersMap.values()).sort((a, b) => 
			new Date(b.createdAt) - new Date(a.createdAt)
		);
		
		console.log(`Tshogpas ${tshogpasCid} orders:`, {
			ownProducts: ownProductOrders.length,
			dispatched: dispatchedOrders.length,
			total: docs.length
		});
		
		// Get seller names for all unique seller CIDs
		const sellerCids = [...new Set(docs.map(o => o.product.sellerCid).filter(Boolean))];
		const sellers = await User.find({ cid: { $in: sellerCids } }).select('cid name');
		const sellerMap = sellers.reduce((acc, seller) => {
			acc[seller.cid] = seller.name;
			return acc;
		}, {});

		const mapped = docs.map(o => ({
			orderId: String(o._id),
			status: o.status,
			createdAt: o.createdAt,
			totalPrice: o.totalPrice,
			quantity: o.quantity,
			qrCodeDataUrl: o.qrCodeDataUrl,
			tshogpasCid: o.tshogpasCid, // Include this field to track who shipped it
			product: {
				productId: String(o.product.productId),
				name: o.product.productName,
				unit: o.product.unit,
				price: o.product.price,
				sellerCid: o.product.sellerCid,
				sellerName: sellerMap[o.product.sellerCid] || 'Unknown Seller',
				productImageBase64: o.product.productImageBase64 || '',
			},
			buyer: {
				cid: o.userSnapshot?.cid,
				name: o.userSnapshot?.name,
				location: o.userSnapshot?.location,
				phoneNumber: o.userSnapshot?.phoneNumber,
			},
			// Map buyer location to deliveryAddress for frontend compatibility
			deliveryAddress: o.userSnapshot?.location,
		}))
		res.json({ success: true, orders: mapped })
	} catch (err) {
		console.error('Fetch tshogpas orders error:', err)
		res.status(500).json({ error: 'Failed to fetch tshogpas orders' })
	}
})

// Helper function to calculate transport fee
// GET /orders/:orderId - Fetch a single order by ID
router.get('/:orderId', authCid, async (req, res) => {
	try {
		const { orderId } = req.params
		const userCid = req.user.cid
		
		if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
			return res.status(400).json({ error: 'Invalid order ID' })
		}
		
		const order = await Order.findById(orderId)
		if (!order) {
			return res.status(404).json({ error: 'Order not found' })
		}
		
		// Get user role to determine access
		const user = await User.findOne({ cid: userCid }).select('role')
		const userRole = user?.role?.toLowerCase() || 'consumer'
		
		// Access control based on user role
		const hasAccess = (
			order.userCid === userCid || // Order owner
			order.product?.sellerCid === userCid || // Product seller
			order.tshogpasCid === userCid || // Assigned tshogpas
			order.transporter?.cid === userCid || // Assigned transporter
			userRole === 'tshogpas' // Any tshogpas can view orders for processing
		)
		
		if (!hasAccess) {
			return res.status(403).json({ error: 'Access denied' })
		}
		
		res.json(order)
	} catch (error) {
		console.error('Error fetching order:', error)
		res.status(500).json({ error: 'Internal server error' })
	}
})

// PATCH /orders/:orderId/tshogpas-details - Save tshogpas details when shipping order
router.patch('/:orderId/tshogpas-details', authCid, async (req, res) => {
	try {
		const { orderId } = req.params
		const { tshogpasCid, timestamp, dispatchAddress } = req.body
		const userCid = req.user.cid
		
		if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
			return res.status(400).json({ error: 'Invalid order ID' })
		}
		
		// Verify user is a tshogpas
		const user = await User.findOne({ cid: userCid }).select('role')
		if (!user || user.role?.toLowerCase() !== 'tshogpas') {
			return res.status(403).json({ error: 'Only tshogpas can update these details' })
		}
		
		const order = await Order.findById(orderId)
		if (!order) {
			return res.status(404).json({ error: 'Order not found' })
		}
		
		// Update tshogpas details
		order.tshogpasCid = tshogpasCid || userCid
		if (dispatchAddress) {
			order.dispatchAddress = {
				title: dispatchAddress.title || '',
				dzongkhag: dispatchAddress.dzongkhag || '',
				gewog: dispatchAddress.gewog || '',
				place: dispatchAddress.place || ''
			}
		}
		
		// Add to status history
		order.statusHistory.push({
			status: order.status,
			changedBy: {
				cid: userCid,
				role: 'tshogpas',
				name: user.name || ''
			},
			timestamp: new Date(timestamp || Date.now()),
			notes: 'Tshogpas details updated during shipping'
		})
		
		await order.save()
		res.json({ message: 'Tshogpas details saved successfully', order })
	} catch (error) {
		console.error('Error saving tshogpas details:', error)
		res.status(500).json({ error: 'Internal server error' })
	}
})

function calculateTransportFee(totalAmount) {
	// Simple calculation: 10% of order value with minimum 20 and maximum 200
	const fee = Math.max(20, Math.min(200, totalAmount * 0.1))
	return Math.round(fee * 100) / 100 // Round to 2 decimal places
}

// Test endpoint to create a sample order for QR code testing
router.post('/create-test-order', authCid, async (req, res) => {
	try {
		const userCid = req.user.cid
		
		// Create a simple test order
		const testOrder = new Order({
			userCid: userCid,
			product: {
				id: new mongoose.Types.ObjectId(),
				name: 'Test Product',
				price: 100,
				sellerCid: userCid, // Make the creator also the seller for testing
				category: 'Test Category',
				image: 'test-image.jpg'
			},
			quantity: 1,
			totalAmount: 100,
			status: 'order confirmed',
			paymentMethod: 'cash',
			deliveryAddress: {
				title: 'Test Address',
				place: 'Test Place',
				dzongkhag: 'Test Dzongkhag'
			},
			createdAt: new Date(),
			updatedAt: new Date()
		})
		
		const savedOrder = await testOrder.save()
		
		res.json({ 
			message: 'Test order created successfully',
			orderId: savedOrder._id,
			qrCodeData: savedOrder._id.toString()
		})
	} catch (error) {
		console.error('Error creating test order:', error)
		res.status(500).json({ error: 'Failed to create test order' })
	}
})

// ============================================
// PAYMENT WORKFLOW ENDPOINTS
// ============================================

// Initialize payment flow for an order
router.post('/:orderId/payment/initialize', authCid, async (req, res) => {
	const session = await mongoose.startSession();
	
	try {
		session.startTransaction();
		
		const { orderId } = req.params;
		const userCid = req.user.cid;
		
		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			return res.status(400).json({ error: 'Invalid order ID' });
		}
		
		const order = await Order.findById(orderId).session(session);
		if (!order) {
			return res.status(404).json({ error: 'Order not found' });
		}
		
		// Verify user has permission (order creator, transporter, tshogpa, or farmer)
		const allowedCids = [
			order.userCid,
			order.transporter?.cid,
			order.tshogpasCid,
			order.product.sellerCid
		].filter(Boolean);
		
		if (!allowedCids.includes(userCid)) {
			return res.status(403).json({ error: 'Unauthorized to initialize payment for this order' });
		}
		
		await order.initializePaymentFlow();
		await session.commitTransaction();
		
		res.json({
			message: 'Payment flow initialized successfully',
			paymentStatus: order.getPaymentStatus()
		});
		
	} catch (error) {
		await session.abortTransaction();
		console.error('Error initializing payment flow:', error);
		
		if (error.message.includes('Payment flow already initialized') || 
		    error.message.includes('Missing required actors')) {
			return res.status(400).json({ error: error.message });
		}
		
		res.status(500).json({ error: 'Failed to initialize payment flow' });
	} finally {
		session.endSession();
	}
});

// Update payment step status
router.put('/:orderId/payment/:step', authCid, async (req, res) => {
	const session = await mongoose.startSession();
	
	try {
		session.startTransaction();
		
		const { orderId, step } = req.params;
		const { status, notes = '' } = req.body;
		const userCid = req.user.cid;
		
		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			return res.status(400).json({ error: 'Invalid order ID' });
		}
		
		const validSteps = ['consumer_to_transporter', 'transporter_to_tshogpa', 'tshogpa_to_farmer'];
		if (!validSteps.includes(step)) {
			return res.status(400).json({ error: 'Invalid payment step' });
		}
		
		const validStatuses = ['pending', 'completed', 'failed'];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({ error: 'Invalid status' });
		}
		
		const order = await Order.findById(orderId).session(session);
		if (!order) {
			return res.status(404).json({ error: 'Order not found' });
		}
		
		// Verify user has permission to update this specific step
		const stepConfig = order.paymentFlow.find(s => s.step === step);
		if (!stepConfig) {
			return res.status(404).json({ error: 'Payment step not found' });
		}
		
		// Only the receiver (toCid) can mark as completed, sender (fromCid) or receiver can mark as failed
		if (status === 'completed' && userCid !== stepConfig.toCid) {
			return res.status(403).json({ error: 'Only the payment receiver can mark step as completed' });
		}
		
		if (status === 'failed' && ![stepConfig.fromCid, stepConfig.toCid].includes(userCid)) {
			return res.status(403).json({ error: 'Only payment sender or receiver can mark step as failed' });
		}
		
		// Get user details for tracking
		const user = await User.findOne({ cid: userCid }).select('name').session(session);
		const changedBy = {
			cid: userCid,
			role: getUserRole(userCid, order),
			name: user?.name || ''
		};
		
		await order.updatePaymentStep(step, status, changedBy, notes);
		await session.commitTransaction();
		
		res.json({
			message: `Payment step '${step}' updated to '${status}' successfully`,
			paymentStatus: order.getPaymentStatus()
		});
		
	} catch (error) {
		await session.abortTransaction();
		console.error('Error updating payment step:', error);
		
		if (error.message.includes('Payment step') || 
		    error.message.includes('Cannot change status') ||
		    error.message.includes('Cannot complete a failed')) {
			return res.status(400).json({ error: error.message });
		}
		
		res.status(500).json({ error: 'Failed to update payment step' });
	} finally {
		session.endSession();
	}
});

// Get payment status for an order
router.get('/:orderId/payment/status', authCid, async (req, res) => {
	try {
		const { orderId } = req.params;
		const userCid = req.user.cid;
		
		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			return res.status(400).json({ error: 'Invalid order ID' });
		}
		
		const order = await Order.findById(orderId);
		if (!order) {
			return res.status(404).json({ error: 'Order not found' });
		}
		
		// Verify user has permission to view payment status
		const allowedCids = [
			order.userCid,
			order.transporter?.cid,
			order.tshogpasCid,
			order.product.sellerCid
		].filter(Boolean);
		
		if (!allowedCids.includes(userCid)) {
			return res.status(403).json({ error: 'Unauthorized to view payment status for this order' });
		}
		
		const paymentStatus = order.getPaymentStatus();
		
		res.json({
			orderId: order._id,
			paymentStatus,
			paymentStatusHistory: order.paymentStatusHistory
		});
		
	} catch (error) {
		console.error('Error getting payment status:', error);
		res.status(500).json({ error: 'Failed to get payment status' });
	}
});

// Get payment history for an order
router.get('/:orderId/payment/history', authCid, async (req, res) => {
	try {
		const { orderId } = req.params;
		const userCid = req.user.cid;
		
		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			return res.status(400).json({ error: 'Invalid order ID' });
		}
		
		const order = await Order.findById(orderId);
		if (!order) {
			return res.status(404).json({ error: 'Order not found' });
		}
		
		// Verify user has permission
		const allowedCids = [
			order.userCid,
			order.transporter?.cid,
			order.tshogpasCid,
			order.product.sellerCid
		].filter(Boolean);
		
		if (!allowedCids.includes(userCid)) {
			return res.status(403).json({ error: 'Unauthorized to view payment history for this order' });
		}
		
		res.json({
			orderId: order._id,
			paymentStatusHistory: order.paymentStatusHistory.sort((a, b) => b.timestamp - a.timestamp)
		});
		
	} catch (error) {
		console.error('Error getting payment history:', error);
		res.status(500).json({ error: 'Failed to get payment history' });
	}
});

// Auto-initialize payment flows for orders that need them
router.post('/payment/auto-initialize', authCid, async (req, res) => {
	const session = await mongoose.startSession();
	
	try {
		session.startTransaction();
		
		const userCid = req.user.cid;
		
		// Find orders that are shipped or delivered but don't have payment flows
		const ordersNeedingPaymentFlow = await Order.find({
			$and: [
				{
					$or: [
						{ userCid },
						{ 'transporter.cid': userCid },
						{ tshogpasCid: userCid },
						{ 'product.sellerCid': userCid }
					]
				},
				{
					status: { $in: ['shipped', 'delivered', 'out for delivery'] }
				},
				{
					$or: [
						{ paymentFlow: { $exists: false } },
						{ paymentFlow: { $size: 0 } }
					]
				}
			]
		}).session(session);
		
		let initializedCount = 0;
		const results = [];
		
		for (const order of ordersNeedingPaymentFlow) {
			try {
				await order.initializePaymentFlow();
				initializedCount++;
				results.push({
					orderId: order._id,
					status: 'initialized',
					paymentStatus: order.getPaymentStatus()
				});
			} catch (error) {
				console.warn(`Failed to initialize payment flow for order ${order._id}:`, error.message);
				results.push({
					orderId: order._id,
					status: 'failed',
					error: error.message
				});
			}
		}
		
		await session.commitTransaction();
		
		res.json({
			message: `Auto-initialized payment flows for ${initializedCount} orders`,
			totalProcessed: ordersNeedingPaymentFlow.length,
			initializedCount,
			results
		});
		
	} catch (error) {
		await session.abortTransaction();
		console.error('Error auto-initializing payment flows:', error);
		res.status(500).json({ error: 'Failed to auto-initialize payment flows' });
	} finally {
		session.endSession();
	}
});

// Transporter payment confirmation endpoint
router.post('/:orderId/payment/transporter-confirm', authCid, async (req, res) => {
	const session = await mongoose.startSession();
	
	try {
		session.startTransaction();
		
		const { orderId } = req.params;
		const userCid = req.user.cid;
		
		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			return res.status(400).json({ error: 'Invalid order ID' });
		}
		
		const order = await Order.findById(orderId).session(session);
		if (!order) {
			return res.status(404).json({ error: 'Order not found' });
		}
		
		// Validate order status is 'delivered'
		if (order.status !== 'delivered') {
			return res.status(400).json({ error: 'Order has not been delivered yet' });
		}
		
		// Verify user is the transporter
		if (userCid !== order.transporter?.cid) {
			return res.status(403).json({ error: 'Only the assigned transporter can confirm payment' });
		}
		
		// Initialize payment flow if not exists
		if (order.paymentFlow.length === 0) {
			await order.initializePaymentFlow();
		}
		
		// Find the consumer_to_transporter step
		const step = order.paymentFlow.find(s => s.step === 'consumer_to_transporter');
		if (!step) {
			return res.status(400).json({ error: 'Transporter payment step not found in flow' });
		}
		
		if (step.status === 'completed') {
			return res.status(400).json({ error: 'Payment already confirmed' });
		}
		
		// Get user details for tracking
		const user = await User.findOne({ cid: userCid }).select('name').session(session);
		const changedBy = {
			cid: userCid,
			role: 'transporter',
			name: user?.name || ''
		};
		
		await order.updatePaymentStep('consumer_to_transporter', 'completed', changedBy, 'Payment confirmed by transporter');
		await session.commitTransaction();
		
		res.json({
			message: 'Payment confirmed successfully',
			paymentStatus: order.getPaymentStatus()
		});
		
	} catch (error) {
		await session.abortTransaction();
		console.error('Error confirming transporter payment:', error);
		
		if (error.message.includes('Order has not been delivered') || 
		    error.message.includes('Payment already confirmed')) {
			return res.status(400).json({ error: error.message });
		}
		
		res.status(500).json({ error: 'Failed to confirm payment' });
	} finally {
		session.endSession();
	}
});

// Tshogpa payment confirmation endpoint
router.post('/:orderId/payment/tshogpa-confirm', authCid, async (req, res) => {
	const session = await mongoose.startSession();
	
	try {
		session.startTransaction();
		
		const { orderId } = req.params;
		const userCid = req.user.cid;
		
		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			return res.status(400).json({ error: 'Invalid order ID' });
		}
		
		const order = await Order.findById(orderId).session(session);
		if (!order) {
			return res.status(404).json({ error: 'Order not found' });
		}
		
		// Validate order status is 'delivered'
		if (order.status !== 'delivered') {
			return res.status(400).json({ error: 'Order has not been delivered yet' });
		}
		
		// Verify user is the tshogpa
		if (userCid !== order.tshogpasCid) {
			return res.status(403).json({ error: 'Only the assigned tshogpa can confirm payment' });
		}
		
		// Initialize payment flow if not exists
		if (order.paymentFlow.length === 0) {
			await order.initializePaymentFlow();
		}
		
		// Check if tshogpa is also the seller
		const tshogpaIsSeller = order.tshogpasCid === order.product.sellerCid;
		
		// Get user details for tracking
		const user = await User.findOne({ cid: userCid }).select('name').session(session);
		const changedBy = {
			cid: userCid,
			role: 'tshogpa',
			name: user?.name || ''
		};
		
		if (tshogpaIsSeller) {
			// Special case: tshogpa is also the seller
			await order.completePaymentForTshogpaSeller(changedBy, 'Payment completed - tshogpa is also the seller');
		} else {
			// Normal case: update transporter_to_tshogpa or consumer_to_tshogpa step
			const stepToUpdate = order.paymentFlow.find(s => 
				s.step === 'transporter_to_tshogpa' || s.step === 'consumer_to_tshogpa'
			);
			
			if (!stepToUpdate) {
				return res.status(400).json({ error: 'Tshogpa payment step not found in flow' });
			}
			
			if (stepToUpdate.status === 'completed') {
				return res.status(400).json({ error: 'Payment already confirmed' });
			}
			
			await order.updatePaymentStep(stepToUpdate.step, 'completed', changedBy, 'Payment confirmed by tshogpa');
		}
		
		await session.commitTransaction();
		
		res.json({
			message: 'Payment confirmed successfully',
			paymentStatus: order.getPaymentStatus()
		});
		
	} catch (error) {
		await session.abortTransaction();
		console.error('Error confirming tshogpa payment:', error);
		
		if (error.message.includes('Order has not been delivered') || 
		    error.message.includes('Payment already confirmed')) {
			return res.status(400).json({ error: error.message });
		}
		
		res.status(500).json({ error: 'Failed to confirm payment' });
	} finally {
		session.endSession();
	}
});

// Farmer payment confirmation endpoint
router.post('/:orderId/payment/farmer-confirm', authCid, async (req, res) => {
	const session = await mongoose.startSession();
	
	try {
		session.startTransaction();
		
		const { orderId } = req.params;
		const userCid = req.user.cid;
		
		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			return res.status(400).json({ error: 'Invalid order ID' });
		}
		
		const order = await Order.findById(orderId).session(session);
		if (!order) {
			return res.status(404).json({ error: 'Order not found' });
		}
		
		// Validate order status is 'delivered'
		if (order.status !== 'delivered') {
			return res.status(400).json({ error: 'Order has not been delivered yet' });
		}
		
		// Verify user is the farmer (product seller)
		if (userCid !== order.product.sellerCid) {
			return res.status(403).json({ error: 'Only the product seller can confirm final payment' });
		}
		
		// Initialize payment flow if not exists
		if (order.paymentFlow.length === 0) {
			await order.initializePaymentFlow();
		}
		
		// Find the final payment step (to farmer)
		const finalSteps = ['tshogpa_to_farmer', 'transporter_to_farmer', 'consumer_to_farmer'];
		const step = order.paymentFlow.find(s => finalSteps.includes(s.step));
		
		if (!step) {
			return res.status(400).json({ error: 'Farmer payment step not found in flow' });
		}
		
		if (step.status === 'completed') {
			return res.status(400).json({ error: 'Payment already confirmed' });
		}
		
		// Get user details for tracking
		const user = await User.findOne({ cid: userCid }).select('name').session(session);
		const changedBy = {
			cid: userCid,
			role: 'farmer',
			name: user?.name || ''
		};
		
		await order.updatePaymentStep(step.step, 'completed', changedBy, 'Final payment confirmed by farmer');
		await session.commitTransaction();
		
		res.json({
			message: 'Payment confirmed successfully',
			paymentStatus: order.getPaymentStatus()
		});
		
	} catch (error) {
		await session.abortTransaction();
		console.error('Error confirming farmer payment:', error);
		
		if (error.message.includes('Order has not been delivered') || 
		    error.message.includes('Payment already confirmed')) {
			return res.status(400).json({ error: error.message });
		}
		
		res.status(500).json({ error: 'Failed to confirm payment' });
	} finally {
		session.endSession();
	}
});

// Helper function to determine user role in the order context
function getUserRole(userCid, order) {
	if (userCid === order.userCid) return 'consumer';
	if (userCid === order.transporter?.cid) return 'transporter';
	if (userCid === order.tshogpasCid) return 'tshogpa';
	if (userCid === order.product.sellerCid) return 'farmer';
	return 'unknown';
}

// Batch endpoint to get payment status for multiple orders
router.post('/payment/batch-status', authCid, async (req, res) => {
	try {
		const { orderIds } = req.body;
		const userCid = req.user.cid;
		
		if (!Array.isArray(orderIds) || orderIds.length === 0) {
			return res.status(400).json({ error: 'orderIds must be a non-empty array' });
		}
		
		// Validate all order IDs
		const invalidIds = orderIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
		if (invalidIds.length > 0) {
			return res.status(400).json({ error: 'Invalid order IDs', invalidIds });
		}
		
		const orders = await Order.find({ _id: { $in: orderIds } });
		
		const results = orders
			.filter(order => {
				// Filter orders user has permission to view
				const allowedCids = [
					order.userCid,
					order.transporter?.cid,
					order.tshogpasCid,
					order.product.sellerCid
				].filter(Boolean);
				return allowedCids.includes(userCid);
			})
			.map(order => ({
				orderId: order._id,
				paymentStatus: order.getPaymentStatus()
			}));
		
		res.json({ results });
		
	} catch (error) {
		console.error('Error getting batch payment status:', error);
		res.status(500).json({ error: 'Failed to get batch payment status' });
	}
});

// Get orders pending payment action for a specific user
router.get('/payment/pending-actions', authCid, async (req, res) => {
	try {
		const userCid = req.user.cid;
		
		// Find orders where user has pending payment actions
		const orders = await Order.find({
			$or: [
				{ userCid }, // Consumer orders
				{ 'transporter.cid': userCid }, // Transporter orders
				{ tshogpasCid: userCid }, // Tshogpa orders
				{ 'product.sellerCid': userCid } // Farmer orders
			],
			'paymentFlow.0': { $exists: true } // Has payment flow initialized
		});
		
		const pendingActions = [];
		
		for (const order of orders) {
			const userRole = getUserRole(userCid, order);
			
			// Find steps where user can take action
			for (const step of order.paymentFlow) {
				// User can complete if they are the receiver and step is pending
				if (step.toCid === userCid && step.status === 'pending') {
					pendingActions.push({
						orderId: order._id,
						step: step.step,
						action: 'complete',
						role: userRole,
						amount: step.amount,
						fromCid: step.fromCid,
						product: {
							name: order.product.productName,
							seller: order.product.sellerCid
						},
						timestamp: step.timestamp
					});
				}
				
				// User can mark as failed if they are sender or receiver and step is pending
				if ([step.fromCid, step.toCid].includes(userCid) && step.status === 'pending') {
					pendingActions.push({
						orderId: order._id,
						step: step.step,
						action: 'fail',
						role: userRole,
						amount: step.amount,
						fromCid: step.fromCid,
						toCid: step.toCid,
						product: {
							name: order.product.productName,
							seller: order.product.sellerCid
						},
						timestamp: step.timestamp
					});
				}
			}
		}
		
		// Remove duplicates and sort by timestamp
		const uniqueActions = pendingActions
			.filter((action, index, arr) => 
				arr.findIndex(a => 
					a.orderId.toString() === action.orderId.toString() && 
					a.step === action.step && 
					a.action === action.action
				) === index
			)
			.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
		
		res.json({
			pendingActions: uniqueActions,
			count: uniqueActions.length
		});
		
	} catch (error) {
		console.error('Error getting pending payment actions:', error);
		res.status(500).json({ error: 'Failed to get pending payment actions' });
	}
});

module.exports = router