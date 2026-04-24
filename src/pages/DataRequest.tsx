import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

type RequestType = 'access' | 'erasure' | 'portability';

const TYPE_INFO: Record<RequestType, { label: string; blurb: string }> = {
  access: {
    label: 'Access my data',
    blurb: 'Receive a copy of the personal data we hold about you (GDPR Art. 15).',
  },
  portability: {
    label: 'Export my data',
    blurb: 'Receive your data in a structured, machine-readable format (GDPR Art. 20).',
  },
  erasure: {
    label: 'Erase my data',
    blurb: 'Remove your personal data from our systems (GDPR Art. 17 / "Right to be Forgotten"). Orders are retained for legally-required tax records, but your account will be anonymised.',
  },
};

const DataRequest = () => {
  const [params] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'loading' | 'ok' | 'already' | 'expired' | 'invalid'>('idle');

  // Form state
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState<RequestType>('access');
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Verify flow: /privacy/request/verify?token=...
  const verifyToken = params.get('token');
  useEffect(() => {
    if (!verifyToken) return;
    setVerifyStatus('loading');
    (async () => {
      try {
        const res = await fetch(`${API_URL}/dsr/verify/${encodeURIComponent(verifyToken)}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.already_verified) setVerifyStatus('already');
        else if (res.ok) setVerifyStatus('ok');
        else if (res.status === 410) setVerifyStatus('expired');
        else setVerifyStatus('invalid');
      } catch {
        setVerifyStatus('invalid');
      }
    })();
  }, [verifyToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Email is required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/dsr/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), request_type: requestType, reason: reason.trim() || undefined }),
      });
      if (res.status === 429) {
        toast.error('Too many requests. Please wait 24 hours before submitting again.');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to submit request');
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Unable to submit request');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify view ──────────────────────────────────────────────────────────
  if (verifyToken) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Confirm Data Request — Healios" description="Confirm your data request." canonicalUrl="https://www.thehealios.com/privacy/request/verify" />
        <Header />
        <main>
          <PageContainer className="py-16 max-w-xl">
            <div className="text-center space-y-4">
              {verifyStatus === 'loading' && (
                <>
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Confirming your request…</p>
                </>
              )}
              {verifyStatus === 'ok' && (
                <>
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
                  <h1 className="text-2xl font-light">Request confirmed</h1>
                  <p className="text-sm text-muted-foreground">
                    Thanks — your data request is now with our team. We'll action it within 30 days per GDPR requirements and contact you at your verified email address with the outcome.
                  </p>
                </>
              )}
              {verifyStatus === 'already' && (
                <>
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
                  <h1 className="text-2xl font-light">Already confirmed</h1>
                  <p className="text-sm text-muted-foreground">This request is already in our queue. No further action needed.</p>
                </>
              )}
              {verifyStatus === 'expired' && (
                <>
                  <AlertCircle className="h-12 w-12 mx-auto text-amber-600" />
                  <h1 className="text-2xl font-light">Link expired</h1>
                  <p className="text-sm text-muted-foreground">
                    Confirmation links are valid for 48 hours. Please submit a new request.
                  </p>
                  <Link to="/privacy/request" className="inline-block text-sm underline">Submit a new request →</Link>
                </>
              )}
              {verifyStatus === 'invalid' && (
                <>
                  <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                  <h1 className="text-2xl font-light">Invalid link</h1>
                  <p className="text-sm text-muted-foreground">
                    We couldn't match this confirmation link. It may have already been used, or the link may be corrupted.
                  </p>
                  <Link to="/privacy/request" className="inline-block text-sm underline">Submit a new request →</Link>
                </>
              )}
            </div>
          </PageContainer>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Submitted view ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Data Request Submitted — Healios" description="Your data request has been submitted." canonicalUrl="https://www.thehealios.com/privacy/request" />
        <Header />
        <main>
          <PageContainer className="py-16 max-w-xl">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
              <h1 className="text-2xl font-light">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                We've sent a confirmation link to <strong>{email}</strong>. Click the link in that email to confirm the request. The link expires in 48 hours.
              </p>
              <p className="text-xs text-muted-foreground">
                If you don't see the email, check your spam folder. We'll only action requests that are confirmed this way.
              </p>
            </div>
          </PageContainer>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Form view ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Data Request — Healios"
        description="Exercise your GDPR data rights: access, export, or erase your personal data."
        canonicalUrl="https://www.thehealios.com/privacy/request"
      />
      <Header />
      <main>
        <PageContainer className="py-12 max-w-2xl">
          <div className="space-y-2 mb-8">
            <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Privacy</p>
            <h1 className="text-3xl md:text-4xl font-light">Your data, your choice</h1>
            <p className="text-sm text-muted-foreground">
              Under UK GDPR and the Data Protection Act 2018 you have the right to access, export, or erase the personal data we hold about you. Submit the form below and we'll send a confirmation link to your email. Requests are actioned within 30 days.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <p className="text-xs text-muted-foreground">
                Must match the email you use with us, so we can verify who you are.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Request type</Label>
              <RadioGroup
                value={requestType}
                onValueChange={(v) => setRequestType(v as RequestType)}
                className="space-y-3"
              >
                {(Object.keys(TYPE_INFO) as RequestType[]).map((key) => (
                  <label
                    key={key}
                    htmlFor={`rt-${key}`}
                    className="flex items-start gap-3 border border-border p-4 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <RadioGroupItem value={key} id={`rt-${key}`} className="mt-1" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{TYPE_INFO[key].label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{TYPE_INFO[key].blurb}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Additional context (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us anything that would help us action your request (e.g. order numbers, specific date ranges)."
                rows={4}
                maxLength={2000}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting…</> : 'Submit request'}
            </Button>
          </form>

          <div className="mt-12 pt-8 border-t border-border text-xs text-muted-foreground space-y-2">
            <p>
              For more information on how we handle your data, see our{' '}
              <Link to="/privacy-policy" className="underline hover:no-underline">Privacy Policy</Link>.
            </p>
            <p>
              If you're not satisfied with our response, you can complain to the UK Information Commissioner's Office at{' '}
              <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">ico.org.uk</a>.
            </p>
          </div>
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
};

export default DataRequest;
