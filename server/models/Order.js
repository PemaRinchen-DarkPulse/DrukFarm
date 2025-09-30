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

// Status history tracking
const StatusHistorySchema = new mongoose.Schema(
	{
		status: { type: String, required: true },
		changedBy: {
			cid: { type: String, required: true },
			role: { type: String, required: true },
			name: { type: String, default: '' }
		},
		timestamp: { type: Date, default: Date.now },
		notes: { type: String, default: '' }
	},
	{ _id: false }
)

// Payment flow step schema for 3-step payment process
const PaymentFlowStepSchema = new mongoose.Schema(
	{
		step: { 
			type: String, 
			enum: [
				'consumer_to_transporter', 
				'transporter_to_tshogpa', 
				'tshogpa_to_farmer',
				'transporter_to_farmer',  // For when tshogpa is skipped
				'consumer_to_tshogpa',    // For when transporter is skipped
				'consumer_to_farmer'      // For direct transactions
			], 
			required: true 
		},
		fromCid: { type: String, required: true },
		toCid: { type: String, required: true },
		amount: { type: Number, required: true, min: 0 },
		status: { 
			type: String, 
			enum: ['pending', 'completed', 'failed'], 
			default: 'pending' 
		},
		timestamp: { type: Date, default: Date.now }
	},
	{ _id: false }
)

