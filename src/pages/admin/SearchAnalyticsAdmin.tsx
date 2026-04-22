import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X, Search as SearchIcon, TrendingUp, AlertTriangle, MousePointerClick } from "lucide-react";

const API_URL = import.meta.env.VITE_CF_WORKER_URL || "https://healios-api.ss-f01.workers.dev";

interface TopQuery { query: string; count: number; avg_results: number; clicks: number }
interface ZeroQuery { query: string; count: number }
interface DailyPoint { day: string; count: number }
interface Totals { searches: number; clicks: number; zero_result: number }
interface AnalyticsPayload {
  range_days: number;
  totals: Totals;
  top_queries: TopQuery[];
  zero_result_queries: ZeroQuery[];
  daily: DailyPoint[];
}

interface ConfigRow { id: number; name: string; is_active: number }
interface ProductLite { id: string; name: string }

const SearchAnalyticsAdmin = () => {
  const [range, setRange] = useState("30");
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [drawerProductIds, setDrawerProductIds] = useState<Set<string>>(new Set());
  const [drawerConfigId, setDrawerConfigId] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem("cf_session");

  const load = async () => {
    setLoading(true);
    try {
      const [analyticsRes, productsRes, configsRes] = await Promise.all([
        fetch(`${API_URL}/admin/search-analytics?range=${range}d`, {
          headers: token() ? { Authorization: `Bearer ${token()}` } : {},
        }),
        fetch(`${API_URL}/products?is_published=eq.true&limit=500`),
        fetch(`${API_URL}/admin/search-configs`, {
          headers: token() ? { Authorization: `Bearer ${token()}` } : {},
        }),
      ]);
      if (!analyticsRes.ok) throw new Error("Analytics load failed");
      const analytics = (await analyticsRes.json()) as AnalyticsPayload;
      setData(analytics);

      const productsData = (await productsRes.json()) as ProductLite[] | { results: ProductLite[] };
      setProducts(Array.isArray(productsData) ? productsData : productsData.results ?? []);

      if (configsRes.ok) {
        const c = (await configsRes.json()) as { configs: ConfigRow[] };
        setConfigs(c.configs);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [range]);

  const toggleRow = (q: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(q)) n.delete(q); else n.add(q);
      return n;
    });
  };

  const toggleProduct = (pid: string) => {
    setDrawerProductIds((prev) => {
      const n = new Set(prev);
      if (n.has(pid)) n.delete(pid); else n.add(pid);
      return n;
    });
  };

  const openDrawer = () => {
    if (selected.size === 0) return;
    setDrawerProductIds(new Set());
    setDrawerConfigId(1);
    setDrawerOpen(true);
  };

  const saveDrawer = async () => {
    if (drawerProductIds.size === 0) {
      toast.error("Pick at least one product");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/search-phrases/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        },
        body: JSON.stringify({
          phrases: Array.from(selected),
          product_ids: Array.from(drawerProductIds),
          config_id: drawerConfigId,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Save failed");
      }
      toast.success(`${selected.size} phrase${selected.size === 1 ? "" : "s"} mapped`);
      setDrawerOpen(false);
      setSelected(new Set());
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const sparkMax = useMemo(() => {
    if (!data?.daily || data.daily.length === 0) return 1;
    return Math.max(...data.daily.map((d) => d.count), 1);
  }, [data]);

  return (
    <AdminLayout
      title="Search Analytics"
      subtitle="What customers are typing, which queries convert, which queries return nothing."
    >
      <div className="space-y-8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[140px] rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">
                {selected.size} selected
              </span>
              <Button variant="ghost" onClick={() => setSelected(new Set())} className="rounded-none gap-2">
                <X className="h-4 w-4" /> Clear
              </Button>
              <Button onClick={openDrawer} className="rounded-none">
                Map to products
              </Button>
            </div>
          )}
        </div>

        {loading || !data ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-border p-4 flex items-center gap-3">
                <SearchIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Searches</p>
                  <p className="text-xl font-light">{data.totals.searches.toLocaleString()}</p>
                </div>
              </div>
              <div className="border border-border p-4 flex items-center gap-3">
                <MousePointerClick className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Clicks</p>
                  <p className="text-xl font-light">
                    {data.totals.clicks.toLocaleString()}
                    {data.totals.searches > 0 && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({Math.round((data.totals.clicks / data.totals.searches) * 100)}% CTR)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="border border-border p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Zero-result</p>
                  <p className="text-xl font-light">{data.totals.zero_result.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Daily sparkline */}
            {data.daily.length > 0 && (
              <section className="border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-foreground">Searches per day</h2>
                </div>
                <div className="flex items-end gap-1 h-20">
                  {data.daily.map((d) => (
                    <div key={d.day} className="flex-1 group relative">
                      <div
                        className="bg-foreground/80 hover:bg-foreground transition-colors"
                        style={{ height: `${(d.count / sparkMax) * 100}%`, minHeight: "2px" }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 bg-background border border-border px-2 py-0.5 whitespace-nowrap pointer-events-none">
                        {d.day}: {d.count}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Two-column: top queries + zero-result */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top queries */}
              <section>
                <h2 className="text-lg font-medium text-foreground mb-3">Top queries</h2>
                <div className="border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="w-8 p-3" />
                        <th className="p-3 text-left font-medium">Query</th>
                        <th className="p-3 text-right font-medium w-16">#</th>
                        <th className="p-3 text-right font-medium w-16">CTR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_queries.length === 0 && (
                        <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No searches yet.</td></tr>
                      )}
                      {data.top_queries.map((q) => {
                        const ctr = q.count > 0 ? Math.round((q.clicks / q.count) * 100) : 0;
                        return (
                          <tr key={q.query} className="border-b border-border last:border-0 hover:bg-muted/10">
                            <td className="p-3">
                              <Checkbox
                                checked={selected.has(q.query)}
                                onCheckedChange={() => toggleRow(q.query)}
                              />
                            </td>
                            <td className="p-3 font-light">{q.query}</td>
                            <td className="p-3 text-right font-light">{q.count}</td>
                            <td className="p-3 text-right font-light">
                              <span className={ctr === 0 ? "text-amber-600" : ""}>{ctr}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Zero-result queries */}
              <section>
                <h2 className="text-lg font-medium text-foreground mb-3">
                  Zero-result queries <span className="text-sm text-muted-foreground font-light">(curation goldmine)</span>
                </h2>
                <div className="border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="w-8 p-3" />
                        <th className="p-3 text-left font-medium">Query</th>
                        <th className="p-3 text-right font-medium w-16">#</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.zero_result_queries.length === 0 && (
                        <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No zero-result queries. Nice.</td></tr>
                      )}
                      {data.zero_result_queries.map((q) => (
                        <tr key={q.query} className="border-b border-border last:border-0 hover:bg-muted/10">
                          <td className="p-3">
                            <Checkbox
                              checked={selected.has(q.query)}
                              onCheckedChange={() => toggleRow(q.query)}
                            />
                          </td>
                          <td className="p-3 font-light">{q.query}</td>
                          <td className="p-3 text-right font-light">{q.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </>
        )}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setDrawerOpen(false)}>
          <div
            className="bg-background border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Map {selected.size} quer{selected.size === 1 ? "y" : "ies"} to products</h3>
                <p className="text-sm text-muted-foreground mt-1">Every selected query becomes a phrase that points at every ticked product.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)} className="rounded-none" aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 border-b border-border bg-muted/20">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Selected queries</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(selected).map((q) => (
                  <span key={q} className="inline-flex items-center gap-1 text-xs bg-background border border-border px-2 py-1">
                    {q}
                    <button onClick={() => toggleRow(q)} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${q}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 border-b border-border">
              <label className="block text-sm font-light mb-2">Save into configuration</label>
              <Select value={String(drawerConfigId)} onValueChange={(v) => setDrawerConfigId(parseInt(v, 10))}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {configs.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} {c.is_active ? "" : "(inactive)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <p className="text-sm font-light mb-2">Pick every product that each of these queries should surface.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm font-light cursor-pointer">
                    <Checkbox
                      checked={drawerProductIds.has(p.id)}
                      onCheckedChange={() => toggleProduct(p.id)}
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-border flex items-center gap-2 justify-end">
              <Button variant="ghost" onClick={() => setDrawerOpen(false)} className="rounded-none">Cancel</Button>
              <Button onClick={saveDrawer} disabled={saving || drawerProductIds.size === 0} className="rounded-none">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save {selected.size} phrase{selected.size === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SearchAnalyticsAdmin;
