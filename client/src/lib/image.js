// Helper to resolve the best image URL for a product object returned by the API.
// Priority:
// 1. Explicit productImageUrl provided by backend (serves binary blob)
// 2. Data URI constructed from productImageBase64
// 3. Legacy fields: productImage (could already be data URI or URL) or image
// 4. Placeholder image
export function resolveProductImage(product){
  if (!product) return placeholder()
  if (product.productImageUrl) return product.productImageUrl
  if (product.productImageBase64) {
    const b64 = String(product.productImageBase64)
    const mime = guessMime(b64)
    return `data:${mime};base64,${b64}`
  }
  if (product.productImage) return product.productImage
  if (product.image) return product.image
  return placeholder()
}

function guessMime(b64){
  const s = b64.slice(0, 16)
  if (s.startsWith('/9j/')) return 'image/jpeg'
  if (s.startsWith('iVBORw0KG')) return 'image/png'
  if (s.startsWith('R0lGODdh') || s.startsWith('R0lGODlh')) return 'image/gif'
  if (s.startsWith('UklGR') || s.startsWith('RIFF')) return 'image/webp'
  return 'image/jpeg'
}

function placeholder(){
  return 'https://via.placeholder.com/600x400.png?text=No+Image'
}

export default { resolveProductImage }