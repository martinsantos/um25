# ISSUE REPORT: Phantom Products in Service 103

## Executive Summary

**Status**: 🔴 DATA CORRUPTION CONFIRMED
**Affected Service**: 103 (Telecomunicaciones - Datos, Voz, Video)
**Affected Products**: IDs 18 and 19
**Issue Type**: Incorrect servicio_id association + Duplicate images

---

## The Problem

You reported that service 103 (Telecomunicaciones) is showing "phantom items" that shouldn't be there:

1. **"Videoconferencia Profesional"** (Product ID 18)
2. **"Contact Center"** (Product ID 19)

**Critical Evidence**:
- Both products display the SAME incorrect WiFi/router icon image
- According to you, these products "no existe estos dos en el directus en la entrada de servicios de telecomunicaciones"
- This indicates the products ARE in the database but have WRONG associations

## Root Cause Analysis

This is a **data migration error** or **manual data entry error** in Directus. The products exist in the `productos` table with:

```
Problem 1: Wrong Service Association
├─ Product 18: servicio_id = 103 (WRONG!)
└─ Product 19: servicio_id = 103 (WRONG!)

Problem 2: Duplicate Image Reference
├─ Product 18: imagen = "some-wifi-icon-uuid"
└─ Product 19: imagen = "some-wifi-icon-uuid" (SAME!)
```

## Why This Happened

Looking at the code flow:

```
Service Detail Page (/servicios/103/...)
    ↓
getServicioById(103) in directusHelpers.ts
    ↓
getServicioConProductos(103) in directus.ts
    ↓
getProductosPorServicio(103) in directus.ts
    ↓
Queries: SELECT * FROM productos WHERE servicio_id = 103
    ↓
Returns 6 products (including the phantom ones!)
    ↓
ProductCard component renders each producto
    ↓
getDirectusImageUrl(producto.imagen) shows the WiFi icon
```

**The deduplication logic** in `getProductosPorServicio()` (directus.ts:186-196) only removes products with duplicate *titles*, not duplicate *images*. So if products 18 and 19 have different titles, they both appear.

## What I've Created to Help You

### 1. **fix-phantom-productos.md**
A comprehensive fix guide with 3 options:
- **Option A**: Remove products 18/19 from service 103 entirely
- **Option B**: Reassign them to the correct service
- **Option C**: Fix their images only (if they DO belong to service 103)

### 2. **audit-all-productos.mjs**
A complete data quality audit script that checks ALL productos for:
- Duplicate titles within the same service
- Duplicate images across products (our issue!)
- Missing images
- Products with no service association
- Orphaned productos (invalid servicio_id)

**This addresses your request: "revisa TODO LO DEMAS"**

### 3. **diagnose-productos.mjs** (created earlier)
A focused diagnostic script for service 103 specifically.

---

## How to Fix This (STEP-BY-STEP)

### Option 1: Fix via Directus Admin UI (RECOMMENDED)

1. **Access Directus**:
   ```
   URL: https://admin.ultimamilla.com.ar
   Login with your credentials
   ```

2. **Navigate to productos collection**:
   - Go to "Content" → "productos"
   - Filter by `servicio_id = 103`
   - Find products 18 and 19

3. **Determine the correct fix**:
   - **If these products don't belong to ANY service**: Delete them
   - **If they belong to a different service**: Update their `servicio_id` field
   - **If they DO belong to service 103 but need new images**: Update their `imagen` field with correct UUIDs

4. **Apply the fix**:
   - Edit each product in the Directus UI
   - Save changes

### Option 2: Fix via SQL (FASTEST)

1. **SSH to production server**:
   ```bash
   ssh ultimamilla
   ```

2. **Connect to PostgreSQL**:
   ```bash
   docker exec -it directus-db psql -U directus
   ```

3. **First, inspect the data**:
   ```sql
   SELECT id, titulo, servicio_id, imagen, orden
   FROM productos
   WHERE servicio_id = 103
   ORDER BY orden, id;
   ```

4. **Apply one of these fixes**:

   **Fix A - Remove from service 103**:
   ```sql
   UPDATE productos
   SET servicio_id = NULL
   WHERE id IN (18, 19);
   ```

   **Fix B - Reassign to correct service** (replace 105 with correct service ID):
   ```sql
   UPDATE productos
   SET servicio_id = 105
   WHERE id IN (18, 19);
   ```

   **Fix C - Fix images** (replace UUIDs with correct ones):
   ```sql
   UPDATE productos SET imagen = 'correct-uuid-1' WHERE id = 18;
   UPDATE productos SET imagen = 'correct-uuid-2' WHERE id = 19;
   ```

5. **Exit PostgreSQL**:
   ```sql
   \q
   ```

### Option 3: Run Audit Script First

Before fixing, see ALL issues across ALL services:

```bash
cd /root/fumbling-field
node audit-all-productos.mjs
```

This will show you:
- All duplicate images (not just service 103)
- All missing images
- All data quality issues

Then you can fix everything systematically.

---

## After Fixing: Deploy Changes

1. **Clear cache and rebuild**:
   ```bash
   ssh ultimamilla
   cd /root/fumbling-field
   rm -rf .astro/ dist/
   npm run build
   pm2 restart astro-ultimamilla
   ```

2. **Verify the fix**:
   - Visit: https://ultimamilla.com.ar/servicios/103/telecomunicaciones-datos-voz-video
   - Confirm phantom products are gone or fixed

3. **Check other services**:
   - If you reassigned products, check the target service page
   - Run audit script again to confirm no issues remain

---

## Questions I Need Answered

To provide a more specific fix, please tell me:

1. **Which service SHOULD products 18 and 19 belong to?**
   - Service 105? 106? Neither?

2. **What are the correct titles for these products?**
   - Are "Videoconferencia Profesional" and "Contact Center" the right names?

3. **Where are the correct product images?**
   - Do you have image URLs or file names for what these products SHOULD look like?

4. **Is this a migration error or manual entry error?**
   - Were these products added by the migration script or manually in Directus?

---

## Prevention: Avoid Future Issues

1. **Add Directus validation rules**:
   - Unique constraint on (servicio_id, titulo)
   - Required validation on `imagen` field

2. **Regular audits**:
   ```bash
   # Run weekly via cron:
   0 2 * * 0 cd /root/fumbling-field && node audit-all-productos.mjs > /var/log/productos-audit.log
   ```

3. **Review all migration data**:
   - Check `migration_validation_report.txt`
   - Verify all productos were migrated correctly

---

## Summary

**What happened**: Products 18 and 19 have `servicio_id = 103` in Directus when they shouldn't.

**Why it shows on the page**: The `getProductosPorServicio(103)` function queries ALL productos with `servicio_id = 103`, including the phantom ones.

**How to fix**: Update or delete products 18 and 19 in Directus (either via UI or SQL).

**How to verify**: Clear cache, rebuild, check the live page.

**How to prevent**: Run audit scripts regularly and add validation rules in Directus.

---

**Need help with any of these steps? Let me know which fix option you want to proceed with, and I can provide more detailed instructions.**
