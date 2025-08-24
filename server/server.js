// Express server entry point (local dev). For serverless, see api/index.js
require('dotenv').config()
const mongoose = require('mongoose')
const createApp = require('./app')

const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drukfarm'

async function start() {
	try {
		await mongoose.connect(MONGODB_URI)
		console.log('MongoDB connected')
		const app = createApp()
		app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
	} catch (err) {
		console.error('Failed to connect to MongoDB', err)
		process.exit(1)
	}
}

if (require.main === module) {
	start()
}

module.exports = { start }

