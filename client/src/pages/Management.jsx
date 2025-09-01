import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MyProducts from './MyProducts'
import Orders from './Orders'
import Profile from './Profile'
import AddProductModal from '@/components/AddProductModal'
import api from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import Input from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Reusable multi-select dropdown (checkbox menu) for a better UX than native multi-select box
function MultiSelect({ label, id, options = [], values = [], onChange, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const toggle = () => setOpen(v => !v)
  const close = () => setOpen(false)
  const isSelected = (v) => values.includes(v)
  const toggleValue = (v) => {
    if (!onChange) return
    const set = new Set(values)
    if (set.has(v)) { set.delete(v) } else { set.add(v) }
    onChange(Array.from(set))
  }

  // Close on outside click / escape
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) close() }
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const display = values.length ? values.join(', ') : placeholder

  return (
    <label className="relative block" ref={ref}>
      {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
      <button
        id={id}
        type="button"
        onClick={toggle}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-left text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-colors relative"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`block ${values.length ? 'text-slate-900' : 'text-slate-400'}`}>{display}</span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
      </button>
      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 mt-2 w-[min(40rem,100%)] max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white"
        >
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-50 cursor-pointer">
              <input
                type="checkbox"
                className="accent-emerald-600"
                checked={isSelected(opt)}
                onChange={() => toggleValue(opt)}
              />
              <span className="text-slate-800">{opt}</span>
            </label>
          ))}
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">No options</div>
          )}
        </div>
      )}
    </label>
  )
}

