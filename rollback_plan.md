# UM25 PRODUCTION SYSTEM - ROLLBACK & VALIDATION PLAN

**Date:** $(date +%F)

**Prepared by:** Gemini AI

### Introduction

This document outlines the rollback plan for the recent deployment of the Directus integration on the UM25 production system. It includes:

1.  **Pre-change system state:** Captured data of critical components before deployment.
2.  **Rollback commands:** Step-by-step instructions to revert to the previous state.
3.  **Validation handoff:** A summary for stakeholders with updated URLs, token locations, and key recommendations.

### 1. Pre-Change System State

The state of the system before the changes was captured in `containers_before.txt`. This file includes:

*   **Git Commit Hash:** `adb03ea` (fix: update remaining hardcoded URLs to use PUBLIC_DIRECTUS_URL)
*   **Running Container IDs:** A complete list of active containers, their images, and names.

This data serves as a baseline to ensure a full and accurate rollback.

### 2. Rollback Commands

Execute these commands from the project's root directory (`/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/`) if a rollback is required.

#### Step 2.1: Revert to the Previous Git Commit

This command will reset the codebase to the state before the Directus integration.

```bash
# Revert to the commit before the main feature change
git revert --no-edit c15f571
```

#### Step 2.2: Restore the NGINX Configuration

Replace the current `nginx.conf` with the last known stable version.

```bash
# Restore the last known good NGINX configuration
cp -f /path/to/backup/nginx.conf ./nginx.conf
```

**Note:** Ensure you have a backup of the previous `nginx.conf` available. If not, you may need to manually revert the changes in the file.

#### Step 2.3: Restart Production Containers

This will apply the changes by rebuilding and restarting the production containers.

```bash
# Rebuild and restart services using the production compose file
docker-compose -f docker-compose.production.yml up --build -d
```

### 3. Stakeholder Summary & Validation Handoff

**To:** UM25 Stakeholders

**From:** Gemini AI

**Subject:** Deployment Complete: Directus Integration & Next Steps

#### Summary

The new Directus-powered backend has been successfully deployed. This update streamlines content management and improves system flexibility.

#### Key Changes & URLs

*   **New Admin Panel:** The Directus admin interface is now accessible at:
    *   **URL:** `http://<your_domain>:8055`
    *   **Credentials:** Located in `docker-compose.yml` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
*   **API Endpoint:** The Directus API is available at `http://<your_domain>:8055`.
*   **Application URL:** The primary application remains accessible at `https://www.umbot.com.ar`.

#### Token Location

The `DIRECTUS_STATIC_TOKEN` is now centralized. You can find it in these files:

*   `docker-compose.yml`: For the `directus-app` and `astro-app` services.

#### Recommendations & Next Steps

1.  **Validate Functionality:** Please test all critical pathways in the application to confirm everything is working as expected.
2.  **Update Admin Bookmarks:** Make sure to update your bookmarks to the new Directus admin panel.
3.  **Secure Credentials:** For enhanced security, we recommend moving the admin credentials and static token from `docker-compose.yml` to a `.env` file and adding it to `.gitignore`.
4.  **Schedule a Follow-up:** Let's schedule a brief meeting next week to review the deployment and address any questions.

Thank you for your support during this important update.

