# Origin retirement — 28 October 2026

The active production destination is Hostinger179.198.115.115. Vivero web, management and local certificate renewal remain on InterServer68.168.218.28. Mailing, preview, the independent observer and offsite backups remain on76.13.234.213. The old23.105.176.45 is not a deployment target.

## Old access names

The seven old UMSA access records move to the new ingress while preserving their DNS records. mail/webmail redirect to the existing Google Workspace mail service. cpanel/cpcalendars/cpcontacts/webdisk/whm return410 because those services were explicitly declared unused; no CyberPanel, FTP or unknown Remnanode is installed. These redirects do not claim to import legacy calendar, contacts or file data.

`hostinger-legacy-access.yml` first prepares seven HTTP-01 endpoints; after DNS is updated, activate verifies every public challenge, obtains a separate managed certificate and activates HTTPS. Only the dedicated legacy-access.conf is changed. Nginx validation and main-service health probes gate each reload; previous config is retained and restored on failure. Existing certificates, applications, databases, sessions and backups are preserved. The existing renewal timer covers the additional lineage.

## Replaced one-off operations

The old fonts, canonical, Nginx-backup, logging and storage workflow entry points now call a pinned read-only Hostinger runtime verification. Fonts/canonical/logging are already managed by the versioned normal UMSA publisher. Backup-named config files are outside the explicit live include. Storage cleanup plans for the old filesystem must not be replayed on the new layout; retain all53 historical versions. The operational backup workflow and timer remain available on Hostinger.

The reusable `hostinger-runtime-audit.yml` accepts fonts/canonical/nginx/logging/storage. A future configuration change belongs in a reviewed normal release, not an old one-off script against /root/fumbling-field.

## DNS and remaining application publishers

Remove only ip4:23.105.176.45 from the existing UMSA and Vivero SPF records after cutover, preserving every other authorization. Google MX and Vivero web routing stay unchanged. SITREP, SGI and DGE require their separate reviewed layout-aware Hostinger publishing contracts. No refactor or new application release is selected by these infrastructure changes.

Preserve encrypted backups, independent Git bundles/patches, key recovery files and previous data versions. No server shutdown or data destruction is part of this operation.