// Reusable single-select dropdown styled like MultiSelect
function SingleSelect({ label, id, options = [], value = '', onChange, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const toggle = () => setOpen(v => !v)
  const close = () => setOpen(false)

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) close() }
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const display = value ? value : placeholder

  return (
    <label className="relative block" ref={ref}>
      {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
      <button
        id={id}
        type="button"
        onClick={toggle}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-left text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-colors relative"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`block ${value ? 'text-slate-900' : 'text-slate-400'}`}>{display}</span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-2 w-[min(40rem,100%)] max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white"
        >
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={opt === value}
              onClick={() => { onChange && onChange(opt); close() }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex items-center justify-between ${opt === value ? 'bg-emerald-50' : ''}`}
            >
              <span className="text-slate-800">{opt}</span>
              {opt === value && <span className="text-emerald-600">✓</span>}
            </button>
          ))}
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">No options</div>
          )}
        </div>
      )}
    </label>
  )
}

const Management = () => {
  // Dzongkhag options for transporter routes
  const DZONGKHAGS = [
    'Bumthang',
    'Chhukha',
    'Dagana',
    'Gasa',
    'Haa',
    'Lhuentse',
    'Mongar',
    'Paro',
    'Pemagatshel',
    'Punakha',
    'Samdrup Jongkhar',
    'Samtse',
    'Sarpang',
    'Thimphu',
    'Trashigang',
    'Trashiyangtse',
    'Trongsa',
    'Tsirang',
    'Wangdue Phodrang',
    'Zhemgang',
  ]
  // Determine role: check currentUser in storage and fallbacks
  const getRole = () => {
    const containsFarmer = (value) => {
      if (!value && value !== 0) return false
      try {
        if (typeof value === 'string') return value.toLowerCase().includes('farmer')
        const s = JSON.stringify(value).toLowerCase()
        return s.includes('farmer')
      } catch (e) {
        return false
      }
    }

    // check localStorage and sessionStorage keys
    try {
      const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser')
      if (raw) {
        const obj = JSON.parse(raw)
        if (obj && typeof obj.role === 'string') return obj.role
      }
    } catch (e) {}

    const keys = ['role', 'user', 'authUser']
    for (const k of keys) {
      try {
        const v = localStorage.getItem(k) || sessionStorage.getItem(k)
        if (!v) continue
        if (containsFarmer(v)) return 'farmer'
        // try parse json
        try {
          const p = JSON.parse(v)
          if (containsFarmer(p)) return 'farmer'
          if (p && typeof p.role === 'string') return p.role
        } catch (e) {}
      } catch (e) {}
    }

    // common token keys (JWT) - try to decode payload
    const tokenKeys = ['token', 'accessToken', 'authToken', 'id_token']
    for (const k of tokenKeys) {
      try {
        const tk = localStorage.getItem(k) || sessionStorage.getItem(k)
        if (!tk) continue
        const parts = tk.split('.')
        if (parts.length >= 2) {
          const payload = parts[1]
          // base64url -> base64
          const b64 = payload.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((payload.length + 3) % 4)
          try {
            const json = JSON.parse(atob(b64))
            if (containsFarmer(json)) return 'farmer'
            if (json && typeof json.role === 'string') return json.role
          } catch (e) {}
        }
      } catch (e) {}
    }

    return 'consumer' // default minimal privileges
  }
  const role = getRole()
  const isFarmer = role === 'farmer'
  const isTransporter = role === 'transporter'

  const location = useLocation()
  const navigate = useNavigate()

  const initialTab = (() => {
    try {
      const usp = new URLSearchParams(window.location.search)
      const t = (usp.get('tab') || '').toLowerCase()
      if (t === 'products' && isFarmer) return 'Products'
      if (t === 'orders') return 'Orders'
      if (t === 'profile') return 'Profile'
      if (t === 'pickup' && isTransporter) return 'Pick Up'
      if (t === 'delivery' && isTransporter) return 'My Delivery'
    } catch (e) {}
    return 'Overview'
  })()
  const [tab, setTab] = useState(initialTab)

  // Allowed tabs depend on role
  const allowedTabs = useMemo(() => {
    if (isFarmer) return ['Overview', 'Products', 'Orders', 'Profile']
    if (isTransporter) return ['Overview', 'Pick Up', 'My Delivery']
    return ['Overview', 'Orders', 'Profile']
  }, [isFarmer, isTransporter])
  // Navbar now controls tab selection; no in-page tab selector needed

  // Keep the URL query param in sync with the active tab
  useEffect(() => {
    // Coerce tab to an allowed value for the current role
    const effectiveTab = allowedTabs.includes(tab) ? tab : 'Overview'
    if (effectiveTab !== tab) setTab(effectiveTab)
  // Map tab to query token
  const to = effectiveTab === 'Pick Up' ? 'pickup' : effectiveTab === 'My Delivery' ? 'delivery' : effectiveTab.toLowerCase()
    const usp = new URLSearchParams(location.search)
    const current = (usp.get('tab') || '').toLowerCase()
    if (current !== to) {
      navigate(`/management?tab=${to}`, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  // Keep the active tab in sync when the URL query changes externally
  useEffect(() => {
    try {
      const usp = new URLSearchParams(location.search)
      const q = (usp.get('tab') || '').toLowerCase()
      let mapped =
        q === 'products' ? 'Products' :
        q === 'orders' ? 'Orders' :
        q === 'profile' ? 'Profile' :
        q === 'pickup' ? 'Pick Up' :
        q === 'delivery' ? 'My Delivery' :
        'Overview'
      if (!allowedTabs.includes(mapped)) mapped = 'Overview'
      if (mapped !== tab) setTab(mapped)
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, allowedTabs.join('|')])
  const [showAddModal, setShowAddModal] = useState(false)
  const { show } = useToast()
  const [pickupFromDz, setPickupFromDz] = useState('') // single selected dzongkhag
  const [pickupToDz, setPickupToDz] = useState([]) // multiple selected dzongkhags
  const [pickupLoading, setPickupLoading] = useState(false)
  const [pickupResults, setPickupResults] = useState([])

  // Pre-fill pick up "Your Location" from stored user when available
  useEffect(() => {
    if (!isTransporter) return
    try {
      const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser')
      if (raw) {
        const u = JSON.parse(raw)
        // Pre-select user's dzongkhag if present
        if (u?.dzongkhag && DZONGKHAGS.includes(u.dzongkhag) && !pickupFromDz) {
          setPickupFromDz(u.dzongkhag)
        }
      }
    } catch (e) { /* noop */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTransporter])

  const stats = [
    {
      id: 1,
      title: 'Total Products',
      value: 128,
      desc: 'Active listings',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 7h18M6 21V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="10" y="11" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: 2,
      title: 'Total Revenue',
      value: '$12,430',
      desc: 'This month',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 1v22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17 5H9a4 4 0 000 8h6a4 4 0 010 8H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: 3,
      title: 'Total Orders',
      value: 342,
      desc: 'This month',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3h18v4H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 7l2 10h10l2-6H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: 4,
      title: 'Average Rating',
      value: '4.8',
      desc: 'Customer rating',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 17.3l6.18 3.73-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l4.46 4.76L5.82 21z" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round"/>
        </svg>
      )
    }
  ]

  // single-page layout: header always visible; show access or selected tab below
  return (
    <div className="management-page">
      <style>{`
        /* Management page scoped styles (embedded to avoid external files) */
        .management-page { background: linear-gradient(180deg, #f7fbf6 0%, #f6fbf9 100%); font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #052e1f; }
  .mf-container{ max-width: 1280px; margin: 0 auto; padding: 28px 0; }
        .mf-navbar{ background: rgba(255,255,255,0.96); backdrop-filter: blur(6px); box-shadow: 0 8px 30px rgba(11,47,26,0.04); border-radius: 14px; margin: 18px auto; padding: 10px 0; border: 1px solid rgba(9,30,14,0.03); }
        .tabbar{ display:flex; gap:12px; align-items:center; justify-content:space-between }
        .tab-select{ appearance:none; -webkit-appearance:none; -moz-appearance:none; padding:10px 14px; border-radius:12px; border:1px solid rgba(15,23,42,0.08); background:white; color:#052e1f; font-weight:700; cursor:pointer; box-shadow: 0 6px 14px rgba(11,47,26,0.04) }
  .tab-select:focus{ outline:none; border-color:#4CAF50; box-shadow: 0 0 0 3px rgba(76,175,80,0.18) }
        .tab-label{ font-size:14px; color:#6b7280; font-weight:600 }
        .cards-row{ display:grid; grid-template-columns: repeat(4, 1fr); gap:18px; margin-bottom:18px }
        .stat-card{ background:white; border-radius:12px; padding:18px; display:flex; align-items:center; gap:12px; box-shadow: 0 8px 30px rgba(11,47,26,0.04); transition:transform .18s ease, box-shadow .18s ease }
        .stat-card:hover{ transform:translateY(-6px); box-shadow:0 20px 40px rgba(11,47,26,0.06) }
  .icon{ width:46px; height:46px; display:flex; align-items:center; justify-content:center; border-radius:10px; background: linear-gradient(180deg, rgba(76,175,80,0.10), rgba(76,175,80,0.04)); color:#4CAF50 }
        .stat .value{ font-size:20px; font-weight:800; color:#0b2f1f }
        .quick-actions{ margin-top:8px; background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,252,246,0.97)); padding:18px; border-radius:12px; box-shadow: 0 8px 30px rgba(11,47,26,0.04); border:1px solid rgba(9,30,14,0.03) }
        .actions-row{ display:flex; gap:20px; align-items:center }
        .btn{ flex:1; display:inline-flex; align-items:center; justify-content:center; gap:10px; padding:12px 16px; border-radius:12px; border:1px solid rgba(15,23,42,0.04); cursor:pointer; font-weight:700; font-size:14px }
  .btn-primary{ background: linear-gradient(180deg,#4CAF50,#43A047); color:#fff; box-shadow: 0 10px 24px rgba(76,175,80,0.18); border:none }
        .products-grid{ display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:18px }
        /* product card polish - aligns with shared card CSS but ensures hover + spacing here when management page hosts them */
        .product-card{ transition: transform .18s ease, box-shadow .18s ease }
        .product-card:hover{ transform:translateY(-6px); box-shadow:0 24px 48px rgba(11,47,26,0.07) }
  .product-image{ height:12rem; background:linear-gradient(180deg,#f1f8e9,#ffffff); display:flex; align-items:center; justify-content:center }
        .product-body{ padding:14px; display:flex; flex-direction:column }
        .product-title{ font-weight:800; color:#0b2f1f; margin:0 }
        .product-desc{ color:#6b7280; margin:6px 0; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden }
  .card-actions{ margin-top:.75rem; display:flex; gap:.5rem }
        .card-actions > *{ flex:1 }
        /* responsive tweaks */
        @media (max-width: 1000px){ .cards-row{ grid-template-columns: repeat(2, 1fr) } }
        @media (max-width: 640px){ .cards-row{ grid-template-columns: 1fr } .actions-row{ flex-direction:column } }
      `}</style>
  {/* Header with in-page tab selector removed; navbar dropdown controls tab */}

      <main className="mf-container content">
        {/* All roles can access management; features vary by role */}
        <>
            {tab === 'Overview' && (
              <>
                <section className="cards-row" aria-label="summary cards">
                  {stats.map(s => (
                    <article key={s.id} className="stat-card">
                      <div className="icon" aria-hidden>{s.icon}</div>
                      <div className="stat">
                        <div className="value">{s.value}</div>
                        <div className="title">{s.title}</div>
                        <div className="desc">{s.desc}</div>
                      </div>
                    </article>
                  ))}
                </section>

                <section className="quick-actions">
                  <h2>Manage your farm business efficiently</h2>
                  <div className="actions-row">
                    {isFarmer && (
                      <button className="btn btn-primary" aria-label="Add New Product" onClick={() => setShowAddModal(true)}>
                        <span className="btn-icon">+
                        </span>
                        <span>Add New Product</span>
                      </button>
                    )}

                    <div className="spacer" />

                    <button className="btn btn-ghost analytics-inline" aria-label="View Analytics">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" className="btn-svg">
                        <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 8l-7 7-5-5-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>View Analytics</span>
                    </button>
                  </div>
                </section>
              </>
            )}
            {isFarmer && tab === 'Products' && <MyProducts onAdd={() => setShowAddModal(true)} />}
            {isTransporter && tab === 'Pick Up' && (
              <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-emerald-800 mb-3">Pick Up</h2>
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <form
                    className="flex flex-col gap-4 md:flex-row md:items-end md:gap-4"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      const fromOk = typeof pickupFromDz === 'string' ? pickupFromDz.trim().length > 0 : (Array.isArray(pickupFromDz) && pickupFromDz.length > 0)
                      const toOk = Array.isArray(pickupToDz) && pickupToDz.length > 0
                      if (!fromOk || !toOk) {
                        show('Please fill both fields', { duration: 2500 })
                        return
                      }
                      try {
                        setPickupLoading(true)
                        setPickupResults([])
                        const cid = (() => {
                          try {
                            const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser')
                            if (raw) { const o = JSON.parse(raw); if (o?.cid) return o.cid }
                          } catch {}
                          return null
                        })()
                        const orders = await api.searchTransportOrders({ from: pickupFromDz, to: pickupToDz, cid })
                        setPickupResults(orders)
                        if (!orders.length) show('No matching orders found', { duration: 2500 })
                      } catch (err) {
                        console.error(err)
                        const msg = err?.body?.error || 'Search failed'
                        show(msg, { duration: 3000 })
                      } finally {
                        setPickupLoading(false)
                      }
                    }}
                  >
                    <div className="md:flex-1">
                      <SingleSelect
                        label="Your Location (Dzongkhag)"
                        id="pickupFromDz"
                        options={DZONGKHAGS}
                        value={pickupFromDz}
                        onChange={setPickupFromDz}
                        placeholder="Select Dzongkhag"
                      />
                    </div>

                    <div className="md:flex-1">
                      <MultiSelect
                        label="Destination (Dzongkhag)"
                        id="pickupToDz"
                        options={DZONGKHAGS}
                        values={pickupToDz}
                        onChange={setPickupToDz}
                        placeholder="Select one or more Dzongkhags"
                      />
                    </div>
                    <div className="pt-2 md:pt-0">
                      <Button type="submit" className="bg-emerald-700 hover:bg-emerald-600" disabled={pickupLoading}>
                        {pickupLoading ? 'Searching…' : 'Search'}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Results */}
                <div className="mt-4">
                  {pickupResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pickupResults.map(o => (
                        <div key={o.orderId} className="bg-white rounded-2xl border shadow-md p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-base text-emerald-700 font-semibold">Order #{o.orderId.slice(-6).toUpperCase()}</div>
                              <div className="text-sm text-slate-500">{new Date(o.createdAt).toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-emerald-700 text-2xl font-extrabold">Nu. {Number(o.totalPrice || 0).toFixed(0)}</div>
                              <div className="text-sm text-slate-500">{o.quantity} item(s)</div>
                            </div>
                          </div>
                          <div className="mt-4 text-base">
                            <div className="font-semibold text-slate-800 text-lg">{o.product?.name}</div>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-base">
                            <div className="text-slate-700">Farmer: {o.seller?.name || '—'}{o.seller?.phoneNumber ? ` • ${o.seller.phoneNumber}` : ''}</div>
                          </div>
                          <div className="mt-3">
                            <div className="text-slate-900 font-semibold">Consumer: {o.buyer?.name || '—'}</div>
                            <div className="text-slate-600 text-sm">
                              {(o.buyer?.location || '').trim()}
                              {o.buyer?.dzongkhag ? (o.buyer?.location ? `, ${o.buyer.dzongkhag}` : o.buyer.dzongkhag) : ''}
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <a href={o.buyer?.phoneNumber ? `tel:${o.buyer.phoneNumber}` : '#'}>Call Consumer</a>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              className="ml-auto"
                              onClick={async () => {
                                try {
                                  const me = (() => {
                                    try { const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'); return raw ? JSON.parse(raw) : null } catch { return null }
                                  })()
                                  const cid = me?.cid
                                  if (!cid) { show('Not authorized', { duration: 2500 }); return }
                                  const name = me?.name || ''
                                  const phoneNumber = me?.phoneNumber || ''
                                  await api.setOutForDelivery({ orderId: o.orderId, cid, name, phoneNumber })
                                  // remove from pickup list
                                  setPickupResults(prev => prev.filter(x => x.orderId !== o.orderId))
                                  // stay on the same tab; toast only
                                  show('Marked as Out for Delivery', { duration: 2500 })
                                } catch (err) {
                                  console.error(err)
                                  const msg = err?.body?.error || 'Failed to update order'
                                  show(msg, { duration: 3000 })
                                }
                              }}
                            >
                              Deliver
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !pickupLoading && (
                      <div className="rounded-xl border border-dashed bg-white p-8 text-center text-slate-600">
                        Matching orders will show here after search.
                      </div>
                    )
                  )}
                </div>
              </section>
            )}
            {isTransporter && tab === 'My Delivery' && (
              <MyDeliverySection />
            )}
            {showAddModal && (
                <AddProductModal
                  onClose={() => setShowAddModal(false)}
                  onSave={async (dto, id) => {
                    try {
                      if (id) {
                        await api.updateProduct(id, dto)
                        show('Product updated', { duration: 3000 })
                      } else {
                        await api.createProduct(dto)
                        show('Product created', { duration: 3000 })
                      }
                      // switch to Products tab if farmer; otherwise go to Orders
                      setTab(isFarmer ? 'Products' : 'Orders')
                    } catch (e) {
                      console.error(e)
                      const body = e?.body
                      let msg = 'Save failed'
                      if (body) {
                        if (typeof body === 'string') msg = body
                        else if (body.error) msg = body.error
                        else msg = JSON.stringify(body)
                      }
                      show(msg, { duration: 4000 })
                    } finally {
                      setShowAddModal(false)
                    }
                  }}
                />
            )}
            {tab === 'Orders' && <Orders />}
            {tab === 'Profile' && <Profile />}
        </>
      </main>
    </div>
  )
}

function MyDeliverySection() {
  const { show } = useToast()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [view, setView] = useState('in-progress') // 'in-progress' | 'delivered'

  const getMe = () => {
    try {
      const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const load = async () => {
    try {
      setLoading(true)
      const me = getMe()
      const cid = me?.cid
      if (!cid) { setItems([]); return }
      const orders = await api.fetchMyTransports({ cid })
      setItems(orders)
    } catch (e) {
      console.error(e)
      show('Failed to load deliveries', { duration: 3000 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const inProgress = items.filter(o => String(o.status).toLowerCase() === 'out_for_delivery' || String(o.status).toLowerCase() === 'out for delivery' || String(o.status).toLowerCase() === 'out-for-delivery' || String(o.status).toLowerCase() === 'outfordelivery' || String(o.status).toLowerCase() === 'out_for_delivery'.replace(/_/g,''))
  const done = items.filter(o => String(o.status).toLowerCase() === 'delivered')
  const filtered = view === 'delivered' ? done : inProgress
  const selectedLabel = view === 'delivered' ? 'Delivered' : 'In Progress'

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-2xl font-bold text-emerald-800">My Delivery</h2>
        <Button size="sm" variant="outline" onClick={load}>Refresh</Button>
        <div className="ml-auto w-56">
          <SingleSelect
            label="Filter"
            id="deliveryFilter"
            options={[ 'In Progress', 'Delivered' ]}
            value={selectedLabel}
            onChange={(label) => setView(label === 'Delivered' ? 'delivered' : 'in-progress')}
          />
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border bg-white p-6 text-slate-600">Loading…</div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border bg-white p-6 text-slate-600">{view === 'delivered' ? 'No delivered orders yet.' : 'No active deliveries.'}</div>
      )}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(o => (
          <article key={o.orderId} className="bg-white rounded-2xl border shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-base text-emerald-700 font-semibold">Order #{String(o.orderId).slice(-6).toUpperCase()}</div>
                <div className="text-sm text-slate-500">{new Date(o.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-emerald-700 text-2xl font-extrabold">Nu. {Number(o.totalPrice || 0).toFixed(0)}</div>
                <div className="text-sm text-slate-500">{o.quantity} item(s)</div>
              </div>
            </div>
            <div className="mt-4 text-base">
              <div className="font-semibold text-slate-800 text-lg">{o.product?.name}</div>
            </div>
            <div className="mt-3">
              <div className="text-slate-900 font-semibold">Consumer: {o.buyer?.name || '—'}</div>
              <div className="text-slate-600 text-sm">
                {(o.buyer?.location || '').trim()}
                {o.buyer?.dzongkhag ? (o.buyer?.location ? `, ${o.buyer.dzongkhag}` : o.buyer.dzongkhag) : ''}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href={o.buyer?.phoneNumber ? `tel:${o.buyer.phoneNumber}` : '#'}>Call Consumer</a>
              </Button>
              {view === 'in-progress' ? (
                <Button size="sm" variant="outline" className="ml-auto" asChild>
                  <a href={o.seller?.phoneNumber ? `tel:${o.seller.phoneNumber}` : '#'}>Call Farmer</a>
                </Button>
              ) : (
                <span className="ml-auto inline-block text-xs font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">Delivered</span>
              )}
            </div>
          </article>
        ))}
        </div>
      )}
    </section>
  )
}

export default Management