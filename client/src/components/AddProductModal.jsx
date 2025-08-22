import React, { useState } from 'react'
import '../pages/Management.css'

export default function AddProductModal({ onClose, onSave }){
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Dairy & Honey')
  const [desc, setDesc] = useState('')
  const [price, setPrice] = useState(0)
  const [unit, setUnit] = useState('kg')
  const [stock, setStock] = useState(0)
  const [images, setImages] = useState([])

  const submit = (e) => {
    e.preventDefault()
    const product = { title, category, desc, price: Number(price || 0), unit, stock: Number(stock || 0), images }
    if (onSave) onSave(product)
  }

  const onFiles = (files) => {
    const list = Array.from(files).slice(0, 6)
    setImages(list)
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Add New Product</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <div className="form-grid">
            <label>
              <div className="label-title">Product Name</div>
              <input placeholder="Enter product name" required value={title} onChange={e => setTitle(e.target.value)} />
            </label>

            <label>
              <div className="label-title">Category</div>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option>Dairy & Honey</option>
                <option>Fruits & Vegetables</option>
                <option>Grains & Cereals</option>
                <option>Meat & Eggs</option>
                <option>Spices</option>
              </select>
            </label>
          </div>

          <label>
            <div className="label-title">Description</div>
            <textarea placeholder="Describe your product..." rows={4} value={desc} onChange={e => setDesc(e.target.value)} />
          </label>

          <div className="form-grid three">
            <label>
              <div className="label-title">Price (Nu.)</div>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} />
            </label>

            <label>
              <div className="label-title">Unit</div>
              <select value={unit} onChange={e => setUnit(e.target.value)}>
                <option>kg</option>
                <option>g</option>
                <option>piece</option>
                <option>litre</option>
              </select>
            </label>

            <label>
              <div className="label-title">Stock Quantity</div>
              <input type="number" value={stock} onChange={e => setStock(e.target.value)} />
            </label>
          </div>

          <div>
            <div className="label-title">Product Images</div>
            <label className="upload-dropzone">
              <input type="file" accept="image/*" multiple onChange={e => onFiles(e.target.files)} />
              <div className="upload-inner">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16V4" stroke="#2e8b57" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 12l7-7 7 7" stroke="#2e8b57" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div className="upload-text">Click to upload or drag and drop</div>
                <div className="upload-sub">PNG, JPG, GIF up to 10MB</div>
              </div>
            </label>
          </div>

          <div className="modal-actions full-width">
            <button type="submit" className="btn btn-primary big">Add Product</button>
          </div>
        </form>
      </div>
    </div>
  )
}
