// Vercel serverless function handler
require("dotenv").config();
const mongoose = require("mongoose");
const createApp = require("../app");

let cachedDb = null;
let cachedApp = null;

async function connectDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log("♻️ Using cached database connection");
    return cachedDb;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("❌ MONGODB_URI environment variable is not set");
  }

  const uri = process.env.MONGODB_URI;
  const nosrv = process.env.MONGODB_NOSRV_URI || "";
  const isSrv = /^mongodb\+srv:/i.test(uri);

  try {
    await mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ MongoDB connected (serverless)");
    cachedDb = mongoose.connection;
    return cachedDb;
  } catch (err) {
    const srvFailure = isSrv && (
      err?.code === 'ESERVFAIL' ||
      /querySrv/i.test(String(err?.syscall || '')) ||
      /ENOTFOUND|EAI_AGAIN/i.test(String(err?.code || ''))
    );
    
    if (srvFailure && nosrv) {
      console.warn("⚠️  SRV lookup failed, trying non-SRV URI...");
      await mongoose.connect(nosrv, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      });
      console.log("✅ MongoDB connected (serverless non-SRV)");
      cachedDb = mongoose.connection;
      return cachedDb;
    }
    
    console.error("❌ Database connection failed:", err.message);
    throw err;
  }
}

module.exports = async function handler(req, res) {
  try {
    await connectDatabase();

    if (!cachedApp) {
      cachedApp = createApp();
      console.log("✅ Express app initialized");
    }

    return cachedApp(req, res);
  } catch (err) {
    console.error("❌ Serverless handler error:", err);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal Server Error",
        message: process.env.NODE_ENV === 'production' ? 'Function invocation failed' : err.message
      });
    }
  }
};
