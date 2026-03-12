import { useSearchParams, Link } from "react-router-dom";
import { Gift, Copy, Check, Mail, ShoppingBag } from "lucide-react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/seo/SEOHead";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { useState } from "react";

const GiftCardSuccess = () => {
  const [searchParams] = useSearchParams();
  const { formatPrice } = useCurrency();
  const [copied, setCopied] = useState(false);
  
  const code = searchParams.get("code") || "";
  const amount = parseFloat(searchParams.get("amount") || "0");

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Gift card code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!code || !amount) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <h1 className="text-2xl font-light text-foreground mb-4">
              Gift Card Not Found
            </h1>
            <p className="text-muted-foreground mb-8">
              We couldn't find your gift card. Please try again.
            </p>
            <Link to="/gift-cards">
              <Button>Purchase a Gift Card</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Gift Card Purchased | Healios"
        description="Your Healios gift card has been created successfully."
      />
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-light text-foreground mb-2">
              Gift Card Created!
            </h1>
            <p className="text-muted-foreground">
              Your gift card is ready to use
            </p>
          </div>

          {/* Gift Card Display */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 mb-8">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">Gift Card Value</p>
              <p className="text-4xl font-medium text-foreground mb-6">
                {formatPrice(amount)}
              </p>

              <div className="bg-background rounded-lg p-4 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Your Gift Card Code</p>
                <div className="flex items-center justify-center gap-3">
                  <code className="text-xl font-mono font-medium text-foreground tracking-wider">
                    {code}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCode}
                    className="h-8 w-8 p-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Valid for 12 months from purchase
              </p>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border-0 shadow-sm mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-medium text-foreground mb-4">
                How to Redeem
              </h2>
              
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Shop Products</p>
                    <p className="text-sm text-muted-foreground">
                      Browse our collection and add items to your bag
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Enter Your Code</p>
                    <p className="text-sm text-muted-foreground">
                      At checkout, enter your gift card code in the gift card field
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Enjoy Your Savings</p>
                    <p className="text-sm text-muted-foreground">
                      Your gift card balance will be applied to your order
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/category/shop">
              <Button size="lg" className="w-full sm:w-auto">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Start Shopping
              </Button>
            </Link>
            <Link to="/gift-cards">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Gift className="w-4 h-4 mr-2" />
                Buy Another
              </Button>
            </Link>
          </div>

          {/* Note */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            <Mail className="w-4 h-4 inline mr-1" />
            A confirmation email has been sent with your gift card details
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GiftCardSuccess;
