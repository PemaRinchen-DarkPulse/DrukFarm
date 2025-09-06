const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function uploadToCloudinary(base64Image, options = {}) {
	if (!base64Image || !base64Image.startsWith('data:image')) {
		throw new Error('Invalid base64 image string provided.')
	}

	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
			if (error) {
				console.error('Cloudinary upload error:', error)
				return reject(new Error('Failed to upload image to Cloudinary.'))
			}
			if (!result) {
				return reject(new Error('Cloudinary returned no result.'))
			}
			resolve(result.secure_url)
		})

		const buffer = Buffer.from(base64Image.split(',')[1], 'base64')
		streamifier.createReadStream(buffer).pipe(uploadStream)
	})
}

module.exports = {
	cloudinary,
	uploadToCloudinary,
}
