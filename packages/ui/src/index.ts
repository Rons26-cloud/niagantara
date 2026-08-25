export const NIAGANTARA_WORDMARK = 'NIAGANTARA';

// Design System
export * from './i18n';
export * from './theme';

// Components
export * from './components/BrandLogo';
export * from './components/LoginBrand';
export * from './components/ThemeSwitcher';
export * from './components/LanguageSwitcher';
export * from './components/primitives';

// Feature icons (lightweight — only website feature icons)
export { FEATURE_ICONS, SidebarIcon } from './feature-icons';
export type { NavIcon } from './feature-icons';

// Navigation icons (heavy — only needed by dashboard apps, not the website)
export {
  USER_NAV_ICONS,
  MASTER_NAV_ICONS,
  MOBILE_BOTTOM_NAV,
  POS_NAV_ICONS,
} from './navigation-icons';
