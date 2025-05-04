
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersTab from "@/components/admin/UsersTab";
import PickersTab from "@/components/admin/PickersTab";
import SettingsTab from "@/components/admin/SettingsTab";
import BackupTab from "@/components/admin/BackupTab";
import SyncTab from "@/components/admin/SyncTab";

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("users");
  
  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="pickers">Pickers</TabsTrigger>
          <TabsTrigger value="sync">Synchronization</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        
        <TabsContent value="pickers">
          <PickersTab />
        </TabsContent>
        
        <TabsContent value="sync">
          <SyncTab />
        </TabsContent>
        
        <TabsContent value="backup">
          <BackupTab />
        </TabsContent>
        
        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default AdminPage;
