import { useState, useEffect, useRef } from "react";
import { Minus, Plus, Loader2, Lock, Check } from "lucide-react";
import OrderConfirmation from "@/components/checkout/OrderConfirmation";
import LoyaltyPointsRedeem from "@/components/checkout/LoyaltyPointsRedeem";
import GiftCardRedeem from "@/components/checkout/GiftCardRedeem";
import ReferralCodeInput from "@/components/checkout/ReferralCodeInput";
import CheckoutHeader from "../components/header/CheckoutHeader";
import Footer from "../components/footer/Footer";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getAttributionData } from "@/hooks/useUTMCapture";
import { trackBeginCheckout } from "@/lib/analytics";
import { trackMetaInitiateCheckout } from "@/lib/metaPixel";
import { useThrottledClick } from "@/lib/useRateLimitedAction";
import { logger } from "@/lib/logger";
import { 
  isValidUKPostcode, 
  formatUKPostcode, 
  getPostcodeError,
  sanitizeInput,
  isValidEmail,
  isValidUKPhone
} from "@/lib/validation";

interface SavedAddress {
  id: string;
  label: string;
  street_address: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

const Checkout = () => {
  const { cartItems, updateQuantity, subtotal, clearCart, addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [customerDetails, setCustomerDetails] = useState({
    email: user?.email || "",
    firstName: "",
    lastName: "",
    phone: ""
  });
  const [shippingAddress, setShippingAddress] = useState({
    address: "",
    city: "",
    postalCode: "",
    country: "United Kingdom"
  });
  const [hasSeparateBilling, setHasSeparateBilling] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "United Kingdom"
  });
  const [shippingOption, setShippingOption] = useState("standard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [saveShippingAddress, setSaveShippingAddress] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountMessage, setDiscountMessage] = useState("");
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState("");
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [giftCardCode, setGiftCardCode] = useState<string | null>(null);
  const [giftCardBalance, setGiftCardBalance] = useState(0);
  const [giftCardDiscount, setGiftCardDiscount] = useState(0);
  const [appliedReferralCode, setAppliedReferralCode] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  const [isRecoveringCart, setIsRecoveringCart] = useState(false);

  // Inline validation errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [postcodeError, setPostcodeError] = useState<string | null>(null);

  // Rate limiting for discount validation
  const { handler: throttledDiscountSubmit } = useThrottledClick(
    () => handleDiscountSubmit(),
    500 // 500ms cooldown
  );

  // Handle Stripe redirect success/cancel and cart recovery
  useEffect(() => {
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');
    const sessionId = searchParams.get('session_id');
    const recoveryToken = searchParams.get('recover');

    if (success === 'true' && sessionId) {
      setPaymentComplete(true);
      setCompletedOrderId(sessionId);
      clearCart();
      toast.success("Order placed successfully!");
      // Clear URL params
      navigate('/checkout', { replace: true });
    } else if (cancelled === 'true') {
      toast.error("Payment was cancelled. Your cart items are still saved.");
      navigate('/checkout', { replace: true });
    } else if (recoveryToken) {
      // Handle cart recovery from payment failure email
      handleCartRecovery(recoveryToken);
    }
  }, [searchParams, clearCart, navigate]);

  // Function to recover cart from payment failure
  const handleCartRecovery = async (token: string) => {
    setIsRecoveringCart(true);
    
    try {
      const { data, error } = await supabase
        .from('checkout_recovery')
        .select('*')
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (error || !data) {
        logger.warn('Recovery token invalid or expired', { error });
        toast.error("This recovery link has expired or is no longer valid.");
        navigate('/checkout', { replace: true });
        return;
      }
      
      // Clear existing cart and add recovered items
      clearCart();
      
      const recoveredItems = data.cart_items as any[];
      for (const item of recoveredItems) {
        // Add item first (this adds with quantity 1)
        addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          category: item.category || '',
          isSubscription: item.isSubscription || false,
        });
        // Then update to the correct quantity if > 1
        if (item.quantity > 1) {
          updateQuantity(item.id, item.quantity, item.isSubscription || false);
        }
      }
      
      // Restore customer details if available
      if (data.customer_details) {
        const details = data.customer_details as any;
        setCustomerDetails(prev => ({
          ...prev,
          email: data.email,
          firstName: details.first_name || '',
          lastName: details.last_name || '',
          phone: details.phone || '',
        }));
      }
      
      // Restore shipping address if available
      if (data.shipping_address) {
        const address = data.shipping_address as any;
        setShippingAddress({
          address: address.address || '',
          city: address.city || '',
          postalCode: address.postal_code || '',
          country: address.country || 'United Kingdom',
        });
      }
      
      // Mark recovery as used
      await supabase
        .from('checkout_recovery')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token);
      
