# Class 3 review artwork

All artwork is local SVG in `ReviewArtwork.tsx`, with no raster download or new
dependency. The mathematical and special cubes are six-face CSS solids; the SVG
clock/check artwork is projected onto their faces.

- Cannon artboard: 100 × 110. The barrel pivots at (50, 70); the muzzle opening is
  centered at (50, 19). Base stays stationary. Recoil translates the barrel along
  its own axis before rotation. Purple housing and pale-blue barrel match the
  platform palette.
- Corridor artboard: normalized 100 × 100, stretching with the scene. Entrance
  spans x=5–95 at y=9; destination x=34–66 near y=87. CSS provides a soft entrance
  glow in the session color. Frosted appearance uses transparent shapes, not blur.
- Hearts have three irregular, independently filled SVG shards and an empty
  silhouette. Red shades and a light highlight give a playful rounded appearance.
- Clock and check use a 100 × 100 artboard and white stroked paths. Their cubes
  are smooth blue and green, distinctly different from mathematical grids.
- Dust has four pale puffs and two shading patches. Its short expansion/fade is
  driven by the scene clock; no ongoing particles.
- Crosshair uses a red ring/marks with a white edge. Aim assistance may enlarge it;
  it never indicates whether the mathematical choice is correct.
- Projectile is a CSS pale-blue energy pellet with a short trail. Muzzle flash,
  cannon recoil, and cube feedback share the foreground scene clock.

Assets appear in both the intro preview and live scene. No asset has an independent
timer, persistent external reference, or baked-in round/ammunition value.

`ReviewAssetSheet.tsx` is a static component fixture for inspecting the independent
artwork and full/partial/empty hearts. It is intentionally not a public route and
does not start gameplay or analytics. Browser display follows AGENTS.md's visual
verification permission rule.
