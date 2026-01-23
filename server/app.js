// Build and return an Express app (no DB connect, no listen) so it can run in serverless
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')

const usersRouter = require('./routes/users')
const categoriesRouter = require('./routes/categories')
const productsRouter = require('./routes/products')
const cartRouter = require('./routes/cart')
const ordersRouter = require('./routes/orders')
const wishlistRouter = require('./routes/wishlist')
const dropOffLocationsRouter = require('./routes/drop-off-locations')
const addressesRouter = require('./routes/addresses');
const { router: dispatchAddressesRouter } = require('./routes/dispatch-addresses');
const userDispatchAddressesRouter = require('./routes/user-dispatch-addresses');
const reviewsRouter = require('./routes/reviews');
const superadminRouter = require('./routes/superadmin');
const waitlistRouter = require('./routes/waitlist');

function createApp() {
  const app = express()

  // Config
  const FRONTEND_URL = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || ''
  const ALLOWED_ORIGINS = FRONTEND_URL
    ? FRONTEND_URL.split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000']

  // Middleware
  app.use(express.json({ limit: '12mb' }))
  app.use(morgan('dev'))
  
  // CORS configuration with dynamic origin checking for Vercel
  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (ALLOWED_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        
        // Allow any Vercel preview/deployment URLs
        if (origin.includes('.vercel.app')) {
          return callback(null, true);
        }
        
        // Otherwise, allow it (you can make this stricter in production)
        callback(null, true);
      },
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  )

  // Explicit OPTIONS handling for preflight requests
  app.options('*', cors())

  // Root - helpful landing for the API base
  app.get('/', (_req, res) => {
    res.status(200).send(
      'DrukFarm API is running. See /api/health, /api/products, /api/categories, /api/users, /api/addresses, /api/drop-off-locations, /api/dispatch-addresses, /api/user-dispatch-addresses, /api/reviews, /api/superadmin'
    )
  })

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  // Routes
  app.use('/api/users', usersRouter)
  app.use('/api/categories', categoriesRouter)
  app.use('/api/products', productsRouter)
  app.use('/api/cart', cartRouter)
  app.use('/api/orders', ordersRouter)
  app.use('/api/wishlist', wishlistRouter)
  app.use('/api/drop-off-locations', dropOffLocationsRouter)
  app.use('/api/addresses', addressesRouter);
  app.use('/api/dispatch-addresses', dispatchAddressesRouter);
  app.use('/api/user-dispatch-addresses', userDispatchAddressesRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/superadmin', superadminRouter);
  app.use('/api/waitlist', waitlistRouter);

  // 404 for unmatched routes
  app.use((req, res, next) => {
    if (res.headersSent) return next()
    res.status(404).json({ error: 'Not Found', path: req.originalUrl })
  })

  // Global error handler (fallback)
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}

module.exports = createApp
