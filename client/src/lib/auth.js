// Small helper to extract current user's CID from storage or token payload
export function getCurrentCid(){
  const keys = ['cid','CID','user','authUser','currentUser']
  for (const k of keys){
    try {
      const v = localStorage.getItem(k) || sessionStorage.getItem(k)
      if (!v) continue
      // if v looks like a plain CID (11 digits)
      if (/^\d{11}$/.test(v)) return v
      // try parse JSON
      try {
        const obj = JSON.parse(v)
        if (typeof obj === 'string' && /^\d{11}$/.test(obj)) return obj
        if (obj && obj.cid && /^\d{11}$/.test(obj.cid)) return obj.cid
      } catch (e) {}
    } catch (e) {}
  }

  // try common token keys - decode JWT payload
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

  return null
}

export default { getCurrentCid }
