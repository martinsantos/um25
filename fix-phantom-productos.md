# FIX: Phantom Products in Service 103 (Telecomunicaciones)

## Problem Summary

Products 18 ("Videoconferencia Profesional") and 19 ("Contact Center") are appearing on the service 103 page with:
- **Issue 1**: Both products show the SAME incorrect WiFi icon image
- **Issue 2**: According to the user, these products should NOT be associated with service 103 (Telecomunicaciones)

## Root Cause Analysis

The issue is in the Directus `productos` table where these two products have:
1. `servicio_id = 103` (should likely be a different service)
2. `imagen` field pointing to the same UUID (WiFi icon) instead of appropriate unique images

## Diagnostic Steps

### Step 1: Verify the Current State in Directus

Access Directus admin panel at: https://admin.ultimamilla.com.ar

Navigate to **Collections > productos** and filter by `servicio_id = 103`.

Look for:
- Product ID 18: "Videoconferencia Profesional"
- Product ID 19: "Contact Center"

Check their:
- `servicio_id` value (currently 103, but should it be?)
- `imagen` UUID (both should have DIFFERENT images)

### Step 2: Determine the Correct Service Association

Based on the product names:
- **Videoconferencia Profesional**: Could belong to:
  - Service 103 (Telecomunicaciones) ← Current (but user says wrong)
  - Service 105 (Cloud/Collaboration)
  - Service 106 (Consultoría IT)

- **Contact Center**: Could belong to:
  - Service 103 (Telecomunicaciones) ← Current (but user says wrong)
  - Service 105 (Soporte IT/Mesa de Ayuda)

**Question for user**: Which service should these products actually belong to?

## Fix Options

### Option A: Remove These Products from Service 103

If these products should NOT exist in service 103 at all:

```sql
-- Connect to PostgreSQL database
psql -U directus -d directus_db

-- Update servicio_id to NULL (removes association)
UPDATE productos
SET servicio_id = NULL
WHERE id IN (18, 19);

-- Or delete them entirely if they're duplicates
DELETE FROM productos WHERE id IN (18, 19);
```

### Option B: Reassign to Correct Service

If they should belong to a different service (e.g., service 105):

```sql
-- Update servicio_id to the correct service
UPDATE productos
SET servicio_id = 105  -- Change 105 to the correct service ID
WHERE id IN (18, 19);
```

### Option C: Fix Images Only

If the products DO belong to service 103 but just have wrong images:

```sql
-- First, find the correct image UUIDs for each product
-- Then update:
UPDATE productos
SET imagen = 'CORRECT_UUID_FOR_VIDEOCONF'
WHERE id = 18;

UPDATE productos
SET imagen = 'CORRECT_UUID_FOR_CONTACT_CENTER'
WHERE id = 19;
```

## Verification After Fix

1. **Clear Astro cache**:
   ```bash
   ssh ultimamilla
   cd /root/fumbling-field
   rm -rf .astro/ dist/
   npm run build
   pm2 restart astro-ultimamilla
   ```

2. **Check the page**:
   - Visit: https://ultimamilla.com.ar/servicios/103/telecomunicaciones-datos-voz-video
   - Verify that phantom products are gone (Option A) or have correct images (Option C)

3. **Check other services**:
   - If products were reassigned (Option B), verify they appear in the correct service page

## Prevent Future Issues

1. **Add data validation** in Directus:
   - Create a unique constraint on (servicio_id, titulo) to prevent duplicate product names per service
   - Add required validation for `imagen` field

2. **Audit all productos**:
   ```sql
   -- Find productos with duplicate images
   SELECT imagen, COUNT(*) as count,
          STRING_AGG(titulo, ', ') as products
   FROM productos
   WHERE imagen IS NOT NULL
   GROUP BY imagen
   HAVING COUNT(*) > 1;

   -- Find productos with NULL images
   SELECT id, titulo, servicio_id
   FROM productos
   WHERE imagen IS NULL;
   ```

3. **Review migration logs**:
   - Check `/Users/Shared/.../fumbling-field/migration_validation_report.txt`
   - Look for warnings about duplicate or missing images during migration

## Next Steps

**USER ACTION REQUIRED**:
1. Log into Directus admin panel
2. Navigate to productos collection
3. Identify products 18 and 19
4. Determine which fix option (A, B, or C) is correct
5. Apply the fix via Directus UI or SQL
6. Rebuild and restart the application
7. Verify the fix on the live site

**Need Help?**
- Products 18/19 data needed: titles, descriptions, which service they SHOULD belong to
- Correct image URLs/UUIDs for these products
- Confirmation if these are migration errors or manual data entry errors
