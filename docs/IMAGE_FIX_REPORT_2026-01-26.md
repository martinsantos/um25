# 🖼️ Image Loading Issue - Fix Report

**Date**: 2026-01-26 23:00 UTC
**Issue**: Images not displaying on production site
**Status**: ✅ PARTIALLY FIXED (servicios page), 🔄 ONGOING (Directus permissions)
**Priority**: HIGH

---

## Executive Summary

Production site was not displaying images due to Directus assets returning HTTP 403 Forbidden. Immediate fix applied using local static images. Root cause is Directus permission configuration requiring authentication for all asset access.

---

## Problem Description

### User Report
User reported: "averigua por que no se muestran imagenes" with screenshot showing blank image placeholders on `/servicios` page.

### Symptoms
- All hero background images showing as blank
- Service card images not loading
- Browser console showing HTTP 403 errors
- Image placeholders visible but no content

### Affected Pages
- ✅ Homepage (`/`) - Hero carousel
- ✅ Servicios (`/servicios`) - FIXED with local images
- ⚠️ Servicios detail pages - May be affected
- ⚠️ Antecedentes pages - May be affected
- ⚠️ Other pages using Directus assets

---

## Root Cause Analysis

### Issue #1: Directus Assets Returning 403 Forbidden

**Discovery**:
```bash
# Test Directus asset
$ curl -I https://www.ultimamilla.com.ar/directus-assets/b104c9b7-708f-4cc7-ab7f-5f8443a2475e
HTTP/2 403 Forbidden

# Direct to Directus (bypassing Nginx)
$ ssh server 'curl -I http://localhost:8055/assets/b104c9b7-708f-4cc7-ab7f-5f8443a2475e'
HTTP/1.1 403 Forbidden
```

**Root Cause**: Directus is configured to require authentication for ALL asset access, including public files.

**Evidence**:
- Directus logs show: `GET /assets/[uuid] 403 14ms`
- Files exist in Directus (verified via `/files/[uuid]` API endpoint)
- Access token in query params doesn't help: still returns 403
- Bearer authorization header doesn't help: still returns 403

**Why This Happened**:
- Directus default installation requires authentication
- No public access role configured for `directus_files` collection
- Assets were uploaded but permissions not set to public
- Previous code assumed Directus assets would be public

---

### Issue #2: Hardcoded Directus Asset URLs

**Problem**: Multiple pages had hardcoded URLs to `/directus-assets/[uuid]`

**Affected Files**:
```
src/pages/index.astro - Hero images (5 hardcoded URLs)
src/pages/servicios/index.astro - Hero background (1 hardcoded URL)
src/pages/servicios/[id]/[slug].astro - Service detail backgrounds
```

**Why This Is a Problem**:
- No fallback mechanism
- Can't easily switch image sources
- Hard to maintain
- No central configuration

---

## Fix Applied (Immediate - Workaround)

### Solution: Use Local Static Images

Created utility to map Directus UUIDs to local static assets while Directus permissions are being fixed.

#### 1. Created Image Mapping Utility

**File**: `src/utils/serviceImageMap.ts`

```typescript
export const serviceBackgroundImages: Record<string, string> = {
  'hero-default': '/images/services/servicios-it.jpg',
  'hero-redes': '/images/services/redes-comunicaciones.jpg',
  'hero-seguridad': '/images/services/ciberseguridad.jpg',
  'hero-telefonia': '/images/services/telefonia.jpg',
  'hero-web': '/images/services/servicios-web.jpg',

  '101': '/images/services/redes-comunicaciones.jpg',
  '102': '/images/services/ciberseguridad.jpg',
  // ... more mappings
};

export const getHeroBackground = (page?: string): string => {
  // Returns appropriate local image based on page
};
```

#### 2. Updated Pages to Use Local Images

**servicios/index.astro**:
```diff
- backgroundImage="https://www.ultimamilla.com.ar/directus-assets/b104c9b7..."
+ backgroundImage={getHeroBackground('servicios')}
```

**index.astro**:
```diff
  const heroImages = [
-   { url: `${PROD_URL}/directus-assets/a404fe13...`, alt: '...' },
+   { url: '/images/services/redes-comunicaciones.jpg', alt: '...' },
  ];
```

