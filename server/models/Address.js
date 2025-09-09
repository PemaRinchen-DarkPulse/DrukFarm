const mongoose = require('mongoose')

const AddressSchema = new mongoose.Schema(
	{
		userCid: {
			type: String,
			required: true,
			validate: {
				validator: v => /^\d{11}$/.test(v),
				message: 'CID must be exactly 11 digits',
			},
		},
		title: {
			type: String,
			required: true,
			trim: true,
		},
		icon: {
			type: String,
			enum: ['home', 'briefcase', 'school', 'location'],
			required: true,
			default: 'home',
		},
		dzongkhag: {
			type: String,
			required: true,
			trim: true,
		},
		place: {
			type: String,
			required: true,
			trim: true,
		},
		isDefault: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
)

// Index for efficient user queries
AddressSchema.index({ userCid: 1 })

// Ensure only one default address per user
AddressSchema.pre('save', async function(next) {
	if (this.isDefault && this.isModified('isDefault')) {
		// Unset default for other addresses of this user
		await this.constructor.updateMany(
			{ userCid: this.userCid, _id: { $ne: this._id } },
			{ $set: { isDefault: false } }
		)
	}
	next()
})

module.exports = mongoose.model('Address', AddressSchema)
