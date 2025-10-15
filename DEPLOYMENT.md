# Halem Farm Backend - Vercel Deployment Guide

## Pre-deployment Checklist

### 1. Environment Variables
Set these in your Vercel dashboard:
- `MONGODB_URI`: Your MongoDB connection string

### 2. Project Configuration
The following files have been configured for Vercel:

- ✅ `vercel.json` - Vercel configuration
- ✅ `package.json` - Updated build scripts and dependencies
- ✅ Puppeteer configuration updated for serverless environment

### 3. Dependencies Added
- `@sparticuz/chromium`: Chromium for Vercel serverless functions
- `puppeteer-core`: Lightweight Puppeteer for serverless

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in project settings

3. **Set Environment Variables in Vercel Dashboard**
   - `MONGODB_URI`: `mongodb+srv://...`

4. **Deploy**
   - Vercel will automatically deploy on every push to main branch
   - Build time: ~2-3 minutes
   - Functions will auto-scale based on usage

## Important Notes

### Function Limits
- Serverless functions timeout: 30 seconds (configured in vercel.json)
- Memory limit: 1024MB (Vercel Pro) or 128MB (Hobby)
- Payload size limit: 4.5MB

### Puppeteer on Vercel
- Uses `@sparticuz/chromium` for headless browser
- PDF generation works in serverless environment
- Chrome binary is downloaded at runtime (first cold start may be slow)

### MongoDB Connection
- Uses connection pooling for efficiency
- Connections automatically managed by Vercel

## Troubleshooting

### Common Issues
1. **PDF Generation Timeout**
   - Large documents may timeout
   - Consider splitting large batches

2. **Memory Limits**
   - Upgrade to Vercel Pro for higher limits
   - Optimize PDF generation for smaller memory footprint

3. **Cold Starts**
   - First request after idle period may be slow
   - Chrome binary download on first run

### Logs
View function logs in Vercel dashboard under "Functions" tab

## Performance Optimization

1. **Reduce Bundle Size**
   - Only import needed modules
   - Use dynamic imports for heavy dependencies

2. **Optimize Database Queries**
   - Use indexes on frequently queried fields
   - Limit result sets

3. **Cache Static Content**
   - Vercel automatically caches static assets
   - API responses can be cached with headers

## Post-Deployment Testing

Test these endpoints:
- `GET /api/orders` - List orders
- `GET /api/customers` - List customers
- `POST /api/documents/generate` - Generate documents
- `POST /api/documents/download` - Download PDFs
- `POST /api/documents/print` - Print documents
- `GET /api/documents/billing` - Billing data

## Monitoring

- Monitor function execution time in Vercel dashboard
- Set up alerts for failures
- Monitor MongoDB connection metrics