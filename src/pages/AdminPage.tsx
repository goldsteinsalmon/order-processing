
import React from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "@/components/admin/UserManagement";
import PickerManagement from "@/components/admin/PickerManagement";
import StandingOrderProcessor from "@/components/admin/StandingOrderProcessor";

const AdminPage: React.FC = () => {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Admin</h1>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full max-w-md mb-6 grid grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="pickers">Pickers</TabsTrigger>
            <TabsTrigger value="processor">Processor</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          <TabsContent value="pickers">
            <PickerManagement />
          </TabsContent>
          <TabsContent value="processor">
            <StandingOrderProcessor />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPage;
