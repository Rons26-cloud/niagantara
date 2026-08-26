# NIAGANTARA Brand Assets

The official logo is the only brand mark allowed in NIAGANTARA products.
No component may draw or approximate the logo.

## Canonical files

The editable source files live in `assets/brand/`:

- `niagantara-logo.png` — official full logo lockup.
- `niagantara-mark.png` — compact transparent mark used by the apps.
- `niagantara-mark-square.png` — square source artwork retained for regenerating icons.

## Public app assets

| File                                      | Purpose                                       | Location (create if missing)                                                            |
| ----------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| `logo.svg`                                | Preferred: header logo, SVG favicon, PWA icon | `apps/web/public/`, `apps/dashboard/public/`, `apps/master/public/`, `apps/pos/public/` |
| `apple-touch-icon.png`                    | 180x180 iOS home-screen icon                  | same `public/` folders                                                                  |
| `favicon-16x16.png` / `favicon-32x32.png` | PNG favicon fallbacks                         | same `public/` folders                                                                  |
| `favicon.ico`                             | Legacy fallback                               | same `public/` folders                                                                  |
| `icon-192.png` / `icon-512.png`           | Android / PWA maskable icons                  | same `public/` folders                                                                  |
| `og-image.png`                            | 1200x630 social share card (web only)         | `apps/web/public/`                                                                      |

## How it works

- `<BrandLogo />` (`packages/ui`) renders the official `/logo.png` asset.
- `<BrandMark />` renders `/brand-mark.png` for compact navigation surfaces.
- All four apps already declare the icon links and `site.webmanifest`; they
  activate as soon as the files are present in each app's `public/`.
- Do not modify Supabase/Railway configuration while adding assets.
