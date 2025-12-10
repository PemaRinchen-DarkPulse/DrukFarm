# 🌾 DrukFarm

> A comprehensive agricultural marketplace platform connecting farmers, vegetable vendors, transporters, and Tshogpas (cooperative groups) in Bhutan.

## 📋 Overview

DrukFarm is a full-stack e-commerce platform designed for Bhutan's agricultural sector, featuring:

- **Multi-role system**: Vegetable Vendors, Farmers, Transporters, and Tshogpas (cooperatives)
- **QR-based order tracking**: Unique QR codes for every order with verification
- **3-step payment workflow**: Vegetable Vendor → Transporter → Tshogpa → Farmer
- **Mobile & Web support**: React Native mobile app + React web application
- **Geolocation features**: Dzongkhag-based address management and drop-off locations

## 🏗️ Project Structure

```
DrukFarm/
├── server/          # Express.js REST API
├── mobile/          # React Native (Expo) mobile app
├── ai_services/     # Dataset curation & ML taxonomy tools
└── README.md        # This file
```

## 🚀 Quick Start

### Backend (Express.js API)

```cmd
cd server
copy .env.example .env
:: Edit .env with your MongoDB URI
npm install
npm start
```

API base: `http://localhost:5000/api`

### Mobile App (React Native)

```cmd
cd mobile
npm install
npx expo start
```

Scan QR code with Expo Go app or press `a` for Android emulator.

### AI Services (Dataset Curation)

```cmd
cd ai_services
drukFarmVenv\Scripts\activate
python dataset_curator.py
```

See `ai_services/INDEX.md` for complete guide.

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with Express.js v4.19.2
- **Database**: MongoDB (Mongoose v8.5.1)
- **Auth**: bcrypt.js with CID-based authentication
- **Image Processing**: Canvas v3.2.0, QRCode v1.5.4
- **Deployment**: Vercel Serverless + Local dev support

### Mobile Frontend
- **Framework**: React Native v0.81.4 (Expo SDK v54.0.0)
- **Navigation**: React Navigation v7 (Native Stack + Bottom Tabs)
- **Styling**: NativeWind v4.1.23 (Tailwind for React Native)
- **Features**: expo-camera (QR scanning), expo-image-picker, react-native-maps
- **Icons**: Lucide React Native, Expo Vector Icons

### AI Services
- **Python Environment**: Virtual environment with dataset analysis tools
- **Tools**: Dataset curator, visualizer, taxonomy designer, reorganizer

## 👥 User Roles

### Vegetable Vendor
Browse products, manage cart/wishlist, place orders, track deliveries, write reviews

### Farmer
List products, manage inventory, process orders, confirm payments, generate order images

### Transporter
View assigned orders, update delivery status, scan QR codes, manage dispatch routes

### Tshogpas (Cooperatives)
Aggregate farmer products, process bulk orders, coordinate transporters, manage payment distribution

## 🔑 Key Features

### Order Management
- **QR Code Generation**: Every order gets a unique scannable QR code
- **Order Images**: Canvas-based image generation with order details
- **Multi-party Payments**: 3-step payment flow tracking
- **Status Tracking**: 8 status states (pending → completed)
- **Atomic Stock Management**: Prevents overselling with rollback

### Product Management
- **Binary Image Storage**: Efficient Buffer-based storage
- **Dynamic Serving**: Binary endpoints with proper MIME types
- **Categorization**: Category-based product organization
- **Reviews & Ratings**: Integrated review system with auto-aggregation

### Authentication
- **CID-based Auth**: 11-digit Bhutanese Citizen ID
- **Password Security**: bcrypt hashing with strong validation
- **Multi-role Support**: Single user schema with role differentiation

### Geolocation
- **Dzongkhag Support**: All 20 districts of Bhutan
- **Dispatch Addresses**: Hierarchical dzongkhag → gewog → location
- **Drop-off Points**: Geo-coordinated delivery locations
- **Maps Integration**: React Native Maps for location display

## 📡 API Endpoints

### Users
- `POST /api/users/register` - User registration
- `POST /api/users/login` - Login (phoneNumber + password)
- `GET /api/users/:cid` - Get user by CID
- `PUT /api/users/:cid` - Update profile
- `GET /api/users/:cid/image` - Get profile image

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/:id/image` - Get product image
- `GET /api/products/farmer/:cid` - Get farmer's products

### Orders
- `POST /api/orders/checkout` - Create order from cart
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders/seller-orders` - Get seller orders
- `PUT /api/orders/:orderId/status` - Update order status
- `POST /api/orders/:orderId/assign-transporter` - Assign transporter
- `GET /api/orders/:orderId/image` - Download order image

### Cart & Wishlist
- `POST /api/cart` - Add to cart
- `GET /api/cart` - Get cart
- `PATCH /api/cart/:itemId` - Update quantity
- `POST /api/wishlist` - Add to wishlist

### Categories, Reviews, Addresses
See `server/README.md` for complete API documentation.

## 🌍 Environment Variables

### Server (.env)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/drukfarm
FRONTEND_URL=http://localhost:5173,http://localhost:3000
```

### Mobile (app.json extra config)
```json
{
  "extra": {
    "API_DEV": "http://YOUR_IP:5000/api",
    "API_PROD": "https://your-backend.vercel.app/api"
  }
}
```

## 📦 Database Models

- **User**: CID, name, password, role, location, dzongkhag, phoneNumber
- **Product**: productName, categoryId, price, unit, stockQuantity, images
- **Order**: buyer, items, deliveryAddress, status, QR code, payment flows
- **Cart**: userCid, items (productId + quantity)
- **Wishlist**: userCid, items (productId refs)
- **Review**: productId, userCid, rating, comment
- **Address**: userCid, dzongkhag, place, isDefault
- **Category**: categoryName, description, image

## 🔧 Development

### Run Backend with Auto-reload
```cmd
cd server
npm run server  # Uses nodemon
```

### Run Mobile in Development Mode
```cmd
cd mobile
npx expo start --tunnel  # For network access
```

### Build Mobile App for Production
```cmd
cd mobile
eas build --platform android
eas build --platform ios
```

## 📱 Mobile Features

- Camera/QR code scanning (expo-camera)
- Image picking from gallery (expo-image-picker)
- Save order images to gallery (expo-media-library)
- Maps for drop-off locations (react-native-maps)
- Smooth animations (react-native-reanimated)
- Bottom tab navigation

## 🧪 Testing

Currently no automated tests. Utility scripts available:
- `server/utils/testIntegration.js`
- `server/utils/testPaymentWorkflow.js`

## 📄 License

Private project

## 👤 Author

**Pema Rinchen** (PemaRinchen-DarkPulse)

## 🔗 Repository

- **Owner**: PemaRinchen-DarkPulse
- **Repo**: DrukFarm
- **Branch**: main