# Vercel Deployment Checklist

## ✅ Changes Applied

1. **Fixed api/index.js** - Now properly handles requests without crashes
2. **Updated vercel.json** - Uses `/api` directory (Vercel convention)
3. **Removed canvas dependency** - Eliminated native binary that crashes on Vercel
4. **Added Node.js version** - Specified in package.json engines
5. **Improved error handling** - Better logging and graceful failures

## 🚀 Deploy to Vercel

```bash
cd server
git add .
git commit -m "Fix serverless function invocation"
git push
```

## ⚙️ Required Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

- `MONGODB_URI` - Your MongoDB connection string (e.g., mongodb+srv://...)
- `FRONTEND_URL` - Your frontend URL (e.g., https://yourapp.vercel.app)
- `NODE_ENV` - Set to `production`

Optional:
- `MONGODB_NOSRV_URI` - Fallback non-SRV connection string (if SRV fails)

## 🔍 Check Deployment Logs

If deployment fails:
1. Go to Vercel Dashboard
2. Click on your deployment
3. View "Functions" tab
4. Click on "api/index" function
5. Check logs for error details

## 🧪 Test Your API

After deployment, test:
```bash
curl https://your-app.vercel.app/api/health
```

Should return: `{"status":"ok"}`

## 📝 Common Issues

**Issue**: Still getting 500 errors
**Solution**: Check environment variables are set correctly

**Issue**: Database connection timeouts
**Solution**: Whitelist Vercel IP (0.0.0.0/0) in MongoDB Atlas Network Access

**Issue**: Function timeout
**Solution**: Cold starts can take 10+ seconds on free tier

## 📂 File Structure

```
server/
├── api/
│   └── index.js          ← Vercel uses this
├── app.js                ← Express app setup
├── server.js             ← Local dev server
├── vercel.json           ← Vercel config
├── package.json          ← Dependencies
└── routes/               ← Your API routes
```
