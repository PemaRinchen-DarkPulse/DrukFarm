import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Box, User, MapPin, Clock } from 'lucide-react'
import api from '@/lib/api'
import { getCurrentCid } from '@/lib/auth'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [isFarmer, setIsFarmer] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    // Determine role from storage (same quick heuristic used in Management)
    const guessRole = () => {
      try {
        const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser')
        if (raw) {
          const obj = JSON.parse(raw)
          if (obj?.role) return String(obj.role)
        }
      } catch {}
      const keys = ['role', 'user', 'authUser']
      for (const k of keys) {
        try {
          const v = localStorage.getItem(k) || sessionStorage.getItem(k)
          if (typeof v === 'string' && v.toLowerCase().includes('farmer')) return 'farmer'
          try { const o = JSON.parse(v); if (JSON.stringify(o).toLowerCase().includes('farmer')) return 'farmer'; if (o?.role) return o.role } catch {}
        } catch {}
      }
      return 'consumer'
    }
    const role = guessRole()
    setIsFarmer(role === 'farmer')

  const cid = getCurrentCid()
  const fetcher = role === 'farmer' ? api.fetchSellerOrders({ cid }) : api.fetchMyOrders({ cid })
    Promise.resolve(fetcher)
      .then((resp) => {
        if (!mounted) return
        const list = role === 'farmer' ? (resp?.orders || []) : (resp || [])
        setOrders(list)
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))

    return () => {
      mounted = false
    }
  }, [])

  const formatNu = (n) => `Nu. ${Number(n || 0).toFixed(0)}`

  const contactInfo = (o) => {
    // For farmer view, contact customer; for consumer view, contact farmer
    if (isFarmer) return o.buyer?.phoneNumber || ''
    return o.seller?.phoneNumber || ''
  }

  const onCancel = async (o) => {
    try {
      const cid = getCurrentCid()
      await api.cancelMyOrder({ orderId: o.orderId, cid })
      setOrders(s => s.map(x => x.orderId === o.orderId ? { ...x, status: 'cancelled' } : x))
    } catch (e) {
      console.error(e)
      // optionally surface a toast if you have one available
    }
  }

  return (
    <section className="orders">
      <style>{`
        .orders .orders-header {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          margin-bottom:18px;
          padding-top:6px;
        }
        .orders .orders-title {
          font-size:26px;
          color:#0b2f1f;
          margin:0;
          font-weight:800;
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="orders-header">
          <h2 className="orders-title">{isFarmer ? 'Customer Orders' : 'My Orders'}</h2>
        </div>

        {/* Empty State */}
        {orders.length === 0 && !loading ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl shadow-sm border border-dashed border-gray-300">
            <Box className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">
              No orders yet
            </h3>
            <p className="text-gray-500 mb-6">
              {isFarmer ? 'Orders for your products will appear here.' : 'Your purchases will appear here.'}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {orders.map((o) => (
              <div key={o.orderId} className="bg-white rounded-xl border shadow-sm">
                <div className="p-5 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-emerald-700 font-semibold">Order #{o.orderId.slice(-6).toUpperCase()}</div>
                    {(() => {
                      const name = isFarmer ? (o.buyer?.name || '—') : (o.seller?.name || '—')
                      const loc = isFarmer ? (o.buyer?.location || '—') : (o.seller?.location || '—')
                      return (
                        <div className="flex items-center gap-3 text-gray-700">
                          <span className="inline-flex items-center gap-1 text-sm"><User className="w-4 h-4" /> {name}</span>
                          <span className="inline-flex items-center gap-1 text-sm text-gray-500"><MapPin className="w-4 h-4" /> {loc}</span>
                        </div>
                      )
                    })()}
                    <div className="inline-flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3.5 h-3.5" /> {new Date(o.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-700 text-2xl font-bold">{formatNu(o.totalPrice)}</div>
                    <div className="text-xs text-gray-500">{o.quantity} item(s)</div>
                  </div>
                </div>
                <div className="border-t px-5 py-3">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Order Items:</div>
                  <div className="rounded-md bg-gray-50 divide-y">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="text-gray-800">{o.product?.name}</div>
                      <div className="text-gray-600 text-sm">{o.quantity} {o.product?.unit} × Nu. {o.product?.price} = {formatNu(o.totalPrice)}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between px-5 py-3 border-t">
                  <div className="text-sm inline-flex items-center gap-1 text-gray-600"><Clock className="w-4 h-4" /> Status: {o.status || 'pending'}</div>
                  {isFarmer ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Accept Order</Button>
                      <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white">Decline</Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={contactInfo(o) ? `tel:${contactInfo(o)}` : '#'}>Contact Customer</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={contactInfo(o) ? `tel:${contactInfo(o)}` : '#'}>Contact Farmer</a>
                      </Button>
                      <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" disabled={o.status !== 'pending'} onClick={() => onCancel(o)}>Cancel</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
