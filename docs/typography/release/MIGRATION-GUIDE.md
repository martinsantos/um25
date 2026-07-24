# Migration guide

## From the previous UMSA stack

1. Keep Futura PT only for the corporate wordmark.
2. Replace Poppins/Open Sans editorial declarations with `UM Sans`.
3. Load `um-sans-variable.css` and keep `UM Sans Fallback` second in the stack.
4. Map body to 400, interface to 500, editorial titles to 600 and hero/action
   emphasis to 700.
5. Remove synthetic italic/bold and old negative tracking overrides.
6. Recheck wrapping at 360, 390, 834, 1280 and 1440 px.
7. Purge old font cache URLs only after the new WOFF2 files are deployed.

## Version coexistence

Do not install release candidates and 1.2 Production simultaneously. Desktop
applications can cache PostScript identities after files are removed; close the
application, remove the older family, clear its font cache and install one build.

UM Sans 2.0 Original must ship with explicit migration notes if its metrics or
PostScript names change. It must not silently replace 1.x in archived documents.
