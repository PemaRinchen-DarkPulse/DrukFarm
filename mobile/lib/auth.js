// Lightweight auth state for React Native apps without persistent storage.
// If @react-native-async-storage/async-storage is present, we could extend this later.

let _currentUser = null
const _listeners = new Set()

export function setCurrentUser(user) {
  _currentUser = user || null
  // notify listeners
  _listeners.forEach(fn => {
    try { fn(_currentUser) } catch {}
  })
}

export function getCurrentUser() {
  return _currentUser
}

export function onAuthChange(cb) {
  if (typeof cb !== 'function') return () => {}
  _listeners.add(cb)
  return () => _listeners.delete(cb)
}

// Small helper to extract current user's CID
export function getCurrentCid(){
  // Prefer in-memory user (set during login/register)
  if (_currentUser && _currentUser.cid && /^\d{11}$/.test(String(_currentUser.cid))) {
    return String(_currentUser.cid)
  }

  // Attempt to read from web storages if running on web (Expo web)
  const hasWebStorage = typeof localStorage !== 'undefined' && typeof sessionStorage !== 'undefined'
  if (hasWebStorage) {
    const keys = ['cid','CID','user','authUser','currentUser']
    for (const k of keys){
      try {
        const v = localStorage.getItem(k) || sessionStorage.getItem(k)
        if (!v) continue
        if (/^\d{11}$/.test(v)) return v
        try {
          const obj = JSON.parse(v)
          if (typeof obj === 'string' && /^\d{11}$/.test(obj)) return obj
          if (obj && obj.cid && /^\d{11}$/.test(obj.cid)) return obj.cid
        } catch (e) {}
      } catch (e) {}
    }

    const tokenKeys = ['token','accessToken','authToken','id_token']
    for (const k of tokenKeys) {
      try {
        const tk = localStorage.getItem(k) || sessionStorage.getItem(k)
        if (!tk) continue
        const parts = tk.split('.')
        if (parts.length >= 2) {
          const payload = parts[1]
          const b64 = payload.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((payload.length + 3) % 4)
          try {
            const json = JSON.parse(atob(b64))
            if (json && json.cid && /^\d{11}$/.test(json.cid)) return json.cid
          } catch (e) {}
        }
      } catch (e) {}
    }
  }

  return null
}

export default { getCurrentCid, getCurrentUser, setCurrentUser, onAuthChange }
