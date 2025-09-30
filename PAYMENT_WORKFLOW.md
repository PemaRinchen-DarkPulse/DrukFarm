# Payment Workflow Implementation

This document describes the **dynamic 3-step payment workflow** implementation for the DrukFarm application, supporting multiple payment flows with frontend integration.

## Overview

The payment workflow ensures secure, trackable payment processing through dynamic flows based on order participants:

### **Dynamic Payment Flows**

1. **Flow 1**: Consumer → Transporter → Tshogpa → Farmer *(full flow)*
2. **Flow 2**: Consumer → Tshogpa → Farmer *(no transporter)*
3. **Flow 3**: Consumer → Farmer *(direct, no intermediaries)*
4. **Flow 4**: Consumer → Transporter → Farmer *(tshogpa skipped)*

### **Special Cases**

- **Tshogpa is Seller**: When tshogpa is also the farmer, payment completes at tshogpa step
- **Single Click Completion**: For tshogpa-sellers, one ✅ click completes the entire flow

## ✅ **Frontend Integration**

### **Button Actions**

Each dashboard has ✅ buttons that trigger backend payment confirmations:

- **Transporter**: Confirms `consumer_to_transporter` step
- **Tshogpa**: Confirms `transporter_to_tshogpa` or `consumer_to_tshogpa` step
- **Farmer**: Confirms final payment step (`*_to_farmer`)

### **Validation Rules**

🚨 **Critical Constraint**: Payment can only be confirmed if `order.status === 'delivered'`

```javascript
// API validates delivery status
if (order.status !== 'delivered') {
    return res.status(400).json({ error: 'Order has not been delivered yet' });
}
```

## Schema Extensions

### **New Payment Fields**

```javascript
// Order Model Extensions
paymentFlow: [PaymentFlowStepSchema]          // Dynamic payment steps
paymentCompletedAt: Date                      // Final completion timestamp
paymentStatusHistory: [PaymentStatusHistorySchema] // Complete audit trail
```

### **Step Types**

```javascript
step: {
    type: String,
    enum: [
        'consumer_to_transporter',
        'transporter_to_tshogpa', 
        'tshogpa_to_farmer',
        'transporter_to_farmer',    // Tshogpa skipped
        'consumer_to_tshogpa',      // Transporter skipped  
        'consumer_to_farmer'        // Direct transaction
    ]
}
```

## API Endpoints

### **Role-Specific Confirmation Endpoints**

#### 1. Transporter Payment Confirmation
```http
POST /api/orders/:orderId/payment/transporter-confirm
Authorization: x-cid: {transporterCid}
```

#### 2. Tshogpa Payment Confirmation  
```http
POST /api/orders/:orderId/payment/tshogpa-confirm
Authorization: x-cid: {tshogpasCid}
```

#### 3. Farmer Payment Confirmation
```http
POST /api/orders/:orderId/payment/farmer-confirm
Authorization: x-cid: {farmerCid}
```

### **Utility Endpoints**

#### Initialize Payment Flow
```http
POST /api/orders/:orderId/payment/initialize
```

#### Get Payment Status
```http
GET /api/orders/:orderId/payment/status
```

#### Get Payment History
```http
GET /api/orders/:orderId/payment/history
```

#### Batch Status Check
```http
POST /api/orders/payment/batch-status
Body: { "orderIds": ["id1", "id2", ...] }
```

#### Pending Actions
```http
GET /api/orders/payment/pending-actions
```

## Frontend API Integration

### **Updated Mobile API Functions**

```javascript
// New payment confirmation functions
import { 
    confirmTransporterPayment,
    confirmTshogpaPayment, 
    confirmFarmerPayment,
    getPaymentStatus,
    initializePaymentFlow 
} from '../lib/api';

// Usage in dashboard components
await confirmTransporterPayment({ orderId, cid: user?.cid });
```

### **Updated Dashboard Components**

✅ **TransporterDashboard**: Uses `confirmTransporterPayment()`
✅ **TshogpasDashboard**: Uses `confirmTshogpaPayment()`  
✅ **FarmerDashboard**: Uses `confirmFarmerPayment()`

