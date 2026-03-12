import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import SEOHead from "../components/seo/SEOHead";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import SectionContainer from "@/components/layout/SectionContainer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Terms of Service | Healios"
        description="Read the Healios terms of service. Understand the terms and conditions for using our website and purchasing our products."
        canonicalUrl="https://www.thehealios.com/terms-of-service"
        noIndex={false}
      />
      
      <Header />
      
      <main>
        <PageContainer maxWidth="content">
          <PageHeader 
            title="Terms of Service"
            subtitle="Last updated: January 15, 2024"
            centered
          />

          <div className="space-y-8">
            <SectionContainer title="Agreement to Terms">
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using The Healios Health Co. website and services, you accept and agree to be bound by the terms and provision of this agreement. These Terms of Service govern your use of our website, products, and services.
              </p>
            </SectionContainer>

            <SectionContainer title="Use License">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Permission is granted to temporarily download one copy of the materials on The Healios Health Co.'s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on the website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </SectionContainer>

            <SectionContainer title="Product Information and Availability">
              <p className="text-muted-foreground leading-relaxed">
                We strive to provide accurate product information, including descriptions, pricing, and availability. However, we do not warrant that product descriptions or other content is accurate, complete, reliable, or error-free. We reserve the right to modify or discontinue products without prior notice.
              </p>
            </SectionContainer>

            <SectionContainer title="Dietary Supplements Disclaimer">
              <p className="text-muted-foreground leading-relaxed mb-4">
                The products sold on this website are dietary supplements. These statements have not been evaluated by the Food and Drug Administration (FDA) or any other regulatory authority. Our products are not intended to diagnose, treat, cure, or prevent any disease.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Please consult with a healthcare professional before starting any supplement regimen, especially if you are pregnant, nursing, taking medications, or have any medical conditions. Individual results may vary.
              </p>
            </SectionContainer>

            <SectionContainer title="Orders and Payment">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-light text-foreground mb-2">Order Acceptance</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including but not limited to product availability, errors in product information, or suspected fraud.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-light text-foreground mb-2">Payment Terms</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Payment is due at the time of purchase. We accept major credit cards and other payment methods as displayed during checkout. All prices are in the currency specified unless otherwise noted.
                  </p>
                </div>
              </div>
            </SectionContainer>

            <SectionContainer title="Shipping and Delivery">
              <p className="text-muted-foreground leading-relaxed mb-4">
                We will make every effort to ship orders within the timeframes specified. However, delivery dates are estimates and we are not responsible for delays caused by shipping carriers or circumstances beyond our control.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Risk of loss and title for products pass to you upon delivery to the carrier. We are not responsible for lost, stolen, or damaged packages once they have been delivered to the address provided.
              </p>
            </SectionContainer>

            <SectionContainer title="Returns and Exchanges">
              <p className="text-muted-foreground leading-relaxed mb-4">
                We want you to be completely satisfied with your purchase. Returns and exchanges are accepted within 30 days of delivery, subject to the following conditions:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Items must be unopened and in original packaging</li>
                <li>Opened supplement bottles cannot be returned for health and safety reasons</li>
                <li>Return shipping costs are the responsibility of the customer unless the item is defective</li>
                <li>Refunds will be processed to the original payment method</li>
              </ul>
            </SectionContainer>

            <SectionContainer title="Product Quality Guarantee">
              <p className="text-muted-foreground leading-relaxed">
                Our supplements are manufactured in GMP-certified facilities and undergo third-party testing. If you receive a product that is damaged, defective, or does not meet quality standards, please contact us immediately and we will arrange a replacement or refund.
              </p>
            </SectionContainer>

            <SectionContainer title="Intellectual Property">
              <p className="text-muted-foreground leading-relaxed">
                All content on this website, including but not limited to text, graphics, logos, images, and software, is the property of The Healios Health Co. and is protected by copyright, trademark, and other intellectual property laws. Unauthorized use is prohibited.
              </p>
            </SectionContainer>

            <SectionContainer title="Limitation of Liability">
              <p className="text-muted-foreground leading-relaxed">
                In no event shall The Healios Health Co. or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website or products, even if we have been notified of the possibility of such damage.
              </p>
            </SectionContainer>

            <SectionContainer title="Privacy Policy">
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of our website and services, to understand our practices regarding your personal information.
              </p>
            </SectionContainer>

            <SectionContainer title="Governing Law">
              <p className="text-muted-foreground leading-relaxed">
                These terms and conditions are governed by and construed in accordance with applicable laws, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </SectionContainer>

            <SectionContainer title="Changes to Terms">
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to revise these Terms of Service at any time without notice. By using this website, you are agreeing to be bound by the current version of these Terms of Service.
              </p>
            </SectionContainer>

            <SectionContainer title="Contact Information">
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 text-muted-foreground">
                <p>Email: support@thehealios.com</p>
                <p>Website: www.thehealios.com</p>
              </div>
            </SectionContainer>
          </div>
        </PageContainer>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfService;