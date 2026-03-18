import { useState, useEffect, useCallback } from 'react';
import OptimizedImage from '@/components/ui/optimized-image';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowLeft, Check, X, AlertCircle } from 'lucide-react';
import { trackClarityEvent } from '@/lib/clarity';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

// Password requirements for signup
const passwordRequirements = [
  { regex: /.{6,}/, label: 'At least 6 characters' },
  { regex: /[A-Z]/, label: 'One uppercase letter' },
  { regex: /[a-z]/, label: 'One lowercase letter' },
  { regex: /[0-9]/, label: 'One number' },
];

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; firstName?: string }>({});
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; firstName?: boolean }>({});
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  
  const { signUp, signIn, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  // Check if user came from password reset link
  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      toast.info('You can now set a new password in your account settings.');
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/account');
    }
  }, [user, navigate]);

  // Real-time email validation
  const validateEmailField = useCallback((value: string): string | null => {
    if (!value) return 'Email is required';
    const result = emailSchema.safeParse(value);
    if (!result.success) return result.error.errors[0].message;
    return null;
  }, []);

  // Real-time password validation
  const validatePasswordField = useCallback((value: string): string | null => {
    if (!value) return 'Password is required';
    const result = passwordSchema.safeParse(value);
    if (!result.success) return result.error.errors[0].message;
    return null;
  }, []);

  // Check individual password requirements
  const getPasswordRequirementsMet = useCallback((value: string) => {
    return passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(value)
    }));
  }, []);

  const validateEmail = () => {
    const error = validateEmailField(email);
    if (error) {
      setErrors(prev => ({ ...prev, email: error }));
      return false;
    }
    return true;
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; firstName?: string } = {};
    
    const emailError = validateEmailField(email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validatePasswordField(password);
    if (passwordError) newErrors.password = passwordError;

    // Require first name for signup
    if (mode === 'signUp' && !firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    setErrors(newErrors);
    setTouched({ email: true, password: true, firstName: true });
    return Object.keys(newErrors).length === 0;
  };

  // Handle field blur for validation
  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    const error = validateEmailField(email);
    setErrors(prev => ({ ...prev, email: error || undefined }));
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    setShowPasswordRequirements(false);
    const error = validatePasswordField(password);
    setErrors(prev => ({ ...prev, password: error || undefined }));
  };

  const handleFirstNameBlur = () => {
    if (mode === 'signUp') {
      setTouched(prev => ({ ...prev, firstName: true }));
      if (!firstName.trim()) {
        setErrors(prev => ({ ...prev, firstName: 'First name is required' }));
      } else {
        setErrors(prev => ({ ...prev, firstName: undefined }));
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error.message);
      } else {
        setResetEmailSent(true);
        toast.success('Password reset email sent! Check your inbox.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (mode === 'signUp') {
        trackClarityEvent('signup_started');
        const { error } = await signUp(email, password, firstName, lastName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created successfully! Welcome to Healios.');
          navigate('/account');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          trackClarityEvent('login_failed');
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please try again.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
          navigate('/account');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getHeading = () => {
    switch (mode) {
      case 'signUp':
        return 'Start Your Wellness Journey';
      case 'forgotPassword':
        return 'Reset Your Password';
      default:
        return 'Welcome Back';
    }
  };

  const getSubheading = () => {
    switch (mode) {
      case 'signUp':
        return 'Join thousands feeling their best with science-backed supplements.';
      case 'forgotPassword':
        return "Enter your email and we'll send you a link to reset your password.";
      default:
        return 'Continue your journey to better health and vitality.';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="/auth-background.jpg"
          alt="Wellness lifestyle"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <div />
          <div className="max-w-md">
            <blockquote className="text-white text-xl font-light leading-relaxed mb-4">
              "Since starting my daily routine with Healios, I wake up feeling energised and ready to take on the day. It has truly transformed how I feel."
            </blockquote>
            <p className="text-white/80 text-sm font-light">
              — Sarah M., London
            </p>
          </div>
           <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <OptimizedImage src="/healios-logo.png" alt="The Healios Health Co." priority={true} fit="contain" className="h-10 brightness-0 invert" />
          </Link>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden mb-12 block text-center hover:opacity-80 transition-opacity">
            <OptimizedImage src="/healios-logo.png" alt="The Healios Health Co." priority={true} fit="contain" className="h-8 mx-auto" />
          </Link>

          {/* Back button for forgot password */}
          {mode === 'forgotPassword' && (
            <button
              type="button"
              onClick={() => {
                setMode('signIn');
                setResetEmailSent(false);
                setErrors({});
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </button>
          )}

          <h1 className="text-3xl font-light text-foreground mb-2">
            {getHeading()}
          </h1>
          <p className="text-muted-foreground mb-8">
            {getSubheading()}
          </p>

          {/* Forgot Password Form */}
          {mode === 'forgotPassword' ? (
            resetEmailSent ? (
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-6 text-center">
                  <p className="text-foreground mb-2">Check your email</p>
                  <p className="text-muted-foreground text-sm">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => {
                    setMode('signIn');
                    setResetEmailSent(false);
                    setErrors({});
                  }}
                >
                  Return to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <Label htmlFor="reset-email" className="text-sm font-light">
                    Email Address
                  </Label>
                  <Input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    className={`mt-1 ${errors.email ? 'border-destructive' : ''}`}
                    placeholder="anna@example.com"
                    required
                  />
                  {errors.email && (
                    <p className="text-destructive text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            )
          ) : (
            <>
              {/* Sign In / Sign Up Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {mode === 'signUp' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-light">
                        First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (touched.firstName) {
                            setErrors(prev => ({ 
                              ...prev, 
                              firstName: e.target.value.trim() ? undefined : 'First name is required' 
                            }));
                          }
                        }}
                        onBlur={handleFirstNameBlur}
                        className={`mt-1 ${touched.firstName && errors.firstName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        placeholder="Anna"
                        required
                      />
                      {touched.firstName && errors.firstName && (
                        <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-light">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1"
                        placeholder="Smith"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="auth-email" className="text-sm font-light">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="auth-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (touched.email) {
                          const error = validateEmailField(e.target.value);
                          setErrors(prev => ({ ...prev, email: error || undefined }));
                        }
                      }}
                      onBlur={handleEmailBlur}
                      className={`mt-1 pr-10 ${touched.email && errors.email ? 'border-destructive focus-visible:ring-destructive' : touched.email && !errors.email && email ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
                      placeholder="anna@example.com"
                      required
                    />
                    {touched.email && email && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
                        {errors.email ? (
                          <X className="h-4 w-4 text-destructive" />
                        ) : (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {touched.email && errors.email && (
                    <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auth-password" className="text-sm font-light">
                      Password <span className="text-destructive">*</span>
                    </Label>
                    {mode === 'signIn' && (
                      <button
                        type="button"
                        onClick={() => {
                          trackClarityEvent('password_reset_clicked');
                          setMode('forgotPassword');
                          setErrors({});
                          setTouched({});
                        }}
                        className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="auth-password"
                      name="password"
                      type="password"
                      autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (touched.password) {
                          const error = validatePasswordField(e.target.value);
                          setErrors(prev => ({ ...prev, password: error || undefined }));
                        }
                      }}
                      onFocus={() => mode === 'signUp' && setShowPasswordRequirements(true)}
                      onBlur={handlePasswordBlur}
                      className={`mt-1 pr-10 ${touched.password && errors.password ? 'border-destructive focus-visible:ring-destructive' : touched.password && !errors.password && password ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
                      placeholder="••••••••"
                      required
                    />
                    {touched.password && password && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
                        {errors.password ? (
                          <X className="h-4 w-4 text-destructive" />
                        ) : (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {touched.password && errors.password && (
                    <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                  
                  {/* Password requirements indicator for signup */}
                  {mode === 'signUp' && showPasswordRequirements && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-2">Password strength:</p>
                      <div className="space-y-1">
                        {getPasswordRequirementsMet(password).map((req, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            {req.met ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <X className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={isLoading}
                >
                  {isLoading
                    ? 'Please wait...'
                    : mode === 'signUp'
                    ? 'Create Account'
                    : 'Sign In'}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signUp' ? 'signIn' : 'signUp');
                    setErrors({});
                    setTouched({});
                    setShowPasswordRequirements(false);
                  }}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {mode === 'signUp'
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Create one"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;