### **Error Handling**

```javascript
try {
    await confirmTransporterPayment({ orderId, cid: user?.cid });
    Alert.alert('Success', 'Payment confirmed successfully');
} catch (error) {
    if (error.body?.error?.includes('Order has not been delivered')) {
        Alert.alert('Error', 'Order must be delivered before payment can be confirmed');
    } else if (error.body?.error?.includes('Payment already confirmed')) {
        Alert.alert('Info', 'Payment has already been confirmed');
    } else {
        Alert.alert('Error', 'Failed to confirm payment');
    }
}
```

## Business Logic

### **Automatic Flow Detection**

The system automatically detects which flow applies based on order fields:

```javascript
// Flow detection logic
const hasTransporter = order.transporter?.cid;
const hasTshogpa = order.tshogpasCid;
const farmer = order.product.sellerCid;
const tshogpaIsSeller = hasTshogpa && order.tshogpasCid === farmer;

// Dynamic flow generation based on participants
```

### **Atomic Database Updates**

- ✅ All payment updates use **MongoDB transactions**
- ✅ **paymentStatusHistory** tracks every change
- ✅ **isPaid** automatically updates when final step completes
- ✅ **paymentCompletedAt** timestamp recorded

### **Authorization Matrix**

| Role | Can Confirm | Step Type |
|------|------------|-----------|
| **Transporter** | `consumer_to_transporter` | Receiving payment from consumer |
| **Tshogpa** | `transporter_to_tshogpa`, `consumer_to_tshogpa` | Receiving from transporter/consumer |
| **Farmer** | `*_to_farmer` | Final payment reception |

### **Special Case Handling**

When **tshogpa is also the seller**:
- Single ✅ click completes payment
- `isPaid = true` set immediately  
- No separate farmer step required

## Testing

### **Test Scripts**

```bash
# Test complete workflow
node server/utils/testPaymentWorkflow.js workflow

# Test flow detection
node server/utils/testPaymentWorkflow.js flows

# Test error scenarios  
node server/utils/testPaymentWorkflow.js errors
```

### **Test Scenarios**

1. **Full Flow Test**: Consumer → Transporter → Tshogpa → Farmer
2. **Tshogpa-Seller Test**: Special single-click completion
3. **Error Validation**: Non-delivered order rejection
4. **Authorization Test**: Role-based access control

## Security & Data Integrity

### **🔒 Security Features**

- **Role-based Authorization**: Only payment receivers can confirm steps
- **Delivery Status Validation**: Payments blocked until delivery
- **Transaction Safety**: MongoDB transactions prevent corruption
- **Audit Trail**: Complete history of all payment activities

### **🛡️ Data Integrity**

- **Atomic Updates**: Payment state changes are transaction-safe
- **Immutable History**: Payment status history cannot be modified
- **Automatic Validation**: Business rules enforced at model level
- **Backward Compatibility**: Existing orders continue working

## Migration & Deployment

### **✅ Zero Breaking Changes**

- All new fields have sensible defaults
- Legacy `isPaid` boolean still works
- Existing order processing unaffected
- Progressive enhancement approach

### **🚀 Deployment Steps**

1. **Deploy Backend**: Updated Order model + API endpoints
2. **Update Mobile**: New API functions + dashboard integration  
3. **Test Integration**: Verify payment flows work end-to-end
4. **Monitor**: Check payment completion rates and error logs

## Production Considerations

### **📊 Monitoring**

- Track payment completion rates by flow type
- Monitor delivery-to-payment time gaps
- Alert on failed payment confirmations
- Audit payment flow performance

### **🔧 Maintenance**

- Regular validation of payment data integrity
- Performance optimization for large order volumes
- Backup strategy for payment history
- Recovery procedures for failed transactions

This implementation provides a **robust, scalable, and secure** payment workflow that adapts to different order configurations while maintaining **complete transparency** and **audit capabilities** for all stakeholders in the DrukFarm ecosystem! 🌾