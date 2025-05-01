import React, { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Calendar, FilePlus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const StandingOrdersPage: React.FC = () => {
  const { standingOrders, customers, products } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Advanced search
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Product search
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Filter customers
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];
    
    if (customerSearch.trim()) {
      const lowerSearch = customerSearch.toLowerCase();
      filtered = customers.filter(customer => {
        const nameMatch = customer.name.toLowerCase().includes(lowerSearch);
        const emailMatch = customer.email ? customer.email.toLowerCase().includes(lowerSearch) : false;
        const phoneMatch = customer.phone ? customer.phone.includes(customerSearch) : false;
        const accountMatch = customer.accountNumber ? customer.accountNumber.toLowerCase().includes(lowerSearch) : false;
        
        return nameMatch || emailMatch || phoneMatch || accountMatch;
      });
    }
    
    // Sort by account number alphabetically
    return filtered.sort((a, b) => {
      const accountA = a.accountNumber || '';
      const accountB = b.accountNumber || '';
      return accountA.localeCompare(accountB);
    });
  }, [customers, customerSearch]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    if (productSearch.trim()) {
      const lowerSearch = productSearch.toLowerCase();
      filtered = products.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(lowerSearch);
        const skuMatch = product.sku.toLowerCase().includes(lowerSearch);
        
        return nameMatch || skuMatch;
      });
    }
    
    // Sort by SKU alphabetically
    return filtered.sort((a, b) => a.sku.localeCompare(b.sku));
  }, [products, productSearch]);

  // Get selected customer name
  const getSelectedCustomerName = () => {
    if (!selectedCustomerId) return null;
    const customer = customers.find(c => c.id === selectedCustomerId);
    return customer ? customer.name : null;
  };

  // Get selected product name
  const getSelectedProductName = () => {
    if (!selectedProductId) return null;
    const product = products.find(p => p.id === selectedProductId);
    return product ? `${product.name} (${product.sku})` : null;
  };

  // Handle customer selection
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowCustomerSearch(false);
  };

  // Handle product selection
  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setShowProductSearch(false);
  };

  // Reset filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCustomerId(null);
    setSelectedProductId(null);
  };

  // Filter standing orders based on search term, selected customer, and selected product
  const filteredStandingOrders = useMemo(() => {
    let filtered = standingOrders;
    
    // Filter by selected customer
    if (selectedCustomerId) {
      filtered = filtered.filter(order => order.customer_id === selectedCustomerId);
    }
    
    // Filter by selected product
    if (selectedProductId) {
      filtered = filtered.filter(order => 
        order.items.some(item => item.product_id === selectedProductId)
      );
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.customer.name.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower) ||
        (order.customer_order_number?.toLowerCase().includes(searchLower) || false) ||
        order.schedule.frequency.toLowerCase().includes(searchLower) ||
        order.schedule.deliveryMethod.toLowerCase().includes(searchLower) ||
        order.items.some(item => 
          item.product.name.toLowerCase().includes(searchLower) ||
          item.product.sku.toLowerCase().includes(searchLower)
        )
      );
    }
    
    return filtered;
  }, [standingOrders, searchTerm, selectedCustomerId, selectedProductId]);

  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Standing Orders</h2>
        <Button onClick={() => navigate("/create-standing-order")}>
          <FilePlus className="mr-2 h-4 w-4" /> Create Standing Order
        </Button>
      </div>
      
      {/* Search and filter section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search input */}
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search standing orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {/* Customer filter */}
          <div>
            <Button 
              variant={selectedCustomerId ? "default" : "outline"} 
              onClick={() => setShowCustomerSearch(true)}
              className="w-full md:w-auto"
            >
              {selectedCustomerId ? `Customer: ${getSelectedCustomerName()}` : "Filter by Customer"}
            </Button>
          </div>
          
          {/* Product filter (new) */}
          <div>
            <Button 
              variant={selectedProductId ? "default" : "outline"} 
              onClick={() => setShowProductSearch(true)}
              className="w-full md:w-auto"
            >
              {selectedProductId ? `Product: ${getSelectedProductName()}` : "Filter by Product"}
            </Button>
          </div>
          
          {/* Clear filters button - only show if there are any filters applied */}
          {(selectedCustomerId || selectedProductId || searchTerm) && (
            <div>
              <Button 
                variant="ghost" 
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Standing orders table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Frequency</th>
                <th className="px-4 py-3 text-left font-medium">Delivery Method</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStandingOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No standing orders found
                  </td>
                </tr>
              ) : (
                filteredStandingOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="px-4 py-3">{order.id.substring(0, 8)}</td>
                    <td className="px-4 py-3">{order.customer.name}</td>
                    <td className="px-4 py-3">{order.schedule.frequency}</td>
                    <td className="px-4 py-3">{order.schedule.deliveryMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {order.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {format(parseISO(order.created), "dd/MM/yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/standing-order-details/${order.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/edit-standing-order/${order.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/standing-order-schedule/${order.id}`)}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Customer Search Dialog */}
      <CommandDialog open={showCustomerSearch} onOpenChange={setShowCustomerSearch}>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <CommandInput 
            placeholder="Search customers by name, email, phone or account..."
            value={customerSearch}
            onValueChange={setCustomerSearch}
            autoFocus={true}
            className="pl-8"
          />
        </div>
        <CommandList>
          <CommandEmpty>No customers found.</CommandEmpty>
          <CommandGroup heading="Customers">
            {filteredCustomers.map(customer => (
              <CommandItem 
                key={customer.id} 
                value={customer.name}
                onSelect={() => handleSelectCustomer(customer.id)}
              >
                {customer.name}
                {customer.accountNumber && <span className="ml-2 text-muted-foreground">({customer.accountNumber})</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      
      {/* Product Search Dialog (new) */}
      <CommandDialog open={showProductSearch} onOpenChange={setShowProductSearch}>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <CommandInput 
            placeholder="Search products by name or SKU..."
            value={productSearch}
            onValueChange={setProductSearch}
            autoFocus={true}
            className="pl-8"
          />
        </div>
        <CommandList>
          <CommandEmpty>No products found.</CommandEmpty>
          <CommandGroup heading="Products">
            {filteredProducts.map(product => (
              <CommandItem 
                key={product.id} 
                value={`${product.name} ${product.sku}`}
                onSelect={() => handleSelectProduct(product.id)}
              >
                <span>{product.name}</span>
                <span className="ml-2 text-muted-foreground">({product.sku})</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </Layout>
  );
};

export default StandingOrdersPage;
