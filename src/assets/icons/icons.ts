import { FLAG_ICONS } from './flags/flags.icons';

const UI_ICONS: Record<string, string> = {
  'alert-triangle': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
  <line x1="12" y1="9" x2="12" y2="13"/>
  <line x1="12" y1="17" x2="12.01" y2="17"/>
</svg>`,
  'check': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"/>
</svg>`,
  'chevron-down': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="6 9 12 15 18 9"/>
</svg>`,
  'edit': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
</svg>`,
  'trash': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  <line x1="10" y1="11" x2="10" y2="17"/>
  <line x1="14" y1="11" x2="14" y2="17"/>
</svg>`,
  'pencil': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
  <path d="M14.166 2.5c.442 0 .866.176 1.179.488l1.667 1.667a1.667 1.667 0 0 1 0 2.357l-9.167 9.167a1.667 1.667 0 0 1-1.178.488H5a.833.833 0 0 1-.833-.834v-1.666c0-.442.175-.866.488-1.179l9.166-9.166A1.667 1.667 0 0 1 14.166 2.5ZM13.333 6.012l-7.5 7.5v1.155h1.155l7.5-7.5-1.155-1.155Z" fill="currentColor"/>
</svg>`,
  'no-entrance': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="11" fill="currentColor"/>
  <rect x="6" y="10.25" width="12" height="3.5" rx="1.75" fill="white"/>
</svg>`
};

/** All available inline SVG icons, keyed by name. Flags are prefixed with `flags/`. */
export const ICONS: Record<string, string> = {
  ...UI_ICONS,
  ...Object.fromEntries(Object.entries(FLAG_ICONS).map(([k, v]) => [`flags/${k}`, v])),
};
