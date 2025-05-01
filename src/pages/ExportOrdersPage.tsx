
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportOrdersToCsv, generateCsvFilename } from "@/utils/exportUtils";
import { Order } from "@/types";
import { ArrowLeft, Check, FileDown, Calendar } from "lucide-react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ExportOrdersPage: React.FC = () => {
  const { completedOrders, updateOrder } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  
  // Filter orders based on date range
  useEffect(() => {
    if (!fromDate || !toDate) return;
    
    const filtered = completedOrders.filter(order => {
      const orderDate = parseISO(order.orderDate);
      return isWithinInterval(orderDate, {
        start: startOfDay(fromDate),
        end: endOfDay(toDate)
      });
    });
    
    // Sort by date (newest first)
    const sorted = [...filtered].sort((a, b) => {
      const dateA = parseISO(a.orderDate);
      const dateB = parseISO(b.orderDate);
      return dateB.getTime() - dateA.getTime();
    });
    
    setFilteredOrders(sorted);
    // Clear selections when filter changes
    setSelectedOrders(new Set());
    setSelectAll(false);
  }, [fromDate, toDate, completedOrders]);
  
  // Handle individual order selection
  const handleOrderSelect = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      // Unselect all
      setSelectedOrders(new Set());
    } else {
      // Select all filtered orders
      const allIds = new Set(filteredOrders.map(order => order.id));
      setSelectedOrders(allIds);
    }
    setSelectAll(!selectAll);
  };
  
  // Export selected orders
  const handleExport = () => {
    if (selectedOrders.size === 0) {
      toast({
        title: "No orders selected",
        description: "Please select at least one order to export.",
        variant: "destructive"
      });
      return;
    }
    
    const ordersToExport = filteredOrders.filter(order => 
      selectedOrders.has(order.id)
    );
    
    exportOrdersToCsv(ordersToExport, generateCsvFilename());
    
    toast({
      title: "Export successful",
      description: `Exported ${ordersToExport.length} orders to CSV.`,
    });
  };
  
  // Mark selected orders as invoiced
  const handleMarkInvoiced = () => {
    if (selectedOrders.size === 0) {
      toast({
        title: "No orders selected",
        description: "Please select at least one order to mark as invoiced.",
        variant: "destructive"
      });
      return;
    }
    
    if (!invoiceNumber) {
      toast({
        title: "Invoice number required",
        description: "Please enter an invoice number.",
        variant: "destructive"
      });
      return;
    }
    
    // Update each selected order
    selectedOrders.forEach(id => {
      const order = completedOrders.find(o => o.id === id);
      if (order) {
        updateOrder({
          ...order,
          invoiced: true,
          invoiceNumber,
          invoiceDate: new Date().toISOString(),
        });
      }
    });
    
    toast({
      title: "Orders marked as invoiced",
      description: `Marked ${selectedOrders.size} orders as invoiced with invoice #${invoiceNumber}.`,
    });
    
    // Reset invoice number
    setInvoiceNumber("");
  };
  
  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/completed-orders")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">Export Orders</h2>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="from-date">From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fromDate && "text-muted-foreground"
                    )}
                    id="from-date"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor="to-date">To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !toDate && "text-muted-foreground"
                    )}
                    id="to-date"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
        
        {/* Export Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={handleExport}
              disabled={selectedOrders.size === 0}
            >
              <FileDown className="mr-2 h-4 w-4" /> 
              Export Selected Orders ({selectedOrders.size})
            </Button>
          </CardContent>
        </Card>
        
        {/* Invoice Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Mark as Invoiced</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="invoice-number">Invoice Number</Label>
              <Input 
                id="invoice-number" 
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Enter invoice number"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleMarkInvoiced}
              disabled={selectedOrders.size === 0 || !invoiceNumber}
            >
              <Check className="mr-2 h-4 w-4" /> 
              Mark Selected as Invoiced ({selectedOrders.size})
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectAll} 
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Account #</TableHead>
                  <TableHead>Customer Order #</TableHead>
                  <TableHead>Invoice Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No orders found for the selected date range
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={() => handleOrderSelect(order.id)}
                        />
                      </TableCell>
                      <TableCell>{order.id.substring(0, 8)}</TableCell>
                      <TableCell>{format(parseISO(order.orderDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{order.customer.name}</TableCell>
                      <TableCell>{order.customer.accountNumber || "N/A"}</TableCell>
                      <TableCell>{order.customerOrderNumber || "N/A"}</TableCell>
                      <TableCell>
                        {order.invoiced ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Invoiced
                            </span>
                            {order.invoiceNumber && (
                              <span className="text-xs text-muted-foreground mt-1">
                                #{order.invoiceNumber}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Not Invoiced
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default ExportOrdersPage;
