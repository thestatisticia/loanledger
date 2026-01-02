# Deployment Guide - Vercel

## Prerequisites
- Node.js installed
- Vercel account
- GitHub repository connected

## Deployment Steps

### 1. Install Vercel CLI (if using CLI method)
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

For production deployment:
```bash
vercel --prod
```

## Environment Variables

Set the following environment variable in Vercel Dashboard:

- `VITE_PRIVY_APP_ID`: Your Privy App ID (currently: `cmjs8eug801s9ju0db1fv7bqy`)

### How to Set Environment Variables in Vercel:

1. Go to your project settings in Vercel Dashboard
2. Navigate to "Environment Variables"
3. Add each variable:
   - Name: `VITE_PRIVY_APP_ID`
   - Value: Your Privy App ID
   - Environment: Production, Preview, Development (select all)

## Build Configuration

The project is configured with `vercel.json`:
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework: Vite

## Post-Deployment

After deployment:
1. Your app will be available at: `https://your-project-name.vercel.app`
2. You can set up a custom domain in Vercel project settings
3. All future pushes to `main` branch will trigger automatic deployments

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18.x by default)
- Check build logs in Vercel Dashboard

### Environment Variables Not Working
- Ensure variables are prefixed with `VITE_` for Vite apps
- Redeploy after adding new environment variables
- Check that variables are set for the correct environment (Production/Preview/Development)

### Routing Issues
- The `vercel.json` includes rewrites to handle React Router
- All routes should redirect to `index.html` for client-side routing

