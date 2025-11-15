# SLU Alumni Connect - Deployment Guide

This guide covers deploying the SLU Alumni Connect application to production.

## 🚀 Quick Deploy to Vercel

### Prerequisites
- Node.js 18+ installed
- Git repository
- Vercel account

### Steps

1. **Prepare the repository**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

3. **Set Environment Variables**
   In Vercel dashboard, add these environment variables:
   ```
   DATABASE_URL=your_postgresql_connection_string
   NEXTAUTH_SECRET=your_secret_key
   EMAIL_API_KEY=your_email_service_key
   STRIPE_PUBLIC_KEY=your_stripe_public_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

## 🗄️ Database Setup

### PostgreSQL (Recommended for Production)

1. **Create a PostgreSQL database**
   - Use services like Supabase, PlanetScale, or AWS RDS
   - Get your connection string

2. **Update Prisma schema**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Run migrations**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

### Alternative: Supabase Setup

1. Create a Supabase project
2. Copy the connection string
3. Set `DATABASE_URL` environment variable
4. Run Prisma migrations

## 📧 Email Service Setup

### SendGrid (Recommended)

1. Create SendGrid account
2. Get API key
3. Set environment variables:
   ```
   EMAIL_API_KEY=your_sendgrid_api_key
   FROM_EMAIL=noreply@yourdomain.com
   ```

### Alternative: Mailgun, AWS SES

Update `src/lib/email-service.ts` with your preferred provider's API.

## 💳 Payment Setup (Stripe)

1. Create Stripe account
2. Get API keys from dashboard
3. Set environment variables:
   ```
   STRIPE_PUBLIC_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

4. Configure webhooks in Stripe dashboard:
   - Endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

## 🔒 Security Configuration

### Environment Variables
```bash
NEXTAUTH_SECRET=your_very_secure_random_string
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
```

### Content Security Policy
Add to `next.config.js`:
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

## 📊 Analytics Setup

### Google Analytics
1. Create GA4 property
2. Get tracking ID
3. Set environment variable:
   ```
   GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
   ```

## 🖼️ File Upload Setup

### Cloudinary (Recommended)
1. Create Cloudinary account
2. Get credentials
3. Set environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

## 🔧 Performance Optimizations

### Next.js Configuration
Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
}
```

### Database Optimization
- Enable connection pooling
- Add database indexes for frequently queried fields
- Use read replicas for heavy read operations

### Caching Strategy
- Enable Redis for session storage
- Implement API response caching
- Use CDN for static assets

## 🚨 Monitoring & Logging

### Error Tracking
Integrate with Sentry:
```bash
npm install @sentry/nextjs
```

### Performance Monitoring
- Use Vercel Analytics
- Set up custom metrics for key user actions
- Monitor API response times

### Health Checks
Create `/api/health` endpoint:
```typescript
export async function GET() {
  return Response.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  })
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📋 Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Email service tested
- [ ] Payment system tested (use test mode first)
- [ ] Security headers configured
- [ ] Analytics tracking verified
- [ ] Error monitoring setup
- [ ] Performance optimizations applied
- [ ] Backup strategy implemented
- [ ] Domain and SSL configured

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify connection string format
   - Check firewall settings
   - Ensure database is accessible from deployment platform

2. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are listed in package.json
   - Clear build cache: `rm -rf .next`

3. **Environment Variable Issues**
   - Ensure all required vars are set
   - Check for typos in variable names
   - Verify variable values are properly escaped

### Performance Issues
- Enable database query logging
- Use Next.js built-in performance metrics
- Monitor memory usage and optimize heavy operations

## 📞 Support

For deployment issues:
1. Check Vercel deployment logs
2. Review application logs
3. Test locally with production environment variables
4. Contact your database/email service providers for service-specific issues

---

## 🎉 Post-Deployment

After successful deployment:
1. Test all major features
2. Set up monitoring alerts
3. Create admin user accounts
4. Import initial data (if any)
5. Announce launch to stakeholders
