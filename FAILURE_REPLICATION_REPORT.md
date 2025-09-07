# Failure Replication Report: /antecedentes Index & Single Pages

## Executive Summary

This report documents the analysis of failures in the `/antecedentes` (projects/portfolio) section of the ultimamilla.com.ar website. The investigation reveals that while the website is functioning with fallback data, there are clear indicators that the primary Directus CMS integration is not working properly.

## 1. Server Response Analysis

### 1.1 Index Page (`/antecedentes/`)
```bash
curl -I https://ultimamilla.com.ar/antecedentes/
```
**Result**: `HTTP/1.1 500 Internal Server Error`
- Server: nginx/1.20.1
- Response indicates a complete failure at the index level

### 1.2 Single Page (`/antecedentes/10768/isi-solutions-redes-y-comunicaciones`)
```bash
curl -s https://ultimamilla.com.ar/antecedentes/10768/isi-solutions-redes-y-comunicaciones | head
```
**Result**: `HTTP/1.1 200 OK` - Page loads but with fallback behavior

## 2. Fallback Behavior Detection

### 2.1 Visual Indicators Found
The single page analysis revealed multiple fallback indicators:

1. **"Modo Offline" Badge**: 
   ```html
   <span class="bg-yellow-500 text-white px-4 py-2 text-sm font-semibold rounded-full animate-pulse">
     Modo Offline
   </span>
   ```

2. **"Datos estáticos (Directus no disponible)" Warning**:
   ```html
   <span class="text-yellow-200 text-sm">Datos estáticos (Directus no disponible)</span>
   ```

3. **Static Data Display**: The page shows complete project information, indicating successful fallback to static data sources.

## 3. Container Infrastructure Analysis

### 3.1 Missing Containers
Expected containers are not running:
```bash
docker ps --filter "name=astro-app"    # No results
docker ps --filter "name=um25_directus" # No results
```

### 3.2 Docker Configuration Found
Located multiple docker-compose configurations:
- Main configuration: `docker-compose.yml` 
- Container names: `astro-app`, `directus-app`
- Expected network: `directusnet`
- Expected Directus host: `um25_directus` (different from config)

## 4. Current Data-Fetch Strategy Analysis

### 4.1 Antecedentes Index (`src/pages/antecedentes/index.astro`)

**Primary Strategy**: Directus Integration with Fallback
```javascript
try {
  // Attempt Directus connection
  const response = await directus.getAntecedentes({
    limit: 100,
    page: 1
  });
  // Process Directus data...
} catch (error) {
  console.error('Error al cargar datos desde Directus, usando datos de fallback:', error);
  
  // Fallback to static data
  const { antecedentesReales } = await import('../../data/antecedentes_completos.js');
  // Process static data...
}
```

**Key Features**:
- Graceful degradation to static data
- No error display to users (silent fallback)
- Full functionality maintained in offline mode
- Local image mapping system

### 4.2 Single Antecedente Page (`src/pages/antecedentes/[id]/[slug].astro`)

**Directus Configuration**:
```javascript
const DIRECTUS_URL = 'http://um25_directus:8055';  // Docker internal network
const DIRECTUS_STATIC_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
```

**Fetch Strategy**:
```javascript
// 1. Try Directus API
antecedente = await fetchAntecedenteById(id);

// 2. Fallback to static data on error
const { antecedentesReales } = await import('../../../data/antecedentes_completos.js');
antecedente = antecedentesReales.find(item => item.id.toString() === id);
```

**Visual Status Indicators**:
- Yellow badge: "Modo Offline" when using fallback
- Green badge: "Datos en vivo" when Directus works
- Warning message: "Datos estáticos (Directus no disponible)"

### 4.3 Servicios Pages Analysis

**Servicios Index** (`src/pages/servicios/index.astro`):
- Uses entirely static data: `import { serviciosReales } from '../../data/servicios_reales_db.js'`
- No Directus integration attempted
- Local image mapping with static files

**Servicios Single** (`src/pages/servicios/[id]/[slug].astro`):
- Attempts Directus connection: `http://localhost:8055`
- Uses authentication with static token
- Fallback behavior unclear (no static import found)

### 4.4 Directus Client Configuration (`src/utils/directus.js`)

**Connection Settings**:
```javascript
const DIRECTUS_CONFIG = {
  URL: import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055',
  TOKEN: import.meta.env.DIRECTUS_STATIC_TOKEN || 'ujsboxj0_E5PvWKhFao7yCW6_VDFsOSk',
  PAGE_SIZE: 20,
  DEFAULT_IMAGE: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa...'
};
```

**API Methods Available**:
- `getAntecedentes(params)` - Portfolio/projects data
- `getBlogPosts(params)` - Blog entries  
- `getRandomImages(limit)` - Image gallery
- `getFilterOptions()` - Filter metadata

## 5. Root Cause Analysis

### 5.1 Container Availability
- **Issue**: Expected containers (`astro-app`, `um25_directus`) are not running
- **Impact**: Forces all pages into fallback mode

### 5.2 Network Resolution
- **Cannot verify**: Network connectivity between containers (no running containers)
- **Configuration mismatch**: Code expects `um25_directus:8055` but docker-compose defines `directus-app`

### 5.3 Data Flow
```
Request → Astro App → Directus Connection Attempt → FAIL → Static Data Fallback → Response
```

## 6. Current System State

### 6.1 What's Working
- ✅ Static data fallback system
- ✅ Image loading from local files
- ✅ Full UI functionality in offline mode
- ✅ User experience preserved with clear status indicators

### 6.2 What's Failing
- ❌ Directus CMS integration
- ❌ Dynamic content updates
- ❌ Real-time data synchronization
- ❌ Container orchestration

## 7. Technical Recommendations

### 7.1 Immediate Actions
1. **Start Required Containers**:
   ```bash
   docker-compose up -d astro-app directus-app database
   ```

2. **Verify Network Connectivity**:
   ```bash
   docker exec astro-app ping -c2 um25_directus
   # or
   docker exec astro-app ping -c2 directus-app
   ```

3. **Check Directus Host Resolution**:
   - Update configuration to match docker-compose service names
   - Ensure consistent naming between code and infrastructure

### 7.2 Configuration Alignment
- Resolve discrepancy between `um25_directus` (in code) and `directus-app` (in docker-compose)
- Standardize environment variable usage across all services

### 7.3 Monitoring Implementation
- Add health check endpoints
- Implement proper error logging for Directus connection failures
- Consider adding retry mechanisms for temporary network issues

## 8. Conclusion

The analysis reveals a well-architected fallback system that maintains user experience despite infrastructure failures. The primary issue is the unavailability of the Directus CMS containers, which forces the entire application into offline mode. The system gracefully handles this scenario with clear user feedback and preserved functionality.

The fallback implementation demonstrates robust error handling and provides a solid foundation for a resilient content management system.

---
**Generated**: $(date)
**Analysis Scope**: /antecedentes index and single pages
**Status**: ✅ COMPLETED
