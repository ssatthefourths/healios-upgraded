import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Send, CreditCard, Check, Loader2 } from "lucide-react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { isValidEmail, sanitizeInput } from "@/lib/validation";

// Per-currency gift card display amounts (rounded to clean numbers)
// GBP is the base currency; other currencies have manually curated amounts
const GIFT_CARD_AMOUNTS_BY_CURRENCY: Record<string, number[]> = {
  GBP: [25, 50, 75, 100, 150, 200],
  USD: [35, 65, 95, 130, 190, 250],
  EUR: [30, 60, 90, 120, 180, 240],
  CAD: [45, 90, 130, 180, 250, 350],
  AUD: [50, 100, 150, 200, 300, 400],
};

const GiftCards = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice, currency, convertPrice } = useCurrency();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [senderEmail, setSenderEmail] = useState(user?.email || "");
  const [isProcessing, setIsProcessing] = useState(false);

  // Get display amounts for current currency
  const displayAmounts = GIFT_CARD_AMOUNTS_BY_CURRENCY[currency.code] || GIFT_CARD_AMOUNTS_BY_CURRENCY.GBP;
  
  // Convert selected display amount back to GBP for storage
  const selectedGBPAmount = selectedAmount ? selectedAmount / currency.rate : 0;
  const customGBPAmount = customAmount ? parseFloat(customAmount) : 0; // Custom is always in GBP
  const finalAmount = selectedAmount ? Math.round(selectedGBPAmount * 100) / 100 : customGBPAmount;

  const handleCustomAmountChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");
    setCustomAmount(numericValue);
    setSelectedAmount(null);
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const validateForm = () => {
    if (!finalAmount || finalAmount < 10) {
      toast.error("Please select or enter an amount (minimum £10)");
      return false;
    }
    if (finalAmount > 500) {
      toast.error("Maximum gift card amount is £500");
      return false;
    }
    if (!senderEmail || !isValidEmail(senderEmail)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (recipientEmail && !isValidEmail(recipientEmail)) {
      toast.error("Please enter a valid recipient email address");
      return false;
    }
    return true;
  };

  const handlePurchase = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';
    try {
      const res = await fetch(`${API_URL}/gift-cards/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          senderEmail,
          recipientEmail: recipientEmail || null,
          recipientName: sanitizeInput(recipientName) || null,
          personalMessage: sanitizeInput(personalMessage) || null,
          userId: user?.id || null,
        }),
      });

      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error || 'Failed to create gift card');

      toast.success("Gift card created successfully!");
      navigate(`/gift-cards/success?code=${data.code}&amount=${finalAmount}`);
    } catch (error) {
      console.error('Gift card purchase error:', error);
      toast.error("Failed to create gift card. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Gift Cards | Healios"
        description="Give the gift of wellness with a Healios gift card. Perfect for birthdays, holidays, or just because."
      />
      <Header />
      
      <main>
        <PageContainer>
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-light text-foreground mb-4">
              Give the Gift of Wellness
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Share the joy of feeling your best with a Healios gift card. 
              Perfect for any occasion.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Amount Selection */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-light text-foreground mb-4">
                  Select Amount
                </h2>
                
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {displayAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleAmountSelect(amount)}
                      className={`p-4 border rounded-lg text-center transition-all min-h-[44px] ${
                        selectedAmount === amount
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="text-lg font-medium">{currency.symbol}{amount}</span>
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Or enter custom amount
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      £
                    </span>
                    <Input
                      id="gift-custom-amount"
                      name="customAmount"
                      type="text"
                      inputMode="numeric"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      placeholder="Enter amount"
                      className="pl-8"
                      aria-label="Enter a custom gift card amount in GBP"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Min £10 · Max £500
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recipient Details */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-light text-foreground mb-4">
                  Gift Card Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="senderEmail" className="text-sm">
                      Your Email *
                    </Label>
                    <Input
                      id="senderEmail"
                      name="senderEmail"
                      type="email"
                      required
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="mt-1"
                    />
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Send className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Send to someone (optional)
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="recipientName" className="text-sm">
                          Recipient Name
                        </Label>
                        <Input
                          id="recipientName"
                          name="recipientName"
                          type="text"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Their name"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="recipientEmail" className="text-sm">
                          Recipient Email
                        </Label>
                        <Input
                          id="recipientEmail"
                          name="recipientEmail"
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="their@email.com"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="message" className="text-sm">
                          Personal Message
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={personalMessage}
                          onChange={(e) => setPersonalMessage(e.target.value)}
                          placeholder="Write a personal message..."
                          className="mt-1 min-h-[80px]"
                          maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {personalMessage.length}/500 characters
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary & Purchase */}
          <Card className="mt-8 border-0 shadow-sm max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gift Card Value</p>
                    <p className="text-2xl font-light text-foreground">
                      {selectedAmount ? `${currency.symbol}${selectedAmount}` : (customGBPAmount > 0 ? formatPrice(customGBPAmount) : "—")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 md:text-right">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Valid for 12 months</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Works on all products</span>
                  </div>
                </div>

                <Button
                  onClick={handlePurchase}
                  disabled={isProcessing || !finalAmount}
                  size="lg"
                  className="md:ml-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Purchase Gift Card
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-light text-foreground mb-2">Instant Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Receive your gift card code immediately after purchase
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-light text-foreground mb-2">Easy to Use</h3>
              <p className="text-sm text-muted-foreground">
                Apply the code at checkout to redeem your balance
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-light text-foreground mb-2">No Expiry Stress</h3>
              <p className="text-sm text-muted-foreground">
                12 months to use, plenty of time to shop
              </p>
            </div>
          </div>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default GiftCards;