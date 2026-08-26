# NIAGANTARA Brand Assets

Canonical source of truth:

- `niagantara-logo.png` — official full logo lockup. Never redraw, recolor,
  stretch, or recreate it. Shipped per app as `/logo.png` (faithful downscale).
- `niagantara-mark.png` — compact symbol derivative, cropped directly from
  `niagantara-logo.png`. Shipped per app as `/brand-mark.png`; used for the
  favicon/app icons and for `BrandMark` in `@niagantara/ui`.
- `niagantara-mark-square.png` — square source artwork retained for future icon
  regeneration. It is not loaded directly by an application.

Shared components live in `packages/ui/src/components/BrandLogo.tsx`
(`BrandLogo`, `BrandMark`). All favicons, PWA icons, and the web OG image are
derived from these two files only.
