# 🌾 DrukFarm API Server

> Express.js REST API for DrukFarm agricultural marketplace platform

## 🚀 Quick Start

### 1. Environment Setup

```cmd
copy .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/drukfarm
FRONTEND_URL=http://localhost:5173,http://localhost:3000
```

### 2. Install Dependencies

```cmd
npm install
```

### 3. Start Server

```cmd
npm start          # Production mode
npm run server     # Development mode (nodemon auto-reload)
```

Server runs at: `http://localhost:5000`  
API base: `http://localhost:5000/api`

## 📋 Tech Stack

- **Framework**: Express.js v4.19.2
- **Database**: MongoDB with Mongoose v8.5.1
- **Auth**: bcrypt.js (password hashing)
- **Image Processing**: Canvas v3.2.0, QRCode v1.5.4
- **Middleware**: CORS, Morgan (logging)
- **Deployment**: Vercel Serverless + Local development

## 🏗️ Project Structure

```
server/
├── app.js                  # Express app factory (routes, middleware)
├── server.js               # Entry point (DB connection, serverless handler)
├── models/                 # Mongoose schemas
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   ├── Cart.js
│   ├── Category.js
│   ├── Review.js
│   ├── Address.js
│   └── ...
├── routes/                 # API route handlers
│   ├── users.js
│   ├── products.js
│   ├── orders.js
│   ├── cart.js
│   ├── categories.js
│   ├── reviews.js
│   └── ...
├── middleware/             # Custom middleware
│   └── auth.js
├── utils/                  # Utility functions
│   ├── qr.js              # QR code generation
│   └── image.js           # Order image generation
└── .env.example           # Environment template
```

## 🔐 Authentication

**CID-based Authentication** (Bhutanese Citizen ID)

### Headers
```
Authorization: CID <11-digit-cid>
```
or
```
x-cid: <11-digit-cid>
```

### Example
```bash
curl -H "x-cid: 12345678901" http://localhost:5000/api/cart
```

**Note**: No JWT tokens. CID passed per request. For production, upgrade to JWT-based auth.

## 📡 API Endpoints

### 🔹 Users (`/api/users`)

#### Register User
```bash
POST /api/users/register
Content-Type: application/json

{
  "cid": "12345678901",           # 11 digits, unique
  "name": "Tashi Dorji",
  "password": "Pass@123",          # 8+ chars, upper, lower, digit, special
  "role": "farmer",                # vegetable_vendor | farmer | transporter | tshogpas
  "location": "Thimphu",
  "dzongkhag": "Thimphu",
  "phoneNumber": "17123456",       # 8 digits, unique
  "gender": "male"                 # Optional
}
```

#### Login
```bash
POST /api/users/login

{
  "phoneNumber": "17123456",
  "password": "Pass@123"
}

# Returns:
{
  "success": true,
  "user": { "cid": "12345678901", "name": "...", "role": "..." }
}
```

#### Get User
```bash
GET /api/users/:cid
GET /api/users/12345678901
```

#### Update User
```bash
PUT /api/users/:cid

{
  "name": "New Name",
  "location": "Paro"
}
```

#### Get Profile Image
```bash
GET /api/users/:cid/image
# Returns binary image (image/png or image/jpeg)
```

#### List All Users (with filters)
```bash
GET /api/users
GET /api/users?role=farmer
GET /api/users?dzongkhag=Thimphu
```

---

### 🔹 Products (`/api/products`)

#### Create Product
```bash
POST /api/products
Content-Type: application/json

{
  "productName": "Fresh Tomatoes",
  "categoryId": "65f...",
  "description": "High-quality organic tomatoes grown in Paro valley with no pesticides",  # 70-180 chars
  "price": 120.5,
  "unit": "kg",
  "stockQuantity": 100,
  "productImageBase64": "data:image/jpeg;base64,...",
  "createdBy": "12345678901"
}
```

#### Get All Products
```bash
GET /api/products
GET /api/products?cid=12345678901           # Filter by seller CID
GET /api/products?includeOwn=true&cid=...   # Include own products
```

#### Get Product by ID
```bash
GET /api/products/:id
# Returns product with populated category and seller details
```

#### Get Products by Category
```bash
GET /api/products/category/:categoryId
```

