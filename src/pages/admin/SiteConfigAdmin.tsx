import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

const API_URL = import.meta.env.VITE_CF_WORKER_URL || "https://healios-api.ss-f01.workers.dev";

type ConfigMap = Record<string, string>;

const FIELD_GROUPS: { title: string; description: string; fields: { key: string; label: string; placeholder: string }[] }[] = [
  {
    title: "Social media",
    description:
      "Leave blank to hide an icon. Only full https:// URLs are accepted.",
    fields: [
      { key: "social.facebook", label: "Facebook URL", placeholder: "https://www.facebook.com/yourpage" },
      { key: "social.instagram", label: "Instagram URL", placeholder: "https://www.instagram.com/yourhandle" },
      { key: "social.tiktok", label: "TikTok URL", placeholder: "https://www.tiktok.com/@yourhandle" },
    ],
  },
  {
    title: "Trust signals",
    description:
      "Links shown on the footer alongside your social icons. Leave blank to hide.",
    fields: [
      { key: "trust.google_business", label: "Google Business URL", placeholder: "https://www.google.com/maps/place/..." },
      { key: "trust.trustpilot", label: "Trustpilot URL", placeholder: "https://www.trustpilot.com/review/yourdomain.com" },
    ],
  },
];

const validateUrl = (raw: string): string | null => {
  const v = raw.trim();
  if (v === "") return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return "Must start with http:// or https://";
    }
    return null;
  } catch {
    return "Enter a full URL including https://";
  }
};

const SiteConfigAdmin = () => {
  const [config, setConfig] = useState<ConfigMap>({});
  const [initial, setInitial] = useState<ConfigMap>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("cf_session");
        const res = await fetch(`${API_URL}/admin/site-config`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to load site config");
        const data = (await res.json()) as { config: ConfigMap };
        setConfig(data.config);
        setInitial(data.config);
      } catch (err) {
        toast.error("Failed to load site settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const dirty = Object.keys(config).some((k) => (config[k] ?? "") !== (initial[k] ?? ""));

  const onFieldChange = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: validateUrl(value) }));
  };

  const onSave = async () => {
    const next: Record<string, string | null> = {};
    for (const group of FIELD_GROUPS) {
      for (const f of group.fields) {
        next[f.key] = validateUrl(config[f.key] ?? "");
      }
    }
    setErrors(next);
    if (Object.values(next).some((e) => e !== null)) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("cf_session");
      const updates: ConfigMap = {};
      for (const key of Object.keys(config)) {
        if ((config[key] ?? "") !== (initial[key] ?? "")) {
          updates[key] = (config[key] ?? "").trim();
        }
      }
      const res = await fetch(`${API_URL}/admin/site-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const details = Array.isArray((err as { details?: unknown }).details)
          ? ((err as { details: string[] }).details).join(", ")
          : (err as { error?: string }).error ?? "Save failed";
        throw new Error(details);
      }
      const data = (await res.json()) as { config: ConfigMap };
      setConfig(data.config);
      setInitial(data.config);
      toast.success("Site settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Site Settings"
      subtitle="Control the social and trust links shown on the public site"
    >
      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-w-2xl space-y-10">
          {FIELD_GROUPS.map((group) => (
            <section key={group.title}>
              <h2 className="text-lg font-medium text-foreground">{group.title}</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{group.description}</p>
              <div className="space-y-4">
                {group.fields.map((f) => {
                  const err = errors[f.key];
                  return (
                    <div key={f.key}>
                      <Label htmlFor={f.key} className="text-sm font-light text-foreground">
                        {f.label}
                      </Label>
                      <Input
                        id={f.key}
                        type="url"
                        value={config[f.key] ?? ""}
                        onChange={(e) => onFieldChange(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        aria-invalid={!!err}
                        className={`mt-2 rounded-none ${err ? "border-destructive" : ""}`}
                      />
                      {err && (
                        <p className="text-destructive text-sm mt-1 flex items-center gap-1">
                          <span>⚠</span> {err}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="pt-4 border-t border-border flex items-center gap-3">
            <Button
              onClick={onSave}
              disabled={saving || !dirty || Object.values(errors).some((e) => !!e)}
              className="rounded-none gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save changes
                </>
              )}
            </Button>
            {!dirty && <span className="text-sm text-muted-foreground">No changes</span>}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SiteConfigAdmin;
