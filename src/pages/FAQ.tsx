import { useState, useMemo, useRef, useEffect } from "react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import { Input } from "../components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Search, X } from "lucide-react";
import { FAQ_CATEGORIES } from "../data/references/product-knowledge-base";
import FAQSidebar from "../components/faq/FAQSidebar";
import FAQActionButtons from "../components/faq/FAQActionButtons";
import FAQSchema from "../components/seo/FAQSchema";
import SEOHead from "../components/seo/SEOHead";

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const filteredData = useMemo(() => {
    if (!searchQuery && !selectedCategory) return FAQ_CATEGORIES;

    return FAQ_CATEGORIES
      .filter(category => !selectedCategory || category.name === selectedCategory)
      .map(category => ({
        ...category,
        items: category.items.filter(faq =>
          !searchQuery ||
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }))
      .filter(category => category.items.length > 0);
  }, [searchQuery, selectedCategory]);

  // Scroll spy effect
  useEffect(() => {
    const handleScroll = () => {
      const sections = Object.entries(sectionRefs.current);
      const scrollPosition = window.scrollY + 150;

      for (const [name, element] of sections) {
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(name);
            return;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filteredData]);

  const totalResults = filteredData.reduce((acc, cat) => acc + cat.items.length, 0);

  const categoryResultCounts = useMemo(() => {
    return FAQ_CATEGORIES.reduce((acc, cat) => {
      const filtered = cat.items.filter(faq =>
        !searchQuery ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
      acc[cat.name] = filtered.length;
      return acc;
    }, {} as Record<string, number>);
  }, [searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
  };

  const scrollToCategory = (category: string) => {
    setSelectedCategory(null);
    const element = sectionRefs.current[category];
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: "smooth" });
    }
  };

  // Flatten all FAQs for schema
  const allFaqs = useMemo(() => {
    return FAQ_CATEGORIES.flatMap(category => category.items);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Head */}
      <SEOHead
        title="FAQ | Healios"
        description="Find answers to frequently asked questions about Healios gummy vitamins, shipping, subscriptions, ingredients, and more."
        canonicalUrl="https://www.thehealios.com/faq"
        keywords={["FAQ", "gummy vitamins questions", "supplement FAQ", "healios help"]}
      />
      
      {/* FAQ Schema for rich results */}
      <FAQSchema faqs={allFaqs} />
      
      <Header />
      
      <main className="max-w-6xl mx-auto px-md py-lg">
        <div className="flex flex-col md:flex-row gap-lg md:gap-xl">
          <FAQSidebar
            categories={FAQ_CATEGORIES.map(c => c.name)}
            activeCategory={activeSection}
            onCategoryClick={scrollToCategory}
            resultCounts={categoryResultCounts}
          />
          
          <div className="flex-1 max-w-3xl">
            {/* Header */}
            <div className="mb-lg">
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-sm">
                Support
              </p>
              <h1 className="cinematic-title mb-xs">
                Frequently Asked Questions
              </h1>
              <p className="text-muted-foreground font-light">
                Everything you need to know about our supplements and services
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-lg">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-md py-lg text-base bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-foreground transition-all duration-300 placeholder:text-muted-foreground/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-10">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 text-xs tracking-wide uppercase transition-colors border ${
                  !selectedCategory
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              {FAQ_CATEGORIES.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-4 py-2 text-xs tracking-wide uppercase transition-colors border ${
                    selectedCategory === category.name
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Results Count */}
            {(searchQuery || selectedCategory) && (
              <div className="flex items-center justify-between mb-8">
                <p className="text-sm text-muted-foreground">
                  {totalResults} result{totalResults !== 1 ? "s" : ""}
                  {searchQuery && <span className="italic"> for "{searchQuery}"</span>}
                </p>
                <button
                  onClick={clearFilters}
                  className="text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* FAQ Content */}
            {filteredData.length > 0 ? (
              <div className="space-y-12">
                {filteredData.map((category) => (
                  <section 
                    key={category.name}
                    ref={(el) => { sectionRefs.current[category.name] = el; }}
                  >
                    <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6 pb-2 border-b border-border">
                      {category.name}
                    </h2>
                    <Accordion type="single" collapsible className="space-y-0">
                      {category.items.map((faq, index) => (
                        <AccordionItem
                          key={index}
                          value={`${category.name}-${index}`}
                          className="border-0 border-b border-border py-0"
                        >
                          <AccordionTrigger className="text-left text-sm md:text-base font-normal py-5 hover:no-underline hover:text-muted-foreground transition-colors [&[data-state=open]]:text-foreground">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground pb-6 leading-relaxed">
                            {faq.answer}
                            <FAQActionButtons question={faq.question} />
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </section>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  No results found for your search.
                </p>
                <button
                  onClick={clearFilters}
                  className="text-xs uppercase tracking-wide text-foreground underline underline-offset-4 hover:no-underline transition-all"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Contact CTA */}
            <div className="mt-12 pt-12 border-t border-border">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h3 className="text-lg font-light text-foreground mb-1">
                    Still have questions?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Our team is here to help with any enquiries
                  </p>
                </div>
                <a
                  href="/about/customer-care"
                  className="inline-block px-8 py-3 text-xs uppercase tracking-[0.15em] bg-foreground text-background hover:bg-foreground/90 transition-colors text-center"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;