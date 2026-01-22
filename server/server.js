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
let __conn = null;
let __app = null;

async function getApp() {
  if (!__conn) {
    if (!process.env.MONGODB_URI) {
      throw new Error("❌ MONGODB_URI is not set");
    }
    const uri = process.env.MONGODB_URI;
    const nosrv = process.env.MONGODB_NOSRV_URI || "";
    const fallback = process.env.MONGODB_FALLBACK_URI || "mongodb://127.0.0.1:27017/drukfarm";
    const isSrv = /^mongodb\+srv:/i.test(uri);
    const connectOptions = {
        serverSelectionTimeoutMS: 5000, // Fail fast if DNS/Network issues
        socketTimeoutMS: 45000,
    };
    try {
      __conn = mongoose.connect(uri, connectOptions);
      await __conn;
      console.log("✅ MongoDB connected (serverless)");
    } catch (err) {
      const srvFailure = isSrv && (
        err?.code === 'ESERVFAIL' ||
        /querySrv/i.test(String(err?.syscall || '')) ||
        /ENOTFOUND|EAI_AGAIN/i.test(String(err?.code || ''))
      );
      if (!srvFailure) throw err;
      if (nosrv) {
        console.warn("⚠️  DNS SRV lookup failed for mongodb+srv (serverless). Trying non-SRV URI...");
        try {
          __conn = mongoose.connect(nosrv);
          await __conn;
          console.log("✅ MongoDB connected (serverless non-SRV)");
        } catch (e2) {
          console.warn("Serverless non-SRV URI connection failed:", e2?.message || e2);
        }
      }
      if (!__conn) {
        console.warn("⚠️  Falling back to local Mongo (serverless):", fallback);
        __conn = mongoose.connect(fallback);
        await __conn;
        console.log("✅ MongoDB connected (serverless fallback)");
      }
    }
  }
  if (!__app) {
    __app = createApp();
  }
  return __app;
}

async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error("CRITICAL: Serverless handler initialization failed:", err);
    // Vercel might not see the response if we crash too hard, but let's try to send one.
    res.status(500).send("Internal Server Error: Initialization Failed. Check logs.");
  }
}

module.exports = handler;
module.exports.start = start;
