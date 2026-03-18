import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AdminRoute = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setCheckingRole(false);
      return;
    }

    // Role is returned by /auth/verify and /auth/signin in the worker
    setIsAdmin(user.role === 'admin');
    setCheckingRole(false);
  }, [user, authLoading]);

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    toast({
      title: "Access denied",
      description: "You do not have admin privileges.",
      variant: "destructive",
    });
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
