import React, { useState } from 'react'
import MyProducts from './MyProducts'
import Orders from './Orders'
import Profile from './Profile'
import AddProductModal from '@/components/AddProductModal'
import api from '@/lib/api'
import { useToast } from '@/components/ui/toast'

const Management = () => {
  // Robust farmer detection: check role/user in storage and decode JWTs
  const isFarmer = () => {
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
    const keys = ['role', 'user', 'authUser', 'currentUser']
    for (const k of keys) {
      try {
        const v = localStorage.getItem(k) || sessionStorage.getItem(k)
        if (!v) continue
        if (containsFarmer(v)) return true
        // try parse json
        try {
          const p = JSON.parse(v)
          if (containsFarmer(p)) return true
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
            if (containsFarmer(json)) return true
          } catch (e) {}
        }
      } catch (e) {}
    }

    return false
  }

  const farmer = isFarmer()

  const [tab, setTab] = useState('Overview')
  const [showAddModal, setShowAddModal] = useState(false)
  const { show } = useToast()

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
        .mf-container{ max-width: 1280px; margin: 0 auto; padding: 28px 28px; }
        .mf-navbar{ background: rgba(255,255,255,0.96); backdrop-filter: blur(6px); box-shadow: 0 8px 30px rgba(11,47,26,0.04); border-radius: 14px; margin: 18px auto; padding: 10px 0; border: 1px solid rgba(9,30,14,0.03); }
        .tabs{ list-style:none; display:flex; gap:12px; padding:0; margin:0; align-items:center }
        .tab{ padding:8px 14px; border-radius:999px; color:#6b7280; cursor:pointer; font-weight:700; transition:all .18s ease }
        .tab:hover{ transform:translateY(-2px) }
        .tab.active{ background:#2e8b57; color:white; box-shadow: 0 10px 24px rgba(46,139,87,0.12) }
        .cards-row{ display:grid; grid-template-columns: repeat(4, 1fr); gap:18px; margin-bottom:18px }
        .stat-card{ background:white; border-radius:12px; padding:18px; display:flex; align-items:center; gap:12px; box-shadow: 0 8px 30px rgba(11,47,26,0.04); transition:transform .18s ease, box-shadow .18s ease }
        .stat-card:hover{ transform:translateY(-6px); box-shadow:0 20px 40px rgba(11,47,26,0.06) }
        .icon{ width:46px; height:46px; display:flex; align-items:center; justify-content:center; border-radius:10px; background: linear-gradient(180deg, rgba(46,139,87,0.06), rgba(46,139,87,0.02)); color:#2e8b57 }
        .stat .value{ font-size:20px; font-weight:800; color:#0b2f1f }
        .quick-actions{ margin-top:8px; background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,252,246,0.97)); padding:18px; border-radius:12px; box-shadow: 0 8px 30px rgba(11,47,26,0.04); border:1px solid rgba(9,30,14,0.03) }
        .actions-row{ display:flex; gap:20px; align-items:center }
        .btn{ flex:1; display:inline-flex; align-items:center; justify-content:center; gap:10px; padding:12px 16px; border-radius:12px; border:1px solid rgba(15,23,42,0.04); cursor:pointer; font-weight:700; font-size:14px }
        .btn-primary{ background: linear-gradient(180deg,#2e8b57,#256a44); color:#fff; box-shadow: 0 10px 24px rgba(46,139,87,0.12); border:none }
        .products-grid{ display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:18px }
        /* product card polish - aligns with shared card CSS but ensures hover + spacing here when management page hosts them */
        .product-card{ transition: transform .18s ease, box-shadow .18s ease }
        .product-card:hover{ transform:translateY(-6px); box-shadow:0 24px 48px rgba(11,47,26,0.07) }
        .product-image{ height:16rem; background:linear-gradient(180deg,#f6fbf7,#ffffff); display:flex; align-items:center; justify-content:center }
        .product-body{ padding:14px; display:flex; flex-direction:column }
        .product-title{ font-weight:800; color:#0b2f1f; margin:0 }
        .product-desc{ color:#6b7280; margin:6px 0; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden }
  .card-actions{ margin-top:.75rem; display:flex; gap:.5rem }
        .card-actions > *{ flex:1 }
        /* responsive tweaks */
        @media (max-width: 1000px){ .cards-row{ grid-template-columns: repeat(2, 1fr) } }
        @media (max-width: 640px){ .cards-row{ grid-template-columns: 1fr } .actions-row{ flex-direction:column } }
      `}</style>
      <header className="mf-navbar">
        <div className="mf-container">
          <nav>
            <ul className="tabs">
              <li
                className={`tab ${tab === 'Overview' ? 'active' : ''}`}
                onClick={() => setTab('Overview')}
              >Overview</li>
              <li
                className={`tab ${tab === 'Products' ? 'active' : ''}`}
                onClick={() => setTab('Products')}
              >Products</li>
              <li
                className={`tab ${tab === 'Orders' ? 'active' : ''}`}
                onClick={() => setTab('Orders')}
              >Orders</li>
              <li
                className={`tab ${tab === 'Profile' ? 'active' : ''}`}
                onClick={() => setTab('Profile')}
              >Profile</li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="mf-container content">
        {!farmer ? (
          <div className="access-denied">
            <h3>Access restricted</h3>
            <p>This area is available only to farmer accounts. Please switch to a farmer account or contact support for access.</p>
          </div>
        ) : (
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
                    <button className="btn btn-primary" aria-label="Add New Product" onClick={() => setShowAddModal(true)}>
                      <span className="btn-icon">+
                      </span>
                      <span>Add New Product</span>
                    </button>

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

            {tab === 'Products' && <MyProducts onAdd={() => setShowAddModal(true)} />}
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
                      // switch to Products tab and show MyProducts
                      setTab('Products')
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
        )}
      </main>
    </div>
  )
}

export default Management