#### Get Products by Farmer
```bash
GET /api/products/farmer/:cid
```

#### Update Product
```bash
PUT /api/products/:id

{
  "price": 99.99,
  "stockQuantity": 50
}
```

#### Delete Product
```bash
DELETE /api/products/:id
```

#### Get Product Image
```bash
GET /api/products/:id/image
# Returns binary image with proper Content-Type
```

---

### 🔹 Categories (`/api/categories`)

#### List Categories
```bash
GET /api/categories
```

#### Create Category
```bash
POST /api/categories

{
  "categoryName": "Vegetables",
  "description": "Fresh vegetables",  # 15-45 chars
  "imageBase64": "data:image/png;base64,..."
}
```

---

### 🔹 Cart (`/api/cart`)

**Requires Authentication** (CID in header)

#### Add to Cart
```bash
POST /api/cart
x-cid: 12345678901

{
  "productId": "65f...",
  "quantity": 2
}
```

#### Get Cart
```bash
GET /api/cart
x-cid: 12345678901

# Returns cart with populated product details and seller info
```

#### Update Quantity
```bash
PATCH /api/cart/:itemId

{
  "quantity": 5
}
```

#### Remove from Cart
```bash
DELETE /api/cart/:itemId
```

---

### 🔹 Orders (`/api/orders`)

#### Checkout (Create Order from Cart)
```bash
POST /api/orders/checkout
x-cid: 12345678901

{
  "deliveryAddress": {
    "place": "Chang Lam, Thimphu",
    "dzongkhag": "Thimphu"
  }
}

# Returns order with generated QR code (base64 data URL)
# Clears cart after successful checkout
# Atomically decrements product stock
```

#### Create Standalone Order
```bash
POST /api/orders

{
  "buyer": { "cid": "...", "name": "..." },
  "items": [{ 
    "product": { "_id": "...", "productName": "..." },
    "quantity": 2,
    "priceAtPurchase": 120.5
  }],
  "deliveryAddress": { "place": "...", "dzongkhag": "..." }
}
```

#### Get My Orders (as Buyer)
```bash
GET /api/orders/my-orders
x-cid: 12345678901
```

#### Get Seller Orders
```bash
GET /api/orders/seller-orders
x-cid: 12345678901  # Farmer/Tshogpa CID
```

#### Filter Orders
```bash
GET /api/orders?status=pending
GET /api/orders?buyerCid=12345678901
GET /api/orders?sellerCid=98765432109
GET /api/orders?transporterCid=11111111111
```

#### Get Order by ID
```bash
GET /api/orders/:orderId
```

#### Update Order Status
```bash
PUT /api/orders/:orderId/status

{
  "status": "confirmed",     # pending, confirmed, shipped, in_transit, delivered, completed
  "changedBy": "12345678901"
}
```

#### Mark as Shipped
```bash
POST /api/orders/:orderId/ship

{
  "trackingNumber": "TRACK123"  # Optional
}
```

#### Confirm Order
```bash
POST /api/orders/:orderId/confirm
```

#### Assign Transporter
```bash
POST /api/orders/:orderId/assign-transporter

{
  "transporterCid": "11111111111",
  "estimatedDeliveryDate": "2025-11-20"
}
```

#### Confirm Farmer Payment
```bash
POST /api/orders/:orderId/confirm-farmer-payment

{
  "farmerCid": "98765432109",
  "amount": 1500,
  "paymentMethod": "cash"
}
```

#### Get Payment Status
```bash
GET /api/orders/:orderId/payment-status

# Returns 3-step payment flow details:
# - vegetable_vendor_to_transporter
# - transporter_to_tshogpa
# - tshogpa_to_farmer
```

#### Download Order Image
```bash
GET /api/orders/:orderId/image
# Returns PNG image with order details and QR code
```

---

### 🔹 Wishlist (`/api/wishlist`)

#### Add to Wishlist
```bash
POST /api/wishlist

{
  "userCid": "12345678901",
  "productId": "65f..."
}
```

#### Get Wishlist
```bash
GET /api/wishlist/:userCid
# Returns populated product details
```

#### Remove from Wishlist
```bash
DELETE /api/wishlist/:userCid/:productId
```

