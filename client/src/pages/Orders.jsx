import React from 'react'
import './Management.css'

const sampleOrders = [] // start empty for placeholder

export default function Orders(){
  const orders = sampleOrders

  if (!orders || orders.length === 0) {
    return (
      <section className="orders-placeholder">
        <div className="placeholder-card large">
          <h3>Recent Orders</h3>
          <p className="subtitle">Track and manage your customer orders</p>
          <div className="placeholder-body">
            <div className="placeholder-icon">📦</div>
            <h4>No orders yet</h4>
            <p>Orders from customers will appear here once they start purchasing your products.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="orders-table">
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Customer Location</th>
            <th>Quantity</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>{o.product}</td>
              <td>{o.location}</td>
              <td>{o.quantity}</td>
              <td>{o.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
