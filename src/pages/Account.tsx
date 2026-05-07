import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isValidEmail } from '@/lib/validation';
import { logger } from '@/lib/logger';
import SEOHead from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { apiPost } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import OrderHistory from '@/components/account/OrderHistory';
import WishlistSection from '@/components/account/WishlistSection';
import LoyaltyPointsSection from '@/components/account/LoyaltyPointsSection';
import SubscriptionSection from '@/components/account/SubscriptionSection';
import ReferralSection from '@/components/account/ReferralSection';
import SectionErrorBoundary from '@/components/ui/section-error-boundary';
import { AlertCircle, Check, ArrowLeft } from 'lucide-react';
import PasswordUpdateSection from '@/components/account/PasswordUpdateSection';
import PhoneInput from '@/components/ui/phone-input';
import AddressManager from '@/components/account/AddressManager';

interface SavedAddress {
  id: string;
  label: string;
  street_address: string;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
}

const Account = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Profile validation state
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  // Email form state
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [emailChangeRequested, setEmailChangeRequested] = useState(false);
  
  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Data export state
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadAddresses();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setPhone(data.phone || '');
      }
    } catch (error) {
      logger.error('Failed to load profile', error);
    }
  };

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });
      
      setAddresses(data || []);
    } catch (error) {
      logger.error('Failed to load addresses', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Profile validation handlers
  const validateFirstName = (value: string) => {
    if (!value.trim()) {
      setFirstNameError('First name cannot be empty');
      return false;
    }
    if (value.length > 50) {
      setFirstNameError('First name must be less than 50 characters');
      return false;
    }
    setFirstNameError(null);
    return true;
  };

  const validateLastName = (value: string) => {
    if (!value.trim()) {
      setLastNameError('Last name cannot be empty');
      return false;
    }
    if (value.length > 50) {
      setLastNameError('Last name must be less than 50 characters');
      return false;
    }
    setLastNameError(null);
    return true;
  };

  const validatePhone = (value: string) => {
    if (value) {
      // Basic validation: must have dial code + at least some digits
      const parts = value.split(' ');
      if (parts.length < 2 || !parts[0].startsWith('+') || parts[1].length < 4) {
        setPhoneError('Please enter a valid phone number');
        return false;
      }
    }
    setPhoneError(null);
    return true;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate all fields before submission
    const isFirstNameValid = validateFirstName(firstName);
    const isLastNameValid = validateLastName(lastName);
    const isPhoneValid = validatePhone(phone);

    if (!isFirstNameValid || !isLastNameValid || !isPhoneValid) {
      toast.error('Please fix validation errors');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      logger.error('Failed to update profile', error);
      toast.error('Failed to update profile');
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newEmail.trim()) return;

    if (!isValidEmail(newEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;
      setEmailChangeRequested(true);
      toast.success('Confirmation email sent to ' + newEmail);
    } catch (error) {
      logger.error('Failed to update email', error);
      setEmailError(error instanceof Error ? error.message : 'Failed to update email');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);

    try {
      await apiPost('/account/delete');
      await signOut();
      toast.success('Account deleted successfully');
    } catch (error) {
      logger.error('Failed to delete account', error);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);

    try {
      // Fetch all user data
      const [profileRes, addressesRes, ordersRes, wishlistRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id),
        supabase.from('addresses').select('*').eq('user_id', user.id),
        supabase.from('orders').select('*').eq('user_id', user.id),
        supabase.from('wishlist').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        profile: profileRes.data,
        addresses: addressesRes.data,
        orders: ordersRes.data,
        wishlist: wishlistRes.data,
        exportedAt: new Date().toISOString(),
      };

      // Download as JSON
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `healios-data-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      logger.error('Failed to export data', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  if (!user) {
    const redirectTarget = encodeURIComponent(`${location.pathname}${location.search}`);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <h1 className="text-2xl font-light text-foreground">Sign in to view your account</h1>
            <p className="text-sm text-muted-foreground font-light">
              Your order history, wishlist, and subscriptions live in your account. Sign in to pick up where you left off.
            </p>
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full h-12 rounded-none">
                <Link to={`/auth?redirect=${redirectTarget}`}>Sign in</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12 rounded-none">
                <Link to={`/auth?mode=signUp&redirect=${redirectTarget}`}>Create an account</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/">Back to shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <SEOHead
        title="My Account | Healios"
        description="Manage your Healios account, view orders, update your profile, and track your wellness journey."
        noIndex
      />
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Shopping
            </Link>
            <button
              onClick={() => signOut()}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log Out
            </button>
          </div>
          <h1 className="text-4xl font-light text-foreground mb-2">My Account</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 rounded-none bg-muted/20 p-0 h-auto">
            <TabsTrigger value="overview" className="rounded-none">Overview</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-none">Profile</TabsTrigger>
            <TabsTrigger value="addresses" className="rounded-none">Addresses</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-none">Orders</TabsTrigger>
            <TabsTrigger value="wishlist" className="rounded-none">Wishlist</TabsTrigger>
            <TabsTrigger value="loyalty" className="rounded-none">Loyalty</TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-none">Subscriptions</TabsTrigger>
            <TabsTrigger value="referral" className="rounded-none">Refer Friends</TabsTrigger>
            <TabsTrigger value="security" className="rounded-none">Security</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card className="rounded-none">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-light mb-4">Account Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="text-foreground">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="text-foreground">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-light mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => setActiveTab('profile')}
                        variant="outline"
                        className="w-full"
                      >
                        Update Profile
                      </Button>
                      <Button 
                        onClick={handleExportData}
                        variant="outline"
                        className="w-full"
                        disabled={isExporting}
                      >
                        {isExporting ? 'Exporting...' : 'Export My Data'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="rounded-none">
              <CardContent className="pt-6">
                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onBlur={() => validateFirstName(firstName)}
                        className={firstNameError ? 'border-destructive' : ''}
                      />
                      {firstNameError && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-destructive">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {firstNameError}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onBlur={() => validateLastName(lastName)}
                        className={lastNameError ? 'border-destructive' : ''}
                      />
                      {lastNameError && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-destructive">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {lastNameError}
                        </div>
                      )}
                    </div>
                  </div>

                  <PhoneInput
                    value={phone}
                    onChange={(val) => setPhone(val)}
                    onBlur={() => validatePhone(phone)}
                    error={phoneError}
                  />

                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>

                {/* Email Change Section */}
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-lg font-light mb-4">Change Email Address</h3>
                  {emailChangeRequested ? (
                    <div className="p-4 bg-accent/10 rounded">
                      <p className="text-sm text-accent mb-2">Confirmation email sent to {newEmail}</p>
                      <p className="text-xs text-muted-foreground">Check your email for confirmation link</p>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-md">
                      <div>
                        <Label htmlFor="newEmail">New Email</Label>
                        <Input
                          id="newEmail"
                          name="newEmail"
                          type="email"
                          value={newEmail}
                          onChange={(e) => {
                            setNewEmail(e.target.value);
                            if (emailError) setEmailError(undefined);
                          }}
                          placeholder="Enter new email address"
                          className={emailError ? 'border-destructive' : ''}
                        />
                        {emailError && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-destructive">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {emailError}
                          </div>
                        )}
                      </div>
                      <Button 
                        type="submit"
                        disabled={isUpdatingEmail}
                        className="w-full"
                      >
                        {isUpdatingEmail ? 'Updating...' : 'Update Email'}
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card className="rounded-none">
              <CardContent className="pt-6">
                <AddressManager
                  addresses={addresses}
                  loading={loadingAddresses}
                  onRefresh={loadAddresses}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <SectionErrorBoundary>
              <OrderHistory />
            </SectionErrorBoundary>
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            <SectionErrorBoundary>
              <WishlistSection />
            </SectionErrorBoundary>
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty">
            <SectionErrorBoundary>
              <LoyaltyPointsSection />
            </SectionErrorBoundary>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <SectionErrorBoundary>
              <SubscriptionSection />
            </SectionErrorBoundary>
          </TabsContent>

          {/* Referral Tab */}
          <TabsContent value="referral">
            <SectionErrorBoundary>
              <ReferralSection />
            </SectionErrorBoundary>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="rounded-none">
              <CardContent className="pt-6 space-y-8">
                <PasswordUpdateSection />

                <div className="border-t pt-8">
                  <h3 className="text-lg font-light mb-4">Danger Zone</h3>
                  <Button 
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">This action cannot be undone</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your account? This will permanently delete:
              <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                <li>Your profile information</li>
                <li>Saved addresses</li>
                <li>Wishlist items</li>
                <li>Order history</li>
                <li>All personal data</li>
              </ul>
              This action cannot be undone.
            </AlertDialogDescription>
            <div className="flex gap-4">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-destructive"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Account;