---

### 🔹 Reviews (`/api/reviews`)

#### Create Review
```bash
POST /api/reviews

{
  "productId": "65f...",
  "orderId": "65f...",
  "userCid": "12345678901",
  "userName": "Tashi Dorji",
  "rating": 4,              # 1-5
  "title": "Great product!",
  "comment": "Very fresh and delivered on time."
}

# Automatically updates Product.rating and Product.reviews count
```

#### Get Product Reviews
```bash
GET /api/reviews/product/:productId
```

#### Update Review
```bash
PUT /api/reviews/:reviewId

{
  "rating": 5,
  "comment": "Updated comment"
}
```

#### Delete Review
```bash
DELETE /api/reviews/:reviewId
# Automatically recalculates product rating
```

---

### 🔹 Addresses (`/api/addresses`)

#### Get User Addresses
```bash
GET /api/addresses/:userCid
```

#### Create Address
```bash
POST /api/addresses

{
  "userCid": "12345678901",
  "title": "Home",
  "place": "Chang Lam, Thimphu",
  "dzongkhag": "Thimphu",
  "isDefault": true
}
```

#### Update Address
```bash
PUT /api/addresses/:id

{
  "title": "Office",
  "isDefault": false
}
```

#### Delete Address
```bash
DELETE /api/addresses/:id
```

#### Set Default Address
```bash
PUT /api/addresses/:id/default
```

---

### 🔹 Dispatch Addresses (`/api/dispatch-addresses`)

#### Create Dispatch Address
```bash
POST /api/dispatch-addresses

{
  "dzongkhag": "Thimphu",
  "gewog": "Chang",
  "locations": ["Location 1", "Location 2"]
}
```

#### Get All
```bash
GET /api/dispatch-addresses
```

#### Get by Dzongkhag
```bash
GET /api/dispatch-addresses/:dzongkhag
```

#### Get by Dzongkhag & Gewog
```bash
GET /api/dispatch-addresses/:dzongkhag/:gewog
```

---

### 🔹 User Dispatch Addresses (`/api/user-dispatch-addresses`)

#### Create
```bash
POST /api/user-dispatch-addresses

{
  "userCid": "12345678901",
  "dzongkhag": "Thimphu",
  "gewog": "Chang",
  "location": "Main Pickup Point",
  "tshogpaName": "Thimphu Farmers Cooperative",
  "tshogpaPhoneNumber": "17999888"
}
```

#### Get User's Addresses
```bash
GET /api/user-dispatch-addresses/:userCid
```

#### Update
```bash
PUT /api/user-dispatch-addresses/:id
```

#### Delete
```bash
DELETE /api/user-dispatch-addresses/:id
```

---

### 🔹 Drop-off Locations (`/api/drop-off-locations`)

#### Get All
```bash
GET /api/drop-off-locations
```

#### Get Unique Dzongkhags
```bash
GET /api/drop-off-locations/dzongkhags
```

#### Get by Dzongkhag
```bash
GET /api/drop-off-locations/dzongkhag/:dzongkhag
```

#### Get by ID
```bash
GET /api/drop-off-locations/:id
```

#### Create
```bash
POST /api/drop-off-locations

{
  "name": "Thimphu Main Warehouse",
  "dzongkhag": "Thimphu",
  "coordinates": { "latitude": 27.4728, "longitude": 89.6393 },
  "address": "Chang Lam, Thimphu",
  "contactNumber": "17123456"
}
```

#### Update
```bash
PUT /api/drop-off-locations/:id
```

---

## 🗄️ Database Models

### User
```javascript
{
  cid: String (11 digits, unique, indexed),
  name: String,
  password: String (bcrypt hashed),
  role: Enum ['vegetable_vendor', 'farmer', 'transporter', 'tshogpas'],
  location: String,
  dzongkhag: String (20 valid dzongkhags),
  phoneNumber: String (8 digits, unique, indexed),
  profileImageData: Buffer,
  profileImageMime: String,
  gender: Enum ['male', 'female', 'other']
}
```

