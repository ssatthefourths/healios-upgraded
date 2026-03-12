import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import SEOHead from "@/components/seo/SEOHead";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import SectionContainer from "@/components/layout/SectionContainer";
import { Truck, RotateCcw, Clock, Package, HelpCircle } from "lucide-react";

const ShippingReturns = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Shipping & Returns | Healios"
        description="Free UK delivery on orders over £30. Learn about our shipping options, delivery times, and hassle-free returns policy."
        canonicalUrl="https://www.thehealios.com/shipping-returns"
        keywords={["shipping", "delivery", "returns policy", "UK delivery"]}
      />
      
      <Header />
      
      <main>
        <PageContainer maxWidth="content">
          <PageHeader 
            title="Shipping & Returns"
            subtitle="Everything you need to know about delivery and our returns policy."
          />

          {/* Delivery Information */}
          <SectionContainer>
            <div className="flex items-center gap-3 mb-6">
              <Truck className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-light text-foreground">Delivery Information</h2>
            </div>
            
            <div className="space-y-6">
              <div className="bg-muted/20 p-6 rounded-lg">
                <h3 className="font-light text-foreground mb-4">UK Delivery Options</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-start border-b border-border pb-4">
                    <div>
                      <p className="font-light text-foreground">Standard Delivery</p>
                      <p className="text-sm text-muted-foreground">3-5 working days</p>
                    </div>
                    <p className="font-light text-foreground">FREE</p>
                  </div>
                  <div className="flex justify-between items-start border-b border-border pb-4">
                    <div>
                      <p className="font-light text-foreground">Express Delivery</p>
                      <p className="text-sm text-muted-foreground">1-2 working days</p>
                    </div>
                    <p className="font-light text-foreground">£5.99</p>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-light text-foreground">Next Day Delivery</p>
                      <p className="text-sm text-muted-foreground">Order before 2pm for next working day</p>
                    </div>
                    <p className="font-light text-foreground">£9.99</p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p>• All orders are processed within 1 working day (Monday to Friday, excluding bank holidays).</p>
                <p>• You will receive a confirmation email with tracking information once your order has been dispatched.</p>
                <p>• Delivery times are estimates and may vary during peak periods.</p>
                <p>• We currently deliver to UK mainland addresses only.</p>
              </div>
            </div>
          </SectionContainer>

          {/* Returns Policy */}
          <SectionContainer>
            <div className="flex items-center gap-3 mb-6">
              <RotateCcw className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-light text-foreground">Returns Policy</h2>
            </div>
            
            <div className="space-y-6">
              <p className="text-muted-foreground">
                We want you to be completely satisfied with your purchase. If you're not happy with your order, 
                you can return it within 30 days of receipt for a full refund.
              </p>

              <div className="bg-muted/20 p-6 rounded-lg">
                <h3 className="font-light text-foreground mb-4">Return Conditions</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Products must be unopened and in their original, sealed packaging.</li>
                  <li>• Items must be returned within 30 days of the delivery date.</li>
                  <li>• Proof of purchase (order confirmation email or receipt) is required.</li>
                  <li>• Opened or used products cannot be returned for hygiene and safety reasons.</li>
                  <li>• Sale items and promotional bundles are eligible for returns under the same conditions.</li>
                </ul>
              </div>

              <div className="bg-muted/20 p-6 rounded-lg">
                <h3 className="font-light text-foreground mb-4">How to Return</h3>
                <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Contact our customer care team at support@thehealios.com with your order number and reason for return.</li>
                  <li>We'll provide you with a returns authorisation and instructions.</li>
                  <li>Pack items securely in appropriate packaging.</li>
                  <li>Send the package to the address provided (return shipping costs are the customer's responsibility unless the item is faulty or incorrect).</li>
                  <li>Once received and inspected, refunds will be processed within 5-7 working days to your original payment method.</li>
                </ol>
              </div>
            </div>
          </SectionContainer>

          {/* Damaged or Faulty Items */}
          <SectionContainer>
            <div className="flex items-center gap-3 mb-6">
              <Package className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-light text-foreground">Damaged or Faulty Items</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you receive a damaged or faulty product, please contact us within 48 hours of delivery. 
                We'll arrange a free replacement or full refund.
              </p>
              <p>
                Please include photos of the damaged item and packaging when contacting us to help us 
                process your claim quickly.
              </p>
            </div>
          </SectionContainer>

          {/* Cancellations */}
          <SectionContainer>
            <div className="flex items-center gap-3 mb-6">
              <Clock className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-light text-foreground">Order Cancellations</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                You can cancel your order free of charge before it has been dispatched. Once your order 
                has been dispatched, you'll need to follow our standard returns process.
              </p>
              <p>
                To cancel an order, contact us at support@thehealios.com with your order number as soon as possible.
              </p>
            </div>
          </SectionContainer>

          {/* Contact */}
          <SectionContainer>
            <div className="bg-muted/20 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-light text-foreground">Need Help?</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Our customer care team is here to help with any questions about shipping or returns.
              </p>
              <div className="space-y-1 text-sm">
                <p><span className="text-foreground font-light">Email:</span> <span className="text-muted-foreground">support@thehealios.com</span></p>
                <p><span className="text-foreground font-light">Response time:</span> <span className="text-muted-foreground">Within 24 hours (Monday to Friday)</span></p>
              </div>
            </div>
          </SectionContainer>

          {/* Legal Notice */}
          <p className="text-xs text-muted-foreground mt-8">
            This policy does not affect your statutory rights under the Consumer Rights Act 2015. 
            For more information about your consumer rights, visit the Citizens Advice website.
          </p>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default ShippingReturns;