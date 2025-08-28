import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Card from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import api from '@/lib/api'
import { getCurrentCid } from '@/lib/auth'
import { MapPin, Phone, Package, Banknote, Trash2 } from 'lucide-react'

function asDataUrl(base64){
  if (!base64) return null
  const s = base64.slice(0, 12)
  let mime = 'image/jpeg'
  if (s.startsWith('/9j/')) mime = 'image/jpeg'
  else if (s.startsWith('iVBORw0KG')) mime = 'image/png'
  else if (s.startsWith('R0lGODdh') || s.startsWith('R0lGODlh')) mime = 'image/gif'
  else if (s.startsWith('UklGR') || s.startsWith('RIFF')) mime = 'image/webp'
  return `data:${mime};base64,${base64}`
}

export default function BuyProducts(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [delivery, setDelivery] = useState('delivery')
  const [sellerMessage, setSellerMessage] = useState('')
  const [draftQty, setDraftQty] = useState({}) // itemId -> number
  // No QR modal; orders are created silently
  const { show } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const search = new URLSearchParams(location.search)
  const pid = search.get('pid')

  const load = async () => {
    const cid = getCurrentCid()
    if (!cid) {
      const redirectTo = pid ? `/buy?pid=${pid}` : '/buy'
      navigate('/login', { state: { redirectTo }, replace: true })
      return
    }
    setLoading(true)
    try {
      const resp = await api.getCart({ cid })
      const all = resp?.cart?.items || []
      const filtered = pid ? all.filter(i => String(i.productId) === String(pid)) : all
      setItems(filtered)
    } catch (e) {
      show('Failed to load cart', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [pid])

  // Clear saved seller message when leaving this page
  useEffect(() => {
    return () => {
  setSellerMessage('')
  try { localStorage.removeItem('cartMessage') } catch {}
    }
  }, [])

  // Keep a local editable copy of quantities
  useEffect(() => {
    if (!items?.length) { setDraftQty({}); return }
    setDraftQty(Object.fromEntries(items.map(i => [i.itemId, Math.max(1, Number(i.quantity) || 1)])))
  }, [items])

  // Message is ephemeral; no persistence

  // Subtotal reflects live draft quantities for instant UI feedback
  const subtotal = useMemo(() => {
    return items.reduce((s, i) => {
      const v = draftQty[i.itemId]
      const q = v === '' ? 0 : Number(v ?? i.quantity)
      return s + Number(i.price) * q
    }, 0)
  }, [items, draftQty])
  const deliveryFee = useMemo(() => delivery === 'pickup' ? 0 : (items.length ? 20 : 0), [delivery, items.length])
  const total = subtotal + deliveryFee

  const doUpdateCart = async (itemId, qty) => {
    const cid = getCurrentCid()
    const resp = await api.updateCartItem({ itemId, quantity: qty, cid })
    setItems(resp?.cart?.items || [])
    try { window.dispatchEvent(new Event('cartChanged')) } catch(e) {}
    return resp
  }

  const updateQty = async (itemId, qty) => {
    // Normalize bad inputs
    if (!Number.isFinite(qty)) return

    const item = items.find(x => x.itemId === itemId)
    const stock = Math.max(0, Number(item?.stockQuantity))

    // Clamp and toast when out of bounds
    if (qty < 1) {
      show('Quantity cannot be less than 1', { variant: 'error' })
      setDraftQty(s => ({ ...s, [itemId]: 1 }))
      try { await doUpdateCart(itemId, 1) } catch (e) {
        const msg = e?.body?.error || 'Couldn’t update quantity'
        const lower = String(msg || '').toLowerCase()
        if (!lower.includes('invalid quantity')) show(msg, { variant: 'error' })
      }
      return
    }

    if (stock > 0 && qty > stock) {
      show(`Quantity cannot exceed available stock (${stock}).`, { variant: 'error' })
      setDraftQty(s => ({ ...s, [itemId]: stock }))
      try { await doUpdateCart(itemId, stock) } catch (e) {
        const msg = e?.body?.error || 'Couldn’t update quantity'
        const lower = String(msg || '').toLowerCase()
        if (!lower.includes('invalid quantity')) show(msg, { variant: 'error' })
      }
      return
    }

    try {
      await doUpdateCart(itemId, qty)
    } catch (e) {
      const msg = e?.body?.error || 'Couldn’t update quantity'
      const lower = String(msg || '').toLowerCase()
      if (!lower.includes('invalid quantity')) show(msg, { variant: 'error' })
    }
  }

  const removeItem = async (itemId) => {
    try {
      const cid = getCurrentCid()
      const resp = await api.removeCartItem({ itemId, cid })
      setItems(resp?.cart?.items || [])
      try { window.dispatchEvent(new Event('cartChanged')) } catch(e) {}
    } catch (e) {
      show('Failed to remove item', { variant: 'error' })
    }
  }

  const placeOrder = async () => {
    try {
      const cid = getCurrentCid()
      if (!cid) { const redirectTo = pid ? `/buy?pid=${pid}` : '/buy'; navigate('/login', { state: { redirectTo }, replace: true }); return }
      // Expect only one item here when pid is used; use first
      const item = items[0]
      if (!item) { show('No product selected', { variant: 'error' }); return }
      const quantity = draftQty[item.itemId] === '' ? 0 : Number(draftQty[item.itemId] ?? item.quantity)
      if (!(quantity >= 1)) { show('Quantity must be at least 1', { variant: 'error' }); return }
  // Prefer the productId from the cart item (always a valid ObjectId), fallback to pid
  let productId = item.productId || pid
  // Basic 24-hex check; if invalid and pid looks better, use pid
  const isHex24 = v => typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v)
  if (!isHex24(productId) && isHex24(pid)) productId = pid
  await api.buyProduct({ productId, quantity, cid })
  // Clear saved message so it doesn't persist across pages
  try { localStorage.removeItem('cartMessage') } catch {}
  show('Order placed')
  // Redirect to products page
  navigate('/products', { replace: true })
    } catch (e) {
      const msg = e?.body?.error || 'Failed to place order'
      show(msg, { variant: 'error' })
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-emerald-50/60 to-transparent">
        <div className="max-w-7xl mx-auto p-6 min-h-screen">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            <div className="lg:col-span-2 space-y-6">
              {[1,2].map((k)=> (
                <Card key={k} className="p-4">
                  <div className="flex flex-col sm:flex-row gap-12 animate-pulse">
                    <div className="w-full h-56 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 bg-slate-200 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-slate-200 rounded w-2/3" />
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="h-10 bg-slate-200 rounded w-40 mt-4" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="lg:sticky lg:top-28 self-start">
              <Card className="p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-40" />
                <div className="space-y-3 mt-4">
                  <div className="h-4 bg-slate-200 rounded" />
                  <div className="h-4 bg-slate-200 rounded" />
                  <div className="h-6 bg-slate-200 rounded" />
                </div>
                <div className="h-10 bg-slate-200 rounded mt-6" />
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="bg-gradient-to-b from-emerald-50/60 to-transparent">
        <div className="max-w-5xl mx-auto p-6 min-h-screen flex items-start pt-40">
          <Card className="p-10 text-center overflow-hidden relative flex flex-col items-center justify-center min-h-[280px] md:min-h-[340px] w-full">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
              {/* cart icon style placeholder */}
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
            </div>
            <div className="mt-4 text-2xl md:text-3xl font-semibold text-emerald-900">Your cart is empty</div>
            <p className="mt-2 text-slate-600">Explore fresh, locally sourced produce and add items you love.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="bg-emerald-700 hover:bg-emerald-600">
                <Link to="/products">Browse all products</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Go to Home</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-b from-emerald-50/60 to-transparent">
      <div className="max-w-7xl mx-auto p-6 min-h-screen">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">Your Cart</h1>
          <Button asChild variant="ghost" className="text-emerald-700 hover:text-emerald-800">
            <Link to="/products">Continue shopping →</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 space-y-7">
            {items.map(i => (
              <Card key={i.itemId} className="p-0 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="flex flex-col sm:flex-row items-start gap-12 p-4">
                  {/* Image column */}
                  <div className="w-full h-56 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 shrink-0 bg-slate-100 overflow-hidden rounded-lg">
                    {i.productImageBase64 ? (
                      <img src={asDataUrl(i.productImageBase64)} alt={i.productName} className="block w-full h-full object-cover" />
                    ) : (
                      <div className="block w-full h-full bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]" />
                    )}
                  </div>
                  {/* Content column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-4">
                      <div className="min-w-0">
                        {/* Header row: title left, remove right */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-2xl md:text-3xl leading-tight font-semibold text-emerald-900 break-words">{i.productName}</h3>
                          <button
                            aria-label="Remove item"
                            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-red-600 shrink-0 whitespace-nowrap"
                            onClick={()=>removeItem(i.itemId)}
                          >
                            <Trash2 className="w-4 h-4" /> Remove
                          </button>
                        </div>
                        {/* Details */}
                        <div className="mt-2 space-y-1 text-[16px] md:text-[18px] text-slate-700">
                          <div className="text-slate-700"><span className="text-slate-900 font-semibold text-[18px] md:text-[20px]">{i.sellerName || '—'}</span></div>
                          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-600" /><span className="text-slate-800 truncate">{i.sellerLocation || '—'}</span></div>
                          <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-600" />{i.sellerPhoneNumber ? (<a className="text-emerald-700 hover:underline" href={`tel:${i.sellerPhoneNumber}`}>{i.sellerPhoneNumber}</a>) : (<span className="text-slate-800">—</span>)}</div>
                          <div className="flex items-center gap-2"><Banknote className="w-4 h-4 text-emerald-600" /><span className="text-emerald-900 font-semibold text-[18px] md:text-[20px]">Nu. {i.price}</span><span className="text-slate-600">/ {i.unit}</span></div>
                          <div className="inline-flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${Number(i.stockQuantity) > 0 ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700'}`}>
                              <Package className="w-4 h-4" />
                              <span>{Number(i.stockQuantity) > 0 ? `In stock: ${i.stockQuantity}` : 'Out of stock'}</span>
                            </span>
                          </div>
                        </div>
                        {/* Actions row: quantity selector and price recap */}
                        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-1 h-10 px-1.5 py-0.5 rounded-full border border-emerald-500 bg-white shadow-sm text-sm focus-within:ring-2 focus-within:ring-emerald-200">
                            <button
                              aria-label="Decrease"
                              className={`w-8 h-8 rounded-full text-emerald-700 hover:bg-emerald-50 ${(draftQty[i.itemId] === '' ? 0 : Number(draftQty[i.itemId] ?? i.quantity)) <= 1 ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''}`}
                              onClick={() => {
                                const curDraft = draftQty[i.itemId]
                                const current = curDraft === '' ? 0 : Number(curDraft ?? i.quantity)
                                if (current <= 1) { show('Quantity cannot be less than 1', { variant: 'error' }); return }
                                const next = current - 1
                                setDraftQty(s => ({ ...s, [i.itemId]: next }))
                                updateQty(i.itemId, next)
                              }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="w-16 min-w-[48px] text-center font-semibold text-slate-900 outline-none bg-transparent"
                              value={(() => {
                                const v = draftQty[i.itemId]
                                if (v === '') return ''
                                if (v === undefined) return String(i.quantity)
                                return String(Number(v))
                              })()}
                              onChange={(e) => {
                                const raw = e.target.value
                                if (raw.includes('-')) { show('Quantity cannot be negative', { variant: 'error' }); return }
                                const digits = raw.replace(/[^0-9]/g, '')
                                if (raw === '' || digits === '') { setDraftQty(s => ({ ...s, [i.itemId]: '' })); return }
                                const parsed = Math.min(999, Number(digits))
                                setDraftQty(s => ({ ...s, [i.itemId]: parsed }))
                              }}
                              onBlur={() => {
                                const v = draftQty[i.itemId]
                                const q = v === '' ? 0 : Number(v ?? i.quantity)
                                const stock = Math.max(0, Number(i.stockQuantity))
                                if (q <= 0) {
                                  show('Quantity cannot be less than 1', { variant: 'error' })
                                  setDraftQty(s => ({ ...s, [i.itemId]: 1 }))
                                  updateQty(i.itemId, 1)
                                  return
                                }
                                if (stock > 0 && q > stock) {
                                  show(`Quantity cannot exceed available stock (${stock}).`, { variant: 'error' })
                                  setDraftQty(s => ({ ...s, [i.itemId]: stock }))
                                  updateQty(i.itemId, stock)
                                  return
                                }
                                if (q !== Number(i.quantity)) updateQty(i.itemId, q)
                              }}
                            />
                            <button
                              aria-label="Increase"
                              className={`w-8 h-8 rounded-full text-emerald-700 hover:bg-emerald-50 ${(() => { const cur = draftQty[i.itemId] === '' ? 0 : Number(draftQty[i.itemId] ?? i.quantity); const stock = Math.max(0, Number(i.stockQuantity)); return stock > 0 && cur >= stock ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : '' })()}`}
                              onClick={() => {
                                const curDraft = draftQty[i.itemId]
                                const current = curDraft === '' ? 0 : Number(curDraft ?? i.quantity)
                                const stock = Math.max(0, Number(i.stockQuantity))
                                if (stock > 0 && current >= stock) { show(`Quantity cannot exceed available stock (${stock}).`, { variant: 'error' }); return }
                                const next = Math.min(999, current + 1)
                                setDraftQty(s => ({ ...s, [i.itemId]: next }))
                                updateQty(i.itemId, next)
                              }}
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-600 whitespace-nowrap">Item total</div>
                            <div className="text-lg md:text-xl font-bold text-emerald-800 whitespace-nowrap">Nu. {(Number(i.price) * (draftQty[i.itemId] === '' ? 0 : Number(draftQty[i.itemId] ?? i.quantity))).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="lg:sticky lg:top-28 self-start">
            <Card className="p-7 shadow-md ring-1 ring-slate-100">
              <div className="text-xl md:text-2xl font-semibold text-emerald-900">Order Summary</div>
              <div className="mt-4 space-y-3 text-base">
                <div className="flex justify-between"><span className="text-slate-700">Subtotal</span><span className="text-lg font-semibold">Nu. {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-700">Delivery</span><span className="text-lg font-semibold">Nu. {deliveryFee.toFixed(2)}</span></div>
                <div className="border-t pt-3 flex justify-between"><span className="text-xl font-semibold">Total</span><span className="text-2xl font-bold text-emerald-800">Nu. {total.toFixed(2)}</span></div>
              </div>

              <div className="mt-5">
                <label className="block text-base md:text-lg text-slate-700 mb-2">Delivery Options</label>
                <div className="flex gap-2">
                  <button onClick={()=>setDelivery('delivery')} className={`px-3 py-2 rounded-full border text-base transition ${delivery==='delivery' ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Delivery</button>
                  <button onClick={()=>setDelivery('pickup')} className={`px-3 py-2 rounded-full border text-base transition ${delivery==='pickup' ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Pickup</button>
                </div>
              </div>

              {/* Message to seller */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label htmlFor="seller-message" className="block text-base md:text-lg text-slate-700">Message to seller</label>
                  <span className="text-xs text-slate-500">Optional</span>
                </div>
                <textarea
                  id="seller-message"
                  value={sellerMessage}
                  onChange={(e)=>setSellerMessage(e.target.value)}
                  placeholder="Any special instructions or delivery notes..."
                  className="mt-2 w-full min-h-28 p-3 rounded-md border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div className="mt-7">
                <Button onClick={placeOrder} className="w-full bg-emerald-700 hover:bg-emerald-600 text-lg">Place Order</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
  {/* QR code saved server-side; not displayed here */}
    </div>
  )
}