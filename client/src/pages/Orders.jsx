import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Box } from "lucide-react" // cube icon
import api from "@/lib/api"

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api
      .fetchOrders?.()
      .then((list) => {
        if (!mounted) return
        setOrders(list || [])
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))

    return () => {
      mounted = false
    }
  }, [])

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
          <h2 className="orders-title">My Orders</h2>
        </div>

        {/* Empty State */}
        {orders.length === 0 && !loading ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl shadow-sm border border-dashed border-gray-300">
            <Box className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">
              No orders yet
            </h3>
            <p className="text-gray-500 mb-6">
              Orders from customers will appear here once they start purchasing
              your products.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Later you can map over orders here */}
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-6 bg-white rounded-xl shadow-sm border"
              >
                <h4 className="font-semibold text-gray-800">
                  Order #{order.id}
                </h4>
                <p className="text-sm text-gray-500">
                  {order.items?.length} items • {order.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
