const mongoose = require('mongoose')

// Include 'transporter' role; keep 'restaurant' and legacy 'transported' for backward-compatibility
const roles = ['consumer', 'farmer', 'transporter', 'transported', 'restaurant']

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
			validate: {
				validator: v => /^\d{8}$/.test(v),
				message: 'Phone number must be exactly 8 digits',
			},
		},
		roleDesc: { type: String, default: '', trim: true },
	},
	{ timestamps: true }
)

// Strip password in toJSON
UserSchema.methods.toJSONSafe = function () {
	const obj = this.toObject({ versionKey: false })
	delete obj.password
	return obj
}

module.exports = mongoose.model('User', UserSchema)