#### 3. Verified Local Images Exist

```bash
$ ls -lh /root/fumbling-field/public/images/services/
total 4.4M
-rwxr-xr-x. ciberseguridad.jpg (949K)
-rwxr-xr-x. redes-comunicaciones.jpg (948K)
-rwxr-xr-x. telefonia.jpg (861K)
-rwxr-xr-x. servicios-it.jpg (845K)
-rwxr-xr-x. servicios-web.jpg (791K)
```

#### 4. Testing Results

```bash
# Local images load successfully
✅ /images/services/ciberseguridad.jpg → HTTP 200 (949KB)
✅ /images/services/redes-comunicaciones.jpg → HTTP 200 (948KB)
✅ /images/services/telefonia.jpg → HTTP 200 (861KB)
✅ /images/services/servicios-it.jpg → HTTP 200 (845KB)
✅ /images/services/servicios-web.jpg → HTTP 200 (791KB)

# Servicios page now uses local images
✅ Servicios page using local images (verified in HTML)

# Directus assets still blocked (expected)
⚠️ Directus asset → HTTP 403 (needs separate fix)
```

---

## Permanent Fix (TODO - Directus Configuration)

### Option 1: Configure Public Access in Directus (RECOMMENDED)

**Steps Required**:

1. **Access Directus Admin**:
   ```
   URL: https://admin.ultimamilla.com.ar
   ```

2. **Create Public Role** (if not exists):
   - Settings → Roles & Permissions
   - Create role: "Public"
   - No authentication required

3. **Grant Public Read Access to Files**:
   - Settings → Roles & Permissions → Public
   - `directus_files` collection:
     - ✅ Read: All items
     - ❌ Create, Update, Delete: None
   - Fields: Allow all fields except system fields

4. **Configure Asset Access**:
   - Settings → Project Settings → Files & Thumbnails
   - Enable "Public Asset URL"
   - Or configure CORS/Access-Control headers

5. **Test**:
   ```bash
   curl -I http://localhost:8055/assets/[uuid]
   # Should return HTTP 200
   ```

6. **Update Nginx Config** (if needed):
   ```nginx
   location /directus-assets/ {
       proxy_pass http://localhost:8055/assets/;
       # Remove authentication requirements
   }
   ```

---

### Option 2: Add Access Token to Asset URLs

**Not Recommended** because:
- Token exposure in public HTML
- Security risk
- Cache issues
- Maintenance burden

If needed:
```typescript
const getDirectusAsset = (uuid: string) => {
  const token = import.meta.env.PUBLIC_DIRECTUS_TOKEN;
  return `${DIRECTUS_URL}/assets/${uuid}?access_token=${token}`;
};
```

---

### Option 3: Proxy Assets Through Astro SSR

**Moderate complexity** but secure:

```typescript
// src/pages/api/assets/[...uuid].ts
export async function GET({ params, request }) {
  const { uuid } = params;
  const directusUrl = import.meta.env.DIRECTUS_URL;
  const token = import.meta.env.DIRECTUS_TOKEN;

  const response = await fetch(
    `${directusUrl}/assets/${uuid}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return new Response(response.body, {
    headers: {
      'Content-Type': response.headers.get('Content-Type'),
      'Cache-Control': 'public, max-age=31536000'
    }
  });
}
```

Then use: `/api/assets/[uuid]` in HTML.

---

## Files Modified

### Created
- `src/utils/serviceImageMap.ts` - Image mapping utility

### Modified
- `src/pages/index.astro` - Hero images → local paths
- `src/pages/servicios/index.astro` - Background → local path

### Pending Modification
- `src/pages/servicios/[id]/[slug].astro` - Service detail pages
- `src/pages/antecedentes/[id]/[slug].astro` - Case study pages
- Any other pages using Directus assets

---

## Nginx Configuration (Current)

```nginx
location /directus-assets/ {
    proxy_pass http://localhost:8055/assets/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_cache_valid 200 7d;
    add_header Cache-Control "public, max-age=604800";
    add_header Access-Control-Allow-Origin "*";
}
```

**Status**: Configuration is correct, issue is with Directus backend permissions.

---

## Directus Environment (Current)

```env
PUBLIC_DIRECTUS_URL=http://localhost:8055
DIRECTUS_STATIC_TOKEN=k6P8LAY8_x_y1miB_KTlWnysCnx2Abky
PUBLIC_DIRECTUS_TOKEN=k6P8LAY8_x_y1miB_KTlWnysCnx2Abky
USE_DIRECTUS=true
```

**Status**: Token exists but not being used in asset URLs.

---

## Testing Checklist

### Immediate (After Workaround Fix)
- [x] Test servicios page images load
- [x] Test local image HTTP 200 status
- [x] Verify page renders without console errors
- [ ] Test homepage hero carousel
- [ ] Test all service detail pages
- [ ] Test antecedentes images

### After Directus Fix
- [ ] Test Directus asset URLs return HTTP 200
- [ ] Revert to Directus asset URLs in code
- [ ] Remove temporary `serviceImageMap.ts`
- [ ] Test with authentication disabled
- [ ] Test cache headers work correctly
- [ ] Verify no mixed content warnings (HTTP/HTTPS)

---

## Monitoring

### Health Check Commands
```bash
# Test local images
curl -I https://www.ultimamilla.com.ar/images/services/servicios-it.jpg

