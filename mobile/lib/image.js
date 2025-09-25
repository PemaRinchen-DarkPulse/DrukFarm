import { apiConfig } from './apiConfig';

// Use the centralized API configuration
const API_ORIGIN = apiConfig.origin;

export function resolveProductImage(product){
  if (!product) return placeholder()
  // Preferred binary endpoint exposed by backend
  if (product.productImageUrl) {
    if (/^https?:/i.test(product.productImageUrl)) return product.productImageUrl
    return API_ORIGIN + product.productImageUrl // relative -> absolute
  }
  // Data URI already
  if (typeof product.productImage === 'string' && product.productImage.startsWith('data:image/')) return product.productImage
  if (typeof product.image === 'string' && product.image.startsWith('data:image/')) return product.image
  // Base64 (raw)
  const b64 = product.productImageBase64 || product.imageBase64
  if (isLikelyBase64(b64)) return `data:${guessMime(b64)};base64,${b64}`
  // Legacy absolute/relative URL in productImage or image
  if (product.productImage) {
    if (/^https?:/i.test(product.productImage)) return product.productImage
    if (product.productImage.startsWith('/')) return API_ORIGIN + product.productImage
  }
  if (product.image) {
    if (/^https?:/i.test(product.image)) return product.image
    if (product.image.startsWith('/')) return API_ORIGIN + product.image
  }
  return placeholder()
}

function isLikelyBase64(str){
  if (!str || typeof str !== 'string') return false
  if (str.length < 40) return false
  return /^[A-Za-z0-9+/=]+$/.test(str)
}

function guessMime(b64){
  const head = (b64 || '').slice(0, 16)
  if (head.startsWith('/9j/')) return 'image/jpeg'
  if (head.startsWith('iVBORw0KG')) return 'image/png'
  if (head.startsWith('R0lGODdh') || head.startsWith('R0lGODlh')) return 'image/gif'
  if (head.startsWith('UklGR') || head.startsWith('RIFF')) return 'image/webp'
  return 'image/jpeg'
}

function placeholder(){
  return 'https://via.placeholder.com/300x200.png?text=Image'
}

export default { resolveProductImage }