### Product
```javascript
{
  productName: String (capitalized),
  categoryId: ObjectId (ref: Category),
  description: String (70-180 chars),
  price: Number (min: 0),
  unit: String,
  stockQuantity: Number (min: 0),
  productImageData: Buffer,
  productImageMime: String,
  createdBy: String (CID, indexed),
  rating: Number (0-5),
  reviews: Number (count)
}
```

### Order
```javascript
{
  buyer: UserSnapshot,
  items: [ProductSnapshot],
  deliveryAddress: AddressSnapshot,
  status: Enum [pending, confirmed, shipped, in_transit, delivered, cancelled, payment_pending, completed],
  assignedTransporter: TransporterSnapshot,
  paymentFlows: [PaymentFlowStepSchema],
  statusHistory: [{ status, changedAt, changedBy }],
  orderQrCode: String (base64 data URL),
  orderImageData: Buffer,
  trackingNumber: String
}
```

### Cart
```javascript
{
  userCid: String (unique, indexed),
  items: [{ productId: ObjectId, quantity: Number }]
}
```

### Review
```javascript
{
  productId: ObjectId (indexed),
  orderId: ObjectId,
  userCid: String (compound unique index with productId),
  userName: String,
  rating: Number (1-5),
  title: String,
  comment: String,
  isEdited: Boolean,
  editedAt: Date
}
```

---

## 🔧 Key Features

### QR Code Generation
Every order automatically generates:
- Base64 data URL QR code (stored in `orderQrCode`)
- Scannable by mobile app for verification
- Contains order metadata

### Order Image Generation
Canvas-based image creation:
- Order details (ID, buyer, items, total)
- Embedded QR code
- Downloadable via `/api/orders/:orderId/image`

### Atomic Stock Management
```javascript
// Atomic decrement with validation
await Product.findOneAndUpdate(
  { _id: productId, stockQuantity: { $gte: quantity } },
  { $inc: { stockQuantity: -quantity } }
)
```
Prevents race conditions and overselling.

### 3-Step Payment Flow
1. **Vegetable Vendor → Transporter**: Order payment
2. **Transporter → Tshogpa**: Commission deduction
3. **Tshogpa → Farmer**: Final payout

Each step tracked with status, amount, date.

### Immutable Order Snapshots
Orders capture:
- User details at order time
- Product details/prices at purchase
- Address at delivery
- Prevents data inconsistency from future edits

### Password Security
- bcrypt hashing (10 rounds)
- Strong password validation regex
- Backward-compatible plaintext upgrade (should be removed)

---

## 🌍 Supported Dzongkhags (Districts)

```
Bumthang, Chhukha, Dagana, Gasa, Haa, Lhuentse, Mongar, 
Paro, Pemagatshel, Punakha, Samdrup Jongkhar, Samtse, 
Sarpang, Thimphu, Trashigang, Trashiyangtse, Trongsa, 
Tsirang, Wangdue Phodrang, Zhemgang
```

---

## 📦 Dependencies

### Production
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `cors` - CORS middleware
- `dotenv` - Environment config
- `qrcode` - QR generation
- `canvas` - Image generation
- `morgan` - HTTP logging

### Development
- `nodemon` - Auto-restart dev server

---

## 🚀 Deployment

### Vercel Serverless
```javascript
// server.js exports handler for Vercel
module.exports = (req, res) => {
  const app = createApp()
  return app(req, res)
}
```

### Environment Variables (Vercel Dashboard)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/drukfarm
FRONTEND_URL=https://drukfarm.com,https://www.drukfarm.com
```

### Local Development
```cmd
npm install
npm start
```

---

## 🛠️ Utility Scripts

### Test Integration
```cmd
node utils/testIntegration.js
```

### Test Payment Workflow
```cmd
node utils/testPaymentWorkflow.js
```

---

## ⚠️ Known Issues

1. **No JWT Auth**: CID in headers vulnerable to replay attacks
2. **No Rate Limiting**: API open to abuse/DoS
3. **No Input Sanitization**: Potential NoSQL injection
4. **Plaintext Password Fallback**: Should be removed
5. **No Pagination**: Large datasets may cause performance issues

---

## 📝 Error Responses

All errors return:
```json
{
  "success": false,
  "error": "Error message"
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

---

## 📄 License

Private Project

## 👤 Author

**Pema Rinchen** (PemaRinchen-DarkPulse)


