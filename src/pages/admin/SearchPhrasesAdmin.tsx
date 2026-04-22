import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, Save, X, Settings2, Power, PowerOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_URL = import.meta.env.VITE_CF_WORKER_URL || "https://healios-api.ss-f01.workers.dev";

interface PhraseRow {
  id: number;
  phrase: string;
  config_id: number;
  product_ids: string[];
}

interface ConfigRow {
  id: number;
  name: string;
  description: string | null;
  is_active: number;
  phrase_count: number;
}

interface ProductLite {
  id: string;
  name: string;
}

const SearchPhrasesAdmin = () => {
  const [phrases, setPhrases] = useState<PhraseRow[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [newPhrase, setNewPhrase] = useState("");
  const [newProductIds, setNewProductIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");

  // Configs modal state
  const [configsModalOpen, setConfigsModalOpen] = useState(false);
  const [newConfigName, setNewConfigName] = useState("");
  const [newConfigDesc, setNewConfigDesc] = useState("");
  const [creatingConfig, setCreatingConfig] = useState(false);

  // Per-row edit state: phrase text + selected product IDs keyed by phrase id.
  const [drafts, setDrafts] = useState<Record<number, { phrase: string; productIds: Set<string> }>>({});

  const token = () => localStorage.getItem("cf_session");

  const load = async (configId: number = activeConfigId) => {
    setLoading(true);
    try {
      const [phrasesRes, productsRes, configsRes] = await Promise.all([
        fetch(`${API_URL}/admin/search-phrases?config_id=${configId}`, {
          headers: token() ? { Authorization: `Bearer ${token()}` } : {},
        }),
        fetch(`${API_URL}/products?is_published=eq.true&limit=500`),
        fetch(`${API_URL}/admin/search-configs`, {
          headers: token() ? { Authorization: `Bearer ${token()}` } : {},
        }),
      ]);
      if (!phrasesRes.ok) throw new Error("Failed to load phrases");
      const phrasesData = (await phrasesRes.json()) as { phrases: PhraseRow[] };
      const productsData = (await productsRes.json()) as ProductLite[] | { results: ProductLite[] };
      const productsList = Array.isArray(productsData) ? productsData : productsData.results ?? [];

      setPhrases(phrasesData.phrases);
      setProducts(productsList);
      if (configsRes.ok) {
        const c = (await configsRes.json()) as { configs: ConfigRow[] };
        setConfigs(c.configs);
      }

      // Reset drafts to the server state.
      const d: Record<number, { phrase: string; productIds: Set<string> }> = {};
      for (const p of phrasesData.phrases) {
        d[p.id] = { phrase: p.phrase, productIds: new Set(p.product_ids) };
      }
      setDrafts(d);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeConfigId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConfigId]);

  const productNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of products) m.set(p.id, p.name);
    return m;
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return phrases;
    return phrases.filter(
      (p) =>
        p.phrase.toLowerCase().includes(q) ||
        p.product_ids.some((pid) => productNameById.get(pid)?.toLowerCase().includes(q)),
    );
  }, [phrases, query, productNameById]);

  const create = async () => {
    const phrase = newPhrase.trim().toLowerCase();
    if (!phrase) {
      toast.error("Enter a phrase");
      return;
    }
    if (newProductIds.size === 0) {
      toast.error("Tick at least one product");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/admin/search-phrases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        },
        body: JSON.stringify({ phrase, product_ids: Array.from(newProductIds), config_id: activeConfigId }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Create failed");
      }
      toast.success("Phrase added");
      setNewPhrase("");
      setNewProductIds(new Set());
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const save = async (id: number) => {
    const draft = drafts[id];
    if (!draft) return;
    const phrase = draft.phrase.trim().toLowerCase();
    if (!phrase) {
      toast.error("Phrase cannot be empty");
      return;
    }
    setSavingId(id);
    try {
      const res = await fetch(`${API_URL}/admin/search-phrases/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        },
        body: JSON.stringify({ phrase, product_ids: Array.from(draft.productIds) }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Save failed");
      }
      toast.success("Saved");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: number, phrase: string) => {
    if (!confirm(`Delete phrase "${phrase}"?`)) return;
    setSavingId(id);
    try {
      const res = await fetch(`${API_URL}/admin/search-phrases/${id}`, {
        method: "DELETE",
        headers: token() ? { Authorization: `Bearer ${token()}` } : {},
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSavingId(null);
    }
  };

  // ── Config management ────────────────────────────────────────────────
  const createConfig = async () => {
    const name = newConfigName.trim();
    if (!name) { toast.error("Enter a name"); return; }
    setCreatingConfig(true);
    try {
      const res = await fetch(`${API_URL}/admin/search-configs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        },
        body: JSON.stringify({ name, description: newConfigDesc.trim() || undefined }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Create failed");
      }
      toast.success(`Configuration "${name}" created`);
      setNewConfigName("");
      setNewConfigDesc("");
      await load(activeConfigId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreatingConfig(false);
    }
  };

  const toggleConfigActive = async (c: ConfigRow) => {
    try {
      const res = await fetch(`${API_URL}/admin/search-configs/${c.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        },
        body: JSON.stringify({ is_active: c.is_active ? 0 : 1 }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      toast.success(`"${c.name}" ${c.is_active ? "deactivated" : "activated"}`);
      await load(activeConfigId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Toggle failed");
    }
  };

  const deleteConfig = async (c: ConfigRow) => {
    if (c.id === 1) { toast.error("Cannot delete the default config"); return; }
    if (!confirm(`Delete "${c.name}"? Phrases inside it will move to "Always on".`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/search-configs/${c.id}`, {
        method: "DELETE",
        headers: token() ? { Authorization: `Bearer ${token()}` } : {},
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Deleted");
      if (activeConfigId === c.id) setActiveConfigId(1);
      else await load(activeConfigId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const toggleDraftProduct = (phraseId: number, productId: string) => {
    setDrafts((prev) => {
      const cur = prev[phraseId] ?? { phrase: "", productIds: new Set<string>() };
      const next = new Set(cur.productIds);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return { ...prev, [phraseId]: { ...cur, productIds: next } };
    });
  };

  const toggleNewProduct = (productId: string) => {
    setNewProductIds((prev) => {
      const n = new Set(prev);
      if (n.has(productId)) n.delete(productId);
      else n.add(productId);
      return n;
    });
  };

  return (
    <AdminLayout
      title="Search Phrases"
      subtitle="Map plain-language phrases to products. Typing one in the header search surfaces the mapped products, ranked by relevance."
    >
      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-10">
          {/* Config selector */}
          <section className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
            <Label className="text-sm font-light text-muted-foreground">Configuration</Label>
            <Select value={String(activeConfigId)} onValueChange={(v) => setActiveConfigId(parseInt(v, 10))}>
              <SelectTrigger className="w-[260px] rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {configs.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({c.phrase_count}) {c.is_active ? "· live" : "· paused"}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfigsModalOpen(true)}
              className="rounded-none gap-2"
            >
              <Settings2 className="h-4 w-4" />
              Manage
            </Button>
            <p className="text-xs text-muted-foreground ml-auto max-w-sm">
              Phrases you add or edit here belong to the selected configuration. Deactivate a config to stop its phrases from contributing to search.
            </p>
          </section>

          {/* Create new phrase */}
          <section className="border border-border p-6 space-y-4">
            <h2 className="text-lg font-medium text-foreground">Add a phrase</h2>
            <p className="text-sm text-muted-foreground">
              Think symptom, goal, or life situation — &ldquo;trouble sleeping&rdquo;, &ldquo;pms&rdquo;,
              &ldquo;gym recovery&rdquo;. Tick every product that legitimately helps.
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="new-phrase" className="text-sm font-light">Phrase</Label>
                <Input
                  id="new-phrase"
                  placeholder="e.g. can't switch off at night"
                  value={newPhrase}
                  onChange={(e) => setNewPhrase(e.target.value)}
                  className="mt-2 rounded-none"
                />
              </div>
              <div>
                <Label className="text-sm font-light">Maps to products</Label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {products.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm font-light cursor-pointer">
                      <Checkbox
                        checked={newProductIds.has(p.id)}
                        onCheckedChange={() => toggleNewProduct(p.id)}
                      />
                      <span>{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={create} disabled={creating} className="rounded-none gap-2">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add phrase
                </Button>
                {newProductIds.size > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setNewPhrase("");
                      setNewProductIds(new Set());
                    }}
                    className="rounded-none gap-2"
                  >
                    <X className="h-4 w-4" /> Clear
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* List + filter existing */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">
                Existing phrases <span className="text-sm text-muted-foreground font-light">({phrases.length})</span>
              </h2>
              <Input
                placeholder="Filter phrases or products"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="max-w-sm rounded-none"
              />
            </div>

            <div className="space-y-3">
              {filtered.map((row) => {
                const draft = drafts[row.id] ?? { phrase: row.phrase, productIds: new Set(row.product_ids) };
                const changed =
                  draft.phrase !== row.phrase ||
                  draft.productIds.size !== row.product_ids.length ||
                  row.product_ids.some((pid) => !draft.productIds.has(pid));
                return (
                  <div key={row.id} className="border border-border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={draft.phrase}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.id]: { ...(prev[row.id] ?? { productIds: new Set() }), phrase: e.target.value },
                          }))
                        }
                        className="rounded-none"
                      />
                      <Button
                        onClick={() => save(row.id)}
                        disabled={!changed || savingId === row.id}
                        className="rounded-none gap-2"
                        size="sm"
                      >
                        {savingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => remove(row.id, row.phrase)}
                        disabled={savingId === row.id}
                        className="rounded-none"
                        size="sm"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {products.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 text-sm font-light cursor-pointer">
                          <Checkbox
                            checked={draft.productIds.has(p.id)}
                            onCheckedChange={() => toggleDraftProduct(row.id, p.id)}
                          />
                          <span>{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {phrases.length === 0 ? "No phrases yet. Add one above." : "No phrases match your filter."}
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Configurations modal */}
      {configsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={() => setConfigsModalOpen(false)}
        >
          <div
            className="bg-background border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Configurations</h3>
                <p className="text-sm text-muted-foreground mt-1">Group phrases into named sets you can toggle on or off without a deploy.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setConfigsModalOpen(false)} className="rounded-none" aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 border-b border-border space-y-2">
              <Label className="text-sm font-light">New configuration</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="e.g. January Reset"
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  className="rounded-none"
                />
                <Input
                  placeholder="Short description (optional)"
                  value={newConfigDesc}
                  onChange={(e) => setNewConfigDesc(e.target.value)}
                  className="rounded-none"
                />
                <Button onClick={createConfig} disabled={creatingConfig} className="rounded-none gap-2">
                  {creatingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="p-3 text-left font-medium">Name</th>
                    <th className="p-3 text-right font-medium w-20">Phrases</th>
                    <th className="p-3 text-right font-medium w-24">Status</th>
                    <th className="p-3 text-right font-medium w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="p-3">
                        <p className="font-light">{c.name}</p>
                        {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                      </td>
                      <td className="p-3 text-right font-light">{c.phrase_count}</td>
                      <td className="p-3 text-right">
                        <span className={`text-xs ${c.is_active ? "text-green-700" : "text-muted-foreground"}`}>
                          {c.is_active ? "live" : "paused"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleConfigActive(c)}
                            className="rounded-none gap-1"
                            aria-label={c.is_active ? "Deactivate" : "Activate"}
                          >
                            {c.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteConfig(c)}
                            disabled={c.id === 1}
                            className="rounded-none"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {configs.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No configurations yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SearchPhrasesAdmin;