      toast.success("Your cart has been restored! Ready to complete your order.");
      navigate('/checkout', { replace: true });
    } catch (err) {
      logger.error('Error recovering cart', err);
      toast.error("Failed to recover your cart. Please try again.");
      navigate('/checkout', { replace: true });
    } finally {
      setIsRecoveringCart(false);
    }
  };

  // Track begin_checkout event when checkout page loads with items
  const hasTrackedCheckout = useRef(false);
  useEffect(() => {
    if (cartItems.length > 0 && !paymentComplete && !hasTrackedCheckout.current) {
      hasTrackedCheckout.current = true;
      
      const items = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
      }));
      
      // GA4 begin_checkout
      trackBeginCheckout(items, appliedDiscountCode || undefined);
      
      // Meta Pixel InitiateCheckout
      trackMetaInitiateCheckout(items, subtotal);
    }
  }, [cartItems, paymentComplete, subtotal, appliedDiscountCode]);

  // Fetch saved addresses when user is logged in
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      
      if (!error && data) {
        setSavedAddresses(data as SavedAddress[]);
        
        // Auto-select default address and populate form
        const defaultAddress = data.find(a => a.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setShippingAddress({
            address: defaultAddress.street_address,
            city: defaultAddress.city,
            postalCode: defaultAddress.postal_code,
            country: defaultAddress.country
          });
        }
      }
    };
    
    fetchSavedAddresses();
  }, [user]);

  const handleSelectSavedAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    
    if (addressId === "new") {
      setShippingAddress({
        address: "",
        city: "",
        postalCode: "",
        country: "United Kingdom"
      });
      return;
    }
    
    const address = savedAddresses.find(a => a.id === addressId);
    if (address) {
      setShippingAddress({
        address: address.street_address,
        city: address.city,
        postalCode: address.postal_code,
        country: address.country
      });
    }
  };

  const handleSelectBillingAddress = (addressId: string) => {
    setSelectedBillingAddressId(addressId);
    
    if (addressId === "new") {
      setBillingDetails(prev => ({
        ...prev,
        address: "",
        city: "",
        postalCode: "",
        country: "United Kingdom"
      }));
      return;
    }
    
    const address = savedAddresses.find(a => a.id === addressId);
    if (address) {
      setBillingDetails(prev => ({
        ...prev,
        address: address.street_address,
        city: address.city,
        postalCode: address.postal_code,
        country: address.country
      }));
    }
  };

  const getShippingCost = () => {
    switch (shippingOption) {
      case "express":
        return 5.99;
      case "overnight":
        return 9.99;
      default:
        return 0; // Standard shipping is free
    }
  };
  
  const shipping = getShippingCost();
  const total = subtotal + shipping - discountAmount - loyaltyDiscount - giftCardDiscount;
  // UK VAT is 20%, prices are VAT-inclusive so VAT = total - (total / 1.2)
  const vatAmount = total - (total / 1.2);

  const handleDiscountSubmit = async () => {
    if (!discountCode.trim()) {
      toast.error("Please enter a discount code");
      return;
    }

    setIsValidatingDiscount(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-discount', {
        body: {
          code: discountCode,
          subtotal: subtotal,
        },
      });

      if (error) {
        throw new Error('Failed to validate discount');
      }

      if (data.valid) {
        setDiscountAmount(data.discount_amount);
        setDiscountMessage(data.message);
        setAppliedDiscountCode(data.code);
        setShowDiscountInput(false);
        toast.success(data.message);
      } else {
        toast.error(data.error || "Invalid discount code");
        setDiscountAmount(0);
        setDiscountMessage("");
        setAppliedDiscountCode("");
      }
    } catch (error) {
      logger.error('Discount validation error', error);
      toast.error("Failed to validate discount code");
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountAmount(0);
    setDiscountMessage("");
    setAppliedDiscountCode("");
    setDiscountCode("");
    setShowDiscountInput(false);
  };

  // Sanitize input on change to prevent XSS
  // Inline validation for customer details
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError(null);
      return true;
    }
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError(null);
      return true;
    }
    if (!isValidUKPhone(phone)) {
      setPhoneError('Please enter a valid UK phone number');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const validatePostcode = (postcode: string) => {
    if (!postcode) {
      setPostcodeError(null);
      return true;
    }
    const error = getPostcodeError(postcode);
    if (error) {
      setPostcodeError(error);
      return false;
    }
    setPostcodeError(null);
    return true;
  };

  const handleCustomerDetailsChange = (field: string, value: string) => {
    const sanitized = sanitizeInput(value);
    setCustomerDetails(prev => ({ ...prev, [field]: sanitized }));
  };

  const handleShippingAddressChange = (field: string, value: string) => {
    let sanitized = sanitizeInput(value);
    // Auto-format postcode as user types
    if (field === 'postalCode') {
      sanitized = formatUKPostcode(sanitized);
    }
    setShippingAddress(prev => ({ ...prev, [field]: sanitized }));
  };

  const handleBillingDetailsChange = (field: string, value: string) => {
    let sanitized = sanitizeInput(value);
    // Auto-format postcode as user types
    if (field === 'postalCode') {
      sanitized = formatUKPostcode(sanitized);
    }
    setBillingDetails(prev => ({ ...prev, [field]: sanitized }));
  };


  const validateForm = () => {
    // Validate required customer details
    if (!customerDetails.email || !customerDetails.firstName || !customerDetails.lastName) {
      toast.error("Please fill in all required customer details");
      return false;
    }

    // Validate email format
    if (!isValidEmail(customerDetails.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    // Validate phone format (if provided)
    if (customerDetails.phone && !isValidUKPhone(customerDetails.phone)) {
      toast.error("Please enter a valid UK phone number");
      return false;
    }

    // Validate shipping address required fields
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
      toast.error("Please fill in all shipping address fields");
      return false;
    }

    // Validate UK postcode format
    const postcodeError = getPostcodeError(shippingAddress.postalCode);
    if (postcodeError) {
      toast.error(postcodeError);
      return false;
    }

    // Validate billing address if separate
    if (hasSeparateBilling) {
      if (!billingDetails.address || !billingDetails.city || !billingDetails.postalCode || !billingDetails.country) {
        toast.error("Please fill in all billing address fields");
        return false;
      }
      
      const billingPostcodeError = getPostcodeError(billingDetails.postalCode);
      if (billingPostcodeError) {
        toast.error("Billing: " + billingPostcodeError);
        return false;
      }
    }

    return true;
  };

  const handleCompleteOrder = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    
    try {
      // Save shipping address to account if requested (do this before Stripe redirect)
      if (saveShippingAddress && user) {
        try {
          const { data: existingAddresses } = await supabase
            .from('addresses')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

          const isFirstAddress = !existingAddresses || existingAddresses.length === 0;

          await supabase
            .from('addresses')
            .insert({
              user_id: user.id,
              label: 'Home',
              street_address: shippingAddress.address,
              city: shippingAddress.city,
              postal_code: shippingAddress.postalCode,
              country: shippingAddress.country,
              is_default: isFirstAddress,
            });
        } catch (addressSaveError) {
          logger.error('Failed to save address', addressSaveError);
        }
      }

      // Call Stripe checkout session edge function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          cartItems: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            category: item.category,
            isSubscription: item.isSubscription || false,
          })),
          customerEmail: customerDetails.email,
          customerDetails: {
            firstName: customerDetails.firstName,
            lastName: customerDetails.lastName,
            phone: customerDetails.phone,
          },
          shippingAddress: {
            address: shippingAddress.address,
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
          },
          billingAddress: hasSeparateBilling ? {
            address: billingDetails.address,
            city: billingDetails.city,
            postalCode: billingDetails.postalCode,
            country: billingDetails.country,
          } : undefined,
          discountCode: appliedDiscountCode || undefined,
          discountAmount: discountAmount,
          referralCode: appliedReferralCode || undefined,
          shippingMethod: shippingOption,
          shippingCost: shipping,
          userId: user?.id,
          attribution: getAttributionData(),
        },
      });

      if (error) {
        logger.error('Stripe session error', error);
        throw new Error('Failed to create checkout session');
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      logger.error('Checkout error', error);
      toast.error("Failed to start checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  // Order Complete state - show dedicated confirmation page
  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-background">
        <CheckoutHeader />
        <main>
          <PageContainer maxWidth="wide" className="py-6">
            <OrderConfirmation 
              sessionId={completedOrderId || ''} 
              customerEmail={customerDetails.email}
              isLoggedIn={!!user}
            />
          </PageContainer>
        </main>
        <Footer />
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <CheckoutHeader />
        <main>
          <PageContainer maxWidth="wide" className="text-center py-20">
            <h1 className="text-2xl font-light text-foreground mb-4">Your bag is empty</h1>
            <p className="text-muted-foreground mb-8">Add some products to your bag to proceed with checkout.</p>
            <Link to="/">
              <Button className="rounded-none">Continue Shopping</Button>
            </Link>
          </PageContainer>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CheckoutHeader />
      
      <main>
        <PageContainer maxWidth="wide" className="py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Order Summary - First on mobile, last on desktop */}
            <div className="lg:col-span-1 lg:order-2">
              <div className="bg-muted/20 p-8 rounded-none sticky top-6">
                <h2 className="text-lg font-light text-foreground mb-6">Order Summary</h2>
                
                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.isSubscription ? 'sub' : 'once'}`} className="flex gap-4">
                      <div className="w-20 h-20 bg-muted rounded-none overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-light text-foreground">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                        {item.isSubscription && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-sm">
                            Subscribe & Save
                          </span>
                        )}
                        
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.isSubscription)}
                            className="h-8 w-8 p-0 rounded-none border-muted-foreground/20"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium text-foreground min-w-[2ch] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.isSubscription)}
                            className="h-8 w-8 p-0 rounded-none border-muted-foreground/20"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-foreground font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Discount Code Section */}
                <div className="mt-8 pt-6 border-t border-muted-foreground/20">
                  {appliedDiscountCode ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-accent" />
                        <span className="text-sm text-foreground">
                          {appliedDiscountCode}: {discountMessage}
                        </span>
                      </div>
                      <button 
                        onClick={handleRemoveDiscount}
                        className="text-sm text-muted-foreground underline hover:no-underline transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  ) : !showDiscountInput ? (
                    <button 
                      onClick={() => setShowDiscountInput(true)}
                      className="text-sm text-foreground underline hover:no-underline transition-all"
                    >
                      Discount code
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          name="discountCode"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          placeholder="Enter discount code"
                          className="flex-1 rounded-none"
                          disabled={isValidatingDiscount}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleDiscountSubmit();
                            }
                          }}
                        />
                        <Button 
                          onClick={throttledDiscountSubmit}
                          variant="outline"
                          size="sm"
                          className="rounded-none"
                          disabled={isValidatingDiscount}
                        >
                          {isValidatingDiscount ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Loyalty Points Redemption */}
                <div className="mt-4">
                  <LoyaltyPointsRedeem
                    onRedeemChange={(points, discount) => {
                      setLoyaltyPointsToRedeem(points);
                      setLoyaltyDiscount(discount);
                    }}
                    maxRedeemValue={subtotal - discountAmount - giftCardDiscount}
                  />
                </div>

                {/* Gift Card Redemption */}
                <div className="mt-4">
                  <GiftCardRedeem
                    onRedeemChange={(code, balance, amountApplied) => {
                      setGiftCardCode(code);
                      setGiftCardBalance(balance);
                      setGiftCardDiscount(amountApplied);
                    }}
                    maxRedeemValue={subtotal + shipping - discountAmount - loyaltyDiscount}
                  />
                </div>

                {/* Referral Code */}
                <div className="mt-4">
                  <ReferralCodeInput
                    customerEmail={customerDetails.email}
                    onReferralApplied={(code, name) => {
                      setAppliedReferralCode(code);
                      setReferrerName(name);
                    }}
                    appliedCode={appliedReferralCode}
                    onRemoveReferral={() => {
                      setAppliedReferralCode(null);
                      setReferrerName(null);
                    }}
                  />
                </div>

                <div className="border-t border-muted-foreground/20 mt-4 pt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-accent">Discount</span>
                      <span className="text-accent">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-accent">Points Discount</span>
                      <span className="text-accent">-{formatPrice(loyaltyDiscount)}</span>
                    </div>
                  )}
                  {giftCardDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-accent">Gift Card</span>
                      <span className="text-accent">-{formatPrice(giftCardDiscount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Left Column - Forms */}
            <div className="lg:col-span-2 lg:order-1 space-y-8">

              {/* Login prompt for guests */}
              {!user && (
                <div className="bg-muted/20 p-6 rounded-none border border-muted-foreground/20">
                  <p className="text-sm text-foreground mb-3">
                    Already have an account? Sign in to save your order history.
                  </p>
                  <Link to="/auth?redirect=/checkout">
                    <Button variant="outline" size="sm" className="rounded-none">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}

              {/* Customer Details Form */}
              <div className="bg-muted/20 p-8 rounded-none">
                <h2 className="text-lg font-light text-foreground mb-6">Customer Details</h2>
                
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="text-sm font-light text-foreground">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) => handleCustomerDetailsChange("email", e.target.value)}
                      onBlur={() => validateEmail(customerDetails.email)}
                      className={`mt-2 rounded-none ${emailError ? 'border-destructive' : ''}`}
                      placeholder="Enter your email"
                    />
                    {emailError && (
                      <p className="text-destructive text-sm mt-1 flex items-center gap-1">
                        <span>⚠</span> {emailError}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-light text-foreground">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={customerDetails.firstName}
                        onChange={(e) => handleCustomerDetailsChange("firstName", e.target.value)}
                        className="mt-2 rounded-none"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-light text-foreground">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={customerDetails.lastName}
                        onChange={(e) => handleCustomerDetailsChange("lastName", e.target.value)}
                        className="mt-2 rounded-none"
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-light text-foreground">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={customerDetails.phone}
                      onChange={(e) => handleCustomerDetailsChange("phone", e.target.value)}
                      onBlur={() => validatePhone(customerDetails.phone)}
                      className={`mt-2 rounded-none ${phoneError ? 'border-destructive' : ''}`}
                      placeholder="Enter your phone number"
                    />
                    {phoneError && (
                      <p className="text-destructive text-sm mt-1 flex items-center gap-1">
                        <span>⚠</span> {phoneError}
                      </p>
                    )}
                  </div>

                  {/* Shipping Address */}
                  <div className="border-t border-muted-foreground/20 pt-6 mt-8">
                    <h3 className="text-base font-light text-foreground mb-4">Shipping Address</h3>
                    
                    {/* Saved Address Selector */}
                    {user && savedAddresses.length > 0 && (
                      <div className="mb-6">
                        <Label className="text-sm font-light text-foreground">
                          Use a saved address
                        </Label>
                        <Select value={selectedAddressId} onValueChange={handleSelectSavedAddress}>
                          <SelectTrigger className="mt-2 rounded-none">
                            <SelectValue placeholder="Select a saved address" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border rounded-none">
                            {savedAddresses.map((address) => (
                              <SelectItem key={address.id} value={address.id}>
                                {address.label}{address.is_default ? " (Default)" : ""} - {address.street_address}, {address.city}
                              </SelectItem>
                            ))}
                            <SelectItem value="new">Enter a new address</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="shippingAddress" className="text-sm font-light text-foreground">
                          Address *
                        </Label>
                        <Input
                          id="shippingAddress"
                          name="shippingAddress"
                          type="text"
                          value={shippingAddress.address}
                          onChange={(e) => handleShippingAddressChange("address", e.target.value)}
                          className="mt-2 rounded-none"
                          placeholder="Street address"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shippingCity" className="text-sm font-light text-foreground">
                            City *
                          </Label>
                          <Input
                            id="shippingCity"
                            name="shippingCity"
                            type="text"
                            value={shippingAddress.city}
                            onChange={(e) => handleShippingAddressChange("city", e.target.value)}
                            className="mt-2 rounded-none"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shippingPostalCode" className="text-sm font-light text-foreground">
                            Postal Code *
                          </Label>
                          <Input
                            id="shippingPostalCode"
                            name="shippingPostalCode"
                            type="text"
                            value={shippingAddress.postalCode}
                            onChange={(e) => handleShippingAddressChange("postalCode", e.target.value)}
                            onBlur={() => validatePostcode(shippingAddress.postalCode)}
                            className={`mt-2 rounded-none ${postcodeError ? 'border-destructive' : ''}`}
                            placeholder="Postal code"
                          />
                          {postcodeError && (
                            <p className="text-destructive text-sm mt-1 flex items-center gap-1">
                              <span>⚠</span> {postcodeError}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="shippingCountry" className="text-sm font-light text-foreground">
                          Country *
                        </Label>
                        <Input
                          id="shippingCountry"
                          name="shippingCountry"
                          type="text"
                          value={shippingAddress.country}
                          onChange={(e) => handleShippingAddressChange("country", e.target.value)}
                          className="mt-2 rounded-none"
                          placeholder="Country"
                        />
                      </div>

                      {/* Save Address Checkbox */}
                      {user && (
                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                            id="saveAddress"
                            checked={saveShippingAddress}
                            onCheckedChange={(checked) => setSaveShippingAddress(checked === true)}
                          />
                          <Label 
                            htmlFor="saveAddress" 
                            className="text-sm font-light text-foreground cursor-pointer"
                          >
                            Save this address to my account
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Billing Address Checkbox */}
                  <div className="border-t border-muted-foreground/20 pt-6 mt-8">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="separateBilling"
                        checked={hasSeparateBilling}
                        onCheckedChange={(checked) => setHasSeparateBilling(checked === true)}
                      />
                      <Label 
                        htmlFor="separateBilling" 
                        className="text-sm font-light text-foreground cursor-pointer"
                      >
                        Other billing address
                      </Label>
                    </div>
                  </div>

                  {/* Billing Details - shown when checkbox is checked */}
                  {hasSeparateBilling && (
                    <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-light text-foreground">Billing Details</h3>
                        <button
                          type="button"
                          onClick={() => {
                            setBillingDetails(prev => ({
                              ...prev,
                              address: shippingAddress.address,
                              city: shippingAddress.city,
                              postalCode: shippingAddress.postalCode,
                              country: shippingAddress.country
                            }));
                            setSelectedBillingAddressId("");
                          }}
                          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                        >
                          Copy from shipping
                        </button>
                      </div>
                      
                      <div>
                        <Label htmlFor="billingEmail" className="text-sm font-light text-foreground">
                          Email Address *
                        </Label>
                        <Input
                          id="billingEmail"
                          name="billingEmail"
                          type="email"
                          value={billingDetails.email}
                          onChange={(e) => handleBillingDetailsChange("email", e.target.value)}
                          className="mt-2 rounded-none"
                          placeholder="Enter billing email"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="billingFirstName" className="text-sm font-light text-foreground">
                            First Name *
                          </Label>
                          <Input
                            id="billingFirstName"
                            name="billingFirstName"
                            type="text"
                            value={billingDetails.firstName}
                            onChange={(e) => handleBillingDetailsChange("firstName", e.target.value)}
                            className="mt-2 rounded-none"
                            placeholder="First name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingLastName" className="text-sm font-light text-foreground">
                            Last Name *
                          </Label>
                          <Input
                            id="billingLastName"
                            name="billingLastName"
                            type="text"
                            value={billingDetails.lastName}
                            onChange={(e) => handleBillingDetailsChange("lastName", e.target.value)}
                            className="mt-2 rounded-none"
                            placeholder="Last name"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="billingPhone" className="text-sm font-light text-foreground">
                          Phone Number
                        </Label>
                        <Input
                          id="billingPhone"
                          name="billingPhone"
                          type="tel"
                          value={billingDetails.phone}
                          onChange={(e) => handleBillingDetailsChange("phone", e.target.value)}
                          className="mt-2 rounded-none"
                          placeholder="Enter billing phone number"
                        />
                      </div>

                      {/* Saved Billing Address Selector */}
                      {user && savedAddresses.length > 0 && (
                        <div className="mb-2">
                          <Label className="text-sm font-light text-foreground">
                            Use a saved address
                          </Label>
                          <Select value={selectedBillingAddressId} onValueChange={handleSelectBillingAddress}>
                            <SelectTrigger className="mt-2 rounded-none">
                              <SelectValue placeholder="Select a saved address" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border rounded-none">
                              {savedAddresses.map((address) => (
                                <SelectItem key={address.id} value={address.id}>
                                  {address.label}{address.is_default ? " (Default)" : ""} - {address.street_address}, {address.city}
                                </SelectItem>
                              ))}
                              <SelectItem value="new">Enter a new address</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="billingAddress" className="text-sm font-light text-foreground">
                          Address *
                        </Label>
                        <Input
                          id="billingAddress"
                          name="billingAddress"
                          type="text"
                          value={billingDetails.address}
                          onChange={(e) => handleBillingDetailsChange("address", e.target.value)}
                          className="mt-2 rounded-none"
                          placeholder="Street address"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="billingCity" className="text-sm font-light text-foreground">
                            City *
                          </Label>
                          <Input
                            id="billingCity"
                            name="billingCity"
                            type="text"
                            value={billingDetails.city}
                            onChange={(e) => handleBillingDetailsChange("city", e.target.value)}
                            className="mt-2 rounded-none"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingPostalCode" className="text-sm font-light text-foreground">
                            Postal Code *
                          </Label>
                          <Input
                            id="billingPostalCode"
                            name="billingPostalCode"
                            type="text"
                            value={billingDetails.postalCode}
                            onChange={(e) => handleBillingDetailsChange("postalCode", e.target.value)}
                            className="mt-2 rounded-none"
                            placeholder="Postal code"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="billingCountry" className="text-sm font-light text-foreground">
                          Country *
                        </Label>
                        <Input
                          id="billingCountry"
                          name="billingCountry"
                          type="text"
                          value={billingDetails.country}
                          onChange={(e) => handleBillingDetailsChange("country", e.target.value)}
                          className="mt-2 rounded-none"
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

            {/* Shipping Options */}
            <div className="bg-muted/20 p-8 rounded-none">
              <h2 className="text-lg font-light text-foreground mb-6">Shipping Options</h2>
              
              <RadioGroup 
                value={shippingOption} 
                onValueChange={setShippingOption}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-muted-foreground/20 rounded-none gap-2">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard" className="font-light text-foreground">
                      Standard Shipping
                    </Label>
                  </div>
                  <div className="text-sm text-muted-foreground sm:text-right pl-7 sm:pl-0">
                    Free • 3-5 business days
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-muted-foreground/20 rounded-none gap-2">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="express" id="express" />
                    <Label htmlFor="express" className="font-light text-foreground">
                      Express Shipping
                    </Label>
                  </div>
                  <div className="text-sm text-muted-foreground sm:text-right pl-7 sm:pl-0">
                    {formatPrice(5.99)} • 1-2 business days
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-muted-foreground/20 rounded-none gap-2">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="overnight" id="overnight" />
                    <Label htmlFor="overnight" className="font-light text-foreground">
                      Overnight Delivery
                    </Label>
                  </div>
                  <div className="text-sm text-muted-foreground sm:text-right pl-7 sm:pl-0">
                    {formatPrice(9.99)} • Next business day
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Payment Section */}
            <div className="bg-muted/20 p-8 rounded-none">
              <h2 className="text-lg font-light text-foreground mb-6">Payment</h2>
              
              {!paymentComplete ? (
                <div className="space-y-6">
                  {/* Order Total Summary */}
                  <div className="bg-muted/10 p-6 rounded-none border border-muted-foreground/20 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{formatPrice(subtotal)}</span>
                    </div>
                    {cartItems.some(item => item.isSubscription) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subscription discount (15%)</span>
                        <span className="text-primary">Included</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Discount</span>
                        <span className="text-green-600">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    {loyaltyDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Points Discount</span>
                        <span className="text-green-600">-{formatPrice(loyaltyDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-foreground">
                        {shipping === 0 ? "Free" : formatPrice(shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-muted-foreground/20 pt-3">
                      <span className="text-muted-foreground">VAT (20% included)</span>
                      <span className="text-foreground">{formatPrice(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-medium">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">{formatPrice(total)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      All prices include VAT
                    </p>
                  </div>

                  <div className="text-center text-sm text-muted-foreground py-2">
                    <div className="flex items-center justify-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Secure checkout powered by Stripe</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCompleteOrder}
                    disabled={isProcessing}
                    className="w-full rounded-none h-12 text-base"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting to payment...
                      </>
                    ) : (
                      `Pay with Stripe • ${formatPrice(total)}`
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    You will be redirected to Stripe to complete your payment securely.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-light text-foreground mb-2">Order Complete!</h3>
                  {completedOrderId && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Session: {completedOrderId.slice(0, 12).toUpperCase()}
                    </p>
                  )}
                  <p className="text-muted-foreground mb-6">Thank you for your purchase. Your order confirmation has been sent to your email.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/account">
                      <Button variant="outline" className="rounded-none">View Order History</Button>
                    </Link>
                    <Link to="/">
                      <Button className="rounded-none">Continue Shopping</Button>
                    </Link>
                  </div>
                 </div>
               )}
             </div>
             </div>
          </div>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;