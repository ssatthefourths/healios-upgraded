import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Users, 
  Shield, 
  Search, 
  RefreshCw, 
  Mail, 
  Trash2, 
  UserPlus, 
  ShieldPlus,
  ShieldMinus,
  Key,
  History,
  Loader2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  roles: string[];
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_user_id: string | null;
  target_email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const callAdminApi = async (action: string, data: Record<string, unknown> = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const response = await supabase.functions.invoke("admin-user-management", {
    body: { action, ...data },
  });

  if (response.error) throw new Error(response.error.message);
  if (response.data?.error) throw new Error(response.data.error);
  
  return response.data;
};

const UsersAdmin = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteAsAdmin, setInviteAsAdmin] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [removeAdminConfirm, setRemoveAdminConfirm] = useState<User | null>(null);
  const [setPasswordUser, setSetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Fetch all users
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => callAdminApi("list_users"),
  });

  // Fetch admins
  const { data: adminsData, isLoading: adminsLoading, refetch: refetchAdmins } = useQuery({
    queryKey: ["admin-admins"],
    queryFn: () => callAdminApi("list_admins"),
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  // Mutations
  const addAdminMutation = useMutation({
    mutationFn: (userId: string) => callAdminApi("add_admin", { target_user_id: userId }),
    onSuccess: () => {
      toast.success("Admin role added");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeAdminMutation = useMutation({
    mutationFn: (userId: string) => callAdminApi("remove_admin", { target_user_id: userId }),
    onSuccess: () => {
      toast.success("Admin role removed");
      setRemoveAdminConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setRemoveAdminConfirm(null);
    },
  });

  const sendPasswordResetMutation = useMutation({
    mutationFn: (email: string) => callAdminApi("send_password_reset", { target_email: email }),
    onSuccess: () => {
      toast.success("Password reset email sent");
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => callAdminApi("delete_user", { target_user_id: userId }),
    onSuccess: () => {
      toast.success("User deleted");
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setDeleteConfirm(null);
    },
  });

  const setPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      callAdminApi("set_password", { target_user_id: userId, new_password: password }),
    onSuccess: () => {
      toast.success("Password updated");
      setSetPasswordUser(null);
      setNewPassword("");
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const inviteUserMutation = useMutation({
    mutationFn: () => callAdminApi("invite_user", { target_email: inviteEmail, make_admin: inviteAsAdmin }),
    onSuccess: () => {
      toast.success("Invitation sent");
      setInviteEmail("");
      setInviteAsAdmin(false);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const users: User[] = usersData?.users || [];
  const admins = adminsData?.admins || [];

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      add_admin: "Added admin role",
      remove_admin: "Removed admin role",
      set_password: "Set password manually",
      send_password_reset: "Sent password reset",
      delete_user: "Deleted user",
      invite_user: "Invited user",
    };
    return labels[action] || action;
  };

  return (
    <AdminLayout title="User Management" subtitle="Manage users, admins, and permissions">
      <div className="space-y-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              All Users
            </TabsTrigger>
            <TabsTrigger value="admins" className="gap-2">
              <Shield className="h-4 w-4" />
              Admins
            </TabsTrigger>
            <TabsTrigger value="invite" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <History className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          {/* All Users Tab */}
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>Manage all registered users</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => refetchUsers()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Sign In</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>
                            {user.first_name || user.last_name
                              ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {user.roles.length > 0 ? (
                                user.roles.map(role => (
                                  <Badge key={role} variant={role === "admin" ? "default" : "secondary"}>
                                    {role}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline">user</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {user.last_sign_in_at
                              ? format(new Date(user.last_sign_in_at), "MMM d, yyyy HH:mm")
                              : "Never"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Set password manually"
                                onClick={() => { setSetPasswordUser(user); setNewPassword(""); }}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Send password reset email"
                                onClick={() => sendPasswordResetMutation.mutate(user.email)}
                                disabled={sendPasswordResetMutation.isPending}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              {user.roles.includes("admin") ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Remove admin role"
                                  onClick={() => setRemoveAdminConfirm(user)}
                                >
                                  <ShieldMinus className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Make admin"
                                  onClick={() => addAdminMutation.mutate(user.id)}
                                  disabled={addAdminMutation.isPending}
                                >
                                  <ShieldPlus className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete user"
                                onClick={() => setDeleteConfirm(user)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admins Tab */}
          <TabsContent value="admins" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Administrators</CardTitle>
                    <CardDescription>Users with admin access</CardDescription>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => refetchAdmins()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {adminsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin: User) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.email}</TableCell>
                          <TableCell>
                            {admin.first_name || admin.last_name
                              ? `${admin.first_name || ""} ${admin.last_name || ""}`.trim()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {format(new Date(admin.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRemoveAdminConfirm(admin)}
                              disabled={removeAdminMutation.isPending}
                            >
                              <ShieldMinus className="h-4 w-4 mr-2" />
                              Remove Admin
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invite Tab */}
          <TabsContent value="invite" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Invite New User</CardTitle>
                <CardDescription>Send an invitation email to a new user</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <div className="flex gap-4 max-w-md">
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="user@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="invite-admin"
                    checked={inviteAsAdmin}
                    onCheckedChange={(checked) => setInviteAsAdmin(!!checked)}
                  />
                  <Label htmlFor="invite-admin" className="text-sm">
                    Grant admin access to this user
                  </Label>
                </div>
                <Button 
                  onClick={() => inviteUserMutation.mutate()}
                  disabled={!inviteEmail || inviteUserMutation.isPending}
                >
                  {inviteUserMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send Invitation
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>History of admin actions</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : auditLogs && auditLogs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getActionLabel(log.action)}</Badge>
                          </TableCell>
                          <TableCell>{log.target_email || log.target_user_id || "-"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {Object.keys(log.metadata || {}).length > 0
                              ? JSON.stringify(log.metadata)
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No audit logs yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteConfirm?.email}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteUserMutation.mutate(deleteConfirm.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set Password Dialog */}
      <AlertDialog open={!!setPasswordUser} onOpenChange={() => { setSetPasswordUser(null); setNewPassword(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Password</AlertDialogTitle>
            <AlertDialogDescription>
              Set a new password for <strong>{setPasswordUser?.email}</strong>. Share this password with the user through a secure channel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              type="text"
              placeholder="New password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setPasswordUser && setPasswordMutation.mutate({ userId: setPasswordUser.id, password: newPassword })}
              disabled={newPassword.length < 8 || setPasswordMutation.isPending}
            >
              {setPasswordMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Set Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Admin Confirmation Dialog */}
      <AlertDialog open={!!removeAdminConfirm} onOpenChange={() => setRemoveAdminConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin access from <strong>{removeAdminConfirm?.email}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeAdminConfirm && removeAdminMutation.mutate(removeAdminConfirm.id)}
            >
              {removeAdminMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Remove Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default UsersAdmin;
