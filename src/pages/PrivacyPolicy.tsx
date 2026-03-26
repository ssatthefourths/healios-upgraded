import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import SEOHead from "../components/seo/SEOHead";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import SectionContainer from "@/components/layout/SectionContainer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Privacy Policy | Healios"
        description="Read the Healios privacy policy. Learn how we collect, use, and protect your personal data."
        canonicalUrl="https://www.thehealios.com/privacy-policy"
        noIndex={false}
      />
      
      <Header />
      
      <main>
        <PageContainer maxWidth="content">
          <PageHeader 
            title="Privacy Policy"
            subtitle="Last updated: March 26, 2026"
            centered
          />

          <div className="space-y-8">
            <SectionContainer title="Introduction">
              <p className="text-muted-foreground leading-relaxed">
                At The Healios Health Co. ("we," "our," or "us"), we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, make a purchase, or interact with our services.
              </p>
            </SectionContainer>

            <SectionContainer title="Information We Collect">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-light text-foreground mb-2">Personal Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We may collect personal information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                    <li>Name, email address, and contact information</li>
                    <li>Billing and shipping addresses</li>
                    <li>Payment information (processed securely through third-party providers)</li>
                    <li>Account preferences and communication settings</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-light text-foreground mb-2">Usage Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We automatically collect certain information about your device and usage patterns, including IP address, browser type, pages visited, and interaction data to improve our services and user experience.
                  </p>
                </div>
              </div>
            </SectionContainer>

            <SectionContainer title="How We Use Your Information">
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect for various purposes, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Processing and fulfilling your orders</li>
                <li>Providing customer support and responding to inquiries</li>
                <li>Sending promotional communications (with your consent)</li>
                <li>Improving our website functionality and user experience</li>
                <li>Preventing fraud and ensuring security</li>
                <li>Complying with legal obligations</li>
              </ul>
            </SectionContainer>

            <SectionContainer title="Information Sharing and Disclosure">
              <p className="text-muted-foreground leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>With service providers who assist us in operating our business</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transaction (merger, acquisition, etc.)</li>
                <li>With your explicit consent</li>
              </ul>
            </SectionContainer>

            <SectionContainer title="Data Security">
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
              </p>
            </SectionContainer>

            <SectionContainer title="Your Rights and Choices">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Access to your personal information</li>
                <li>Correction of inaccurate or incomplete information</li>
                <li>Deletion of your personal information</li>
                <li>Objection to or restriction of processing</li>
                <li>Data portability</li>
                <li>Withdrawal of consent (where applicable)</li>
              </ul>
            </SectionContainer>

            <SectionContainer title="Cookies and Tracking">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  We use cookies and similar tracking technologies to enhance your browsing experience, analyse website traffic, and support personalised marketing. The table below lists every cookie set by this site, who sets it, its purpose, and how long it is retained.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 pr-4 text-left font-medium text-foreground">Cookie</th>
                        <th className="py-2 pr-4 text-left font-medium text-foreground">Category</th>
                        <th className="py-2 pr-4 text-left font-medium text-foreground">Set by</th>
                        <th className="py-2 pr-4 text-left font-medium text-foreground">Purpose</th>
                        <th className="py-2 text-left font-medium text-foreground">Retention</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border">
                        <td className="py-2 pr-4 font-mono text-xs">healios-consent</td>
                        <td className="py-2 pr-4">Essential</td>
                        <td className="py-2 pr-4">First-party</td>
                        <td className="py-2 pr-4">Stores your cookie preferences</td>
                        <td className="py-2">365 days</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 pr-4 font-mono text-xs">_ga</td>
                        <td className="py-2 pr-4">Analytics</td>
                        <td className="py-2 pr-4">Google Analytics</td>
                        <td className="py-2 pr-4">Distinguishes unique users</td>
                        <td className="py-2">2 years</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 pr-4 font-mono text-xs">_gid</td>
                        <td className="py-2 pr-4">Analytics</td>
                        <td className="py-2 pr-4">Google Analytics</td>
                        <td className="py-2 pr-4">Identifies a session</td>
                        <td className="py-2">24 hours</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 pr-4 font-mono text-xs">_ga_[ID]</td>
                        <td className="py-2 pr-4">Analytics</td>
                        <td className="py-2 pr-4">Google Analytics</td>
                        <td className="py-2 pr-4">Maintains session state for a GA4 property</td>
                        <td className="py-2">2 years</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 pr-4 font-mono text-xs">_clck</td>
                        <td className="py-2 pr-4">Analytics</td>
                        <td className="py-2 pr-4">Microsoft Clarity</td>
                        <td className="py-2 pr-4">Persists a unique user ID</td>
                        <td className="py-2">1 year</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 pr-4 font-mono text-xs">_clsk</td>
                        <td className="py-2 pr-4">Analytics</td>
                        <td className="py-2 pr-4">Microsoft Clarity</td>
                        <td className="py-2 pr-4">Connects multiple page views within one session</td>
                        <td className="py-2">1 day</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 pr-4 font-mono text-xs">_fbp</td>
                        <td className="py-2 pr-4">Marketing</td>
                        <td className="py-2 pr-4">Meta Pixel</td>
                        <td className="py-2 pr-4">Identifies browsers for Meta ad delivery and measurement</td>
                        <td className="py-2">3 months</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">_fbc</td>
                        <td className="py-2 pr-4">Marketing</td>
                        <td className="py-2 pr-4">Meta Pixel</td>
                        <td className="py-2 pr-4">Stores the click identifier from a Meta ad</td>
                        <td className="py-2">Session</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2 text-muted-foreground leading-relaxed">
                  <p>
                    <span className="text-foreground font-light">Essential cookies</span> are strictly necessary for the site to function and cannot be refused.
                  </p>
                  <p>
                    <span className="text-foreground font-light">Analytics and Marketing cookies</span> are only placed after you have given consent via our cookie banner. You may withdraw or adjust your consent at any time.
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-preferences'))}
                    className="text-sm underline text-foreground hover:text-muted-foreground transition-colors"
                  >
                    Cookie Settings
                  </button>
                </div>
              </div>
            </SectionContainer>

            <SectionContainer title="Changes to This Policy">
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on our website and updating the "Last updated" date above.
              </p>
            </SectionContainer>

            <SectionContainer title="Contact Us">
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
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

export default PrivacyPolicy;