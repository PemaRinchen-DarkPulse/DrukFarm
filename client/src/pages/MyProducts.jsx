import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'
import api from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import AddProductModal from '@/components/AddProductModal'

const sampleProducts = [
  {
    id: 1,
    title: 'Organic Red Rice',
    desc: 'Premium red rice from Thimphu hills',
    price: 120,
    unit: 'kg',
    stock: 25,
    image: null
  },
  {
    id: 2,
    title: 'Fresh Chili Peppers',
    desc: 'Spicy chili peppers, handpicked',
    price: 80,
    unit: 'kg',
    stock: 0,
    image: null
  },
  {
    id: 3,
    title: 'Mountain Potatoes',
    desc: 'Crisp mountain potatoes',
    price: 45,
    unit: 'kg',
    stock: 5,
    image: null
  }
]

export default function MyProducts({ onAdd }) {
  const [products, setProducts] = useState(sampleProducts)
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api.fetchProducts()
      .then(list => {
        if (!mounted) return
        setProducts(
          list.map(p => ({
            id: p.productId,
            title: p.productName,
            desc: p.description,
            price: p.price,
            unit: p.unit,
            stock: p.stockQuantity,
            image: p.productImageBase64
              ? `data:image/*;base64,${p.productImageBase64}`
              : null,
            categoryId: p.categoryId,
            categoryName: p.categoryName
          }))
        )
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  const onDelete = async id => {
    try {
      await api.deleteProduct(id)
      setProducts(products.filter(p => p.id !== id))
    } catch (e) {
      console.error(e)
      alert('Delete failed')
    }
  }

  const onEdit = id => {
    if (onAdd && typeof onAdd === 'function') onAdd(id)
  }

  const handleSave = async (dto, productId) => {
    try {
      if (productId) {
        const updated = await api.updateProduct(productId, dto)
        setProducts(prev =>
          prev.map(p =>
            p.id === productId
              ? {
                  id: updated.productId || productId,
                  title: updated.productName,
                  desc: updated.description,
                  price: updated.price,
                  unit: updated.unit,
                  stock: updated.stockQuantity,
                  image: updated.productImageBase64
                    ? `data:image/*;base64,${updated.productImageBase64}`
                    : null,
                  categoryId: updated.categoryId,
                  categoryName: updated.categoryName
                }
              : p
          )
        )
      } else {
        const created = await api.createProduct(dto)
        const mapped = {
          id: created.productId,
          title: created.productName,
          desc: created.description,
          price: created.price,
          unit: created.unit,
          stock: created.stockQuantity,
          image: created.productImageBase64
            ? `data:image/*;base64,${created.productImageBase64}`
            : null,
          categoryId: created.categoryId,
          categoryName: created.categoryName
        }
        setProducts(prev => [mapped, ...prev])
      }
      setShowAdd(false)
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  return (
    <section className="my-products">
      <style>{`
        .my-products .products-header{ display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:18px }
        .my-products .products-title{ font-size:26px; color:#0b2f1f; margin:0; font-weight:800 }
        .my-products .add-product-btn{ display:inline-flex; align-items:center; gap:14px; padding:22px 28px; border-radius:999px; background: linear-gradient(180deg,#2e8b57,#256a44); color:#fff; border:none; box-shadow:0 12px 30px rgba(46,139,87,0.12); cursor:pointer; transition:transform .15s ease, box-shadow .15s ease }
        .my-products .add-product-btn:hover{ transform:translateY(-3px); box-shadow:0 20px 46px rgba(46,139,87,0.14) }
        .my-products .products-header{ padding-top:6px }
        .my-products .add-product-btn .btn-icon{ margin-right:6px; font-weight:800; font-size:20px; }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="products-header">
          <h2 className="products-title">My Products</h2>
          <Button
            className="add-product-btn btn-primary"
            onClick={() => {
              if (onAdd) onAdd()
              setShowAdd(true)
            }}
          >
            <span className="btn-icon">+</span>
            <span>Add Product</span>
          </Button>
        </div>

        {showAdd && (
          <AddProductModal
            onClose={() => setShowAdd(false)}
            onSave={handleSave}
          />
        )}

        {products.length === 0 && !loading ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl shadow-sm border border-dashed border-gray-300">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">
              You don’t have any products yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start by adding your first product to showcase and sell.
            </p>
            <Button
              onClick={() => setShowAdd(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md"
            >
              + Add Your First Product
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => (
              <ProductCard key={p.id} product={p}>
                <Button
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center justify-center gap-2"
                  onClick={() => onEdit(p.id)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  className="inline-flex items-center justify-center gap-2"
                  onClick={() => onDelete(p.id)}
                >
                  Delete
                </Button>
              </ProductCard>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
