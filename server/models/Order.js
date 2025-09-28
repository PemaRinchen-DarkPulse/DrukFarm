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

// Snapshot of the delivery address at time of order
const DeliveryAddressSnapshotSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		place: { type: String, required: true },
		dzongkhag: { type: String, required: true },
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
		deliveryAddress: { type: DeliveryAddressSnapshotSchema, required: false, default: null },
		product: { type: ProductSnapshotSchema, required: true },
		quantity: { type: Number, required: true, min: 1, default: 1 },
		totalPrice: { type: Number, required: true, min: 0 },
		qrCodeDataUrl: { type: String, required: true }, // Base64 data URL (downloadable)
		source: { type: String, enum: ['buy', 'cart'], required: true },
		// expand status values to include PAID and OUT_FOR_DELIVERY; keep legacy 'Out for Delivery' for backward-compat
		status: { type: String, enum: ['order placed','order confirmed', 'shipped', 'Out for Delivery', 'cancelled', 'delivered'], default: 'order placed' },
		isPaid: { type: Boolean, default: false }, 
		transporter: { type: TransporterSnapshotSchema, default: null },
	},
	{ timestamps: true, versionKey: false }
)

OrderSchema.virtual('orderId').get(function () {
	return this._id
})

// Ensure quantity and totalPrice are always consistent, even if callers forget to compute
OrderSchema.pre('validate', function (next) {
	try {
		// Coerce quantity to a safe integer >= 1
		const q = Number(this.quantity)
		this.quantity = Number.isFinite(q) && q >= 1 ? Math.floor(q) : 1
		// Compute total from the product snapshot price
		const price = Number(this?.product?.price || 0)
		const total = price * this.quantity
		this.totalPrice = Number.isFinite(total) ? Number(total.toFixed(2)) : 0
		// TEMP DEBUG
		if (process.env.NODE_ENV !== 'production') {
			console.log('[Order.preValidate] final quantity=', this.quantity, 'price=', price, 'totalPrice=', this.totalPrice)
		}
		next()
	} catch (e) {
		next(e)
	}
})

module.exports = mongoose.model('Order', OrderSchema)

