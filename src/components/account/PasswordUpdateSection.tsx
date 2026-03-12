import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';

// Simple math CAPTCHA
const generateCaptcha = () => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { question: `${a} + ${b}`, answer: (a + b).toString() };
};

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-destructive' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
};

const PasswordUpdateSection = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
  }, []);

  const strength = getPasswordStrength(newPassword);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (strength.score < 2) {
      newErrors.newPassword = 'Password is too weak. Add uppercase, numbers, or symbols.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!captchaInput) {
      newErrors.captcha = 'Please complete the verification';
    } else if (captchaInput !== captcha.answer) {
      newErrors.captcha = 'Incorrect answer. Please try again.';
      refreshCaptcha();
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setCaptchaInput('');
      refreshCaptcha();
      setErrors({});
    } catch (error) {
      logger.error('Failed to update password', error);
      const message = error instanceof Error ? error.message : 'Failed to update password';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-light mb-1">Update Password</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Choose a strong password to keep your account secure.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
        {/* New Password */}
        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: '' }));
              }}
              placeholder="Enter new password"
              className={errors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <div className="flex items-center gap-2 mt-1 text-sm text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.newPassword}
            </div>
          )}

          {/* Password strength meter */}
          {newPassword && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= strength.score ? strength.color : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Password strength: <span className="font-medium">{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
              }}
              placeholder="Confirm new password"
              className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && newPassword === confirmPassword && (
            <div className="flex items-center gap-2 mt-1 text-sm text-green-600">
              <Check className="h-3.5 w-3.5" />
              Passwords match
            </div>
          )}
          {errors.confirmPassword && (
            <div className="flex items-center gap-2 mt-1 text-sm text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.confirmPassword}
            </div>
          )}
        </div>

        {/* CAPTCHA verification */}
        <div className="p-4 border rounded bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Verification</span>
          </div>
          <Label htmlFor="captcha" className="text-sm text-muted-foreground">
            What is <span className="font-mono font-semibold text-foreground">{captcha.question}</span>?
          </Label>
          <div className="flex items-center gap-2 mt-1.5">
            <Input
              id="captcha"
              type="text"
              inputMode="numeric"
              value={captchaInput}
              onChange={(e) => {
                setCaptchaInput(e.target.value);
                if (errors.captcha) setErrors(prev => ({ ...prev, captcha: '' }));
              }}
              placeholder="Your answer"
              className={`max-w-[120px] ${errors.captcha ? 'border-destructive' : ''}`}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={refreshCaptcha}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              New question
            </button>
          </div>
          {errors.captcha && (
            <div className="flex items-center gap-2 mt-1 text-sm text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.captcha}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isUpdating}>
          {isUpdating ? 'Updating Password...' : 'Update Password'}
        </Button>
      </form>
    </div>
  );
};

export default PasswordUpdateSection;
