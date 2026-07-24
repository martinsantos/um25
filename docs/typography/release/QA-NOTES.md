# QA notes

UM Sans 1.2 passes the custom release gate and FontBakery with zero `ERROR`,
zero `FATAL` and zero `FAIL` results. FontBakery records 58 warnings so that
the release remains auditable rather than hiding inherited conditions.

| Warning | Count | Assessment |
|---|---:|---|
| `overlapping_path_segments` | 20 | Repeated coordinates in extended IPA/technical glyphs inherited from Inter; no mapped Spanish or UMSA interface glyph fails raster or shaping tests. |
| `contour_count` | 18 | Heuristic divergence reported once per static style; visual/raster checks confirm intentional outlines rather than wrong Unicode mappings. |
| `unreachable_glyphs` | 18 | `.ttfautohint` metadata glyph inserted by the hinting tool; expected and not user-facing. |
| `interpolation_issues` | 2 | Kinks in uncommon extended/alternate glyphs inherited from upstream variable masters; tested axis corners compile and render without fatal interpolation. |

These warnings are accepted for the 1.2 OFL derivative. They must not be
globally ignored in future releases: changed counts or new warning classes
require review. A fully redrawn 2.0 should resolve the relevant contours in its
own masters instead of patching upstream outlines automatically.
