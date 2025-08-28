import React from 'react'
import Card from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function downloadDataUrl(dataUrl, filename){
  try {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch {}
}

export default function OrderResultModal({ open, onClose, orders }){
  if (!open) return null
  const list = Array.isArray(orders) ? orders : (orders ? [orders] : [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="max-w-3xl w-full">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-emerald-900">Order placed</h2>
              <p className="text-slate-600">Save your QR code{list.length > 1 ? 's' : ''} for pickup or verification.</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map((o) => (
              <div key={o.orderId || o._id} className="border rounded-md p-3">
                <div className="text-slate-800 font-medium">{o?.product?.productName}</div>
                <div className="text-slate-600 text-sm">Qty: {o?.quantity} • Total: Nu. {Number(o?.totalPrice||0).toFixed(2)}</div>
                {o?.qrCodeDataUrl && (
                  <div className="mt-3">
                    <img
                      src={o.qrCodeDataUrl}
                      alt="Order QR"
                      className="w-40 h-40 border rounded-md bg-white"
                    />
                    <div className="mt-2">
                      <Button
                        size="sm"
                        className="bg-emerald-700 hover:bg-emerald-600"
                        onClick={() => downloadDataUrl(o.qrCodeDataUrl, `order-${o.orderId||o._id}.png`)}
                      >
                        Download QR
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
