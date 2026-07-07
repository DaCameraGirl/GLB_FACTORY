# GLB_FACTORY - Production Deployment Guide

## 📦 Package Contents

This production package includes:
- `dist/` - Optimized production build (HTML, CSS, JS bundles)
- `package.json` - Dependencies and scripts
- `README.md` - Full documentation
- `LICENSE` - MIT License
- `CONTRIBUTING.md` - Contribution guidelines
- `.env.example` - Environment variable template

## 🚀 Quick Deployment Options

### Option 1: Static Hosting (Recommended)

**GitHub Pages (Current Setup)**
- Already configured and auto-deploys from `main` branch
- Live at: https://dacameragirl.github.io/GLB_FACTORY/

**Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Cloudflare Pages**
- Connect GitHub repository
- Build command: `npm run build`
- Output directory: `dist`

### Option 2: Self-Hosted Server

**Requirements:**
- Node.js 18+ or any static file server
- HTTPS recommended for camera/file access

**Using Node.js:**
```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Serve with simple HTTP server
npx serve dist -p 3000
```

**Using Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/GLB_FACTORY/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Option 3: Docker Container

**Create Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Build and run:**
```bash
docker build -t glb-factory .
docker run -p 8080:80 glb-factory
```

## 🔑 Environment Setup

1. Copy `.env.example` to `.env`
2. Add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```
3. Rebuild if deploying to production:
   ```bash
   npm run build
   ```

## 📊 Performance Optimization

**Current Build Stats:**
- Bundle size: ~966 KB (minified)
- Gzip size: ~255 KB
- CSS: ~55 KB (minified)

**Recommendations:**
- Enable gzip/brotli compression on server
- Set cache headers for static assets
- Consider CDN for global distribution

## 🔒 Security Checklist

- ✅ HTTPS enabled (required for camera access)
- ✅ API keys in environment variables (not in code)
- ✅ CORS configured properly
- ✅ Content Security Policy headers recommended
- ✅ Rate limiting on API endpoints

## 🧪 Testing Deployment

After deployment, verify:
1. ✅ Site loads without errors
2. ✅ Portrait upload works
3. ✅ Gemini API face detection works
4. ✅ 3D viewport renders correctly
5. ✅ Mutation system generates avatars
6. ✅ GLB export downloads successfully

## 📱 PWA Installation

The app is PWA-ready. Users can install it:
- Chrome: Click install icon in address bar
- Mobile: "Add to Home Screen" option
- Works offline after first visit

## 🆘 Troubleshooting

**White screen on load:**
- Check browser console for errors
- Verify API key is set correctly
- Ensure HTTPS is enabled

**Face detection fails:**
- Verify Gemini API key is valid
- Check API quota/billing
- Ensure image format is supported

**3D viewport blank:**
- Check WebGL support in browser
- Verify Three.js loaded correctly
- Check for CORS issues with assets

## 📈 Monitoring

Recommended monitoring:
- Google Analytics for usage stats
- Sentry for error tracking
- API usage monitoring (Gemini quotas)
- Performance monitoring (Core Web Vitals)

## 🔄 Updates

To update production:
```bash
git pull origin main
npm install
npm run build
# Deploy updated dist/ folder
```

## 💰 Cost Considerations

**Gemini API Costs:**
- Free tier: 15 requests/minute
- Paid tier: $0.00025 per image
- Monitor usage in Google Cloud Console

**Hosting Costs:**
- GitHub Pages: Free
- Netlify: Free tier available
- Vercel: Free tier available
- Self-hosted: Server costs only

---

**Version:** 1.0.0  
**Last Updated:** 2026-07-07  
**Support:** https://github.com/DaCameraGirl/GLB_FACTORY/issues
