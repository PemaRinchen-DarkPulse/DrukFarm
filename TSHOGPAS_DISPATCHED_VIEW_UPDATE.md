# TshogpasDashboard Dispatched View Column Update

## Changes Made

### Frontend Updates (mobile/components/TshogpasDashboard.jsx)

#### Updated Table Header for Dispatched View
**Before**: Order ID, Customer, Product, Qty, Amount, Action/Status
**After**: Order ID, Transporter, Price, Farmer, Action/Status

#### Updated Table Row for Dispatched View
**Before**: Showed customer name, product name, quantity, amount, action/status
**After**: Shows transporter name, price, farmer name, action/status

### Backend Updates (server/routes/orders.js)

#### Enhanced `/tshogpas` endpoint response
Added the following fields to support the new column structure:

1. **Transporter Information**:
   - `transporter` object with CID and name
   - `transporterName` string for easy access
   - Fetches transporter names from User collection

2. **Farmer Information**:
   - `farmer` object with CID and name (maps to product seller)
   - `sellerName` string for backward compatibility

3. **Payment Flow Data**:
   - `paymentFlow` array
   - `isPaid` boolean
   - `paymentCompletedAt` timestamp
   - `paymentStatusHistory` array
   - `paymentConfirmedBy` and `paymentConfirmedAt`
   - `settlementDate`

## Column Specifications

### Dispatched View Table Structure
| Column | Description | Data Source |
|--------|-------------|-------------|
| **Order ID** | Order identifier | `item.orderId` |
| **Transporter** | Name of assigned transporter | `item.transporter?.name` or `item.transporterName` |
| **Price** | Order total amount | `item.totalPrice` |
| **Farmer** | Name of product seller/farmer | `item.farmer?.name` or `item.sellerName` |
| **Action/Status** | ✅ button (Pending) or Status text (Completed) | Based on `paymentTab` |

### Data Flow
1. **Backend**: `/api/orders/tshogpas` endpoint now includes transporter and farmer data
2. **Frontend**: TshogpasDashboard renders the new column structure
3. **Payment Tab Filtering**: Uses payment flow data to properly categorize orders

## Expected Behavior
- **Pending Tab**: Shows orders where tshogpa payment is pending with ✅ action button
- **Completed Tab**: Shows orders where tshogpa payment is completed with status text
- **Dispatched Filter**: Applied to show only orders relevant to dispatched items
- **Data Consistency**: Transporter and farmer names properly displayed from backend data

## Backward Compatibility
- Fallback values provided for missing transporter/farmer data
- Legacy settlement date logic maintained
- Payment workflow hierarchy validation preserved

This update provides tshogpas with better visibility into the payment workflow by showing relevant parties (transporter and farmer) involved in each order's fulfillment process.