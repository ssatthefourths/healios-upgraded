import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";

const API_URL = import.meta.env.VITE_CF_WORKER_URL || "https://healios-api.ss-f01.workers.dev";

interface PhraseRow {
  id: number;
  phrase: string;
  product_ids: string[];
}

interface ProductLite {
  id: string;
  name: string;
}

const SearchPhrasesAdmin = () => {
  const [phrases, setPhrases] = useState<PhraseRow[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [newPhrase, setNewPhrase] = useState("");
  const [newProductIds, setNewProductIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");

  // Per-row edit state: phrase text + selected product IDs keyed by phrase id.
  const [drafts, setDrafts] = useState<Record<number, { phrase: string; productIds: Set<string> }>>({});

  const token = () => localStorage.getItem("cf_session");

  const load = async () => {
    setLoading(true);
    try {
      const [phrasesRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/admin/search-phrases`, {
          headers: token() ? { Authorization: `Bearer ${token()}` } : {},
        }),
        fetch(`${API_URL}/products?is_published=eq.true&limit=500`),
      ]);
      if (!phrasesRes.ok) throw new Error("Failed to load phrases");
      const phrasesData = (await phrasesRes.json()) as { phrases: PhraseRow[] };
      const productsData = (await productsRes.json()) as ProductLite[] | { results: ProductLite[] };
      const productsList = Array.isArray(productsData) ? productsData : productsData.results ?? [];

      setPhrases(phrasesData.phrases);
      setProducts(productsList);
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
    load();
  }, []);

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
        body: JSON.stringify({ phrase, product_ids: Array.from(newProductIds) }),
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
    </AdminLayout>
  );
};

export default SearchPhrasesAdmin;
