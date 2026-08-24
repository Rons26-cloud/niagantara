# NIAGANTARA Brand Assets

The official logo is the only brand mark allowed in NIAGANTARA products.
No component may draw or approximate the logo.

## Where to drop the official files

| File | Purpose | Location (create if missing) |
|------|---------|------------------------------|
| `logo.svg` | Preferred: header logo, SVG favicon, PWA icon | `apps/web/public/`, `apps/dashboard/public/`, `apps/master/public/`, `apps/pos/public/` |
| `apple-touch-icon.png` | 180x180 iOS home-screen icon | same `public/` folders |
| `favicon-16x16.png` / `favicon-32x32.png` | PNG favicon fallbacks | same `public/` folders |
| `favicon.ico` | Legacy fallback | same `public/` folders |
| `icon-192.png` / `icon-512.png` | Android / PWA maskable icons | same `public/` folders |
| `og-image.png` | 1200x630 social share card (web only) | `apps/web/public/` |

## How it works

- `<BrandLogo />` (`packages/ui`) renders `/logo.svg` automatically. Until the
  file exists, it falls back to the interim mark — no broken image is shown.
  Pass a custom `src` prop to point elsewhere.
- All four apps already declare the icon links and `site.webmanifest`; they
  activate as soon as the files are present in each app's `public/`.
- Do not modify Supabase/Railway configuration while adding assets.
