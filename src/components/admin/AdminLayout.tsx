import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import AdminSidebar from "./AdminSidebar";
import SessionTimeoutWarning from "./SessionTimeoutWarning";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Session timeout for admin security (30 min timeout, 5 min warning)
  const { showWarning, formattedTime, extendSession, logout } = useSessionTimeout({
    timeoutMinutes: 30,
    warningMinutes: 5,
    enabled: isAdmin,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (user.role !== 'admin') {
      toast.error("You don't have admin access");
      navigate("/");
      return;
    }
    setIsAdmin(true);
    setCheckingAdmin(false);
  }, [user, authLoading, navigate]);

  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Session Timeout Warning Dialog */}
      <SessionTimeoutWarning
        open={showWarning}
        formattedTime={formattedTime}
        onExtendSession={extendSession}
        onLogout={logout}
      />

      <Header />

      <div className="flex flex-1">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <AdminSidebar 
            collapsed={sidebarCollapsed} 
            onCollapse={setSidebarCollapsed} 
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 md:p-6 lg:p-8">
            {(title || subtitle) && (
              <div className="mb-6">
                {title && <h1 className="text-2xl font-semibold text-foreground">{title}</h1>}
                {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AdminLayout;
