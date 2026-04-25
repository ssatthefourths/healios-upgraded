import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, Mail, Sparkles, Megaphone, Loader2, Pencil, Info, RotateCcw } from "lucide-react";
import { EDITOR_FIELDS, type EditorField } from "./email-editor-fields";

/**
 * Monique's 17 React Email templates live in src/lib/emails/emails/<group>/.
 * This page lists them and renders any one full-screen as a live HTML preview.
 *
 * Rendering strategy: we import the TSX component directly, call React-Email's
 * render() on the client, then put the resulting HTML inside a sandboxed iframe.
 * This matches exactly what the Worker produces in production.
 *
 * Phase 8a: preview-only. Phase 8b will add the visual editor, dynamic-data
 * binding, send-test, and Resend tracking.
 */

// Lazy-import the React-Email render function so the admin-only code path
// doesn't bloat the rest of the app bundle.
const loadRender = () => import('@react-email/render').then((m) => m.render);

type TemplateMeta = {
  id: string;
  group: 'transactional' | 'lifecycle' | 'campaign';
  title: string;
  description: string;
};

const TEMPLATES: TemplateMeta[] = [
  // Transactional
  { id: '01-order-confirmation',     group: 'transactional', title: 'Order confirmation',     description: 'Sent right after a successful Stripe payment. Currently wired to live orders.' },
  { id: '02-shipping-confirmation',  group: 'transactional', title: 'Shipping confirmation',  description: 'Sent when an order is marked "shipped".' },
  { id: '03-delivery-confirmation',  group: 'transactional', title: 'Delivery confirmation',  description: 'Sent when the order status flips to "delivered".' },
  { id: '04-password-reset',         group: 'transactional', title: 'Password reset',         description: 'One-time reset link for account recovery.' },
  { id: '05-account-created',        group: 'transactional', title: 'Account created',        description: 'First-touch welcome after the user finishes registration.' },
  { id: '06-subscription-reminder',  group: 'transactional', title: 'Subscription reminder',  description: 'Sent N days before the next subscription renewal.' },
  // Lifecycle
  { id: '07-welcome-1',              group: 'lifecycle',     title: 'Welcome 1',              description: 'Day 1 of the welcome sequence — brand story.' },
  { id: '08-welcome-2',              group: 'lifecycle',     title: 'Welcome 2',              description: 'Day 3 — product education.' },
  { id: '09-welcome-3',              group: 'lifecycle',     title: 'Welcome 3',              description: 'Day 7 — first-purchase discount offer.' },
  { id: '10-abandoned-cart',         group: 'lifecycle',     title: 'Abandoned cart',         description: 'Sent 24 hours after cart abandonment.' },
  { id: '11-post-purchase',          group: 'lifecycle',     title: 'Post-purchase',          description: 'Sent 14 days after delivery — review request + related products.' },
  { id: '12-winback',                group: 'lifecycle',     title: 'Win-back',               description: 'Sent to users who haven\'t purchased in 90+ days.' },
  // Campaign
  { id: '13-product-launch',         group: 'campaign',      title: 'Product launch',         description: 'Announce a new product to the full list.' },
  { id: '14-wellness-drive',         group: 'campaign',      title: 'Wellness Drive',         description: 'Editorial campaign email for the Wellness Drive programme.' },
  { id: '15-restock',                group: 'campaign',      title: 'Restock',                description: 'Back-in-stock announcement.' },
  { id: '16-promo',                  group: 'campaign',      title: 'Promo / discount',       description: 'Time-limited offer with promo code.' },
  { id: '17-bundle',                 group: 'campaign',      title: 'Bundle launch',          description: 'Announce a new bundle stack.' },
];

const GROUP_INFO: Record<TemplateMeta['group'], { label: string; icon: typeof Mail; color: string }> = {
  transactional: { label: 'Transactional', icon: Mail,      color: 'text-blue-600' },
  lifecycle:     { label: 'Lifecycle',     icon: Sparkles,  color: 'text-purple-600' },
  campaign:      { label: 'Campaign',      icon: Megaphone, color: 'text-amber-600' },
};

