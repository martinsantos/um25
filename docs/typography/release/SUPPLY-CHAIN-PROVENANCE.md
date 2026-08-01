# Supply chain, SBOM and release provenance

UM Sans 1.2 ships machine-readable evidence for procurement and reproducible
build review. These records document the upstream material, transformation
pipeline and generated font binaries without converting an unsigned local build
into a false organizational attestation.

## Included records

- `Metadata/sbom.spdx.json`: SPDX 2.3 package bill of materials for UM Sans and
  the pinned Inter 4.001 upstream.
- `Metadata/release-provenance.json`: source commit, source SHA-256 values,
  build-script hashes, 58 output subjects and the deterministic ZIP policy.
- `release-manifest.json`: complete archive inventory with file hashes.
- `CHECKSUMS.sha256`: independent checksum list for every packaged artifact.

## Trust boundary

The provenance record is reproducible and inspectable, but it is **not signed**.
A signed release requires an ULTIMA MILLA organizational signing identity, a
protected CI job and an external verification procedure. Until those exist, the
portfolio marks cryptographic attestation as external.

## Verification

1. Compare the source files with `Source/source-manifest.json`.
2. Re-run the build and package scripts in `Source/`.
3. Compare all subjects in `Metadata/release-provenance.json`.
4. Validate `CHECKSUMS.sha256` against the unpacked release.
5. Confirm the SPDX relationship `UM Sans GENERATED_FROM Inter`.

This evidence supports technical acquisition and audit. It does not replace
the SIL Open Font License 1.1 or create independent copyright over upstream
outlines.
