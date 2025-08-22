import React, { useState } from 'react'
import './Management.css'

export default function Profile(){
  const [form, setForm] = useState({
    fullName: '',
    farmName: '',
    farmLocation: '',
    farmDesc: '',
    phone: '',
    email: '',
    picture: null,
    picturePreview: null
  })

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    setForm({ ...form, picture: f, picturePreview: url })
  }

  const onSubmit = (e) => {
    e.preventDefault()
    alert('Profile updated (mock)')
  }

  return (
    <section className="profile-page">
      <form className="profile-form" onSubmit={onSubmit}>
        <div className="profile-top">
          <div className="picture-uploader">
            <div className="preview">{form.picturePreview ? <img src={form.picturePreview} alt="preview" /> : <div className="placeholder-img">Preview</div>}</div>
            <input type="file" accept="image/*" onChange={onFile} />
          </div>

          <div className="fields">
            <label>Full Name
              <input name="fullName" value={form.fullName} onChange={onChange} /></label>
            <label>Farm Name
              <input name="farmName" value={form.farmName} onChange={onChange} /></label>
            <label>Farm Location
              <input name="farmLocation" value={form.farmLocation} onChange={onChange} /></label>
          </div>
        </div>

        <label>Farm Description
          <textarea name="farmDesc" value={form.farmDesc} onChange={onChange} /></label>

        <div className="contact-row">
          <label>Phone Number
            <input name="phone" value={form.phone} onChange={onChange} /></label>

          <label>Email Address
            <input name="email" value={form.email} onChange={onChange} /></label>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit">Update Profile</button>
        </div>
      </form>
    </section>
  )
}