# Test Directus assets
curl -I https://www.ultimamilla.com.ar/directus-assets/[uuid]

# Check Directus logs
ssh server 'docker logs directus-admin-directus-app-1 --tail 50 | grep assets'

# Verify pages load
curl -s https://www.ultimamilla.com.ar/servicios | grep -c 'images/services'
```

### PM2 Status
```
│ 8  │ astro-ultimamilla    │ online    │ 65.8mb   │ 3 restarts │
```

---

## Action Items

### Immediate (Done ✅)
- [x] Create serviceImageMap.ts utility
- [x] Update servicios/index.astro to use local images
- [x] Update index.astro hero images to local
- [x] Test image loading on servicios page
- [x] Verify PM2 stable

### Short Term (Next 24h)
- [ ] Fix Directus public access permissions (Option 1)
- [ ] Test Directus assets return HTTP 200
- [ ] Update remaining pages to use local images (if Directus fix delayed)
- [ ] Document Directus permission configuration
- [ ] Add monitoring for image 403 errors

### Long Term (Next Week)
- [ ] Revert to Directus assets (once permissions fixed)
- [ ] Implement proper fallback mechanism
- [ ] Add image CDN/optimization
- [ ] Create automated test for image loading
- [ ] Document image architecture in CLAUDE.md

---

## Lessons Learned

### What Went Wrong
1. **Assumed Directus Defaults**: Assumed assets would be public by default
2. **No Fallback Mechanism**: No local image fallback in code
3. **Hardcoded URLs**: Difficult to switch between sources
4. **Incomplete Testing**: Didn't test image loading before deployment

### What Went Right
1. **Local Images Available**: Had backup images in `/images/services/`
2. **Quick Workaround**: serviceImageMap.ts solution in < 30 minutes
3. **Minimal Downtime**: Site stayed online during fix
4. **Reversible Fix**: Can revert to Directus once permissions fixed

### Process Improvements

1. **Image Architecture Documentation**:
   - Document where images should be stored
   - Document fallback strategy
   - Document Directus configuration requirements

2. **Pre-Deployment Checklist**:
   - Test all images load (HTTP 200)
   - Verify Directus permissions for public access
   - Check browser console for 403 errors
   - Test with network throttling

3. **Monitoring**:
   - Add alert for HTTP 403 on asset requests
   - Monitor image load times
   - Track Directus availability

---

## References

- **Directus Documentation**: https://docs.directus.io/configuration/config-options.html#files
- **Directus Permissions**: https://docs.directus.io/user-guide/user-management/permissions.html
- **Nginx Proxy**: https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/

---

## Contact & Support

**Server Access**:
```bash
ssh ultimamilla
cd /root/fumbling-field
```

**Directus Admin**:
```
URL: https://admin.ultimamilla.com.ar
Login: (check .env for credentials)
```

**Docker Logs**:
```bash
docker logs directus-admin-directus-app-1 --tail 100
```

---

**Issue Status**: 🔄 WORKAROUND APPLIED, PERMANENT FIX PENDING

**Next Action**: Configure Directus public access for `directus_files` collection
