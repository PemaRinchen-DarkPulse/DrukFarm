const QRCode = require('qrcode')

/**
 * Generate a QR code as a base64 data URL for the given payload object.
 * @param {object|string} payload - Data to encode in QR; object will be JSON.stringified
 * @param {object} [opts]
 * @returns {Promise<string>} data URL string (image/png;base64,...)
 */
async function generateQrDataUrl(payload, opts = {}) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const options = {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 6,
    ...opts,
  }
  return QRCode.toDataURL(text, options)
}

module.exports = { generateQrDataUrl }
