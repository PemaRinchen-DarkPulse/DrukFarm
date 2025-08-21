import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import Card from '@/components/ui/card'

export default function Dashboard(){
  const { state } = useLocation()
  const role = state?.role || 'consumer'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <h1 className="text-2xl font-semibold">Welcome to your dashboard</h1>
          <p className="mt-2 text-slate-600">You are signed in as <strong className="capitalize">{role}</strong>.</p>

          <div className="mt-4 space-y-2">
            {role === 'farmer' && <p>View and manage your crop listings.</p>}
            {role === 'restaurant' && <p>Browse suppliers and place bulk orders.</p>}
            {role === 'hotel' && <p>Connect with local farms for sustainable produce.</p>}
            {role === 'admin' && <p>Admin panel: manage users and listings.</p>}
            {role === 'consumer' && <p>Shop fresh produce from local farmers.</p>}
          </div>

          <div className="mt-4">
            <Link to="/" className="text-emerald-600 hover:underline">Back to home</Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