// Dynamic imports for each template — matches the Worker's import list but
// lazily-loaded so the admin bundle stays lean.
const TEMPLATE_IMPORTS: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {
  '01-order-confirmation':    () => import('@/lib/emails/emails/transactional/01-order-confirmation'),
  '02-shipping-confirmation': () => import('@/lib/emails/emails/transactional/02-shipping-confirmation'),
  '03-delivery-confirmation': () => import('@/lib/emails/emails/transactional/03-delivery-confirmation'),
  '04-password-reset':        () => import('@/lib/emails/emails/transactional/04-password-reset'),
  '05-account-created':       () => import('@/lib/emails/emails/transactional/05-account-created'),
  '06-subscription-reminder': () => import('@/lib/emails/emails/transactional/06-subscription-reminder'),
  '07-welcome-1':             () => import('@/lib/emails/emails/lifecycle/07-welcome-1'),
  '08-welcome-2':             () => import('@/lib/emails/emails/lifecycle/08-welcome-2'),
  '09-welcome-3':             () => import('@/lib/emails/emails/lifecycle/09-welcome-3'),
  '10-abandoned-cart':        () => import('@/lib/emails/emails/lifecycle/10-abandoned-cart'),
  '11-post-purchase':         () => import('@/lib/emails/emails/lifecycle/11-post-purchase'),
  '12-winback':               () => import('@/lib/emails/emails/lifecycle/12-winback'),
  '13-product-launch':        () => import('@/lib/emails/emails/campaign/13-product-launch'),
  '14-wellness-drive':        () => import('@/lib/emails/emails/campaign/14-wellness-drive'),
  '15-restock':               () => import('@/lib/emails/emails/campaign/15-restock'),
  '16-promo':                 () => import('@/lib/emails/emails/campaign/16-promo'),
  '17-bundle':                () => import('@/lib/emails/emails/campaign/17-bundle'),
};

/**
 * Renders a template to HTML inside a sandboxed iframe.
 * Re-renders when `propsKey` changes — used to debounce rapid edits.
 */
const PreviewFrame = ({ id, propsValues }: { id: string; propsValues: Record<string, string> }) => {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Debounce: collapse rapid edits into one render. 250ms feels live without
  // hammering @react-email/render on every keystroke.
  const propsKey = useMemo(() => JSON.stringify(propsValues), [propsValues]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      (async () => {
        try {
          setError(null);
          const [render, mod, React] = await Promise.all([
            loadRender(),
            TEMPLATE_IMPORTS[id](),
            import('react'),
          ]);
          if (cancelled) return;
          const Component = mod.default;
          // Filter out empty strings so the template falls back to its own
          // defaults instead of rendering "" (e.g. an empty hero headline).
          const cleanedProps: Record<string, any> = {};
          for (const [k, v] of Object.entries(propsValues)) {
            if (v !== undefined && v !== '') cleanedProps[k] = v;
          }
          const rendered = await render(React.createElement(Component, cleanedProps));
          if (!cancelled) setHtml(rendered);
        } catch (err: any) {
          if (!cancelled) setError(err?.message ?? 'Failed to render');
        }
      })();
    }, html === null ? 0 : 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id, propsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/40 text-sm text-destructive">
        {error}
      </div>
    );
  }
  if (!html) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <iframe
      title={`Preview: ${id}`}
      srcDoc={html}
      className="h-full w-full border-0 bg-white"
      sandbox="allow-same-origin"
    />
  );
};

/**
 * Side panel with the editable fields for the active template.
 * Surfaces the props from EDITOR_FIELDS — no persistence yet (Phase 8b.3).
 */
