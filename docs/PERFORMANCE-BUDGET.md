# Healios Performance Budget & Core Web Vitals Standards

## Overview

This document defines the minimum performance standards for the Healios e-commerce platform. All releases must meet these requirements to ensure optimal user experience and SEO rankings.

## Core Web Vitals Targets

| Metric | Target (Good) | Warning | Failing | Description |
|--------|---------------|---------|---------|-------------|
| **LCP** | < 2.5s | 2.5s - 4s | > 4s | Largest Contentful Paint - main content load time |
| **FID/INP** | < 100ms | 100ms - 300ms | > 300ms | First Input Delay / Interaction to Next Paint |
| **CLS** | < 0.1 | 0.1 - 0.25 | > 0.25 | Cumulative Layout Shift - visual stability |
| **FCP** | < 1.8s | 1.8s - 3s | > 3s | First Contentful Paint |
| **TTI** | < 3.8s | 3.8s - 7.3s | > 7.3s | Time to Interactive |
| **TTFB** | < 0.8s | 0.8s - 1.8s | > 1.8s | Time to First Byte |

## Bundle Size Budget

| Asset Type | Target | Maximum |
|------------|--------|---------|
| **Total JS** | < 200KB gzip | 500KB gzip |
| **Total CSS** | < 50KB gzip | 100KB gzip |
| **Hero Image** | < 100KB | 200KB |
| **Product Images** | < 50KB | 100KB |
| **Total Page Weight** | < 1MB | 2MB |

## Page-Specific Targets

### Homepage (/)
- LCP: < 2.0s (hero image)
- FCP: < 1.5s
- Total blocking time: < 200ms

### Product Detail Pages (/product/*)
- LCP: < 2.5s (product image)
- Product images: WebP format, lazy loaded
- Reviews: Lazy loaded below fold

### Category Pages (/category/*)
- LCP: < 2.5s
- Product grid: First 8 products eager loaded, rest lazy
- Pagination: No CLS from loading

### Checkout (/checkout)
- FID/INP: < 50ms (form interactions must be snappy)
- No external scripts blocking main thread
- Payment form: Minimal JS overhead

## Lighthouse Score Requirements

| Category | Minimum | Target |
|----------|---------|--------|
| **Performance** | 80 | 90+ |
| **Accessibility** | 90 | 100 |
| **Best Practices** | 90 | 100 |
| **SEO** | 95 | 100 |

## Monitoring & Enforcement

### Real User Monitoring (RUM)
- Implement `web-vitals` library for production tracking
- Send metrics to analytics on page load
- Set up alerts for threshold violations

### Pre-deployment Checks
1. Run Lighthouse CI on critical pages
2. Compare bundle sizes against budget
3. Check for new third-party scripts

### Weekly Review
- Review RUM data for regressions
- Identify slow pages needing optimization
- Track improvement over time

## Implementation Guidelines

### Images
```jsx
// Use OptimizedImage component for all images
import { OptimizedImage } from "@/components/ui/optimized-image";

// Always specify dimensions to prevent CLS
<OptimizedImage
  src="/product.jpg"
  alt="Product name"
  width={400}
  height={400}
  loading="lazy" // or "eager" for above-fold
/>
```

### Code Splitting
```jsx
// Lazy load routes and heavy components
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const ProductReviews = lazy(() => import("@/components/product/ProductReviews"));
```

### Third-Party Scripts
- Defer non-critical scripts
- Use async loading for analytics
- Avoid render-blocking resources

## Testing Checklist

Before each release, verify:

- [ ] Lighthouse Performance score ≥ 80 on mobile
- [ ] LCP < 2.5s on 3G connection
- [ ] No CLS from lazy-loaded content
- [ ] Bundle size within budget
- [ ] No console errors affecting performance
- [ ] Images optimized and properly sized
- [ ] Critical CSS inlined or preloaded

## Tools

- **Lighthouse**: Chrome DevTools, Lighthouse CI
- **WebPageTest**: https://webpagetest.org
- **PageSpeed Insights**: https://pagespeed.web.dev
- **Bundle Analyzer**: `vite-bundle-visualizer`
- **RUM**: web-vitals library with GA4 integration

## References

- [Google Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring Calculator](https://googlechrome.github.io/lighthouse/scorecalc/)
- [web-vitals Library](https://github.com/GoogleChrome/web-vitals)

---

**Last Updated**: December 2025  
**Owner**: Development Team  
**Review Frequency**: Monthly
