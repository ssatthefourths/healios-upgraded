import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import AboutSidebar from "../../components/about/AboutSidebar";
import SEOHead from "../../components/seo/SEOHead";

const CustomerCare = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Customer Care | Healios"
        description="Contact Healios customer support. We're here to help with orders, products, subscriptions and any questions about your wellness journey."
        canonicalUrl="https://www.thehealios.com/about/customer-care"
        keywords={["customer support", "contact healios", "help", "customer service"]}
      />
      
      <Header />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
        <PageHeader 
          title="Customer Care" 
          subtitle="We're here to support your wellness journey"
        />
        
        <ContentSection title="Contact Information">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-light text-foreground">Email</h3>
              <p className="text-muted-foreground">support@thehealios.com</p>
              <p className="text-sm text-muted-foreground">Response within 24 hours</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-light text-foreground">General Enquiries</h3>
              <p className="text-muted-foreground">hello@thehealios.com</p>
              <p className="text-sm text-muted-foreground">For partnerships and press</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-light text-foreground">Website</h3>
              <a href="https://www.thehealios.com" className="text-muted-foreground hover:text-foreground transition-colors">
                www.thehealios.com
              </a>
              <p className="text-sm text-muted-foreground">Mon-Fri: 9AM-5PM GMT</p>
            </div>
          </div>
        </ContentSection>

        <ContentSection title="Frequently Asked Questions">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="shipping" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                What are your shipping options and delivery times?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We offer free standard UK delivery on all orders over £30, typically arriving within 3-5 business days. Express delivery (1-2 business days) is available for £4.95. All orders are dispatched within 24 hours on business days and include full tracking.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="returns" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                What is your returns and refund policy?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We offer a 30-day satisfaction guarantee on all unopened products in their original packaging. If you're not completely happy with your purchase, contact us for a full refund or exchange. Opened products cannot be returned for hygiene and safety reasons.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="quality" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                How do you ensure product quality and safety?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                All Healios products are manufactured in the UK to the highest quality and food safety standards. We use only premium, research-backed ingredients with full transparency on our labels. Every batch is tested for purity and potency before release.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="dosage" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                How should I take my supplements?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Each product has specific dosage instructions on the label. Generally, our gummy supplements are taken once or twice daily with or without food. For best results, take your supplements at the same time each day to build a consistent routine. Check individual product pages for detailed guidance.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="storage" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                How should I store my supplements?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Store your Healios supplements in a cool, dry place away from direct sunlight. Keep the lid tightly closed after each use. Our gummy supplements have a shelf life of 24 months from manufacture. The best before date is printed on each bottle.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="subscription" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                How do I manage my subscription?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can manage your subscription from your Account page. There you can pause, skip, or cancel your subscription at any time with no penalties. Subscriptions automatically renew every 30 days, and you'll receive an email reminder before each renewal.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="wholesale" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                Do you offer wholesale or trade pricing?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, we offer a wholesale programme for gyms, retailers, health practitioners, and wellness professionals. Visit our Wholesale Partners page or contact us at hello@thehealios.com for more information on becoming a stockist.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="safety" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                Are your supplements safe to take with medications?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                While our supplements contain natural, high-quality ingredients, we always recommend consulting with your healthcare professional before starting any new supplement, especially if you're pregnant, breastfeeding, taking medication, or have a medical condition.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ContentSection>

        <ContentSection title="Contact Form">
          <div>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-light text-foreground">First Name</label>
                  <Input className="rounded-none" placeholder="Enter your first name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-light text-foreground">Last Name</label>
                  <Input className="rounded-none" placeholder="Enter your last name" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-light text-foreground">Email</label>
                <Input type="email" className="rounded-none" placeholder="Enter your email" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-light text-foreground">Order Number (Optional)</label>
                <Input className="rounded-none" placeholder="Enter your order number if applicable" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-light text-foreground">How can we help you?</label>
                <Textarea 
                  className="rounded-none min-h-[120px]" 
                  placeholder="Tell us about your question or concern"
                />
              </div>
              
              <Button type="submit" className="w-full rounded-none">
                Send Message
              </Button>
            </form>
          </div>
        </ContentSection>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default CustomerCare;
