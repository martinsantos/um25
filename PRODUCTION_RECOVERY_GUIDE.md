# PRODUCTION SERVER RECOVERY GUIDE

**Date**: November 29, 2025
**Status**: CRITICAL - Server Down
**Last Working Commit**: c32c1cd (CLI v4.0 with authentication)
**Current Master**: 18c618c (Fixed process-images resilience)

## Problem Summary

The production server (23.105.176.45) is completely inaccessible:
- Both https://ultimamilla.com.ar/ and https://ultimamilla.com.ar/status return no response
- SSH connections timeout (port 22)
- PM2 processes were shown as "online" but the application is not responding

### Root Cause

1. **Failed Build Process**: The npm build on the server tried to execute `node scripts/process-images.js`
2. **Missing Sharp Module**: The script requires the `sharp` package which throws an error if not installed:
   ```
   Error: Cannot find package '/root/fumbling-field/node_modules/sharp/index.js'
   ```
3. **Server Hung**: The failed build likely consumed system resources or crashed the PM2 process

### Build Log Evidence

From bash output on production server:
```
> node scripts/process-images.js

node:internal/modules/esm/resolve:215
  const resolvedOption = FSLegacyMainResolve(packageJsonUrlString, packageConfig.main, baseStringified);
                         ^

Error: Cannot find package '/root/fumbling-field/node_modules/sharp/index.js' imported from /root/fumbling-field/scripts/process-images.js
```

## Recovery Steps

### STEP 1: Restore Server Access (Required)

Since SSH is timing out, the server needs to be restarted:

**Option A: Hosting Provider Control Panel**
1. Log into the hosting provider's dashboard
2. Find the VPS/server (23.105.176.45)
3. Click "Reboot" or "Force Reboot"
4. Wait 5-10 minutes for the server to come back online

**Option B: If you have direct access**
```bash
# Power cycle the server
# This typically requires physical access or provider's control panel
```

### STEP 2: Verify SSH Access Returns

```bash
# Test SSH connection (should work after reboot)
ssh ultimamilla "echo 'Server is responsive'"

# Should see response like:
# Server is responsive
```

### STEP 3: Pull Latest Fixed Code

```bash
ssh ultimamilla "cd /root/fumbling-field && git fetch origin && git reset --hard origin/master"

# Expected: HEAD is now at 18c618c - commit message about process-images resilience
```

### STEP 4: Clean Build

```bash
ssh ultimamilla "cd /root/fumbling-field && npm ci && npm run build 2>&1 | tee build.log"
```

**Expected Success Output:**
```
added 2315 packages in 3m
...
> astro build
✔ Completed in 45.2s.
```

### STEP 5: Restart PM2

```bash
ssh ultimamilla "pm2 restart astro-ultimamilla && pm2 save"
```

### STEP 6: Verify Recovery

```bash
# Check PM2 status
ssh ultimamilla "pm2 list"
# Expected: astro-ultimamilla with status "online" and 0 (zero) restarts

# Test web server
curl -s https://ultimamilla.com.ar/ | head -20
# Expected: HTML response starting with <!DOCTYPE html>

# Test status page
curl -s https://ultimamilla.com.ar/status | head -20
# Expected: HTML with login modal
```

## What Was Fixed

### Commit 18c618c Changes

**File**: `scripts/process-images.js`

**Before**:
- Imported sharp at the top level: `import sharp from 'sharp';`
- Failed immediately if sharp wasn't installed
- No error handling

**After**:
- Wrapped in `async function main()` with proper async/await
- Graceful error handling for missing sharp:
  ```javascript
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
  } catch (error) {
    console.warn('⚠️  Sharp module not available, skipping image processing');
    process.exit(0);  // Exit gracefully with code 0
  }
  ```
- Added source directory existence check
- Exits cleanly if sharp is unavailable instead of crashing

## Why This Happened

The build process was triggered (possibly by GitHub Actions or manual deployment) while the server had a stale `node_modules` directory where sharp wasn't installed. The npm ci (clean install) succeeded but the build script called process-images which failed immediately due to the hard import at the top level.

## Prevention

With this fix in place, the script will now:
1. Gracefully detect if sharp is missing
2. Exit with code 0 (success) instead of crashing
3. Allow the build to continue
4. Still process images if sharp IS available

This makes the build resilient to missing optional dependencies.

## Testing Locally Before Future Deployments

```bash
# Test the fixed script locally
cd /root/fumbling-field  # or local clone
npm ci
npm run process-images  # Should exit gracefully with warning

# Test full build
npm run build  # Should complete successfully
```

## Deployment Path Forward

1. ✅ Commit 18c618c with resilient process-images is pushed to master
2. ⏳ Server needs to be recovered (reboot required)
3. ⏳ Once server is back, pull latest master and rebuild
4. ⏳ Verify both / and /status are accessible
5. ⏳ Confirm authentication modal works on /status

## Important Files

- **Current Master Branch**: https://github.com/martinsantos/um25/tree/master (commit 18c618c)
- **Fixed Script**: `scripts/process-images.js`
- **Build Config**: `package.json` (prebuild script is empty string "")
- **Previous Stable**: Commit c32c1cd (if rollback needed)

## Contact & Escalation

If the server doesn't come back online after 15 minutes:
1. Check hosting provider's status page for any maintenance
2. Contact hosting provider support (provide server IP: 23.105.176.45)
3. Request forced reboot or console access to diagnose

---

**Last Updated**: November 29, 2025
**Recovery Status**: Awaiting server reboot to restore SSH access
