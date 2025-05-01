
import React, { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Eye, UserPlus, Search, Package, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CustomersPage: React.FC = () => {
  const { customers } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Debug customer data
  useEffect(() => {
    console.log("Customers list:", customers);
    if (customers.length > 0) {
      console.log("Sample customer data:", customers[0]);
    }
  }, [customers]);

  // Filter and sort customers based on search term and account number
  const filteredCustomers = useMemo(() => {
    let filtered = customers;
    
    // Filter by search term if one exists
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(lowerSearch) ||
        (customer.email && customer.email.toLowerCase().includes(lowerSearch)) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.accountNumber && customer.accountNumber.toLowerCase().includes(lowerSearch))
      );
    }
    
    // Sort by account number alphabetically
    return [...filtered].sort((a, b) => {
      const accountA = a.accountNumber || '';
      const accountB = b.accountNumber || '';
      return accountA.localeCompare(accountB);
    });
  }, [customers, searchTerm]);

  // Handle duplicate customer
  const handleDuplicateCustomer = (customerId: string) => {
    const customerToDuplicate = customers.find(c => c.id === customerId);
    if (!customerToDuplicate) return;
    
    // Navigate to create customer page with state containing the customer to duplicate
    navigate("/create-customer", { 
      state: { 
        duplicateFrom: customerToDuplicate,
        isDuplicating: true 
      } 
    });
  };

  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Customers</h2>
        <Button onClick={() => navigate("/create-customer")}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>
      
      <div className="mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium">Account Number</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium w-24">Phone</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? "No matching customers found" : "No customers found"}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b">
                    <td className="px-4 py-3">{customer.accountNumber || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {customer.name}
                        {customer.needsDetailedBoxLabels && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Package className="h-4 w-4 ml-2 text-blue-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Requires detailed box labels</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{customer.email}</td>
                    <td className="px-4 py-3 w-24">{customer.phone}</td>
                    <td className="px-4 py-3">
                      {customer.onHold ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          On Hold
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/customer-details/${customer.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateCustomer(customer.id)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicate
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
    </Layout>
  );
};

export default CustomersPage;
