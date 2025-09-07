const express = require('express')
const mongoose = require('mongoose')
const Cart = require('../models/Cart')
const Product = require('../models/Product')
const User = require('../models/User')

const router = express.Router()

// Simple auth middleware using CID derived from request.
// In this project, frontend stores user in localStorage and no JWT is issued.
// We'll accept CID from either header x-cid, Authorization: CID <cid>, or req.body.cid.
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

async function buildCartPayload(cart) {
  if (!cart) return { userCid: null, items: [] }
  // Populate fields required to derive image info
  await cart.populate({ path: 'items.productId', select: 'productName price unit productImage productImageData productImageMime createdBy stockQuantity' })
  const sellerCids = [...new Set(cart.items.map(i => i?.productId?.createdBy).filter(Boolean))]
  const sellers = sellerCids.length ? await User.find({ cid: { $in: sellerCids } }).select('cid name location phoneNumber') : []
  const sellerMap = new Map(sellers.map(s => [s.cid, s]))

  function deriveImageFields(prod) {
    if (!prod) return { productImageUrl: undefined, productImageBase64: undefined, productImage: undefined }
    const hasBlob = prod.productImageData && prod.productImageData.length
    let productImageUrl
    if (hasBlob) productImageUrl = `/api/products/${prod._id}/image`
    // legacy string / data URI
    const raw = prod.productImage
    if (!productImageUrl && raw) {
      if (/^https?:/i.test(raw) || raw.startsWith('data:image/')) productImageUrl = raw
    }
    let productImageBase64
    if (hasBlob) {
      try { productImageBase64 = Buffer.from(prod.productImageData).toString('base64') } catch (_) {}
    } else if (raw && raw.startsWith('data:image/')) {
      const m = raw.match(/^data:image\/[^;]+;base64,(.+)$/i)
      if (m) productImageBase64 = m[1]
    } else if (raw && /^[A-Za-z0-9+/=]+$/.test(raw.trim()) && raw.length > 40) {
      productImageBase64 = raw.trim()
    }
    return { productImageUrl, productImageBase64, productImage: raw }
  }

  return {
    userCid: cart.userCid,
    items: cart.items.map(i => {
      const prod = i.productId
      const seller = prod ? sellerMap.get(prod.createdBy) : null
      const img = deriveImageFields(prod)
      return {
        itemId: i._id,
        productId: prod?._id,
        productName: prod?.productName,
        price: prod?.price,
        unit: prod?.unit,
        productImageBase64: img.productImageBase64,
        productImageUrl: img.productImageUrl,
        productImage: img.productImage,
        sellerCid: prod?.createdBy,
        sellerName: seller?.name || '',
        sellerLocation: seller?.location || '',
        sellerPhoneNumber: seller?.phoneNumber || '',
        stockQuantity: prod?.stockQuantity,
        quantity: i.quantity,
      }
    }),
    updatedAt: cart.updatedAt,
  }
}

// POST /api/cart -> Add item to cart (protected)
router.post('/', authCid, async (req, res) => {
  try {
    const { productId, quantity } = req.body || {}
    if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
      return res.status(400).json({ error: 'Invalid productId' })
    }
    const qty = Number(quantity || 1)
    if (!(qty >= 1 && qty <= 999)) return res.status(400).json({ error: 'Invalid quantity' })

    // Ensure product exists
    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ error: 'Product not found' })

    const userCid = req.user.cid
    let cart = await Cart.findOne({ userCid })
    if (!cart) cart = await Cart.create({ userCid, items: [] })

    const idx = cart.items.findIndex(i => String(i.productId) === String(productId))
    if (idx >= 0) {
      return res.status(409).json({ error: 'Product already in cart' })
    }
    cart.items.push({ productId, quantity: qty })

  await cart.save()
  const payload = await buildCartPayload(cart)
  res.status(200).json({ success: true, cart: payload })
  } catch (err) {
    console.error('Add to cart error:', err)
    res.status(500).json({ error: 'Failed to add to cart' })
  }
})

module.exports = router

// GET /api/cart -> Get current user's cart
router.get('/', authCid, async (req, res) => {
  try {
    const userCid = req.user.cid
  const cart = await Cart.findOne({ userCid })
  if (!cart) return res.json({ success: true, cart: { userCid, items: [] } })
  const payload = await buildCartPayload(cart)
  return res.json({ success: true, cart: payload })
  } catch (err) {
    console.error('Fetch cart error:', err)
    res.status(500).json({ error: 'Failed to fetch cart' })
  }
})

// PATCH /api/cart/:itemId -> Update quantity
router.patch('/:itemId', authCid, async (req, res) => {
  try {
    const { itemId } = req.params
    const { quantity } = req.body || {}
    const qty = Number(quantity)
    if (!mongoose.Types.ObjectId.isValid(String(itemId))) return res.status(400).json({ error: 'Invalid itemId' })
    if (!(qty >= 1 && qty <= 999)) return res.status(400).json({ error: 'Invalid quantity' })

    const cart = await Cart.findOne({ userCid: req.user.cid })
    if (!cart) return res.status(404).json({ error: 'Cart not found' })
    const idx = cart.items.findIndex(i => String(i._id) === String(itemId))
    if (idx < 0) return res.status(404).json({ error: 'Item not found' })
    cart.items[idx].quantity = qty
  await cart.save()
  const payload = await buildCartPayload(cart)
  return res.json({ success: true, cart: payload })
  } catch (err) {
    console.error('Update cart item error:', err)
    res.status(500).json({ error: 'Failed to update cart item' })
  }
})

// DELETE /api/cart/:itemId -> Remove item
router.delete('/:itemId', authCid, async (req, res) => {
  try {
    const { itemId } = req.params
    if (!mongoose.Types.ObjectId.isValid(String(itemId))) return res.status(400).json({ error: 'Invalid itemId' })
    const cart = await Cart.findOne({ userCid: req.user.cid })
    if (!cart) return res.status(404).json({ error: 'Cart not found' })
    const nextItems = cart.items.filter(i => String(i._id) !== String(itemId))
    cart.items = nextItems
  await cart.save()
  const payload = await buildCartPayload(cart)
  return res.json({ success: true, cart: payload })
  } catch (err) {
    console.error('Remove cart item error:', err)
    res.status(500).json({ error: 'Failed to remove cart item' })
  }
})
