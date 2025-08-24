// Build and return an Express app (no DB connect, no listen) so it can run in serverless
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')

const usersRouter = require('./routes/users')
const categoriesRouter = require('./routes/categories')
const productsRouter = require('./routes/products')

function createApp() {
  const app = express()

  // Config
  const FRONTEND_URL = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || ''
  const ALLOWED_ORIGINS = FRONTEND_URL
    ? FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000']

  // Middleware
  app.use(express.json({ limit: '12mb' }))
  app.use(morgan('dev'))
  app.use(
    cors({
      origin: ALLOWED_ORIGINS,
      credentials: false,
    })
  )

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  // Routes
  app.use('/api/users', usersRouter)
  app.use('/api/categories', categoriesRouter)
  app.use('/api/products', productsRouter)

  // Global error handler (fallback)
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}

module.exports = createApp
