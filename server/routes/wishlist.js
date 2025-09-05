const express = require('express')
const mongoose = require('mongoose')
const Wishlist = require('../models/Wishlist')
const Product = require('../models/Product')

const router = express.Router()

// Reuse lightweight CID auth like cart
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

async function buildWishlistPayload(doc) {
  if (!doc) return { userCid: null, items: [] }
  await doc.populate({ path: 'items.productId', select: 'productName price unit productImageBase64 createdBy stockQuantity' })
  return {
    userCid: doc.userCid,
    items: (doc.items || []).filter(i => i.productId).map(i => ({
      itemId: i._id,
      productId: i.productId?._id,
      productName: i.productId?.productName,
      price: i.productId?.price,
      unit: i.productId?.unit,
      productImageBase64: i.productId?.productImageBase64,
      stockQuantity: i.productId?.stockQuantity,
      addedAt: i.addedAt,
    })),
    updatedAt: doc.updatedAt,
  }
}

// GET /api/wishlist -> current user's wishlist
router.get('/', authCid, async (req, res) => {
  try {
    const wl = await Wishlist.findOne({ userCid: req.user.cid })
    if (!wl) return res.json({ success: true, wishlist: { userCid: req.user.cid, items: [] } })
    const payload = await buildWishlistPayload(wl)
    return res.json({ success: true, wishlist: payload })
  } catch (err) {
    console.error('Wishlist get error:', err)
    return res.status(500).json({ error: 'Failed to fetch wishlist' })
  }
})

// POST /api/wishlist -> add productId
router.post('/', authCid, async (req, res) => {
  try {
    const { productId } = req.body || {}
    if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
      return res.status(400).json({ error: 'Invalid productId' })
    }
    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ error: 'Product not found' })

    let wl = await Wishlist.findOne({ userCid: req.user.cid })
    if (!wl) wl = await Wishlist.create({ userCid: req.user.cid, items: [] })

    const exists = wl.items.some(i => String(i.productId) === String(productId))
    if (exists) return res.status(409).json({ error: 'Already in wishlist' })
    wl.items.push({ productId })
    await wl.save()
    const payload = await buildWishlistPayload(wl)
    return res.status(200).json({ success: true, wishlist: payload })
  } catch (err) {
    console.error('Wishlist add error:', err)
    return res.status(500).json({ error: 'Failed to add to wishlist' })
  }
})

// DELETE /api/wishlist/:productId -> remove by productId
router.delete('/:productId', authCid, async (req, res) => {
  try {
    const { productId } = req.params
    if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
      return res.status(400).json({ error: 'Invalid productId' })
    }

    const wl = await Wishlist.findOne({ userCid: req.user.cid })
    if (!wl) return res.status(404).json({ error: 'Wishlist not found' })

    const before = wl.items.length
    wl.items = wl.items.filter(i => String(i.productId) !== String(productId))
    if (wl.items.length === before) return res.status(404).json({ error: 'Item not in wishlist' })

    await wl.save()
    const payload = await buildWishlistPayload(wl)
    return res.json({ success: true, wishlist: payload })
  } catch (err) {
    console.error('Wishlist remove error:', err)
    return res.status(500).json({ error: 'Failed to remove from wishlist' })
  }
})

module.exports = router
