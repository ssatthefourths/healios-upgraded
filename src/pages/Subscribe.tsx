import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, Package, Calendar, Percent, Pause, Gift, RefreshCw } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Subscribe = () => {
  const steps = [
    {
      number: "01",
      title: "Choose Your Products",
      description: "Pick from our range of science-backed gummy supplements designed for your daily wellness routine.",
    },
    {
      number: "02",
      title: "Set Your Frequency",
      description: "Select monthly deliveries that match your 30-day supplement cycle. Adjust anytime.",
    },
    {
      number: "03",
      title: "Enjoy the Benefits",
      description: "Save on every order with subscriber-exclusive pricing and never run out of your essentials.",
    },
  ];

  const benefits = [
    {
      icon: Percent,
      title: "Subscriber Savings",
      description: "Exclusive discounts on every delivery",
    },
    {
      icon: Package,
      title: "Free Shipping",
      description: "On all subscription orders over £25",
    },
    {
      icon: Pause,
      title: "Full Flexibility",
      description: "Skip, pause, or cancel anytime",
    },
    {
      icon: Gift,
      title: "Early Access",
      description: "Be first to try new products",
    },
    {
      icon: RefreshCw,
      title: "Auto-Delivery",
      description: "Perfectly timed 30-day cycles",
    },
    {
      icon: Calendar,
      title: "Easy Management",
      description: "Control everything from your account",
    },
  ];

  const faqs = [
    {
      question: "How does the subscription work?",
      answer: "Choose your products and delivery frequency. We'll automatically send your supplements every 30 days (or your chosen interval) so you never run out. You'll be charged before each delivery.",
    },
    {
      question: "Can I change my subscription?",
      answer: "Absolutely. You can add or remove products, change quantities, adjust delivery frequency, or update your address anytime from your account dashboard.",
    },
    {
      question: "How do I pause or cancel?",
      answer: "You can pause your subscription for up to 3 months or cancel entirely from your account settings. There are no cancellation fees or minimum commitments.",
    },
    {
      question: "When will I be charged?",
      answer: "You'll be charged when you first subscribe, then automatically before each scheduled delivery. We'll always email you a few days before charging so there are no surprises.",
    },
    {
      question: "What if I have too much product?",
      answer: "Simply skip your next delivery from your account. You can skip as many deliveries as you need without affecting your subscriber benefits.",
    },
    {
      question: "Do subscribers get discounts on one-time purchases too?",
      answer: "Yes! Active subscribers receive exclusive discounts on any additional one-time purchases they make.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Subscribe & Save | Healios"
        description="Subscribe to Healios and save on your favourite gummy vitamins. Get free delivery, exclusive discounts, and never run out of your supplements."
        canonicalUrl="https://www.thehealios.com/subscribe"
        keywords={["subscription", "subscribe and save", "vitamin subscription", "monthly vitamins"]}
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="py-16 px-6 bg-secondary/30">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-4 block">
              Subscribe & Save
            </span>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
              Your Daily Wellness, Delivered
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Never run out of your essentials. Subscribe for automatic monthly deliveries 
              and enjoy exclusive savings on every order.
            </p>
            <Button asChild size="lg" className="px-8">
              <Link to="/category/all">Start Your Subscription</Link>
            </Button>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h2 className="text-xl font-light text-foreground mb-2">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              Three simple steps to effortless wellness
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-light text-primary/20 mb-4">
                  {step.number}
                </div>
                <h3 className="text-lg font-light text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-12 px-6 bg-secondary/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-xl font-light text-foreground mb-2">
                Subscriber Benefits
              </h2>
              <p className="text-muted-foreground">
                More than just convenience
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="bg-background p-6 rounded-lg border border-border/50"
                >
                  <benefit.icon className="h-8 w-8 text-primary mb-4" strokeWidth={1.5} />
                  <h3 className="text-lg font-light text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Example */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h2 className="text-xl font-light text-foreground mb-2">
              See Your Savings
            </h2>
            <p className="text-muted-foreground">
              Example: Ashwagandha Gummies
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* One-time */}
            <div className="p-8 rounded-lg border border-border/50 bg-background">
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                One-Time Purchase
              </div>
              <div className="text-3xl font-light mb-4">£12.99</div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Single delivery
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Standard pricing
                </li>
              </ul>
            </div>
            
            {/* Subscription */}
            <div className="p-8 rounded-lg border-2 border-primary bg-background relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                Best Value
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                Monthly Subscription
              </div>
              <div className="text-3xl font-light mb-1">£10.99</div>
              <div className="text-sm text-primary mb-4">Save 15%</div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Auto-delivery every 30 days
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Free shipping over £25
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Cancel anytime
                </li>
              </ul>
            </div>
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-8">
            *Subscription savings vary by product. Actual prices shown at checkout.
          </p>
        </section>

        {/* FAQ Section */}
        <section className="py-12 px-6 bg-secondary/30">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-xl font-light text-foreground mb-2">
                Common Questions
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-background border border-border/50 rounded-lg px-6"
                >
                  <AccordionTrigger className="text-left font-light hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-light text-foreground mb-4">
              Ready to Start?
            </h2>
            <p className="text-muted-foreground mb-8">
              Browse our collection and add products to your subscription. 
              Your wellness routine, simplified.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="px-8">
                <Link to="/category/all">Shop All Products</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8">
                <Link to="/about/product-guide">View Product Guide</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Subscribe;