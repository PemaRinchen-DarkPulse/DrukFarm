// API base from environment.
// Options:
// - VITE_API_BASE: full base including /api
// - VITE_BACKEND_URL(_PROD): backend origin; we append /api
const isProd = import.meta.env.PROD
const backendOrigin = isProd
  ? (import.meta.env.VITE_BACKEND_URL_PROD || import.meta.env.VITE_BACKEND_URL)
  : import.meta.env.VITE_BACKEND_URL
const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  (((backendOrigin || import.meta.env.BACKEND_URL || '').replace(/\/$/, '')) + '/api')
)

async function request(path, opts = {}){
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' , ...(opts.headers||{})},
    ...opts,
  })
  if (!res.ok) {
  // attempt to parse a JSON body, fall back to text
  let body = null
  try { body = await res.json() } catch (e) { try { body = await res.text() } catch (e2) { body = null } }
  const err = new Error(`Request failed ${res.status} ${res.statusText}`)
  err.status = res.status
  err.body = body
  throw err
  }
  if (res.status === 204) return null
  return res.json()
}

export async function fetchProducts(){
  return request('/products')
}

export async function fetchProductById(id){
  return request(`/products/${id}`)
}

export async function fetchProductsByCategory(categoryId){
  return request(`/products/category/${categoryId}`)
}

export async function createProduct(dto){
  return request('/products', { method: 'POST', body: JSON.stringify(dto) })
}

export async function updateProduct(id, dto){
  return request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(dto) })
}

export async function saveProduct(dto, id){
  if (id) return updateProduct(id, dto)
  return createProduct(dto)
}

export async function deleteProduct(id){
  return request(`/products/${id}`, { method: 'DELETE' })
}

export async function fetchCategories(){
  return request('/categories')
}

export async function createCategory(dto){
  return request('/categories', { method: 'POST', body: JSON.stringify(dto) })
}

export async function fetchOrders(){
  // backend does not currently expose orders in this project; attempt and return [] on error
  try {
    return await request('/orders')
  } catch (e) {
    return []
  }
}

export async function registerUser(dto){
  return request('/users/register', { method: 'POST', body: JSON.stringify(dto) })
}

export async function loginUser(dto){
  return request('/users/login', { method: 'POST', body: JSON.stringify(dto) })
}

export async function fetchUsers(){
  return request('/users')
}

export async function addToCart({ productId, quantity = 1, cid }){
  const body = { productId, quantity }
  if (cid) body.cid = cid
  const resp = await request('/cart', { method: 'POST', body: JSON.stringify(body) })
  try { window.dispatchEvent(new Event('cartChanged')) } catch(e) {}
  return resp
}

export async function getCart({ cid } = {}){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  return request('/cart', { headers })
}

export async function updateCartItem({ itemId, quantity, cid }){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  return request(`/cart/${itemId}`, { method: 'PATCH', headers, body: JSON.stringify({ quantity }) })
}

export async function removeCartItem({ itemId, cid }){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  return request(`/cart/${itemId}`, { method: 'DELETE', headers })
}

export default {
  fetchProducts, fetchProductById, fetchProductsByCategory, createProduct, updateProduct, saveProduct, deleteProduct,
  fetchCategories, createCategory, fetchOrders, registerUser, loginUser, fetchUsers,
  addToCart, getCart, updateCartItem, removeCartItem
}
