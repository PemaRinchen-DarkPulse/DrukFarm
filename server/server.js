// Express server entry point
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const morgan = require('morgan')

const usersRouter = require('./routes/users')
const categoriesRouter = require('./routes/categories')
const productsRouter = require('./routes/products')

const app = express()

// Config
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drukfarm'

// Middleware
app.use(express.json({ limit: '12mb' }))
app.use(morgan('dev'))
app.use(
	cors({
		origin: [
			'http://localhost:5173',
			'http://localhost:3000',
		],
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

async function start() {
	try {
		await mongoose.connect(MONGODB_URI, {
			// useNewUrlParser and useUnifiedTopology are defaults in Mongoose 6+
		})
		console.log('MongoDB connected')
		app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
	} catch (err) {
		console.error('Failed to connect to MongoDB', err)
		process.exit(1)
	}
}

start()