const EditorPanel = ({
  fields,
  values,
  onChange,
  onReset,
}: {
  fields: EditorField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
}) => {
  if (fields.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No editable fields exposed for this template yet. Add them to{' '}
        <code className="text-xs">src/pages/admin/email-editor-fields.ts</code>.
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Edit fields</p>
          <p className="text-[11px] text-muted-foreground">
            Preview-only — saving is coming in 8b.3.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onReset} title="Reset all to defaults">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <TooltipProvider delayDuration={300}>
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor={`edit-${f.key}`} className="text-xs">
                  {f.label}
                </Label>
                {f.hint && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-xs">{f.hint}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              {f.type === 'textarea' ? (
                <Textarea
                  id={`edit-${f.key}`}
                  value={values[f.key] ?? ''}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  className="text-xs min-h-[80px]"
                  placeholder={f.defaultValue}
                />
              ) : (
                <Input
                  id={`edit-${f.key}`}
                  type={f.type === 'url' ? 'url' : 'text'}
                  value={values[f.key] ?? ''}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  className="text-xs"
                  placeholder={f.defaultValue}
                />
              )}
            </div>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
};

const EmailsAdmin = () => {
  const [open, setOpen] = useState<string | null>(null);
  // Phase 8b.1: per-template prop edits, in-memory only. Resets when the
  // dialog closes so each session starts fresh from template defaults.
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const activeFields = useMemo(() => (open ? EDITOR_FIELDS[open] ?? [] : []), [open]);

  // When a template opens, seed the editor with its declared defaults so
  // Monique sees the values she'd be tweaking (rather than empty inputs).
  useEffect(() => {
    if (!open) {
      setEditValues({});
      setEditMode(false);
      return;
    }
    const seed: Record<string, string> = {};
    for (const f of activeFields) {
      if (f.defaultValue !== undefined) seed[f.key] = f.defaultValue;
    }
    setEditValues(seed);
  }, [open, activeFields]);

  const resetEdits = () => {
    const seed: Record<string, string> = {};
    for (const f of activeFields) {
      if (f.defaultValue !== undefined) seed[f.key] = f.defaultValue;
    }
    setEditValues(seed);
  };

  const groups: TemplateMeta['group'][] = ['transactional', 'lifecycle', 'campaign'];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-light">Email templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monique's React Email designs — the same HTML that lands in customer inboxes.
            Click Preview to see any template full-screen. The order-confirmation template
            is already wired to real orders; others will be wired as their triggers go live.
          </p>
        </div>

        {groups.map((g) => {
          const info = GROUP_INFO[g];
          const Icon = info.icon;
          const inGroup = TEMPLATES.filter((t) => t.group === g);
          return (
            <section key={g} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${info.color}`} />
                <h2 className="text-sm font-medium">{info.label}</h2>
                <Badge variant="outline" className="text-xs">{inGroup.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inGroup.map((t) => (
                  <div key={t.id} className="border border-border rounded-md p-4 flex flex-col gap-3">
                    <div>
                      <p className="text-xs font-mono text-muted-foreground">{t.id}</p>
                      <p className="text-sm font-medium mt-1">{t.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      {t.id === '01-order-confirmation' ? (
                        <Badge variant="default" className="text-xs">Live</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Preview only</Badge>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setOpen(t.id)}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Preview
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => { if (!o) setOpen(null); }}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-4 border-b border-border flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <DialogTitle className="text-sm font-mono">{open}</DialogTitle>
              <DialogDescription className="text-xs">
                Live render — identical to what the Worker sends.
                {editMode && activeFields.length > 0 && (
                  <span className="ml-2 text-amber-600">Edit mode: changes are preview-only.</span>
                )}
              </DialogDescription>
            </div>
            <Button
              size="sm"
              variant={editMode ? 'default' : 'outline'}
              onClick={() => setEditMode(!editMode)}
              disabled={activeFields.length === 0}
              title={activeFields.length === 0 ? 'No editable fields configured' : 'Toggle edit mode'}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              {editMode ? 'Exit edit mode' : 'Edit'}
            </Button>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex">
            <div className={editMode ? 'flex-1' : 'w-full'}>
              <Suspense fallback={<div className="p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>}>
                {open && <PreviewFrame id={open} propsValues={editValues} />}
              </Suspense>
            </div>
            {editMode && activeFields.length > 0 && (
              <div className="w-80 border-l border-border bg-background flex-shrink-0">
                <EditorPanel
                  fields={activeFields}
                  values={editValues}
                  onChange={(key, value) => setEditValues((prev) => ({ ...prev, [key]: value }))}
                  onReset={resetEdits}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default EmailsAdmin;
