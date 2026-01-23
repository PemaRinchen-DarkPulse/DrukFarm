// Express server entry point (local dev + Vercel serverless handler)
require("dotenv").config();
const mongoose = require("mongoose");
const createApp = require("./app");

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/drukfarm";
// If SRV (mongodb+srv) resolution fails, try this non-SRV URI first (paste from Atlas' advanced/legacy connection string)
const MONGODB_NOSRV_URI = process.env.MONGODB_NOSRV_URI || "";
// If no NOSRV URI, fall back to local dev
const MONGODB_FALLBACK_URI = process.env.MONGODB_FALLBACK_URI || "mongodb://127.0.0.1:27017/drukfarm";

// Local dev: start long-running server
async function connectWithFallback() {
  const isSrv = /^mongodb\+srv:/i.test(MONGODB_URI);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");
    return { used: MONGODB_URI };
  } catch (err) {
    // Handle DNS SRV lookup failures commonly seen with mongodb+srv on some networks
    const srvFailure = isSrv && (
      err?.code === 'ESERVFAIL' ||
      /querySrv/i.test(String(err?.syscall || '')) ||
      /ENOTFOUND|EAI_AGAIN/i.test(String(err?.code || ''))
    );
    if (srvFailure) {
      if (MONGODB_NOSRV_URI) {
        console.warn("⚠️  DNS SRV lookup failed for mongodb+srv URI. Trying non-SRV URI...");
        try {
          await mongoose.connect(MONGODB_NOSRV_URI);
          console.log("✅ MongoDB connected (non-SRV)");
          return { used: MONGODB_NOSRV_URI, nosrv: true };
        } catch (e2) {
          console.warn("Non-SRV URI connection failed:", e2?.message || e2);
        }
      }
      console.warn("⚠️  Falling back to local Mongo:", MONGODB_FALLBACK_URI);
      await mongoose.connect(MONGODB_FALLBACK_URI);
      console.log("✅ MongoDB connected (fallback)");
      return { used: MONGODB_FALLBACK_URI, fallback: true };
    }
    throw err;
  }
}

async function start() {
  try {
    await connectWithFallback();

    const app = createApp();
    app.listen(PORT, "0.0.0.0",() => console.log(`🚀 Server running locally on port ${PORT}`));
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
      bufferCommands: false, // Disable mongoose buffering for serverless
    });
    console.log("✅ MongoDB connected (serverless)");
    cachedDb = mongoose.connection;
    return cachedDb;
  } catch (err) {
    // Handle DNS SRV lookup failures
    const srvFailure = isSrv && (
      err?.code === 'ESERVFAIL' ||
      /querySrv/i.test(String(err?.syscall || '')) ||
      /ENOTFOUND|EAI_AGAIN/i.test(String(err?.code || ''))
    );
    
    if (srvFailure && nosrv) {
      console.warn("⚠️  SRV lookup failed, trying non-SRV URI...");
      await mongoose.connect(nosrv, {
        bufferCommands: false,
      });
      console.log("✅ MongoDB connected (serverless non-SRV)");
      cachedDb = mongoose.connection;
      return cachedDb;
    }
    
    console.error("❌ Database connection failed:", err.message);
    throw err;
  }
}

async function handler(req, res) {
  try {
    // Connect to database
    await connectDatabase();

    // Create or reuse Express app
    if (!cachedApp) {
      cachedApp = createApp();
      console.log("✅ Express app created");
    }

    // Invoke Express app as a function (correct for serverless)
    return cachedApp(req, res);
  } catch (err) {
    console.error("❌ Serverless handler error:", err);
    
    // Send error response if headers not sent
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal Server Error",
        message: process.env.NODE_ENV === 'production' ? 'Function invocation failed' : err.message
      });
    }
  }
}

module.exports = handler;
module.exports.default = handler;
