import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, ShieldAlert, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

type DsrRow = {
  id: string;
  email: string;
  user_id: string | null;
  request_type: 'access' | 'erasure' | 'portability';
  status: string;
  reason: string | null;
  submitted_at: number;
  verified_at: number | null;
  completed_at: number | null;
  completed_by: string | null;
  admin_notes: string | null;
};

type DsrDetail = {
  request: DsrRow;
  userData: {
    user: any;
    orders: any[];
    addresses: any[];
  } | null;
};

const statusBadge = (status: string) => {
  switch (status) {
    case 'pending_verification': return <Badge variant="outline">Pending Verification</Badge>;
    case 'verified':             return <Badge variant="default">Verified — Action Needed</Badge>;
    case 'in_progress':          return <Badge variant="secondary">In Progress</Badge>;
    case 'completed':            return <Badge variant="outline" className="text-green-700">Completed</Badge>;
    case 'rejected':             return <Badge variant="destructive">Rejected</Badge>;
    default:                     return <Badge variant="outline">{status}</Badge>;
  }
};

const typeBadge = (t: DsrRow['request_type']) => {
  const color = t === 'erasure' ? 'destructive' : 'default';
  const label = t === 'access' ? 'Access' : t === 'erasure' ? 'Erasure' : 'Portability';
  return <Badge variant={color}>{label}</Badge>;
};

const fmtDate = (unix: number | null) => unix ? new Date(unix * 1000).toLocaleString() : '—';

const DsrAdmin = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const list = useQuery({
    queryKey: ['dsr', 'list'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin/dsr`, { headers });
      if (!res.ok) throw new Error('Failed to load requests');
      const body = await res.json() as { requests: DsrRow[] };
      return body.requests;
    },
    enabled: !!token,
  });

  const detail = useQuery({
    queryKey: ['dsr', 'detail', selected],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin/dsr/${selected}`, { headers });
      if (!res.ok) throw new Error('Failed to load detail');
      return await res.json() as DsrDetail;
    },
    enabled: !!selected && !!token,
  });

  const complete = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'completed' | 'rejected' }) => {
      const res = await fetch(`${API_URL}/admin/dsr/${id}/complete`, {
        method: 'POST',
        headers: { ...(headers ?? {}), 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to close request');
      }
    },
    onSuccess: (_, vars) => {
      toast.success(`Request ${vars.action}`);
      setSelected(null);
      setNotes("");
      qc.invalidateQueries({ queryKey: ['dsr'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const rows = list.data ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light">Data-Subject Requests</h1>
            <p className="text-sm text-muted-foreground mt-1">
              GDPR Art. 15/17/20 requests. Verified ones need your attention — action within 30 days of submission.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => list.refetch()} disabled={list.isFetching}>
            {list.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>

        {list.isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
        {list.isError && <div className="flex items-center gap-2 text-sm text-destructive"><ShieldAlert className="h-4 w-4" /> Unable to load requests</div>}

        {list.isSuccess && rows.length === 0 && (
          <div className="border border-border rounded-md p-8 text-center text-sm text-muted-foreground">
            No data-subject requests yet.
          </div>
        )}

        {list.isSuccess && rows.length > 0 && (
          <div className="border border-border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(r.submitted_at)}</TableCell>
                    <TableCell className="text-sm">{r.email}</TableCell>
                    <TableCell>{typeBadge(r.request_type)}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(r.verified_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(r.id)}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setNotes(""); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request detail</DialogTitle>
            <DialogDescription>
              Review the user's data and any reason they provided before actioning.
            </DialogDescription>
          </DialogHeader>

          {detail.isLoading && <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>}

          {detail.isSuccess && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{detail.data.request.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p>{typeBadge(detail.data.request.request_type)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p>{statusBadge(detail.data.request.status)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Linked user id</p>
                  <p className="font-mono text-xs break-all">{detail.data.request.user_id ?? '—'}</p>
                </div>
              </div>

              {detail.data.request.reason && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">User's reason</p>
                  <p className="text-sm border border-border p-3 rounded bg-muted/40 whitespace-pre-wrap">{detail.data.request.reason}</p>
                </div>
              )}

              {detail.data.userData && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Data export preview</p>
                  <pre className="text-xs border border-border p-3 rounded bg-muted/40 max-h-64 overflow-auto">
                    {JSON.stringify(detail.data.userData, null, 2)}
                  </pre>
                  <p className="text-xs text-muted-foreground">
                    For access/portability requests: copy this JSON and send to the user's verified email. For erasure: clicking "Complete" will anonymise the user row and null the user_id on their orders.
                  </p>
                </div>
              )}

              {detail.data.request.status !== 'completed' && detail.data.request.status !== 'rejected' && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label htmlFor="admin-notes" className="text-xs">Admin notes (visible to internal team)</Label>
                  <Textarea
                    id="admin-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Optional internal note about how this was actioned"
                  />
                </div>
              )}

              {detail.data.request.admin_notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Previous admin notes</p>
                  <p className="text-sm border border-border p-3 rounded bg-muted/40 whitespace-pre-wrap">{detail.data.request.admin_notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {detail.data?.request.status !== 'completed' && detail.data?.request.status !== 'rejected' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => complete.mutate({ id: selected!, action: 'rejected' })}
                  disabled={complete.isPending}
                >
                  Reject
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    const confirmMsg = detail.data?.request.request_type === 'erasure'
                      ? 'This will permanently anonymise this user\'s data. Continue?'
                      : 'Mark this request as completed?';
                    if (window.confirm(confirmMsg)) {
                      complete.mutate({ id: selected!, action: 'completed' });
                    }
                  }}
                  disabled={complete.isPending}
                >
                  {complete.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Working…</> : 'Complete'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default DsrAdmin;
