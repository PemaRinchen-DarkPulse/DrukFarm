const mongoose = require('mongoose')
const roles = ['consumer', 'farmer', 'transporter', 'superadmin']

const UserSchema = new mongoose.Schema(
	{
		cid: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			validate: {
				validator: v => /^\d{11}$/.test(v),
				message: 'CID must be exactly 11 digits',
			},
		},
		name: { type: String, required: true, trim: true },
		password: { type: String, required: true }, // hashed
		role: { type: String, enum: roles, required: true, default: 'consumer' },
		location: { type: String, default: '', trim: true },
		dzongkhag: { type: String, default: '', trim: true },
		phoneNumber: {
			type: String,
			required: true,
			unique: true,
			validate: {
				validator: v => /^\d{8}$/.test(v),
				message: 'Phone number must be exactly 8 digits',
			},
		},
		// Optional profile image URL (could be extended to file upload later)
		// Binary image storage (base64 handled at API layer)
		profileImageData: { type: Buffer },
		profileImageMime: { type: String, default: '' },
		gender: { type: String, enum: ['male','female','other',''], default: '' },
	},
	{ timestamps: true }
)

// Strip password in toJSON
UserSchema.methods.toJSONSafe = function () {
	const obj = this.toObject({ versionKey: false })
	delete obj.password
	if (obj.profileImageData) {
		obj.profileImageBase64 = obj.profileImageData.toString('base64')
		delete obj.profileImageData
		if (!obj.profileImageMime) obj.profileImageMime = 'image/png'
	}
	if (!obj.gender) obj.gender = ''
	return obj
}

module.exports = mongoose.model('User', UserSchema)

