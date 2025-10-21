// API configuration using dynamic environment-based URL switching
import { apiConfig } from './apiConfig';

const API_BASE = apiConfig.baseUrl;

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

export async function fetchProducts({ cid, includeOwn = false } = {}){
  let path = '/products'
  const params = new URLSearchParams()
  if (cid) params.append('cid', cid)
  if (includeOwn) params.append('includeOwn', 'true')
  if (params.toString()) path += `?${params.toString()}`
  return request(path)
}

export async function fetchProductById(id){
  return request(`/products/${id}`)
}

export async function fetchProductsByCategory(categoryId, { cid, includeOwn = false } = {}){
  let path = `/products/category/${categoryId}`
  const params = new URLSearchParams()
  if (cid) params.append('cid', cid)
  if (includeOwn) params.append('includeOwn', 'true')
  if (params.toString()) path += `?${params.toString()}`
  return request(path)
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

export async function fetchOrderById(orderId, cid){
  console.log('API: fetchOrderById called with:', { orderId, cid })
  const headers = {}
  if (cid) headers['x-cid'] = cid
  console.log('API: headers:', headers)
  try {
    const result = await request(`/orders/${orderId}`, { headers })
    console.log('API: fetchOrderById result:', result)
    return result
  } catch (error) {
    console.error('API: fetchOrderById error:', error)
    throw error
  }
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

export async function unifiedCheckout({ products = [], cid, totalPrice, deliveryAddress }){
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  
  // Add debugging
  console.log('[API] unifiedCheckout called with:', { 
    products, 
    cid, 
    totalPrice,
    deliveryAddress,
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
  if (deliveryAddress != null) body.deliveryAddress = deliveryAddress
  
  console.log('[API] unifiedCheckout request body:', body);
  
  return request('/orders/checkout', { method: 'POST', headers, body: JSON.stringify(body) })
}

export async function fetchSellerOrders({ cid } = {}){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  return request('/orders/seller', { headers })
}

export async function fetchTshogpasOrders({ cid } = {}){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  return request('/orders/tshogpas', { headers })
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

export async function markOrderConfirmed({ orderId, cid }){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  return request(`/orders/${orderId}/confirm`, { method: 'PATCH', headers })
}

export async function confirmOrderWithRoleBasedStatus({ orderId, cid, userRole }){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  if (userRole) headers['x-user-role'] = userRole
  return request(`/orders/${orderId}/confirm`, { method: 'PATCH', headers })
}

// Drop-off locations APIs
export async function fetchDzongkhags(){
  const resp = await request('/drop-off-locations/dzongkhags')
  return resp?.data || []
}

export async function fetchTownsByDzongkhag(dzongkhag){
  if (!dzongkhag) throw new Error('dzongkhag is required')
  const resp = await request(`/drop-off-locations/dzongkhag/${encodeURIComponent(dzongkhag)}`)
  const towns = resp?.towns || []
  // Ensure towns are strings, not objects
  return towns.filter(town => typeof town === 'string')
}

// Address APIs
export async function fetchUserAddresses(userCid){
  if (!userCid) throw new Error('userCid is required')
  return request(`/addresses/${userCid}`)
}

export async function createAddress(addressData){
  return request('/addresses', { method: 'POST', body: JSON.stringify(addressData) })
}

export async function updateAddress(id, addressData){
  return request(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(addressData) })
}

export async function deleteAddress(id){
  return request(`/addresses/${id}`, { method: 'DELETE' })
}

export async function setDefaultAddress(id){
  return request(`/addresses/${id}/default`, { method: 'PUT' })
}

// Dispatch Address APIs
export async function fetchDispatchAddresses(){
  return request('/dispatch-addresses')
}

export async function fetchGewogsByDzongkhag(dzongkhag){
  if (!dzongkhag) throw new Error('dzongkhag is required')
  return request(`/dispatch-addresses/${encodeURIComponent(dzongkhag)}`)
}

export async function fetchVillagesByGewog(dzongkhag, gewog){
  if (!dzongkhag || !gewog) throw new Error('dzongkhag and gewog are required')
  return request(`/dispatch-addresses/${encodeURIComponent(dzongkhag)}/${encodeURIComponent(gewog)}`)
}

export async function createDispatchAddress(dispatchAddressData){
  return request('/dispatch-addresses', { method: 'POST', body: JSON.stringify(dispatchAddressData) })
}

// User Dispatch Address APIs
export async function fetchUserDispatchAddresses(cid){
  if (!cid) throw new Error('cid is required')
  return request(`/user-dispatch-addresses/${cid}`)
}

export async function createUserDispatchAddress(addressData){
  return request('/user-dispatch-addresses', { method: 'POST', body: JSON.stringify(addressData) })
}

export async function updateUserDispatchAddress(id, addressData){
  return request(`/user-dispatch-addresses/${id}`, { method: 'PUT', body: JSON.stringify(addressData) })
}

export async function deleteUserDispatchAddress(id){
  return request(`/user-dispatch-addresses/${id}`, { method: 'DELETE' })
}

export async function setDefaultUserDispatchAddress(id){
  return request(`/user-dispatch-addresses/${id}/default`, { method: 'PUT' })
}

export async function downloadOrderImage(orderId, cid){
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  
  console.log('[API] downloadOrderImage called with:', { orderId, cid });
  console.log('[API] Request headers:', headers);
  
  try {
    const response = await request(`/orders/${orderId}/download-image?format=base64`, { 
      method: 'GET',
      headers 
    });
    
  console.log('[API] downloadOrderImage response:', {
    success: response?.success,
    hasData: !!response?.data,
    dataLength: response?.data?.length || 0,
    filename: response?.filename,
    keys: Object.keys(response || {})
  });    return response;
  } catch (error) {
    console.log('[API] downloadOrderImage error:', error);
    throw error;
  }
}

// Transporter specific APIs
export async function fetchTransporterOrders({ cid, transporterId } = {}){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  if (transporterId) headers['x-transporter-id'] = transporterId
  return request('/orders/transporter', { headers })
}

export async function fetchShippedOrders({ cid } = {}){
  const headers = {}
  if (cid) headers['x-cid'] = cid
  return request('/orders/shipped', { headers })
}

export async function updateOrderStatus({ orderId, status, cid }){
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  const body = { status }
  return request(`/orders/${orderId}/status`, { method: 'PATCH', headers, body: JSON.stringify(body) })
}

// Payment workflow API functions
export async function confirmTransporterPayment({ orderId, cid }) {
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  return request(`/orders/${orderId}/payment/transporter-confirm`, { method: 'POST', headers })
}

export async function confirmTshogpaPayment({ orderId, cid }) {
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  return request(`/orders/${orderId}/payment/tshogpa-confirm`, { method: 'POST', headers })
}

export async function confirmFarmerPayment({ orderId, cid }) {
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  return request(`/orders/${orderId}/payment/farmer-confirm`, { method: 'POST', headers })
}

export async function initializePaymentFlow({ orderId, cid }) {
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  return request(`/orders/${orderId}/payment/initialize`, { method: 'POST', headers })
}

export async function getPaymentStatus({ orderId, cid }) {
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  return request(`/orders/${orderId}/payment/status`, { headers })
}

export async function autoInitializePaymentFlows({ cid }) {
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  return request('/orders/payment/auto-initialize', { method: 'POST', headers })
}

export async function saveTshogpasDetails(orderId, cid, dispatchAddress){
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  const body = {
    tshogpasCid: cid,
    timestamp: new Date().toISOString(),
    dispatchAddress
  }
  return request(`/orders/${orderId}/tshogpas-details`, { method: 'PATCH', headers, body: JSON.stringify(body) })
}

// Review APIs
export async function createReview({ productId, orderId, rating, title, comment, cid }) {
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  
  console.log('[API] createReview called with:', { productId, orderId, rating, title, comment, cid });
  
  const body = { productId, orderId, rating, title, comment }
  return request('/reviews', { method: 'POST', headers, body: JSON.stringify(body) })
}

export async function getProductReviews(productId) {
  return request(`/reviews/product/${productId}`)
}

export async function getMyReviews({ cid }) {
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  return request('/reviews/my', { headers })
}

export async function getOrderReview({ orderId, cid }) {
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  return request(`/reviews/order/${orderId}`, { headers })
}

export async function updateReview({ reviewId, rating, title, comment, cid }) {
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  
  const body = {}
  if (rating !== undefined) body.rating = rating
  if (title !== undefined) body.title = title
  if (comment !== undefined) body.comment = comment
  
  return request(`/reviews/${reviewId}`, { method: 'PUT', headers, body: JSON.stringify(body) })
}

export async function deleteReview({ reviewId, cid }) {
  const headers = { 'Content-Type': 'application/json' }
  if (cid) headers['x-cid'] = cid
  return request(`/reviews/${reviewId}`, { method: 'DELETE', headers })
}

export default {
  fetchProducts, fetchProductById, fetchProductsByCategory, createProduct, updateProduct, saveProduct, deleteProduct,
  fetchCategories, createCategory, fetchOrders, fetchOrderById, registerUser, loginUser, fetchUsers,
  fetchUserByCid, updateUser,
  addToCart, getCart, updateCartItem, removeCartItem, buyProduct, cartCheckout, unifiedCheckout, fetchSellerOrders, fetchTshogpasOrders, fetchMyOrders, cancelMyOrder,
  searchTransportOrders, setOutForDelivery, fetchMyTransports, markDelivered, markOrderShipped, markOrderConfirmed, confirmOrderWithRoleBasedStatus,
  addToWishlist, getWishlist, removeFromWishlist,
  logoutUser,
  fetchDzongkhags, fetchTownsByDzongkhag,
  fetchUserAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress,
  fetchDispatchAddresses, fetchGewogsByDzongkhag, fetchVillagesByGewog, createDispatchAddress,
  fetchUserDispatchAddresses, createUserDispatchAddress, updateUserDispatchAddress, deleteUserDispatchAddress, setDefaultUserDispatchAddress,
  fetchTransporterOrders, fetchShippedOrders, updateOrderStatus, saveTshogpasDetails,
  confirmTransporterPayment, confirmTshogpaPayment, confirmFarmerPayment, initializePaymentFlow, getPaymentStatus, autoInitializePaymentFlows,
  createReview, getProductReviews, getMyReviews, getOrderReview, updateReview, deleteReview,
}

// Test function to create a sample order for QR code testing
export async function createTestOrder(cid) {
  const headers = {}
  if (cid) headers['x-cid'] = cid
  return request('/orders/create-test-order', { 
    method: 'POST',
    headers
  })
}
