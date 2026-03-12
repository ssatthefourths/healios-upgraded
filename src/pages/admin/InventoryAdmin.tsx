import AdminLayout from "@/components/admin/AdminLayout";
import LowStockAlert from "@/components/admin/LowStockAlert";
import BulkStockEditor from "@/components/admin/BulkStockEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Package } from "lucide-react";

const InventoryAdmin = () => {
  return (
    <AdminLayout title="Inventory" subtitle="Monitor stock levels and manage inventory">
      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle size={16} />
            Low Stock Alerts
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Package size={16} />
            All Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <LowStockAlert showAllProducts={false} />
        </TabsContent>

        <TabsContent value="all">
          <BulkStockEditor />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default InventoryAdmin;
