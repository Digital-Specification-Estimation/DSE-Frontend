# Environment Variables Setup - Quick Guide

## 🎯 For Vercel Deployment

### Step-by-Step Instructions:

1. **Login to Vercel Dashboard**

   - Go to: https://vercel.com/dashboard
   - Select your project

2. **Navigate to Environment Variables**

   - Click on **Settings** tab
   - Click on **Environment Variables** in the sidebar

3. **Add These Variables** (one by one):

   **Click "Add New" for each:**

   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://your-backend-url.com
   Environment: Production, Preview, Development (select all)
   ```

   ```
   Name: NEXTAUTH_URL
   Value: https://your-frontend-url.vercel.app
   Environment: Production
   ```

   ```
   Name: NEXTAUTH_SECRET
   Value: [Generate using: openssl rand -base64 32]
   Environment: Production, Preview, Development (select all)
   ```

   ```
   Name: NEXT_PUBLIC_WS_URL
   Value: https://your-backend-url.com
   Environment: Production, Preview, Development (select all)
   ```

   **Optional - If using Google OAuth:**

   ```
   Name: GOOGLE_CLIENT_ID
   Value: your-google-client-id
   Environment: Production, Preview, Development (select all)
   ```

   ```
   Name: GOOGLE_CLIENT_SECRET
   Value: your-google-client-secret
   Environment: Production, Preview, Development (select all)
   ```

4. **Save and Redeploy**
   - After adding all variables, click "Save"
   - Go to **Deployments** tab
   - Click the three dots (...) on the latest deployment
   - Click **Redeploy**

---

## 🖥️ For Local Development

1. **Copy the example file:**

   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your values:**

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-local-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   NEXT_PUBLIC_WS_URL=http://localhost:4000
   ```

3. **Start the dev server:**
   ```bash
   npm run dev
   ```

---

## 🔑 Important URLs to Replace

- **`https://your-backend-url.com`** → Your actual backend URL (e.g., `https://dse-backend-production.up.railway.app`)
- **`https://your-frontend-url.vercel.app`** → Your actual Vercel deployment URL
- **`your-google-client-id`** → From Google Cloud Console
- **`your-google-client-secret`** → From Google Cloud Console

---

## ⚠️ Common Mistakes to Avoid

❌ **DON'T** add trailing slashes: `https://api.com/`  
✅ **DO** use: `https://api.com`

❌ **DON'T** use `http://localhost:4000` in production  
✅ **DO** use your actual deployed backend URL

❌ **DON'T** commit `.env.local` to git  
✅ **DO** keep it in `.gitignore` (already done)

---

## 🧪 Testing Your Setup

After deployment, check:

1. **Open your deployed site**
2. **Open browser DevTools** (F12)
3. **Go to Network tab**
4. **Try to login or make an API call**
5. **Check the request URL** - it should point to your backend, not localhost

If you see `http://localhost:4000` in production, the environment variable wasn't set correctly.

---

## 📞 Need Help?

Check `DEPLOYMENT_GUIDE.md` for detailed troubleshooting steps.
