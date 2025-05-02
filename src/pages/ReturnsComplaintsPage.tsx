
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

const ReturnsComplaintsPage: React.FC = () => {
  const { returns, complaints } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("returns");

  // Filter returns based on search term
  const filteredReturns = returns.filter(
    (item) =>
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.productSku && item.productSku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.orderNumber && item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter complaints based on search term
  const filteredComplaints = complaints.filter(
    (item) =>
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.productSku && item.productSku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.orderNumber && item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800";
      case "In Progress":
        return "bg-amber-100 text-amber-800";
      case "Resolved":
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Returns & Complaints</h2>
        <div className="space-x-2">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> New Return
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> New Complaint
          </Button>
        </div>
      </div>
      
      <div className="flex items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, product, or order..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      <Tabs
        defaultValue="returns"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="returns">
            Returns
          </TabsTrigger>
          <TabsTrigger value="complaints">
            Complaints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="returns" className="space-y-4">
          {filteredReturns.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No returns match your search."
                    : "No returns have been recorded yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReturns.map((returnItem) => (
              <Card key={returnItem.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between">
                    <span>{returnItem.customerName}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        returnItem.resolutionStatus
                      )}`}
                    >
                      {returnItem.resolutionStatus}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium">Return Details</p>
                      <p className="text-sm text-muted-foreground">
                        Date: {format(new Date(returnItem.dateReturned), "MMM dd, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Product: {returnItem.productSku}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {returnItem.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Order Information</p>
                      <p className="text-sm text-muted-foreground">
                        Order: {returnItem.orderNumber || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Invoice: {returnItem.invoiceNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Return Status</p>
                      <p className="text-sm text-muted-foreground">
                        Return Required: {returnItem.returnsRequired}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {returnItem.returnStatus}
                      </p>
                    </div>
                    {returnItem.reason && (
                      <div className="md:col-span-3">
                        <p className="text-sm font-medium">Reason</p>
                        <p className="text-sm text-muted-foreground">
                          {returnItem.reason}
                        </p>
                      </div>
                    )}
                    {returnItem.resolutionNotes && (
                      <div className="md:col-span-3">
                        <p className="text-sm font-medium">Resolution Notes</p>
                        <p className="text-sm text-muted-foreground">
                          {returnItem.resolutionNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="complaints" className="space-y-4">
          {filteredComplaints.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No complaints match your search."
                    : "No complaints have been recorded yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredComplaints.map((complaint) => (
              <Card key={complaint.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between">
                    <span>{complaint.customerName}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        complaint.resolutionStatus
                      )}`}
                    >
                      {complaint.resolutionStatus}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium">Complaint Details</p>
                      <p className="text-sm text-muted-foreground">
                        Date: {format(new Date(complaint.dateSubmitted), "MMM dd, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Type: {complaint.complaintType}
                      </p>
                      {complaint.productSku && (
                        <p className="text-sm text-muted-foreground">
                          Product: {complaint.productSku}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Order Information</p>
                      <p className="text-sm text-muted-foreground">
                        Order: {complaint.orderNumber || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Invoice: {complaint.invoiceNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm text-muted-foreground">
                        Return Required: {complaint.returnsRequired}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Return Status: {complaint.returnStatus}
                      </p>
                    </div>
                    <div className="md:col-span-3">
                      <p className="text-sm font-medium">Complaint Details</p>
                      <p className="text-sm text-muted-foreground">
                        {complaint.complaintDetails}
                      </p>
                    </div>
                    {complaint.resolutionNotes && (
                      <div className="md:col-span-3">
                        <p className="text-sm font-medium">Resolution Notes</p>
                        <p className="text-sm text-muted-foreground">
                          {complaint.resolutionNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default ReturnsComplaintsPage;
