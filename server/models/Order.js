const mongoose = require('mongoose')

// Snapshot of the buyer at time of order
const UserSnapshotSchema = new mongoose.Schema(
	{
		cid: { type: String, required: true },
		name: { type: String, default: '' },
		phoneNumber: { type: String, default: '' },
		location: { type: String, default: '' },
	},
	{ _id: false }
)

// Snapshot of the product at time of order
const ProductSnapshotSchema = new mongoose.Schema(
	{
		productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
		productName: { type: String, required: true },
		price: { type: Number, required: true },
		unit: { type: String, required: true },
		sellerCid: { type: String, required: true },
		productImageBase64: { type: String, default: '' },
	},
	{ _id: false }
)

// Snapshot of the assigned transporter (if any)
const TransporterSnapshotSchema = new mongoose.Schema(
	{
		cid: { type: String, required: true },
		name: { type: String, default: '' },
		phoneNumber: { type: String, default: '' },
	},
	{ _id: false }
)

const OrderSchema = new mongoose.Schema(
	{
		userCid: {
			type: String,
			required: true,
			index: true,
			validate: { validator: v => /^\d{11}$/.test(v), message: 'CID must be exactly 11 digits' },
		},
		userSnapshot: { type: UserSnapshotSchema, required: true },
		product: { type: ProductSnapshotSchema, required: true },
		quantity: { type: Number, required: true, min: 1, default: 1 },
		totalPrice: { type: Number, required: true, min: 0 },
		qrCodeDataUrl: { type: String, required: true }, // Base64 data URL (downloadable)
		source: { type: String, enum: ['buy', 'cart'], required: true },
		// expand status values to include PAID and OUT_FOR_DELIVERY; keep legacy 'Out for Delivery' for backward-compat
		status: { type: String, enum: ['pending', 'paid', 'OUT_FOR_DELIVERY', 'Out for Delivery', 'shipped', 'cancelled', 'delivered'], default: 'pending' },
		transporter: { type: TransporterSnapshotSchema, default: null },
	},
	{ timestamps: true, versionKey: false }
)

OrderSchema.virtual('orderId').get(function () {
	return this._id
})

module.exports = mongoose.model('Order', OrderSchema)

