import React, { useState } from 'react'
import './Management.css'
import MyProducts from './MyProducts'
import Orders from './Orders'
import Profile from './Profile'
import AddProductModal from '@/components/AddProductModal'

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
                onSave={(product) => {
                  // temporary: log the product; real integration would add it to the product list
                  console.log('New product saved:', product)
                  setShowAddModal(false)
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