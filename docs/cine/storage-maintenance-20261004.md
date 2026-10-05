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

## Completed dependency cleanup and remaining blocker

The owner authorized the eleven exact inactive releases and deployment after tests.
GitHub Actions run 37246224544 completed the cleanup and verified retained hashes.
UMBOT directory usage decreased from 13 GiB to 1.8 GiB, but the physical filesystem
only recovered about 200 MiB (3.8 → 4.0 GiB available). It remains at 96%; deployment
remains blocked. Filesystem is XFS. Shared extents are a possible explanation, not
a verified diagnosis. No deleted open file larger than 100 MiB was found.

Read-only audit found twelve historical Directus uploads archives totaling
11,473,969,398 bytes. The latest is 20260923-020001, recorded by the current uploads
content state; daily database backups continue through 20261004. The separate
offsite hash marker is present, but it alone does not verify offsite retrieval.
Any cleanup of uploads backup history requires a new exact audited plan and owner
authorization; it is outside the eleven-dependency approval.

## Upload archive ownership review — cleanup proposal withheld

Docker inspection identifies the live Directus mount as `/opt/directus-admin/uploads`
→ `/directus/uploads`; these archives back up that CMS media directory. The oldest
and latest archives each contain 2,141 regular files: 1,499 JPG, 594 PNG, 46 AVIF
and two health files (970,596,915 bytes uncompressed). 469 filenames identify
ULTIMA MILLA antecedentes imagery. Per-file hashing found 2,140 files unchanged;
only `directus/uploads/directus-health-file` differs between the oldest/latest
archives. Seven of the nine formerly proposed archives are referenced by preserved
checkpoints. There are no database files or movies in these
two inspected archives. The Blender movies under `public/cine/media` are unrelated.

The nine archives proposed earlier occupy 8,605,495,296 allocated bytes, but the
server already has a stricter pruning policy: every preserved checkpoint must
retain its referenced uploads archive and the latest bundle must match its verified
offsite marker. The previous three-latest proposal did not enforce those relations
and is withheld after the owner requested this ownership review.

`scripts/ops/audit-directus-uploads.sh` and workflow mode `uploads-audit` are read-only.
No apply option exists for uploads cleanup. The former untracked draft is also
inert. The eleven UMBOT dependency cleanup remains the only authorized maintenance
that has been applied. Production still requires a separate approved storage remedy.
