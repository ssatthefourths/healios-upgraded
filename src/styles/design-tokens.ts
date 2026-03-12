// Design tokens for consistent styling across the platform
// Based on the Account page design - minimalist, clean, light typography

export const layout = {
  // Page container widths
  maxWidth: {
    content: 'max-w-4xl', // For text-heavy pages (legal, blog post)
    standard: 'max-w-6xl', // For standard pages (account, checkout)
    wide: 'max-w-7xl', // For product grids
  },
  
  // Page padding
  pagePadding: 'px-6',
  pageVerticalPadding: 'py-12',
  
  // Section spacing
  sectionSpacing: 'mb-12',
  contentGap: 'gap-8',
  layoutGap: 'gap-12',
} as const;

export const typography = {
  // Page titles
  pageTitle: 'text-3xl font-light text-foreground',
  
  // Section headers
  sectionTitle: 'text-xl font-light text-foreground',
  
  // Subsection headers
  subsectionTitle: 'text-lg font-light text-foreground',
  
  // Body text
  body: 'text-muted-foreground leading-relaxed',
  bodySmall: 'text-sm text-muted-foreground',
  
  // Labels
  label: 'text-sm font-light',
  labelSmall: 'text-xs text-muted-foreground',
  
  // Tracking/uppercase labels
  overline: 'text-xs tracking-[0.2em] uppercase text-muted-foreground',
} as const;

export const spacing = {
  // Vertical spacing between elements
  titleToContent: 'mb-8',
  sectionTitleToContent: 'mb-6',
  formFields: 'space-y-6',
  listItems: 'space-y-4',
  
  // Grid gaps
  gridGap: 'gap-8',
  cardGap: 'gap-6',
} as const;
