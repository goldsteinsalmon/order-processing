
import React from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "@/components/admin/UserManagement";
import PickerManagement from "@/components/admin/PickerManagement";
import StandingOrderProcessor from "@/components/admin/StandingOrderProcessor";
import BackupManagement from "@/components/admin/BackupManagement";
import ImportManagement from "@/components/admin/ImportManagement";
import NonWorkingDaysManagement from "@/components/admin/NonWorkingDaysManagement";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdminPage: React.FC = () => {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Admin</h1>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full max-w-md mb-6 grid grid-cols-7">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="pickers">Pickers</TabsTrigger>
            <TabsTrigger value="processor" className="flex flex-col leading-tight">
              <span>S/O</span>
              <span>Processor</span>
            </TabsTrigger>
            <TabsTrigger value="non-working-days" className="flex flex-col leading-tight">
              <span>Non-Working</span>
              <span>Days</span>
            </TabsTrigger>
            <TabsTrigger value="migrations" className="flex flex-col leading-tight">
              <span>DB</span>
              <span>Migrations</span>
            </TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
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
          <TabsContent value="non-working-days">
            <NonWorkingDaysManagement />
          </TabsContent>
          <TabsContent value="migrations">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Database Migrations</h2>
              <p className="mb-4">Manage database migrations and sequence updates.</p>
              <Button asChild>
                <Link to="/admin/migrations">
                  Go to Migrations Page
                </Link>
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="backup">
            <BackupManagement />
          </TabsContent>
          <TabsContent value="import">
            <ImportManagement />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPage;
