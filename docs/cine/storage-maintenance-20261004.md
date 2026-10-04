# Audited disk maintenance — 2026-10-04

Production deployment is stopped by the repository's disk >90% rule
(`REGLAS_ARQUITECTURA_SERVIDOR.md`, line 356). Root filesystem: 83,156,972 KiB,
79,227,308 used, 3,929,664 available (96%).

The inspected UMBOT service runs from
`/var/www/umbot-aceite/current`, which resolves to
`releases/20260627-2002-e960e06`; PM2 and `/proc/1330/cwd` agree.
Eleven inactive 2026-06-24 releases contain about 1.1 GiB each of node_modules.
The proposed cleanup removes ONLY those reproducible dependencies, retaining each
release's .next build, public files, db, .env and package manifest.
All eleven hidden npm lock inventories exist (294,135 bytes each); the script
saves them as dependency-inventory.retained.json before deleting dependencies.
Only the first three releases have a root package-lock.json; those are also retained.
It retains the current installation and all three newer June 27 releases.
Restoring a June 24 release afterwards requires rebuilding its dependencies from
its preserved lock/inventory in CI. No dependency reinstall is performed on the server.

`scripts/ops/prune-inactive-umbot-deps.sh` defaults to a read-only plan. Applying it
requires separate owner authorization for storage-apply. It checks the exact
allowlist, current symlink, live process working directories, target symlinks,
mount points and filesystem identity. Retained file checksums are verified after
cleanup without exposing credentials or database contents.

The existing Production Deploy workflow has separate manual storage-plan and
storage-apply modes. Both skip the application build/deploy. CI stores a receipt.
Never execute storage-apply solely from this document; obtain the user's approval.
