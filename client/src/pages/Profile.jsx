import React, { useEffect, useMemo, useState } from 'react'
import Card from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  User as UserIcon,
  Edit3,
  Shield,
  Users2,
  Bell,
  CreditCard,
  Database,
} from 'lucide-react'

function initialsFromName(name = '') {
  if (!name) return 'U'
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || 'U'
}

export default function Profile() {
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    cid: '',
    gender: '',
    role: '',
    phone: '',
    location: '',
    dzongkhag: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      sms: false,
      appPush: false,
      orderUpdates: false,
    },
  })

  const dzongkhags = [
    'Thimphu','Paro','Punakha','Wangdue Phodrang','Chukha','Samtse','Haa','Gasa',
    'Bumthang','Mongar','Lhuentse','Trashigang','Trashiyangtse','Zhemgang',
    'Sarpang','Dagana','Pemagatshel','Tsirang','Trongsa','Lhuntse'
  ]

  const genders = ['Male', 'Female', 'Other']

  const sideTabs = [
    { key: 'personal', label: 'Personal Information', icon: UserIcon },
    { key: 'security', label: 'Account Security', icon: Shield },
    { key: 'payment', label: 'Payment Information', icon: CreditCard },
    { key: 'notification', label: 'Notification Preferences', icon: Bell },
    { key: 'privacy', label: 'Privacy & Permissions', icon: Database },
    { key: 'support', label: 'Support & Feedback', icon: Users2 },
  ]

  // --- Load user ---
  useEffect(() => {
    try {
      const raw = localStorage.getItem('currentUser')
      const parsedUser = raw ? JSON.parse(raw) : null
      setUser(parsedUser)
    } catch {
      setUser(null)
    }
  }, [])

  const parsed = useMemo(() => {
    const name = user?.name || 'Jack Adoma'
    const [firstName, ...rest] = name.split(' ')
    const lastName = rest.join(' ') || 'Adoma'
    return {
      name,
      firstName,
      lastName,
      phone: user?.phone || '(202) 555-0194',
      role: user?.role || 'Product Designer',
      location: user?.location || 'Los Angeles, California, USA',
      dzongkhag: user?.dzongkhag || '',
      gender: user?.gender || '',
      notifications: user?.notifications || {
        sms: false,
        appPush: false,
        orderUpdates: false,
      },
    }
  }, [user])

  useEffect(() => {
    setFormData({
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      cid: user?.cid || '',
      gender: parsed.gender,
      role: parsed.role,
      phone: parsed.phone,
      location: parsed.location,
      dzongkhag: parsed.dzongkhag,
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      notifications: parsed.notifications,
    })
  }, [parsed, user])

  // --- Handle changes ---
  function handleChange(e) {
    const { name, value, type, checked } = e.target
    if (name.startsWith('notifications.')) {
      const key = name.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, [key]: checked },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  function handleEditClick() {
    if (isEditing) {
      const updatedUser = {
        ...user,
        name: `${formData.firstName} ${formData.lastName}`,
        cid: formData.cid,
        gender: formData.gender,
        role: formData.role,
        phone: formData.phone,
        location: formData.location,
        dzongkhag: formData.dzongkhag,
        notifications: formData.notifications
      }
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      setUser(updatedUser)
    }
    setIsEditing(!isEditing)
  }

  // --- Render tab content ---
  function renderTabContent() {
    switch(activeTab) {
      case 'personal':
        return (
          <form className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs uppercase text-foreground/60">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full mt-1 text-[15px] border rounded px-2 py-1 ${
                    isEditing ? "border-gray-300 bg-white" : "border-transparent bg-transparent"
                  }`}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs uppercase text-foreground/60">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full mt-1 text-[15px] border rounded px-2 py-1 ${
                    isEditing ? "border-gray-300 bg-white" : "border-transparent bg-transparent"
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs uppercase text-foreground/60">My CID</label>
                <input
                  type="text"
                  name="cid"
                  value={formData.cid}
                  readOnly
                  className="w-full mt-1 text-[15px] border border-transparent bg-transparent px-2 py-1"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs uppercase text-foreground/60">Gender</label>
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full mt-1 text-[15px] border rounded px-2 py-1 ${
                    isEditing ? "border-gray-300 bg-white" : "border-transparent bg-transparent"
                  }`}
                >
                  <option value="">Select Gender</option>
                  {genders.map((g, idx) => (
                    <option key={idx} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs uppercase text-foreground/60">Job Title</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full mt-1 text-[15px] border rounded px-2 py-1 ${
                    isEditing ? "border-gray-300 bg-white" : "border-transparent bg-transparent"
                  }`}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs uppercase text-foreground/60">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full mt-1 text-[15px] border rounded px-2 py-1 ${
                    isEditing ? "border-gray-300 bg-white" : "border-transparent bg-transparent"
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs uppercase text-foreground/60">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full mt-1 text-[15px] border rounded px-2 py-1 ${
                    isEditing ? "border-gray-300 bg-white" : "border-transparent bg-transparent"
                  }`}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs uppercase text-foreground/60">Dzongkhag</label>
                <select
                  name="dzongkhag"
                  value={formData.dzongkhag || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full mt-1 text-[15px] border rounded px-2 py-1 ${
                    isEditing ? "border-gray-300 bg-white" : "border-transparent bg-transparent"
                  }`}
                >
                  <option value="">Select Dzongkhag</option>
                  {dzongkhags.map((dz, idx) => (
                    <option key={idx} value={dz}>{dz}</option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        )

      case 'security':
        return (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
                alert('Please fill in all fields.')
                return
              }
              if (formData.newPassword !== formData.confirmPassword) {
                alert('New password and confirmation do not match.')
                return
              }
              const updatedUser = { ...user, password: formData.newPassword }
              localStorage.setItem('currentUser', JSON.stringify(updatedUser))
              setUser(updatedUser)
              alert('Password changed successfully!')
              setFormData((prev) => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }))
            }}
          >
            <div>
              <label className="text-xs uppercase text-foreground/60">Old Password</label>
              <input
                type="password"
                name="oldPassword"
                value={formData.oldPassword || ''}
                onChange={handleChange}
                className="w-full mt-1 text-[15px] border border-gray-300 rounded px-2 py-1"
              />
            </div>

            <div>
              <label className="text-xs uppercase text-foreground/60">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword || ''}
                onChange={handleChange}
                className="w-full mt-1 text-[15px] border border-gray-300 rounded px-2 py-1"
              />
            </div>

            <div>
              <label className="text-xs uppercase text-foreground/60">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword || ''}
                onChange={handleChange}
                className="w-full mt-1 text-[15px] border border-gray-300 rounded px-2 py-1"
              />
            </div>

            <Button type="submit">Change Password</Button>
          </form>
        )

      case 'notification':
        return (
          <div className="space-y-4">
            {[
              { key: 'sms', label: 'SMS alerts' },
              { key: 'appPush', label: 'App push notifications' },
              { key: 'orderUpdates', label: 'Order updates vs promotional updates' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground/80">{label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    name={`notifications.${key}`}
                    checked={formData.notifications[key] || false}
                    onChange={handleChange}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 peer-focus:ring-2 peer-focus:ring-blue-300 transition"></div>
                  <div
                    className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"
                  ></div>
                </label>
              </div>
            ))}
            <Button
              onClick={() => {
                const updatedUser = { ...user, notifications: formData.notifications }
                localStorage.setItem('currentUser', JSON.stringify(updatedUser))
                setUser(updatedUser)
                alert('Notification preferences saved!')
              }}
              className="mt-2"
            >
              Save Changes
            </Button>
          </div>
        )

      case 'payment':
        return <p>Payment information and methods will go here.</p>
      case 'privacy':
        return <p>Privacy and permissions settings go here.</p>
      case 'support':
        return <p>Support options and feedback form go here.</p>
      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Tabs */}
        <aside className="md:col-span-3">
          <Card className="p-0">
            <nav className="divide-y divide-border">
              {sideTabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-[15px] hover:bg-muted transition ${
                    activeTab === key ? 'bg-accent/40 text-foreground' : 'text-foreground/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </aside>

        {/* Content with horizontal padding */}
        <main className="md:col-span-9 space-y-6 px-4">
          <Card className="mx-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center text-primary-foreground text-xl font-semibold"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {initialsFromName(parsed.name)}
                </div>
                <div>
                  <div className="text-base sm:text-lg font-semibold">{parsed.name}</div>
                  <div className="text-sm text-foreground/70">{parsed.role}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-foreground/60">
                    {parsed.location}, {parsed.dzongkhag}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-foreground/80">
                <Edit3 className="w-4 h-4" /> Edit
              </Button>
            </div>
          </Card>

          <Card className="mx-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{sideTabs.find(t => t.key === activeTab)?.label}</h3>
              {activeTab === 'personal' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-foreground/80"
                  onClick={handleEditClick}
                >
                  <Edit3 className="w-4 h-4" /> {isEditing ? "Save" : "Edit"}
                </Button>
              )}
            </div>
            {renderTabContent()}
          </Card>
        </main>
      </div>
    </div>
  )
}
