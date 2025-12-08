# DSE Frontend Deployment Guide

## ✅ Completed Updates

### 1. Security Fix

- **Updated Next.js from 15.1.0 to 16.0.7** to fix CVE-2025-66478 vulnerability
- This critical security update is required for deployment on Vercel

### 2. Environment Variables Configuration

- All API endpoints now use `NEXT_PUBLIC_API_URL` environment variable
- No more hardcoded URLs in the codebase
- Easy switching between development and production environments

---

## 🚀 Deploying to Vercel

### Step 1: Push Your Changes to GitHub

```bash
git add .
git commit -m "Fix: Update Next.js and configure environment variables"
git push origin main
```

### Step 2: Configure Environment Variables on Vercel

1. **Go to your Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (or import it if it's a new deployment)
3. **Navigate to**: Settings → Environment Variables
4. **Add the following variables**:

#### Required Environment Variables:

| Variable Name         | Value (Production)                     | Description                                   |
| --------------------- | -------------------------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `https://your-backend-url.com`         | Your backend API URL (without trailing slash) |
| `NEXTAUTH_URL`        | `https://your-frontend-url.vercel.app` | Your frontend URL                             |
| `NEXTAUTH_SECRET`     | `your-secure-random-string`            | Generate using: `openssl rand -base64 32`     |
| `NEXT_PUBLIC_WS_URL`  | `https://your-backend-url.com`         | WebSocket URL (usually same as API URL)       |

#### Optional (if using Google OAuth):

| Variable Name          | Value                       | Description               |
| ---------------------- | --------------------------- | ------------------------- |
| `GOOGLE_CLIENT_ID`     | `your-google-client-id`     | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `your-google-client-secret` | From Google Cloud Console |

#### Application Info (Optional):

| Variable Name             | Value   | Description         |
| ------------------------- | ------- | ------------------- |
| `NEXT_PUBLIC_APP_NAME`    | `DSE`   | Application name    |
| `NEXT_PUBLIC_APP_VERSION` | `1.0.0` | Application version |

### Step 3: Deploy

After adding environment variables:

1. Click **"Deploy"** or trigger a new deployment
2. Vercel will automatically build and deploy your application
3. The build should now succeed without the CVE error

---

## 🔧 Local Development Setup

### 1. Copy Environment Template

```bash
cp .env.example .env.local
```

### 2. Update `.env.local` with Your Values

```env
# For local development
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-secret-key

# Add your Google OAuth credentials if needed
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Start Development Server

```bash
npm run dev
# or
yarn dev
```

---

## 📝 Important Notes

### Backend URL Configuration

**✅ DO:**

- Use `https://your-backend-url.com` (no trailing slash)
- Ensure your backend is deployed and accessible
- Test the backend URL in your browser first

**❌ DON'T:**

- Use `http://localhost:4000` in production
- Add trailing slashes: `https://api.com/`
- Forget to update CORS settings on your backend

### Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use strong secrets** - Generate with `openssl rand -base64 32`
3. **Different secrets** - Use different `NEXTAUTH_SECRET` for dev and production
4. **Rotate secrets** - Change them periodically, especially if exposed

### Environment Variable Scopes on Vercel

- **Production**: Used for your main production deployment
- **Preview**: Used for preview deployments (PR branches)
- **Development**: Used when running `vercel dev` locally

You can set different values for each environment if needed.

---

## 🔍 Troubleshooting

### Build Fails with "Vulnerable Next.js"

- ✅ **Fixed!** Next.js has been updated to 16.0.7

### API Calls Return 404

- Check that `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is deployed and running
- Check backend CORS configuration allows your frontend domain

### Environment Variables Not Working

- Ensure variable names start with `NEXT_PUBLIC_` for client-side access
- Rebuild after changing environment variables
- Clear Next.js cache: `rm -rf .next`

### Google OAuth Not Working

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check Google Cloud Console authorized redirect URIs include:
  - `https://your-domain.vercel.app/api/auth/callback/google`
- Ensure `NEXTAUTH_URL` matches your actual domain

---

## 📚 Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)

---

## ✨ Quick Reference

### Generate a Secure Secret

```bash
openssl rand -base64 32
```

### Check Current Next.js Version

```bash
npm list next
```

### Test Environment Variables Locally

```bash
# Print all NEXT_PUBLIC_ variables
npm run dev
# Check browser console or Network tab
```

---

## 🎯 Deployment Checklist

- [ ] Next.js updated to 16.0.7 or higher
- [ ] `.env.local` configured for local development
- [ ] Changes pushed to GitHub
- [ ] Environment variables added to Vercel
- [ ] Backend URL is correct and accessible
- [ ] `NEXTAUTH_SECRET` generated and set
- [ ] Google OAuth credentials added (if using)
- [ ] Backend CORS configured for frontend domain
- [ ] Test deployment successful
- [ ] API calls working in production

---

**Need Help?** Check the Vercel deployment logs for detailed error messages.