// Payment status history tracking
const PaymentStatusHistorySchema = new mongoose.Schema(
	{
		step: { 
			type: String, 
			enum: [
				'consumer_to_transporter', 
				'transporter_to_tshogpa', 
				'tshogpa_to_farmer',
				'transporter_to_farmer',
				'consumer_to_tshogpa',
				'consumer_to_farmer',
				'workflow_completed'
			] 
		},
		previousStatus: { type: String },
		newStatus: { type: String, required: true },
		changedBy: {
			cid: { type: String, required: true },
			role: { type: String, required: true },
			name: { type: String, default: '' }
		},
		timestamp: { type: Date, default: Date.now },
		notes: { type: String, default: '' }
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
		tshogpasCid: { type: String, default: null }, // CID of the Tshogpas who confirmed the order
		dispatchAddress: { // Default dispatch address of the Tshogpas
			title: { type: String, default: null },
			dzongkhag: { type: String, default: null },
			gewog: { type: String, default: null },
			place: { type: String, default: null }
		},
		// Payment workflow fields
		paymentFlow: { type: [PaymentFlowStepSchema], default: [] },
		paymentCompletedAt: { type: Date, default: null },
		paymentConfirmedBy: { type: String, default: null }, // Who confirmed the payment (e.g., 'tshogpa', 'farmer')
		paymentConfirmedAt: { type: Date, default: null }, // When payment was confirmed
		settlementDate: { type: Date, default: null }, // When payment was settled
		paymentStatusHistory: { type: [PaymentStatusHistorySchema], default: [] },
		statusHistory: { type: [StatusHistorySchema], default: [] },
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

// Middleware to auto-update isPaid and paymentCompletedAt when final payment step is completed
OrderSchema.pre('save', function(next) {
	try {
		// Check if any final step is completed
		const finalSteps = ['tshogpa_to_farmer', 'transporter_to_farmer', 'consumer_to_farmer'];
		const finalStep = this.paymentFlow.find(step => 
			finalSteps.includes(step.step) && step.status === 'completed'
		);
		
		// Special case: If tshogpa is seller and transporter_to_tshogpa is completed
		const tshogpaIsSeller = this.tshogpasCid === this.product.sellerCid;
		const tshogpaStep = this.paymentFlow.find(step => 
			step.step === 'transporter_to_tshogpa' && step.status === 'completed'
		);
		const consumerToTshogpaStep = this.paymentFlow.find(step => 
			step.step === 'consumer_to_tshogpa' && step.status === 'completed'
		);
		
		const isPaymentComplete = finalStep || 
			(tshogpaIsSeller && (tshogpaStep || consumerToTshogpaStep));
		
		if (isPaymentComplete && !this.isPaid) {
			this.isPaid = true;
			this.paymentCompletedAt = new Date();
		} else if (!isPaymentComplete && this.isPaid) {
			// If no final step is completed but isPaid is true, reset it
			this.isPaid = false;
			this.paymentCompletedAt = null;
		}
		
		next();
	} catch (e) {
		next(e);
	}
});

// Method to initialize payment flow
OrderSchema.methods.initializePaymentFlow = function() {
	if (this.paymentFlow.length > 0) {
		throw new Error('Payment flow already initialized');
	}
	
	const totalAmount = this.totalPrice;
	const flow = this.detectPaymentFlow();
	
	this.paymentFlow = flow.map(step => ({
		step: step.step,
		fromCid: step.fromCid,
		toCid: step.toCid,
		amount: totalAmount,
		status: 'pending'
	}));
	
	return this.save();
};

// Method to detect which payment flow applies based on order fields
OrderSchema.methods.detectPaymentFlow = function() {
	const hasTransporter = this.transporter && this.transporter.cid;
	const hasTshogpa = this.tshogpasCid;
	const farmer = this.product.sellerCid;
	const consumer = this.userCid;
	
	// Special case: If tshogpa is also the seller (farmer)
	const tshogpaIsSeller = hasTshogpa && this.tshogpasCid === farmer;
	
	let flow = [];
	
	if (hasTransporter && hasTshogpa) {
		// Flow 1: Buyer → Transporter → Tshogpa → Seller (or skip if tshogpa is seller)
		flow.push({
			step: 'consumer_to_transporter',
			fromCid: consumer,
			toCid: this.transporter.cid
		});
		
		flow.push({
			step: 'transporter_to_tshogpa',
			fromCid: this.transporter.cid,
			toCid: this.tshogpasCid
		});
		
		if (!tshogpaIsSeller) {
			flow.push({
				step: 'tshogpa_to_farmer',
				fromCid: this.tshogpasCid,
				toCid: farmer
			});
		}
	} else if (hasTransporter && !hasTshogpa) {
		// Flow 4: Buyer → Transporter → Seller (skip tshogpa)
		flow.push({
			step: 'consumer_to_transporter',
			fromCid: consumer,
			toCid: this.transporter.cid
		});
		
		flow.push({
			step: 'transporter_to_farmer',
			fromCid: this.transporter.cid,
			toCid: farmer
		});
	} else if (!hasTransporter && hasTshogpa) {
		// Flow 2: Buyer → Tshogpa → Seller (or skip if tshogpa is seller)
		flow.push({
			step: 'consumer_to_tshogpa',
			fromCid: consumer,
			toCid: this.tshogpasCid
		});
		
		if (!tshogpaIsSeller) {
			flow.push({
				step: 'tshogpa_to_farmer',
				fromCid: this.tshogpasCid,
				toCid: farmer
			});
		}
	} else {
		// Flow 3: Buyer → Seller (direct, no intermediaries)
		flow.push({
			step: 'consumer_to_farmer',
			fromCid: consumer,
			toCid: farmer
		});
	}
	
	return flow;
};

// Method to update payment step status with strict hierarchy validation
OrderSchema.methods.updatePaymentStep = function(stepName, newStatus, changedBy, notes = '') {
	const stepIndex = this.paymentFlow.findIndex(step => step.step === stepName);
	
	if (stepIndex === -1) {
		throw new Error(`Payment step '${stepName}' not found`);
	}
	
	const step = this.paymentFlow[stepIndex];
	const previousStatus = step.status;
	
	// Validate status transition
	if (previousStatus === 'completed' && newStatus !== 'completed') {
		throw new Error('Cannot change status of completed payment step');
	}
	
	if (previousStatus === 'failed' && newStatus === 'completed') {
		throw new Error('Cannot complete a failed payment step without resetting first');
	}
	
	// STRICT HIERARCHY VALIDATION: Ensure all previous steps are completed
	if (newStatus === 'completed') {
		for (let i = 0; i < stepIndex; i++) {
			const previousStep = this.paymentFlow[i];
			if (previousStep.status !== 'completed') {
				let contactPerson = 'the previous level';
				if (previousStep.step.includes('transporter')) {
					contactPerson = 'the transporter';
				} else if (previousStep.step.includes('tshogpa')) {
					contactPerson = 'the tshogpa';
				} else if (previousStep.step.includes('consumer')) {
					contactPerson = 'the buyer';
				}
				
				throw new Error(`Payment failed. Please contact ${contactPerson} to confirm their payment first. Pending step: ${previousStep.step}`);
			}
		}
	}
	
	// Update step status
	step.status = newStatus;
	step.timestamp = new Date();
	
	// Add to payment status history
	this.paymentStatusHistory.push({
		step: stepName,
		previousStatus,
		newStatus,
		changedBy,
		timestamp: new Date(),
		notes
	});
	
	return this.save();
};

// Method to handle special case where tshogpa is also the seller
OrderSchema.methods.completePaymentForTshogpaSeller = function(changedBy, notes = '') {
	const tshogpaIsSeller = this.tshogpasCid === this.product.sellerCid;
	
	if (!tshogpaIsSeller) {
		throw new Error('This method can only be used when tshogpa is also the seller');
	}
	
	// Find the relevant step to complete (the one TO the tshogpa)
	const stepToComplete = this.paymentFlow.find(step => 
		step.step === 'transporter_to_tshogpa' || step.step === 'consumer_to_tshogpa'
	);
	
	if (!stepToComplete) {
		throw new Error('No relevant payment step found for tshogpa-seller completion');
	}
	
	if (stepToComplete.status === 'completed') {
		throw new Error('Payment step already completed');
	}
	
	// STRICT HIERARCHY VALIDATION for special case - CANNOT mark if higher level hasn't marked
	if (stepToComplete.step === 'transporter_to_tshogpa') {
		// HIERARCHY ENFORCEMENT: Transporter MUST have marked their payment first
		const transporterStep = this.paymentFlow.find(s => s.step === 'consumer_to_transporter');
		if (!transporterStep || transporterStep.status !== 'completed') {
			throw new Error('Payment failed. Please contact the transporter to confirm their payment first.');
		}
	}
	// For consumer_to_tshogpa (direct): No higher level exists, so this can be marked
	
	// Complete the step to tshogpa
	stepToComplete.status = 'completed';
	stepToComplete.timestamp = new Date();
	
	// Add to payment status history for the completed step
	this.paymentStatusHistory.push({
		step: stepToComplete.step,
		previousStatus: 'pending',
		newStatus: 'completed',
		changedBy,
		timestamp: new Date(),
		notes: notes || 'Payment completed - tshogpa is also the seller (step 1 of 2)'
	});
	
	// Since tshogpa is seller, this completes the ENTIRE payment workflow
	// Mark as fully paid and set completion timestamp
	this.isPaid = true;
	this.paymentCompletedAt = new Date();
	
	// Add completion entry to history
	this.paymentStatusHistory.push({
		step: 'workflow_completed',
		previousStatus: 'in_progress',
		newStatus: 'completed',
		changedBy,
		timestamp: new Date(),
		notes: 'Payment workflow completed - tshogpa is also the seller (final completion)'
	});
	
	return this.save();
};

// Method to get current payment status
OrderSchema.methods.getPaymentStatus = function() {
	const steps = this.paymentFlow.map(step => ({
		step: step.step,
		status: step.status,
		fromCid: step.fromCid,
		toCid: step.toCid,
		amount: step.amount,
		timestamp: step.timestamp
	}));
	
	const completedSteps = this.paymentFlow.filter(step => step.status === 'completed').length;
	const failedSteps = this.paymentFlow.filter(step => step.status === 'failed').length;
	const pendingSteps = this.paymentFlow.filter(step => step.status === 'pending').length;
	
	let overallStatus = 'pending';
	if (failedSteps > 0) {
		overallStatus = 'failed';
	} else if (completedSteps === this.paymentFlow.length) {
		overallStatus = 'completed';
	} else if (completedSteps > 0) {
		overallStatus = 'in_progress';
	}
	
	return {
		overallStatus,
		isPaid: this.isPaid,
		paymentCompletedAt: this.paymentCompletedAt,
		steps,
		summary: {
			total: this.paymentFlow.length,
			completed: completedSteps,
			pending: pendingSteps,
			failed: failedSteps
		}
	};
};

module.exports = mongoose.model('Order', OrderSchema)

