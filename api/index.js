// Vercel Serverless Function entry for the backend
const mongoose = require('mongoose')
const createApp = require('../server/app')

let conn = null
let app = null

async function getApp() {
  if (!conn) {
    const MONGODB_URI = process.env.MONGODB_URI
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not set')
    }
    conn = mongoose.connect(MONGODB_URI)
    await conn
    console.log('MongoDB connected (serverless)')
  }
  if (!app) app = createApp()
  return app
}

module.exports = async (req, res) => {
  const app = await getApp()
  return app(req, res)
}
