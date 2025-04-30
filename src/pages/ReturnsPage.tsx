
import React, { useState } from "react";
import Layout from "@/components/Layout";
import ReturnsComplaintsForm from "@/components/returns/ReturnsComplaintsForm";
import { useData } from "@/context/DataContext";
import { format, parseISO } from "date-fns";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ReturnsPage: React.FC = () => {
  const { returns, complaints } = useData();
  const [showForm, setShowForm] = useState(false);
  
  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Returns & Complaints</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            Record New Return/Complaint
          </Button>
        )}
      </div>
      
      {showForm ? (
        <>
          <Button 
            variant="outline" 
            className="mb-4" 
            onClick={() => setShowForm(false)}
          >
            Back to List
          </Button>
          <ReturnsComplaintsForm />
        </>
      ) : (
        <Tabs defaultValue="returns">
          <TabsList className="mb-4">
            <TabsTrigger value="returns">Returns</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
          </TabsList>
          
          <TabsContent value="returns">
            <Card>
              <CardHeader>
                <CardTitle>Returns List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No returns recorded
                          </TableCell>
                        </TableRow>
                      ) : (
                        returns
                          .sort((a, b) => new Date(b.dateReturned).getTime() - new Date(a.dateReturned).getTime())
                          .map((returnItem) => (
                            <TableRow key={returnItem.id}>
                              <TableCell>{format(parseISO(returnItem.dateReturned), "dd/MM/yyyy")}</TableCell>
                              <TableCell>{returnItem.customerName}</TableCell>
                              <TableCell>{returnItem.product?.name || returnItem.productSku}</TableCell>
                              <TableCell>{returnItem.quantity || 1}</TableCell>
                              <TableCell>{returnItem.reason || "Not specified"}</TableCell>
                              <TableCell>
                                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                  returnItem.resolutionStatus === "Resolved" 
                                    ? "bg-green-100 text-green-800" 
                                    : returnItem.resolutionStatus === "In Progress" 
                                      ? "bg-blue-100 text-blue-800" 
                                      : "bg-amber-100 text-amber-800"
                                }`}>
                                  {returnItem.resolutionStatus}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="complaints">
            <Card>
              <CardHeader>
                <CardTitle>Complaints List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complaints.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            No complaints recorded
                          </TableCell>
                        </TableRow>
                      ) : (
                        complaints
                          .sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime())
                          .map((complaint) => (
                            <TableRow key={complaint.id}>
                              <TableCell>{format(parseISO(complaint.dateSubmitted), "dd/MM/yyyy")}</TableCell>
                              <TableCell>{complaint.customerName}</TableCell>
                              <TableCell>{complaint.complaintType}</TableCell>
                              <TableCell>{complaint.product?.name || (complaint.productSku ? complaint.productSku : "N/A")}</TableCell>
                              <TableCell>
                                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                  complaint.resolutionStatus === "Resolved" 
                                    ? "bg-green-100 text-green-800" 
                                    : complaint.resolutionStatus === "In Progress" 
                                      ? "bg-blue-100 text-blue-800" 
                                      : "bg-amber-100 text-amber-800"
                                }`}>
                                  {complaint.resolutionStatus}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </Layout>
  );
};

export default ReturnsPage;
