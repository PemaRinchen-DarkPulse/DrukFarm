// Express server entry point (local dev + Vercel serverless handler)
require("dotenv").config();
const mongoose = require("mongoose");
const createApp = require("./app");

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/drukfarm";

// Local dev: start long-running server
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");

    const app = createApp();
    app.listen(PORT, () =>
      console.log(`🚀 Server running locally on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

// If run directly → start server
if (require.main === module) {
  start();
}

// Vercel serverless-compatible handler
let __conn = null;
let __app = null;

async function getApp() {
  if (!__conn) {
    if (!process.env.MONGODB_URI) {
      throw new Error("❌ MONGODB_URI is not set");
    }
    __conn = mongoose.connect(process.env.MONGODB_URI);
    await __conn;
    console.log("✅ MongoDB connected (serverless)");
  }
  if (!__app) {
    __app = createApp();
  }
  return __app;
}

async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
}

module.exports = handler;
module.exports.start = start;
