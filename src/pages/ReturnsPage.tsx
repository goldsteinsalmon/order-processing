
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
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const ReturnsPage: React.FC = () => {
  const { returns, complaints } = useData();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Combine returns and complaints into a single array and sort by date
  const allItems = [
    ...returns.map(item => ({ ...item, type: 'return', date: item.dateReturned })),
    ...complaints.map(item => ({ ...item, type: 'complaint', date: item.dateSubmitted }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Filter items based on search term
  const filteredItems = allItems.filter(item => 
    item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.productSku || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.type === "return" ? ((item as any).reason || "").toLowerCase() : ((item as any).complaintType || "").toLowerCase()).includes(searchTerm.toLowerCase())
  );
  
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
        <Card>
          <CardHeader>
            <CardTitle>Returns & Complaints List</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search input */}
            <div className="mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search returns & complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No returns or complaints found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{format(parseISO(item.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                            item.type === "return" 
                              ? "bg-amber-100 text-amber-800" 
                              : "bg-purple-100 text-purple-800"
                          }`}>
                            {item.type === "return" ? "Return" : "Complaint"}
                          </span>
                        </TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{item.product?.name || item.productSku || "N/A"}</TableCell>
                        <TableCell>
                          {item.type === "return" 
                            ? `Qty: ${(item as any).quantity || 1} - ${(item as any).reason || "Not specified"}` 
                            : (item as any).complaintType || "Not specified"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                            item.resolutionStatus === "Resolved" 
                              ? "bg-green-100 text-green-800" 
                              : item.resolutionStatus === "In Progress" 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-amber-100 text-amber-800"
                          }`}>
                            {item.resolutionStatus}
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
      )}
    </Layout>
  );
};

export default ReturnsPage;
