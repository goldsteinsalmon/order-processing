import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/types";
import { ArrowLeft, Search, Check, Undo, Filter } from "lucide-react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { getNextWorkingDay } from "@/utils/dateUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ExportOrdersPage: React.FC = () => {
  const { completedOrders, updateOrder } = useData();
  const navigate = useNavigate();
  
  // Set default fromDate and toDate to the next working day
  const nextWorkingDay = getNextWorkingDay();
  const [fromDate, setFromDate] = useState<Date | undefined>(nextWorkingDay);
  const [toDate, setToDate] = useState<Date | undefined>(nextWorkingDay);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // New state for search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "not-invoiced">("all");
  
  // Handle navigation to the view page
  const handleViewExport = () => {
    if (selectedOrders.size === 0) {
      alert("Please select at least one order to export.");
      return;
    }
    
    // Navigate to the view page with selected order IDs
    navigate("/export-orders-view", { 
      state: { selectedOrderIds: Array.from(selectedOrders) } 
    });
  };
  
  // Filter orders based on search, filter mode and date range
  useEffect(() => {
    let filtered = [...completedOrders];
    
    // Apply filter mode
    if (filterMode === "not-invoiced") {
      filtered = filtered.filter(order => !order.invoiced);
    } else if (filterMode === "all" && fromDate && toDate) {
      // Apply date range only if we're not filtering by not-invoiced
      filtered = filtered.filter(order => {
        const orderDate = parseISO(order.orderDate);
        return isWithinInterval(orderDate, {
          start: startOfDay(fromDate),
          end: endOfDay(toDate)
        });
      });
    }
    
    // Apply search term
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchLower) ||
        order.customer.name.toLowerCase().includes(searchLower) ||
        (order.customer.accountNumber && order.customer.accountNumber.toLowerCase().includes(searchLower)) ||
        (order.customerOrderNumber && order.customerOrderNumber.toLowerCase().includes(searchLower))
      );
    }
    
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
  }, [fromDate, toDate, completedOrders, searchTerm, filterMode]);
  
  // Handle individual order selection
  const handleOrderSelect = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
    setSelectAll(newSelected.size === filteredOrders.length);
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
  
  // Mark selected orders as invoiced
  const handleMarkInvoiced = () => {
    if (selectedOrders.size === 0) {
      alert("Please select at least one order to mark as invoiced.");
      return;
    }
    
    // Update each selected order
    selectedOrders.forEach(id => {
      const order = completedOrders.find(o => o.id === id);
      if (order) {
        updateOrder({
          ...order,
          invoiced: true,
          invoiceDate: new Date().toISOString(),
        });
      }
    });
    
    alert(`Marked ${selectedOrders.size} orders as invoiced.`);
  };
  
  // Unmark selected orders as invoiced
  const handleUnmarkInvoiced = () => {
    if (selectedOrders.size === 0) {
      alert("Please select at least one order to unmark as invoiced.");
      return;
    }
    
    // Update each selected order
    selectedOrders.forEach(id => {
      const order = completedOrders.find(o => o.id === id);
      if (order && order.invoiced) {
        updateOrder({
          ...order,
          invoiced: false,
          invoiceDate: undefined,
          invoiceNumber: undefined,
        });
      }
    });
    
    alert(`Unmarked ${selectedOrders.size} orders as invoiced.`);
  };
  
  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/completed-orders")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">Export Orders</h2>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-4">
        {/* Search and Filter Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search bar */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search by ID, customer, account..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filter options */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Filter by</h3>
                <RadioGroup 
                  value={filterMode} 
                  onValueChange={(value) => setFilterMode(value as "all" | "not-invoiced")}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <label htmlFor="all" className="text-sm">All orders</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not-invoiced" id="not-invoiced" />
                    <label htmlFor="not-invoiced" className="text-sm">Not invoiced</label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col space-y-2">
                <Button 
                  className="w-full" 
                  onClick={handleViewExport}
                  disabled={selectedOrders.size === 0}
                >
                  View Export ({selectedOrders.size})
                </Button>
                
                <div className="flex space-x-2">
                  <Button 
                    className="flex-1" 
                    onClick={handleMarkInvoiced}
                    disabled={selectedOrders.size === 0}
                    variant="outline"
                  >
                    <Check className="mr-1 h-4 w-4" /> 
                    Mark as Invoiced
                  </Button>
                  
                  <Button 
                    onClick={handleUnmarkInvoiced}
                    disabled={selectedOrders.size === 0}
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Undo className="mr-1 h-4 w-4" /> 
                    Unmark Invoiced
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Date range - only shown when filter mode is "all" */}
            {filterMode === "all" && (
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[180px]">
                  <span className="text-sm font-medium">From</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full mt-1 justify-start text-left font-normal",
                          !fromDate && "text-muted-foreground"
                        )}
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex-1 min-w-[180px]">
                  <span className="text-sm font-medium">To</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full mt-1 justify-start text-left font-normal",
                          !toDate && "text-muted-foreground"
                        )}
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Orders Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Orders ({filteredOrders.length})</CardTitle>
          {filteredOrders.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectAll}
            >
              {selectAll ? "Deselect All" : "Select All"}
            </Button>
          )}
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
                      No orders found for the selected filters
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
                            {order.invoiceDate && (
                              <span className="text-xs text-muted-foreground mt-1">
                                {format(parseISO(order.invoiceDate), "dd/MM/yyyy")}
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
