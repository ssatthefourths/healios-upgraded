import { NavLink } from 'react-router-dom';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import SEOHead from '@/components/seo/SEOHead';

const aboutPages = [
  { name: 'Our Story',          path: '/about/our-story' },
  { name: 'Quality & Sourcing', path: '/about/quality-sourcing' },
  { name: 'Product Guide',      path: '/about/product-guide' },
  { name: 'Customer Care',      path: '/about/customer-care' },
  { name: 'Wholesale Partners', path: '/about/wholesale' },
];

interface AboutLayoutProps {
  title: string;
  subtitle?: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  keywords?: string[];
  children: React.ReactNode;
}

const AboutLayout = ({
  title,
  subtitle,
  seoTitle,
  seoDescription,
  canonicalUrl,
  keywords,
  children,
}: AboutLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={canonicalUrl}
        keywords={keywords}
      />

      <Header />

      {/* Full-width page identity strip */}
      <div className="border-b border-border bg-background px-page py-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground mb-3">
          About Healios
        </p>
        <h1
          className="font-serif font-light text-foreground leading-tight"
          style={{ fontSize: 'var(--fs-xxl)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-muted-foreground mt-3 font-light max-w-xl"
            style={{ fontSize: 'var(--fs-base)' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Mobile: sticky horizontal tab nav (hidden on lg+) */}
      <div className="lg:hidden sticky top-16 z-10 bg-background/95 backdrop-blur-sm border-b border-border overflow-x-auto">
        <nav className="flex min-w-max px-page">
          {aboutPages.map((page) => (
            <NavLink
              key={page.path}
              to={page.path}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-light shrink-0 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {page.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Two-column layout */}
      <div className="flex min-h-[70vh]">
        {/* Sidebar column — full-height strip, sticky nav inside */}
        <div className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-border bg-muted/20">
          <nav className="sticky top-20 px-5 py-10 space-y-0.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground/60 mb-5 px-3">
              Navigate
            </p>
            {aboutPages.map((page) => (
              <NavLink
                key={page.path}
                to={page.path}
                className={({ isActive }) =>
                  `block px-3 py-2.5 text-sm font-light rounded-md transition-all ${
                    isActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                  }`
                }
              >
                {page.name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-page py-[var(--space-lg)]">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AboutLayout;
