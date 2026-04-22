const displayToSlug: Record<string, string> = {
  'Vitamins & Minerals': 'vitamins-minerals',
  'Adaptogens': 'adaptogens',
  'Digestive Health': 'digestive-health',
  'Sleep & Relaxation': 'sleep-relaxation',
  'Beauty': 'beauty',
  "Women's Health": 'womens-health',
  'Bundles': 'bundles',
};

export const categoryDisplayToSlug = (display: string | null | undefined): string => {
  if (!display) return 'all';
  return displayToSlug[display] ?? 'all';
};
