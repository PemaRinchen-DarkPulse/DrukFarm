import React, { useState, useEffect } from 'react'
import api from '@/lib/api'
import { getCurrentCid } from '@/lib/auth'
import { useToast } from "@/components/ui/toast"

export default function AddProductModal({ onClose, onSave, initial }) {
  const { show } = useToast()  // ✅ init toast

  const [title, setTitle] = useState(initial?.productName || '')
  const [category, setCategory] = useState(initial?.categoryName || '')
  const [desc, setDesc] = useState(initial?.description || '')
  const [price, setPrice] = useState(initial?.price || '')
  const [unit, setUnit] = useState(initial?.unit || '')
  const [stock, setStock] = useState(initial?.stockQuantity || '')
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const [categories, setCategories] = useState([])
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const toBase64 = (file) => new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result.split(',')[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })

  const submit = async (e) => {
    e.preventDefault()

    // ✅ validation checks
    if (!title.trim()) { alert('Please enter a product name'); return }
    if (!category) { alert('Please select a category'); return }
  if (!desc.trim() || desc.length < 70) { alert('Description must be at least 70 characters'); return }
  if (desc.length > 150) { alert('Description cannot exceed 150 characters'); return }
    if (!price || Number(price) <= 0) { alert('Price must be greater than 0'); return }
    if (!unit) { alert('Please select a unit'); return }
    if (!stock || Number(stock) < 0) { alert('Stock cannot be negative'); return }
    if (images.length === 0) { alert('Please upload at least one image'); return }

    setSubmitting(true)
    let imgBase64 = null
    try { imgBase64 = await toBase64(images[0]) } 
    catch (err) { console.error('Image conversion failed', err) }

    const sel = categories.find(c => c.categoryName === category)
    const categoryId = sel ? sel.categoryId : initial?.categoryId || null

    const dto = {
      productName: title,
      categoryId,
      description: desc,
      price: Number(price),
      unit,
      stockQuantity: Number(stock),
      productImageBase64: imgBase64,
      createdBy: getCurrentCid()
    }

    if (onSave) {
      try { 
        await onSave(dto, initial?.productId)

  // ✅ success toast + timed redirect matching toast auto-dismiss
  const duration = 2000
  show(initial ? "✅ Product updated successfully" : "✅ Product added successfully", { duration })

  // ✅ close modal now; redirect after toast hides
  onClose()
  setTimeout(() => { window.location.href = "/management?tab=products" }, duration + 100)

      } catch (err) {
        console.error(err)
        const body = err?.body
        let msg = 'Save failed'
        if (body) msg = typeof body === 'string' ? body : (body.error || JSON.stringify(body))

  show(`❌ Save failed: ${msg}`)

      } finally { setSubmitting(false) }
    }
  }

  const handleDescChange = (value) => {
    if (value.length > 150) value = value.slice(0, 150)
    setDesc(value)
  }

  const onFiles = (files) => {
    const MAX_IMG_BYTES = 10 * 1024 * 1024
    const raw = Array.from(files).slice(0, 4)
    const list = raw.filter(f => {
      if (f.size > MAX_IMG_BYTES) { alert(`${f.name} is too large (max 10MB)`); return false }
      return true
    })
    setImages(prev => {
      const combined = [...prev, ...list].slice(0, 4)
      const urls = combined.map(f => ({ name: f.name, url: URL.createObjectURL(f) }))
      setPreviews(prevPre => { prevPre.forEach(p => URL.revokeObjectURL(p.url)); return urls })
      return combined
    })
  }

  const removeImage = (index) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== index)
      setPreviews(prevPre => {
        prevPre[index] && URL.revokeObjectURL(prevPre[index].url)
        return next.map(f => ({ name: f.name, url: URL.createObjectURL(f) }))
      })
      return next
    })
  }

  useEffect(() => { return () => previews.forEach(p => URL.revokeObjectURL(p.url)) }, [previews])

  useEffect(() => {
    let mounted = true
    api.fetchCategories().then(list => { if (mounted) setCategories(list) }).catch(console.error)
    return () => mounted = false
  }, [])

  const createCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      const created = await api.createCategory({ categoryName: newCategoryName })
      setCategories(prev => [...prev, created])
      setCategory(created.categoryName)
      setNewCategoryName('')
      setCreatingCategory(false)
    } catch (e) { console.error(e); alert('Create category failed') }
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-60 p-6" role="dialog" aria-modal="true">
      <div className="bg-white max-w-3xl w-full rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold" style={{ color: '#4CAF50' }}>{initial ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="text-2xl leading-none" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="p-5 flex flex-col gap-3" onSubmit={submit}>
          {/* Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col">
              <span className="text-sm font-medium text-gray-700 mb-1">Product Name</span>
              <input className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#A5D6A7]"
                placeholder="Enter product name" value={title} onChange={e => setTitle(e.target.value)} required />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium text-gray-700 mb-1">Category</span>
              <select className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#A5D6A7]"
                value={creatingCategory ? '__create__' : category}
                onChange={e => {
                  const v = e.target.value
                  if (v === '__create__') { setCreatingCategory(true); setNewCategoryName('') }
                  else { setCreatingCategory(false); setCategory(v) }
                }} required>
                <option value="">-- Select category --</option>
                {categories.map(c => <option key={c.categoryId} value={c.categoryName}>{c.categoryName}</option>)}
                <option value="__create__">+ Create new...</option>
              </select>
            </label>
          </div>

          {/* Description */}
          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 mb-1">Description</span>
            <textarea className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#A5D6A7] min-h-[110px] resize-y"
              placeholder="Describe your product..."
              value={desc}
              onChange={e => handleDescChange(e.target.value)}
              minLength={70}
              maxLength={150}
              required
            />
            <span className={`text-xs mt-1 text-right ${desc.length < 70 || desc.length > 150 ? 'text-red-500' : 'text-gray-500'}`}>
              {desc.length}/150 (Min 70 required)
            </span>
          </label>

          {/* Price, Unit, Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex flex-col">
              <span className="text-sm font-medium text-gray-700 mb-1">Price (Nu.)</span>
              <input type="number" className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#A5D6A7]"
                value={price} onChange={e => setPrice(e.target.value)} min={0.01} step={0.01} required />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium text-gray-700 mb-1">Unit</span>
              <select className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#A5D6A7]"
                value={unit} onChange={e => setUnit(e.target.value)} required>
                <option value="">Select unit</option>
                <option>kg</option>
                <option>g</option>
                <option>piece</option>
                <option>litre</option>
              </select>
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium text-gray-700 mb-1">Stock Quantity</span>
              <input type="number" className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#A5D6A7]"
                value={stock} onChange={e => setStock(e.target.value)} min={0} required />
            </label>
          </div>

          {/* Image Upload */}
          <div>
            <span className="text-sm font-medium text-gray-700 mb-1 block">Product Images</span>
            <label className="w-full border-2 border-dashed border-gray-300 rounded-xl min-h-[86px] flex flex-col items-center justify-center p-5 mt-2 cursor-pointer hover:border-[#4CAF50] transition-all duration-200"
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#4CAF50' }}
              onDragLeave={e => { e.currentTarget.style.borderColor = '' }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = ''; onFiles(e.dataTransfer.files) }}>
              <input type="file" accept="image/*" multiple onChange={e => onFiles(e.target.files)} className="hidden" required />
              <div className="flex flex-col items-center gap-2 text-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M12 16V4" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 12l7-7 7 7" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[#388E3C] font-semibold">Click to upload or drag and drop</span>
                <span className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB — up to 4 images</span>
              </div>
            </label>

            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {previews.map((p, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden shadow-md">
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    <button type="button" className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center" onClick={() => removeImage(idx)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action */}
          <div className="flex justify-end mt-4">
            <button type="submit" className="px-4 py-2 rounded-lg text-white font-semibold" style={{ backgroundColor: '#4CAF50' }} disabled={submitting}>
              {submitting ? 'Saving…' : (initial ? 'Save changes' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>

      {/* Category Mini Modal */}
      {creatingCategory && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-70">
          <div className="bg-white max-w-md w-full rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Create new category</h3>
              <button className="text-2xl" onClick={() => { setCreatingCategory(false); setNewCategoryName('') }} aria-label="Close">×</button>
            </div>
            <p className="text-xs text-gray-500 mb-2">Enter the category name to add it to your catalog.</p>
            <input className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-gray-50 mb-3 focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#A5D6A7]"
              placeholder="Category name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} required />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded-lg text-white" style={{ backgroundColor: '#4CAF50' }} onClick={createCategory}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
