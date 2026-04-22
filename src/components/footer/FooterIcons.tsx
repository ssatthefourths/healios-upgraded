/**
 * Monochrome inline SVG marks for the footer social + trust bundles.
 * All use `currentColor` so they inherit from their parent's text color —
 * matching hover transitions applied by <IconBundle>.
 */
interface IconProps {
  className?: string;
}

export const FacebookIcon = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

export const InstagramIcon = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const TikTokIcon = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.82 20.1a6.34 6.34 0 0010.86-4.43V8.67a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.86-.1z" />
  </svg>
);

// Simplified mono G for Google Business — avoids their multicolour mark
// which needs special licensing for brand compliance.
export const GoogleIcon = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
  </svg>
);

export const TrustpilotIcon = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2l2.472 6.958L22 9.93l-5.714 4.62L18.472 22 12 17.958 5.528 22l2.186-7.45L2 9.93l7.528-.972L12 2z" />
  </svg>
);
