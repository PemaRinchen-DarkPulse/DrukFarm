// API base from Expo config (Hermes-safe).
// Configure in app.json -> expo.extra.API_BASE (e.g., "http://localhost:5000/api").
import Constants from 'expo-constants'

const extra = (Constants?.expoConfig?.extra) || {}
// Default to local backend if nothing provided
const API_BASE = (extra.API_BASE || 'http://localhost:5000/api').replace(/\/$/, '')

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
  // Generic orders endpoint - use fetchMyOrders() for user-specific orders instead
  return []
}

export async function registerUser(dto){
  return request('/users/register', { method: 'POST', body: JSON.stringify(dto) })
}

export async function loginUser(dto){
  return request('/users/login', { method: 'POST', body: JSON.stringify(dto) })
}

export async function logoutUser(){
  // Stateless server; this will always succeed and lets app clear local state
  try { return await request('/users/logout', { method: 'POST' }) } catch(e) { return { ok: true } }
}

export async function fetchUsers(){
  return request('/users')
}

export async function fetchUserByCid(cid){
  if (!cid) throw new Error('cid required')
  return request(`/users/${cid}`)
}

export async function updateUser(cid, dto){
  if (!cid) throw new Error('cid required')
  return request(`/users/${cid}`, { method: 'PATCH', body: JSON.stringify(dto) })
}

export async function addToCart({ productId, quantity = 1, cid }){
  const headers = { 'Content-Type': 'application/json' }
  const body = { productId, quantity }
  if (cid) body.cid = cid
  
  // Add debugging
  console.log('[API] addToCart called with:', { productId, quantity, quantityType: typeof quantity, cid });
  
  // Validate inputs
  if (!productId) {
    throw new Error('productId is required');
  }
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new Error(`Invalid quantity: ${quantity}`);
  }
  
  const resp = await request('/cart', { method: 'POST', headers, body: JSON.stringify(body) })
  try { window.dispatchEvent(new Event('cartChanged')) } catch(e) {}
  return resp
}

// Wishlist APIs
export async function addToWishlist({ productId, cid }){
  const headers = { 'Content-Type': 'application/json' }
  const body = { productId }
  if (cid) body.cid = cid
  return request('/wishlist', { method: 'POST', headers, body: JSON.stringify(body) })
}

export async function getWishlist({ cid } = {}){
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  const resp = await request('/wishlist', { headers })
  return resp?.wishlist || { userCid: cid || null, items: [] }
}

export async function removeFromWishlist({ productId, cid }){
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  return request(`/wishlist/${productId}`, { method: 'DELETE', headers })
}

export async function getCart({ cid } = {}){
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  console.log('[API] getCart called with cid:', cid);
  return request('/cart', { headers })
}

export async function updateCartItem({ itemId, quantity, cid }){
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  
  // Add debugging
  console.log('[API] updateCartItem called with:', { itemId, quantity, quantityType: typeof quantity, cid });
  
  // Validate inputs
  if (!itemId) {
    throw new Error('itemId is required');
  }
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new Error(`Invalid quantity: ${quantity}`);
  }
  
  const body = { quantity };
  console.log('[API] updateCartItem request body:', body);
  
  return request(`/cart/${itemId}`, { method: 'PATCH', headers, body: JSON.stringify(body) })
}

export async function removeCartItem({ itemId, cid }){
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  console.log('[API] removeCartItem called with:', { itemId, cid });
  return request(`/cart/${itemId}`, { method: 'DELETE', headers })
}

export async function buyProduct({ productId, quantity = 1, cid }){
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  
  // Add debugging
  console.log('[API] buyProduct called with:', { productId, quantity, quantityType: typeof quantity, cid });
  
  // Validate inputs
  if (!productId) {
    throw new Error('productId is required');
  }
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new Error(`Invalid quantity: ${quantity}`);
  }
  
  const body = { productId, quantity };
  console.log('[API] buyProduct request body:', body);
  
  return request(`/orders/buy?pid=${encodeURIComponent(String(productId || ''))}`, { 
    method: 'POST', 
    headers, 
    body: JSON.stringify(body) 
  })
}

export async function cartCheckout({ cid }){
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  console.log('[API] cartCheckout called with cid:', cid);
  return request('/orders/cart-checkout', { method: 'POST', headers })
}

export async function unifiedCheckout({ products = [], cid, totalPrice }){
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  
  // Add debugging
  console.log('[API] unifiedCheckout called with:', { 
    products, 
    cid, 
    totalPrice,
    productsCount: products.length 
  });
  
  // Validate products array
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('Products array is required and cannot be empty');
  }
  
  // Validate each product
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    if (!product.productId) {
      throw new Error(`Product at index ${i} is missing productId`);
    }
    if (!Number.isFinite(product.quantity) || product.quantity < 1) {
      throw new Error(`Product at index ${i} has invalid quantity: ${product.quantity}`);
    }
  }
  
  const body = { products }
  if (totalPrice != null) body.totalPrice = totalPrice
  
  console.log('[API] unifiedCheckout request body:', body);
  
  return request('/orders/checkout', { method: 'POST', headers, body: JSON.stringify(body) })
}

export async function fetchSellerOrders({ cid } = {}){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  return request('/orders/seller', { headers })
}

export async function fetchMyOrders({ cid } = {}){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  const resp = await request('/orders/my', { headers })
  return resp?.orders || []
}

export async function cancelMyOrder({ orderId, cid }){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  return request(`/orders/${orderId}/cancel`, { method: 'PATCH', headers })
}

export async function searchTransportOrders({ from, to = [], cid }){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  const usp = new URLSearchParams()
  if (from) usp.set('from', from)
  if (Array.isArray(to)) {
    // send as comma-separated
    if (to.length) usp.set('to', to.join(','))
  } else if (typeof to === 'string' && to.trim()) {
    usp.set('to', to)
  }
  const q = usp.toString()
  const path = `/orders/transport-search${q ? `?${q}` : ''}`
  const resp = await request(path, { headers })
  return resp?.orders || []
}

export async function setOutForDelivery({ orderId, cid, name, phoneNumber }){
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  const body = { name, phoneNumber }
  return request(`/orders/${orderId}/out-for-delivery`, { method: 'PATCH', headers, body: JSON.stringify(body) })
}

export async function fetchMyTransports({ cid } = {}){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  const resp = await request('/orders/my-transports', { headers })
  return resp?.orders || []
}

export async function markDelivered({ orderId, cid }){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  return request(`/orders/${orderId}/delivered`, { method: 'PATCH', headers })
}

export async function markOrderShipped({ orderId, cid }){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  return request(`/orders/${orderId}/shipped`, { method: 'PATCH', headers })
}

export default {
  fetchProducts, fetchProductById, fetchProductsByCategory, createProduct, updateProduct, saveProduct, deleteProduct,
  fetchCategories, createCategory, fetchOrders, registerUser, loginUser, fetchUsers,
  fetchUserByCid, updateUser,
  addToCart, getCart, updateCartItem, removeCartItem, buyProduct, cartCheckout, unifiedCheckout, fetchSellerOrders, fetchMyOrders, cancelMyOrder,
  searchTransportOrders, setOutForDelivery, fetchMyTransports, markDelivered, markOrderShipped,
  addToWishlist, getWishlist, removeFromWishlist,
  logoutUser,
}
